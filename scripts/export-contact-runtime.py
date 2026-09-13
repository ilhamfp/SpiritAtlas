"""Export the audited Somma contact boundaries with explicit runtime media.

This assembled-only diagnostic does not overwrite its unified-shader .blend or
any primary model. Standard glTF IOR is a valid standalone preview fallback;
atlasOpticalBoundary extras are authoritative for the custom optical tracer.
"""
import bpy
import hashlib
import json
import struct
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend'
EXPECTED_SOURCE = '69a6d3f226f3d1fb89335035dfff01d49a16c350bb87d8abe0aefaed0e6c42cb'
OUTPUT = ROOT / 'public/models/candidates/v012-contact/negroni-express-interfaces.glb'
EVIDENCE = ROOT / 'qa/evidence/contact-runtime-export'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(SOURCE) == EXPECTED_SOURCE, 'Contact source changed; audit it before export.'
primary_paths = [ROOT / f'{folder}/{drink}.{ext}'
                 for drink in ['bbf-negroni', 'ichigo-negroni', 'negroni-express']
                 for folder, ext in [('assets/blender', 'blend'), ('assets/blender', 'json'), ('public/models', 'glb')]]
primary_before = {str(p.relative_to(ROOT)): sha(p) for p in primary_paths}
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
bpy.context.preferences.filepaths.save_version = 0
scene = bpy.context.scene
bpy.context.view_layer.update()
MEDIUM = {0: ('air', 1.), 1: ('liquid', 1.36), 2: ('glass', 1.51), 3: ('ice', 1.31), 4: ('ice inclusion', 1.03)}
parts = [ob for ob in scene.objects if ob.type == 'MESH' and 'scenePartId' in ob
         and not ob.hide_render and not ob.name.startswith('stage_') and ob.get('role') != 'recipe']
assert {'glass', 'liquid', 'ice', 'ice_inclusions'}.issubset({ob.name for ob in parts})
assert not any(ob.name in ['glass_closed_volume', 'ice_closed_volume'] for ob in parts)

def boundary_material(original, inside, outside, label, omit=False):
    material = bpy.data.materials.new('Contact runtime: ' + label)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get('Principled BSDF')
    previous = original.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = (1, 1, 1, 1)
    bsdf.inputs['Transmission Weight'].default_value = 1
    bsdf.inputs['Roughness'].default_value = previous.inputs['Roughness'].default_value if previous else .02
    bsdf.inputs['IOR'].default_value = 1. if omit else MEDIUM[inside][1]
    material['atlasOpticalBoundary'] = {
        'schemaVersion': 1, 'insideMedium': inside, 'outsideMedium': outside,
        'relativeIOR': MEDIUM[inside][1] / MEDIUM[outside][1],
        'orientation': 'Geometric normal points from insideMedium to outsideMedium.',
        'standardIORRole': 'Valid standalone preview fallback; explicit boundary extras are authoritative.',
        'omitFromOpticalTrace': omit
    }
    return material

# Keep the original mesh and custom-normal fans intact. The earlier v1 removal
# reconstructed tiny waterline slivers and changed their corner normals. This
# version tags the artificial cap for the tracer to skip after loading instead.
ice = scene.objects['ice']
ice.data = ice.data.copy()
ice.data.calc_loop_triangles()
omitted = sum(ice.data.polygons[t.polygon_index].material_index != 0 for t in ice.data.loop_triangles)
assert omitted == 392, omitted
ice.data.materials[0] = boundary_material(ice.data.materials[0], 3, 0, 'ice / air')
ice.data.materials[1] = boundary_material(ice.data.materials[1], 3, 3, 'artificial ice closure — omit', omit=True)

liquid = scene.objects['liquid']
liquid.data = liquid.data.copy()
attribute = liquid.data.attributes['liquid_surface_ior']
assert attribute.domain == 'FACE' and attribute.data_type == 'FLOAT'
original_liquid_material = liquid.data.materials[0]
liquid.data.materials.clear()
outside_by_slot = [0, 2, 3]
for outside in outside_by_slot:
    liquid.data.materials.append(boundary_material(original_liquid_material, 1, outside, 'liquid / ' + MEDIUM[outside][0]))
region_counts = Counter()
for face in liquid.data.polygons:
    candidates = [(abs(attribute.data[face.index].value - 1.36 / MEDIUM[outside][1]), slot, outside)
                  for slot, outside in enumerate(outside_by_slot)]
    difference, slot, outside = min(candidates)
    assert difference < 1e-7, (face.index, difference)
    face.material_index = slot
    region_counts[MEDIUM[outside][0]] += 1
assert dict(region_counts) == {'glass': 1728, 'ice': 6837, 'air': 1343}, dict(region_counts)

for name, inside, outside in [('glass', 2, 0), ('ice_inclusions', 4, 3)]:
    ob = scene.objects[name]
    ob.data = ob.data.copy()
    material = boundary_material(ob.data.materials[0], inside, outside, name + ' / ' + MEDIUM[outside][0])
    ob.data.materials.clear()
    ob.data.materials.append(material)
    for face in ob.data.polygons:
        face.material_index = 0

