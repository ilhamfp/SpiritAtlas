"""Deterministic Blender authoring, GLB export, and repeatable Cycles reference views.
Run Blender --background --python scripts/build-assets-candidate.py -- --drink negroni-express --output-tag v0151
All geometry is independently authored. World: Z up; 1 scene unit ≈ 4 cm (estimated, not measured).
"""
import bpy, bmesh, math, random, argparse, sys, json, hashlib, struct
from mathutils import Vector, Quaternion
from pathlib import Path
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser(); p.add_argument('--drink',default='negroni-express'); p.add_argument('--render',action='store_true'); p.add_argument('--view',default='hero',choices=['hero','side','photo','product']); p.add_argument('--samples',type=int,default=512); p.add_argument('--turntable',action='store_true');p.add_argument('--denoise',action='store_true')
p.add_argument('--output-tag',default='v0151',help='Required isolated candidate subdirectory; leaves production scenes/GLBs untouched.')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
if not a.output_tag:p.error('Candidate authoring requires a nonempty --output-tag; use build-assets.py for validated production.')
SCENE_OUT=P/'assets/blender'/('candidates/'+a.output_tag if a.output_tag else '')
MODEL_OUT=P/'public/models'/('candidates/'+a.output_tag if a.output_tag else '')
SEED=20260912
PARAMS={
 'negroni-express':dict(radius=1,height=1.80,base=.10,wall=.021,fill=1.25,liquid=(.96,.34,.065,1),absorption=(.65,.095,.018,1),density=.55,ice=1.35,ice_height=1.49,ice_z=1.055),
 'bbf-negroni':dict(radius=1,height=1.94,base=.29,wall=.035,fill=1.41,liquid=(.52,.085,.018,1),absorption=(.25,.012,.005,1),density=.9,ice=1.25,ice_z=.945),
 'ichigo-negroni':dict(radius=1,height=2.26,base=.105,wall=.023,fill=1.57,liquid=(.96,.72,.29,1),absorption=(.82,.52,.12,1),density=.20,ice=1.35,ice_height=1.57,ice_z=1.055)
}
VERSION='0.15.1'
REFERENCE_RIM_RATIOS={'bbf-negroni':.094,'ichigo-negroni':.061,'negroni-express':.307}
def hero_camera_location(drink):
 # Source ellipse measures camera elevation AT THE RIM, independent of aim target.
 distance=math.hypot(.15,10.5)
 return (.15,-10.5,PARAMS[drink]['height']+distance*math.tan(math.asin(REFERENCE_RIM_RATIOS[drink])))
def aim_camera(cam,target,roll=0):
 cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y') @ Quaternion((0,0,1),roll)).to_euler()
def preserve_null_recipe_quantities(path):
 # Blender ID properties do not support null; add actual JSON null to GLB extras after export.
 raw=path.read_bytes();offset=12;chunks=[]
 while offset<len(raw):
  length,kind=struct.unpack_from('<II',raw,offset);body=raw[offset+8:offset+8+length];offset+=8+length
  if kind==0x4e4f534a:
   document=json.loads(body)
   for node in document.get('nodes',[]):
    extras=node.get('extras',{})
    if extras.get('role')=='recipe':extras.update(quantity=None,unit=None)
   body=json.dumps(document,separators=(',',':'),ensure_ascii=False).encode();body+=b' '*((-len(body))%4)
  chunks.append(struct.pack('<II',len(body),kind)+body)
 payload=b''.join(chunks);path.write_bytes(struct.pack('<4sII',b'glTF',2,len(payload)+12)+payload)
asset=[]
def smooth(o):
 if o.type=='MESH':
  for f in o.data.polygons:f.use_smooth=True
 return o

def mat(name,color,rough=.3,trans=0,ior=1.45,noise=0):
 m=bpy.data.materials.new(name); m.diffuse_color=color; m.use_nodes=True
 n=m.node_tree.nodes; bs=n.get('Principled BSDF'); bs.inputs['Base Color'].default_value=color;bs.inputs['Roughness'].default_value=rough;bs.inputs['Transmission Weight'].default_value=trans;bs.inputs['IOR'].default_value=ior
 if noise:
  tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=85;tex.inputs['Detail'].default_value=4
  coord=n.new('ShaderNodeTexCoord');m.node_tree.links.new(coord.outputs['Object'],tex.inputs['Vector'])
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.22;bump.inputs['Distance'].default_value=noise
  m.node_tree.links.new(tex.outputs['Fac'],bump.inputs['Height']);m.node_tree.links.new(bump.outputs['Normal'],bs.inputs['Normal'])
 return m

def record(o,name,m,category='structure',role='physical',lift=0):
 o.name=name;o.data.materials.append(m);o['scenePartId']=name;o['ingredientId']=category;o['role']=role;o['lift']=lift;o['assembledPosition']=list(o.location);o['expandedPosition']=[o.location.x,o.location.y,o.location.z+lift];asset.append(o);return smooth(o)

def mesh(name,verts,faces,m,category='structure',role='physical',lift=0):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);return record(ob,name,m,category,role,lift)

