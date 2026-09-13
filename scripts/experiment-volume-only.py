"""Controlled Somma material-only experiment: white transmission + unchanged absorption."""
import bpy, argparse, sys, hashlib, json, struct, time, math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--render',action='store_true');p.add_argument('--source-interfaces',action='store_true');p.add_argument('--label',default='volume-only');p.add_argument('--absorption-color',default='');p.add_argument('--density',type=float);p.add_argument('--view',choices=['hero','photo'],default='hero');p.add_argument('--illumination-control',choices=['source','neutral-emissive'],default='source');p.add_argument('--linear-output',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
source=P/('assets/blender/candidates/v012/negroni-express-interfaces-air-gap.blend' if a.source_interfaces else 'assets/blender/candidates/v012/negroni-express.blend')
source_hash=hashlib.sha256(source.read_bytes()).hexdigest();bpy.ops.wm.open_mainfile(filepath=str(source))
def geometry_hash():
    h=hashlib.sha256()
    for ob in sorted(bpy.context.scene.objects,key=lambda ob:ob.name):
        if ob.type!='MESH':continue
        h.update(ob.name.encode());h.update(struct.pack('<16f',*(v for row in ob.matrix_world for v in row)))
        for v in ob.data.vertices:h.update(struct.pack('<3f',*v.co))
        for face in ob.data.polygons:h.update(struct.pack('<I',len(face.vertices)));h.update(struct.pack('<'+'I'*len(face.vertices),*face.vertices))
        for n in ob.data.corner_normals:h.update(struct.pack('<3f',*n.vector))
    return h.hexdigest()
def preserve_planar_optical_normals(ob):
 # Keep horizontal optical planes genuinely planar to the renderer. At a plane's
 # fillet boundary use its tangent normal, retaining smooth curvature elsewhere.
 me=ob.data;me.update();plane_normals={}
 for poly in me.polygons:
  if abs(poly.normal.z)>.999999:
   z=[me.vertices[i].co.z for i in poly.vertices]
   if max(z)-min(z)<1e-6:
    for index in poly.vertices:plane_normals[index]=Vector((0,0,1 if poly.normal.z>0 else -1))
 normals=[tuple(plane_normals.get(loop.vertex_index,me.corner_normals[loop.index].vector)) for loop in me.loops]
 me.normals_split_custom_set(normals)
 ob['planarOpticalNormals']='True horizontal surface normals; smooth fillet/wall normals elsewhere.'

normal_restore=None
if a.source_interfaces:
    old_geometry_normals=geometry_hash();preserve_planar_optical_normals(bpy.data.objects['liquid']);normal_restore=dict(beforeSha256=old_geometry_normals,afterSha256=geometry_hash(),purpose='Restore validated v012 horizontal liquid normal rule after interface splitting introduced max2.6747degree deviation.')
before=geometry_hash();liquid_object=bpy.data.objects['liquid'];liquid=liquid_object.data.materials[0]
used_liquid_slots=sorted({face.material_index for face in liquid_object.data.polygons})
treated_materials=[liquid_object.data.materials[index] for index in used_liquid_slots]
def material_state(material):
    if not material or not material.use_nodes:return None
    bsdf=material.node_tree.nodes.get('Principled BSDF')
    return dict(name=material.name,baseColor=list(bsdf.inputs['Base Color'].default_value) if bsdf else None,baseColorLinks=[(link.from_node.name,link.from_socket.name) for link in bsdf.inputs['Base Color'].links] if bsdf else [],absorption=[dict(color=list(node.inputs['Color'].default_value),density=node.inputs['Density'].default_value) for node in material.node_tree.nodes if node.type=='VOLUME_ABSORPTION'])
untreated_materials={m.name:m for ob in bpy.context.scene.objects if ob.type=='MESH' and ob!=liquid_object for m in ob.data.materials if m}
assert not set(m.name for m in treated_materials)&set(untreated_materials),'A used liquid material is shared with another object; clone it before treatment.'
untreated_before={name:material_state(m) for name,m in untreated_materials.items()}
bs=liquid.node_tree.nodes.get('Principled BSDF');old=list(bs.inputs['Base Color'].default_value);bs.inputs['Base Color'].default_value=(1,1,1,1)
absorption=next(n for n in liquid.node_tree.nodes if n.type=='VOLUME_ABSORPTION')
old_absorption=dict(color=list(absorption.inputs['Color'].default_value),density=absorption.inputs['Density'].default_value)
if a.absorption_color:
    rgb=[float(v) for v in a.absorption_color.split(',')]
    if len(rgb)!=3 or any(not 0<=v<=1 for v in rgb):p.error('Absorption color must have three linear values in0..1.')
    absorption.inputs['Color'].default_value=rgb+[1]
