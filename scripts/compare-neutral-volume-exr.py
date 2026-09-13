"""Read actual scene-linear diagnostic EXRs and compare identical native patches."""
import bpy,json,hashlib,math,argparse,sys
from pathlib import Path
from array import array
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();mode=p.add_mutually_exclusive_group();mode.add_argument('--unified',action='store_true');mode.add_argument('--contact',action='store_true');args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
prefix='contact-' if args.contact else 'unified-' if args.unified else ''
if args.contact:
    paths=[P/f'qa/evidence/blender/negroni-express-hero-v012-contact-neutral-{label}.exr' for label in ['d0','d0p55']]
    paths.extend(P/f'qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-unified-{label}.exr' for label in ['zero','d055'])
else:
    paths=[P/f'qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-{prefix}{label}.exr' for label in ['zero','d055']]
    if args.unified:paths.append(P/'qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-zero.exr')
data=[];sources=[]
for path in paths:
    image=bpy.data.images.load(str(path),check_existing=False)
    values=array('f',[0])*len(image.pixels);image.pixels.foreach_get(values)
    sources.append(dict(path=str(path.relative_to(P)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),size=list(image.size),channels=image.channels,colorSpace=image.colorspace_settings.name,isFloat=image.is_float))
    data.append((list(image.size),image.channels,values))
assert sources[0]['size']==sources[1]['size']
audit_path=P/('qa/evidence/blender/v012-contact-hero-optical-path-lengths.json' if args.contact else 'qa/evidence/blender/v012-hero-optical-path-lengths.json');audit=json.loads(audit_path.read_text());rows={}
for name,region in audit['regions'].items():
    cx,cy=region['cropPixelCenter'];means=[];extrema=[]
    for (width,height),channels,values in data:
        pixels=[[values[((height-1-y)*width+x)*channels+c] for c in range(3)] for y in range(cy-5,cy+6) for x in range(cx-5,cx+6)]
        assert all(math.isfinite(value) for pixel in pixels for value in pixel)
        means.append([sum(pixel[c] for pixel in pixels)/len(pixels) for c in range(3)])
        extrema.append([[min(pixel[c] for pixel in pixels),max(pixel[c] for pixel in pixels)] for c in range(3)])
    rows[name]=dict(cropPixelCenter=[cx,cy],patchSize=[11,11],zeroLinearMean=means[0],density055LinearMean=means[1],radianceMeanRatio=[b/a if a else None for a,b in zip(means[0],means[1])],channelRanges=extrema,cpuGeometricNeutralPrediction=region['neutralTerminalTransmission']['0.55'])
    if args.unified:rows[name].update(previousTwoShaderZeroLinearMean=means[2],unifiedOverPreviousZeroRatio=[b/a if a else None for a,b in zip(means[2],means[0])])
    if args.contact:rows[name].update(airGapZeroLinearMean=means[2],airGapDensity055LinearMean=means[3],airGapRadianceMeanRatio=[b/a if a else None for a,b in zip(means[2],means[3])],contactOverAirGapZeroRatio=[b/a if a else None for a,b in zip(means[2],means[0])])
report=dict(sources=sources,method='Actual decoded float EXR values; identical11x11 native image patches, no resizing, tone mapping or exposure transform. Ratio is mean treated radiance / mean zero-control radiance per channel.',pathAudit=str(audit_path.relative_to(P)),pathAuditSha256=hashlib.sha256(audit_path.read_bytes()).hexdigest(),regions=rows,limitations='Rendered scenes retain authored roughness, shading normals, glass/ice surface tint and denoising. CPU paths use geometric normals and equal terminal weighting, omitting those effects and Cycles volume-stack handling; numeric agreement is not assumed. This is an optical diagnostic, not photographic acceptance.')
report['unifiedLiquidShader']=args.unified or args.contact
report['trueGlassLiquidContact']=args.contact
out=P/f'qa/evidence/blender/v012-{prefix}neutral-emission-linear-comparison.json';out.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
