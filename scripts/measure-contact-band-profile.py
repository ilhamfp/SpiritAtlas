"""CPU physical terminal-object measurement of the true-contact camera patches.

This measures geometric ray lengths, not Cycles radiance or photographic quality.
Actual evaluated triangles and the saved hero camera are used. Opaque surfaces
end a path; absorption predictions assume equal neutral terminal radiance.
"""
import bpy, argparse, sys, json, math, random, hashlib, statistics
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--output')
parser.add_argument('--view', choices=['hero','photo'],default='photo')
parser.add_argument('--samples',type=int,default=128)
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
source = ROOT / 'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
camera = scene.objects['Camera_'+args.view]
depsgraph = bpy.context.evaluated_depsgraph_get()
vertices, triangles, rows = [], [], []
for obj in scene.objects:
    if obj.type != 'MESH' or obj.hide_render:
        continue
    if obj.get('role') == 'recipe':
        continue
    part = obj.get('scenePartId', obj.name)
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    offset = len(vertices)
    vertices.extend(obj.matrix_world @ vertex.co for vertex in mesh.vertices)
    for triangle in mesh.loop_triangles:
        material = mesh.materials[triangle.material_index]
        shader = material.node_tree.nodes.get('Principled BSDF') if material and material.use_nodes else None
        ior = float(shader.inputs['IOR'].default_value) if shader else 1.0
        interface_attribute = mesh.attributes.get('liquid_surface_ior')
        if part == 'liquid' and interface_attribute:
            assert interface_attribute.domain == 'FACE' and interface_attribute.data_type == 'FLOAT'
            ior = float(interface_attribute.data[triangle.polygon_index].value)
        optical = part in ('glass', 'liquid', 'ice', 'ice_inclusions')
        if optical and abs(ior - 1.0) < .0001:
            continue
        inside = {'liquid': 1, 'glass': 2, 'ice': 3, 'ice_inclusions': 4}.get(part, 0)
        outside = 2 if part == 'liquid' and ior < 1.0 else (3 if part == 'liquid' and ior < 1.1 or part == 'ice_inclusions' else 0)
        if part == 'ice_inclusions':
            ior = 1.03 / 1.31
        triangles.append(tuple(offset + index for index in triangle.vertices))
        rows.append(dict(part=part, material=material.name if material else None,
                         ior=ior, optical=optical, inside=inside, outside=outside))
    evaluated.to_mesh_clear()
tree = BVHTree.FromPolygons(vertices, triangles, all_triangles=True)
base_resolution = [720, 900]
projection = camera.calc_matrix_camera(depsgraph, x=base_resolution[0], y=base_resolution[1])
inverse_projection = (projection @ camera.matrix_world.inverted()).inverted()
origin = camera.matrix_world.translation.copy()
ray_offset = .0001
regions = {'exposed_ice': (300, 260), 'central_liquid': (300, 337), 'horizontal_band':(300,384),
           'lower_liquid': (300, 414), 'glass_base': (300, 471),'coaster':(450,480)}
crop = [.08, .90, .18, .84]
crop_size = [591, 594]
crop_raster_origin = [57, 144]
if args.view=='photo':
    regions={'exposed_ice':(350,400),'horizontal_band':(350,501),'lower_liquid':(350,551),'glass_base':(350,597),'coaster':(474,640)}
    crop=False;crop_size=[720,900];crop_raster_origin=[0,0]
sample_convention = ('Continuous raster positions measured from the cropped image top-left edge, '
                     'not integer pixel indices. The 11x11 patch centered at integer x=300 spans [295,306), '
                     'covering pixel indices 295..305 whose centers are 295.5..305.5. '
                     'The same convention applies to y; no additional half-pixel offset is added. '
                     'Full-frame raster position is cropRasterOrigin plus the sample position.')
random_source = random.Random(9130151)

def percentile(values, q):
    if not values:
        return None
    values = sorted(values)
    return values[round((len(values) - 1) * q)]

