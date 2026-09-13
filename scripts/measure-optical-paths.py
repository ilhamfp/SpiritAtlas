"""CPU transport measurement of the isolated Somma relative-interface scene.

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
parser.add_argument('--output', default='qa/evidence/blender/v012-hero-optical-path-lengths.json')
args = parser.parse_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
source = ROOT / 'assets/blender/experiments/negroni-express-v012-interfaces-zero-hero.blend'
bpy.ops.wm.open_mainfile(filepath=str(source))
scene = bpy.context.scene
camera = scene.objects['Camera_hero']
depsgraph = bpy.context.evaluated_depsgraph_get()
vertices, triangles, rows = [], [], []
for obj in scene.objects:
    if obj.type != 'MESH' or obj.hide_render:
        continue
    if obj.get('role') == 'recipe' or obj.name.startswith('stage_'):
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
        optical = part in ('glass', 'liquid', 'ice', 'ice_inclusions')
        if optical and abs(ior - 1.0) < .0001:
            continue
        inside = {'liquid': 1, 'glass': 2, 'ice': 3, 'ice_inclusions': 4}.get(part, 0)
        outside = 3 if part == 'liquid' and ior < 1.1 or part == 'ice_inclusions' else 0
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
regions = {'exposed_ice': (300, 260), 'central_liquid': (300, 337),
           'lower_liquid': (300, 414), 'glass_base': (300, 471)}
crop = [.08, .90, .18, .84]
crop_size = [591, 594]
crop_raster_origin = [57, 144]
sample_convention = ('Continuous raster positions measured from the cropped image top-left edge, '
                     'not integer pixel indices. A patch centered at x=300 spans [295,305), '
                     'covering pixel indices 295..304 whose centers are 295.5..304.5. '
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
        floor_distance = (.035 - point.z) / direction.z if direction.z < -.0001 else math.inf
        row = rows[index] if hit is not None else None
        tie = row and row['part'] == 'glass' and abs(floor_distance - distance) <= ray_offset
        local_contact = medium == 0 and direction.z < -.0001 and .035 - 2*ray_offset <= point.z <= .035 + ray_offset
        if local_contact or hit is None or 0 < floor_distance < distance and not tie:
            return dict(lengths=lengths, depth=depth, weight=weight, medium=medium,
                        terminal='floor' if local_contact or 0 < floor_distance < math.inf else 'environment',
                        mismatches=mismatches, sequence=sequence)
        lengths[medium] += distance
        if not row['optical']:
            return dict(lengths=lengths, depth=depth, weight=weight, medium=medium,
                        terminal='opaque', mismatches=mismatches, sequence=sequence)
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
                                 reflection=reflected, point=list(hit)))
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

summaries = {}
for name, center in regions.items():
    paths = [trace((center[0] + random_source.uniform(-5, 5), center[1] + random_source.uniform(-5, 5))) for _ in range(1024)]
    completed = [path for path in paths if path['weight'] > 0]
    liquid_paths = [path['lengths'][1] for path in completed if path['lengths'][1] > 0]
    denominator = sum(path['weight'] for path in paths)
    predictions = {}
    for density in [0, .55, 3.5, 6]:
        coefficient = [(1-color)*density for color in [.985, .30, .025]]
        predictions[str(density)] = [sum(path['weight']*math.exp(-alpha*path['lengths'][1]) for path in paths)/denominator for alpha in coefficient]
    terminals = {}
    for path in paths:
        terminals[path['terminal']] = terminals.get(path['terminal'], 0) + 1
    summaries[name] = dict(cropPixelCenter=center, sampleCount=len(paths),
        liquidPathCount=len(liquid_paths), completedPathCount=len(completed),
        liquidLength=dict(min=min(liquid_paths) if liquid_paths else None, p50=percentile(liquid_paths,.5),
                          p90=percentile(liquid_paths,.9), p99=percentile(liquid_paths,.99), max=max(liquid_paths) if liquid_paths else None),
        neutralTerminalTransmission=predictions, terminalCounts=terminals,
        wrongIncomingCount=sum(len(path['mismatches']) for path in paths),
        escapedInMedium=sum(path['medium'] != 0 and path['terminal'] in ('floor','environment') for path in paths),
        maxDepth=max(path['depth'] for path in paths),
        example=next((path for path in paths if path['weight'] > 0 and path['lengths'][1] > 0), paths[0]))
report = dict(source=str(source.relative_to(ROOT)), sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
    cameraMatrix=[list(row) for row in camera.matrix_world], projectionMatrix=[list(row) for row in projection],
    crop=crop, cropSize=crop_size, cropRasterOrigin=crop_raster_origin,
    baseResolution=base_resolution, sampleCoordinateConvention=sample_convention,
    evaluatedTriangles=len(triangles), samplesPerRegion=1024,
    limitations='CPU geometric normals and exact dielectric directions; no rough microfacet scattering, surface tint, lights, counter texture, Cycles volume stack or radiance evaluated. The tiny ice-inclusion boundary deliberately uses physical relative IOR 1.03/1.31, while the saved Cycles material is 1.03. Liquid-length quantiles are unweighted among completed surviving paths that crossed liquid; they exclude roulette deaths and are not unbiased full-distribution quantiles. Samples are independent of density. Predicted transmission weights all terminal sources equally and is not the expected rendered RGB. Geometric path lengths alone cannot validate Cycles absorption.',
    regions=summaries)
output = ROOT / args.output
output.write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps({name: {k:v for k,v in summary.items() if k != 'example'} for name,summary in summaries.items()}, indent=2))
