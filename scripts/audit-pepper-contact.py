"""Measure Somma garnish surface clearance against its actual tilted ice geometry."""
import bpy, json, hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parents[1]
import argparse,sys
parser=argparse.ArgumentParser();parser.add_argument('--source-tag',default='');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
SOURCE=P/'assets/blender'/('candidates/'+args.source_tag if args.source_tag else '')
scene=SOURCE/'negroni-express.blend';bpy.ops.wm.open_mainfile(filepath=str(scene))
ice=bpy.data.objects['ice'];pepper=bpy.data.objects['garnish_shishito']
tree=BVHTree.FromPolygons([ice.matrix_world@v.co for v in ice.data.vertices],[list(p.vertices) for p in ice.data.polygons],all_triangles=False)
minimum=None;inside=[]
for v in pepper.data.vertices:
    p=pepper.matrix_world@v.co
    q,n,face,distance=tree.find_nearest(p)
    signed=distance if (p-q).dot(n)>=0 else -distance
    if minimum is None or signed<minimum['signedDistance']:minimum={'signedDistance':signed,'pepperVertex':v.index,'pepperPoint':list(p),'nearestIcePoint':list(q),'iceFace':face}
    if signed<-.00001:inside.append(v.index)
version=json.loads((SOURCE/'negroni-express.json').read_text())['version']
result={'version':version,'blendSha256':hashlib.sha256(scene.read_bytes()).hexdigest(),'method':'Exact nearest point on triangulated actual ice surface, oriented surface normal classifies signed distance; convex rounded cube with shallow upper melt dents. All pepper surface vertices checked. This is a contact diagnostic, not optical validation.','pepperVerticesChecked':len(pepper.data.vertices),'insideVertexCount':len(inside),'minimum':minimum,'noPenetratingSampledVertices':not inside}
(P/f'qa/evidence/blender/v{int(version.split(".")[1]):03d}-pepper-contact.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
