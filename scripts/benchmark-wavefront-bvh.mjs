// CPU-only replay of the existing seeded wavefront boundary audit. No WebGL.
// Tree partitioning keeps every triangle retained by the diagnostic importer.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,SAH,getBVHExtremes} from 'three-mesh-bvh';

const source=process.env.ATLAS_AUDIT_MODEL||'public/models/candidates/v012/negroni-express-interfaces-air-gap.glb';
const traceEmitters=process.env.ATLAS_BVH_EMITTERS==='1';
const output=`qa/evidence/wavefront-bvh-partition-cpu${traceEmitters?'-emitters':''}.json`;
const auditPath='tests/audit-wavefront-transport.mjs';
const auditSource=fs.readFileSync(auditPath,'utf8');
// Reuse the actual audited transport and seeded branches, collecting each query
// without reimplementing scattering. Only corpus dimensions and output change.
let setup=auditSource.slice(0,auditSource.indexOf('const report='))
  .replace(/^import .*;\n/gm,'')
  .replace("const source=process.env.ATLAS_AUDIT_MODEL||'public/models/negroni-express-interfaces-air-gap.glb';",'const source=inputSource;')
  .replace('const height=75,width=60,samples=32,','const height=30,width=24,samples=8,')
  .replace('const rows=[],gs=[];','const rays=[];let triangleId=0;const rows=[],gs=[];')
  .replace('gs.push(g);',"g.setAttribute('originalTriangle',new T.Float32BufferAttribute(Array.from({length:s.attributes.position.count},(_,i)=>triangleId+Math.floor(i/3)),1));triangleId+=s.attributes.position.count/3;gs.push(g);")
  .replace('const hit=bvh.raycastFirst(new T.Ray(p,d),T.DoubleSide)', 'rays.push(new T.Ray(p.clone(),d.clone()));const hit=bvh.raycastFirst(new T.Ray(p,d),T.DoubleSide)');