def lathe(name,profile,m,**kw):
 n=192;vs=[];fs=[];rings=[]
 for r,z in profile:
  # Axis endpoints are true center vertices. A tiny closure cylinder previously
  # tilted smooth center normals ~45 degrees across otherwise flat optical bases.
  if r<=.0010001:
   rings.append([len(vs)]);vs.append((0,0,z))
  else:
   ring=[]
   for j in range(n):
    t=j*2*math.pi/n;ring.append(len(vs));vs.append((r*math.cos(t),r*math.sin(t),z))
   rings.append(ring)
 for left,right in zip(rings,rings[1:]):
  if len(left)==1 and len(right)==1:continue
  for j in range(n):
   q=(j+1)%n
   if len(left)==1:fs.append((left[0],right[q],right[j]))
   elif len(right)==1:fs.append((left[j],left[q],right[0]))
   else:fs.append((left[j],left[q],right[q],right[j]))
 ob=mesh(name,vs,fs,m,**kw)
 # Normals depend on outline orientation, recalculate closed manifold volume outward.
 bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.000001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');ob.select_set(False)
 preserve_planar_optical_normals(ob)
 return ob

def preserve_planar_optical_normals(ob):
 # Keep horizontal optical planes genuinely planar to the renderer. At a plane's
 # fillet boundary use its tangent normal, retaining smooth curvature elsewhere.
 me=ob.data;me.update();plane_normals={}
 for poly in me.polygons:
  if abs(poly.normal.z)>.999999:
   z=[me.vertices[i].co.z for i in poly.vertices]
   if max(z)-min(z)<1e-6:
    for index in poly.vertices:plane_normals[index]=Vector((0,0,1 if poly.normal.z>0 else -1))
 normals=[tuple(plane_normals.get(loop.vertex_index,me.corner_normals[loop.index].vector)) for loop in me.loops]
 me.normals_split_custom_set(normals)
 ob['planarOpticalNormals']='True horizontal surface normals; smooth fillet/wall normals elsewhere.'

def cube(name,loc,scale,bevel,m,**kw):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
 b=o.modifiers.new('Soft hand-cut edges','BEVEL');b.width=bevel;b.segments=8
 bpy.ops.object.modifier_apply(modifier=b.name)
 record(o,name,m,**kw)
 # Smooth bevels while preserving the broad planar faces; prevent a melted-lens normal field.
 weighted=o.modifiers.new('Preserve broad face normals','WEIGHTED_NORMAL');weighted.keep_sharp=True;weighted.weight=50
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=weighted.name)
 return o

def ice_block(size,z,m,height=None):
 """Rounded hand-cut cuboid with subtly uneven melt, not uniformly rounded face normals."""
 height=height or size;n=30;bevel=.085;dims=(size,size,height);halves=[v/2 for v in dims];inners=[v-bevel for v in halves];vs=[];fs=[]
 # Separate face grids are merged; normals then follow actual local surface geometry.
 for axis in range(3):
  others=[q for q in range(3) if q!=axis]
  for sign in [-1,1]:
   start=len(vs)
   for i in range(n+1):
    for j in range(n+1):
     p=Vector((0,0,0));p[axis]=sign*halves[axis];p[others[0]]=-halves[others[0]]+dims[others[0]]*i/n;p[others[1]]=-halves[others[1]]+dims[others[1]]*j/n
     core=Vector([max(-inners[k],min(inners[k],c)) for k,c in enumerate(p)]);delta=p-core
     p=core+delta.normalized()*bevel
     upper=max(0,min(1,(p.z+height/2)/height))**4
     ripple=.004*(math.sin(18*p.x+4*p.y)*math.cos(15*p.y-2*p.x)+.45*math.sin(39*p.x+11*p.y))
     p.z+=upper*ripple
     # A couple of shallow irregular melt dents near upper edges.
     dent=.012*math.exp(-((p.x-.22)**2+(p.y+.58)**2)/.025)+.008*math.exp(-((p.x+.38)**2+(p.y-.57)**2)/.018)
     p.z-=upper*dent
     vs.append(tuple(p))
   for i in range(n):
    for j in range(n):
     k=start+i*(n+1)+j;fs.append((k,k+1,k+n+2,k+n+1))
 ob=mesh('ice',vs,fs,m,lift=1.18);ob.location=(0,.035,z);ob.rotation_euler=(.014,-.025,.12)
 bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.00001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');ob.select_set(False)
 return ob

def seat_bbf_ice(ob,cutoff=1.425999999,upper_scale=.2700870051):
 # Minimal triangle-verified seating hypothesis. Split at the actual liquid hull
 # maximum before compression, so every original lower vertex remains fixed.
 # Liquid Boolean is regenerated after this edit, never reused from old ice.
 bpy.context.view_layer.update();world=ob.matrix_world.copy();inverse=world.inverted()
 bm=bmesh.new();bm.from_mesh(ob.data)
 normal=(world.to_3x3().transposed()@Vector((0,0,1))).normalized()
 bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=inverse@Vector((0,0,cutoff)),plane_no=normal,dist=1e-8,clear_inner=False,clear_outer=False)
 for vertex in bm.verts:
  point=world@vertex.co
  if point.z>cutoff:point.z=cutoff+(point.z-cutoff)*upper_scale;vertex.co=inverse@point
 bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(ob.data);bm.free();ob.data.update()
 ob['upperIceSeating']='Inferred hidden shape: split at worldZ1.426 then compress only upper ice by0.2700870051; liquid cavity regenerated. Original lower ice remains unchanged.'

