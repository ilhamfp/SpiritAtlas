"""Render isolated density/illumination controls from the frozen contact source.

Scene derivations are fully recorded rather than duplicated as .blend backups.
The immutable editable base plus this script/parameters reproduces each control.
"""
import bpy,argparse,sys,json,hashlib,time
from pathlib import Path
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--lighting',choices=['neutral','source'],default='neutral');p.add_argument('--view',choices=['hero','photo'],default='hero');p.add_argument('--density',type=float,default=.55);p.add_argument('--white-coaster',action='store_true');p.add_argument('--render',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
if a.density<0:p.error('Density must be nonnegative.')
if a.white_coaster and a.lighting!='source':p.error('Passive-white coaster treatment requires source lighting.')
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
source=P/'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend';source_hash=sha(source)
bpy.ops.wm.open_mainfile(filepath=str(source));bpy.context.preferences.filepaths.save_version=0;scene=bpy.context.scene
liquid=scene.objects['liquid'];material=liquid.data.materials[0];volume=next(node for node in material.node_tree.nodes if node.type=='VOLUME_ABSORPTION');previous_density=volume.inputs['Density'].default_value;volume.inputs['Density'].default_value=a.density
stage_source=None
if a.lighting=='source':
    stage_source=P/f'assets/blender/experiments/negroni-express-v012-interfaces-source-unified-d35-{a.view}.blend'
    names=['Left narrow reflected strip','Right narrow reflected strip','Broad rear diffuse fill']
    with bpy.data.libraries.load(str(stage_source),link=False) as (available,load):
        assert len(available.worlds)==1,available.worlds
        load.worlds=list(available.worlds);load.materials=['Counter warm veined stone','Coaster ivory engraved paper'];load.objects=list(names)
    scene.world=load.worlds[0]
    for object_name,loaded_material in zip(['stage_counter','stage_square_coaster'],load.materials):
        ob=scene.objects[object_name];ob.data.materials.clear();ob.data.materials.append(loaded_material)
        for face in ob.data.polygons:face.material_index=0
    for name,loaded_light in zip(names,load.objects):
        target=scene.objects[name];target.data=loaded_light.data;target.location=loaded_light.location;target.rotation_euler=loaded_light.rotation_euler;target.scale=loaded_light.scale;target.hide_render=False
        bpy.data.objects.remove(loaded_light,do_unlink=True)
    bpy.context.view_layer.update()
if a.view=='photo':
    scene.camera=scene.objects['Camera_photo'];scene.render.use_border=False;scene.render.use_crop_to_border=False
coaster_treatment=None
if a.white_coaster:
    coaster=scene.objects['stage_square_coaster'];paper=coaster.data.materials[0].copy();paper.name='Coaster passive white isolated contact control';coaster.data.materials[0]=paper
    bsdf=paper.node_tree.nodes.get('Principled BSDF');base=bsdf.inputs['Base Color'];previous_links=[dict(node=link.from_node.name,socket=link.from_socket.name) for link in base.links]
    for link in list(base.links):paper.node_tree.links.remove(link)
    base.default_value=(1,1,1,1)
    coaster_treatment=dict(changedInput='Principled BSDF.Base Color only',removedIncomingLinks=previous_links,linearBaseColor=list(base.default_value),roughnessUnchanged=bsdf.inputs['Roughness'].default_value,emissionStrengthUnchanged=bsdf.inputs['Emission Strength'].default_value,geometryAndOtherShaderInputsUnchanged=True,meaning='Passive neutral-white unprinted surface control. It does not reconstruct the unknown video coaster artwork.')
scene.render.image_settings.file_format='PNG';scene.render.image_settings.color_depth='8';scene.render.image_settings.color_mode='RGBA'
label='contact-'+a.lighting+'-d'+format(a.density,'g').replace('.','p')+('-white-coaster' if a.white_coaster else '');out=P/f'qa/evidence/blender/negroni-express-{a.view}-v012-{label}.png';scene.render.filepath=str(out)
attribute=liquid.data.attributes['liquid_surface_ior'];counts={}
for face in liquid.data.polygons:
    key=str(attribute.data[face.index].value);counts[key]=counts.get(key,0)+1
record=dict(source=str(source.relative_to(P)),sourceSha256=source_hash,scriptSha256=sha(Path(__file__)),derivedEditableSceneSaved=False,derivation='Frozen editable contact base plus exact script/parameters, avoiding redundant .blend copies.',sourceStage=str(stage_source.relative_to(P)) if stage_source else None,sourceStageSha256=sha(stage_source) if stage_source else None,treatment=dict(lighting=a.lighting,densityBefore=previous_density,density=volume.inputs['Density'].default_value,linearAbsorptionColor=list(volume.inputs['Color'].default_value),liquidMaterialCount=len(liquid.data.materials),faceIORCounts=counts),geometryTreatment='None in renderer: uses the frozen true-contact geometry and hidden complete physical volumes as authored.',render=dict(output=str(out.relative_to(P)),completed=False,engine=scene.render.engine,blenderVersion=bpy.app.version_string,blenderBuildHash=bpy.app.build_hash.decode(),samples=scene.cycles.samples,denoise=scene.cycles.use_denoising,seed=scene.cycles.seed,maxBounces=scene.cycles.max_bounces,transmissionBounces=scene.cycles.transmission_bounces,volumeBounces=scene.cycles.volume_bounces,camera=scene.camera.name,cameraMatrix=[list(row) for row in scene.camera.matrix_world],lens=scene.camera.data.lens,baseResolution=[scene.render.resolution_x,scene.render.resolution_y],crop=[scene.render.border_min_x,scene.render.border_max_x,scene.render.border_min_y,scene.render.border_max_y],viewTransform=scene.view_settings.view_transform,look=scene.view_settings.look,exposure=scene.view_settings.exposure,gamma=scene.view_settings.gamma))
record['lighting']=dict(worldColor=list(scene.world.node_tree.nodes.get('Background').inputs['Color'].default_value),worldStrength=scene.world.node_tree.nodes.get('Background').inputs['Strength'].default_value,lights=[dict(name=ob.name,hidden=ob.hide_render,color=list(ob.data.color),power=ob.data.energy,matrix=[list(row) for row in ob.matrix_world]) for ob in scene.objects if ob.type=='LIGHT'])
record['render']['view']=a.view
record['treatment']['coaster']=coaster_treatment
if not scene.render.use_border:record['render']['crop']=False
if a.render:
    prefs=bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type='METAL';prefs.get_devices()
        for device in prefs.devices:device.use=device.type=='METAL'
        if any(device.type=='METAL' for device in prefs.devices):scene.cycles.device='GPU'
    except Exception:pass
    record['render']['device']=scene.cycles.device;start=time.monotonic();bpy.ops.render.render(write_still=True)
    exr=out.with_suffix('.exr');scene.render.image_settings.file_format='OPEN_EXR';scene.render.image_settings.color_depth='32';bpy.data.images['Render Result'].save_render(str(exr),scene=scene)
    record['render'].update(completed=True,elapsedSeconds=time.monotonic()-start,outputSha256=sha(out),linearOutput=str(exr.relative_to(P)),linearOutputSha256=sha(exr),linearFormat='32-bit float scene-linear RGBA OpenEXR')
out.with_suffix('.render.json').write_text(json.dumps(record,indent=2));assert sha(source)==source_hash;print(json.dumps(record,indent=2))