if(!setup.includes('rays.push')||!setup.includes('height=30'))throw new Error('Audit source contract changed');
if(traceEmitters){
  // Match the prototype's two rectangular emitters exactly. Both are terminal
  // intersections in this transport corpus; front/back radiance is not sampled.
  const emitterSetup=`
  for(const [color,intensity,width,height,position] of [
    ['#fff3df',5,.65,5,[-4,3,2]],['#e5edff',3,.45,4,[3,2.8,-1]],
  ]){
    const light=new T.RectAreaLight(color,intensity,width,height);
    light.position.fromArray(position);light.lookAt(0,1.2,0);light.updateMatrixWorld();
    const g=new T.PlaneGeometry(width,height).rotateY(Math.PI).applyMatrix4(light.matrixWorld).toNonIndexed();
    g.deleteAttribute('normal');g.deleteAttribute('uv');
    rows.push({part:'emitter_'+rows.length,material:'terminal emitter',ior:1,optical:false,inside:0,outside:0});
    g.setAttribute('row',new T.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(rows.length-1),1));
    g.setAttribute('originalTriangle',new T.Float32BufferAttribute(Array.from({length:g.attributes.position.count},(_,i)=>triangleId+Math.floor(i/3)),1));
    triangleId+=g.attributes.position.count/3;gs.push(g);
  }
  `;
  setup=setup.replace('const g=mergeGeometries(gs),',emitterSetup+'\nconst g=mergeGeometries(gs),');
}
setup+='\nconst transportStats=run(Math.fround(.035),true);return {rows,gs,g,bvh,rays,transportStats,gltf};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const {rows,gs,g,bvh,rays,transportStats,gltf}=await new AsyncFunction('fs','createHash','T','GLTFLoader','mergeGeometries','MeshBVH','SAH','inputSource',setup)(fs,createHash,T,GLTFLoader,mergeGeometries,MeshBVH,SAH,source);
const byName=new Map();
for(let i=0;i<rows.length;i++){
  const key=rows[i].part;
  if(!byName.has(key))byName.set(key,[]);
  byName.get(key).push(gs[i]);
}
function tree(name,geometries){
  const geometry=mergeGeometries(geometries,false);
  const boundsTree=new MeshBVH(geometry,{strategy:SAH,targetLeafSize:4});
  return {name,geometry,bvh:boundsTree,bounds:boundsTree.getBoundingBox(new T.Box3())};
}
const merged={name:'merged',geometry:g,bvh,bounds:bvh.getBoundingBox(new T.Box3())};
const split=[tree('optical',gs.filter((_,i)=>rows[i].optical)),tree('opaque',gs.filter((_,i)=>!rows[i].optical))];
const perPart=Array.from(byName,([name,geometries])=>tree(name,geometries));
const partitionTrees={split,perPart};
if(traceEmitters)partitionTrees.drinkAndEmitters=[tree('drink',gs.filter((_,i)=>!rows[i].part.startsWith('emitter_'))),...perPart.filter(t=>t.name.startsWith('emitter_'))];
function boundsEntry(ray,box){
  let lo=0,hi=Infinity;
  for(const axis of ['x','y','z']){
    const o=ray.origin[axis],d=ray.direction[axis],min=box.min[axis],max=box.max[axis];
    if(d===0){if(o<min||o>max)return Infinity;continue;}
    let a=(min-o)/d,b=(max-o)/d;
    if(a>b)[a,b]=[b,a];
    lo=Math.max(lo,a);hi=Math.min(hi,b);
    if(lo>hi)return Infinity;
  }
  return lo;
}
function mergedQuery(ray){const hit=bvh.raycastFirst(ray,T.DoubleSide);return hit?{hit,tree:merged}:null;}
function partitionQuery(trees,ray,stats){
  const candidates=[];
  for(const t of trees){
    const entry=boundsEntry(ray,t.bounds);
    if(stats){stats.boxTests++;if(entry===Infinity)stats.boxMisses++;}
    if(entry!==Infinity)candidates.push({tree:t,entry});
  }
  candidates.sort((a,b)=>a.entry-b.entry);
  let best=null,far=Infinity;
  for(const item of candidates){
    if(item.entry>far){if(stats)stats.prunedByNearerHit++;continue;}
    if(stats)stats.treeQueries++;
    const hit=item.tree.bvh.raycastFirst(ray,T.DoubleSide,0,far);
    if(hit&&hit.distance<far){far=hit.distance;best={hit,tree:item.tree};}
  }
  return best;
}
function identity(result){
  if(!result)return null;
  const {hit,tree}=result;
  return {triangle:tree.geometry.attributes.originalTriangle.getX(hit.face.a),row:tree.geometry.attributes.row.getX(hit.face.a),distance:hit.distance,normal:hit.face.normal.toArray()};
}
// Count traversal work with the installed shader's near-first stack structure.
// Intersection arithmetic remains CPU double precision, without GLSL's epsilon.
// This is an operation-count comparison, not an emulation of GPU execution time.
function stackQuery(t,ray,stats,far=Infinity){
  const buffer=t.bvh._roots[0],f=new Float32Array(buffer),u=new Uint32Array(buffer),h=new Uint16Array(buffer);
  const stack=[0],pos=t.geometry.attributes.position,index=t.geometry.index;
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),point=new T.Vector3();
  let result=null;
  while(stack.length){
    const node=stack.pop();stats.nodeTests++;
    let lo=0,hi=Infinity;
    for(let axis=0;axis<3;axis++){
      const name=['x','y','z'][axis],origin=ray.origin[name],direction=ray.direction[name];
      if(direction===0){if(origin<f[node+axis]||origin>f[node+axis+3]){hi=-Infinity;break;}continue;}
      let p=(f[node+axis]-origin)/direction,q=(f[node+axis+3]-origin)/direction;
      if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);
    }
    if(lo>hi||lo>far)continue;
    if(h[node*2+15]===65535){
      stats.leaves++;
      const offset=u[node+6],count=h[node*2+14];
      for(let face=offset;face<offset+count;face++){
        stats.triangleTests++;
        const ai=index.getX(face*3),bi=index.getX(face*3+1),ci=index.getX(face*3+2);
        a.fromBufferAttribute(pos,ai);b.fromBufferAttribute(pos,bi);c.fromBufferAttribute(pos,ci);
        if(ray.intersectTriangle(a,b,c,false,point)){
          const distance=point.distanceTo(ray.origin);
          if(distance<far){far=distance;result={triangle:t.geometry.attributes.originalTriangle.getX(ai),distance};}
        }
      }
    }else{
      const left=node+8,right=node+u[node+6]*8,leftFirst=ray.direction[['x','y','z'][u[node+7]]] >= 0;
      stack.push(leftFirst?right:left,leftFirst?left:right);
    }
  }
  return result;
}
const baseline=rays.map(ray=>identity(mergedQuery(ray)));
const variants={merged:mergedQuery,...Object.fromEntries(Object.entries(partitionTrees).map(([name,trees])=>[name,ray=>partitionQuery(trees,ray)]))};
const parity={};
for(const [name,trees] of Object.entries(partitionTrees)){
  const traversal={boxTests:0,boxMisses:0,treeQueries:0,prunedByNearerHit:0};
  const mismatches=[];let maxDistanceDelta=0;
  for(let i=0;i<rays.length;i++){
    const a=baseline[i],b=identity(partitionQuery(trees,rays[i],traversal));
    if(a&&b)maxDistanceDelta=Math.max(maxDistanceDelta,Math.abs(a.distance-b.distance));
    if((!a)!==(!b)||(a&&b&&(a.triangle!==b.triangle||a.row!==b.row||Math.abs(a.distance-b.distance)>1e-10||a.normal.some((n,k)=>n!==b.normal[k])))){
      if(mismatches.length<12)mismatches.push({ray:i,baseline:a,partition:b});
    }
  }
  parity[name]={traversal,mismatchExamples:mismatches,maxDistanceDelta};
}
const stackTraversal={};
for(const [name,trees] of [['merged',[merged]],...Object.entries(partitionTrees)]){
  const stats={rootBoxTests:0,nodeTests:0,leaves:0,triangleTests:0,hitMismatches:0};
  for(let i=0;i<rays.length;i++){
    const ray=rays[i];let best=null,far=Infinity;
    const candidates=trees.map(t=>{if(name!=='merged')stats.rootBoxTests++;return {tree:t,entry:name==='merged'?0:boundsEntry(ray,t.bounds)};}).filter(c=>c.entry!==Infinity).sort((a,b)=>a.entry-b.entry);
    for(const candidate of candidates){
      if(candidate.entry>far)continue;
      const hit=stackQuery(candidate.tree,ray,stats,far);
      if(hit){best=hit;far=hit.distance;}
    }
    const reference=baseline[i];
    if((!best)!==(!reference)||(best&&reference&&(best.triangle!==reference.triangle||Math.abs(best.distance-reference.distance)>1e-10)))stats.hitMismatches++;
  }
  stackTraversal[name]=stats;
}
// Warm all layouts, then rotate order to reduce systematic JIT/thermal ordering.
let checksum=0;
for(const fn of Object.values(variants))for(const ray of rays)checksum+=fn(ray)?.hit.distance||0;
const milliseconds=Object.fromEntries(Object.keys(variants).map(name=>[name,[]]));
for(let round=0;round<5;round++){
  const order=Object.keys(variants);
  for(let i=0;i<order.length;i++){
    const name=order[(i+round)%order.length],fn=variants[name],start=performance.now();
    for(const ray of rays)checksum+=fn(ray)?.hit.distance||0;
    milliseconds[name].push(performance.now()-start);
  }
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const treeSummary=t=>({name:t.name,triangles:t.geometry.index.count/3,bounds:{min:t.bounds.min.toArray(),max:t.bounds.max.toArray()},nodes:getBVHExtremes(t.bvh)});
const parts=rows.map((row,i)=>({...row,triangles:gs[i].attributes.position.count/3}));
const rootBoundsQueries=Object.fromEntries([...split,...perPart].map(t=>[t.name,rays.filter(ray=>boundsEntry(ray,t.bounds)!==Infinity).length]));
const partHits={};for(const hit of baseline)if(hit){const name=rows[hit.row].part;partHits[name]=(partHits[name]||0)+1;}
const sha=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const report={source,traceEmitters,hashes:Object.fromEntries([source,auditPath,'src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts',import.meta.filename].map(path=>[path,sha(path)])),
  geometry:{retainedTriangles:g.index.count/3,opticalTriangles:parts.filter(p=>p.optical).reduce((n,p)=>n+p.triangles,0),opaqueTriangles:parts.filter(p=>!p.optical).reduce((n,p)=>n+p.triangles,0),parts},
  corpus:{width:24,height:30,samples:8,paths:transportStats.stats.paths,queries:rays.length,transportStats:transportStats.stats,partHits,rootBoundsQueries},
  trees:{merged:treeSummary(merged),...Object.fromEntries(Object.entries(partitionTrees).map(([name,trees])=>[name,trees.map(treeSummary)]))},parity,stackTraversal,
  timing:{milliseconds,medianMilliseconds:Object.fromEntries(Object.entries(milliseconds).map(([name,values])=>[name,median(values)])),checksum},
  limitations:'CPU replay of the corrected existing audit, using Three double-precision raycastFirst and its local-contact/infinite-floor test model. No GPU shader timings, image or radiance evaluated. Root AABBs come from padded BVH bounds. Splits preserve all diagnostic-retained triangles; existing unity-IOR/stage/recipe exclusions are unchanged. Finite matched-ray parity does not prove equal-distance triangle tie behavior for every possible ray or float32 GPU intersections. Five timing rounds are a small local benchmark, not a runtime performance guarantee.'};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,geometry:report.geometry,corpus:report.corpus,parity,stackTraversal,timing:report.timing},null,2));
