"""Bounded deterministic espresso collection authoring; no reference-image billboards.
Blender --background --python-exit-code 1 --python scripts/build-espresso-assets.py
Only the three new IDs are written. No offline render is performed.
"""
import bpy, bmesh, math, random, json, hashlib, struct, argparse, sys
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parents[1]
VERSION='espresso-v2-visibility'; SEED=20260913
IDS=['atlas-espresso-martini','jigger-espresso-martini','nighthawks']
parser=argparse.ArgumentParser();parser.add_argument('--drink',choices=IDS+['all'],default='all')
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
ROWS={'garnish':7.85,'modifiers':6.,'coffee':4.9,'liqueur':3.85,'spirit':2.8,'structure':1.2}
CONFIG={
 'atlas-espresso-martini':dict(photo='atlas-2024.jpg',height=2.42,radius=.55,foot=.49,stem=1.29,bowl=[(.10,1.30),(.20,1.39),(.32,1.53),(.42,1.72),(.49,1.95),(.535,2.19),(.55,2.42)],fill=2.17,foam=2.395,foamColor=(.86,.79,.63,1)),
 'jigger-espresso-martini':dict(photo='jigger-2024.jpg',height=2.40,radius=.76,foot=.56,stem=1.55,bowl=[(.10,1.55),(.26,1.63),(.44,1.75),(.59,1.92),(.69,2.13),(.745,2.30),(.76,2.40)],fill=2.335,foam=2.39,foamColor=(.74,.54,.31,1)),
 'nighthawks':dict(photo='nighthawks-2024.jpg',height=2.42,radius=.67,foot=.53,stem=1.29,bowl=[(.11,1.31),(.27,1.40),(.42,1.57),(.51,1.78),(.56,2.01),(.59,2.20),(.67,2.42)],fill=2.17,foam=2.405,foamColor=(.86,.80,.68,1)),
}

def material(name,color,rough=.3,transmission=0,ior=1.45,metal=0):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=color
 bs=m.node_tree.nodes.get('Principled BSDF')
 for key,value in [('Base Color',color),('Roughness',rough),('Transmission Weight',transmission),('IOR',ior),('Metallic',metal)]:bs.inputs[key].default_value=value
 return m

def register(ob,name,mat,category='structure',role='physical',target=None,evidence='visual-observation',representation=None):
 ob.name=name;ob.data.materials.append(mat)
 for face in ob.data.polygons:face.use_smooth=True
 # Keep assembled geometry at its authored location; origin at actual bound center
 # makes source/runtime expandedPosition a legible category center.
 if name!='glass':
  coords=[v.co for v in ob.data.vertices];center=Vector([(min(v[i] for v in coords)+max(v[i] for v in coords))/2 for i in range(3)])
  for vertex in ob.data.vertices:vertex.co-=center
  ob.location+=center
 lift=(target-ob.location.z) if target is not None else 0.
 ob['scenePartId']=name;ob['ingredientId']=category;ob['role']=role;ob['lift']=lift
 ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[ob.location.x,ob.location.y,ob.location.z+lift]
 ob['evidence']=evidence;ob['authoringVersion']=VERSION
 if representation:ob['representation']=representation
 if role=='recipe':ob['label']='Unknown' if evidence=='unverified' else 'Illustrative ingredient';ob['quantityUnknown']=True
 parts.append(ob);return ob

def mesh(name,verts,faces,mat,**kw):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
 ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob)
 return register(ob,name,mat,**kw)

def profile_smooth(points,steps=5):
 # Local Catmull-Rom sampling; input is an authored outline, not measured glassware.
 out=[]
 for i in range(len(points)-1):
  p0=Vector(points[max(0,i-1)]);p1=Vector(points[i]);p2=Vector(points[i+1]);p3=Vector(points[min(len(points)-1,i+2)])
  for j in range(steps):
   t=j/steps;v=.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t*t*t)
   out.append((max(0,v.x),v.y))
 return out+[points[-1]]

