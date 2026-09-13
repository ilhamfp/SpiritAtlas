"""Project current source dimensions into the exact native hero render pixel space."""
import bpy, json, argparse, sys
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--source-tag',default='');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
SOURCE=P/'assets/blender'/('candidates/'+args.source_tag if args.source_tag else '')
result={}
for drink in ['bbf-negroni','ichigo-negroni','negroni-express']:
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE/f'{drink}.blend'))
    sc=bpy.context.scene;sc.camera=sc.objects['Camera_hero']
    def project(point):
        p=world_to_camera_view(sc,sc.camera,Vector(point))
        return [round(p.x*720-57,2),round((1-p.y)*900-144,2)]
    glass=sc.objects['glass'];height=max(v.co.z for v in glass.data.vertices)
    rim=[project(glass.matrix_world@v.co) for v in glass.data.vertices if v.co.z>height-.002]
    bottom=min(v.co.z for v in glass.data.vertices)
    b=[project(glass.matrix_world@v.co) for v in glass.data.vertices if v.co.z<bottom+.002]
    parts={}
    for ob in sc.objects:
        if ob.type=='MESH' and ob.get('ingredientId')=='garnish':
            pts=[project(ob.matrix_world@v.co) for v in ob.data.vertices]
            parts[ob.name]=[min(p[0] for p in pts),min(p[1] for p in pts),max(p[0] for p in pts),max(p[1] for p in pts)]
    result[drink]={'rimBounds':[min(p[0] for p in rim),min(p[1] for p in rim),max(p[0] for p in rim),max(p[1] for p in rim)],'baseBounds':[min(p[0] for p in b),min(p[1] for p in b),max(p[0] for p in b),max(p[1] for p in b)],'garnishBounds':parts,'camera':list(sc.camera.location),'nativeCropOrigin':[57,144],'baseResolution':[720,900],'note':'Projected geometry, includes occluded rim landmarks. Pixel crop rounding uncertainty <=1px.'}
version=json.loads((SOURCE/'negroni-express.json').read_text())['version'].split('.')[1]
(P/f'qa/evidence/blender/v{int(version):03d}-projected-landmarks.json').write_text(json.dumps(result,indent=2))
print(json.dumps(result))
