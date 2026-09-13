"""Bake authored garnish bump detail into glTF-compatible tangent normal maps.

Run with Blender in background mode; source candidates are never overwritten.
Uses the source's existing Noise/Bump shading, not invented photographic texture.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path
import struct
import sys
import bpy

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--drink', required=True)
parser.add_argument('--source-tag', default='v014')
parser.add_argument('--output-tag', default='v014-baked')
parser.add_argument('--size', type=int, default=2048)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:])
if args.output_tag == args.source_tag or not args.output_tag:
    parser.error('Use a separate nonempty candidate output tag.')
source_dir = ROOT / 'assets/blender/candidates' / args.source_tag
out_dir = ROOT / 'assets/blender/candidates' / args.output_tag
model_dir = ROOT / 'public/models/candidates' / args.output_tag
out_dir.mkdir(parents=True, exist_ok=True)
model_dir.mkdir(parents=True, exist_ok=True)
source = source_dir / f'{args.drink}.blend'
sha = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
render_settings = (scene.cycles.samples, scene.cycles.device,
                   scene.render.threads_mode, scene.render.threads)
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 1  # Normal baking evaluates shading normals, not lighting paths.
scene.render.threads_mode = 'FIXED'
scene.render.threads = 4
scene.render.bake.use_selected_to_active = False
scene.render.bake.use_clear = True
scene.render.bake.normal_space = 'TANGENT'
scene.render.bake.normal_r = 'POS_X'
scene.render.bake.normal_g = 'POS_Y'
scene.render.bake.normal_b = 'POS_Z'
scene.render.bake.margin = 16
scene.render.bake.margin_type = 'EXTEND'

def has_bump(obj):
    return any(slot.material and slot.material.use_nodes and
               any(n.type == 'BUMP' for n in slot.material.node_tree.nodes)
               for slot in obj.material_slots)

garnishes = [o for o in scene.objects if o.type == 'MESH' and
             o.get('ingredientId') == 'garnish' and has_bump(o)]
if not garnishes:
    raise RuntimeError('Source has no authored garnish bump nodes to bake.')
bpy.ops.object.select_all(action='DESELECT')
for obj in garnishes:
    obj.select_set(True)
bpy.context.view_layer.objects.active = garnishes[0]
# Multi-object packing assigns every garnish surface its own non-overlapping area.
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.009,
                         area_weight=0, correct_aspect=True, scale_to_bounds=True)
bpy.ops.object.mode_set(mode='OBJECT')

image = bpy.data.images.new(f'{args.drink} authored garnish normals',
                           width=args.size, height=args.size, alpha=False)
image.colorspace_settings.name = 'Non-Color'
image.file_format = 'PNG'
image.filepath_raw = str(out_dir / f'{args.drink}-garnish-normal.png')
materials = list({slot.material for obj in garnishes for slot in obj.material_slots
                  if slot.material and slot.material.use_nodes})
for material in materials:
    for node in material.node_tree.nodes:
        node.select = False
    target = material.node_tree.nodes.new('ShaderNodeTexImage')
    target.name = 'Baked authored garnish detail'
    target.image = image
    target.select = True
    material.node_tree.nodes.active = target

bpy.ops.object.bake(type='NORMAL')
image.save()
image.pack()
for material in materials:
    nodes = material.node_tree.nodes
    principled = next(n for n in nodes if n.type == 'BSDF_PRINCIPLED')
    normal = nodes.new('ShaderNodeNormalMap')
    normal.name = 'Portable authored garnish normals'
    normal.uv_map = garnishes[0].data.uv_layers.active.name
    material.node_tree.links.new(nodes['Baked authored garnish detail'].outputs['Color'],
                                 normal.inputs['Color'])
    material.node_tree.links.new(normal.outputs['Normal'], principled.inputs['Normal'])
    material['normalBakeProvenance'] = 'Existing source Noise/Bump evaluated into tangent normals; source nodes retained.'

scene.cycles.samples, scene.cycles.device, scene.render.threads_mode, scene.render.threads = render_settings
scene['garnishNormalBake'] = args.output_tag
bpy.ops.wm.save_as_mainfile(filepath=str(out_dir / f'{args.drink}.blend'))
bpy.ops.object.select_all(action='DESELECT')
for obj in scene.objects:
    if obj.get('scenePartId') and not str(obj.get('scenePartId')).startswith('stage_'):
        obj.select_set(True)
model = model_dir / f'{args.drink}.glb'
bpy.ops.export_scene.gltf(filepath=str(model), export_format='GLB', use_selection=True,
                          export_extras=True, export_apply=True, export_yup=True)
# Blender ID properties cannot store None. Preserve the recipe null contract.
raw = model.read_bytes()
offset = 12
chunks = []
while offset < len(raw):
    length, kind = struct.unpack_from('<II', raw, offset)
    body = raw[offset + 8:offset + 8 + length]
    offset += 8 + length
    if kind == 0x4e4f534a:
        document = json.loads(body)
        for node in document.get('nodes', []):
            extras = node.get('extras', {})
            if extras.get('role') == 'recipe':
                extras.update(quantity=None, unit=None)
        body = json.dumps(document, separators=(',', ':'), ensure_ascii=False).encode()
        body += b' ' * (-len(body) % 4)
    chunks.append(struct.pack('<II', len(body), kind) + body)
payload = b''.join(chunks)
model.write_bytes(struct.pack('<4sII', b'glTF', 2, len(payload) + 12) + payload)
manifest = json.loads((source_dir / f'{args.drink}.json').read_text())
manifest['version'] += '-baked'
manifest['outputTag'] = args.output_tag
manifest['normalBake'] = {
    'script': str(Path(__file__).relative_to(ROOT)), 'scriptSha256': sha(Path(__file__)),
    'sourceBlend': str(source.relative_to(ROOT)), 'sourceBlendSha256': sha(source),
    'sourceVersion': manifest['version'].removesuffix('-baked'),
    'objects': [o.name for o in garnishes], 'normalTextureSize': [args.size, args.size],
    'normalTextureSha256': sha(Path(image.filepath_raw)), 'modelSha256': sha(model),
    'blender': bpy.app.version_string, 'device': 'CPU',
    'method': 'Tangent +X +Y +Z normal bake of existing authored bump shading; shared UV atlas.'
}
(out_dir / f'{args.drink}.json').write_text(json.dumps(manifest, indent=2))
print('GARNISH_BAKE_COMPLETE', json.dumps(manifest['normalBake']))