def floral_root(name,start,end,material):
 # Small closed inferred attachment beneath the observed petals; no species claim.
 # The root tubes and common base are real geometry, occluded by the bloom.
 start=Vector(start);end=Vector(end);points=[start,start.lerp(end,.52)+Vector((0,0,-.004)),end]
 vertices=[];faces=[];n=8
 for i,point in enumerate(points):
  tangent=(points[min(i+1,2)]-points[max(i-1,0)]).normalized()
  side=tangent.cross(Vector((0,0,1)))
  if side.length<1e-7:side=tangent.cross(Vector((1,0,0)))
  side.normalize();up=tangent.cross(side).normalized();radius=[.0045,.004,.003][i]
  for j in range(n):
   th=j*math.tau/n;vertices.append(point+radius*(math.cos(th)*side+math.sin(th)*up))
 for i in range(2):
  for j in range(n):q=(j+1)%n;faces.append((i*n+j,i*n+q,(i+1)*n+q,(i+1)*n+j))
 faces.extend([tuple(range(n-1,-1,-1)),tuple(range(2*n,3*n))])
 ob=mesh(name,vertices,faces,material,category='garnish',lift=5.75);ob['evidence']='unverified';ob['representation']='plausible-hidden-flower-attachment'

def sphere(name,loc,scale,m,**kw):
 bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,location=loc);o=bpy.context.object;o.scale=scale;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);return record(o,name,m,**kw)

def curve(name,points,radius,m,**kw):
 c=bpy.data.curves.new(name,'CURVE');c.dimensions='3D';c.resolution_u=20;c.bevel_depth=radius;c.bevel_resolution=4;c.use_fill_caps=True
 s=c.splines.new('BEZIER');s.bezier_points.add(len(points)-1)
 for i,(bp,pt) in enumerate(zip(s.bezier_points,points)):
  bp.co=pt;bp.handle_left_type='AUTO';bp.handle_right_type='AUTO'
  if name=='garnish_stem':bp.radius=1-.62*i/max(1,len(points)-1)
 ob=bpy.data.objects.new(name,c);bpy.context.collection.objects.link(ob);bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.convert(target='MESH')
 bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.000001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');ob.select_set(False);return record(ob,name,m,**kw)

def pepper():
 # Longitudinal lobes and overlapping fine folds modify actual silhouette, not a decal.
 skin=mat('Shishito wet olive skin',(.18,.23,.025,1),.40,noise=.0012)
 bs=skin.node_tree.nodes.get('Principled BSDF');bs.inputs['Coat Weight'].default_value=.035;bs.inputs['Coat Roughness'].default_value=.32;bs.inputs['Specular IOR Level'].default_value=.28
 attr=skin.node_tree.nodes.new('ShaderNodeVertexColor');attr.layer_name='SkinColor';skin.node_tree.links.new(attr.outputs['Color'],bs.inputs['Base Color'])
 vs=[];fs=[];cs=[];long=360;around=96
 for i in range(long+1):
  t=i/long;x=-.56+1.60*t;y=-.10-.42*math.sin(math.pi*t);z=1.945-.020*math.sin(math.pi*t)+.37*t*t
  # broad shoulder at stem, narrowing toward hooked tip
  r=.109+.070*math.sin(math.pi*min(t/.94,1))**.75
  # Native final visible segment retains about70% of maximum thickness;
  # this inferred radius profile is checked in the same projected hero.
  r+=.012*math.exp(-((t-.18)/.085)**2)
  if t<.05:r*=math.sqrt(max(.001,1-((.05-t)/.05)**2))
  # Hemispherical final cap removes the visibly sliced end without sharpening the tip.
  if t>.945:r*=math.sqrt(max(.0001,1-((t-.945)/.055)**2))
  for j in range(around):
   th=j*math.tau/around
   # Native crop shows long, nearly parallel irregular folds, not broad isolated dents.
   rib=1+.125*math.cos(5*th+.22*math.sin(8*t))+.027*math.cos(3*th-1.2+.5*math.sin(9*t))+.015*math.cos(9*th+2.2*t)
   fold=1+.008*math.sin(43*t+2.3*math.sin(th*3))+.004*math.sin(89*t-5*th)
   # Individual blunt pickling creases interrupt the longitudinal valleys.
   for ct,ph,depth,width in [(.18,1.2,.045,.044),(.31,3.4,.060,.031),(.47,5.1,.040,.037),(.61,2.6,.050,.040),(.78,.1,.045,.028)]:
    fold-=depth*math.exp(-((t-ct)/width)**2)*(.35+.65*math.cos(th-ph)**2)
   # Fine nonperiodic pickling creases interrupt the long folds without isolated
   # inflated dimples. Real displacement remains visible during close orbit.
   for index,ct in enumerate([.075,.115,.16,.205,.245,.29]):
    phase=3.9+.7*math.sin(index*2.31);depth=.028+.022*(.5+.5*math.sin(index*1.72));width=.009+.003*(.5+.5*math.cos(index*2.7))
    crease_t=ct+.012*math.sin(2*th+phase)
    fold-=depth*math.exp(-((t-crease_t)/width)**2)*(.12+.88*math.cos(th-phase)**4)
   rr=r*rib*fold
   vs.append((x,y+math.sin(th)*rr,z+math.cos(th)*rr*.88))
   shade=.86+.07*math.sin(5*th+.22*math.sin(8*t))+.12*math.sin(23*t+2*th)*math.sin(7*t-th)
   cs.append((.180*shade,.230*shade,.025*shade,1))
 for i in range(long):
  for j in range(around):
   k=i*around+j;q=i*around+(j+1)%around;fs.append((k,k+around,q+around,q))
 fs.append(tuple(range(around-1,-1,-1)));fs.append(tuple(long*around+j for j in range(around)))
 o=mesh('garnish_shishito',vs,fs,skin,'garnish',lift=5.80)
 col=o.data.color_attributes.new(name='SkinColor',type='FLOAT_COLOR',domain='POINT')
 for d,c in zip(col.data,cs):d.color=c
 stem=mat('Shishito tapered stem',(.125,.162,.03,1),.48,noise=.009)
 curve('garnish_stem',[(-.57,-.10,1.96),(-.80,-.06,2.065),(-1.12,-.035,2.265),(-1.42,.0,2.37),(-1.49,.035,2.44)],.021,stem,category='garnish',lift=5.80)
 for k in range(6):
  th=k*math.tau/6
  curve('garnish_calyx_'+str(k),[(-.64,-.115,1.985),(-.56,-.10+.064*math.sin(th),1.955+.05*math.cos(th)),(-.44,-.10+.09*math.sin(th),1.965+.07*math.cos(th))],.009,stem,category='garnish',lift=5.80)

