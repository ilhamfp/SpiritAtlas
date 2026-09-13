"""Open all editable scenes and report source/runtime geometry and provenance facts."""
import bpy,bmesh,json,hashlib,struct,math
from pathlib import Path
P=Path(__file__).resolve().parents[1];out=[]
import argparse,sys
parser=argparse.ArgumentParser();parser.add_argument('--source-tag',default='');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
SOURCE=P/'assets/blender'/('candidates/'+args.source_tag if args.source_tag else '')
RUNTIME=P/'public/models'/('candidates/'+args.source_tag if args.source_tag else '')

for drink in ['bbf-negroni','ichigo-negroni','negroni-express']:
 path=SOURCE/f'{drink}.blend';bpy.ops.wm.open_mainfile(filepath=str(path));parts=[]
 for ob in bpy.context.scene.objects:
  if ob.type!='MESH' or not ob.get('scenePartId'):continue
  bm=bmesh.new();bm.from_mesh(ob.data)
  boundary=sum(e.is_boundary for e in bm.edges);nonmanifold=sum(not e.is_manifold for e in bm.edges);bm.free()
  parts.append({'id':ob.get('scenePartId'),'name':ob.name,'category':ob.get('ingredientId'),'role':ob.get('role'),'vertices':len(ob.data.vertices),'polygons':len(ob.data.polygons),'boundaryEdges':boundary,'nonManifoldEdges':nonmanifold,'lift':ob.get('lift')})
 params=json.loads((SOURCE/f'{drink}.json').read_text())['parameters'];ice=bpy.data.objects['ice'];radius=max(math.hypot(v.x,v.y) for v in [ice.matrix_world @ x.co for x in ice.data.vertices]);cavity=params['radius']-params['wall']
 runtime=RUNTIME/f'{drink}.glb';data=runtime.read_bytes();length=struct.unpack_from('<I',data,12)[0];gltf=json.loads(data[20:20+length])
 out.append({'drink':drink,'blendOpened':True,'iceMaxWorldRadius':radius,'glassInteriorRadius':cavity,'iceRadialClearance':cavity-radius,'iceClearsGlassWall':radius<cavity,'blender':bpy.app.version_string,'blendSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'glbBytes':len(data),'glbSha256':hashlib.sha256(data).hexdigest(),'glbMeshCount':len(gltf.get('meshes',[])),'cameras':[o.name for o in bpy.context.scene.objects if o.type=='CAMERA'],'parts':parts,'allPartIdsUnique':len({p['id'] for p in parts})==len(parts),'runtimeNodeIds':[n.get('extras',{}).get('scenePartId') for n in gltf.get('nodes',[]) if n.get('extras',{}).get('scenePartId')],'generator':json.loads((SOURCE/f'{drink}.json').read_text())})
(P/('qa/asset-audit-'+args.source_tag+'.json' if args.source_tag else 'qa/asset-audit.json')).write_text(json.dumps(out,indent=2));print('AUDIT',[(r['drink'],r['blendOpened'],r['glbMeshCount'],r['glbBytes']) for r in out])
