"""Isolated inferred ice-underside curvature with regenerated true-contact boundaries.

Full closed glass/ice volumes are retained hidden. Rendering omits the glass's
redundant wet closure: the single liquid volume shader owns that physical
interface at relative IOR1.36/1.51. No primary asset or runtime export is written.
"""
import bpy,bmesh,json,hashlib,math,struct
from pathlib import Path
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import barycentric_transform,intersect_ray_tri
P=Path(__file__).resolve().parents[1];TOL=2e-6;N=192
bpy.context.preferences.filepaths.save_version=0
source=P/'assets/blender/experiments/negroni-express-v012-interfaces-neutral-unified-d055-hero.blend'
ice_source=P/'assets/blender/candidates/v012/negroni-express.blend'
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
hash_before=sha(source);bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene
glass=scene.objects['glass'];liquid=scene.objects['liquid'];ice=scene.objects['ice']
R=1.;W=.021;B=.10;F=1.25;wetline=F+.012
def mesh_snapshot(ob):
    me=ob.data;me.calc_loop_triangles();vertices=[ob.matrix_world@v.co for v in me.vertices]
    triangles=[tuple(t.vertices) for t in me.loop_triangles]
    normals=[[(ob.matrix_world.to_3x3()@me.corner_normals[i].vector).normalized() for i in t.loops] for t in me.loop_triangles]
    adjacent=[set() for _ in vertices]
    for index,triangle in enumerate(triangles):
        for vertex in triangle:adjacent[vertex].add(index)
    return dict(vertices=vertices,triangles=triangles,normals=normals,adjacent=adjacent,tree=BVHTree.FromPolygons(vertices,triangles,all_triangles=True))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def add_scaled(a,b,s):return tuple(x+s*y for x,y in zip(a,b))
def closest_triangle_double(p,a,b,c):
    # Region-based closest point, evaluated in Python doubles. Blender's BVH
    # closest-point result can have ~9e-6 tangential error on tall thin faces.
    ab=sub(b,a);ac=sub(c,a);ap=sub(p,a);d1=dot(ab,ap);d2=dot(ac,ap)
    if d1<=0 and d2<=0:return tuple(a)
    bp=sub(p,b);d3=dot(ab,bp);d4=dot(ac,bp)
    if d3>=0 and d4<=d3:return tuple(b)
    vc=d1*d4-d3*d2
    if vc<=0 and d1>=0 and d3<=0:return add_scaled(a,ab,d1/(d1-d3))
    cp=sub(p,c);d5=dot(ab,cp);d6=dot(ac,cp)
    if d6>=0 and d5<=d6:return tuple(c)
    vb=d5*d2-d1*d6
    if vb<=0 and d2>=0 and d6<=0:return add_scaled(a,ac,d2/(d2-d6))
    va=d3*d6-d5*d4
    if va<=0 and d4-d3>=0 and d5-d6>=0:return add_scaled(b,sub(c,b),(d4-d3)/((d4-d3)+(d5-d6)))
    denominator=va+vb+vc
    if abs(denominator)<1e-30:return min([tuple(a),tuple(b),tuple(c)],key=lambda q:dot(sub(p,q),sub(p,q)))
    return add_scaled(add_scaled(a,ab,vb/denominator),ac,vc/denominator)
distance_refinement=dict(nearSamples=0,maximumBvhMinusDouble=0)
def precise_nearest(snapshot,point):
    raw_hit,raw_normal,index,raw_distance=snapshot['tree'].find_nearest(Vector(point))
    candidates={index}
    if raw_distance<.0002:
        for vertex in snapshot['triangles'][index]:candidates.update(snapshot['adjacent'][vertex])
    best=None
    for candidate in candidates:
        a,b,c=[tuple(snapshot['vertices'][i]) for i in snapshot['triangles'][candidate]]
        hit=closest_triangle_double(tuple(point),a,b,c);delta=sub(point,hit);distance=math.sqrt(dot(delta,delta))
        if best is None or distance<best[3]:
            ab=sub(b,a);ac=sub(c,a);normal=Vector((ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0])).normalized();best=(hit,normal,candidate,distance)
    if raw_distance<.0002:
        distance_refinement['nearSamples']+=1;distance_refinement['maximumBvhMinusDouble']=max(distance_refinement['maximumBvhMinusDouble'],raw_distance-best[3])
    return best