def orange():
 rind=mat('Orange aromatic bowed rind',(.62,.145,.006,1),.34,noise=.0025)
 rind.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.28
 # Thin, bowed rind shell: convex top and concave underside, no fabricated flesh segments.
 vs=[];fs=[];nr=64;nt=192
 for side in [0,1]:
  for i in range(nr+1):
   r=.54*i/nr
   for j in range(nt):
    th=j*math.tau/nt;z=1.495+.185*math.sqrt(max(0,1-(r/.54)**2))-.026*side
    # Squared radial fade has a differentiable center; the previous linear fade
    # produced a visible pinwheel even on an otherwise smooth bowed rind.
    x=r*math.cos(th);y=r*math.sin(th)
    z+=(.007*math.exp(-((x-.19)**2+(y+.13)**2)/.027)-.005*math.exp(-((x+.17)**2+(y-.10)**2)/.021))*(1-(r/.54)**2)
    z+=.014*(r/.54)*math.cos(th-.8)*(1-(r/.54)**2)
    rr=r*(1+(.024*math.sin(3*th)+.015*math.cos(7*th-.8))*(r/.54)**4)
    vs.append((-.10+rr*math.cos(th),-.08+.90*rr*math.sin(th),z))
 for side in [0,1]:
  offset=side*(nr+1)*nt
  for i in range(nr):
   for j in range(nt):
    k=offset+i*nt+j;q=offset+i*nt+(j+1)%nt;f=(k,k+nt,q+nt,q);fs.append(f if side==0 else tuple(reversed(f)))
 for j in range(nt):
  k=nr*nt+j;q=nr*nt+(j+1)%nt;off=(nr+1)*nt;fs.append((k,q,q+off,k+off))
 ob=mesh('garnish_orange',vs,fs,rind,category='garnish',lift=6.24)
 bpy.context.view_layer.objects.active=ob;ob.select_set(True);bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.remove_doubles(threshold=.000001);bpy.ops.mesh.normals_make_consistent(inside=False);bpy.ops.object.mode_set(mode='OBJECT');ob.select_set(False)

def merge_related_parts():
 """Keep every authored vertex while reducing petal/inclusion draw calls by material."""
 global asset
 groups={}
 for ob in asset:
  if ob.name in ['glass','ice','liquid'] or ob['role']=='recipe':continue
  key=(ob.data.materials[0].name,ob['ingredientId'],ob['role'],round(float(ob['lift']),5))
  groups.setdefault(key,[]).append(ob)
 for key,parts in groups.items():
  if len(parts)<2:continue
  names=[ob.name for ob in parts];active=parts[0]
  name='ice_inclusions' if names[0].startswith('ice_inclusion') else 'garnish_stem' if 'garnish_stem' in names else names[0]
  bpy.ops.object.select_all(action='DESELECT')
  for ob in parts:ob.select_set(True)
  bpy.context.view_layer.objects.active=active;bpy.ops.object.join()
  active.name=name;active['scenePartId']=name;active['sourcePartIds']=names
  asset=[ob for ob in asset if ob not in parts]+[active]
  active.select_set(False)