def lathe(name,profile,mat,n=112,**kw):
 vs=[];faces=[];rings=[]
 for r,z in profile:
  if r<1e-7:rings.append([len(vs)]);vs.append((0,0,z))
  else:
   rings.append(list(range(len(vs),len(vs)+n)));vs.extend((r*math.cos(j*math.tau/n),r*math.sin(j*math.tau/n),z) for j in range(n))
 for left,right in zip(rings,rings[1:]):
  if len(left)==len(right)==1:continue
  for j in range(n):
   k=(j+1)%n
   faces.append((left[0],right[k],right[j]) if len(left)==1 else (left[j],left[k],right[0]) if len(right)==1 else (left[j],left[k],right[k],right[j]))
 ob=mesh(name,vs,faces,mat,**kw)
 # Explicit planar caps keep the stem foot and coffee planes flat.
 me=ob.data;me.update();normals=[]
 for face in me.polygons:
  planar=abs(face.normal.z)>.999999
  normals.extend(tuple(face.normal if planar else me.corner_normals[i].vector) for i in face.loop_indices)
 me.normals_split_custom_set(normals)
 return ob

def radius_at(c,z):
 pts=c['bowl']
 for (ra,za),(rb,zb) in zip(pts,pts[1:]):
  if za<=z<=zb:return ra+(rb-ra)*(z-za)/(zb-za)
 return pts[-1][0]

def add_ellipsoid(vs,fs,center,scale,n=12,m=6):
 start=len(vs)
 for i in range(m+1):
  theta=math.pi*i/m
  for j in range(n):
   phi=math.tau*j/n;vs.append(tuple(center[k]+scale[k]*v for k,v in enumerate((math.sin(theta)*math.cos(phi),math.sin(theta)*math.sin(phi),math.cos(theta)))))
 for i in range(m):
  for j in range(n):k=start+i*n+j;q=start+i*n+(j+1)%n;fs.append((k,q,q+n,k+n))

def foam(c,mat,mixture=False):
 r=radius_at(c,c['foam'])-.014;z=c['foam'];bottom=c['fill']+.001;n=112;nr=20;vs=[(0,0,z+.005)];fs=[]
 for i in range(1,nr+1):
  rad=r*i/nr
  for j in range(n):
   a=math.tau*j/n;h=.005*(1-(rad/r)**2)+.0015*math.sin(27*rad+8*a)*math.sin(19*rad-11*a)*(rad/r)
   vs.append((rad*math.cos(a),rad*math.sin(a),z+h))
 for j in range(n):fs.append((0,1+j,1+(j+1)%n))
 for i in range(nr-1):
  for j in range(n):a=1+i*n+j;b=1+i*n+(j+1)%n;fs.append((a,b,b+n,a+n))
 bottom_r=radius_at(c,bottom)-.016
 low=len(vs);vs.extend((bottom_r*math.cos(j*math.tau/n),bottom_r*math.sin(j*math.tau/n),bottom) for j in range(n));center=len(vs);vs.append((0,0,bottom))
 for j in range(n):q=(j+1)%n;a=1+(nr-1)*n+j;b=1+(nr-1)*n+q;fs.extend([(a,low+j,low+q,b),(center,low+q,low+j)])
 ob=mesh('crema' if mixture else 'foam',vs,fs,mat,category='coffee' if mixture else 'modifiers',role='mixture' if mixture else 'physical',target=None if mixture else ROWS['modifiers'],evidence='visual-observation' if mixture else 'official-menu')
 if not mixture:
  vs=[];fs=[]
  for i in range(130):
   a=rng.random()*math.tau;rad=r*math.sqrt(rng.random())*.97;s=rng.uniform(.003,.010)
   add_ellipsoid(vs,fs,(rad*math.cos(a),rad*math.sin(a),z+.001),(s,s,s*.45),8,4)
  detail=mesh('foam_bubbles',vs,fs,mat,category='modifiers',target=None,evidence='visual-observation')
  # One identical displacement keeps physical topping detail attached to its foam.
  detail['lift']=ob['lift'];detail['expandedPosition']=[detail.location.x,detail.location.y,detail.location.z+ob['lift']]
 return ob

