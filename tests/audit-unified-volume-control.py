import bpy,json,hashlib,struct
from pathlib import Path
from array import array
P=Path(__file__).resolve().parents[1]
def sha(path): return hashlib.sha256(path.read_bytes()).hexdigest()
def val(x):
    try:return list(x)
    except TypeError:return x

def graph(material,ignore_ior=False):
    nodes=[]
    for n in material.node_tree.nodes:
        inputs={i.identifier:val(i.default_value) for i in n.inputs if hasattr(i,'default_value') and not(ignore_ior and n.type=='BSDF_PRINCIPLED' and i.name=='IOR')}
        nodes.append([n.name,n.type,inputs])
    links=sorted([l.from_node.name,l.from_socket.identifier,l.to_node.name,l.to_socket.identifier]for l in material.node_tree.links)
    return [sorted(nodes),links]
def geom(scene):
    h=hashlib.sha256()
    for o in sorted(scene.objects,key=lambda o:o.name):
        if o.type!='MESH':continue
        h.update(o.name.encode());h.update(struct.pack('<16f',*(v for r in o.matrix_world for v in r)))
        for v in o.data.vertices:h.update(struct.pack('<3f',*v.co))
        for f in o.data.polygons:h.update(struct.pack('<I',len(f.vertices)));h.update(struct.pack('<'+'I'*len(f.vertices),*f.vertices))
        for n in o.data.corner_normals:h.update(struct.pack('<3f',*n.vector))
    return h.hexdigest()

def snapshot(label):
    path=P/f'assets/blender/experiments/negroni-express-v012-interfaces-neutral-{label}-hero.blend'
    bpy.ops.wm.open_mainfile(filepath=str(path));s=bpy.context.scene;obj=s.objects['liquid'];m=obj.data
    metadata=json.loads(path.with_suffix('.json').read_text())
    rec={'path':str(path.relative_to(P)),'sha256':sha(path),'metadataShaMatches':sha(path)==metadata['sceneSha256'] if 'unified' in label else None,'geometryAndNormalsSha256':geom(s),'liquidMaterials':len(m.materials),'liquidFaces':len(m.polygons)}
    if 'unified' not in label:
        used=sorted({f.material_index for f in m.polygons})
        rec['usedLiquidMaterials']=[m.materials[i].name for i in used]
        rec['sourceGraphsEqualExceptIOR']=all(graph(m.materials[used[0]],True)==graph(m.materials[i],True) for i in used[1:])
        rec['perFaceIOR']=[m.materials[f.material_index].node_tree.nodes.get('Principled BSDF').inputs['IOR'].default_value for f in m.polygons]
    else:
        rec['perFaceIOR']=[v.value for v in m.attributes['liquid_surface_ior'].data]
        rec['attributeDomain']=m.attributes['liquid_surface_ior'].domain
        rec['allFaceMaterialZero']=all(f.material_index==0 for f in m.polygons)
        rec['iorLink']=[[l.from_node.type,l.from_socket.name,l.to_node.type,l.to_socket.name] for l in m.materials[0].node_tree.links if l.to_socket.name=='IOR']
    rec['nonLiquidGraphs']={o.name:[graph(mat) if mat else None for mat in o.data.materials] for o in s.objects if o.type=='MESH' and o!=obj}
    rec['config']={'camera':[[v for v in r]for r in s.camera.matrix_world],'lens':s.camera.data.lens,'resolution':[s.render.resolution_x,s.render.resolution_y,s.render.resolution_percentage],'crop':[s.render.border_min_x,s.render.border_max_x,s.render.border_min_y,s.render.border_max_y],'seed':s.cycles.seed,'samples':s.cycles.samples,'denoise':s.cycles.use_denoising,'bounces':[s.cycles.max_bounces,s.cycles.transmission_bounces,s.cycles.volume_bounces],'world':graph(s.world),'lights':[[o.name,o.hide_render,list(o.data.color),o.data.energy]for o in s.objects if o.type=='LIGHT'],'view':[s.view_settings.view_transform,s.view_settings.look,s.view_settings.exposure,s.view_settings.gamma]}
    return rec
rows={label:snapshot(label) for label in ['zero','d055','unified-zero','unified-d055']}
comparison={}
for label in ['zero','d055']:
 a,b=rows[label],rows['unified-'+label]
 comparison[label]={'sameGeometryAndNormals':a['geometryAndNormalsSha256']==b['geometryAndNormalsSha256'],'perFaceIORExactlyPreserved':a['perFaceIOR']==b['perFaceIOR'],'nonLiquidGraphsEqual':a['nonLiquidGraphs']==b['nonLiquidGraphs'],'cameraLightingRenderSettingsEqual':a['config']==b['config']}
for row in rows.values():
 for k in ['perFaceIOR','nonLiquidGraphs','config']:del row[k]
regions={'exposed_ice':(300,260),'central_liquid':(300,337),'lower_liquid':(300,414),'glass_base':(300,471)}
images={};exr_sources=[]
for label in rows:
 p=P/f'qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-{label}.exr';im=bpy.data.images.load(str(p),check_existing=False);pixels=array('f',[0])*len(im.pixels);im.pixels.foreach_get(pixels)
 images[label]=(list(im.size),im.channels,pixels)
 exr_sources.append({'path':str(p.relative_to(P)),'sha256':sha(p),'size':list(im.size),'isFloat':im.is_float,'colorSpace':im.colorspace_settings.name})
patches={}
for name,(cx,cy) in regions.items():
 patches[name]={}
 for side in (10,11):
  means={}
  for label,((w,h),channels,pixels) in images.items():
   vs=[[pixels[((h-1-y)*w+x)*channels+c] for c in range(3)] for y in range(cy-5,cy+side-5) for x in range(cx-5,cx+side-5)]
   means[label]=[sum(p[c] for p in vs)/len(vs) for c in range(3)]
  patches[name][str(side)]={'mean':means,'oldDensityRatio':[b/a for a,b in zip(means['zero'],means['d055'])],'unifiedDensityRatio':[b/a for a,b in zip(means['unified-zero'],means['unified-d055'])]}
report={'script':str(Path(__file__).relative_to(P)),'scriptSha256':sha(Path(__file__)),'kind':'Independent read-only Blender CPU inspection and native EXR decoding; no render or scene save','blender':bpy.app.version_string,'inputs':rows,'exrSources':exr_sources,'comparisons':comparison,'patches':patches,'patchConvention':'10x10 uses indices cx-5..cx+4 and cy-5..cy+4, matching CPU continuous raster support; 11x11 adds the far row/column. EXR bottom-up storage is converted to top-down indices.'}
out=P/'qa/evidence/blender/v012-unified-control-independent-review.json';out.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps({'output':str(out),'comparisons':comparison,'sourceSurfaceGraphsOnlyDifferInIOR':all(rows[k]['sourceGraphsEqualExceptIOR'] for k in ['zero','d055'])}))
