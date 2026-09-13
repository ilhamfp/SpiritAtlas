// Recover likely preceding rim hits from observed GPU origins and authored faces.
// CPU only; uniqueness and camera/seed agreement are measured, never assumed.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,SAH,getBVHExtremes} from 'three-mesh-bvh';
const prior=fs.readFileSync('scripts/benchmark-wavefront-bvh.mjs','utf8');
let loader=prior.slice(0,prior.indexOf('const byName='))
 .replace(/^import .*;\n/gm,'').replace('const transportStats=run(Math.fround(.035),true);','const transportStats=null;');
loader+='\nreturn {rows,g,bvh,source};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const {rows,g,bvh,source}=await new AsyncFunction('fs','createHash','T','GLTFLoader','mergeGeometries','MeshBVH','SAH','getBVHExtremes',loader)(fs,createHash,T,GLTFLoader,mergeGeometries,MeshBVH,SAH,getBVHExtremes);
const pos=g.attributes.position,row=g.attributes.row,glassIndex=[];
for(let i=0;i<pos.count;i+=3)if(rows[row.getX(i)].part==='glass')glassIndex.push(i,i+1,i+2);
const glass=new T.BufferGeometry();glass.setAttribute('position',pos);glass.setIndex(glassIndex);const glassBVH=new MeshBVH(glass,{strategy:SAH,targetLeafSize:4});
const triangles=glassIndex.filter((_,i)=>i%3===0).map(first=>{const vertices=[0,1,2].map(i=>new T.Vector3().fromBufferAttribute(pos,first+i));return {first,vertices,triangle:new T.Triangle(...vertices),normal:T.Triangle.getNormal(...vertices,new T.Vector3())};});
const offset=.0001,tolerance=4e-7;
function randomPair(x,y,sample){let state=(Math.imul(x,1973)+Math.imul(y,9277)+Math.imul(sample,26699)+89173)>>>0;const next=()=>{state=(Math.imul(state,747796405)+2891336453)>>>0;const word=Math.imul((state>>>((state>>>28)+4))^state,277803737)>>>0;return (((word>>>22)^word)>>>8)/16777216;};return [next(),next()];}
function refract(d,n,eta){const cos=-d.dot(n),k=1-eta*eta*(1-cos*cos);return k<0?null:d.clone().multiplyScalar(eta).addScaledVector(n,eta*cos-Math.sqrt(k)).normalize();}
const events=[];
for(const name of ['hero','left']){
 const path=`qa/evidence/medium-bvh-traps/${name}-analysis.json`,analysis=JSON.parse(fs.readFileSync(path)),capture=JSON.parse(fs.readFileSync(`qa/evidence/medium-bvh-traps/${name}.json`));
 const camera=new T.PerspectiveCamera(35,192/240,.05,250);camera.position.fromArray(capture.state.camera);camera.lookAt(0,1.28,0);camera.updateMatrixWorld(true);
 for(const event of analysis.events.filter(e=>!e.full.inRestrictedTree)){
  const origin=new T.Vector3().fromArray(event.origin),direction=new T.Vector3().fromArray(event.direction),candidates=[];
  for(const face of triangles){
   const offsetReversed=origin.clone().addScaledVector(face.normal,offset),closest=face.triangle.closestPointToPoint(offsetReversed,new T.Vector3()),error=closest.distanceTo(offsetReversed);
   if(error>tolerance)continue;
   const inward=face.normal.clone().negate(),start=closest.clone().addScaledVector(inward,1e-9),hits=glassBVH.raycast(new T.Ray(start,inward),T.DoubleSide).sort((a,b)=>a.distance-b.distance);
   const crossings=hits.filter(h=>h.distance>1e-9&&h.distance<offset+1e-7).map(h=>({triangle:h.face.a/3,distance:h.distance+1e-9,point:h.point.toArray()}));
   const incoming=closest.clone().sub(camera.position).normalize(),transmitted=refract(incoming,face.normal,1/rows[row.getX(face.first)].ior);
   const forward=new T.Vector3(0,0,-1).applyQuaternion(camera.quaternion),rayOrigin=camera.position.clone().addScaledVector(incoming,.05/incoming.dot(forward));
   const first=bvh.raycastFirst(new T.Ray(rayOrigin,incoming),T.DoubleSide);
   const projected=closest.clone().project(camera),raster=[(projected.x+1)*96,(projected.y+1)*120];
   const seeds=Array.from({length:128},(_,sample)=>{const random=randomPair(event.pixel.x,event.pixel.yFromBottom,sample),point=[event.pixel.x+random[0],event.pixel.yFromBottom+random[1]];return {sample,random,rasterError:Math.hypot(point[0]-raster[0],point[1]-raster[1])};}).sort((a,b)=>a.rasterError-b.rasterError).slice(0,3);
   candidates.push({triangle:face.first/3,material:rows[row.getX(face.first)],vertices:face.vertices.map(v=>v.toArray()),outwardNormal:face.normal.toArray(),reconstructedHit:closest.toArray(),offsetReverseResidual:error,
    incomingCameraRay:{origin:rayOrigin.toArray(),direction:incoming.toArray(),firstTriangle:first?.face.a/3,firstPoint:first?.point.toArray(),distance:first?.distance},
    transmittedDirection:transmitted?.toArray(),transmittedVectorError:transmitted?transmitted.distanceTo(direction):null,projectedRaster:raster,nearestSeedMatches:seeds,offsetCrossings:crossings});
  }
  candidates.sort((a,b)=>a.offsetReverseResidual-b.offsetReverseResidual);
  events.push({case:name,pixel:event.pixel,currentOrigin:event.origin,currentDirection:event.direction,currentMedium:event.medium,originContainment:event.originContainment,candidates});
 }
}
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const report={source,sourceSha256:sha(source),scriptSha256:sha('scripts/recover-medium-rim-predecessors.mjs'),offset,reconstructionTolerance:tolerance,events,
 limitations:'Reconstruction searches every actual glass triangle and reverses the known normal displacement. Camera ray, first-hit identity, seeded subpixel position and Snell output independently test the candidate. CPU double arithmetic cannot recover bit-identical GPU hit/normal values or fused operations; candidate uniqueness/error are reported. Offset-segment crossings use actual authored triangles, excluding the origin face by a1e-9 inward start.'};
fs.writeFileSync('qa/evidence/medium-bvh-traps/rim-predecessors.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(events.map(e=>({case:e.case,pixel:e.pixel,candidates:e.candidates.map(c=>({triangle:c.triangle,residual:c.offsetReverseResidual,transmittedError:c.transmittedVectorError,firstTriangle:c.incomingCameraRay.firstTriangle,seed:c.nearestSeedMatches[0],crossings:c.offsetCrossings}))})),null,2));