def cinnamon(c,mat):
 vs=[];fs=[];r=radius_at(c,c['foam'])-.025
 for i in range(670):
  a=rng.random()*math.tau;rad=r*math.sqrt(rng.random());x=rad*math.cos(a);y=rad*math.sin(a);z=c['foam']+.006;s=rng.uniform(.0018,.006)
  k=len(vs);vs.extend([(x-s,y-s*.3,z),(x+s,y-s*.2,z+.001),(x+s*.5,y+s*.6,z),(x-s*.5,y+s*.4,z+.001)])
  fs.append((k,k+1,k+2,k+3))
 return mesh('garnish_cinnamon',vs,fs,mat,category='garnish',target=ROWS['garnish'],evidence='official-menu')

def cacao_tuile(c,mat):
 # A real thin irregular disc with open perforations, not an alpha image.
 n=66;radius=.555;holes=[(rng.uniform(-.43,.43),rng.uniform(-.43,.43),rng.uniform(.015,.043)) for _ in range(35)]
 cells=[]
 for iy in range(n):
  for ix in range(n):
   x=(ix+.5-n/2)*radius*2/n;y=(iy+.5-n/2)*radius*2/n;a=math.atan2(y,x)
   if math.hypot(x,y)>radius*(1+.025*math.sin(11*a)+.016*math.cos(23*a)):continue
   if any((x-hx)**2+(y-hy)**2<hr*hr for hx,hy,hr in holes):continue
   cells.append((ix,iy))
 points={};vs=[];fs=[];edge={}
 def v(ix,iy,side):
  key=(ix,iy,side)
  if key not in points:
   x=(ix-n/2)*radius*2/n;y=(iy-n/2)*radius*2/n;z=c['foam']+.009+.012*(x*x+y*y)/(radius*radius)+.004*math.sin(15*x+4*y)*math.sin(11*y)+side*.009
   points[key]=len(vs);vs.append((x,y,z))
  return points[key]
 for ix,iy in cells:
  corners=[(ix,iy),(ix+1,iy),(ix+1,iy+1),(ix,iy+1)]
  fs.extend([tuple(v(x,y,1) for x,y in corners),tuple(v(x,y,0) for x,y in reversed(corners))])
  for a,b in zip(corners,corners[1:]+corners[:1]):
   key=tuple(sorted((a,b)));edge[key]=edge.get(key,0)+1
 for (a,b),count in edge.items():
  if count==1:fs.append((v(*a,0),v(*b,0),v(*b,1),v(*a,1)))
 ob=mesh('garnish_cacao_tuile',vs,fs,mat,category='garnish',target=ROWS['garnish'],evidence='official-menu')
 vs=[];fs=[]
 for i in range(27):
  ang=rng.random()*math.tau;rr=rng.uniform(.09,.48);x=rr*math.cos(ang);y=rr*math.sin(ang)
  if any((x-hx)**2+(y-hy)**2<(hr+.025)**2 for hx,hy,hr in holes):continue
  add_ellipsoid(vs,fs,(x,y,c['foam']+.038),(rng.uniform(.012,.025),rng.uniform(.009,.018),.012),8,4)
 nib=mesh('garnish_cacao_texture',vs,fs,mat,category='garnish',evidence='visual-observation');nib['lift']=ob['lift'];nib['expandedPosition']=[*nib.location[:2],nib.location.z+ob['lift']]

