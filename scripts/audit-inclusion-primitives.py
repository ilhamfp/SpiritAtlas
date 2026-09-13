"""Read-only fit of authored ice-inclusion components to analytic ellipsoids.

Reports geometric error and containment, not runtime equivalence or GPU speed.
Run under Blender so connectivity and source transforms are read directly.
"""
import bpy
import hashlib
import json
from pathlib import Path
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend'
OUT = ROOT / 'qa/evidence/inclusion-primitive-study.json'
sha = lambda p: hashlib.sha256(p.read_bytes()).hexdigest()
source_hash = sha(SOURCE)
bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
bpy.context.view_layer.update()
ob = bpy.context.scene.objects['ice_inclusions']
ob.data.calc_loop_triangles()
parents = list(range(len(ob.data.vertices)))

def root(i):
    while i != parents[i]:
        parents[i] = parents[parents[i]]
        i = parents[i]
    return i

for face in ob.data.polygons:
    anchor = root(face.vertices[0])
    for vertex in face.vertices[1:]:
        parents[root(vertex)] = anchor
components = {}
for vertex in ob.data.vertices:
    components.setdefault(root(vertex.index), []).append(vertex.index)
assert len(components) == 24, len(components)
world = np.array([tuple(ob.matrix_world @ v.co) for v in ob.data.vertices])
ice = bpy.context.scene.objects['ice_closed_volume']
ice.data.calc_loop_triangles()
ice_tree = BVHTree.FromPolygons([ice.matrix_world @ v.co for v in ice.data.vertices],
                              [tuple(t.vertices) for t in ice.data.loop_triangles], all_triangles=True)
records = []
def parity_from(center, direction):
    origin = Vector(center)
    direction = Vector(direction).normalized()
    crossings = 0
    for _ in range(200):
        hit, _, _, _ = ice_tree.ray_cast(origin, direction)
        if hit is None:
            return crossings
        crossings += 1
        origin = hit + direction * 1e-6
    raise AssertionError('Ice parity ray did not escape.')

for component, indices in components.items():
    points = world[indices]
    center = (points.min(axis=0) + points.max(axis=0)) / 2
    initial_radii = (points.max(axis=0) - points.min(axis=0)) / 2
    normalized = (points - center) / initial_radii
    # Axis-aligned sphere scaling is explicit in the authoring sphere() calls.
    # Fit in centered/scaled coordinates to avoid a badly conditioned world fit.
    design = np.column_stack((normalized ** 2, normalized))
    coefficients, *_ = np.linalg.lstsq(design, np.ones(len(points)), rcond=None)
    diagonal, linear = coefficients[:3], coefficients[3:]
    assert np.all(diagonal > 0)
    shift = -linear / (2 * diagonal)
    factor = 1 + np.sum(diagonal * shift ** 2)
    fitted_center = center + initial_radii * shift
    radii = initial_radii * np.sqrt(factor / diagonal)
    normalized = (points - fitted_center) / radii
    radial_lengths = np.linalg.norm(normalized, axis=1)
    projected = fitted_center + (points - fitted_center) / radial_lengths[:, None]
    vertex_residual = np.linalg.norm(points - projected, axis=1)
    triangles = [t for t in ob.data.loop_triangles if root(t.vertices[0]) == component]
    tri_points = world[[list(t.vertices) for t in triangles]]
    centroid = tri_points.mean(axis=1)
    centroid_radius = np.linalg.norm((centroid - fitted_center) / radii, axis=1)
    centroid_projected = fitted_center + (centroid - fitted_center) / centroid_radius[:, None]
    centroid_deviation = np.linalg.norm(centroid_projected - centroid, axis=1)
    distance_to_ice = ice_tree.find_nearest(Vector(fitted_center))[3]
    # Source glass/ice audits already classify these authored components inside
    # ice. This positive enclosing-ball margin is an additional local check.
    margin = distance_to_ice - float(radii.max())
    assert margin > 1e-5
    parity_counts = [parity_from(fitted_center, d) for d in [(1, .3721, .1246), (-.273, 1, .411), (.173, -.326, 1)]]
    assert all(count % 2 == 1 for count in parity_counts), parity_counts
    records.append(dict(component=len(records), vertices=len(indices), triangles=len(triangles),
                        centerBlenderWorld=fitted_center.tolist(), radiiBlenderWorld=radii.tolist(),
                        centerGltfWorld=[fitted_center[0], fitted_center[2], -fitted_center[1]],
                        radiiGltfWorld=[radii[0], radii[2], radii[1]],
                        maximumSourceVertexRadialProjectionError=float(vertex_residual.max()),
                        maximumTriangleCentroidRadialProjectionDifference=float(centroid_deviation.max()),
                        nearestIceSurfaceDistance=float(distance_to_ice), enclosingBallClearance=float(margin),
                        independentCenterParityCounts=parity_counts))
assert sum(r['triangles'] for r in records) == len(ob.data.loop_triangles)
assert sha(SOURCE) == source_hash
record = dict(source=str(SOURCE.relative_to(ROOT)), sourceSha256=source_hash, scriptSha256=sha(Path(__file__)),
              components=records, componentCount=len(records), inclusionTriangles=len(ob.data.loop_triangles),
              maximumVertexError=max(r['maximumSourceVertexRadialProjectionError'] for r in records),
              maximumCentroidDifference=max(r['maximumTriangleCentroidRadialProjectionDifference'] for r in records),
              minimumIceClearance=min(r['enclosingBallClearance'] for r in records), sourceUnchanged=True,
              scope='CPU representation study only. No GLB, source scene or runtime changes.',
              limits=[
                  'Analytic ellipsoids would recover the intended smooth sphere scaling but differ from the current inscribed triangle surfaces.',
                  'Vertex/centroid radial projection measurements are sampled geometric differences, not a global Hausdorff bound.',
                  'Clearance uses the original closed ice solid and an enclosing sphere, with three generic odd/even ray directions checking each center inside. This assumes the independently audited closed source topology.',
                  'No GPU timing, analytic-intersection numerical validation, transport equivalence or photographic acceptance is claimed.'
              ])
OUT.write_text(json.dumps(record, indent=2))
print(json.dumps({key: record[key] for key in ['componentCount', 'inclusionTriangles', 'maximumVertexError', 'maximumCentroidDifference', 'minimumIceClearance', 'sourceUnchanged']}, indent=2))
