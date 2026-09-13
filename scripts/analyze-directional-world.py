"""Evaluate one fixed physical environment candidate against recorded ray directions."""
from pathlib import Path
import json,math,hashlib,importlib.util
P=Path(__file__).resolve().parents[1];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
spec=importlib.util.spec_from_file_location('directional_world',P/'scripts/directional-world.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
config_path=P/'assets/blender/experiments/somma-directional-world-v1.json';config=json.loads(config_path.read_text());basis=module.basis(config)
rows={};sources=[]
for view in ['hero','photo']:
    path=P/f'qa/evidence/blender/v012-contact-{view}-directional-radiance.json';data=json.loads(path.read_text());sources.append({'path':str(path.relative_to(P)),'sha256':sha(path),'actualWorld':data['world']});rows[view]={}
    for name,r in data['regions'].items():
        raw=r['environment']['rawEnvironmentPaths'];den=[sum(row[7+c] for row in raw) for c in range(3)];num=[sum(row[7+c]*module.multiplier(row[:3],config) for row in raw) for c in range(3)]
        q=r['environment']['elevationQuantiles'];d=r['environment']['normalizedWeightMeanDirection']
        rows[view][name]={'sampleCount':r['sampleCount'],'terminalCounts':r['terminalCounts'],'environmentSamplesUsed':len(raw),'mediumErrors':r['wrongIncomingCount'],'invalidEnvironmentPathsExcluded':r.get('environmentInvalidPathsExcluded',0),'normalizedWeightMeanDirection':d,'meanDirectionAzimuthDegrees':math.degrees(math.atan2(d[1],d[0])) if d else None,'elevationQuantiles':q,'conditionalEnvironmentTransmissionWeightedGainRGB':[x/y if y else None for x,y in zip(num,den)],'meaning':'Gain applies only to the environment-terminal contribution under geometric paths and density3.5, not total pixel radiance. Floor/coaster/direct-light and roughness contributions are excluded.'}
def irradiance(naz,nel):
    numerator=denominator=0
    for j in range(nel):
        elev=(j+.5)*math.pi/(2*nel)
        for i in range(naz):
            az=(i+.5)*2*math.pi/naz;d=[math.cos(elev)*math.cos(az),math.cos(elev)*math.sin(az),math.sin(elev)];w=math.sin(elev)*math.cos(elev)
            denominator+=w;numerator+=w*module.multiplier(d,config)
    return numerator/denominator
coarse=irradiance(360,90);fine=irradiance(720,180)
report={'sources':sources,'configPath':str(config_path.relative_to(P)),'configSha256':sha(config_path),'candidate':config,'basis':basis,'views':rows,'upwardLambertianWorldIrradiance':{'directionalOverOriginal':fine,'uniformWorld4OverOriginal':4,'coarseQuadrature':coarse,'fineQuadrature':fine,'refinementAbsoluteDifference':abs(coarse-fine),'method':'Midpoint quadrature of integral L(d)*max(d.z,0)dOmega over the upper hemisphere, normalized by original constant-world irradiance. Exact unoccluded Lambertian plane response to this world only; no scene occlusion, rough specular term, direct emitters, caustics or multi-bounce transport.'},'physicalRepresentation':'One positive continuous world-radiance graph, same for every camera and every ray type. Original constant world remains underneath. No Light Path nodes, camera visibility masks, per-camera source pose, alpha tricks or cocktail imagery.','status':'CPU prepared; no candidate rendering or photographic pass.','scriptSha256':sha(Path(__file__))}
out=P/'qa/evidence/blender/v012-directional-world-cpu-analysis.json';out.write_text(json.dumps(report,indent=2));print(json.dumps({'output':str(out.relative_to(P)),'groundIrradianceGain':fine,'basis':basis,'views':rows},indent=2))
