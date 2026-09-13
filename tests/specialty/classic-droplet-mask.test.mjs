import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import * as THREE from 'three';
import {createDropletMask,loadDropletMask} from '../../src/animation/classic/core/droplet-mask.js';
import {createParticleSurface} from '../../src/animation/classic/core/particle-surface.js';

const sha = bytes => createHash('sha256').update(new Uint8Array(bytes)).digest('hex');
function fixture() {
  const rows = [[-32767,0,10000],[32767,0,16383],[32767,16383,0],
    [32767,16383,0],[0,32767,-32767],[-16384,32767,32767]];
  const data = new ArrayBuffer(rows.flat().length * 2), view = new DataView(data);
  rows.flat().forEach((value,index)=>view.setInt16(index*2,value,true));
  const cache = {count:3,duration:1,sourceCacheSha256:'a'.repeat(64),sourceCacheMetadataSha256:'b'.repeat(64)};
  const meta = {version:1,encoding:'int16-le',count:3,poseCount:6,quantization:32767,absentValue:-32767,
    clearanceMargin:.0005,clearanceMultiplier:.95,revealPhase:[.008,.085],
    binaryFile:`droplet-clearance.${sha(data).slice(0,12)}.bin`,binarySha256:sha(data),
    sourceCacheSha256:cache.sourceCacheSha256,sourceCacheMetadataSha256:cache.sourceCacheMetadataSha256,
    sourceTimes:[0,.5,1,1,.7,.2],
    sortedSamples:[{sourceTime:0,poseIndex:0},{sourceTime:.2,poseIndex:5},{sourceTime:.5,poseIndex:1},
      {sourceTime:.7,poseIndex:4},{sourceTime:1,poseIndex:2}],
    nativeDropParticleIds:rows.map(()=>[0,1,2])};
  return {meta,data,cache};
}

test('signed interpolation preserves exact native and nonuniform idle samples, including reverse seeks',()=>{
  const {meta,data,cache}=fixture(),mask=createDropletMask(meta,data,{cache});
  assert.equal(mask.sampleCount,5);
  assert.equal(mask.sample(.2,1).radiusScale(1),1);
  assert.equal(mask.sample(.7,1).radiusScale(1),1);
  assert.equal(mask.sample(.5,1).radiusScale(1),0);
  assert.equal(mask.sample(1,1).radiusScale(0),1);
  assert.equal(mask.sample(.1,1).radiusScale(0),0,'signed negative endpoint must suppress early birth');
  const signedMiddle=(-16384+32767)/2/32767;
  assert.ok(Math.abs(mask.sample(.35,1).radiusScale(0)-signedMiddle)<1e-12);
  const forward=mask.sample(.66,1).radiusScale(1);
  mask.sample(.9,1);assert.equal(mask.sample(.66,1).radiusScale(1),forward);
  assert.equal(mask.sample(-10,1).radiusScale(0),0);
  assert.equal(mask.sample(10,1).radiusScale(0),1);
  assert.equal(mask.sample(1,.008).radiusScale(0),0);
  assert.ok(Math.abs(mask.sample(1,(.008+.085)/2).radiusScale(0)-.5)<1e-12);
  assert.equal(mask.sample(1,.085).radiusScale(0),1);
});

test('decoder rejects stale identities, bad clocks, ambiguous IDs and disagreeing alias weights',()=>{
  const {meta,data,cache}=fixture();
  assert.throws(()=>createDropletMask(meta,data.slice(2),{cache}),/length/);
  assert.throws(()=>createDropletMask(meta,data,{cache:{...cache,sourceCacheSha256:'c'.repeat(64)}}),/mismatch/);
  for(const change of [m=>m.sortedSamples.splice(1,1),m=>m.sortedSamples.reverse(),
    m=>m.sortedSamples[1].poseIndex=0,m=>m.nativeDropParticleIds[0]=[0,0],
    m=>m.nativeDropParticleIds[0]=[3],m=>m.revealPhase[0]=0]){
    const invalid=structuredClone(meta);change(invalid);
    assert.throws(()=>createDropletMask(invalid,data,{cache}));
  }
  const mismatched=data.slice(0);new DataView(mismatched).setInt16(3*3*2,100,true);
  assert.throws(()=>createDropletMask(meta,mismatched,{cache}),/duplicate source times/);
  const invalid=data.slice(0);new DataView(invalid).setInt16(0,-32768,true);
  assert.throws(()=>createDropletMask(meta,invalid,{cache}),/encoding range/);
  const mask=createDropletMask(meta,data,{cache});
  assert.throws(()=>mask.sample(NaN,1),/nonfinite/);
  assert.throws(()=>mask.radiusScale(3),/out of bounds/);
});

