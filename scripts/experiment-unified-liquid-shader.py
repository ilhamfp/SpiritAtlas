"""Isolate Cycles volume-stack shader identity with one liquid shader.

Actual per-face IOR values remain unchanged in a FACE/FLOAT attribute. The same
closed liquid object and volume shader now enter and exit under one shader ID.
Only separate experimental .blend/PNG/EXR outputs are written.
"""
import bpy,argparse,sys,json,hashlib,struct,time
from pathlib import Path
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--control',choices=['zero','d055'],required=True);p.add_argument('--render',action='store_true');p.add_argument('--linear-output',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
source=P/f'assets/blender/experiments/negroni-express-v012-interfaces-neutral-{a.control}-hero.blend'
source_hash=sha(source);bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene;liquid=scene.objects['liquid'];mesh=liquid.data
def geometry_hash():
    h=hashlib.sha256()
    for ob in sorted(scene.objects,key=lambda item:item.name):
        if ob.type!='MESH':continue
        h.update(ob.name.encode());h.update(struct.pack('<16f',*(v for row in ob.matrix_world for v in row)))
        for vertex in ob.data.vertices:h.update(struct.pack('<3f',*vertex.co))
        for face in ob.data.polygons:h.update(struct.pack('<I',len(face.vertices)));h.update(struct.pack('<'+'I'*len(face.vertices),*face.vertices))
        for normal in ob.data.corner_normals:h.update(struct.pack('<3f',*normal.vector))
    return h.hexdigest()
before=geometry_hash();per_face=[];source_materials={};volume_values=[]
for face in mesh.polygons:
    material=mesh.materials[face.material_index];bsdf=material.node_tree.nodes.get('Principled BSDF');value=bsdf.inputs['IOR'].default_value
    assert not bsdf.inputs['IOR'].is_linked,'Unexpected linked IOR in the source control.'
    per_face.append(value);source_materials[material.name]=dict(ior=value,faces=source_materials.get(material.name,{}).get('faces',0)+1)
for index in {face.material_index for face in mesh.polygons}:
    material=mesh.materials[index];volume=next(node for node in material.node_tree.nodes if node.type=='VOLUME_ABSORPTION')
    volume_values.append((tuple(volume.inputs['Color'].default_value),volume.inputs['Density'].default_value))
assert all(value==volume_values[0] for value in volume_values),'Source interface absorption values must agree.'
material=mesh.materials[0].copy();material.name='Unified liquid volume with per-face interface IOR'
attribute_name='liquid_surface_ior';attribute=mesh.attributes.new(attribute_name,'FLOAT','FACE')
for index,value in enumerate(per_face):attribute.data[index].value=value
shader_attribute=material.node_tree.nodes.new('ShaderNodeAttribute');shader_attribute.name='Per-face physical interface IOR';shader_attribute.attribute_name=attribute_name;shader_attribute.attribute_type='GEOMETRY'
bsdf=material.node_tree.nodes.get('Principled BSDF');material.node_tree.links.new(shader_attribute.outputs['Fac'],bsdf.inputs['IOR'])
mesh.materials.clear();mesh.materials.append(material)
for face in mesh.polygons:face.material_index=0
assert len(mesh.materials)==1 and all(face.material_index==0 for face in mesh.polygons)
assert all(attribute.data[index].value==value for index,value in enumerate(per_face))
assert geometry_hash()==before,'Optical geometry, transform or normals changed.'
label='interfaces-neutral-unified-'+a.control
out=P/f'qa/evidence/blender/negroni-express-hero-v012-{label}.png'
blend=P/f'assets/blender/experiments/negroni-express-v012-{label}-hero.blend'
scene.render.filepath=str(out);bpy.ops.wm.save_as_mainfile(filepath=str(blend))
record=dict(source=str(source.relative_to(P)),sourceSha256=source_hash,scene=str(blend.relative_to(P)),sceneSha256=sha(blend),scriptSha256=sha(Path(__file__)),geometryAndNormalsSha256=before,geometryAndNormalsUnchanged=True,sourceLiquidMaterials=source_materials,treatment=dict(singleMaterial=material.name,usedMaterialCount=1,faceCount=len(mesh.polygons),iorAttribute=attribute_name,attributeType=attribute.data_type,attributeDomain=attribute.domain,attributeValuesExactlyMatchPriorFaceIORs=True,attributeNodeOutput='Fac',connectedInput='Principled BSDF.IOR',volumeColor=volume_values[0][0],volumeDensity=volume_values[0][1]),controls='Same saved neutral-emission scene, all optical geometry/normals/poses, per-face IOR values, roughness, volume coefficient, non-liquid materials, illumination, camera, exposure and rendering settings. Only liquid shader identity is unified; FACE/FLOAT data supplies the prior interface IOR.',render=dict(output=str(out.relative_to(P)),completed=False,samples=scene.cycles.samples,denoise=scene.cycles.use_denoising,engine=scene.render.engine,blenderVersion=bpy.app.version_string,blenderBuildHash=bpy.app.build_hash.decode(),viewTransform=scene.view_settings.view_transform,look=scene.view_settings.look,exposure=scene.view_settings.exposure,gamma=scene.view_settings.gamma,baseResolution=[scene.render.resolution_x,scene.render.resolution_y],crop=[scene.render.border_min_x,scene.render.border_max_x,scene.render.border_min_y,scene.render.border_max_y],camera=scene.camera.name,lens=scene.camera.data.lens,seed=scene.cycles.seed,maxBounces=scene.cycles.max_bounces,transmissionBounces=scene.cycles.transmission_bounces,volumeBounces=scene.cycles.volume_bounces))
if a.render:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type='METAL';prefs.get_devices()
        for device in prefs.devices:device.use=device.type=='METAL'
        if any(device.type=='METAL' for device in prefs.devices):scene.cycles.device='GPU'
    except Exception:pass
    record['render']['device']=scene.cycles.device
    start=time.monotonic();bpy.ops.render.render(write_still=True);record['render'].update(completed=True,elapsedSeconds=time.monotonic()-start,outputSha256=sha(out))
    if a.linear_output:
        exr=out.with_suffix('.exr');scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='32';bpy.data.images['Render Result'].save_render(str(exr),scene=scene)
        record['render'].update(linearOutput=str(exr.relative_to(P)),linearOutputSha256=sha(exr),linearFormat='32-bit float scene-linear RGBA OpenEXR')
blend.with_suffix('.json').write_text(json.dumps(record,indent=2));out.with_suffix('.render.json').write_text(json.dumps(record,indent=2));assert sha(source)==source_hash;print(json.dumps(record))