if a.density is not None:absorption.inputs['Density'].default_value=a.density
color=list(absorption.inputs['Color'].default_value);density=absorption.inputs['Density'].default_value
if a.source_interfaces:
    # Boolean operations retain unused slots, including a material shared with ice.
    # Only treat surfaces actually assigned to liquid faces; unused slots stay intact.
    for material in treated_materials:
        base_input=material.node_tree.nodes.get('Principled BSDF').inputs['Base Color']
        assert not base_input.is_linked,'An incoming color link would override the white control.'
        base_input.default_value=(1,1,1,1)
        for node in material.node_tree.nodes:
            if node.type=='VOLUME_ABSORPTION':node.inputs['Color'].default_value=color;node.inputs['Density'].default_value=density
coefficient=[(1-c)*density for c in color[:3]]
assert geometry_hash()==before
assert untreated_before=={name:material_state(m) for name,m in untreated_materials.items()},'A non-liquid material changed during treatment.'
sc=bpy.context.scene;sc.camera=sc.objects['Camera_'+a.view];sc.cycles.samples=256;sc.cycles.use_denoising=True
sc.render.resolution_x=720;sc.render.resolution_y=900;sc.render.resolution_percentage=100
sc.render.use_border=True;sc.render.use_crop_to_border=True;sc.render.border_min_x=.08;sc.render.border_max_x=.90;sc.render.border_min_y=.18;sc.render.border_max_y=.84
if a.view=='photo':
    sc.render.use_border=False;sc.render.use_crop_to_border=False
    sc.world.node_tree.nodes.get('Background').inputs[1].default_value=.75
    for light in [o for o in sc.objects if o.type=='LIGHT']:light.data.color=tuple(.7+.3*c for c in light.data.color)
    material=bpy.data.materials.get('Counter warm veined stone')
    if material:
        tex=material.node_tree.nodes.get('ReferenceCounterTexture')
        if tex:tex.image=bpy.data.images.load(str(P/'assets/source-textures/somma-counter-photo-crop.png'),check_existing=True)
illumination_record=dict(mode=a.illumination_control)
if a.illumination_control=='neutral-emissive':
    background=sc.world.node_tree.nodes.get('Background')
    background.inputs['Color'].default_value=(1,1,1,1)
    background.inputs['Strength'].default_value=1
    disabled_lights=[]
    for light in [ob for ob in sc.objects if ob.type=='LIGHT']:
        light.hide_render=True;disabled_lights.append(light.name)
    replaced_surfaces=[]
    for name in ['stage_counter','stage_square_coaster']:
        ob=sc.objects.get(name)
        if not ob:continue
        original=[m.name if m else None for m in ob.data.materials]
        neutral=bpy.data.materials.new('Neutral terminal radiance '+name);neutral.use_nodes=True
        nodes=neutral.node_tree.nodes;nodes.clear()
        output=nodes.new('ShaderNodeOutputMaterial');emission=nodes.new('ShaderNodeEmission')
        emission.inputs['Color'].default_value=(1,1,1,1);emission.inputs['Strength'].default_value=1
        neutral.node_tree.links.new(emission.outputs[0],output.inputs['Surface'])
        ob.data.materials.clear();ob.data.materials.append(neutral)
        for face in ob.data.polygons:face.material_index=0
        replaced_surfaces.append(dict(object=name,before=original,after=neutral.name))
    illumination_record.update(worldLinearEmission=[1,1,1],strength=1,disabledLights=disabled_lights,replacedSurfaces=replaced_surfaces,meaning='Equal neutral terminal radiance from world, counter and coaster; optical materials/geometry remain separate controls. No source-fidelity claim.')