def nighthawk_garnish(c,feather_mat,seal_mat):
 z=c['fill']+.035;vs=[];fs=[]
 # Central shaft and individually tapered vanes preserve the dated silhouette.
 for i in range(110):
  t=i/109;cx=-1.10+2.25*t;cy=-.43+.32*t;cz=z+.02+.18*t*t
  width=.13*(math.sin(math.pi*t)**.6)*(1-.25*t)
  for side in (-1,1):
   k=len(vs);vs.extend([(cx,cy,cz),(cx+.12,cy+side*width,cz+.004+side*.012),(cx+.035,cy+side*width*.87,cz+.002),(cx-.016,cy,cz)])
   fs.append((k,k+1,k+2,k+3))
 feather=mesh('garnish_feather',vs,fs,feather_mat,category='garnish',evidence='visual-observation')
 shaft=lathe('garnish_quill',[(0,0),(.010,0),(.009,1.75),(.002,2.26),(0,2.28)],feather_mat,n=12,category='garnish')
 # Rotate its local Z into the observed long horizontal direction.
 direction=Vector((2.25,.32,.18)).normalized()
 shaft.rotation_euler=direction.to_track_quat('Z','Y').to_euler();shaft.location=Vector((-1.10,-.43,z+.02))+direction*1.14
 seal=lathe('garnish_chocolate_seal',[(0,-.012),(.175,-.012),(.19,0),(.175,.018),(0,.018)],seal_mat,n=72,category='garnish')
 seal.rotation_euler=(math.pi/2,0,-.12);seal.location=(.15,-.565,z-.09)
 # Generic raised concentric imprint; exact brand insignia is not reconstructed.
 ring=lathe('garnish_seal_imprint',[(.142,0),(.152,.005),(.157,.012),(.151,.018),(.142,.01),(.142,0)],seal_mat,n=72,category='garnish')
 ring.rotation_euler=seal.rotation_euler;ring.location=seal.location+Vector((0,-.025,0))
 group=[feather,shaft,seal,ring];bounds=[]
 bpy.context.view_layer.update()
 for ob in group:bounds.extend((ob.matrix_world@v.co).z for v in ob.data.vertices)
 lift=ROWS['garnish']-(min(bounds)+max(bounds))/2
 for ob in group:
  ob['lift']=lift;ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[ob.location.x,ob.location.y,ob.location.z+lift]
  ob['appearanceDate']='2024-04-04';ob['uncertainty']='Dated serving photograph; current garnish treatment and attachment are unverified.'

def recipe(category,mat,unknown=False):
 if unknown:
  bpy.ops.mesh.primitive_cube_add(size=1);ob=bpy.context.object;ob.scale=(.55,.55,.34);bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
  bevel=ob.modifiers.new('Soft illustrative edges','BEVEL');bevel.width=.07;bevel.segments=4;bpy.ops.object.modifier_apply(modifier=bevel.name)
  register(ob,'recipe_'+category,mat,category=category,role='recipe',target=ROWS[category],evidence='unverified',representation='unknown-placeholder')
 else:
  ob=lathe('recipe_'+category,[(0,-.13),(.17,-.13),(.30,-.07),(.32,.025),(.26,.115),(.10,.15),(0,.15)],mat,n=64,category=category,role='recipe',target=ROWS[category],evidence='official-menu',representation='illustrative-ingredient')
 return ob

def closed_grain(vs,fs,center,scale,n=10,m=5):
 # True pole fans and shared rings: each enlarged granule is a closed solid.
 start=len(vs);vs.append((center[0],center[1],center[2]+scale[2]))
 for i in range(1,m):
  theta=math.pi*i/m
  for j in range(n):
   phi=math.tau*j/n;vs.append(tuple(center[k]+scale[k]*v for k,v in enumerate((math.sin(theta)*math.cos(phi),math.sin(theta)*math.sin(phi),math.cos(theta)))))
 bottom=len(vs);vs.append((center[0],center[1],center[2]-scale[2]))
 for j in range(n):
  q=(j+1)%n;fs.append((start,start+1+j,start+1+q));last=start+1+(m-2)*n;fs.append((bottom,last+q,last+j))
 for i in range(m-2):
  for j in range(n):a=start+1+i*n+j;b=start+1+i*n+(j+1)%n;fs.append((a,b,b+n,a+n))

def solid_recipe_metadata(ob,label,note):
 ob['recipeSolid']=True;ob['label']=label;ob['presentationNote']=note
 ob['illustrativeScale']=True;ob['servingShapeClaim']=False
 return ob

