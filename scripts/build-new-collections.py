"""Author six illustrative Martini/Highball assets without rebuilding prior assets.
Blender --background --python-exit-code 1 --python scripts/build-new-collections.py -- --drink all
No renders, network access, or dependency on execution of another generator.
"""
import argparse, bpy, bmesh, hashlib, json, math, random, struct, sys
from pathlib import Path
from mathutils import Vector
ROOT = Path(__file__).resolve().parents[1]
VERSION = 'collections-v1'
SEED = 20260913
MARTINI_ROWS = {'garnish':7.85, 'modifiers':6.15, 'vermouth':4.8, 'spirit':3.35, 'structure':0.0}
HIGHBALL_ROWS = {'modifiers':6.5, 'fizz':4.85, 'spirit':3.35, 'structure':0.0}
CONFIG = {
 'atlas-martini':dict(family='martini',height=2.4,foot=.49,stem=1.37,bowl=[(.065,1.37),(.20,1.57),(.38,1.84),(.57,2.13),(.76,2.40)],fill=2.265,color=(.86,.78,.51,1),garnish='lemon',source='https://atlasbar.sg/storage/app/media/ATLASMartini_Recipe.pdf',note='Undated official recipe specifies Waterford Martini glass and lemon twist; V-profile, crystal pattern, tint and dimensions are illustrative.'),
 'moga-dirty-sake-tini':dict(family='martini',height=2.4,foot=.48,stem=1.40,bowl=[(.075,1.40),(.22,1.46),(.40,1.63),(.54,1.88),(.62,2.14),(.64,2.40)],fill=2.275,color=(.78,.79,.51,1),garnish='ribbon',source='references/new-collections/moga-dirty-sake-tini.jpg',note='Named official October 2024 upload: rounded coupe and folded green-edged ribbon on a pick. Cucumber identity and geometry are illustrative.'),
 'somma-mirkos-martini':dict(family='martini',height=2.4,foot=.53,stem=1.56,bowl=[(.08,1.56),(.28,1.60),(.48,1.73),(.65,1.95),(.72,2.18),(.73,2.4)],fill=2.285,color=(.79,.81,.55,1),garnish='olive',source='references/new-collections/somma-mirkos-martini-2025.jpg',note='Named 2025 photo and cheese/olive reporting inform serving. Exact cheese variety, crisp shape and dimensions are illustrative; photographed splash is not modeled.'),
 'moga-salted-yuzu-highball':dict(family='highball',height=2.78,radius=.50,base=.40,fill=2.55,iceWidth=.52,iceDepth=.54,iceHeight=2.24,iceZ=1.56,color=(.84,.74,.40,1),source='references/new-collections/moga-salted-yuzu-highball.jpg',note='Named official December 2024 upload: tapered tall glass, pale cloudy gold and long clear ice; no separate garnish.'),
 'somma-pine-highball':dict(family='highball',height=2.83,radius=.425,base=.41,fill=2.60,iceWidth=.45,iceDepth=.46,iceHeight=2.29,iceZ=1.535,color=(.70,.71,.45,1),source='references/menus/somma-may2026-cocktail-menu.pdf',note='Menu-based illustration: no individually identified serving photo. Slim glass, pale-gold tint and clear ice are estimated; no garnish is invented.'),
 'jigger-wasabi-highball':dict(family='highball',height=2.80,radius=.47,base=.43,fill=2.57,iceWidth=.51,iceDepth=.48,iceHeight=2.27,iceZ=1.53,color=(.84,.58,.20,1),source='https://images.squarespace-cdn.com/content/v1/55dff4d0e4b023d46479cd47/dbfba9ef-c63d-4d8f-9248-4bbce25c2f10/Wasabi%2BHighball.jpg',note='Current BLOOM photo: near-straight highball and an orange crescent inside glass. Crescent fruit identity is not asserted.'),
}
IDS = list(CONFIG)
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--drink', choices=IDS+['all'], default='all')
parser.add_argument('--output-tag', default='', help='Optional isolated subfolder under both output roots.')
args = parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
if args.output_tag and (not args.output_tag.replace('-','').replace('_','').isalnum()):
 raise ValueError('Output tag must contain letters, digits, hyphens or underscores only.')


