// Four observed GPU predecessor events; CPU geometric/float32 diagnostic only.
import fs from 'node:fs';import {createHash} from 'node:crypto';import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,SAH,getBVHExtremes} from 'three-mesh-bvh';
import {TESTED_MEDIUM_BVH_SHA256} from '../src/scenes/medium-bvh-forest.ts';
const setupPath='scripts/analyze-medium-bvh-traps.mjs',setupSource=fs.readFileSync(setupPath,'utf8');
let setup=setupSource.slice(0,setupSource.indexOf('const events=capture.traps.events.map'))
 .replace(/^import .*;\n/gm,'').replace("const input=process.argv[2];","const input='qa/evidence/medium-bvh-traps/hero.json';");
setup+='\nreturn {g,bvh,rows,source,material,triangle,scalarFloat32Triangle,originContainment};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const {g,bvh,source,material,triangle,scalarFloat32Triangle,originContainment}=await new AsyncFunction('fs','createHash','T','GLTFLoader','mergeGeometries','MeshBVH','SAH','getBVHExtremes','TESTED_MEDIUM_BVH_SHA256',setup)(fs,createHash,T,GLTFLoader,mergeGeometries,MeshBVH,SAH,getBVHExtremes,TESTED_MEDIUM_BVH_SHA256);
const input='qa/evidence/medium-rim-predecessor/report.json',capture=JSON.parse(fs.readFileSync(input)),f=Math.fround,epsilon=1e-5,offset=f(.0001),gamma7=(7*2**-24)/(1-7*2**-24);
const bits=new DataView(new ArrayBuffer(4));
function next(x,up){x=f(x);if(x===0)return up?2**-149:-(2**-149);bits.setFloat32(0,x);let n=bits.getUint32(0);n+=(x>0)===up?1:-1;bits.setUint32(0,n);return bits.getFloat32(0);}
const ulp=x=>Math.max(Math.abs(next(x,true)-f(x)),Math.abs(next(x,false)-f(x)));
const faces=Array.from({length:g.attributes.position.count/3},(_,i)=>({first:i*3,vertices:triangle(i*3)}));
function firstScalarHit(origin,direction){let best=null;for(const face of faces){const h=scalarFloat32Triangle(origin,direction,face.vertices);if(h.accepted&&(!best||h.distance<best.distance))best={firstVertex:face.first,triangle:face.first/3,material:material(face.first),...h};}return best;}
const events=[];
for(const row of capture.captures)for(const event of row.events){
 const verts=triangle(event.triangle*3),face=new T.Triangle(...verts),outward=face.getNormal(new T.Vector3()),normal=new T.Vector3().fromArray(event.normal),inward=normal.clone().multiplyScalar(event.branch==='reflection'?1:-1),p=new T.Vector3().fromArray(event.unshiftedHit),incomingOrigin=new T.Vector3().fromArray(event.incomingOrigin),incomingDirection=new T.Vector3().fromArray(event.incomingDirection);
 const planeT=verts[0].clone().sub(incomingOrigin).dot(outward)/incomingDirection.dot(outward),exact= incomingOrigin.clone().addScaledVector(incomingDirection,planeT),bary=face.getBarycoord(exact,new T.Vector3()).toArray();
 const fixedOrigin=p.toArray().map((v,i)=>f(v+f(inward.getComponent(i)*offset))),recorded=event.target.origin;
 const forwardHits=bvh.raycast(new T.Ray(p.clone().addScaledVector(inward,1e-9),inward),T.DoubleSide).filter(h=>h.face.a/3!==event.triangle&&h.distance>0&&h.distance<.0002).sort((a,b)=>a.distance-b.distance);
 const crossing=forwardHits[0]?{triangle:forwardHits[0].face.a/3,material:material(forwardHits[0].face.a),distance:forwardHits[0].distance+1e-9,point:forwardHits[0].point.toArray()}:null;
 const weights=bary.map(f),position= [0,1,2].map(axis=>f(f(f(weights[0]*verts[0].getComponent(axis))+f(weights[1]*verts[1].getComponent(axis)))+f(weights[2]*verts[2].getComponent(axis))));
 const absSum=[0,1,2].map(axis=>weights.reduce((sum,w,i)=>sum+Math.abs(w*verts[i].getComponent(axis)),0)),pError=absSum.map(x=>gamma7*x),normalBudget=pError.reduce((s,e,i)=>s+e*Math.abs(inward.getComponent(i)),0),roundingBudget=position.reduce((s,v,i)=>s+ulp(v)*Math.abs(inward.getComponent(i)),0);
 const outgoing=event.target.direction,epsilonLower=epsilon*Math.abs(inward.dot(new T.Vector3().fromArray(outgoing))),candidateOffset=epsilonLower+normalBudget+roundingBudget,upper=(crossing?.distance??Infinity)-normalBudget-roundingBudget;
 const proposed=position.map((v,i)=>{const off=inward.getComponent(i)*candidateOffset;return off===0?f(v):next(f(v+f(off)),off>0);});
 const proposalEvent={medium:2,origin:proposed,direction:outgoing},containment=originContainment(proposalEvent),nearest=bvh.raycastFirst(new T.Ray(new T.Vector3().fromArray(proposed),new T.Vector3().fromArray(outgoing)),T.DoubleSide),scalar=firstScalarHit(proposed,outgoing);
 events.push({case:row.name,pixel:event.target.pixel,sample:event.target.samplesCompleted,boundaryDepth:event.target.boundaryDepth,branch:event.branch,previousTriangle:event.triangle,previousMaterial:material(event.triangle*3),incomingOrigin:event.incomingOrigin,incomingDirection:event.incomingDirection,normal:event.normal,gpuUnshiftedHit:event.unshiftedHit,fixedOrigin,recordedOrigin:recorded,fixedOriginExact:fixedOrigin.every((v,i)=>v===recorded[i]),
  exactPlaneHit:exact.toArray(),exactBarycentric:bary,gpuHitVectorError:p.distanceTo(exact),gpuHitSignedPlaneError:p.clone().sub(verts[0]).dot(outward),gpuHitUlp:event.unshiftedHit.map(ulp),offsetCrossing:crossing,
  proposal:{method:'Barycentric reconstructed point; gamma(7) interpolation budget projected onto normal, plus coordinate-ULP rounding budget and installed negative-t epsilon lower bound. Outward coordinate rounding. No runtime change.',weights,position,pError,normalBudget,roundingBudget,epsilonLower,candidateOffset,upper,intervalNonEmpty:candidateOffset<upper,baryInside:bary.every(x=>x>=0),origin:proposed,containment,
   doubleNext:nearest?{triangle:nearest.face.a/3,material:material(nearest.face.a),distance:nearest.distance}:null,scalarFloat32Next:scalar,
   limitations:'The point budget follows PBRT interpolation structure, but its complete intersector assumptions are not proved for this GLSL kernel. Exact CPU barycentrics are used here as a local candidate; GPU barycentric/normal/intersection error needs separate bounds. Scalar float32 brute force ignores BVH pruning and GPU FMA; this is not certified safe or GPU validated.'}});
}
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={input,inputSha256:sha(input),source,sourceSha256:sha(source),scriptSha256:sha('scripts/evaluate-rim-offset-candidate.mjs'),setupSha256:sha(setupPath),epsilon,offset,gamma7,events,reference:'https://pbr-book.org/4ed/Shapes/Managing_Rounding_Error',limits:'Four known failing rays only. Default/control source and all geometry remain unchanged. A non-empty local interval is not a universal offset bound; empty intervals must not be silently clamped.'};
fs.writeFileSync('qa/evidence/medium-rim-predecessor/offset-candidate-cpu.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(events.map(e=>({case:e.case,pixel:e.pixel,fixedExact:e.fixedOriginExact,hitError:e.gpuHitVectorError,crossing:e.offsetCrossing?.distance,proposal:e.proposal.candidateOffset,upper:e.proposal.upper,inside:e.proposal.containment.parity.every(p=>p.insideByParity),next:e.proposal.doubleNext?.material.part,float32Next:e.proposal.scalarFloat32Next?.material.part,float32Side:e.proposal.scalarFloat32Next?.side})),null,2));