def cinnamon_illustration():
 # This solid enlarged powder specimen appears only during exploration.
 # The original individual surface flecks remain completely unchanged.
 local_rng=random.Random(SEED+731);n=64;nr=16;radius=.375
 vs=[(0,0,.14)];fs=[]
 def height(rad,angle):return -.13+.27*(1-(rad/radius)**1.25)+.004*math.sin(angle*9+rad*23)*(rad/radius)
 for i in range(1,nr+1):
  rad=radius*i/nr
  for j in range(n):
   angle=math.tau*j/n;vs.append((rad*math.cos(angle),rad*math.sin(angle),height(rad,angle)))
 for j in range(n):fs.append((0,1+j,1+(j+1)%n))
 for i in range(nr-1):
  for j in range(n):a=1+i*n+j;b=1+i*n+(j+1)%n;fs.append((a,b,b+n,a+n))
 low=len(vs);vs.extend((radius*math.cos(j*math.tau/n),radius*math.sin(j*math.tau/n),-.16) for j in range(n));bottom=len(vs);vs.append((0,0,-.16))
 for j in range(n):q=(j+1)%n;top=1+(nr-1)*n;fs.extend([(top+j,low+j,low+q,top+q),(bottom,low+q,low+j)])
 for i in range(110):
  angle=local_rng.random()*math.tau;rad=.345*math.sqrt(local_rng.random());s=local_rng.uniform(.010,.022)
  closed_grain(vs,fs,(rad*math.cos(angle),rad*math.sin(angle),height(rad,angle)),(s,s*.85,s*.65))
 ob=mesh('recipe_cinnamon',vs,fs,material('Enlarged ground cinnamon',(.30,.090,.022,1),.8),category='garnish',role='recipe',target=ROWS['garnish'],evidence='official-menu',representation='illustrative-enlarged-ground-cinnamon')
 solid_recipe_metadata(ob,'Cinnamon · enlarged illustration','Closed ground-cinnamon mound and enlarged granules for readable exploration; not a measured serving amount or a cinnamon stick.')
 next(o for o in parts if o.name=='garnish_cinnamon')['assembledOnly']=True

def nighthawk_modifier_illustrations():
 # Current menu ingredients, shown as representative forms rather than asserted
 # physical layers or a claim about the exact chocolate/MSG preparation.
 bpy.ops.mesh.primitive_cube_add(size=1);ob=bpy.context.object;ob.scale=(.38,.28,.17)
 bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 bevel=ob.modifiers.new('Illustrative chocolate soft edges','BEVEL');bevel.width=.032;bevel.segments=4;bpy.ops.object.modifier_apply(modifier=bevel.name)
 ob=register(ob,'recipe_chocolate',material('Illustrative chocolate piece',(.11,.030,.010,1),.52),category='modifiers',role='recipe',target=ROWS['modifiers'],evidence='official-menu',representation='illustrative-chocolate-piece')
 ob.location.x=-1.04;ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[-1.04,ob.location.y,ROWS['modifiers']]
 solid_recipe_metadata(ob,'Chocolate · illustration','Illustrative chocolate form; chocolate type and physical preparation are unspecified by the menu. Distinct from the dated garnish seal.')
 vs=[];fs=[];centers=[(-.13,-.045,-.015),(-.04,.07,.025),(.075,-.065,.01),(.13,.04,-.005),(-.025,-.07,.075),(.035,.025,.11)]
 for i,center in enumerate(centers):
  start=len(vs);angle=.45+i*.61;long=.15+(i%3)*.015;short=.034
  # Rectangular elongated crystals with real closed prism sides.
  for z in (-.028,.028):
   for x,y in [(-long/2,-short/2),(long/2,-short/2),(long/2,short/2),(-long/2,short/2)]:vs.append((center[0]+x*math.cos(angle)-y*math.sin(angle),center[1]+x*math.sin(angle)+y*math.cos(angle),center[2]+z))
  fs.extend(tuple(start+j for j in face) for face in [(3,2,1,0),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)])
 ob=mesh('recipe_msg',vs,fs,material('Enlarged MSG crystals',(.86,.82,.69,1),.63),category='modifiers',role='recipe',target=ROWS['modifiers'],evidence='official-menu',representation='illustrative-enlarged-msg-crystals')
 ob.location.x=1.04;ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[1.04,ob.location.y,ROWS['modifiers']]
 solid_recipe_metadata(ob,'MSG · enlarged illustration','Enlarged representative crystals for readability; crystal dimensions, serving amount and preparation are not inferred from the photograph.')

def expanded_group_tilt(names):
 for ob in parts:
  if ob.name in names:
   ob['expandedRotationX']=.45;ob['expandedPivot']=[0.,7.85,0.]
   ob['expandedPivotConvention']='Runtime Y-up, after authored vertical lift. Group rigid tilt; assembled transform is unchanged.'