def flower():
 red=mat('Red round garnish — composition unknown',(.55,.018,.003,1),.34,.08,1.4,noise=.002)
 red.node_tree.nodes.get('Principled BSDF').inputs['Specular IOR Level'].default_value=.28
 sphere('garnish_red_round',(.25,.06,1.928),(.29,.26,.084),red,category='garnish',lift=5.92)
 yellow=[]
 for i in range(7):
  m=mat('Yellow petals '+str(i),(.80+i*.018,.50+i*.020,.008+i*.002,1),.52,noise=.0004)
  pb=m.node_tree.nodes.get('Principled BSDF');pb.inputs['Subsurface Weight'].default_value=.10;pb.inputs['Subsurface Radius'].default_value=(.004,.0025,.0015);pb.inputs['Specular IOR Level'].default_value=.16;yellow.append(m)
 base_material=mat('Inferred hidden floral base',(.71,.43,.013,1),.58)
 base=sphere('garnish_flower_base',(.25,.06,2.012),(.090,.080,.025),base_material,category='garnish',lift=5.75)
 base['evidence']='unverified';base['representation']='plausible-hidden-flower-attachment';base['sourceUncertainty']='Flower species and hidden anatomy unverified; common base connects observed petal roots to red support without changing visible crown.'
 # Hundreds of irregular cupped, twisted, closed narrow petals overlap into a dense dome.
 for ring in range(8):
  count=20+ring*4;rad=.020+ring*.032
  for k in range(count):
   theta=k*math.tau/count+ring*.67+random.uniform(-.25,.25)
   length=(.065+.012*ring)*random.uniform(.80,1.16)*(1-.15*ring/7);width=(.014+ring*.003)*random.uniform(.85,1.24)
   radial_jitter=random.uniform(-.015,.015);cup=random.uniform(.0015,.0065)
   # Outer layers drape around the red support; inner petals stand higher.
   # This restores visible flower depth from the low native hero camera.
   tilt=.060*(1-ring/7)-.045*(ring/7)**1.5+random.uniform(-.014,.014);curl=random.uniform(-.006,.010);twist=random.uniform(-.17,.17)
   basez=2.010+.105*(1-ring/8)+random.uniform(-.018,.018)
   vs=[];fs=[];layers=[]
   for layer in [0,1]:
    rows=[]
    petal_ts=[0,.04,.09,.15,.23,.32,.43,.54,.64,.72,.79,.84,.885,.92,.95,.972,.986,.995,1]
    for i,t in enumerate(petal_ts):
     row=[]
     # A broad ribbon keeps its width until a short rounded terminal cap.
     # Endpoints are true center vertices with a closed thin underside.
     for w in ([0] if i in [0,len(petal_ts)-1] else [(j/6-.5)*2 for j in range(7)]):
      rr=rad+radial_jitter+length*t;ang=theta+twist*t*t
      shape=math.sqrt(max(0,t/.18)) if t<.18 else math.sqrt(max(0,1-((t-.79)/.21)**2)) if t>.79 else 1
      shape*=1+.055*math.sin(13*t+theta)
      cross=width*shape*w
      z=basez+.030*math.sin(t*math.pi)+tilt*t+curl*t**3+cup*w*w*math.sin(math.pi*t)
      z+=.0015*math.sin(t*17+theta+4*w)*math.sin(math.pi*t)+.002*w*t*math.sin(t*math.pi)+layer*.0015
      row.append(len(vs));vs.append((.25+rr*math.cos(ang)-cross*math.sin(ang),.06+rr*math.sin(ang)+cross*math.cos(ang),z))
     rows.append(row)
    layers.append(rows)
    for left,right in zip(rows,rows[1:]):
     for j in range(6):
      if len(left)==1:f=(left[0],right[j+1],right[j])
      elif len(right)==1:f=(left[j],left[j+1],right[0])
      else:f=(left[j],left[j+1],right[j+1],right[j])
      fs.append(f if layer==0 else tuple(reversed(f)))
   for i in range(len(petal_ts)-1):
    fs.append((layers[0][i][0],layers[0][i+1][0],layers[1][i+1][0],layers[1][i][0]))
    fs.append((layers[0][i][-1],layers[1][i][-1],layers[1][i+1][-1],layers[0][i+1][-1]))
   mesh('garnish_petal_%02d_%02d'%(ring,k),vs,fs,random.choice(yellow),'garnish',lift=5.75)
   root=(.25+.050*math.cos(theta),.06+.045*math.sin(theta),2.020)
   endpoint=(.25+(rad+radial_jitter)*math.cos(theta),.06+(rad+radial_jitter)*math.sin(theta),basez+.00075)
   floral_root('garnish_inferred_root_%02d_%02d'%(ring,k),root,endpoint,base_material)
 for i in range(35):
  theta=i*2.399;r=.059*math.sqrt(i/35)
  floret=sphere('garnish_floret_%03d'%i,(.25+r*math.cos(theta),.06+r*math.sin(theta),2.145+random.uniform(-.011,.011)),(.006,.006,.012),yellow[2],category='garnish',lift=5.75)
  floral_root('garnish_inferred_floret_root_%03d'%i,(floret.location.x,floret.location.y,2.020),floret.location.copy(),base_material)

