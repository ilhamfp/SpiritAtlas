// CPU explanation of recorded GPU first-hit events; never a GPU arithmetic oracle.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,SAH,getBVHExtremes} from 'three-mesh-bvh';
import {TESTED_MEDIUM_BVH_SHA256} from '../src/scenes/medium-bvh-forest.ts';

const input=process.argv[2];if(!input)throw Error('Usage: node --experimental-strip-types scripts/analyze-medium-bvh-traps.mjs <trap-capture.json>');
const capture=JSON.parse(fs.readFileSync(input));
if(capture.traceEmitters)process.env.ATLAS_BVH_EMITTERS='1';else delete process.env.ATLAS_BVH_EMITTERS;
const prior=fs.readFileSync('scripts/benchmark-wavefront-bvh.mjs','utf8');
let loader=prior.slice(0,prior.indexOf('const byName='))
 .replace(/^import .*;\n/gm,'').replace('const transportStats=run(Math.fround(.035),true);','const transportStats=null;');
loader+='\nreturn {rows,g,bvh,source,traceEmitters};';
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
const {rows,g,bvh,source,traceEmitters}=await new AsyncFunction('fs','createHash','T','GLTFLoader','mergeGeometries','MeshBVH','SAH','getBVHExtremes',loader)(fs,createHash,T,GLTFLoader,mergeGeometries,MeshBVH,SAH,getBVHExtremes);
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
if(sha(source)!==TESTED_MEDIUM_BVH_SHA256)throw Error('Candidate changed');
const pos=g.attributes.position,rowAttr=g.attributes.row;
const allowed=(medium,row)=>medium===0||row.optical&&(medium===1?row.inside===1:medium===2?row.inside===2:medium===3?row.inside===3||row.inside===4||row.inside===1&&row.outside===3:medium===4?row.inside===4:false);
function material(firstVertex){const rowIndex=rowAttr.getX(firstVertex);return {rowIndex,...rows[rowIndex]};}
function triangle(firstVertex){return [0,1,2].map(i=>new T.Vector3().fromBufferAttribute(pos,firstVertex+i));}
const f=Math.fround,sub=(a,b)=>a.map((v,i)=>f(v-b[i])),mul=(a,b)=>f(a*b),add=(a,b)=>f(a+b);
const dot=(a,b)=>add(add(mul(a[0],b[0]),mul(a[1],b[1])),mul(a[2],b[2]));
const cross=(a,b)=>[f(mul(a[1],b[2])-mul(a[2],b[1])),f(mul(a[2],b[0])-mul(a[0],b[2])),f(mul(a[0],b[1])-mul(a[1],b[0]))];
function scalarFloat32Triangle(origin,direction,vertices){
 const [a,b,c]=vertices.map(v=>v.toArray()),edge1=sub(b,a),edge2=sub(c,a),normal=cross(edge1,edge2),det=f(-dot(direction,normal)),invdet=f(1/det),AO=sub(origin,a),DAO=cross(AO,direction);
 const u=mul(dot(edge2,DAO),invdet),v=mul(f(-dot(edge1,DAO)),invdet),distance=mul(dot(AO,normal),invdet),w=f(f(1-u)-v);
 return {accepted:[u,v,distance,w].every(n=>f(n+f(1e-5))>=0),distance,side:Math.sign(det),barycentric:[w,u,v],caveat:'Explicit scalar float32 roundings, no fused operations; GPU compiler may contract/reassociate.'};
}
function describe(hit,event){
 if(!hit.hit)return hit;
 const {firstVertex}=hit;if(!Number.isInteger(firstVertex)||firstVertex%3||firstVertex+2>=pos.count)throw Error('Invalid trapped global ID');
 const vertices=triangle(firstVertex),m=material(firstVertex),normal=T.Triangle.getNormal(...vertices,new T.Vector3()),ray=new T.Ray(new T.Vector3().fromArray(event.origin),new T.Vector3().fromArray(event.direction));
 const exactPoint=ray.intersectTriangle(...vertices,false,new T.Vector3());
 return {...hit,material:m,inRestrictedTree:allowed(event.medium,m),vertices:vertices.map(v=>v.toArray()),geometricNormal:normal.toArray(),minBarycentric:Math.min(...hit.barycentric),
  doubleTriangle:exactPoint?{distance:exactPoint.distanceTo(ray.origin),point:exactPoint.toArray()}:null,scalarFloat32:scalarFloat32Triangle(event.origin,event.direction,vertices)};
}
const mediumTrees=new Map();
function mediumTree(medium){
 if(!mediumTrees.has(medium)){
  const index=[];for(let v=0;v<pos.count;v+=3)if(allowed(medium,material(v)))index.push(v,v+1,v+2);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',pos);geometry.setIndex(index);
  mediumTrees.set(medium,{geometry,bvh:new MeshBVH(geometry,{strategy:SAH,targetLeafSize:4})});
 }
 return mediumTrees.get(medium);
}
function originContainment(event){
 const {geometry,bvh:tree}=mediumTree(event.medium),point=new T.Vector3().fromArray(event.origin);
 const closest=tree.closestPointToPoint(point);let nearestSurface=null;
 if(closest){
  const index=geometry.index,first=index.getX(closest.faceIndex*3),vertices=triangle(first),normal=T.Triangle.getNormal(...vertices,new T.Vector3());
  nearestSurface={firstVertex:first,triangle:first/3,distance:closest.distance,signedOrientedDistance:point.clone().sub(closest.point).dot(normal),point:closest.point.toArray(),normal:normal.toArray(),material:material(first)};
 }
 const parity=[[1,.371,.219],[-.281,.913,.47],[.193,.337,1]].map(vector=>{
  const direction=new T.Vector3().fromArray(vector).normalize(),hits=tree.raycast(new T.Ray(point,direction),T.DoubleSide).sort((a,b)=>a.distance-b.distance),unique=[];
  for(const hit of hits)if(!unique.length||Math.abs(hit.distance-unique.at(-1).distance)>1e-7)unique.push(hit);
  return {direction:direction.toArray(),crossings:unique.length,insideByParity:unique.length%2===1};
 });
 return {nearestSurface,parity,caveat:'Actual selected boundary triangles; nearest oriented sign is local and parity directions are finite evidence, not an exhaustive topology proof.'};
}
const events=capture.traps.events.map(event=>{
 const ray=new T.Ray(new T.Vector3().fromArray(event.origin),new T.Vector3().fromArray(event.direction));
 const sorted=bvh.raycast(ray,T.DoubleSide).sort((a,b)=>a.distance-b.distance);
 const nearest=hit=>hit?{firstVertex:hit.face.a,triangle:hit.face.a/3,distance:hit.distance,material:material(hit.face.a)}:null;
 const restricted=describe(event.restricted,event),full=describe(event.full,event);
 let relation=null;
 if(restricted.hit&&full.hit){
  const shared=restricted.vertices.filter(a=>full.vertices.some(b=>a.every((v,i)=>v===b[i]))).length;
  const an=new T.Vector3().fromArray(restricted.geometricNormal),bn=new T.Vector3().fromArray(full.geometricNormal),anchor=new T.Vector3().fromArray(restricted.vertices[0]);
  relation={sameTriangle:restricted.firstVertex===full.firstVertex,sameMaterial:restricted.material.rowIndex===full.material.rowIndex,sharedVertices:shared,
   gpuDistanceDelta:restricted.distance-full.distance,normalDot:an.dot(bn),maxFullVertexPlaneDistance:Math.max(...full.vertices.map(v=>Math.abs(new T.Vector3().fromArray(v).sub(anchor).dot(an))))};
 }
 return {...event,restricted,full,relation,doubleNearestFull:nearest(sorted[0]),doubleNearestRestricted:nearest(sorted.find(h=>allowed(event.medium,material(h.face.a)))),originContainment:full.hit&&!full.inRestrictedTree?originContainment(event):null};
});
const report={input,inputSha256:sha(input),source,sourceSha256:sha(source),analysisSha256:sha('scripts/analyze-medium-bvh-traps.mjs'),importerHashes:Object.fromEntries(['scripts/benchmark-wavefront-bvh.mjs','tests/audit-wavefront-transport.mjs'].map(p=>[p,sha(p)])),traceEmitters,events,
 summary:{events:events.length,fullHitExcluded:events.filter(e=>e.full.hit&&!e.full.inRestrictedTree).length,sameMaterial:events.filter(e=>e.relation?.sameMaterial).length,sharedEdge:events.filter(e=>e.relation?.sharedVertices>=2).length,exactGpuDistanceTie:events.filter(e=>e.relation?.gpuDistanceDelta===0).length,negativeBarycentric:events.filter(e=>(e.full.hit&&e.full.minBarycentric<0)||(e.restricted.hit&&e.restricted.minBarycentric<0)).length},
 caveats:'GPU hits are observed; material mapping and geometric relationships use unchanged world-space candidate triangles. CPU raycasts omit the GLSL triangle epsilon. The scalar float32 calculation does not reproduce all GPU fused/reassociated arithmetic. Excluded hits must be assessed geometrically; their existence alone does not prove a physical overlap if epsilon accepts a point outside a triangle.'};
const output=input.replace(/\.json$/,'-analysis.json');fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,summary:report.summary}));
