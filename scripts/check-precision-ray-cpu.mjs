import fs from 'node:fs';import {createHash} from 'node:crypto';import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,MeshBVHUniformStruct,SAH,getBVHExtremes} from 'three-mesh-bvh';
import {TESTED_MEDIUM_BVH_SHA256} from '../src/scenes/medium-bvh-forest.ts';
import {createPrecisionTracer,precisionTriangle,surfacePoint,offsetPoint,reflection,refraction,normalize} from './lib/precision-ray-cpu.mjs';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const setupPath='scripts/analyze-medium-bvh-traps.mjs',setupSource=fs.readFileSync(setupPath,'utf8');
let setup=setupSource.slice(0,setupSource.indexOf('const events=capture.traps.events.map')).replace(/^import .*;\n/gm,'').replace('const input=process.argv[2];',"const input='qa/evidence/medium-bvh-traps/hero.json';");
setup+='\nreturn {g,bvh,rows,source,material,triangle,originContainment};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const {g,bvh,rows,source,material,triangle,originContainment}=await new AsyncFunction('fs','createHash','T','GLTFLoader','mergeGeometries','MeshBVH','SAH','getBVHExtremes','TESTED_MEDIUM_BVH_SHA256',setup)(fs,createHash,T,GLTFLoader,mergeGeometries,MeshBVH,SAH,getBVHExtremes,TESTED_MEDIUM_BVH_SHA256);
const uniform=new MeshBVHUniformStruct();uniform.updateFrom(bvh);const tracer=createPrecisionTracer(uniform),f=Math.fround;
const describe=h=>h?{...h,material:material(h.firstVertex)}:null;
const doubleHit=(o,d)=>{const hit=bvh.raycastFirst(new T.Ray(new T.Vector3().fromArray(o),new T.Vector3().fromArray(d)),T.DoubleSide);return hit?{triangle:hit.face.a/3,firstVertex:hit.face.a,distance:hit.distance,material:material(hit.face.a)}:null;};
function brute(o,d){let best=null;for(let first=0;first<g.attributes.position.count;first+=3){const hit=precisionTriangle(o,d,tracer.vertices(first));if(hit.accepted&&(!best||hit.distance<best.distance||(hit.distance===best.distance&&first<best.firstVertex)))best={...hit,firstVertex:first,triangle:first/3};}return best;}
const report={createdAt:new Date().toISOString(),source,hashes:Object.fromEntries([source,setupPath,'scripts/lib/precision-ray-cpu.mjs','scripts/check-precision-ray-cpu.mjs','src/scenes/precision-ray-diagnostic.ts','src/scenes/bvh-wavefront-prototype.ts'].map(p=>[p,sha(p)])),rim:[],traps:[],corpus:{},syntheticMedia:[],bruteChecks:[],limits:'Diagnostic scalar float32 operation ordering, not a GPU oracle or certified bound. Frozen query origins retain old transport errors; changed identity alone is not failure. No medium restriction. Synthetic branches check local boundaries, not full path history. Exactly-zero edge fallback supports finite normal float input products with exponent separation <=16; GPU FMA, denormal handling, stack/pruning and arithmetic must be checked separately.'};
const capture=JSON.parse(fs.readFileSync('qa/evidence/medium-rim-predecessor/report.json'));
for(const row of capture.captures)for(const event of row.events){
 const query=tracer.trace(event.incomingOrigin,event.incomingDirection),h=query.hit;if(!h)throw Error('Known predecessor missed');
 const reconstructed=surfacePoint(tracer.vertices(h.firstVertex),h.bary),oriented=h.normal.map(x=>event.branch==='reflection'?x:-x),offset=offsetPoint(reconstructed.position,reconstructed.error,oriented);
 const next=tracer.trace(offset.origin,event.target.direction).hit,containment=originContainment({medium:2,origin:offset.origin});
 report.rim.push({case:row.name,pixel:event.target.pixel,previousExpected:event.triangle,previous:describe(h),reconstructed,offset,containment,next:describe(next),doubleNext:doubleHit(offset.origin,event.target.direction),oldOrigin:event.target.origin,oldDirection:event.target.direction});
 const bruteHit=brute(offset.origin,event.target.direction);report.bruteChecks.push({kind:'rim-spawn',pixel:event.target.pixel,parity:bruteHit?.firstVertex===next?.firstVertex&&bruteHit?.distance===next?.distance,bvh:next?.triangle,brute:bruteHit?.triangle});
}
for(const name of ['hero','left','right','emitters']){
 const data=JSON.parse(fs.readFileSync(`qa/evidence/medium-bvh-traps/${name}.json`));
 for(const event of data.traps.events){const query=tracer.trace(event.origin,event.direction),h=query.hit;report.traps.push({case:name,pixel:event.pixel,medium:event.medium,oldFull:event.full,oldRestricted:event.restricted,precision:describe(h),double:doubleHit(event.origin,event.direction)});}
}
const corpusPath='qa/evidence/wavefront-medium-ray-corpus.json',corpus=JSON.parse(fs.readFileSync(corpusPath)),stats={queries:0,hits:0,identityChanges:0,materialChanges:0,hitChanges:0,nonPositive:0,nonFinite:0,negativeBary:0,maxDistanceDelta:0,nodes:0,triangles:0,edgeFallbacks:0,byMedium:{},examples:[]};
const started=performance.now();
for(let i=0;i<corpus.queries.length;i++){
 const q=corpus.queries[i],result=tracer.trace(q.origin,q.direction),h=result.hit,prior=q.baseline;stats.queries++;stats.byMedium[q.medium]=(stats.byMedium[q.medium]??0)+1;
 for(const key of ['nodes','triangles','edgeFallbacks'])stats[key]+=result.work[key];
 if(h){stats.hits++;if(h.distance<=0)stats.nonPositive++;if(![...h.bary,...h.normal,h.distance].every(Number.isFinite))stats.nonFinite++;if(h.bary.some(x=>x<0))stats.negativeBary++;}
 if(h&&prior)stats.maxDistanceDelta=Math.max(stats.maxDistanceDelta,Math.abs(h.distance-prior.distance));
 if((!h)!==(!prior)){stats.hitChanges++;if(stats.examples.length<20)stats.examples.push({query:i,kind:'hit',medium:q.medium,prior,current:describe(h)});}
 if(h&&prior&&h.triangle!==prior.triangle){stats.identityChanges++;if(g.attributes.row.getX(h.firstVertex)!==prior.row){stats.materialChanges++;if(stats.examples.length<20)stats.examples.push({query:i,kind:'material',medium:q.medium,prior,current:describe(h)});}}
}
report.corpus={path:corpusPath,sha256:sha(corpusPath),...stats,elapsedMs:performance.now()-started};
// Seed each optical material from actual triangle centroids, so rare inclusion
// boundaries receive explicit coverage beyond the corpus's one medium-4 ray.
for(let row=0;row<rows.length;row++)if(rows[row].optical){
 const candidates=[];for(let first=0;first<g.attributes.position.count;first+=3)if(g.attributes.row.getX(first)===row)candidates.push(first);
 for(let k=0;k<Math.min(12,candidates.length);k++){
  const first=candidates[Math.floor(k*candidates.length/12)],verts=tracer.vertices(first),center=[0,1,2].map(axis=>f(verts.reduce((s,v)=>s+v[axis]/3,0))),normal=T.Triangle.getNormal(...verts.map(v=>new T.Vector3().fromArray(v)),new T.Vector3()).toArray().map(f);
  for(const side of [1,-1]){
   const origin=center.map((x,i)=>f(x+normal[i]*side*.0001)),direction=normal.map(x=>f(-x*side)),hit=tracer.trace(origin,direction).hit;
   if(!hit){report.syntheticMedia.push({row,k,side,expected:first/3,miss:true});continue;}
   const m=material(hit.firstVertex),eta=f(hit.side>0?1/m.ior:m.ior),point=surfacePoint(tracer.vertices(hit.firstVertex),hit.bary);
   for(const branch of ['reflection','transmission']){
    const outgoing=branch==='reflection'?reflection(direction,hit.normal):refraction(direction,hit.normal,eta);if(!outgoing)continue;
    const oriented=hit.normal.map(x=>branch==='reflection'?x:-x),spawn=offsetPoint(point.position,point.error,oriented),next=tracer.trace(spawn.origin,outgoing).hit;
    report.syntheticMedia.push({row,k,side,branch,expected:first/3,actual:hit.triangle,mediumBefore:hit.side>0?m.outside:m.inside,mediumAfter:branch==='reflection'?(hit.side>0?m.outside:m.inside):(hit.side>0?m.inside:m.outside),offset:spawn.distance,selfHit:next?.triangle===hit.triangle,next:next?{triangle:next.triangle,distance:next.distance,incoming:next.side>0?material(next.firstVertex).outside:material(next.firstVertex).inside,material:material(next.firstVertex).material}:null});
   }
  }
 }
}
report.syntheticSummary={branches:report.syntheticMedia.length,byOutgoingMedium:{},selfHits:report.syntheticMedia.filter(x=>x.selfHit).length,misses:report.syntheticMedia.filter(x=>x.miss).length,wrongNextIncoming:report.syntheticMedia.filter(x=>x.next&&x.mediumAfter!==x.next.incoming).length};
for(const e of report.syntheticMedia)if(e.mediumAfter!==undefined)report.syntheticSummary.byOutgoingMedium[e.mediumAfter]=(report.syntheticSummary.byOutgoingMedium[e.mediumAfter]??0)+1;
fs.mkdirSync('qa/evidence/precision-ray-diagnostic',{recursive:true});fs.writeFileSync('qa/evidence/precision-ray-diagnostic/cpu.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({rim:report.rim.map(e=>({previous:e.previous.triangle,expected:e.previousExpected,offset:e.offset.distance,inside:e.containment.parity.every(p=>p.insideByParity),next:e.next?.material.part,side:e.next?.side})),brute:report.bruteChecks,corpus:report.corpus,synthetic:report.syntheticSummary},null,2));
