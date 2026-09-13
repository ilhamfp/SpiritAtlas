"""Read actual saved interface experiment materials and all active incoming links."""
import bpy,sys,json,hashlib
from pathlib import Path
P=Path(__file__).resolve().parents[1];out=[]
for label in ['interfaces-zero','interfaces-red-d055']:
 path=P/f'assets/blender/experiments/negroni-express-v012-{label}-hero.blend';bpy.ops.wm.open_mainfile(filepath=str(path));rows=[]
 for part in ['liquid','ice']:
  ob=bpy.data.objects[part];used={i:sum(p.material_index==i for p in ob.data.polygons) for i in range(len(ob.data.materials))}
  for index,mat in enumerate(ob.data.materials):
   if not mat:continue
   node=mat.node_tree.nodes.get('Principled BSDF');volumes=[n for n in mat.node_tree.nodes if n.type=='VOLUME_ABSORPTION']
   rows.append(dict(part=part,slot=index,faceCount=used[index],material=mat.name,users=mat.users,baseColor=list(node.inputs['Base Color'].default_value),incomingBaseColorLinks=[dict(node=l.from_node.name,socket=l.from_socket.name) for l in node.inputs['Base Color'].links],transmission=node.inputs['Transmission Weight'].default_value,ior=node.inputs['IOR'].default_value,volumes=[dict(color=list(n.inputs['Color'].default_value),density=n.inputs['Density'].default_value,linkedTo=[dict(node=l.to_node.name,socket=l.to_socket.name) for l in n.outputs[0].links]) for n in volumes]))
 out.append(dict(label=label,source=str(path.relative_to(P)),sha256=hashlib.sha256(path.read_bytes()).hexdigest(),materials=rows))
(P/'qa/evidence/blender/v012-interface-material-link-audit.json').write_text(json.dumps(out,indent=2));print(json.dumps(out))
