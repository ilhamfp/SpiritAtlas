"""CPU pose search for a plausible nonpenetrating BBF rind, preserving its top height.
Diagnostic only. Does not save or modify any authored source file.
"""
import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parents[1]
bpy.ops.wm.open_mainfile(filepath=str(P/'assets/blender/candidates/v013/bbf-negroni.blend'))
ice=bpy.data.objects['ice'];orange=bpy.data.objects['garnish_orange']
tree=BVHTree.FromPolygons([ice.matrix_world@v.co for v in ice.data.vertices],[list(p.vertices) for p in ice.data.polygons])
center=Vector((-.1,-.08,1.58));points=[orange.matrix_world@v.co for v in orange.data.vertices]
target_top=max(v.z for v in points);sample=points[::48];results=[]
for yi in range(-10,11):
    y=yi*.045
    for ai in range(-14,15):
        angle=ai*.035;rot=Matrix.Rotation(angle,3,'X')
        unshifted=[rot@(p-center)+Vector((-.1,y,1.58)) for p in sample]
        shift=target_top-max(p.z for p in unshifted)
        posed=[p+Vector((0,0,shift)) for p in unshifted]
        radial=max(math.hypot(p.x,p.y) for p in posed)
        if radial>.955:continue
        minimum=100
        for point in posed:
            q,n,_,distance=tree.find_nearest(point);signed=distance if (point-q).dot(n)>=0 else -distance
            minimum=min(minimum,signed)
        results.append(dict(centerY=y,angleXRadians=angle,shiftZ=shift,sampledMinSignedDistance=minimum,maxRadius=radial,poseChange=abs(y+.08)+.5*abs(angle)))
ranked=sorted(results,key=lambda r:(r['sampledMinSignedDistance']<.0005,-min(.001,r['sampledMinSignedDistance']),r['poseChange']))
for candidate in ranked[:12]:
    rot=Matrix.Rotation(candidate['angleXRadians'],3,'X')
    posed=[rot@(p-center)+Vector((-.1,candidate['centerY'],1.58+candidate['shiftZ'])) for p in points]
    minimum=100;inside=0
    for point in posed:
        q,n,_,distance=tree.find_nearest(point);signed=distance if (point-q).dot(n)>=0 else -distance;minimum=min(minimum,signed);inside+=signed<-.000001
    candidate.update(fullMinSignedDistance=minimum,fullInsideVertices=inside,fullMaxRadius=max(math.hypot(p.x,p.y) for p in posed),fullTop=max(p.z for p in posed),fullBottom=min(p.z for p in posed))
out=P/'qa/evidence/blender/v013-orange-seating-search.json';out.write_text(json.dumps(dict(targetTop=target_top,source='assets/blender/candidates/v013/bbf-negroni.blend',constraints='Keep highest world Z; X center fixed; max radial extent below inner glass radius; search only Y position/X tilt, no ice edit.',candidateCount=len(results),bestCandidates=ranked[:12]),indent=2));print(json.dumps(ranked[:12]))
