"""Read actual evaluated triangle geometry for an independent CPU contact audit."""
import bpy,json,hashlib,struct
from pathlib import Path
P=Path(__file__).resolve().parents[1]
source=P/'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend'
manifest=json.loads(source.with_suffix('.json').read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(source)==manifest['sceneSha256']
def snapshot(name):
    ob=bpy.context.scene.objects[name];evaluated=ob.evaluated_get(bpy.context.evaluated_depsgraph_get());me=evaluated.to_mesh();me.calc_loop_triangles()
    vertices=[list(ob.matrix_world@v.co) for v in me.vertices]
    triangles=[list(t.vertices) for t in me.loop_triangles]
    ior_attr=me.attributes.get('liquid_surface_ior')
    rows=[]
    for tri in me.loop_triangles:
        face=me.polygons[tri.polygon_index];mat=me.materials[face.material_index] if me.materials else None
        node=mat.node_tree.nodes.get('Principled BSDF') if mat and mat.use_nodes else None
        rows.append({'polygon':tri.polygon_index,'ior':ior_attr.data[tri.polygon_index].value if ior_attr else node.inputs['IOR'].default_value if node else None,'material':mat.name if mat else None})
    h=hashlib.sha256()
    for tri in triangles:
        for index in tri:h.update(struct.pack('<3f',*vertices[index]))
    output={'name':name,'hiddenRender':ob.hide_render,'vertices':vertices,'triangles':triangles,'rows':rows,'worldTriangleSha256':h.hexdigest()}
    evaluated.to_mesh_clear();return output
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.view_layer.update()
objects={name:snapshot(name) for name in ['glass_closed_volume','ice_closed_volume','liquid','glass','ice']}
ice_source=P/manifest['physicalIceSource'];assert sha(ice_source)==manifest['physicalIceSourceSha256'];bpy.ops.wm.open_mainfile(filepath=str(ice_source));bpy.context.view_layer.update();original=snapshot('ice')
assert objects['ice_closed_volume']['worldTriangleSha256']==original['worldTriangleSha256'],'Complete physical ice triangles changed'
record={'source':str(source.relative_to(P)),'sourceSha256':sha(source),'scriptSha256':sha(Path(__file__)),'tolerance':manifest['toleranceAuthoredUnits'],'physicalIceSource':str(ice_source.relative_to(P)),'physicalIceSourceSha256':sha(ice_source),'sourceIceWorldTrianglesExactlyUnchanged':True,'sourceIceWorldTriangleSha256':original['worldTriangleSha256'],'objects':objects}
out=P/'qa/evidence/blender/v012-true-contact-triangle-input.json';out.write_text(json.dumps(record,separators=(',',':'))+'\n');print(json.dumps({'output':str(out.relative_to(P)),'sourceIceWorldTrianglesExactlyUnchanged':True,'objects':{k:{'vertices':len(v['vertices']),'triangles':len(v['triangles']),'worldTriangleSha256':v['worldTriangleSha256']}for k,v in objects.items()}}))
