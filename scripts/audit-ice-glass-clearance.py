"""CPU exact noncoplanar triangle intersections and signed vertex clearance for ice/glass."""
import bpy, json, hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri
P=Path(__file__).resolve().parents[1]
import argparse,sys
parser=argparse.ArgumentParser();parser.add_argument('--source-tag',default='');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
SOURCE=P/'assets/blender'/('candidates/'+args.source_tag if args.source_tag else '')
RUNTIME=P/'public/models'/('candidates/'+args.source_tag if args.source_tag else '')

def data(ob):
    ob.data.calc_loop_triangles();points=[ob.matrix_world@v.co for v in ob.data.vertices];faces=[tuple(t.vertices) for t in ob.data.loop_triangles]
    return points,faces,BVHTree.FromPolygons(points,faces,all_triangles=True)
def intersects(a,b):
    for source,target in [(a,b),(b,a)]:
        for i in range(3):
            start,end=source[i],source[(i+1)%3];d=end-start
            if d.length_squared<1e-16:continue
            hit=intersect_ray_tri(*target,d,start,True)
            if hit is not None and -1e-7<=(hit-start).dot(d)/d.length_squared<=1+1e-7:return True
    return False
report=[]
for drink in ['bbf-negroni','ichigo-negroni','negroni-express']:
    p=SOURCE/f'{drink}.blend';bpy.ops.wm.open_mainfile(filepath=str(p))
    gv,gf,gb=data(bpy.data.objects['glass']);iv,iff,ib=data(bpy.data.objects['ice'])
    candidates=gb.overlap(ib);hits=[(g,i) for g,i in candidates if intersects([gv[k] for k in gf[g]],[iv[k] for k in iff[i]])]
    distances=[]
    for vertex in iv:
        point,normal,_,distance=gb.find_nearest(vertex);distances.append(distance if (vertex-point).dot(normal)>=0 else -distance)
    report.append(dict(drink=drink,sourceVersion=bpy.context.scene['authoringVersion'],sourceSha256=hashlib.sha256(p.read_bytes()).hexdigest(),bvhCandidatePairs=len(candidates),intersectingTrianglePairs=len(hits),verticesInsideGlass=sum(d<-1e-7 for d in distances),minimumSignedVertexClearance=min(distances),minIceWorldZ=min(v.z for v in iv)))
(P/f'qa/evidence/blender/{args.source_tag or "v011"}-ice-glass-clearance.json').write_text(json.dumps(dict(method='Actual transformed source geometry; BVH candidates narrowed with triangle-edge intersections, plus nearest oriented glass surface signed vertex test. Coplanar overlaps are not separately classified.',drinks=report),indent=2));print(json.dumps(report))
