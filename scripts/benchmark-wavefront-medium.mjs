// CPU-only test of medium-conditioned boundary queries. Prior split benchmarks
// remain untouched. All path branches and reference hits come from the full BVH.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,SAH,getBVHExtremes} from 'three-mesh-bvh';

const priorScript='scripts/benchmark-wavefront-bvh.mjs';
const text=fs.readFileSync(priorScript,'utf8');
// Use the prior benchmark's unchanged corpus construction and counters. Capture
// medium state before each full-BVH query without changing random draws.
let loader=text.slice(0,text.indexOf('const byName='))
  .replace(/^import .*;\n/gm,'')
  .replace('const rays=[];let triangleId=0;','const rays=[],media=[];let triangleId=0;')
  .replace('rays.push(new T.Ray(p.clone(),d.clone()));const hit=', 'media.push(medium);rays.push(new T.Ray(p.clone(),d.clone()));const hit=')
  .replaceAll('{rows,gs,g,bvh,rays,transportStats,gltf}', '{rows,gs,g,bvh,rays,media,transportStats,gltf}');
loader+=text.slice(text.indexOf('function tree('),text.indexOf('const merged='));
loader+=text.slice(text.indexOf('function identity('),text.indexOf('const baseline='));
loader+='\nreturn {rows,gs,g,bvh,rays,media,transportStats,tree,identity,stackQuery,source,traceEmitters};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const {rows,gs,g,bvh,rays,media,transportStats,tree,identity,stackQuery,source,traceEmitters}=await new AsyncFunction('fs','createHash','T','GLTFLoader','mergeGeometries','MeshBVH','SAH','getBVHExtremes',loader)(fs,createHash,T,GLTFLoader,mergeGeometries,MeshBVH,SAH,getBVHExtremes);
if(media.length!==rays.length)throw Error('Medium capture contract changed');
const suffix=traceEmitters?'-emitters':'';
const priorPath=`qa/evidence/wavefront-bvh-partition-cpu${suffix}.json`;
const prior=JSON.parse(fs.readFileSync(priorPath));
const sha=path=>createHash('sha256').update(fs.readFileSync(path)).digest('hex');
for(const [path,hash] of Object.entries(prior.hashes))if(sha(path)!==hash)throw Error('Prior frozen input changed: '+path);
if(prior.corpus.queries!==rays.length||JSON.stringify(prior.corpus.transportStats)!==JSON.stringify(transportStats.stats))throw Error('Prior corpus differs');
const full={name:'all',geometry:g,bvh,bounds:bvh.getBoundingBox(new T.Box3())};
const rules={
  1:row=>row.part==='liquid',
  2:row=>row.part==='glass',
  3:row=>row.part==='ice'||row.part==='ice_inclusions'||(row.part==='liquid'&&row.outside===3),
  4:row=>row.part==='ice_inclusions',
};
const trees={0:full,...Object.fromEntries(Object.entries(rules).map(([medium,test])=>[medium,tree('medium_'+medium,gs.filter((_,i)=>test(rows[i])))]))};
function query(t,ray){const hit=t.bvh.raycastFirst(ray,T.DoubleSide);return hit?{hit,tree:t}:null;}
const queryRows=rays.map((ray,i)=>({medium:media[i],origin:ray.origin.toArray(),direction:ray.direction.toArray(),baseline:identity(query(full,ray))}));
const corpusPath=`qa/evidence/wavefront-medium-ray-corpus${suffix}.json`;
fs.writeFileSync(corpusPath,JSON.stringify({source,traceEmitters,convention:'World-space query origin/direction and current medium immediately before the existing full-BVH query. Reference hits include original triangle/material row, distance and geometric face normal.',rows,queries:queryRows})+'\n');
const mediumCounts={};
const parity={mismatches:0,opaqueOmissions:0,maxDistanceDelta:0,examples:[]};
for(let i=0;i<rays.length;i++){
  const medium=media[i],reference=queryRows[i].baseline,result=identity(query(trees[medium],rays[i]));
  mediumCounts[medium]=(mediumCounts[medium]||0)+1;
  if(reference&&result)parity.maxDistanceDelta=Math.max(parity.maxDistanceDelta,Math.abs(reference.distance-result.distance));
  if((!reference)!==(!result)||(reference&&result&&(reference.triangle!==result.triangle||reference.row!==result.row||reference.distance!==result.distance||reference.normal.some((n,j)=>n!==result.normal[j])))){
    parity.mismatches++;
    if(reference&&!rows[reference.row].optical)parity.opaqueOmissions++;
    if(parity.examples.length<16)parity.examples.push({query:i,medium,reference,result,origin:rays[i].origin.toArray(),direction:rays[i].direction.toArray()});
  }
}
const traversal={};
for(const mode of ['full','conditioned']){
  const stats={nodeTests:0,leaves:0,triangleTests:0,hitMismatches:0,byMedium:{}};
  for(let i=0;i<rays.length;i++){
    const medium=media[i],t=mode==='full'?full:trees[medium];
    const per=stats.byMedium[medium]??={nodeTests:0,leaves:0,triangleTests:0};
    const hit=stackQuery(t,rays[i],per),reference=queryRows[i].baseline;
    if((!hit)!==(!reference)||(hit&&reference&&(hit.triangle!==reference.triangle||hit.distance!==reference.distance)))stats.hitMismatches++;
  }
  for(const per of Object.values(stats.byMedium))for(const key of ['nodeTests','leaves','triangleTests'])stats[key]+=per[key];
  traversal[mode]=stats;
}
let checksum=0;
const variants={full:i=>query(full,rays[i]),conditioned:i=>query(trees[media[i]],rays[i])};
for(const fn of Object.values(variants))for(let i=0;i<rays.length;i++)checksum+=fn(i)?.hit.distance||0;
const milliseconds={full:[],conditioned:[]};
for(let round=0;round<5;round++)for(const name of (round%2?['conditioned','full']:['full','conditioned'])){
  const start=performance.now();for(let i=0;i<rays.length;i++)checksum+=variants[name](i)?.hit.distance||0;
  milliseconds[name].push(performance.now()-start);
}
const median=values=>[...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
const report={source,traceEmitters,nodeVersion:process.version,corpusPath,corpusSha256:sha(corpusPath),priorReport:priorPath,priorReportSha256:sha(priorPath),hashes:Object.fromEntries([source,priorScript,import.meta.filename].map(p=>[p,sha(p)])),
  paths:transportStats.stats.paths,queries:rays.length,transportStats:transportStats.stats,mediumCounts,
  trees:Object.fromEntries(Object.entries(trees).map(([medium,t])=>[medium,{triangles:t.geometry.index.count/3,nodes:getBVHExtremes(t.bvh),retainedRows:rows.map((row,i)=>medium==='0'||rules[medium](row)?i:null).filter(i=>i!==null)}])),
  parity,traversal,timing:{milliseconds,medianMilliseconds:Object.fromEntries(Object.entries(milliseconds).map(([name,values])=>[name,median(values)])),checksum},
  caveats:'Full BVH generates every path; medium restrictions are tested only by replay. No source triangles are removed globally. This finite corpus cannot establish closed/disjoint containment, valid medium initialization or universal float32 nearest-hit equivalence. GPU timings, radiance and fidelity were not evaluated. Prior source import exclusions and CPU local-contact/infinite-floor test semantics are unchanged. Separate trees duplicate some triangle/index/BVH storage in this CPU experiment.'};
const output=`qa/evidence/wavefront-medium-conditioned-cpu${suffix}.json`;
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output,queries:report.queries,mediumCounts,parity,traversal,timing:report.timing},null,2));