# An independent reader can match oriented world triangles and shading normals
# without relying on Blender export order. Coordinate transform is glTF Y-up.
def y_up(v):
    return (v.x, v.z, -v.y)

OUTPUT.parent.mkdir(parents=True, exist_ok=True)
EVIDENCE.mkdir(parents=True, exist_ok=True)
binary = EVIDENCE / 'source-optical-triangles.f32'
objects = []
with binary.open('wb') as stream:
    for ob in sorted(parts, key=lambda x: x.name):
        record = dict(name=ob.name, scenePartId=ob['scenePartId'], role=ob.get('role'), materials=[m.name for m in ob.data.materials])
        objects.append(record)
        if ob.name not in ['glass', 'liquid', 'ice', 'ice_inclusions']:
            continue
        ob.data.calc_loop_triangles()
        record['sourceOpticalTriangleStart'] = stream.tell() // (22 * 4)
        record['sourceOpticalTriangleCount'] = len(ob.data.loop_triangles)
        normal_matrix = ob.matrix_world.to_3x3().inverted().transposed()
        for triangle in ob.data.loop_triangles:
            face = ob.data.polygons[triangle.polygon_index]
            boundary = ob.data.materials[face.material_index]['atlasOpticalBoundary']
            vertices = [value for vertex in triangle.vertices for value in y_up(ob.matrix_world @ ob.data.vertices[vertex].co)]
            normals = [value for loop in triangle.loops for value in y_up((normal_matrix @ ob.data.corner_normals[loop].vector).normalized())]
            if not boundary['omitFromOpticalTrace']:
                stream.write(struct.pack('<22f', *vertices, *normals, boundary['relativeIOR'], boundary['insideMedium'], boundary['outsideMedium'], len(objects)-1))
        record['sourceOpticalTriangleCount'] = stream.tell() // (22 * 4) - record['sourceOpticalTriangleStart']

scene['atlasOpticalMedia'] = {str(key): {'name': value[0], 'ior': value[1]} for key, value in MEDIUM.items()}
scene['atlasOpticalRepresentation'] = 'Assembled contact-boundary diagnostic; skip material omitFromOpticalTrace; hidden complete glass/ice excluded; no expansion support.'
bpy.ops.object.select_all(action='DESELECT')
for ob in parts:
    ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUTPUT), export_format='GLB', use_selection=True,
                          export_extras=True, export_apply=True, export_yup=True)
assert sha(SOURCE) == EXPECTED_SOURCE
assert {str(p.relative_to(ROOT)): sha(p) for p in primary_paths} == primary_before
record = dict(
    source=str(SOURCE.relative_to(ROOT)), sourceSha256=EXPECTED_SOURCE, scriptSha256=sha(Path(__file__)),
    output=str(OUTPUT.relative_to(ROOT)), outputSha256=sha(OUTPUT), bytes=OUTPUT.stat().st_size,
    blenderVersion=bpy.app.version_string, blenderBuildHash=bpy.app.build_hash.decode(),
    opticalMediums={key: {'name': value[0], 'ior': value[1]} for key, value in MEDIUM.items()},
    exportRevision=2, liquidFaceCounts=dict(region_counts), taggedUnityIceClosureTriangles=omitted,
    excludedCompleteSolids=['glass_closed_volume', 'ice_closed_volume'], objects=objects,
    triangleEvidence=dict(path=str(binary.relative_to(ROOT)), sha256=sha(binary),
                          rowFormat='22 little-endian float32: position[3][3], normal[3][3], relativeIOR, insideMedium, outsideMedium, objectIndex',
                          coordinateSpace='World-space glTF Y-up', rows=binary.stat().st_size // 88),
    sourceAndPrimaryFilesUnchanged=True, primaryHashes=primary_before,
    limitations=[
        'Assembled diagnostic only. Separated glass and ice need complete closed physical surfaces with appropriate air interfaces.',
        'Custom optical tracer must consume material atlasOpticalBoundary extras; standard glTF IOR is only a valid fallback.',
        'Original ice mesh is retained. Tracer must skip 392 triangles tagged omitFromOpticalTrace; the actual interface belongs to liquid.',
        'The source already contains zero corner normals on tiny waterline slivers; glTF supplies unit-normal fallbacks. Independent audit must separate these from newly introduced errors.',
        'No volume absorption or source lighting is inferred from glTF surface color; the runtime must explicitly configure medium absorption.',
        'Inclusion boundary uses 1.03/1.31 as the existing CPU/browser model. Saved Cycles inclusion shader remains unchanged at 1.03.',
        'Garnish is the contact study v0.12 source, not the promoted v0.15.1 baked garnish. No source or browser photographic gate is passed.'
    ])
(EVIDENCE / 'manifest.json').write_text(json.dumps(record, indent=2))
print(json.dumps({key: record[key] for key in ['output', 'outputSha256', 'bytes', 'liquidFaceCounts', 'taggedUnityIceClosureTriangles', 'sourceAndPrimaryFilesUnchanged']}, indent=2))