def interpolated_normal(snapshot,point):
    hit,_,index,distance=snapshot['tree'].find_nearest(point)
    a,b,c=[snapshot['vertices'][i] for i in snapshot['triangles'][index]];na,nb,nc=snapshot['normals'][index]
    return barycentric_transform(hit,a,b,c,na,nb,nc).normalized(),distance
def object_hash(ob):
    h=hashlib.sha256();h.update(struct.pack('<16f',*(v for row in ob.matrix_world for v in row)))
    for vertex in ob.data.vertices:h.update(struct.pack('<3f',*vertex.co))
    for face in ob.data.polygons:h.update(struct.pack('<I',len(face.vertices)));h.update(struct.pack('<'+'I'*len(face.vertices),*face.vertices))
    for normal in ob.data.corner_normals:h.update(struct.pack('<3f',*normal.vector))
    return h.hexdigest()
def exact_triangulate(ob):
    # Preserve the actual evaluated loop triangles of non-planar authored quads.
    # Rechoosing a quad diagonal after Boolean can change the physical surface.
    old=ob.data;old.calc_loop_triangles();triangles=list(old.loop_triangles)
    me=bpy.data.meshes.new(old.name+' exact evaluated triangles')
    me.from_pydata([tuple(vertex.co) for vertex in old.vertices],[],[tuple(triangle.vertices) for triangle in triangles]);me.update()
    for material in old.materials:me.materials.append(material)
    for face,triangle in zip(me.polygons,triangles):face.material_index=old.polygons[triangle.polygon_index].material_index;face.use_smooth=True
    me.normals_split_custom_set([tuple(old.corner_normals[index].vector) for triangle in triangles for index in triangle.loops]);ob.data=me
other_before={ob.name:object_hash(ob) for ob in scene.objects if ob.type=='MESH' and ob not in [glass,liquid,ice]}
old_glass=mesh_snapshot(glass);old_liquid=mesh_snapshot(liquid)
# Split the true glass cavity exactly at the existing outer meniscus contact height.
bm=bmesh.new();bm.from_mesh(glass.data)
bmesh.ops.bisect_plane(bm,geom=list(bm.verts)+list(bm.edges)+list(bm.faces),plane_co=Vector((0,0,wetline)),plane_no=Vector((0,0,1)),dist=1e-7,clear_inner=False,clear_outer=False)
bm.to_mesh(glass.data);bm.free();glass.data.update()
restored=[];glass_surface_max_distance=0
for loop in glass.data.loops:
    normal,distance=interpolated_normal(old_glass,glass.matrix_world@glass.data.vertices[loop.vertex_index].co)
    restored.append(tuple(normal));glass_surface_max_distance=max(glass_surface_max_distance,distance)
glass.data.normals_split_custom_set(restored)
assert glass_surface_max_distance<TOL,'Glass split changed the actual surface.'
full_glass=glass.copy();full_glass.data=glass.data.copy();full_glass.name='glass_closed_volume';scene.collection.objects.link(full_glass);full_glass.hide_render=True
for key in list(full_glass.keys()):del full_glass[key]
full_glass['diagnosticRole']='Complete closed physical glass, preserved for editing/audit; rendered wet boundary belongs to liquid.'
full_glass_snapshot=mesh_snapshot(full_glass)
def existing_ring(radius,z):
    points=[full_glass.matrix_world@v.co for v in full_glass.data.vertices if abs((full_glass.matrix_world@v.co).z-z)<TOL and abs(math.hypot((full_glass.matrix_world@v.co).x,(full_glass.matrix_world@v.co).y)-radius)<TOL]
    points.sort(key=lambda v:math.atan2(v.y,v.x)%math.tau)
    assert len(points)==N,(radius,z,len(points))
    return [tuple(v) for v in points]