test('cosine times separated by one floating-point ulp preserve identical weights',()=>{
  const {meta,data,cache}=fixture();
  // The last two endpoint rows already agree. Keep both exact times, as the
  // native manifest does when cosine sampling lands next to a uniform sample.
  meta.sourceTimes[3]=1-Number.EPSILON;
  meta.sortedSamples.splice(4,0,{sourceTime:meta.sourceTimes[3],poseIndex:3});
  const mask=createDropletMask(meta,data,{cache});
  assert.equal(mask.sample(meta.sourceTimes[3],1).radiusScale(0),1);
  assert.equal(mask.sample(1,1).radiusScale(0),1);
});

test('loader verifies the actual binary and cache binding before returning a mask',async()=>{
  const {meta,data,cache}=fixture(),url='https://unit.test/assets/droplet-clearance.json',calls=[];
  const metadataBytes=new TextEncoder().encode(JSON.stringify(meta));
  const fetchImpl=async address=>{
    calls.push(address);return new Response(address.endsWith('.json')?metadataBytes:data.slice(0),{status:200});
  };
  const mask=await loadDropletMask({cache,url,fetchImpl});
  assert.equal(mask.metadataSha256,sha(metadataBytes));
  assert.deepEqual(calls,[url,`https://unit.test/assets/${meta.binaryFile}`]);
  assert.equal(mask.sample(.7,1).radiusScale(1),1);
  const bad=data.slice(0);new Uint8Array(bad)[0]^=1;
  await assert.rejects(loadDropletMask({cache,url,fetchImpl:async address=>
    new Response(address.endsWith('.json')?metadataBytes:bad)}),/binary hash/);
  await assert.rejects(loadDropletMask({cache:{...cache,sourceCacheMetadataSha256:'c'.repeat(64)},url,fetchImpl}),/mismatch/);
  const control=new AbortController();control.abort();
  await assert.rejects(loadDropletMask({cache,url,fetchImpl,signal:control.signal}),/abort/i);
});

test('emitter changes only secondary radii and never changes the primary mesh, colors or particles',()=>{
  const xyz=[];
  for(let z=-2;z<=2;z++)for(let y=-2;y<=2;y++)for(let x=-2;x<=2;x++)xyz.push(x*.04,3+y*.04,z*.04);
  xyz.push(1,4,0);const count=xyz.length/3,positions=new Float32Array(xyz),before=positions.slice();
  const solver={count,positions,ids:new Uint8Array(count),velocities:new Float32Array(xyz.length),
    particleMass:1,restDensity:1000,progress:.5,duration:7.2,baked:true};
  const samples=[],mask={count,duration:7.2,sample:(...args)=>samples.push(args),radiusScale:id=>id===count-1?.25:0};
  const original=createParticleSurface(THREE,solver),filtered=createParticleSurface(THREE,solver,{dropletMask:mask});
  try {
    original.update(.4);filtered.update(.4);
    assert.deepEqual(samples,[[3.6,.4]]);
    assert.deepEqual(positions,before);
    assert.ok(original.mesh.geometry.drawRange.count>0,'Fixture must have a real primary liquid surface');
    assert.equal(filtered.mesh.geometry.drawRange.count,original.mesh.geometry.drawRange.count);
    for(const key of ['position','normal','color']){
      const a=original.mesh.geometry.attributes[key],b=filtered.mesh.geometry.attributes[key];
      assert.deepEqual(b.array.slice(0,b.itemSize*filtered.mesh.geometry.drawRange.count),
        a.array.slice(0,a.itemSize*original.mesh.geometry.drawRange.count));
    }
    const beforeDrops=original.group.children.filter(o=>o.isInstancedMesh),afterDrops=filtered.group.children.filter(o=>o.isInstancedMesh);
    assert.ok(beforeDrops[0].count>=1);assert.deepEqual(afterDrops.map(o=>o.count),[1,0,0]);
    const raw=new THREE.Matrix4(),changed=new THREE.Matrix4(),rawScale=new THREE.Vector3(),scaled=new THREE.Vector3();
    beforeDrops[0].getMatrixAt(beforeDrops[0].count-1,raw);afterDrops[0].getMatrixAt(0,changed);
    assert.deepEqual(new THREE.Vector3().setFromMatrixPosition(changed).toArray(),new THREE.Vector3().setFromMatrixPosition(raw).toArray());
    rawScale.setFromMatrixScale(raw);scaled.setFromMatrixScale(changed);
    for(let axis=0;axis<3;axis++)assert.ok(Math.abs(scaled.getComponent(axis)/rawScale.getComponent(axis)-.25)<1e-7);
    assert.deepEqual(afterDrops[0].material.attenuationColor.toArray(),beforeDrops[0].material.attenuationColor.toArray());
  } finally {
    const resources=new Set();
    for(const surface of [original,filtered])surface.group.traverse(o=>{
      if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material);if(o.isInstancedMesh)o.dispose();
    });for(const resource of resources)resource.dispose();
  }
});
