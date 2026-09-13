// Installed-library CPU contract for the persistent capture-camera change.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {WebGLRenderStates} from 'three/src/renderers/webgl/WebGLRenderStates.js';
const camera=new THREE.PerspectiveCamera(35,635.015625/800,.08,250);
const capture=camera.clone();
const id=capture.id,scene=new THREE.Scene(),states=WebGLRenderStates({});
const state=states.get(scene,0);
const assign=(target,source)=>{target.copy(source,false);target.viewport=source.viewport;};
const rows=[];
for(let index=0;index<12;index++){
 const angle=index*Math.PI/5;
 camera.position.set(Math.sin(angle)*(7+index),1.8+index*.2,Math.cos(angle)*(7+index));
 camera.lookAt(0,1.28+index*.3,0);camera.aspect=(635.015625+index*.125)/(800+index);camera.zoom=.8+index*.04;
 camera.layers.mask=1|(1<<(index%5));
 if(index%3===1)camera.setViewOffset(1920,1080,20,10,1280,800);else camera.clearViewOffset();
 camera.updateProjectionMatrix();camera.updateMatrixWorld();
 camera.viewport=index%2?new THREE.Vector4(0,0,1271,1600):undefined;
 assign(capture,camera);
 // Same update performed by WebGLRenderer for these parentless cameras.
 camera.updateMatrixWorld();capture.updateMatrixWorld();
 for(const key of ['matrix','matrixWorld','matrixWorldInverse','projectionMatrix','projectionMatrixInverse'])assert.deepEqual(capture[key].elements,camera[key].elements);
 for(const key of ['near','far','fov','aspect','zoom','coordinateSystem'])assert.equal(capture[key],camera[key]);
 assert.equal(capture.layers.mask,camera.layers.mask);assert.equal(capture.viewport,camera.viewport);
 assert.notEqual(capture.id,camera.id);assert.equal(capture.id,id);assert.equal(capture.children.length,0);
 for(const [who,w] of [[capture,1271],[camera,1270]]){
  state.state.transmissionRenderTarget[who.id]??=new THREE.WebGLRenderTarget(w,1600);
  const target=state.state.transmissionRenderTarget[who.id];let disposed=false;
  target.addEventListener('dispose',()=>disposed=true);target.setSize(w,1600);assert(!disposed);
 }
 rows.push({index,distinctPersistentId:true,exactMatricesAndProjection:true,matchingLayers:true,viewportForwarded:true});
}
assert.equal(states.get(scene,0),state);assert.equal(Object.keys(state.state.transmissionRenderTarget).length,2);
const report={scope:'CPU-only installed camera copy/render-state semantics; no GPU pixel or allocation acceptance',sourceCamera:{type:camera.type,parent:camera.parent,children:camera.children.length},checks:rows,cacheEntries:Object.keys(state.state.transmissionRenderTarget).length,sourceHash:createHash('sha256').update(fs.readFileSync('src/scenes/Viewer.tsx')).digest('hex'),limits:'Current product uses a parentless default camera. Detached copies of parented cameras require preserving their world matrices against renderer recomputation. Memory allocation and pixel parity require live checks.'};
fs.writeFileSync('qa/evidence/capture-camera-independent-cpu.json',JSON.stringify(report,null,2)+'\n');
console.log('PASS: 12 camera states preserve exact matrices/projection/layers and independent stable transmission-cache entries; no GPU used.');