bottom_center=next(tuple(full_glass.matrix_world@v.co) for v in full_glass.data.vertices if abs((full_glass.matrix_world@v.co).z-B)<TOL and math.hypot(v.co.x,v.co.y)<TOL)
outer=existing_ring(R-W,wetline)
rings=[[bottom_center],existing_ring(R-W-.1,B),existing_ring(R-W-.025,B+.02),existing_ring(R-W,B+.08),existing_ring(R-W,F),outer]
for radius,z in [(R-W-.012,F+.016),(R-W-.045,F)]:
    rings.append([(x*radius/(R-W),y*radius/(R-W),z) for x,y,_ in outer])
rings.append([(0,0,F)])
vertices=[];indices=[];faces=[]
for ring in rings:
    indices.append(list(range(len(vertices),len(vertices)+len(ring))));vertices.extend(ring)
for left,right in zip(indices,indices[1:]):
    for j in range(N):
        q=(j+1)%N
        if len(left)==1:faces.append((left[0],right[q],right[j]))
        elif len(right)==1:faces.append((left[j],left[q],right[0]))
        else:faces.append((left[j],left[q],right[q],right[j]))
mesh=bpy.data.meshes.new('Liquid hull matched to exact glass cavity rings');mesh.from_pydata(vertices,[],faces);mesh.update()
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(mesh);bm.free()
hull=bpy.data.objects.new('_contact_meniscus_hull',mesh);scene.collection.objects.link(hull)
with bpy.data.libraries.load(str(ice_source),link=False) as (_,load):load.objects=['ice']
full_ice=load.objects[0];scene.collection.objects.link(full_ice);full_ice.name='ice_closed_volume';full_ice.hide_render=True
loaded_ice_matrix_before=[list(row) for row in full_ice.matrix_world]
bpy.context.view_layer.update()
print('ICE_MATRIX_UPDATE',loaded_ice_matrix_before,[list(row) for row in full_ice.matrix_world])
assert all(abs(full_ice.matrix_world[i][j]-ice.matrix_world[i][j])<1e-6 for i in range(4) for j in range(4)),'Imported complete ice and existing render ice frames differ.'
for key in list(full_ice.keys()):del full_ice[key]
full_ice['diagnosticRole']='Original closed complete ice cutter/physical volume, unchanged from raw v012.'
full_ice_snapshot=mesh_snapshot(full_ice)
exact_triangulate(full_ice)
triangulated_ice_snapshot=mesh_snapshot(full_ice)
assert full_ice_snapshot['vertices']==triangulated_ice_snapshot['vertices'] and full_ice_snapshot['triangles']==triangulated_ice_snapshot['triangles'],'Complete ice evaluated surface changed.'
# Only the central flat underside moves inward. The shoulder, bevel, visible
# side planes, upper surface, pose, materials and garnish support stay fixed.
# This deliberately tests an unobserved mild melt curvature, not recovered anatomy.
old_bottom_mesh=full_ice.data;old_bottom_normals=[tuple(n.vector) for n in old_bottom_mesh.corner_normals]
bottom_z=-1.49/2;support=.59;amplitude=.025;changed_vertices={};original_vertices=[tuple(v.co) for v in old_bottom_mesh.vertices]
for vertex in old_bottom_mesh.vertices:
    x,y,z=vertex.co
    if abs(z-bottom_z)<1e-6 and abs(x)<support and abs(y)<support:
        wx=max(0,1-(x/support)**2)**2;wy=max(0,1-(y/support)**2)**2;dz=amplitude*wx*wy
        if dz>1e-10:changed_vertices[vertex.index]=dz
new_bottom_mesh=bpy.data.meshes.new('Inferred underside inward curvature .025 maximum')
new_bottom_mesh.from_pydata([(x,y,z+changed_vertices.get(i,0)) for i,(x,y,z) in enumerate(original_vertices)],[],[tuple(face.vertices) for face in old_bottom_mesh.polygons]);new_bottom_mesh.update()
for mat in old_bottom_mesh.materials:new_bottom_mesh.materials.append(mat)
for face,old in zip(new_bottom_mesh.polygons,old_bottom_mesh.polygons):face.material_index=old.material_index;face.use_smooth=old.use_smooth
new_bottom_mesh.update();new_normals=[tuple(n.vector) for n in new_bottom_mesh.corner_normals]
changed_faces=[]
for face in new_bottom_mesh.polygons:
    if any(index in changed_vertices for index in face.vertices):changed_faces.append(face.index)
    else:
        for loop_index in face.loop_indices:new_normals[loop_index]=old_bottom_normals[loop_index]
