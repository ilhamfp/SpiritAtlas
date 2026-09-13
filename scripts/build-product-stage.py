"""Create separate, editable photographic product scenes from frozen drink sources.

Blender --background --python scripts/build-product-stage.py -- --drink negroni-express --render
Primary source scenes and runtime GLBs are never overwritten by this script.
"""
import argparse, bpy, hashlib, json, math, sys, time
from pathlib import Path
from mathutils import Vector

P = Path(__file__).resolve().parents[1]
VERSION = '1.0.0'
S = .04  # Estimated physical meters per authored unit; not source-measured.
PANORAMA = P / 'public/textures/somma-interior-panorama-v2.png'
STONE = P / 'public/textures/somma-stone-tile-v1.png'
p = argparse.ArgumentParser()
p.add_argument('--drink', choices=['all','bbf-negroni','ichigo-negroni','negroni-express'], default='negroni-express')
p.add_argument('--render', action='store_true')
p.add_argument('--source-tag',default='',help='Isolated source candidate tag, leaving production sources intact.')
p.add_argument('--samples', type=int, default=256)
p.add_argument('--label', default='v1')
p.add_argument('--environment-rotation', type=float, default=-90)
p.add_argument('--fstop', type=float, default=16)
a = p.parse_args(sys.argv[sys.argv.index('--')+1:])

def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def linear(c): return c/12.92 if c <= .04045 else ((c+.055)/1.055)**2.4
def image(path):
    im = bpy.data.images.load(str(path), check_existing=True)
    im.pack()
    return im

