"""Measure actual linear photo radiance for the world-strength-only treatment."""
from pathlib import Path
from array import array
import bpy,json,math,hashlib,argparse,sys
P=Path(__file__).resolve().parents[1];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
p=argparse.ArgumentParser();p.add_argument('--directional',action='store_true');args=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
paths=[P/f'qa/evidence/blender/negroni-express-photo-v012-contact-source-d3p5-white-coaster{suffix}.exr' for suffix in (['','-directional-world-v1','-world4'] if args.directional else ['','-world4'])]
records=[json.loads(path.with_suffix('.render.json').read_text()) for path in paths]
assert all(r['render']['completed'] for r in records)
for key in ['sourceSha256','sourceStageSha256']:assert records[0][key]==records[1][key]
for key in ['lights','worldColor']:assert records[0]['lighting'][key]==records[1]['lighting'][key]
assert records[1]['lighting']['worldStrength']==records[0]['lighting']['worldStrength']*(1 if args.directional else 4)
if args.directional:assert records[1]['lighting']['worldStrengthIsLinked'] and records[1]['treatment']['directionalEnvironment']['allRayTypesShareOneWorldGraph']
for key in ['density','linearAbsorptionColor','liquidMaterialCount','faceIORCounts','coaster']:assert records[0]['treatment'][key]==records[1]['treatment'][key]
for key in ['cameraMatrix','lens','baseResolution','crop','samples','seed','denoise','maxBounces','transmissionBounces','volumeBounces','viewTransform','look','exposure','gamma']:assert records[0]['render'][key]==records[1]['render'][key],key
sources=[];data=[]
for path in paths:
    image=bpy.data.images.load(str(path),check_existing=False);values=array('f',[0])*len(image.pixels);image.pixels.foreach_get(values);assert image.is_float
    data.append((tuple(image.size),image.channels,values));sources.append({'path':str(path.relative_to(P)),'sha256':sha(path),'size':list(image.size),'colorSpace':image.colorspace_settings.name})
assert data[0][0]==data[1][0]
patches={'exposed_ice':[350,400],'horizontal_band':[350,501],'lower_liquid':[350,551],'glass_base':[350,597],'coaster':[474,640],'counter':[580,740]}
rows={}
for name,(cx,cy) in patches.items():
    means=[]
    for (width,height),channels,values in data:
        pixels=[[values[((height-1-y)*width+x)*channels+c] for c in range(3)] for y in range(cy-5,cy+6) for x in range(cx-5,cx+6)]
        assert all(math.isfinite(value) for pixel in pixels for value in pixel)
        means.append([sum(pixel[c] for pixel in pixels)/len(pixels) for c in range(3)])
    rows[name]={'cropPixelCenter':[cx,cy],'patchSize':[11,11],'originalLinearMean':means[0],'treatmentLinearMean':means[1],'treatmentOverOriginalRadianceRatio':[b/a if a else None for a,b in zip(means[0],means[1])]}
    if args.directional:rows[name].update(world4LinearMean=means[2],world4OverOriginalRadianceRatio=[b/a if a else None for a,b in zip(means[0],means[2])],directionalOverWorld4RadianceRatio=[b/a if a else None for a,b in zip(means[2],means[1])])
report={'sources':sources,'method':'Unchanged 11×11 native photo patches decoded from actual scene-linear EXR. No display transform or normalization.','recordedControlledSettingsMatchExceptWorldStrength':True,'worldStrengthBefore':records[0]['lighting']['worldStrength'],'worldStrengthAfter':records[1]['lighting']['worldStrength'],'regions':rows,'scriptSha256':sha(Path(__file__)),'limitations':'Linear patch gains are controlled scene radiance changes, not photographic color-fidelity scores. Camera paths, rough reflections, indirect illumination and direct-light paths all contribute. Darker/lighter terminal objects must be distinguished using separate geometry endpoint analysis; no prediction of exact rendered RGB from geometric paths is claimed.'}
report['treatment']='One inferred broad directional world region' if args.directional else 'Uniform world strength ×4'
report['recordedControlledSettingsMatchExceptWorldStrength']=not args.directional
report['recordedControlledSettingsMatchExceptWorldDistribution']=args.directional
if args.directional:report['directionalConfig']=records[1]['treatment']['directionalEnvironment']
out=P/('qa/evidence/blender/v012-contact-directional-world-linear-comparison.json' if args.directional else 'qa/evidence/blender/v012-contact-world4-linear-comparison.json');out.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
