"""Inspect garnish vertex clearance against actual ice; no asset mutation."""
import bpy,json,argparse,sys,hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--source-tag',default='v013');a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
report=[]
for drink,part in [('bbf-negroni','garnish_orange'),('ichigo-negroni','garnish_red_round'),('negroni-express','garnish_shishito')]:
    path=P/'assets/blender/candidates'/a.source_tag/f'{drink}.blend';bpy.ops.wm.open_mainfile(filepath=str(path))
    ice=bpy.data.objects['ice'];garnish=bpy.data.objects[part]
    tree=BVHTree.FromPolygons([ice.matrix_world@v.co for v in ice.data.vertices],[list(p.vertices) for p in ice.data.polygons])
    values=[]
    for vertex in garnish.data.vertices:
        point=garnish.matrix_world@vertex.co;q,n,_,d=tree.find_nearest(point);values.append(d if (point-q).dot(n)>=0 else -d)
    report.append(dict(drink=drink,part=part,sourceSha256=hashlib.sha256(path.read_bytes()).hexdigest(),vertices=len(values),insideIceVertices=sum(v<-1e-6 for v in values),minimumSignedDistance=min(values)))
(P/f'qa/evidence/blender/{a.source_tag}-garnish-ice-contact.json').write_text(json.dumps(dict(method='Actual transformed mesh vertices and nearest oriented ice surface. Signed-vertex diagnostic only; not full triangle intersection proof.',drinks=report),indent=2));print(json.dumps(report))