out=P/f'qa/evidence/blender/negroni-express-{a.view}-v012-{a.label}.png';scene=P/f'assets/blender/experiments/negroni-express-v012-{a.label}-{a.view}.blend';scene.parent.mkdir(parents=True,exist_ok=True)
sc.render.filepath=str(out);bpy.ops.wm.save_as_mainfile(filepath=str(scene))
record=dict(sourceBlend=str(source.relative_to(P)),sourceBlendSha256=source_hash,experimentBlend=str(scene.relative_to(P)),experimentBlendSha256=hashlib.sha256(scene.read_bytes()).hexdigest(),scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),geometryAndNormalsSha256=before,geometryAndNormalsUnchanged=True,treatment=dict(field='Liquid Principled BSDF Base Color',before=old,after=[1,1,1,1]),controls='Same v0.12 geometry/normals, camera, lights, world, absorption color/density, IOR, roughness, exposure, view transform and sample/denoise settings as fixed v0.12 hero.',render=dict(samples=256,denoise=True,baseResolution=[720,900],crop=[.08,.90,.18,.84],output=str(out.relative_to(P)),completed=False))
record.update(interfaceSource=a.source_interfaces,normalBaselineRestoration=normal_restore,interfaceMaterials=[dict(name=m.name,ior=m.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value) for ob in ['glass','liquid','ice'] for m in bpy.data.objects[ob].data.materials if m])
record.update(materialTreatmentVersion=2,usedLiquidMaterialSlots=used_liquid_slots,treatedLiquidMaterials=[material_state(m) for m in treated_materials],nonLiquidMaterialsUnchangedDuringAbsorptionTreatment=True,iceMaterials=[material_state(m) for m in bpy.data.objects['ice'].data.materials if m])
record.update(illuminationControl=illumination_record,linearOutputRequested=a.linear_output)
record.update(absorption=dict(before=old_absorption,after=dict(color=color,density=density),linearCoefficientPerAuthoredUnit=coefficient,predictedDirectTransmission=[dict(pathLengthAuthoredUnits=length,RGB=[math.exp(-alpha*length) for alpha in coefficient]) for length in [.25,.5,1]],formula='alpha=(1-linearColor)*density; T=exp(-alpha*pathLength). Surface Fresnel and multiple reflections are separate.',formulaSource='https://docs.blender.org/manual/en/latest/render/shader_nodes/shader/volume_coefficients.html'))
record['controls']=f'Same v0.12 geometry/normals, IOR, roughness, exposure, view transform and sample/denoise settings. Uses the fixed {a.view} camera/light preset; only named liquid surface/absorption fields are treated.'
if a.source_interfaces:
    record['controls']=f'Fixed {a.view} camera/light, exposure, roughness and rendering settings. Uses the explicitly partitioned meniscus-aware v012 interface source; its relative IORs and baseline liquid-normal restoration are separately recorded. Geometry/normals stay unchanged during white-surface/absorption treatment. The raw v012 d6 control has different interface partitioning.'
if a.illumination_control!='source':record['controls']+=' This named illumination control also replaces the world/counter/coaster with equal neutral emission and disables direct lights, as separately recorded.'
record['render']['crop']=False if a.view=='photo' else [.08,.90,.18,.84]
if a.render:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type='METAL';prefs.get_devices()
        for d in prefs.devices:d.use=d.type=='METAL'
        if any(d.type=='METAL' for d in prefs.devices):sc.cycles.device='GPU'
    except Exception:pass
    start=time.monotonic();bpy.ops.render.render(write_still=True);record['render'].update(completed=True,elapsedSeconds=time.monotonic()-start,outputSha256=hashlib.sha256(out.read_bytes()).hexdigest())
    if a.linear_output:
        exr=out.with_suffix('.exr');sc.render.image_settings.file_format='OPEN_EXR';sc.render.image_settings.color_depth='32'
        bpy.data.images['Render Result'].save_render(str(exr),scene=sc)
        record['render'].update(linearOutput=str(exr.relative_to(P)),linearOutputSha256=hashlib.sha256(exr.read_bytes()).hexdigest(),linearFormat='32-bit float scene-linear RGBA OpenEXR; display transform is not baked into this output.')
scene.with_suffix('.json').write_text(json.dumps(record,indent=2));out.with_suffix('.render.json').write_text(json.dumps(record,indent=2))
assert hashlib.sha256(source.read_bytes()).hexdigest()==source_hash
print(json.dumps(record))