def stage(view,drink):
 # Product display uses neutral shared stage. Reference approximates filmed warm bar context.
 floor=mat('Counter warm veined stone' if drink=='negroni-express' else 'Counter',(.16,.063,.024,1),.3,noise=.012)
 n=floor.node_tree.nodes;bs=n.get('Principled BSDF');tex=n.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=2.2;tex.inputs['Detail'].default_value=5;tex.inputs['Roughness'].default_value=.7
 coord=n.new('ShaderNodeTexCoord');floor.node_tree.links.new(coord.outputs['Object'],tex.inputs['Vector'])
 ramp=n.new('ShaderNodeValToRGB');ramp.color_ramp.elements[0].position=.34;ramp.color_ramp.elements[0].color=(.045,.015,.006,1);ramp.color_ramp.elements[1].position=.72;ramp.color_ramp.elements[1].color=(.31,.13,.065,1);floor.node_tree.links.new(tex.outputs['Fac'],ramp.inputs[0]);floor.node_tree.links.new(ramp.outputs[0],bs.inputs['Base Color'])
 if drink=='negroni-express' and view!='product':
  # Traceable native crop of unobstructed counter only, used as a surface texture on 3D geometry.
  stone=n.new('ShaderNodeTexImage');stone.name='ReferenceCounterTexture';stone.image=bpy.data.images.load(str(P/'assets/source-textures'/('somma-counter-photo-crop.png' if view=='photo' else 'somma-counter-video-crop.png')),check_existing=True);stone.image.pack();stone.extension='REPEAT'
  mapping=n.new('ShaderNodeVectorMath');mapping.operation='MULTIPLY';mapping.inputs[1].default_value=(.16,.64,1)
  floor.node_tree.links.new(coord.outputs['Object'],mapping.inputs[0]);floor.node_tree.links.new(mapping.outputs[0],stone.inputs['Vector']);floor.node_tree.links.new(stone.outputs['Color'],bs.inputs['Base Color']);bs.inputs['Roughness'].default_value=.56
 floorob=cube('stage_counter',(0,0,-.12),(200,200,.2),.015,floor);asset.remove(floorob)
 if drink=='negroni-express' and view!='product':
  paper=mat('Coaster ivory engraved paper',(.68,.63,.52,1),.78)
  pn=paper.node_tree.nodes;tex=pn.new('ShaderNodeTexNoise');tex.inputs['Scale'].default_value=38;tex.inputs['Detail'].default_value=3
  vor=pn.new('ShaderNodeTexVoronoi');vor.feature='DISTANCE_TO_EDGE';vor.inputs['Scale'].default_value=19
  paper.node_tree.links.new(tex.outputs['Color'],vor.inputs['Vector'])
  ink=pn.new('ShaderNodeValToRGB');ink.color_ramp.elements[0].position=.06;ink.color_ramp.elements[0].color=(.037,.040,.031,1);ink.color_ramp.elements[1].position=.10;ink.color_ramp.elements[1].color=(.64,.58,.45,1)
  paper.node_tree.links.new(vor.outputs['Distance'],ink.inputs[0]);paper.node_tree.links.new(ink.outputs[0],pn.get('Principled BSDF').inputs['Base Color'])
  coaster=cube('stage_square_coaster',(0,0,.016),(2.47,2.47,.024),.008,paper);coaster.rotation_euler.z=.25;asset.remove(coaster)
 def area(name,loc,power,color,size,scale=1,shape='RECTANGLE'):
  bpy.ops.object.light_add(type='AREA',location=loc);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape=shape;o.data.size=size;o.data.size_y=size*scale;o.rotation_euler=(Vector((0,0,1))-o.location).to_track_quat('-Z','Y').to_euler()
 # Source glass highlights are narrow side strips, without front-facing white panels.
 area('Left narrow reflected strip',(-4.5,.1,3.4),110,(1,.87,.72),.38,10.5)
 area('Right narrow reflected strip',(4.5,.3,3.4),150,(.86,.91,1),.44,9)
 area('Broad rear diffuse fill',(0,3.5,5.8),220,(1,.83,.66),5,1,'DISK')
 bpy.context.scene.world.use_nodes=True;bpy.context.scene.world.node_tree.nodes.get('Background').inputs[0].default_value=(.27,.25,.21,1);bpy.context.scene.world.node_tree.nodes.get('Background').inputs[1].default_value=.7
 bpy.ops.object.camera_add();cam=bpy.context.object;cam.name='Camera_'+view
 if view=='photo':cam.location=(9,5,8.5);target=Vector((0,0,1.0));cam.data.lens=66
 elif view=='side':cam.location=(-7.5,-7.5,1.8+math.hypot(7.5,7.5)*math.tan(math.radians(8.5)) if drink=='negroni-express' else 2.55);target=Vector((0,0,.98));cam.data.lens=63
 elif view=='hero':cam.location=hero_camera_location(drink);target=Vector((0,0,1.0));cam.data.lens=63
 else:cam.location=(3.2,-8.4,4.4);target=Vector((0,0,1.2));cam.data.lens=56
 aim_camera(cam,target,math.atan2(17,300) if view=='hero' and drink=='negroni-express' else 0);bpy.context.scene.camera=cam
 # Retain all fixed viewpoints in each editable scene, with their own source IDs.
 cameraPresets={
  'hero':(hero_camera_location(drink),63),
  'side':((-7.5,-7.5,1.8+math.hypot(7.5,7.5)*math.tan(math.radians(8.5)) if drink=='negroni-express' else 2.55),63),'photo':((9,5,8.5),66),'product':((3.2,-8.4,4.4),56)}
 for preset,(location,lens) in cameraPresets.items():
  if preset==view:camera=cam
  else:
   data=bpy.data.cameras.new('CameraData_'+preset);camera=bpy.data.objects.new('Camera_'+preset,data);bpy.context.collection.objects.link(camera)
   camera.location=location;camera.data.lens=lens;aim_camera(camera,Vector((0,0,1)),math.atan2(17,300) if preset=='hero' and drink=='negroni-express' else 0)
  camera['preset']=preset;camera['referenceId']='somma-photo' if preset=='photo' and drink=='negroni-express' else ('somma-side' if preset=='side' and drink=='negroni-express' else ('somma-hero' if drink=='negroni-express' else 'bbf-hero' if drink=='bbf-negroni' else 'ichigo-hero'))

