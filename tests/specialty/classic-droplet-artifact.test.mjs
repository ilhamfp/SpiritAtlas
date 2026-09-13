import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {readFile} from 'node:fs/promises';
import * as THREE from 'three';
import {loadCachedFluid} from '../../src/animation/classic/core/cached-fluid.js';
import {loadDropletMask} from '../../src/animation/classic/core/droplet-mask.js';
import {createParticleSurface} from '../../src/animation/classic/core/particle-surface.js';

const publicRoot=new URL('../../public/',import.meta.url);
const metadataFile=new URL('classic-negroni/simulation/droplet-clearance.json',publicRoot);
const missingArtifacts=!existsSync(metadataFile);
const fetchLocal=async url=>new Response(await readFile(new URL(new URL(url,'http://localhost').pathname.slice(1),publicRoot)));

test('published mask binds the actual cache and matches every native candidate at all 506 poses',
  {skip:missingArtifacts?'Generated droplet artifact not present':false},async()=>{
  const cache=await loadCachedFluid({fetchImpl:fetchLocal});
  const mask=await loadDropletMask({cache,fetchImpl:fetchLocal});
  const meta=JSON.parse(await readFile(metadataFile));
  const binary=await readFile(new URL(meta.binaryFile,metadataFile));
  const view=new DataView(binary.buffer,binary.byteOffset,binary.byteLength);
  assert.equal(meta.count,4800);assert.equal(meta.poseCount,506);
  assert.equal(cache.sourceCacheSha256,meta.sourceCacheSha256);
  assert.equal(cache.sourceCacheMetadataSha256,meta.sourceCacheMetadataSha256);
  let checked=0;
  for(let frame=0;frame<meta.poseCount;frame++){
    // The published fluid cache carries the exact interpolated phase used by
    // these native samples, so the test needs no offline mesh export directory.
    cache.update(meta.sourceTimes[frame]/cache.duration);
    const phase=cache.rigProgress,t=Math.max(0,Math.min(1,(phase-.008)/(.085-.008))),reveal=t*t*(3-2*t);
    mask.sample(meta.sourceTimes[frame],phase);
    for(const id of meta.nativeDropParticleIds[frame]){
      const signed=view.getInt16((frame*meta.count+id)*2,true)/meta.quantization;
      assert.equal(mask.radiusScale(id),Math.max(0,Math.min(1,signed))*reveal);checked++;
    }
  }
  assert.ok(checked>80000);
});

test('actual opening, spray and idle preserve primary geometry while filtering only original candidates',
  {skip:missingArtifacts?'Generated droplet artifact not present':false},async()=>{
  const cache=await loadCachedFluid({fetchImpl:fetchLocal}),mask=await loadDropletMask({cache,fetchImpl:fetchLocal});
  const meta=JSON.parse(await readFile(metadataFile));
  const original=createParticleSurface(THREE,cache),filtered=createParticleSurface(THREE,cache,{dropletMask:mask});
  const matrices=new Map(),m=new THREE.Matrix4();
  const drops=surface=>surface.group.children.filter(o=>o.isInstancedMesh);
  try {
    for(const frame of [2,3,4,5,6,48,96,432,470]){
      cache.update(meta.sourceTimes[frame]/cache.duration);
      original.update(cache.rigProgress);filtered.update(cache.rigProgress);
      const count=original.mesh.geometry.drawRange.count;
      assert.ok(count>0);assert.equal(filtered.mesh.geometry.drawRange.count,count);
      for(const key of ['position','normal','color']){
        const before=original.mesh.geometry.attributes[key],after=filtered.mesh.geometry.attributes[key];
        assert.deepEqual(after.array.subarray(0,count*after.itemSize),before.array.subarray(0,count*before.itemSize));
      }
      matrices.clear();let originalCount=0,filteredCount=0;
      for(const mesh of drops(original))for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,m);matrices.set(m.elements.slice(12,15).join(','),m.clone());originalCount++;
      }
      for(const mesh of drops(filtered))for(let i=0;i<mesh.count;i++){
        mesh.getMatrixAt(i,m);const before=matrices.get(m.elements.slice(12,15).join(','));
        assert.ok(before,'Filtered geometry must come from an original particle candidate');
        for(const axis of [0,5,10])assert.ok(m.elements[axis]<=before.elements[axis]+1e-8);
        filteredCount++;
      }
      assert.ok(filteredCount<=originalCount);
      if(frame>=3&&frame<=6)assert.ok(filteredCount<originalCount/10,'Embedded opening burst must be suppressed');
      if(frame===48||frame===96)assert.ok(filteredCount>0,'Detached spray must remain visible');
    }
  } finally {
    const resources=new Set();
    for(const surface of [original,filtered])surface.group.traverse(o=>{
      if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);if(o.isInstancedMesh)o.dispose();
    });for(const resource of resources)resource.dispose();
  }
});
