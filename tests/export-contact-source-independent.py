"""Read-only evaluated source extraction, without invoking or modifying the exporter."""
import bpy, json, struct, hashlib
from pathlib import Path
P=Path(__file__).resolve().parents[1]
source=P/'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(source)=='69a6d3f226f3d1fb89335035dfff01d49a16c350bb87d8abe0aefaed0e6c42cb'
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update()
names=['glass','ice','ice_inclusions','liquid'];iors={0:1.,1:1.36,2:1.51,3:1.31,4:1.03}
def yup(v): return [v.x,v.z,-v.y]
out=P/'qa/evidence/contact-runtime-export/independent-source.f32';records=[]
localout=out.with_name('independent-source-local.f32')
with out.open('wb') as stream, localout.open('wb') as localstream:
 for oi,name in enumerate(names):
  ob=bpy.context.scene.objects[name];ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();me.calc_loop_triangles();nm=ev.matrix_world.to_3x3().inverted().transposed();attribute=me.attributes.get('liquid_surface_ior');count=0;omitted=0;slots={}
  for tri in me.loop_triangles:
   face=me.polygons[tri.polygon_index]
   if name=='ice' and face.material_index!=0:omitted+=1;continue
   inside,outside={'glass':(2,0),'ice':(3,0),'ice_inclusions':(4,3),'liquid':(1,0)}[name]
   if name=='liquid':
    value=attribute.data[face.index].value;error,outside=min((abs(value-iors[1]/iors[o]),o) for o in [0,2,3]);assert error<1e-7
   slots[str((inside,outside))]=slots.get(str((inside,outside)),0)+1
   ps=[x for v in tri.vertices for x in yup(ev.matrix_world@me.vertices[v].co)]
   ns=[x for l in tri.loops for x in yup((nm@me.corner_normals[l].vector).normalized())]
   stream.write(struct.pack('<22f',*ps,*ns,iors[inside]/iors[outside],inside,outside,oi))
   lp=[x for v in tri.vertices for x in yup(me.vertices[v].co)];ln=[x for l in tri.loops for x in yup(me.corner_normals[l].vector)];localstream.write(struct.pack('<22f',*lp,*ln,iors[inside]/iors[outside],inside,outside,oi));count+=1
  records.append({'name':name,'triangles':count,'omitted':omitted,'boundaries':slots,'modifiers':[m.type for m in ob.modifiers]});ev.to_mesh_clear()
record={'source':str(source.relative_to(P)),'sourceSha256':sha(source),'scriptSha256':sha(Path(__file__)),'rows':sum(r['triangles'] for r in records),'binary':str(out.relative_to(P)),'binarySha256':sha(out),'localBinary':str(localout.relative_to(P)),'localBinarySha256':sha(localout),'objects':records,'blenderVersion':bpy.app.version_string,'blenderBuildHash':bpy.app.build_hash.decode()}
(P/'qa/evidence/contact-runtime-export/independent-source.json').write_text(json.dumps(record,indent=2));print(json.dumps(record))