def build(drink):
 global asset
 asset=[];random.seed(SEED);bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
 # Stable data names whether generating one drink or all three in the same process.
 for group in [bpy.data.meshes,bpy.data.curves,bpy.data.materials,bpy.data.cameras,bpy.data.lights,bpy.data.images]:
  for data in list(group):
   if data.users==0:group.remove(data)
 c=PARAMS[drink];R=c['radius'];H=c['height'];B=c['base'];W=c['wall']
 glass=mat('Glass optical solid walls',(1,1,1,1),.018,1,1.51)
 # Continuous manifold lathe: outer foot → wall → rolled rim → inner cavity → thick bottom.
 roundness=.13 if drink=='negroni-express' else .033
 profile=[(.001,.035),(R-roundness,.035)]
 for i in range(1,13):
  t=i/12*math.pi/2;profile.append((R-roundness+roundness*math.sin(t),.035+roundness*(1-math.cos(t))))
 profile.extend([(R,H-.024),(R-.002,H-.007),(R-.011,H),(R-W+.009,H-.003),(R-W,H-.016),(R-W,H-.065),(R-W,B+.08),(R-W-.025,B+.02),(R-W-.1,B),(.001,B),(.001,.035)])
 lathe('glass',profile,glass)
 liq=mat('Liquid_'+drink,c['liquid'],.035,1,1.36)
 absorption=liq.node_tree.nodes.new('ShaderNodeVolumeAbsorption');absorption.inputs['Color'].default_value=c['absorption'];absorption.inputs['Density'].default_value=c['density'];liq.node_tree.links.new(absorption.outputs[0],liq.node_tree.nodes.get('Material Output').inputs['Volume'])
 r=R-W-.006;F=c['fill']
 # Follow the glass's curved inner fillet; the previous short diagonal penetrated its base.
 liquid=lathe('liquid',[(.001,B+.006),(r-.1,B+.006),(r-.025,B+.026),(r,B+.086),(r,F+.012),(r-.012,F+.016),(r-.045,F),(.001,F),(.001,B+.006)],liq,role='mixture')
 ice=mat('Ice clear wet volume',(.98,.99,1,1),.025,1,1.31)
 # More broken wet reflection on upper ice; the clear body stays low-roughness.
 inn=ice.node_tree.nodes;tc=inn.new('ShaderNodeTexCoord');sep=inn.new('ShaderNodeSeparateXYZ');ice.node_tree.links.new(tc.outputs['Generated'],sep.inputs[0])
 rough=inn.new('ShaderNodeMapRange');rough.inputs['From Min'].default_value=.73;rough.inputs['From Max'].default_value=.99;rough.inputs['To Min'].default_value=.025;rough.inputs['To Max'].default_value=.10
 ice.node_tree.links.new(sep.outputs['Z'],rough.inputs['Value']);ice.node_tree.links.new(rough.outputs['Result'],inn.get('Principled BSDF').inputs['Roughness'])
 block=ice_block(c['ice'],c['ice_z'],ice,c.get('ice_height'))
 if drink=='bbf-negroni':seat_bbf_ice(block)
 block['lift']=3.10-c['ice_z']
 # Subtract ice from the liquid: no impossible co-occupying optical media.
 mod=liquid.modifiers.new('Ice displaced liquid','BOOLEAN');mod.operation='DIFFERENCE';mod.object=block
 bpy.context.view_layer.objects.active=liquid
 try:bpy.ops.object.modifier_apply(modifier=mod.name)
 except Exception as e:print('BOOLEAN WARNING',e)
 preserve_planar_optical_normals(liquid)
 bubbles=mat('Tiny ice inclusions',(.83,.87,.88,1),.16,.85,1.03)
 for i in range(24):
  z=random.uniform(c['ice_z']-.43,c['ice_z']+.47);x=random.uniform(-.48,.48);y=random.uniform(-.48,.48);rr=random.uniform(.002,.009)
  sphere('ice_inclusion_%03d'%i,(x,y,z),(rr,rr*.8,rr*1.5),bubbles,lift=3.10-c['ice_z'])
 if drink=='negroni-express':
  pepper()
  for garnish in asset:
   if garnish.get('ingredientId')=='garnish':garnish.location.z-=.01520347595
 elif drink=='bbf-negroni':orange()
 else:
  flower()
  for garnish in asset:
   if garnish.get('ingredientId')=='garnish':
    garnish.location.z+=.0037815924;garnish['lift']=5.75
 # Representative recipe forms are equal-scale diagrams, not physical layers or quantities.
 reps={'negroni-express':[('modifiers',(.5,.32,.04,1))], 'bbf-negroni':[('spirit',(.8,.84,.82,1)),('bitter',(.25,.025,.01,1)),('vermouth',(.42,.06,.025,1))], 'ichigo-negroni':[('modifiers',(.8,.05,.015,1))]}[drink]
 row={'spirit':4.45,'bitter':5.50,'vermouth':6.55,'modifiers':7.60}
 for cat,color in reps:
  m=mat('Recipe representation '+cat,color,.08,.85,1.36)
  ob=sphere('recipe_'+cat,(0,0,1.1),(.38,.38,.25),m,category=cat,role='recipe',lift=row[cat]-1.1);ob.hide_render=True
  ob['evidence']='confirmed';ob['representation']='ingredient-diagram'
 # Explicit user request: real neutral objects for every unverified comparison category.
 # Equal-scale sculptural cubes communicate Unknown, with no invented substance or amount.
 unknown={'negroni-express':['spirit','bitter','vermouth'],'ichigo-negroni':['spirit','bitter','vermouth'],'bbf-negroni':['modifiers']}[drink]
 for cat in unknown:
  m=mat('Unknown recipe placeholder '+cat,(.73,.69,.58,1),.52,.08,1.45)
  ob=cube('recipe_'+cat,(0,0,1.1),(.70,.70,.44),.115,m,category=cat,role='recipe',lift=row[cat]-1.1)
  ob.hide_render=True;ob['evidence']='unverified';ob['representation']='unknown-placeholder';ob['label']='Unknown';ob['visibleWhen']='expanded'
 merge_related_parts()
 for ob in asset:
  if ob['ingredientId']=='garnish':ob['lift']+=.80
  # Update assembled metadata after deliberate rotations / location changes.
  ob['assembledPosition']=list(ob.location);ob['expandedPosition']=[ob.location.x,ob.location.y,ob.location.z+ob['lift']]
 stage(a.view,drink)
 sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=a.samples;sc.cycles.use_denoising=a.denoise;sc.cycles.max_bounces=16;sc.cycles.transmission_bounces=12;sc.cycles.transparent_max_bounces=12
 try:
  prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
  for device in prefs.devices:device.use=device.type=='METAL'
  if any(d.type=='METAL' for d in prefs.devices):sc.cycles.device='GPU'
 except Exception as e:print('Metal setup',e)
 sc.view_settings.view_transform='AgX';sc.view_settings.look='AgX - Medium High Contrast';sc.render.resolution_x=720;sc.render.resolution_y=900;sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG';sc.render.film_transparent=False
 sc['authoringVersion']=VERSION;sc['seed']=SEED;sc['sourceVideo']='negroni-bar-crawl.mp4';sc['unitsNote']='1 unit approx 4cm; absolute size not source-measured';sc['sourceManifest']='references/manifest.json'
 SCENE_OUT.mkdir(parents=True,exist_ok=True);MODEL_OUT.mkdir(parents=True,exist_ok=True);(P/'qa/evidence/blender').mkdir(parents=True,exist_ok=True)
 bpy.ops.wm.save_as_mainfile(filepath=str(SCENE_OUT/f'{drink}.blend'))
 bpy.ops.object.select_all(action='DESELECT')
 for ob in asset:ob.select_set(True)
 bpy.ops.export_scene.gltf(filepath=str(MODEL_OUT/f'{drink}.glb'),export_format='GLB',use_selection=True,export_extras=True,export_apply=True,export_yup=True)
 preserve_null_recipe_quantities(MODEL_OUT/f'{drink}.glb')
 manifest=dict(drink=drink,version=VERSION,seed=SEED,blender=bpy.app.version_string,parameters=c,scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),sourceManifestSha256=hashlib.sha256((P/'references/manifest.json').read_bytes()).hexdigest(),view=a.view,camera=dict(location=list(cam.location),rotation=list(cam.rotation_euler),lens=cam.data.lens) if (cam:=sc.camera) else None,render=dict(samples=a.samples,denoise=a.denoise,viewTransform=sc.view_settings.view_transform,look=sc.view_settings.look),parts=[dict(id=o.name,category=o['ingredientId'],role=o['role'],lift=o['lift'],assembledPosition=list(o.location),**(dict(evidence=o.get('evidence'),representation=o.get('representation'),label=o.get('label'),quantity=None,unit=None) if o['role']=='recipe' else {})) for o in asset])
 manifest['outputTag']=a.output_tag or None
 manifest['candidateProvenance']={'baseline':'Validated v0.12 optical fans/normals and lower ice clearances; v0.14 garnish preserved separately.','uncertainty':'Visible shapes are reference guided; hidden garnish attachment and BBF upper ice seating are inferred, not observed anatomy or recipe claims.','changes':{'bbf-negroni':{'upperIceCutoff':1.425999999,'upperIceScale':.2700870051,'preserved':'orange crown and all lower ice; fresh liquid Boolean'},'ichigo-negroni':{'wholeGarnishRaise':.0037815924,'sharedExpandedLift':6.55,'all35FloretsAttached':True,'flower':'short rounded ribbon cap; radius jitter; closed hidden common base/root attachments'},'negroni-express':{'wholeGarnishDrop':.01520347595,'pepper':'retained terminal radius with short cap; localized stem-shoulder compression'}}[drink]}

 (SCENE_OUT/f'{drink}.json').write_text(json.dumps(manifest,indent=2))
 if a.render:
  sc.render.filepath=str(P/'qa/evidence/blender'/f'{drink}-{a.view}.png');bpy.ops.render.render(write_still=True)
 if a.turntable:
  cam=sc.camera;center=Vector((0,0,1.2));dist=(cam.location-center).length
  sc.render.resolution_x=720;sc.render.resolution_y=900
  for f in range(72):
   theta=math.tau*f/72;cam.location=(dist*.93*math.sin(theta),-dist*.93*math.cos(theta),4.2);cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();sc.render.filepath=str(P/'qa/evidence/blender'/f'{drink}-orbit-{f:03d}.png');bpy.ops.render.render(write_still=True)
for drink in PARAMS if a.drink=='all' else [a.drink]:build(drink)