def trace(pixel):
    # Blender rasterizes the border to integer pixel bounds. Do not stretch the
    # cropped raster back over its fractional border or shift samples by .5.
    u = (crop_raster_origin[0] + pixel[0]) / base_resolution[0]
    v = 1 - (crop_raster_origin[1] + pixel[1]) / base_resolution[1]
    homogeneous = inverse_projection @ Vector((2*u - 1, 2*v - 1, -1, 1))
    point = Vector(homogeneous[:3]) / homogeneous.w
    direction = (point - origin).normalized()
    medium, depth, weight = 0, 0, 1.0
    lengths = [0.0] * 5
    mismatches, sequence = [], []
    while True:
        hit, normal, index, distance = tree.ray_cast(point, direction)
        row = rows[index] if hit is not None else None
        if hit is None:
            return dict(lengths=lengths, depth=depth, weight=weight, medium=medium,
                        terminal='environment',
                        mismatches=mismatches, sequence=sequence)
        lengths[medium] += distance
        if not row['optical']:
            return dict(lengths=lengths, depth=depth, weight=weight, medium=medium,
                        terminal=row['part'], terminalPosition=list(hit), mismatches=mismatches, sequence=sequence)
        side = 1 if direction.dot(normal) < 0 else -1
        normal *= side
        incoming = row['outside'] if side > 0 else row['inside']
        outgoing = row['inside'] if side > 0 else row['outside']
        if medium != incoming:
            mismatches.append(dict(depth=depth, current=medium, expected=incoming, part=row['part']))
        eta = 1 / row['ior'] if side > 0 else row['ior']
        cos_i = max(0, min(1, -direction.dot(normal)))
        k = 1 - eta*eta*(1 - cos_i*cos_i)
        cos_t = math.sqrt(max(0, k))
        fresnel = 1.0 if k < 0 else .5 * (((eta*cos_i-cos_t)/(eta*cos_i+cos_t))**2 + ((cos_i-eta*cos_t)/(cos_i+eta*cos_t))**2)
        reflected = random_source.random() < fresnel
        if len(sequence) < 24:
            sequence.append(dict(part=row['part'], material=row['material'],
                                 distance=distance, incoming=medium, outgoing=outgoing,
                                 reflection=reflected, point=list(hit),geometricNormal=list(normal*side),incomingDirection=list(direction),triangleIndex=index))
        if reflected:
            direction = direction.reflect(normal)
            point = hit + normal * ray_offset
        else:
            direction = (eta*direction + (eta*cos_i-cos_t)*normal).normalized()
            point = hit - normal * ray_offset
            medium = outgoing
            weight *= eta*eta
        depth += 1
        # Compensated roulette bounds expected work without truncating path length.
        if depth > 24:
            if random_source.random() > .9:
                return dict(lengths=lengths, depth=depth, weight=0, medium=medium,
                            terminal='roulette', mismatches=mismatches, sequence=sequence)
            weight /= .9

centers=[(300,y) for y in range(335,431)] if args.view=='hero' else [(350,y) for y in range(460,561)]
profile=[]
for cx,cy in centers:
    paths=[trace((cx+random_source.random(),cy+random_source.random())) for _ in range(args.samples)]
    counts={};examples={};terminal_geometry={}
    for path in paths:
        terminal=path['terminal'];counts[terminal]=counts.get(terminal,0)+1
        if terminal not in examples and not path['mismatches']:examples[terminal]=path
        if terminal in ['stage_square_coaster','stage_counter'] and not path['mismatches']:
            sequence=path['sequence'];signature=' > '.join(f"{s['part']}:{s['incoming']}:{'R' if s['reflection'] else 'T'}:{s['outgoing']}" for s in sequence)
            key=terminal+' | '+signature;terminal_geometry[key]=terminal_geometry.get(key,0)+1
    profile.append({'pixel':[cx,cy],'samples':args.samples,'terminalCounts':counts,'errors':sum(len(path['mismatches']) for path in paths),'terminalOpticalSignatures':terminal_geometry,'examplePerTerminal':examples})
report={'source':str(source.relative_to(ROOT)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'view':args.view,'cameraMatrix':[list(row) for row in camera.matrix_world],'cropSize':crop_size,'cropRasterOrigin':crop_raster_origin,'profile':profile,'method':'Pixel-center column sampled uniformly across each full native pixel, using actual evaluated contact/stage triangles and geometric normals. All terminal classes and representative valid sequences retained, with oriented-independent geometric normals. Fresnel event sampling; no rough microfacet, material tint, diffuse bounce or RGB render prediction.','mediumIds':{'air':0,'liquid':1,'glass':2,'ice':3,'inclusion':4},'limitation':'This probe retains .0001 ray offsets and logs any resulting medium errors. Apparent refracted line positions do not measure physical ice height directly.'}
out=ROOT/(args.output or f'qa/evidence/blender/v012-contact-{args.view}-band-ray-profile.json');out.write_text(json.dumps(report,indent=2));print(json.dumps({'output':str(out.relative_to(ROOT)),'pixels':len(profile),'totalErrors':sum(row['errors'] for row in profile)},indent=2))
