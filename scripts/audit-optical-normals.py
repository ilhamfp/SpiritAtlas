"""CPU-only measurements of authored optical geometry and interpolated shading normals.
Does not mutate/save production scenes. Measures geometry, not final image fidelity.
"""
import bpy, json, math, hashlib
from pathlib import Path
from mathutils import Vector
P = Path(__file__).resolve().parents[1]
import argparse,sys
parser=argparse.ArgumentParser();parser.add_argument('--source-tag',default='');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
SOURCE=P/'assets/blender'/('candidates/'+args.source_tag if args.source_tag else '')
RUNTIME=P/'public/models'/('candidates/'+args.source_tag if args.source_tag else '')


def percentile(values, q):
    s=sorted(values)
    return s[min(len(s)-1,round((len(s)-1)*q))] if s else None
def stats(values):
    return dict(count=len(values),min=min(values) if values else None,median=percentile(values,.5),p95=percentile(values,.95),max=max(values) if values else None)
def angle(a,b): return math.degrees(a.angle(b))
def normal(ob, loop): return Vector(ob.data.corner_normals[loop].vector)

report=[]
for drink in ['bbf-negroni','ichigo-negroni','negroni-express']:
    path=SOURCE/f'{drink}.blend';bpy.ops.wm.open_mainfile(filepath=str(path))
    manifest=json.loads(path.with_suffix('.json').read_text());c=manifest['parameters']
    ice=bpy.data.objects['ice'];m=ice.data;half=c.get('ice_height',c['ice'])/2
    core=[v for v in m.vertices if v.co.z>half-.025 and abs(v.co.x)<c['ice']/2-.12 and abs(v.co.y)<c['ice']/2-.12]
    top_z=[v.co.z-half for v in core]
    topfaces=[p for p in m.polygons if p.center.z>half-.025 and abs(p.center.x)<c['ice']/2-.12 and abs(p.center.y)<c['ice']/2-.12]
    topangles=[angle(p.normal,Vector((0,0,1))) for p in topfaces]
    topshading=[angle(normal(ice,k),Vector((0,0,1))) for p in topfaces for k in p.loop_indices]
    sidefaces=[p for p in m.polygons if abs(p.center.z)<half-.16 and ((abs(p.center.x)>c['ice']/2-.002 and abs(p.center.y)<c['ice']/2-.12) or (abs(p.center.y)>c['ice']/2-.002 and abs(p.center.x)<c['ice']/2-.12))]
    sideangles=[]
    for poly in sidefaces:
        axis=max(range(2),key=lambda i:abs(poly.center[i]));expected=Vector((0,0,0));expected[axis]=1 if poly.center[axis]>0 else -1
        sideangles.extend(angle(normal(ice,k),expected) for k in poly.loop_indices)
    bases={}
    for name in ['glass','liquid']:
        ob=bpy.data.objects[name];base=c['base']+(.006 if name=='liquid' else 0)
        for label,z in [('inner_base',base),('underside',.035)] if name=='glass' else [('bottom',base)]:
            planar=[poly for poly in ob.data.polygons if all(abs(ob.data.vertices[ob.data.loops[k].vertex_index].co.z-z)<1e-5 for k in poly.loop_indices) and abs(poly.normal.z)>.999]
            corners=[]
            for poly in planar:
                for k in poly.loop_indices:
                    v=ob.data.vertices[ob.data.loops[k].vertex_index]
                    corners.append(dict(radius=math.hypot(v.co.x,v.co.y),deviationDegrees=angle(normal(ob,k),poly.normal)))
            # Exactly planar faces can still have sloped smooth corner normals.
            # Quantify the interpolated radial normal on the largest planar quad.
            largest=max(planar,key=lambda p:p.area) if planar else None
            radial=[]
            if largest:
                by_radius=sorted([(math.hypot(ob.data.vertices[ob.data.loops[k].vertex_index].co.x,ob.data.vertices[ob.data.loops[k].vertex_index].co.y),normal(ob,k)) for k in largest.loop_indices],key=lambda item:item[0])
                n0=(by_radius[0][1]+by_radius[1][1]).normalized();n1=(by_radius[-1][1]+by_radius[-2][1]).normalized()
                for fraction in [0,.25,.5,.75,1]:
                    n=n0.lerp(n1,fraction).normalized()
                    radial.append(dict(radialFraction=fraction,radius=by_radius[0][0]*(1-fraction)+by_radius[-1][0]*fraction,normalDeviationDegrees=angle(n,largest.normal)))
            bases[name+'_'+label]=dict(geometricPlanarFaceCount=len(planar),shadingDeviationDegrees=stats([d['deviationDegrees'] for d in corners]),outerRing=[d for d in corners if d['radius']>.5][:6],interpolatedNormalOnLargestPlanarFace=radial)
    materials=[]
    for name in ['glass','liquid','ice']:
        ob=bpy.data.objects[name];mat=ob.data.materials[0];bs=mat.node_tree.nodes.get('Principled BSDF')
        materials.append(dict(part=name,baseColor=list(bs.inputs['Base Color'].default_value),ior=bs.inputs['IOR'].default_value,roughness=bs.inputs['Roughness'].default_value,roughnessLinked=bs.inputs['Roughness'].is_linked,volumeAbsorption=[dict(color=list(n.inputs['Color'].default_value),density=n.inputs['Density'].default_value) for n in mat.node_tree.nodes if n.type=='VOLUME_ABSORPTION']))
    report.append(dict(drink=drink,sourceVersion=manifest['version'],sourceSha256=hashlib.sha256(path.read_bytes()).hexdigest(),ice=dict(topCoreHeightDeviationAuthoredUnits=stats(top_z),topCorePeakToPeakEstimatedMillimeters=(max(top_z)-min(top_z))*40,topCoreGeometricNormalAngleDegrees=stats(topangles),topCoreShadingNormalAngleDegrees=stats(topshading),sideCoreShadingNormalAngleDegrees=stats(sideangles),edgeBevelAuthoredUnits=.085,edgeBevelEstimatedMillimeters=.085*40),baseNormals=bases,materials=materials))
out=P/f'qa/evidence/blender/{args.source_tag or "v011"}-optical-normal-audit.json';out.write_text(json.dumps(dict(method='Source-local evaluated mesh polygon geometry versus corner shading normals. Core ice excludes edge bevel; flat glass/liquid annuli are selected by exact coplanarity. Product physical scale is estimated 40mm per authored unit. No source edits, no render, no fidelity score.',drinks=report),indent=2))
print(json.dumps(report))