def nighthawk_spirit_illustrations():
 for name,x,color in [('rum',-.32,(.46,.24,.065,1)),('vodka',.32,(.76,.73,.63,1))]:
  profile=[(r*.60,z*.85) for r,z in [(0,-.13),(.17,-.13),(.30,-.07),(.32,.025),(.26,.115),(.10,.15),(0,.15)]]
  ob=lathe('recipe_'+name,profile,material('Illustrative '+name,color,.28),n=64,category='spirit',role='recipe',target=ROWS['spirit'],evidence='official-menu',representation='illustrative-ingredient')
  ob.location.x=x;ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[x,ob.location.y,ROWS['spirit']]
  ob['ingredientName']=name.title();ob['preserveIllustrationColor']=True
  ob['presentationNote']='Equal-sized illustrative rum and vodka droplets; relative amounts and actual spirit brands are unspecified.'

def patch_nulls(path):
 raw=path.read_bytes();cursor=12;chunks=[]
 while cursor<len(raw):
  length,kind=struct.unpack_from('<II',raw,cursor);body=raw[cursor+8:cursor+8+length];cursor+=8+length
  if kind==0x4e4f534a:
   doc=json.loads(body)
   for node in doc.get('nodes',[]):
    e=node.get('extras',{})
    if e.get('role')=='recipe':e.update(quantity=None,unit=None)
   body=json.dumps(doc,separators=(',',':')).encode();body+=b' '*((-len(body))%4)
  chunks.append(struct.pack('<II',len(body),kind)+body)
 payload=b''.join(chunks);path.write_bytes(struct.pack('<4sII',b'glTF',2,len(payload)+12)+payload)