def material(name, color, rough=.28, transmission=0, ior=1.45, metal=0):
 mat=bpy.data.materials.new(name);mat.use_nodes=True;mat.diffuse_color=color
 bs=mat.node_tree.nodes.get('Principled BSDF')
 for key,value in [('Base Color',color),('Roughness',rough),('Transmission Weight',transmission),('IOR',ior),('Metallic',metal)]:bs.inputs[key].default_value=value
 return mat


def register(ob, name, mat, category='structure', role='physical', target=None, evidence='visual-observation', representation=None):
 ob.name=name;ob.data.name=name+'_mesh';ob.data.materials.append(mat)
 for face in ob.data.polygons:face.use_smooth=True
 if name!='glass':
  center=Vector([(min(v.co[i] for v in ob.data.vertices)+max(v.co[i] for v in ob.data.vertices))/2 for i in range(3)])
  for v in ob.data.vertices:v.co-=center
  ob.location+=center
 lift=target-ob.location.z if target is not None else 0.0
 props={'scenePartId':name,'ingredientId':category,'role':role,'lift':lift,'assembledPosition':list(ob.location),'expandedPosition':[ob.location.x,ob.location.y,ob.location.z+lift],'evidence':evidence,'authoringVersion':VERSION,'presentationNote':current['note'],'illustrativeScale':True}
 if representation:props['representation']=representation
 if role=='recipe':props.update(label='Illustrative ingredient',quantityUnknown=True,preserveIllustrationColor=True)
 for key,value in props.items():ob[key]=value
 parts.append(ob);return ob


def mesh(name, vertices, faces, mat, **kwargs):
 data=bpy.data.meshes.new(name+'_mesh');data.from_pydata(vertices,[],faces);data.update()
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(data);bm.free()
 ob=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(ob)
 return register(ob,name,mat,**kwargs)


def lathe(name, profile, mat, n=96, **kwargs):
 vertices=[];rings=[];faces=[]
 for radius,z in profile:
  if radius<1e-8:rings.append([len(vertices)]);vertices.append((0,0,z))
  else:
   rings.append(list(range(len(vertices),len(vertices)+n)))
   vertices.extend((radius*math.cos(j*math.tau/n),radius*math.sin(j*math.tau/n),z) for j in range(n))
 for a,b in zip(rings,rings[1:]):
  if len(a)==len(b)==1:continue
  for j in range(n):
   q=(j+1)%n
   faces.append((a[0],b[q],b[j]) if len(a)==1 else (a[j],a[q],b[0]) if len(b)==1 else (a[j],a[q],b[q],b[j]))
 ob=mesh(name,vertices,faces,mat,**kwargs)
 # Planar cap normals do not bend the liquid surface or underside of the foot.
 data=ob.data;data.update();normals=[]
 for face in data.polygons:
  planar=abs(face.normal.z)>.999999
  normals.extend(tuple(face.normal if planar else data.corner_normals[i].vector) for i in face.loop_indices)
 data.normals_split_custom_set(normals)
 return ob


def radius_at(points,z):
 for (ra,za),(rb,zb) in zip(points,points[1:]):
  if za<=z<=zb:return ra+(rb-ra)*(z-za)/(zb-za)
 return points[-1][0]


