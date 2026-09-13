"""Measure fixed scene-linear patches in the passive coaster isolation."""
from pathlib import Path
from array import array
import bpy,json,math,hashlib
P=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
patches={'hero':{'exposed_ice':[300,260],'central_liquid':[300,337],'horizontal_band':[300,384],'lower_liquid':[300,414],'glass_base':[300,471],'coaster':[450,480]},'photo':{'exposed_ice':[350,400],'horizontal_band':[350,501],'lower_liquid':[350,551],'glass_base':[350,597],'coaster':[474,640]}}
report={'method':'Unchanged 11×11 native patches from actual decoded scene-linear EXR. Ratio is mean white-coaster radiance / mean original-coaster radiance; no display transform. Geometry/density/light/exposure settings are held fixed by the recorded experiment.','views':{},'scriptSha256':sha(Path(__file__))}
for view,regions in patches.items():
    paths=[P/f'qa/evidence/blender/negroni-express-{view}-v012-contact-source-d3p5{suffix}.exr' for suffix in ['','-white-coaster']]
    records=[json.loads(path.with_suffix('.render.json').read_text()) for path in paths]
    assert all(r['render']['completed'] for r in records)
    assert records[0]['sourceSha256']==records[1]['sourceSha256']
    assert records[0]['sourceStageSha256']==records[1]['sourceStageSha256']
    assert records[0]['lighting']==records[1]['lighting']
    for key in ['density','linearAbsorptionColor','liquidMaterialCount','faceIORCounts']:assert records[0]['treatment'][key]==records[1]['treatment'][key]
    for key in ['cameraMatrix','lens','baseResolution','crop','samples','seed','denoise','maxBounces','transmissionBounces','volumeBounces','viewTransform','look','exposure','gamma']:assert records[0]['render'][key]==records[1]['render'][key],key
    data=[];sources=[]
    for path in paths:
        image=bpy.data.images.load(str(path),check_existing=False);values=array('f',[0])*len(image.pixels);image.pixels.foreach_get(values)
        assert image.is_float
        data.append((tuple(image.size),image.channels,values));sources.append({'path':str(path.relative_to(P)),'sha256':sha(path),'size':list(image.size),'colorSpace':image.colorspace_settings.name})
    assert data[0][0]==data[1][0]
    rows={}
    for name,(cx,cy) in regions.items():
        means=[]
        for (width,height),channels,values in data:
            pixels=[[values[((height-1-y)*width+x)*channels+c] for c in range(3)] for y in range(cy-5,cy+6) for x in range(cx-5,cx+6)]
            assert all(math.isfinite(value) for pixel in pixels for value in pixel)
            means.append([sum(pixel[c] for pixel in pixels)/len(pixels) for c in range(3)])
        rows[name]={'cropPixelCenter':[cx,cy],'patchSize':[11,11],'originalLinearMean':means[0],'whiteLinearMean':means[1],'whiteOverOriginalRadianceRatio':[b/a if a else None for a,b in zip(means[0],means[1])]}
    report['views'][view]={'sources':sources,'recordedControlledSettingsMatch':True,'treatment':records[1]['treatment']['coaster'],'regions':rows}
report['limitations']='Passive-white control isolates diffuse coaster color, not exact printed artwork or photographic material recovery. Authored roughness and all other optical/lighting effects remain. Radiance gain is not a reference color-fidelity metric.'
report['patchSelectionCorrection']='Initial hero coaster center (434,514) was visually checked and found below the coaster edge on the counter. It is preserved in v012-contact-white-coaster-initial-patch-selection.json, replaced by (450,480) within the coaster, and not used as coaster evidence. The hero band center (300,384) is added explicitly.'
out=P/'qa/evidence/blender/v012-contact-white-coaster-linear-comparison.json';out.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