new_bottom_mesh.normals_split_custom_set(new_normals);full_ice.data=new_bottom_mesh
assert max(changed_vertices.values())<=amplitude+1e-9
assert all(tuple(full_ice.data.vertices[i].co)==v for i,v in enumerate(original_vertices) if i not in changed_vertices)
underside_treatment=dict(representation='inferred-underside-curvature-sensitivity',maximumInwardLocalZ=amplitude,actualMaximumVertexDisplacement=max(abs(full_ice.data.vertices[i].co.z-original_vertices[i][2]) for i in changed_vertices),supportHalfWidth=support,originalFlatBottomLocalZ=bottom_z,formula='dz=.025*(1-(x/.59)^2)^2*(1-(y/.59)^2)^2, only on original flat underside and within its support square',changedVertices=len(changed_vertices),changedFaces=len(changed_faces),totalVertices=len(original_vertices),allOtherVertexPositionsExactlyUnchanged=True,topSideBevelMaterialAndPoseUnchanged=True,sourceUncertainty='The underside is occluded in the native references. This is an explicitly inferred physical sensitivity test, not a recovered shape or a final ingredient claim.')
full_ice['diagnosticRole']='Complete physical ice with isolated inward-only underside curvature; original raw v012 remains preserved.'
full_ice_snapshot=mesh_snapshot(full_ice)
material=liquid.data.materials[0].copy();material.name='Contact liquid unified absorption and interface IOR'
bsdf=material.node_tree.nodes.get('Principled BSDF');assert abs(bsdf.inputs['Specular IOR Level'].default_value-.5)<1e-7
liquid.data=hull.data.copy();liquid.data.materials.clear();liquid.data.materials.append(material)
def boolean_difference(ob,cutter):
    bpy.ops.object.select_all(action='DESELECT');ob.select_set(True);bpy.context.view_layer.objects.active=ob
    modifier=ob.modifiers.new('Exact physical medium displacement','BOOLEAN');modifier.solver='EXACT';modifier.operation='DIFFERENCE';modifier.object=cutter;bpy.ops.object.modifier_apply(modifier=modifier.name)
boolean_difference(liquid,full_ice)
# Recompute the visible ice closure against the same actual raised meniscus hull.
ice.data=full_ice.data.copy();boolean_difference(ice,hull)
bpy.data.objects.remove(hull,do_unlink=True)
exact_triangulate(liquid);exact_triangulate(ice)
def face_distance(ob,face,snapshot):
    points=[ob.matrix_world@ob.data.vertices[index].co for index in face.vertices]
    points.append(sum(points,Vector())/len(points))
    return max(precise_nearest(snapshot,point)[3] for point in points)
liquid_classes=[];classification=[];missing=[]
for face in liquid.data.polygons:
    dg=face_distance(liquid,face,full_glass_snapshot);di=face_distance(liquid,face,full_ice_snapshot)
    if dg<TOL:kind='glass-contact';ior=1.36/1.51
    elif di<TOL:kind='ice-contact';ior=1.36/1.31
    elif min(liquid.data.vertices[i].co.z for i in face.vertices)>=F-TOL:kind='air-meniscus';ior=1.36
    else:kind='unclassified';ior=1.36;missing.append(dict(face=face.index,glassDistance=dg,iceDistance=di,center=list(face.center)))
    liquid_classes.append(kind);classification.append(ior)
if missing:
    face=liquid.data.polygons[missing[0]['face']]
    for index in face.vertices:
        point=liquid.matrix_world@liquid.data.vertices[index].co;hit,normal,ti,distance=full_glass_snapshot['tree'].find_nearest(point)
        print('CONTACT_DEBUG',index,list(point),list(hit),distance,[list(full_glass_snapshot['vertices'][i]) for i in full_glass_snapshot['triangles'][ti]])