def grain(vertices, faces, center, scale, n=16, rings=8):
 base=len(vertices);vertices.append((center[0],center[1],center[2]+scale[2]))
 for i in range(1,rings):
  theta=math.pi*i/rings
  for j in range(n):
   phi=math.tau*j/n
   vertices.append(tuple(center[k]+scale[k]*v for k,v in enumerate((math.sin(theta)*math.cos(phi),math.sin(theta)*math.sin(phi),math.cos(theta)))))
 bottom=len(vertices);vertices.append((center[0],center[1],center[2]-scale[2]))
 for j in range(n):
  q=(j+1)%n;faces.append((base,base+1+j,base+1+q));last=base+1+(rings-2)*n;faces.append((bottom,last+q,last+j))
 for i in range(rings-2):
  for j in range(n):a=base+1+i*n+j;b=base+1+i*n+(j+1)%n;faces.append((a,b,b+n,a+n))


def ellipsoid(name,center,scale,mat,**kwargs):
 vertices=[];faces=[];grain(vertices,faces,center,scale,24,12)
 return mesh(name,vertices,faces,mat,**kwargs)


def rounded_box(name,center,dimensions,bevel,mat,**kwargs):
 bpy.ops.mesh.primitive_cube_add(size=1,location=center);ob=bpy.context.object;ob.scale=dimensions
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 mod=ob.modifiers.new('Rounded edges','BEVEL');mod.width=bevel;mod.segments=4
 bpy.ops.object.modifier_apply(modifier=mod.name)
 return register(ob,name,mat,**kwargs)


def tube(name,points,radius,mat,**kwargs):
 vertices=[];faces=[];n=12
 for i,point in enumerate(points):
  tangent=(Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])).normalized()
  axis=Vector((0,0,1)) if abs(tangent.z)<.9 else Vector((0,1,0))
  u=tangent.cross(axis).normalized();v=tangent.cross(u).normalized()
  for j in range(n):vertices.append(tuple(Vector(point)+radius*(u*math.cos(j*math.tau/n)+v*math.sin(j*math.tau/n))))
 for i in range(len(points)-1):
  for j in range(n):a=i*n+j;b=i*n+(j+1)%n;faces.append((a,b,b+n,a+n))
 faces.extend([tuple(reversed(range(n))),tuple((len(points)-1)*n+j for j in range(n))])
 return mesh(name,vertices,faces,mat,**kwargs)


def band(name,centers,width_axes,normal_axes,width,thickness,mat,**kwargs):
 vertices=[];faces=[]
 for point,u,v in zip(centers,width_axes,normal_axes):
  for a,b in [(-1,-1),(1,-1),(1,1),(-1,1)]:vertices.append(tuple(Vector(point)+Vector(u)*width*a/2+Vector(v)*thickness*b/2))
 for i in range(len(centers)-1):
  for j in range(4):faces.append((i*4+j,i*4+(j+1)%4,(i+1)*4+(j+1)%4,(i+1)*4+j))
 faces.extend([(3,2,1,0),tuple(4*(len(centers)-1)+j for j in range(4))])
 return mesh(name,vertices,faces,mat,**kwargs)


def common_lift(group,target):
 bpy.context.view_layer.update();z=[(ob.matrix_world@v.co).z for ob in group for v in ob.data.vertices]
 lift=target-(min(z)+max(z))/2
 for ob in group:
  ob['lift']=lift;ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[ob.location.x,ob.location.y,ob.location.z+lift]
  ob['rigidExpansionGroup']='garnish' if ob['ingredientId']=='garnish' else 'modifier-accent'