def build(drink):
 global parts,rng
 rng=random.Random(SEED+IDS.index(drink));parts=[];c=CONFIG[drink]
 bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 for data in list(bpy.data.materials):bpy.data.materials.remove(data)
 glass=material('Clear stemmed glass',(1,1,1,1),.035,1,1.51)
 coffee=material('Opaque dark espresso',(.021,.007,.0035,1),.24)
 crema=material('Cream and fine foam',c['foamColor'],.49)
 foot=c['foot'];stem=c['stem']
 lower=[(0,.035),(foot*.86,.035),(foot,.055),(foot,.08),(foot*.92,.10),(.17,.12),(.075,.19),(.041,.32),(.035,stem-.16),(.065,stem-.025)]
 bowl=profile_smooth(c['bowl']);inner=[(max(.025,r-.013),z-.006) for r,z in reversed(bowl)]
 profile=lower+bowl+[(c['radius']-.003,c['height']+.003),(c['radius']-.013,c['height'])]+inner+[(0,stem+.035)]
 lathe('glass',profile,glass)
 fluid=[(0,stem+.045)]+[(max(.02,r-.019),z+.004) for r,z in bowl if stem+.04<z<c['fill']]+[(radius_at(c,c['fill'])-.019,c['fill']),(0,c['fill'])]
 lathe('liquid',fluid,coffee,role='mixture',category='coffee')
 foam(c,crema,drink=='jigger-espresso-martini')
 if drink=='atlas-espresso-martini':cinnamon(c,material('Cinnamon dust',(.23,.065,.014,1),.66))
 elif drink=='jigger-espresso-martini':cacao_tuile(c,material('Cacao tuile',(.14,.032,.009,1),.24))
 else:nighthawk_garnish(c,material('Dark feather',(.008,.013,.060,1),.33,metal=.12),material('White chocolate seal',(.76,.66,.49,1),.4))
 recipe('coffee',material('Illustrative coffee',(.060,.019,.008,1),.3))
 recipe('liqueur',material('Unknown neutral cream',(.60,.57,.49,1),.65) if drink=='jigger-espresso-martini' else material('Illustrative coffee liqueur or amaro',(.16,.052,.013,1),.29),drink=='jigger-espresso-martini')
 if drink=='nighthawks':nighthawk_spirit_illustrations()
 else:recipe('spirit',material('Illustrative spirit',(.70,.68,.58,1),.19,.35))
 if drink=='jigger-espresso-martini':recipe('modifiers',material('Illustrative rainforest honey',(.64,.27,.036,1),.23))
 if drink=='atlas-espresso-martini':cinnamon_illustration()
 elif drink=='jigger-espresso-martini':expanded_group_tilt({'garnish_cacao_tuile','garnish_cacao_texture'})
 else:
  nighthawk_modifier_illustrations()
  expanded_group_tilt({'garnish_feather','garnish_quill','garnish_chocolate_seal','garnish_seal_imprint'})
 sc=bpy.context.scene;sc['authoringVersion']=VERSION;sc['seed']=SEED;sc['sourcePhoto']=f'references/espresso-martini/{c["photo"]}';sc['unitsNote']='Normalized illustrative scale; no measured dimensions or proportions.'
 bpy.ops.object.camera_add(location=(.1,-7.5,4.15));cam=bpy.context.object;cam.name='Camera_hero';cam.rotation_euler=(Vector((0,0,1.35))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=65;sc.camera=cam
 sc.render.resolution_x=800;sc.render.resolution_y=960;sc.render.resolution_percentage=100
 sc.world.color=(.15,.15,.15)
 for i,(loc,energy,size) in enumerate([((-3,-4,6),500,4),((3,1,4),300,3)]):
  bpy.ops.object.light_add(type='AREA',location=loc);ob=bpy.context.object;ob.name='Editable studio light '+str(i);ob.data.energy=energy;ob.data.shape='DISK';ob.data.size=size;ob.rotation_euler=(Vector((0,0,1.4))-ob.location).to_track_quat('-Z','Y').to_euler()
 sc.render.engine='CYCLES';sc.cycles.samples=64;sc.view_settings.view_transform='AgX'
 bpy.context.preferences.filepaths.save_version=0
 source=P/'assets/blender'/f'{drink}.blend';model=P/'public/models'/f'{drink}.glb'
 bpy.ops.wm.save_as_mainfile(filepath=str(source))
 bpy.ops.object.select_all(action='DESELECT')
 for ob in parts:ob.select_set(True)
 bpy.context.view_layer.objects.active=parts[0]
 bpy.ops.export_scene.gltf(filepath=str(model),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True)
 patch_nulls(model)
 doc=dict(drink=drink,version=VERSION,seed=SEED,blender=bpy.app.version_string,parameters=c,rows=ROWS,scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),sourcePhoto=dict(path=f'references/espresso-martini/{c["photo"]}',sha256=hashlib.sha256((P/'references/espresso-martini'/c['photo']).read_bytes()).hexdigest(),published='2024-04-04'),parts=[dict(id=ob.name,category=ob['ingredientId'],role=ob['role'],lift=ob['lift'],assembledPosition=list(ob.location),expandedPosition=list(ob['expandedPosition']),evidence=ob['evidence'],representation=ob.get('representation'),quantity=None,unit=None) for ob in parts],sourceSha256=hashlib.sha256(source.read_bytes()).hexdigest(),modelSha256=hashlib.sha256(model.read_bytes()).hexdigest(),modelBytes=model.stat().st_size,limitations=['Independently authored from dated serving photographs; dimensions, unseen details and topping distributions are inferred.','No recipe measures or physical finished-drink ingredient layers are asserted.','No serving ice. Espresso is deliberately opaque; no new nested optical experiment.','No photorealism acceptance claim.'])
 for row,ob in zip(doc['parts'],parts):
  for key in ['recipeSolid','assembledOnly','expandedRotationX','expandedPivot','expandedPivotConvention','label','presentationNote','illustrativeScale','servingShapeClaim','ingredientName','preserveIllustrationColor']:
   if key in ob:row[key]=list(ob[key]) if key=='expandedPivot' else ob[key]
 doc['visibilityIteration']='Expansion-only solid illustrations and rigid garnish tilt. All existing assembled meshes, materials and transforms preserved.'
 (P/'assets/blender'/f'{drink}.json').write_text(json.dumps(doc,indent=2))
 print('ESPRESSO_READY',drink,len(parts),model.stat().st_size)

for drink in IDS if args.drink=='all' else [args.drink]:build(drink)