assert not missing,missing[:10]
liquid.data.materials.clear();liquid.data.materials.append(material)
attribute=liquid.data.attributes.new('liquid_surface_ior','FLOAT','FACE')
for face,value in zip(liquid.data.polygons,classification):face.material_index=0;attribute.data[face.index].value=value
liquid.data.update();normals=[];old_ice_match_max=0
for face,kind in zip(liquid.data.polygons,liquid_classes):
    for loop_index in face.loop_indices:
        loop=liquid.data.loops[loop_index];point=liquid.matrix_world@liquid.data.vertices[loop.vertex_index].co
        normal=liquid.data.corner_normals[loop_index].vector.copy()
        if kind=='glass-contact':normal=-interpolated_normal(full_glass_snapshot,point)[0]
        elif kind=='ice-contact':
            prior,distance=interpolated_normal(old_liquid,point)
            local=full_ice.matrix_world.inverted()@point
            if local.z<bottom_z+.08 and abs(local.x)<support+1e-5 and abs(local.y)<support+1e-5:
                normal=-interpolated_normal(full_ice_snapshot,point)[0]
            elif distance<TOL:normal=prior
            old_ice_match_max=max(old_ice_match_max,distance)
        elif abs(face.normal.z)>.999999:normal=Vector((0,0,1 if face.normal.z>0 else -1))
        normals.append(tuple(normal))
liquid.data.normals_split_custom_set(normals)
# Exact liquid contact triangles identify the redundant wet glass closure.
liquid_snapshot=mesh_snapshot(liquid);wet=[];dry=[];closure_error=0
for face in full_glass.data.polygons:
    distance=face_distance(full_glass,face,liquid_snapshot)
    if distance<TOL:wet.append(face.index);closure_error=max(closure_error,distance)
    else:dry.append(face.index)
assert wet and dry
unity=full_glass.data.materials[0].copy();unity.name='Hidden redundant wet glass closure unity IOR';unity.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1;full_glass.data.materials.append(unity)
for index in wet:full_glass.data.polygons[index].material_index=len(full_glass.data.materials)-1
used=sorted({index for face_index in dry for index in full_glass.data.polygons[face_index].vertices});remap={old:new for new,old in enumerate(used)}
proxy=bpy.data.meshes.new('Glass render boundary without redundant wet closure');proxy.from_pydata([tuple(full_glass.data.vertices[index].co) for index in used],[],[tuple(remap[i] for i in full_glass.data.polygons[index].vertices) for index in dry]);proxy.update();proxy.materials.append(full_glass.data.materials[0])
proxy.normals_split_custom_set([tuple(full_glass.data.corner_normals[index].vector) for face_index in dry for index in full_glass.data.polygons[face_index].loop_indices]);glass.data=proxy
glass['opticalRepresentation']='Compound boundary: wet interface rendered exactly once by liquid. Hidden glass_closed_volume preserves complete closed source. Expansion unsupported in this isolated candidate.'
ice_base=full_ice.data.materials[0];ice_unity=ice_base.copy();ice_unity.name='Ice top volume closure already resolved at liquid surface';ice_unity.node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value=1
ice.data.materials.clear();ice.data.materials.append(ice_base);ice.data.materials.append(ice_unity);ice_counts={'originalAirSurface':0,'redundantClosure':0}
for face in ice.data.polygons:
    original=face_distance(ice,face,full_ice_snapshot)<TOL
    face.material_index=0 if original else 1;ice_counts['originalAirSurface' if original else 'redundantClosure']+=1
def topology(ob):
    bm=bmesh.new();bm.from_mesh(ob.data);result=dict(vertices=len(bm.verts),edges=len(bm.edges),faces=len(bm.faces),nonManifoldEdges=sum(not edge.is_manifold for edge in bm.edges),signedVolume=bm.calc_volume(signed=True));bm.free();return result