def martini_garnish(kind):
 start=len(parts);metal=material('Metal cocktail pick',(.52,.51,.44,1),.2,metal=.85)
 if kind=='lemon':
  centers=[];widths=[];normals=[]
  for i in range(85):
   t=-.8+5.2*i/84
   centers.append((.20+.22*math.cos(t),-.20+.18*math.sin(t),2.46+.055*t))
   widths.append((0,0,1));normals.append((math.cos(t),math.sin(t),0))
  band('garnish_lemon_twist',centers,widths,normals,.12,.014,material('Lemon rind',(.91,.63,.055,1),.4),category='garnish',evidence='official-menu')
 elif kind=='ribbon':
  centers=[];widths=[];normals=[]
  for i in range(81):
   t=-.2+6.0*i/80;radius=.115+.0035*t
   centers.append((-.12, -.12+radius*math.cos(t),2.46+radius*math.sin(t)))
   widths.append((1,0,0));normals.append((0,math.cos(t),math.sin(t)))
  band('garnish_cucumber_ribbon',centers,widths,normals,.32,.012,material('Estimated cucumber flesh',(.68,.75,.35,1),.47),category='garnish',evidence='inferred')
  for sign in [-1,1]:
   edge=[(p[0]+sign*.155,p[1],p[2]) for p in centers]
   band('garnish_green_edge_'+str(sign),edge,widths,normals,.014,.014,material('Estimated cucumber skin '+str(sign),(.16,.25,.025,1),.42),category='garnish',evidence='inferred')
  tube('garnish_pick',[(-.82,-.13,2.43),(.82,-.08,2.43)],.010,metal,category='garnish')
 else:
  tube('garnish_pick',[(-.89,-.08,2.435),(.89,-.08,2.435)],.011,metal,category='garnish')
  ellipsoid('garnish_olive',(.10,-.08,2.435),(.21,.14,.14),material('Green olive',(.27,.34,.065,1),.34),category='garnish')
  for i,x in enumerate([-.31,-.20]):
   ob=rounded_box('garnish_cheese_crisp_'+str(i),(x,-.075,2.435),(.09,.21,.04),.014,material('Historical cheese crisp '+str(i),(.47,.27,.095,1),.58),category='garnish')
   ob.rotation_euler=(.18, .45 if i==0 else -.25, .25)
 common_lift(parts[start:],MARTINI_ROWS['garnish'])


def recipe(category,mat,x=0,scale=1,name=None,target=None):
 profile=[(r*scale,z*scale) for r,z in [(0,-.14),(.17,-.14),(.29,-.09),(.34,-.01),(.29,.10),(.12,.17),(0,.17)]]
 ob=lathe(name or 'recipe_'+category,profile,mat,n=64,category=category,role='recipe',target=rows[category] if target is None else target,evidence='official-menu',representation='illustrative-ingredient')
 ob.location.x=x;ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[x,ob.location.y,ob.location.z+ob['lift']]
 return ob


def highball_accent():
 # Thick orange crescent from the named photo; no fruit identity is asserted.
 outline=[]
 for i in range(41):
  t=-math.pi/2+math.pi*i/40;outline.append((.17*math.cos(t),.34*math.sin(t)))
 outline.extend([(-.035,-.34)])
 vertices=[];n=len(outline)
 for y in [-.365,-.315]:vertices.extend((x-.035,y,z+1.60) for x,z in outline)
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]
 faces.extend((i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n))
 ob=mesh('physical_orange_crescent',vertices,faces,material('Photo orange crescent',(.92,.37,.025,1),.43),category='modifiers',evidence='visual-observation')
 ob['presentationNote']='Orange crescent seen inside the current official photo; specific fruit identity is unverified.'
 common_lift([ob],HIGHBALL_ROWS['modifiers']);return ob


