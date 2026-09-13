"""Read-only audit input for the source's artificial ice closure triangles."""
import bpy,json,struct,hashlib
from pathlib import Path
P=Path(__file__).resolve().parents[1];D=P/'qa/evidence/contact-runtime-export';source=P/'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend';sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(source)=='69a6d3f226f3d1fb89335035dfff01d49a16c350bb87d8abe0aefaed0e6c42cb';bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update();ob=bpy.context.scene.objects['ice'];ev=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());me=ev.to_mesh();me.calc_loop_triangles()
def yup(v):return [v.x,v.z,-v.y]
out=D/'independent-source-closure-local.f32';count=0
with out.open('wb') as f:
 for t in me.loop_triangles:
  if me.polygons[t.polygon_index].material_index==0:continue
  f.write(struct.pack('<18f',*[x for vi in t.vertices for x in yup(me.vertices[vi].co)],*[x for li in t.loops for x in yup(me.corner_normals[li].vector)]));count+=1
assert count==392
r={'sourceSha256':sha(source),'scriptSha256':sha(Path(__file__)),'binary':str(out.relative_to(P)),'binarySha256':sha(out),'triangles':count,'rowFormat':'18 little-endian float32, local glTF Y-up positions[3][3] then corner normals[3][3]'};(D/'independent-source-closure.json').write_text(json.dumps(r,indent=2));print(json.dumps(r));ev.to_mesh_clear()