topologies={ob.name:topology(ob) for ob in [full_glass,full_ice,liquid,ice,glass]}
for name in ['glass_closed_volume','ice_closed_volume','liquid','ice']:assert topologies[name]['nonManifoldEdges']==0 and topologies[name]['signedVolume']>0,(name,topologies[name])
def inside_samples(ob,snapshot):
    inside=[];minimum=math.inf
    points=[ob.matrix_world@v.co for v in ob.data.vertices]+[ob.matrix_world@face.center for face in ob.data.polygons]
    for index,point in enumerate(points):
        hit,normal,_,distance=precise_nearest(snapshot,point);signed=distance if dot(sub(point,hit),normal)>=0 else -distance;minimum=min(minimum,signed)
        if distance>TOL and signed<-TOL:inside.append(dict(sample=index,signedDistance=signed,point=list(point)))
    return dict(samples=len(points),strictInsideCount=len(inside),minimumNearestOrientedDistance=minimum,examples=inside[:10])
glass_inside=inside_samples(liquid,full_glass_snapshot);ice_inside=inside_samples(liquid,full_ice_snapshot)
assert not glass_inside['strictInsideCount'],glass_inside
assert not ice_inside['strictInsideCount'],ice_inside
areas={kind:sum(face.area for face,k in zip(liquid.data.polygons,liquid_classes) if k==kind) for kind in set(liquid_classes)}
wet_glass_area=sum(full_glass.data.polygons[index].area for index in wet)
assert abs(wet_glass_area-areas['glass-contact'])<2e-5,(wet_glass_area,areas)
assert {ob.name:object_hash(ob) for ob in scene.objects if ob.name in other_before}==other_before
out=P/'assets/blender/experiments/negroni-express-v012-contact-underside-v1-neutral-base.blend';scene.render.filepath=str(P/'qa/evidence/blender/negroni-express-hero-v012-contact-underside-v1-neutral-base.png')
bpy.ops.wm.save_as_mainfile(filepath=str(out));assert sha(source)==hash_before
record=dict(source=str(source.relative_to(P)),sourceSha256=hash_before,physicalIceSource=str(ice_source.relative_to(P)),physicalIceSourceSha256=sha(ice_source),scriptSha256=sha(Path(__file__)),scene=str(out.relative_to(P)),sceneSha256=sha(out),toleranceAuthoredUnits=TOL,geometryTreatment='Liquid wall/base now use exact copied glass cavity rings, with original meniscus profile offsets/height retained. Actual ice Boolean displacement and visible above-meniscus ice are rebuilt from unchanged complete source ice.',contact=dict(wetline=wetline,glassGap=0,activeBoundaryOwner='liquid',relativeIOR=1.36/1.51,liquidMaterialCount=1,attribute='liquid_surface_ior',classCounts={kind:liquid_classes.count(kind) for kind in set(liquid_classes)},areas=areas,wetGlassArea=wet_glass_area,omittedWetGlassFaces=len(wet),maximumMatchedClosureDistance=closure_error,glassSurfaceDistanceAfterSplit=glass_surface_max_distance),topology=topologies,liquidGlassSamples=glass_inside,liquidIceSamples=ice_inside,iceClassification=ice_counts,distanceRefinement=distance_refinement,unclassifiedFaces=missing,unchangedOtherGeometryAndNormals=True,renderCompleted=False,limitations='CPU construction checks manifold closed physical volumes, full face-sample contact classification, equal matched interface area, and all vertex/face-centroid signed distances. Near-contact closest points are evaluated in Python doubles against the BVH candidate and its adjacent triangles, retaining the2e-6 tolerance. An independent actual triangle crossing audit and neutral transport control are required before a valid rendering or physical-fidelity claim. Render-only glass is intentionally open; complete closed glass is retained hidden. No expansion or GLB promotion.')
record['geometryTreatment']='Original true-contact construction plus a bounded inward-only central ice underside curvature. Glass, meniscus, visible sides/top, pose, source materials and garnish remain fixed. Actual liquid displacement and visible-ice closure are regenerated.'
record['undersideTreatment']=underside_treatment
out.with_suffix('.json').write_text(json.dumps(record,indent=2));(P/'qa/evidence/blender/v012-contact-underside-v1-cpu-construction.json').write_text(json.dumps(record,indent=2));print(json.dumps(record,indent=2))
