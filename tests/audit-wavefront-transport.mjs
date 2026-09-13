// CPU diagnostic of actual wavefront geometry and MC boundary scheduling.
// Double precision Three raycasts are not a GPU pixel match; never a fidelity gate.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,SAH} from 'three-mesh-bvh';
const source=process.env.ATLAS_AUDIT_MODEL||'public/models/negroni-express-interfaces-air-gap.glb';
const output=process.env.ATLAS_AUDIT_OUTPUT||'qa/evidence/bvh-wavefront-cpu-v011.json';
const files=[source,'src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts'];
const hashes=Object.fromEntries(files.map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const b=fs.readFileSync(source),gltf=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');
const rows=[],gs=[];gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse(o=>{if(!o.isMesh)return;let owner=o;while(owner&&!owner.userData.scenePartId)owner=owner.parent;const data={...owner?.userData,...o.userData},part=String(data.scenePartId||o.name),m=o.material;if(data.role==='recipe'||part.startsWith('stage_'))return;const optical=['glass','liquid','ice'].includes(part)||m.transmission>.5;if(optical&&Math.abs(m.ior-1)<.0001)return;
const inside=part==='liquid'?1:part==='glass'?2:part==='ice'?3:part==='ice_inclusions'?4:0;
const outside=part==='liquid'&&m.ior<1.1?3:part==='glass'&&m.ior<1.3?1:part==='ice_inclusions'?3:0;
const row={part,material:m.name,ior:part==='ice_inclusions'?1.03/1.31:m.ior||1.5,optical,inside,outside};rows.push(row);
const clone=o.geometry.clone().applyMatrix4(o.matrixWorld),s=clone.index?clone.toNonIndexed():clone,g=new T.BufferGeometry();g.setAttribute('position',s.getAttribute('position'));g.setAttribute('row',new T.Float32BufferAttribute(new Float32Array(s.attributes.position.count).fill(rows.length-1),1));gs.push(g);});
const g=mergeGeometries(gs),bvh=new MeshBVH(g,{strategy:SAH,targetLeafSize:4}),position=g.attributes.position;
const camera=new T.PerspectiveCamera(35,720/900,.05,250);camera.position.set(0,1.8+6.85*Math.cos(.16)*Math.tan(Math.asin(.307)),6.85*Math.cos(.16));camera.lookAt(0,1.28,0);camera.updateMatrixWorld(true);
const height=75,width=60,samples=32,absorption=new T.Color('#ed4e16'),offset=.0001;
const random=seed=>{let state=seed>>>0;return ()=>{state=(Math.imul(state,747796405)+2891336453)>>>0;let word=Math.imul((state>>>((state>>>28)+4))^state,277803737)>>>0;return (((word>>>22)^word)>>>8)/16777216;};};
function run(floorY,contactRule=false){
const stats={paths:0,crossings:0,reflections:0,tir:0,rouletteDeaths:0,maxDepth:0,wrongIncoming:0,terminalFloorInMedium:0,terminalMissInMedium:0,downwardEnvironmentBelowFloor:0,nonFinite:0};const terminalMedia={},examples={wrongIncoming:[],floorInMedium:[],belowFloor:[]};
for(let y=0;y<height;y++)for(let x=0;x<width;x++)for(let sample=0;sample<samples;sample++){
 stats.paths++;let depth=0,medium=0,throughput=new T.Vector3(1,1,1),sequence=[],seedBase=(Math.imul(x,1973)+Math.imul(y,9277)+Math.imul(sample,26699)+89173)>>>0,rng=random(seedBase);
 const u=(x+.5+rng()-.5)/width,v=(y+.5+rng()-.5)/height;let p=camera.position.clone(),d=new T.Vector3(u*2-1,v*2-1,.5).unproject(camera).sub(p).normalize();const forward=new T.Vector3(0,0,-1).applyQuaternion(camera.quaternion);p.addScaledVector(d,.05/d.dot(forward));
 while(true){
  const hit=bvh.raycastFirst(new T.Ray(p,d),T.DoubleSide),floorDist=d.y<-.0001?(floorY-p.y)/d.y:Infinity;
  const localContact=contactRule&&medium===0&&d.y<-.0001&&p.y<=floorY+offset&&p.y>=floorY-2*offset;
  const glassTie=contactRule&&hit&&rows[g.attributes.row.getX(hit.face.a)].part==='glass'&&Math.abs(floorDist-hit.distance)<=offset;
  if(localContact||!hit||(floorDist>0&&floorDist<hit.distance&&!glassTie)){
   const floor=localContact||(d.y<-.0001&&floorDist>0),terminal=`${floor?'floor':'environment'}:${medium}`;terminalMedia[terminal]=(terminalMedia[terminal]||0)+1;
   if(floor&&medium!==0){stats.terminalFloorInMedium++;if(examples.floorInMedium.length<4)examples.floorInMedium.push({pixel:[x,y],sample,medium,floorDist,nextHit:hit?.distance,sequence:sequence.slice(-5)});}
   if(!hit&&medium!==0)stats.terminalMissInMedium++;
   if(!floor&&d.y<-.0001&&p.y<floorY){stats.downwardEnvironmentBelowFloor++;if(examples.belowFloor.length<4)examples.belowFloor.push({pixel:[x,y],sample,medium,origin:p.toArray(),direction:d.toArray(),sequence:sequence.slice(-5)});}
   break;
  }
  if(medium===1)throughput.multiply(new T.Vector3(absorption.r,absorption.g,absorption.b).set(Math.max(.001,absorption.r)**(hit.distance/1.7),Math.max(.001,absorption.g)**(hit.distance/1.7),Math.max(.001,absorption.b)**(hit.distance/1.7)));
  if(medium===2)throughput.multiply(new T.Vector3(.985**hit.distance,.992**hit.distance,.990**hit.distance));
  if(medium===3)throughput.multiply(new T.Vector3(.996**hit.distance,.998**hit.distance,1));
  const {a,b,c}=hit.face,row=rows[g.attributes.row.getX(a)];if(!row.optical)break;
  stats.crossings++;const va=new T.Vector3().fromBufferAttribute(position,a),vb=new T.Vector3().fromBufferAttribute(position,b),vc=new T.Vector3().fromBufferAttribute(position,c),outward=vb.sub(va).cross(vc.sub(va)).normalize(),side=-d.dot(outward)>0?1:-1,n=outward.multiplyScalar(side),incoming=side>0?row.outside:row.inside,outgoing=side>0?row.inside:row.outside;
  const event={depth,medium,incoming,outgoing,part:row.part,material:row.material,point:hit.point.toArray(),distance:hit.distance};sequence.push(event);if(sequence.length>10)sequence.shift();
  if(medium!==incoming){stats.wrongIncoming++;if(examples.wrongIncoming.length<6)examples.wrongIncoming.push({pixel:[x,y],sample,sequence:sequence.slice()});}
  const eta=side>0?1/row.ior:row.ior,cosI=Math.min(1,Math.max(0,-d.dot(n))),k=1-eta*eta*(1-cosI*cosI),cosT=Math.sqrt(Math.max(0,k));const rs=(eta*cosI-cosT)/(eta*cosI+cosT),rp=(cosI-eta*cosT)/(cosI+eta*cosT),F=k<0?1:Math.min(1,Math.max(0,(rs*rs+rp*rp)*.5));if(k<0)stats.tir++;
  if(rng()<F){stats.reflections++;d.reflect(n);p.copy(hit.point).addScaledVector(n,offset);}else{d.multiplyScalar(eta).addScaledVector(n,eta*cosI-cosT).normalize();p.copy(hit.point).addScaledVector(n,-offset);medium=outgoing;throughput.multiplyScalar(eta*eta);}
  depth++;stats.maxDepth=Math.max(depth,stats.maxDepth);
  if(![...d.toArray(),...p.toArray(),...throughput.toArray()].every(Number.isFinite)){stats.nonFinite++;break;}
  if(depth>24){const survival=Math.min(.98,Math.max(.05,...throughput.toArray()));if(rng()>survival){stats.rouletteDeaths++;break;}throughput.divideScalar(survival);}
  rng=random((seedBase+Math.imul(depth,31847))>>>0);
 }
}
return {floorY,contactRule,stats,terminalMedia,examples};}
const report={date:new Date().toISOString(),source,hashes,caseDescriptions:{current:'Historical coincident-floor rule before contact correction; retained for matched diagnosis, not a claim about the current shader.',floorBelowOffset:'Separate floor shifted down .0003; diagnostic only.',localContactRule:'Glass wins near-distance tie, then downward air rays displaced into the immediate contact neighborhood terminate on stone.'},geometryTriangles:g.index.count/3,rows,settings:{width,height,samples,camera:camera.position.toArray(),offset},caveats:'CPU uses Three DoubleSide raycasts in doubles, not GLSL float32 intersection epsilon; no texture shading or radiance image evaluated. Same boundary labels, IOR, seeded Fresnel choices, throughput attenuation and Russian roulette as reviewed shader. Fixed completed sample count per pixel; no artificial path length cutoff. Shifted-floor case is a separate geometric diagnostic and is not a source edit.',current:run(Math.fround(.035)),floorBelowOffset:run(Math.fround(.035)-.0003),localContactRule:run(Math.fround(.035),true)};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,current:report.current.stats,currentTerminals:report.current.terminalMedia,shifted:report.floorBelowOffset.stats,shiftedTerminals:report.floorBelowOffset.terminalMedia,contact:report.localContactRule.stats,contactTerminals:report.localContactRule.terminalMedia},null,2));
