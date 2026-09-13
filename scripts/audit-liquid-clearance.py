"""Actual triangle and signed-distance audit of glass/liquid clearance in all scenes."""
import bpy,json,hashlib
from pathlib import Path
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri
P=Path(__file__).resolve().parents[1]
import argparse,sys
parser=argparse.ArgumentParser();parser.add_argument('--source-tag',default='');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
SOURCE=P/'assets/blender'/('candidates/'+args.source_tag if args.source_tag else '')
RUNTIME=P/'public/models'/('candidates/'+args.source_tag if args.source_tag else '')

EPS=1e-7
def mesh_data(ob):
    ob.data.calc_loop_triangles()
    points=[ob.matrix_world@v.co for v in ob.data.vertices]
    faces=[tuple(t.vertices) for t in ob.data.loop_triangles]
    return points,faces,BVHTree.FromPolygons(points,faces,all_triangles=True)
def coplanar_overlap(a,b,normal):
    drop=max(range(3),key=lambda k:abs(normal[k]));axes=[k for k in range(3) if k!=drop]
    aa=[tuple(p[k] for k in axes) for p in a];bb=[tuple(p[k] for k in axes) for p in b]
    def cross(p,q,r):return (q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0])
    def on(p,q,r):return abs(cross(p,q,r))<EPS and min(p[0],q[0])-EPS<=r[0]<=max(p[0],q[0])+EPS and min(p[1],q[1])-EPS<=r[1]<=max(p[1],q[1])+EPS
    for i in range(3):
        p,q=aa[i],aa[(i+1)%3]
        for j in range(3):
            r,s=bb[j],bb[(j+1)%3];u,v,w,x=cross(p,q,r),cross(p,q,s),cross(r,s,p),cross(r,s,q)
            if u*v<0 and w*x<0:return True
            if on(p,q,r) or on(p,q,s) or on(r,s,p) or on(r,s,q):return True
    def inside(p,tri):
        signs=[cross(tri[i],tri[(i+1)%3],p) for i in range(3)]
        return min(signs)>=-EPS or max(signs)<=EPS
    return inside(aa[0],bb) or inside(bb[0],aa)
def intersects(a,b):
    na=(a[1]-a[0]).cross(a[2]-a[0]);nb=(b[1]-b[0]).cross(b[2]-b[0])
    if na.length<EPS or nb.length<EPS:return False
    if na.normalized().cross(nb.normalized()).length<EPS and abs((b[0]-a[0]).dot(na.normalized()))<EPS:return coplanar_overlap(a,b,na)
    for source,target in [(a,b),(b,a)]:
        for i in range(3):
            start,end=source[i],source[(i+1)%3];direction=end-start
            if direction.length_squared<EPS**2:continue
            hit=intersect_ray_tri(*target,direction,start,True)
            if hit is not None and -EPS<=(hit-start).dot(direction)/direction.length_squared<=1+EPS:return True
    return False
report=[]
for drink in ['bbf-negroni','ichigo-negroni','negroni-express']:
    path=SOURCE/f'{drink}.blend';bpy.ops.wm.open_mainfile(filepath=str(path))
    gv,gf,gt=mesh_data(bpy.data.objects['glass']);lv,lf,lt=mesh_data(bpy.data.objects['liquid'])
    candidates=gt.overlap(lt);hits=[]
    for gi,li in candidates:
        if intersects([gv[k] for k in gf[gi]],[lv[k] for k in lf[li]]):hits.append([gi,li])
    distances=[];inside=[]
    for i,p in enumerate(lv):
        q,n,face,d=gt.find_nearest(p);signed=d if (p-q).dot(n)>=0 else -d
        distances.append(signed)
        if signed<-EPS:inside.append(i)
    manifest=json.loads((SOURCE/f'{drink}.json').read_text())
    report.append({'drink':drink,'version':manifest['version'],'blendSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'glassTriangleCount':len(gf),'liquidTriangleCount':len(lf),'bvhCandidatePairs':len(candidates),'intersectingTrianglePairCount':len(hits),'sampleIntersections':hits[:12],'liquidVerticesInsideGlass':len(inside),'minimumSignedSurfaceDistance':min(distances),'noGlassLiquidIntersection':not hits and not inside})
version=report[0]['version'];out=P/f'qa/evidence/blender/v{int(version.split(".")[1]):03d}-liquid-clearance.json'
out.write_text(json.dumps({'method':'Transformed source mesh triangles; BVH overlap candidates narrowed by bounded triangle-edge/ray intersections and explicit coplanar triangle overlap. Every liquid vertex is also classified using nearest oriented glass surface. Signed-distance normal classification is a surface check; triangle intersections are checked independently.','epsilonWorldUnits':EPS,'drinks':report},indent=2));print(json.dumps(report))