def build_vessel(c):
 glass=material('Clear glass',(1,1,1,1),.025,1,1.51)
 liquid_mat=material('Mixed drink tint',c['color'],.065 if c['family']=='highball' else .035,1,1.36)
 if c['family']=='martini':
  f=c['foot'];s=c['stem'];bowl=c['bowl'];r=bowl[-1][0]
  profile=[(0,.025),(f*.84,.025),(f,.043),(f,.068),(f*.85,.095),(.15,.125),(.057,.20),(.032,.36),(.032,s-.11),(.049,s-.035)]+bowl+[(r-.005,c['height']+.004),(r-.020,c['height'])]+[(max(.02,rr-.022),z-.006) for rr,z in reversed(bowl)]+[(0,s+.025)]
  lathe('glass',profile,glass)
  fluid=[(0,s+.045)]+[(max(.02,rr-.032),z+.004) for rr,z in bowl if s+.035<z<c['fill']]+[(radius_at(bowl,c['fill'])-.032,c['fill']),(0,c['fill'])]
  lathe('liquid',fluid,liquid_mat,role='mixture',category='vermouth')
  martini_garnish(c['garnish'])
 else:
  b=c['base'];r=c['radius'];h=c['height']
  outer=[(b*.87,.055),(b,.095),(b,.17),(b+(r-b)*.28,h*.36),(b+(r-b)*.65,h*.67),(r,h)]
  profile=[(0,.035),(b*.83,.035)]+outer+[(r-.004,h+.003),(r-.024,h)]+[(rr-.024,z) for rr,z in reversed(outer[2:])]+[(b-.043,.195),(0,.195)]
  lathe('glass',profile,glass)
  liquid=lathe('liquid',[(0,.214),(b-.053,.214)]+[(rr-.037,z) for rr,z in outer[2:] if .214<z<c['fill']]+[(radius_at(outer,c['fill'])-.037,c['fill']),(0,c['fill'])],liquid_mat,role='mixture',category='fizz')
  ice=rounded_box('ice',(0,.035,c['iceZ']),(c['iceWidth'],c['iceDepth'],c['iceHeight']),.055,material('Clear rounded ice',(1,1,1,1),.045,1,1.31))
  bpy.context.view_layer.objects.active=liquid;mod=liquid.modifiers.new('Real ice cavity','BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=ice
  bpy.ops.object.modifier_apply(modifier=mod.name)
  # Fine real bubble shells remain with the serving structure at both endpoints.
  vs=[];fs=[]
  for i in range(60):
   a=rng.random()*math.tau;z=rng.uniform(.34,c['fill']-.055);rad=radius_at(outer,z)-.060
   size=rng.uniform(.004,.011);grain(vs,fs,(rad*math.cos(a),rad*math.sin(a),z),(size,size,size),8,5)
  bubbles=mesh('serving_fine_bubbles',vs,fs,material('Fine bubble highlights',(.80,.84,.75,1),.23,.55,1.05),category='structure')
  bubbles['assembledOnly']=True
  if c is CONFIG['jigger-wasabi-highball']:highball_accent()


def recipe_groups(drink):
 pale=material('Illustrative spirit',(.70,.71,.57,1),.25,.25)
 if drink=='moga-dirty-sake-tini':
  recipe('spirit',pale,-.24,.68,'recipe_sake');recipe('spirit',material('Illustrative shochu',(.85,.84,.73,1),.25,.25),.24,.68,'recipe_shochu')
 else:recipe('spirit',pale)
 if current['family']=='martini':
  recipe('vermouth',material('Illustrative vermouth',(.64,.57,.30,1),.23,.2))
  if drink=='atlas-martini':
   recipe('modifiers',material('Illustrative champagne vinegar',(.73,.66,.41,1),.24,.2),-.26,.72,'recipe_champagne_vinegar')
   recipe('modifiers',material('Illustrative orange bitters',(.54,.21,.025,1),.25,.2),.26,.72,'recipe_orange_bitters')
  elif drink=='somma-mirkos-martini':
   recipe('modifiers',material('Illustrative Italicus',(.75,.70,.40,1),.25,.18),-.26,.72,'recipe_italicus')
   recipe('modifiers',material('Illustrative olive brine',(.44,.48,.25,1),.28,.18),.26,.72,'recipe_olive_brine')
  else:recipe('modifiers',material('Illustrative pickling brine',(.53,.57,.35,1),.30,.17))
 else:
  color={'moga-salted-yuzu-highball':(.79,.70,.40,1),'somma-pine-highball':(.51,.64,.37,1),'jigger-wasabi-highball':(.89,.54,.16,1)}[drink]
  ob=recipe('fizz',material('Illustrative carbonated mixer',color,.23,.25))
  vs=[];fs=[]
  for i in range(22):
   angle=rng.random()*math.tau;z=rng.uniform(-.10,.13);rad=.29*math.sqrt(max(.1,1-(z/.19)**2));size=rng.uniform(.013,.025)
   grain(vs,fs,(rad*math.cos(angle),rad*math.sin(angle),z),(size,size,size),8,5)
  detail=mesh('recipe_fizz_bubbles',vs,fs,material('Illustrated mixer bubbles',(.86,.84,.69,1),.30),category='fizz',role='recipe',target=rows['fizz'],evidence='official-menu',representation='illustrative-carbonation');detail['recipeSolid']=True
  if drink=='moga-salted-yuzu-highball':
   recipe('modifiers',material('Illustrative yuzu and seasoning',(.79,.57,.07,1),.38),-.30,.74,'recipe_yuzu_seasoning')
   recipe('modifiers',material('Illustrative buckwheat tea syrup',(.45,.27,.07,1),.3),.30,.74,'recipe_buckwheat_syrup')
  elif drink=='somma-pine-highball':
   ob=ellipsoid('recipe_plum',(-.30,0,0),(.22,.20,.235),material('Illustrative plum',(.20,.04,.065,1),.36),category='modifiers',role='recipe',target=rows['modifiers'],evidence='official-menu',representation='illustrative-plum');ob['recipeSolid']=True
   recipe('modifiers',material('Illustrative orange bitters',(.57,.24,.025,1),.30),.30,.74,'recipe_orange_bitters')
  else:
   ob=recipe('modifiers',material('Illustrative wasabi',(.30,.47,.095,1),.55),-.47,.80,'recipe_wasabi');ob['recipeSolid']=True
   accent=next(p for p in parts if p.name=='physical_orange_crescent')
   accent['expandedOffsetX']=.0 # Its fixed source x stays near center; wasabi is separated to the left.


def patch_nulls(path):
 raw=path.read_bytes();chunks=[];offset=12
 while offset<len(raw):
  length,kind=struct.unpack_from('<II',raw,offset);body=raw[offset+8:offset+8+length];offset+=8+length
  if kind==0x4e4f534a:
   doc=json.loads(body)
   for node in doc.get('nodes',[]):
    if node.get('extras',{}).get('scenePartId'):node['extras'].update(quantity=None,unit=None)
   body=json.dumps(doc,separators=(',',':')).encode();body+=b' '*((-len(body))%4)
  chunks.append(struct.pack('<II',len(body),kind)+body)
 body=b''.join(chunks);path.write_bytes(struct.pack('<4sII',b'glTF',2,len(body)+12)+body)


def build(drink):
 global current,rows,parts,rng
 current=CONFIG[drink];rows=MARTINI_ROWS if current['family']=='martini' else HIGHBALL_ROWS;parts=[];rng=random.Random(SEED+IDS.index(drink))
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for pool in [bpy.data.meshes,bpy.data.materials,bpy.data.cameras,bpy.data.lights]:
  for item in list(pool):
   if item.users==0:pool.remove(item)
 build_vessel(current);recipe_groups(drink)
 scene=bpy.context.scene;scene['authoringVersion']=VERSION;scene['seed']=SEED;scene['source']=current['source'];scene['presentationNote']=current['note'];scene['unitsNote']='Normalized illustrative scale; quantities and units are not asserted.'
 scene.unit_settings.system='NONE'
 bpy.ops.object.camera_add(location=(.16,-7.8,4.0));camera=bpy.context.object;camera.name='Camera_hero';camera.rotation_euler=(Vector((0,0,1.45))-camera.location).to_track_quat('-Z','Y').to_euler();camera.data.lens=65;scene.camera=camera
 for i,(location,power,size) in enumerate([((-3,-4,6),500,4),((3,1,5),350,3)]):
  bpy.ops.object.light_add(type='AREA',location=location);ob=bpy.context.object;ob.name='Editable_area_'+str(i);ob.data.energy=power;ob.data.size=size;ob.rotation_euler=(Vector((0,0,1.4))-ob.location).to_track_quat('-Z','Y').to_euler()
 scene.world.color=(.15,.15,.15);scene.render.engine='CYCLES';scene.cycles.samples=32;scene.view_settings.view_transform='AgX';scene.render.resolution_x=800;scene.render.resolution_y=960;scene.render.resolution_percentage=100
 suffix=Path('candidates')/args.output_tag if args.output_tag else Path()
 source=ROOT/'assets/blender'/suffix/f'{drink}.blend';model=ROOT/'public/models'/suffix/f'{drink}.glb'
 source.parent.mkdir(parents=True,exist_ok=True);model.parent.mkdir(parents=True,exist_ok=True)
 bpy.context.preferences.filepaths.save_version=0
 bpy.ops.wm.save_as_mainfile(filepath=str(source))
 bpy.ops.object.select_all(action='DESELECT')
 for ob in parts:ob.select_set(True)
 bpy.context.view_layer.objects.active=parts[0]
 bpy.ops.export_scene.gltf(filepath=str(model),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True)
 patch_nulls(model)
 bpy.context.view_layer.update();records=[]
 for ob in parts:
  bm=bmesh.new();bm.from_mesh(ob.data)
  bounds=[ob.matrix_world@v.co for v in ob.data.vertices]
  record={key:ob.get(key) for key in ['scenePartId','ingredientId','role','lift','evidence','representation','presentationNote','preserveIllustrationColor','recipeSolid','assembledOnly','rigidExpansionGroup'] if key in ob}
  record.update(id=ob.name,category=ob['ingredientId'],assembledPosition=list(ob.location),expandedPosition=list(ob['expandedPosition']),quantity=None,unit=None,vertices=len(ob.data.vertices),triangles=sum(len(f.vertices)-2 for f in ob.data.polygons),boundaryEdges=sum(e.is_boundary for e in bm.edges),nonManifoldEdges=sum(not e.is_manifold for e in bm.edges),worldBounds=[[min(v[i] for v in bounds) for i in range(3)],[max(v[i] for v in bounds) for i in range(3)]])
  bm.free();records.append(record)
  if record['boundaryEdges'] or record['nonManifoldEdges']:raise RuntimeError(f'Non-closed part {drink}/{ob.name}')
  if any(not math.isfinite(v) for p in bounds for v in p):raise RuntimeError('Non-finite geometry')
  if ob['ingredientId']=='structure' and ob['lift']!=0:raise RuntimeError('Structure lift must remain zero')
 if set(rows)-{o['ingredientId'] for o in parts}:raise RuntimeError('Missing semantic category')
 group=[o['lift'] for o in parts if o['ingredientId']=='garnish']
 if group and max(group)-min(group)>1e-9:raise RuntimeError('Nonrigid garnish expansion')
 local=ROOT/current['source']
 doc=dict(drink=drink,version=VERSION,family=current['family'],seed=SEED,blender=bpy.app.version_string,rows=rows,parameters=current,sourceReference=dict(path=current['source'],sha256=hashlib.sha256(local.read_bytes()).hexdigest() if local.is_file() else None),scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),modelSha256=hashlib.sha256(model.read_bytes()).hexdigest(),modelBytes=model.stat().st_size,parts=records,checks={'finiteGeometry':True,'allPartsClosed':True,'semanticCategoriesComplete':True,'structureStationary':True,'garnishRigid':True},limitations=[current['note'],'Real editable geometry; serving dimensions, material appearance and all recipe-form scales are illustrative.','No offline photographic matching or physically measured optical claim.','Recipe quantities and units remain JSON null. The client supplies current content labels.'])
 source.with_suffix('.json').write_text(json.dumps(doc,indent=2))
 print('COLLECTION_ASSET_READY',drink,len(parts),model.stat().st_size,flush=True)

for selected in IDS if args.drink=='all' else [args.drink]:build(selected)
