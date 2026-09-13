"""Diagnostic optical interface model. Preserves production source, writes -interfaces assets.
Approximate exact nested refractive interfaces with relative IORs; eliminate doubled air boundaries.
Run Blender -b --python scripts/experiment-interfaces.py. Review before production adoption.
"""
import bpy,bmesh,json,argparse,sys,math
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
P=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--air-gap',action='store_true');parser.add_argument('--source-tag',choices=['v012']);parser.add_argument('--meniscus-boundary',action='store_true');args=parser.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else [])
suffix='interfaces-air-gap' if args.air_gap else 'interfaces'
source_dir=P/'assets/blender'/('candidates/'+args.source_tag if args.source_tag else '')
model_dir=P/'public/models'/('candidates/'+args.source_tag if args.source_tag else '')
bpy.ops.wm.open_mainfile(filepath=str(source_dir/'negroni-express.blend'))
manifest=json.loads((source_dir/'negroni-express.json').read_text());fill=manifest['parameters']['fill'];base=manifest['parameters']['base'];wall=manifest['parameters']['wall']
parts=[o for o in bpy.context.scene.objects if 'scenePartId' in o and o.type=='MESH' and not o.name.startswith('stage_')]
ice_source=bpy.data.objects['ice'];ice_vertices=[ice_source.matrix_world@v.co for v in ice_source.data.vertices]
ice_tree=BVHTree.FromPolygons(ice_vertices,[list(f.vertices) for f in ice_source.data.polygons])
def split_at_z(o,z):
 bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 bm=bmesh.new();bm.from_mesh(o.data);co=o.matrix_world.inverted()@Vector((0,0,z));normal=o.matrix_world.to_3x3().inverted()@Vector((0,0,1))
 bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=co,plane_no=normal,dist=1e-6,clear_outer=False,clear_inner=False)
 bm.to_mesh(o.data);bm.free();o.data.update()
def clone_mat(o,name,ior):
 m=o.data.materials[0].copy();m.name=name;m.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=ior
 m['interfaceIOR']=ior;o.data.materials.append(m);return len(o.data.materials)-1
def liquid_hull():
 # Reconstruct the exact pre-ice liquid profile, including its raised meniscus.
 # A flat height split leaves duplicate ice boundaries where the meniscus rises.
 r=manifest['parameters']['radius']-wall-.006;B=base;F=fill
 profile=[(0,B+.006),(r-.1,B+.006),(r-.025,B+.026),(r,B+.086),(r,F+.012),(r-.012,F+.016),(r-.045,F),(0,F)]
 vertices=[];faces=[];rings=[];n=192
 for radius,z in profile:
  ring=[]
  for j in range(1 if radius==0 else n):
   ring.append(len(vertices));angle=j*math.tau/n;vertices.append((radius*math.cos(angle),radius*math.sin(angle),z))
  rings.append(ring)
 for left,right in zip(rings,rings[1:]):
  for j in range(n):
   q=(j+1)%n
   if len(left)==1:faces.append((left[0],right[q],right[j]))
   elif len(right)==1:faces.append((left[j],left[q],right[0]))
   else:faces.append((left[j],left[q],right[q],right[j]))
 mesh=bpy.data.meshes.new('Diagnostic liquid hull');mesh.from_pydata(vertices,[],faces);mesh.update()
 bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
 hull=bpy.data.objects.new('Diagnostic liquid hull',mesh);bpy.context.collection.objects.link(hull);return hull
def resolve_meniscus_ice(o,omitted_index):
 hull=liquid_hull();modifier=o.modifiers.new('Actual meniscus boundary','BOOLEAN');modifier.operation='DIFFERENCE';modifier.solver='EXACT';modifier.object=hull
 bpy.context.view_layer.objects.active=o;bpy.ops.object.modifier_apply(modifier=modifier.name)
 retained=omitted=0
 for face in o.data.polygons:
  point=o.matrix_world@face.center;normal=(o.matrix_world.to_3x3()@face.normal).normalized()
  nearest=ice_tree.find_nearest(point)
  distances=[ice_tree.find_nearest(o.matrix_world@o.data.vertices[index].co)[3] for index in face.vertices]
  if nearest and max(distances)<.0003 and normal.dot(nearest[1])>.95:
   face.material_index=0;retained+=1
  else:
   # The liquid cavity already defines these interfaces; omit boolean closure faces.
   face.material_index=omitted_index;omitted+=1
 bpy.data.objects.remove(hull,do_unlink=True)
 print('Meniscus-aware ice:',retained,'original air faces;',omitted,'redundant closure faces')
for o in parts:
 if o.name not in ['glass','liquid','ice']:continue
 if o.name!='ice' or not args.meniscus_boundary:split_at_z(o,fill)
 if o.name=='glass':
  if args.air_gap:continue
  idx=clone_mat(o,'Interface glass to liquid n1.51 over1.36',1.51/1.36)
  for face in o.data.polygons:
   c=o.matrix_world@face.center;n=o.matrix_world.to_3x3()@face.normal;rad=c.x*n.x+c.y*n.y
   if c.z<fill-1e-4 and ((rad<-.05 and c.z>base+.005) or (n.z>.5 and c.z<base+.02)):face.material_index=idx
 elif o.name=='liquid':
  idx0=clone_mat(o,'Liquid contact with glass already resolved',1.0);idx1=clone_mat(o,'Interface liquid to ice n1.36 over1.31',1.36/1.31)
  for face in o.data.polygons:
   c=o.matrix_world@face.center;n=o.matrix_world.to_3x3()@face.normal;rad=c.x*n.x+c.y*n.y
   # Boolean polygons can span triangulated non-planar cutter quads. Their
   # centroid may lie off the cutter even when every boundary vertex matches it.
   distances=[ice_tree.find_nearest(o.matrix_world@o.data.vertices[v].co)[3] for v in face.vertices]
   if max(distances)<.0003:face.material_index=idx1
   elif not args.air_gap and c.z<fill-.004 and (rad>.06 or n.z<-.5):face.material_index=idx0
 elif o.name=='ice':
  idx=clone_mat(o,'Ice submerged interface already resolved',1.0)
  if args.meniscus_boundary:resolve_meniscus_ice(o,idx)
  else:
   for face in o.data.polygons:
    c=o.matrix_world@face.center
    if c.z<fill-1e-5:face.material_index=idx
 o['opticalExperiment']='relative interfaces; actual meniscus split' if args.meniscus_boundary else 'relative interfaces v1; not yet accepted'
bpy.ops.wm.save_as_mainfile(filepath=str(source_dir/f'negroni-express-{suffix}.blend'))
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(model_dir/f'negroni-express-{suffix}.glb'),export_format='GLB',use_selection=True,export_extras=True,export_apply=True)
print('Interface experiment exported; production source unchanged')