def product(drink):
    source = P / 'assets/blender' / ('candidates/'+a.source_tag if a.source_tag else '') / f'{drink}.blend'
    source_sha = sha(source)
    bpy.ops.wm.open_mainfile(filepath=str(source))
    sc = bpy.context.scene
    for ob in list(sc.objects):
        if ob.name.startswith('stage_') or ob.type == 'LIGHT':
            bpy.data.objects.remove(ob, do_unlink=True)
    for ob in sc.objects:
        ob.location *= S
        if ob.type != 'CAMERA': ob.scale *= S
        if ob.get('scenePartId'):
            for key in ['assembledPosition','expandedPosition']:
                if key in ob: ob[key] = [v*S for v in ob[key]]
            if 'lift' in ob: ob['lift'] *= S
        if ob.type == 'CAMERA':
            ob.data.clip_start = .001
            ob.data.clip_end = 100
    # Preserve optical depth and microgeometry after converting the scene to meters.
    for material in bpy.data.materials:
        if not material.use_nodes: continue
        for node in material.node_tree.nodes:
            if node.type == 'VOLUME_ABSORPTION': node.inputs['Density'].default_value /= S
            if node.type == 'BUMP': node.inputs['Distance'].default_value *= S

    world = bpy.data.worlds.new('Somma inspired shared product environment')
    sc.world = world; world.use_nodes = True
    n = world.node_tree.nodes; l = world.node_tree.links; n.clear()
    out = n.new('ShaderNodeOutputWorld'); bg = n.new('ShaderNodeBackground')
    env = n.new('ShaderNodeTexEnvironment'); env.image = image(PANORAMA)
    env.projection = 'EQUIRECTANGULAR'
    coord = n.new('ShaderNodeTexCoord'); mapping = n.new('ShaderNodeMapping')
    mapping.inputs['Rotation'].default_value.z = math.radians(a.environment_rotation)
    l.new(coord.outputs['Generated'],mapping.inputs['Vector'])
    l.new(mapping.outputs['Vector'],env.inputs['Vector'])
    l.new(env.outputs['Color'],bg.inputs['Color']); bg.inputs['Strength'].default_value = 1
    l.new(bg.outputs[0],out.inputs['Surface'])

    floor = bpy.data.materials.new('Subdued Somma inspired stone · product only'); floor.use_nodes = True
    n = floor.node_tree.nodes; l = floor.node_tree.links; bs = n.get('Principled BSDF')
    bs.inputs['Roughness'].default_value = .66
    bs.inputs['Specular IOR Level'].default_value = .30
    coord = n.new('ShaderNodeNewGeometry'); div = n.new('ShaderNodeVectorMath'); div.operation = 'DIVIDE'
    div.inputs[1].default_value = (.60,.30,1)
    l.new(coord.outputs['Position'],div.inputs[0])
    offset = n.new('ShaderNodeVectorMath'); offset.operation = 'ADD'; offset.inputs[1].default_value = (.5,.5,0)
    l.new(div.outputs[0],offset.inputs[0])
    split = n.new('ShaderNodeSeparateXYZ'); join = n.new('ShaderNodeCombineXYZ'); l.new(offset.outputs[0],split.inputs[0])
    for axis in ['X','Y']:
        mirror = n.new('ShaderNodeMath'); mirror.operation = 'PINGPONG'; mirror.inputs[1].default_value = 1
        l.new(split.outputs[axis],mirror.inputs[0]); l.new(mirror.outputs[0],join.inputs[axis])
    tex = n.new('ShaderNodeTexImage'); tex.image = image(STONE); tex.interpolation = 'Linear'
    l.new(join.outputs[0],tex.inputs['Vector'])
    mix = n.new('ShaderNodeMixRGB'); mix.blend_type = 'MIX'; mix.inputs[0].default_value = .15
    mix.inputs[1].default_value = tuple(linear(v/255) for v in [131,124,112])+(1,)
    l.new(tex.outputs['Color'],mix.inputs[2]); l.new(mix.outputs[0],bs.inputs['Base Color'])
    bpy.ops.mesh.primitive_cube_add(size=1, location=(0,0,(.035-.08/2)*S))
    counter = bpy.context.object; counter.name = 'product_counter'
    counter.scale = (24*S,24*S,.08*S)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    counter.data.materials.append(floor)
    counter['surfaceTopAuthoredUnits'] = .035
    counter['textureInterpretation'] = 'Generated stone inspired by native Somma photo, subdued to 15% mix; not recovered source detail.'

    lights = []
    def area(name, location, energy, color, width, height):
        data = bpy.data.lights.new(name,'AREA'); data.energy = energy*S*S
        data.color = color; data.shape = 'RECTANGLE'; data.size = width*S; data.size_y = height*S
        ob = bpy.data.objects.new(name,data); sc.collection.objects.link(ob); ob.location = Vector(location)*S
        ob.rotation_euler = (Vector((0,0,1))*S-ob.location).to_track_quat('-Z','Y').to_euler()
        lights.append(dict(name=name,positionMeters=list(ob.location),energyWatts=data.energy,color=list(color),sizeMeters=[data.size,data.size_y]))
    area('Product warm left narrow key',(-4.5,-.4,3.6),240,(1,.87,.72),.5,4)
    area('Product restrained cool right fill',(4.5,.2,3.4),110,(.80,.88,1),.4,3)

    cam = sc.objects['Camera_hero'].copy(); cam.data = cam.data.copy()
    cam.name = 'Camera_product_review'; sc.collection.objects.link(cam); sc.camera = cam
    # The source phone's measured roll remains in the fixed reference camera only.
    cam.rotation_euler = (Vector((0,0,1))*S-cam.location).to_track_quat('-Z','Y').to_euler()
    focus = bpy.data.objects.new('Product optical focus',None); sc.collection.objects.link(focus)
    focus.location = (0,0,1.05*S)
    cam.data.dof.use_dof = True; cam.data.dof.focus_object = focus
    cam.data.dof.aperture_fstop = a.fstop; cam.data.dof.aperture_blades = 9
    sc.unit_settings.system = 'METRIC'; sc.unit_settings.scale_length = 1
    sc.render.engine = 'CYCLES'; sc.cycles.samples = a.samples; sc.cycles.use_denoising = True
    sc.cycles.max_bounces = 24; sc.cycles.transmission_bounces = 20
    sc.render.resolution_x = 900; sc.render.resolution_y = 1125; sc.render.resolution_percentage = 100
    sc.render.use_border = False; sc.render.use_crop_to_border = False
    sc.render.image_settings.file_format = 'PNG'; sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Medium High Contrast'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    try:
        prefs.compute_device_type = 'METAL'; prefs.get_devices()
        for device in prefs.devices: device.use = device.type == 'METAL'
        if any(device.type=='METAL' for device in prefs.devices): sc.cycles.device = 'GPU'
    except Exception: pass
    output = P / f'qa/evidence/blender/product/{drink}-product-{a.label}.png'; output.parent.mkdir(parents=True,exist_ok=True)
    scene_path = P / f'assets/blender/product/{drink}-{a.label}.blend'; scene_path.parent.mkdir(parents=True,exist_ok=True)
    sc.render.filepath = str(output); sc['productStageVersion'] = VERSION
    sc['physicalScaleNote'] = 'Product copy converted to estimated meters at 0.04m per original authored unit. Geometry identity retained; optical densities rescaled.'
    sc['contextSource'] = str(PANORAMA.relative_to(P))
    bpy.ops.wm.save_as_mainfile(filepath=str(scene_path))
    metadata = dict(productStageVersion=VERSION,sourceVersion=sc.get('authoringVersion'),drink=drink,
        sourceBlend=str(source.relative_to(P)),sourceBlendSha256=source_sha,
        productBlend=str(scene_path.relative_to(P)),productBlendSha256=sha(scene_path),scriptSha256=sha(Path(__file__)),
        panorama=dict(path=str(PANORAMA.relative_to(P)),sha256=sha(PANORAMA),rotationDegrees=a.environment_rotation,provenance=str(PANORAMA.with_suffix('.provenance.json').relative_to(P))),
        stone=dict(path=str(STONE.relative_to(P)),sha256=sha(STONE),textureMix=.15,baseSRGB='#837c70',roughness=.66,tileMeters=[.60,.30],mirroredRepeat=True,counterTopAuthoredUnits=.035,counterSizeAuthoredUnits=[24,24]),
        estimatedMetersPerAuthoredUnit=S,camera=dict(positionMeters=list(cam.location),rotationEuler=list(cam.rotation_euler),lens=cam.data.lens,fstop=a.fstop,focusMeters=list(focus.location)),
        lights=lights,render=dict(resolution=[900,1125],samples=a.samples,denoise=True,output=str(output.relative_to(P)),completed=False),
        scope='Shared product context with generated environment guided by actual Somma interior north star. Unseen environment directions inferred. Primary source-matched scenes unchanged. No fidelity pass.')
    scene_path.with_suffix('.json').write_text(json.dumps(metadata,indent=2))
    output.with_suffix('.render.json').write_text(json.dumps(metadata,indent=2))
    if a.render:
        start = time.monotonic(); bpy.ops.render.render(write_still=True)
        metadata['render'].update(completed=True,elapsedSeconds=time.monotonic()-start,outputSha256=sha(output))
        scene_path.with_suffix('.json').write_text(json.dumps(metadata,indent=2))
        output.with_suffix('.render.json').write_text(json.dumps(metadata,indent=2))
    assert sha(source) == source_sha, 'Primary source unexpectedly changed'
    print('PRODUCT_STAGE_COMPLETE',json.dumps(metadata))

for drink in ['bbf-negroni','ichigo-negroni','negroni-express'] if a.drink=='all' else [a.drink]: product(drink)
