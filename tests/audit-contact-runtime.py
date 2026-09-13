"""Independently decode the contact GLB, match oriented triangles and corner normals."""
from pathlib import Path
import hashlib,json,struct,itertools,collections
import numpy as np
P=Path(__file__).resolve().parents[1];D=P/'qa/evidence/contact-runtime-export'
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((D/'manifest.json').read_text());source=json.loads((D/'independent-source.json').read_text())
for path,expected in [(manifest['source'],manifest['sourceSha256']),(manifest['output'],manifest['outputSha256']),(manifest['triangleEvidence']['path'],manifest['triangleEvidence']['sha256']),(source['binary'],source['binarySha256']),*manifest['primaryHashes'].items()]:assert sha(P/path)==expected,path
b=(P/manifest['output']).read_bytes();assert b[:4]==b'glTF' and struct.unpack_from('<II',b,4)==(2,len(b));n=struct.unpack_from('<I',b,12)[0];j=json.loads(b[20:20+n]);start=20+n;bn,kind=struct.unpack_from('<II',b,start);assert kind==0x004e4942;data=memoryview(b)[start+8:start+8+bn]
ct={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'};sz={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
def accessor(i):
 a=j['accessors'][i];assert 'sparse' not in a and not a.get('normalized',False);v=j['bufferViews'][a['bufferView']];dt=np.dtype(ct[a['componentType']]);k=sz[a['type']];return np.ndarray((a['count'],k),dtype=dt,buffer=data,offset=v.get('byteOffset',0)+a.get('byteOffset',0),strides=(v.get('byteStride',dt.itemsize*k),dt.itemsize)).astype(float)
def matrix(node):
 if 'matrix' in node:return np.array(node['matrix']).reshape(4,4).T
 x,y,z,w=node.get('rotation',[0,0,0,1]);r=np.array([[1-2*(y*y+z*z),2*(x*y-z*w),2*(x*z+y*w)],[2*(x*y+z*w),1-2*(x*x+z*z),2*(y*z-x*w)],[2*(x*z-y*w),2*(y*z+x*w),1-2*(x*x+y*y)]]);m=np.eye(4);m[:3,:3]=r@np.diag(node.get('scale',[1,1,1]));m[:3,3]=node.get('translation',[0,0,0]);return m
rows=np.fromfile(P/source['binary'],dtype='<f4').reshape(-1,22).astype(float);localrows=np.fromfile(P/source['localBinary'],dtype='<f4').reshape(-1,22).astype(float);source_objects=source['objects'];names=[r['name'] for r in source_objects];results=[];visited=[];boundaries=[];all_materials=[]
media=j['scenes'][j.get('scene',0)]['extras']['atlasOpticalMedia'];assert media==manifest['opticalMediums'];assert 'no expansion support' in j['scenes'][0]['extras']['atlasOpticalRepresentation']
for mi,mat in enumerate(j['materials']):
 boundary=mat.get('extras',{}).get('atlasOpticalBoundary')
 if not boundary:continue
 assert boundary['schemaVersion']==1 and boundary['insideMedium']!=boundary['outsideMedium'];inside=media[str(boundary['insideMedium'])]['ior'];outside=media[str(boundary['outsideMedium'])]['ior'];assert abs(boundary['relativeIOR']-inside/outside)<1e-14;standard=mat.get('extensions',{}).get('KHR_materials_ior',{}).get('ior',1.5);assert standard>=1 and abs(standard-inside)<1e-7
 all_materials.append({'index':mi,'name':mat['name'],'inside':boundary['insideMedium'],'outside':boundary['outsideMedium'],'relativeIOR':boundary['relativeIOR'],'standardIOR':standard})
def walk(ni,parent):
 node=j['nodes'][ni];world=parent@matrix(node);name=node.get('name','');visited.append(name)
 assert name not in manifest['excludedCompleteSolids'] and node.get('extras',{}).get('role')!='recipe'
 if 'mesh' in node and name in names:
  oi=names.index(name);expected=rows[rows[:,21]==oi];p=expected[:,:9].reshape(-1,3,3);normals=expected[:,9:18].reshape(-1,3,3);localexpected=localrows[localrows[:,21]==oi];localp=localexpected[:,:9].reshape(-1,3,3);localnormals=localexpected[:,9:18].reshape(-1,3,3);localmap=collections.defaultdict(list)
  for idx,t in enumerate(localp):
   for shift in range(3):localmap[tuple(np.roll(t,-shift,axis=0).reshape(-1))].append((idx,shift))
  cells=collections.defaultdict(list);centers=p.mean(axis=1);cellsize=1e-5
  for index,center in enumerate(centers):cells[tuple(np.floor(center/cellsize).astype(int))].append(index)
  used=set();num=0;maxpos=0.;maxnorm=0.;maxgeonorm=0.;nonexactnorm=0;unmatched=[];regioncounts=collections.Counter();localmisses=0;zeroSourceNormals=0;zeroExportNormals=0;localNormalDifferences=[];degenerateSourceWorld=0;degenerateActualWorld=0;nm=np.linalg.inv(world[:3,:3]).T
  for primitive in j['meshes'][node['mesh']]['primitives']:
   assert primitive.get('mode',4)==4;attributes=primitive['attributes'];vp=accessor(attributes['POSITION']);vn=accessor(attributes['NORMAL']);localvp=vp.copy();localvn=vn.copy();vp=vp@world[:3,:3].T+world[:3,3];vn=vn@nm.T;vn/=np.linalg.norm(vn,axis=1)[:,None];ids=accessor(primitive['indices']).astype(int).reshape(-1,3);mat=j['materials'][primitive['material']];boundary=mat['extras']['atlasOpticalBoundary'];label=(boundary['insideMedium'],boundary['outsideMedium']);regioncounts[str(label)]+=len(ids)
   for indices in ids:
    actual=vp[indices];an=vn[indices];cell=tuple(np.floor(actual.mean(axis=0)/cellsize).astype(int));candidates=cells.get(cell,[])
    def closest(candidates):
     best=(float('inf'),None,None)
     for ci in candidates:
      if ci in used:continue
      shift=int(np.argmin(np.linalg.norm(p[ci]-actual[0],axis=1)));aligned=np.roll(p[ci],-shift,axis=0);error=float(np.max(np.abs(actual-aligned)))
      if error<best[0]:best=(error,ci,shift)
     return best
    exact=[v for v in localmap.get(tuple(localvp[indices].reshape(-1)),[]) if v[0] not in used]
    if exact:
     ci,shift=exact[0];error=float(np.max(np.abs(actual-np.roll(p[ci],-shift,axis=0))))
    else:
     localmisses+=1;error,ci,shift=closest(candidates)
    if ci is None or error>5e-7:
     candidates=[i for dx in itertools.product([-1,0,1],repeat=3) for i in cells.get(tuple(c+d for c,d in zip(cell,dx)),[])];error,ci,shift=closest(candidates)
    if ci is None or error>5e-7:unmatched.append({'triangle':num,'error':error});num+=1;continue
    used.add(ci);assert tuple(expected[ci,19:21].astype(int))==label;assert abs(expected[ci,18]-boundary['relativeIOR'])<1e-7
    en=np.roll(normals[ci],-shift,axis=0);length=np.linalg.norm(en,axis=1);zeroSourceNormals+=int(np.sum(length==0));zeroExportNormals+=int(np.sum(np.linalg.norm(localvn[indices],axis=1)==0));en=np.divide(en,length[:,None],out=np.zeros_like(en),where=length[:,None]!=0);normalerror=float(np.max(np.abs(en-an)));g1=np.cross(actual[1]-actual[0],actual[2]-actual[0]);ep=np.roll(p[ci],-shift,axis=0);g2=np.cross(ep[1]-ep[0],ep[2]-ep[0]);l1=float(np.linalg.norm(g1));l2=float(np.linalg.norm(g2));degenerateSourceWorld+=l2==0;degenerateActualWorld+=l1==0;geo=float(np.linalg.norm(g1/l1-g2/l2)) if l1 and l2 else 0.;maxpos=max(maxpos,error);maxnorm=max(maxnorm,normalerror);maxgeonorm=max(maxgeonorm,geo);nonexactnorm+=normalerror>1e-6
    ln=np.roll(localnormals[ci],-shift,axis=0);ld=float(np.max(np.abs(ln-localvn[indices])))
    if ld>.1:localNormalDifferences.append({'sourceTriangle':int(ci),'maximumLocalNormalDelta':ld,'sourceWorldArea':l2/2,'localPositions':localvp[indices].tolist(),'sourceLocalNormals':ln.tolist(),'actualLocalNormals':localvn[indices].tolist()})
    num+=1
  results.append({'object':name,'sourceTriangles':len(expected),'exportTriangles':num,'matchedOrientedTriangles':len(used),'unmatchedCount':len(unmatched),'unmatchedExamples':unmatched[:10],'maximumPositionComponentDelta':maxpos,'maximumCornerNormalComponentDelta':maxnorm,'trianglesWithNormalDeltaAbove1eMinus6':nonexactnorm,'maximumUnitGeometricNormalDelta':maxgeonorm,'boundaryTriangleCounts':dict(regioncounts),'localPositionExactMatchFailures':localmisses,'sourceZeroCornerNormals':zeroSourceNormals,'exportZeroCornerNormals':zeroExportNormals,'sourceWorldDegenerateTriangles':degenerateSourceWorld,'exportWorldDegenerateTriangles':degenerateActualWorld,'localNormalDifferenceAbovePoint1Count':len(localNormalDifferences),'localNormalDifferenceAbovePoint1Examples':localNormalDifferences})
 for child in node.get('children',[]):walk(child,world)
for ni in j['scenes'][j.get('scene',0)]['nodes']:walk(ni,np.eye(4))
# Direct comparison against the exporter's own rows, independently read from original blend.
er=np.fromfile(P/manifest['triangleEvidence']['path'],dtype='<f4').reshape(-1,22);ownrowdiff=[]
for oi,name in enumerate(names):
 mr=next((idx,r)for idx,r in enumerate(manifest['objects'])if r['name']==name);a=rows[rows[:,21]==oi];z=er[er[:,21]==mr[0]];assert a.shape==z.shape
 ownrowdiff.append({'object':name,'positionsExactlyEqual':bool(np.array_equal(a[:,:9],z[:,:9])),'maximumNormalComponentDelta':float(np.max(np.abs(a[:,9:18]-z[:,9:18]))),'boundaryColumnsExactlyEqual':bool(np.array_equal(a[:,18:21],z[:,18:21]))})
record={'source':manifest['source'],'sourceSha256':manifest['sourceSha256'],'glb':manifest['output'],'glbSha256':sha(P/manifest['output']),'scriptSha256':sha(Path(__file__)),'sourceExtraction':source,'sourceEvidenceAgainstIndependentOriginal':ownrowdiff,'objects':results,'positionAndBoundaryContractPass':all(r['unmatchedCount']==0 and r['localPositionExactMatchFailures']==0 for r in results),'cornerNormalPreservationPass':all(r['localNormalDifferenceAbovePoint1Count']==0 for r in results),'materials':all_materials,'visitedNodes':visited,'allSourceAndPrimaryHashesMatch':True,'omittedIceClosureTriangles':next(r['omitted']for r in source_objects if r['name']=='ice'),'method':'Independent read-only evaluated Blender extraction, raw GLB accessor/scene transforms decoded in NumPy double precision, one-to-one oriented triangle matching (cyclic order allowed, reversal forbidden) at maximum component tolerance5e-7; labels and corner normals compared after inverse-transpose world transform. Geometric normal differences on narrow triangles reported separately. No rendering or asset edits.','limits':'Float32 storage / transform tolerances, not a proof of GPU ray behavior. Standard fallback cannot reproduce compound boundary optics. Source contacts inherited from independently audited same source hash.'}
out=D/'independent-audit.json';out.write_text(json.dumps(record,indent=2));print(json.dumps({'output':str(out.relative_to(P)),'objects':results,'sourceRows':ownrowdiff},indent=2))
assert all(r['unmatchedCount']==0 and r['sourceTriangles']==r['exportTriangles']==r['matchedOrientedTriangles'] for r in results)
