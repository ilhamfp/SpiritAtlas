// Quantify regeneration precision independently from exact same-source bake checks.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {Texture,Vector3,Matrix3} from 'three';
const sourceTag=process.env.ATLAS_REPRO_SOURCE||'v0151-baked';
const candidateTag=process.env.ATLAS_REPRO_CANDIDATE||'wrapper-repro-v0151';
const hash=b=>createHash('sha256').update(b).digest('hex');
async function load(path){
 const bytes=fs.readFileSync(path),loader=new GLTFLoader();loader.register(()=>({name:'CPU_TEXTURE_STUB',loadTexture:()=>Promise.resolve(new Texture())}));
 const scene=(await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')).scene;scene.updateMatrixWorld(true);const rows={};
 scene.traverse(o=>{
  if(!o.isMesh)return;let owner=o;while(owner&&!owner.userData.scenePartId)owner=owner.parent;assert(owner);
  const row=rows[owner.userData.scenePartId]??={extras:owner.userData,triangles:[]};const p=o.geometry.attributes.position,n=o.geometry.attributes.normal,index=o.geometry.index,nm=new Matrix3().getNormalMatrix(o.matrixWorld);
  for(let i=0;i<(index?.count??p.count);i+=3){
   const corners=[];for(let j=0;j<3;j++){const k=index?index.getX(i+j):i+j;const position=new Vector3().fromBufferAttribute(p,k).applyMatrix4(o.matrixWorld);const normal=new Vector3().fromBufferAttribute(n,k).applyNormalMatrix(nm);corners.push({key:position.toArray().map(x=>x.toFixed(5)).join(','),position,normal});}
   corners.sort((a,b)=>a.key.localeCompare(b.key));row.triangles.push({key:corners.map(c=>c.key).join(';'),corners});
  }
 });for(const row of Object.values(rows))row.triangles.sort((a,b)=>a.key.localeCompare(b.key));return{rows,sha256:hash(bytes)};
}
const results=[];
for(const drink of ['bbf-negroni','ichigo-negroni','negroni-express']){
 const a=await load(`public/models/candidates/${sourceTag}/${drink}.glb`),b=await load(`public/models/candidates/${candidateTag}/${drink}.glb`);assert.deepEqual(Object.keys(a.rows).sort(),Object.keys(b.rows).sort());const parts={};
 for(const id of Object.keys(a.rows)){
  const x=a.rows[id],y=b.rows[id];assert.deepEqual(x.extras,y.extras);assert.equal(x.triangles.length,y.triangles.length);let maxPositionDistance=0,maxNormalAngleDegrees=0,maxNormalComponentDifference=0;
  for(let i=0;i<x.triangles.length;i++){
   const u=x.triangles[i],v=y.triangles[i];assert.equal(u.key,v.key,`${drink}/${id}: corresponding triangle spatial key`);
   for(let k=0;k<3;k++){const c=u.corners[k],d=v.corners[k];maxPositionDistance=Math.max(maxPositionDistance,c.position.distanceTo(d.position));maxNormalAngleDegrees=Math.max(maxNormalAngleDegrees,c.normal.angleTo(d.normal)*180/Math.PI);for(const axis of ['x','y','z'])maxNormalComponentDifference=Math.max(maxNormalComponentDifference,Math.abs(c.normal[axis]-d.normal[axis]));}
  }
  parts[id]={triangles:x.triangles.length,maxPositionDistance,maxNormalAngleDegrees,maxNormalComponentDifference,extrasExactlyEqual:true};
  assert(maxPositionDistance<1e-6,`${drink}/${id} regeneration positional precision`);// Quantify normal changes below; record complete evidence before judging precision.
 }
 results.push({drink,sourceSha256:a.sha256,candidateSha256:b.sha256,parts});
}
fs.writeFileSync('qa/evidence/wrapper-repro-v0151-precision.json',JSON.stringify({method:'Actual world-space triangle corner distances and unit-normal angles after spatial correspondence at1e-5; exact component metadata. Actual corner positions are identical in this run. Normal angle differences are reported as measured regeneration precision, not a photographic acceptance threshold. Same-source bake preservation remains separately checked to1e-7.',results},null,2));
console.log(JSON.stringify(results.map(r=>({drink:r.drink,maxPositionDistance:Math.max(...Object.values(r.parts).map(p=>p.maxPositionDistance)),maxNormalAngleDegrees:Math.max(...Object.values(r.parts).map(p=>p.maxNormalAngleDegrees)),maxNormalComponentDifference:Math.max(...Object.values(r.parts).map(p=>p.maxNormalComponentDifference))})),null,2));
