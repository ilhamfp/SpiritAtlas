// Decode the actual packed DataTexture arrays against the frozen ray corpora.
// CPU only: this validates packing/relocation, not GLSL float32 or GPU speed.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,SAH,getBVHExtremes} from 'three-mesh-bvh';
import {createMediumBVHForest,mediumForestRayGLSL,TESTED_MEDIUM_BVH_SHA256} from '../src/scenes/medium-bvh-forest.ts';

const sha=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
const priorSource=fs.readFileSync('scripts/benchmark-wavefront-bvh.mjs','utf8');
let loader=priorSource.slice(0,priorSource.indexOf('const byName='))
  .replace(/^import .*;\n/gm,'')
  .replace('const transportStats=run(Math.fround(.035),true);','const transportStats=null;');
loader+='\nreturn {rows,g,bvh,source,traceEmitters};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const {rows,g,bvh,source,traceEmitters}=await new AsyncFunction('fs','createHash','T','GLTFLoader','mergeGeometries','MeshBVH','SAH','getBVHExtremes',loader)(fs,createHash,T,GLTFLoader,mergeGeometries,MeshBVH,SAH,getBVHExtremes);
if(sha(source)!==TESTED_MEDIUM_BVH_SHA256)throw Error('Not the fixed tested GLB');
const optics=new Float32Array(g.attributes.position.count*4);
for(let v=0;v<g.attributes.position.count;v++){
  const row=rows[g.attributes.row.getX(v)];optics.set([row.ior,row.optical?1:0,row.inside,row.outside],v*4);
}
g.setAttribute('opticalData',new T.BufferAttribute(optics,4));
const forest=createMediumBVHForest(g,bvh),uniform=forest.uniform;
const packed={bounds:uniform.bvhBounds.image.data,contents:uniform.bvhContents.image.data,index:uniform.index.image.data,position:uniform.position.image.data};
for(let v=0;v<g.attributes.position.count;v++)for(let axis=0;axis<3;axis++)if(packed.position[v*4+axis]!==g.attributes.position.array[v*3+axis])throw Error('Shared vertex texture differs');
const suffix=traceEmitters?'-emitters':'';
const corpusPath=`qa/evidence/wavefront-medium-ray-corpus${suffix}.json`,priorPath=`qa/evidence/wavefront-medium-conditioned-cpu${suffix}.json`;
const corpus=JSON.parse(fs.readFileSync(corpusPath)),prior=JSON.parse(fs.readFileSync(priorPath));
if(sha(corpusPath)!==prior.corpusSha256)throw Error('Frozen ray corpus changed');
const structure=[];
for(const range of forest.ranges){
 const visited=new Set(),seenTriangles=new Set(),stack=[range.root];let leaves=0;
 while(stack.length){
  const node=stack.pop();if(node<range.root||node>=range.root+range.nodeCount||visited.has(node))throw Error('Invalid/repeated packed node');visited.add(node);
  const bits=packed.contents[node*2],offset=packed.contents[node*2+1];
  if(bits&0xffff0000){
   leaves++;const count=bits&0xffff;
   if(offset<range.triangleOffset||offset+count>range.triangleOffset+range.triangleCount)throw Error('Leaf points outside its index range');
   for(let i=offset;i<offset+count;i++){
    const a=packed.index[i*4],b=packed.index[i*4+1],c=packed.index[i*4+2];
    if(a%3||b!==a+1||c!==a+2||c>=forest.vertexCount||seenTriangles.has(a/3))throw Error('Global triangle identity mismatch');
    seenTriangles.add(a/3);
   }
  }else{
   if(bits>2||offset<2)throw Error('Invalid split axis/relative child');stack.push(node+1,node+offset);
  }
 }
 if(visited.size!==range.nodeCount||seenTriangles.size!==range.triangleCount)throw Error('Incomplete packed coverage');
 structure.push({...range,visitedNodes:visited.size,leaves,coveredTriangles:seenTriangles.size});
}
function trace(query,root){
 const ray=new T.Ray(new T.Vector3().fromArray(query.origin),new T.Vector3().fromArray(query.direction));
 const stack=[root],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),point=new T.Vector3();let best=null,far=Infinity;
 while(stack.length){
  const node=stack.pop();let lo=0,hi=Infinity;
  for(let axis=0;axis<3;axis++){
   const o=query.origin[axis],d=query.direction[axis],min=packed.bounds[node*8+axis],max=packed.bounds[node*8+4+axis];
   if(d===0){if(o<min||o>max){hi=-Infinity;break;}continue;}
   let p=(min-o)/d,q=(max-o)/d;if(p>q)[p,q]=[q,p];lo=Math.max(lo,p);hi=Math.min(hi,q);
  }
  if(lo>hi||lo>far)continue;
  const bits=packed.contents[node*2],offset=packed.contents[node*2+1];
  if(bits&0xffff0000){
   for(let i=offset;i<offset+(bits&0xffff);i++){
    const ai=packed.index[i*4],bi=packed.index[i*4+1],ci=packed.index[i*4+2];
    a.fromArray(packed.position,ai*4);b.fromArray(packed.position,bi*4);c.fromArray(packed.position,ci*4);
    if(ray.intersectTriangle(a,b,c,false,point)){
     const distance=point.distanceTo(ray.origin);
     if(distance<far){far=distance;best={triangle:ai/3,row:g.attributes.row.getX(ai),distance,normal:T.Triangle.getNormal(a,b,c,new T.Vector3()).toArray()};}
    }
   }
  }else{
   const left=node+1,right=node+offset,leftFirst=query.direction[bits]>=0;stack.push(leftFirst?right:left,leftFirst?left:right);
  }
 }
 return best;
}
const parity={};
for(const mode of ['packed-full','packed-medium']){
 let mismatches=0,maxDistanceDelta=0;const examples=[];
 for(let i=0;i<corpus.queries.length;i++){
  const query=corpus.queries[i],root=mode==='packed-medium'&&query.medium>=1&&query.medium<=4?forest.roots[query.medium-1]:0;
  const hit=trace(query,root),reference=query.baseline;
  if(hit&&reference)maxDistanceDelta=Math.max(maxDistanceDelta,Math.abs(hit.distance-reference.distance));
  if((!hit)!==(!reference)||(hit&&reference&&(hit.triangle!==reference.triangle||hit.row!==reference.row||hit.distance!==reference.distance||hit.normal.some((n,j)=>n!==reference.normal[j])))){
   mismatches++;if(examples.length<12)examples.push({query:i,root,hit,reference});
  }
 }
 parity[mode]={queries:corpus.queries.length,mismatches,maxDistanceDelta,examples};
}
const glsl=mediumForestRayGLSL();
if(!glsl.includes('stack[ 0 ] = rootIndex;')||glsl.includes('stack[ 0 ] = 0u;'))throw Error('GLSL root specialization failed');
const report={source,traceEmitters,corpusPath,corpusSha256:sha(corpusPath),hashes:Object.fromEntries([source,'src/scenes/medium-bvh-forest.ts','src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts',import.meta.filename].map(path=>[path,sha(path)])),
 roots:Array.from(forest.roots),dimensions:forest.dimensions,byteLength:forest.byteLength,nodeCount:forest.nodeCount,triangleReferences:forest.triangleCount,sharedVertices:forest.vertexCount,structure,parity,
 caveats:'Actual packed texture arrays decoded with CPU double-precision intersections. Complete node/leaf/index reachability and shared vertex values checked. No GPU/GLSL compilation, float32 edge/tie behavior, timing, radiance or visual parity evaluated. Frozen corpus includes only one inclusion-origin query.'};
const output=`qa/evidence/medium-bvh-forest-packed-cpu${suffix}.json`;fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,roots:report.roots,dimensions:report.dimensions,byteLength:report.byteLength,structure,parity},null,2));
forest.dispose();
if(Object.values(parity).some(p=>p.mismatches))process.exitCode=1;
