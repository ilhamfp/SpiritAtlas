// Test-only shader output trap at the already observed predecessor ordinal.
// No production source/offset/intersection mutation; no timing inference.
import fs from 'node:fs';import {createHash} from 'node:crypto';import {chromium} from '@playwright/test';
const out='qa/evidence/medium-rim-predecessor';fs.mkdirSync(out,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const report={date:new Date().toISOString(),controls:[],captures:[],sourceHashes:Object.fromEntries(['src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts','src/scenes/medium-bvh-forest.ts'].map(p=>[p,sha(fs.readFileSync(p))]))};
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:192,height:240},deviceScaleFactor:1});
await context.addInitScript(()=>{window.__nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
let targets=null;
await context.route(/bvh-wavefront-transport\.glsl\.ts(?:\?.*)?$/,async route=>{
 const response=await route.fetch();let body=await response.text();
 if(targets){
  const condition=targets.map(t=>`(pixel==ivec2(${t.pixel.x},${t.pixel.yFromBottom})&&sum.a==${t.samplesCompleted}.&&throughput.a==${t.boundaryDepth}.)`).join('||').replaceAll('pixel==ivec2','all(equal(pixel,ivec2').replaceAll(')&&sum.a',')))&&sum.a');
  body=body.replace('vec3 p=origin.xyz,d=direction.xyz;','vec3 p=origin.xyz,d=direction.xyz;float queryIncomingMedium=origin.a;');
  const trap=`throughput.a+=1.;\nif(${condition}){nextOrigin=vec4(p,queryIncomingMedium);nextDirection=vec4(d,-1.);nextThroughput=vec4(point,side*float(indices.x+1u));nextSum=vec4(n,previousBoundary);return;}`;
  if(!body.includes('throughput.a+=1.;'))throw Error('Shader marker changed');body=body.replace('throughput.a+=1.;',trap);
 }
 await route.fulfill({response,body});
});
await context.route(/bvh-wavefront-prototype\.ts(?:\?.*)?$/,async route=>{
 const response=await route.fetch(),body=await response.text();
 await route.fulfill({response,body:body+`\nwindow.__rimTest={reset(){resetState=true;},step(){frame();},orbit(a){camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),a);controls.update();resetState=true;},read(){const raw=[],v=new Float32Array(size.x*size.y*4);for(let a=0;a<4;a++){renderer.readRenderTargetPixels(stateTargets[sourceIndex],0,0,size.x,size.y,v,undefined,a);const b=new Uint8Array(v.buffer);let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));raw.push(btoa(s));}return {raw,contextLost:renderer.getContext().isContextLost(),glError:renderer.getContext().getError(),camera:camera.position.toArray(),passes:diagnostics.passes};}};`});
});
async function open(url){const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('http://127.0.0.1:5173'+url);await page.waitForFunction(()=>window.__rimTest&&window.wavefrontQA?.ready,{timeout:120000});return {page,errors};}
async function run(page,n){await page.evaluate(async n=>{window.__rimTest.reset();for(let i=0;i<n;i++){await new Promise(r=>window.__nativeRAF(r));window.__rimTest.step();}},n);const {raw,...state}=await page.evaluate(()=>window.__rimTest.read());return {buffers:raw.map(x=>Buffer.from(x,'base64')),state};}
try{
 for(const [name,flag] of [['default-control',''],['packed-full-control','&mediumBvh=full']]){
  const {page,errors}=await open('/bvh-wavefront-prototype.html?assetCandidate=v012'+flag),{buffers,state}=await run(page,64),diff=[];
  buffers.forEach((b,i)=>{fs.writeFileSync(`${out}/${name}-${i}.bin`,b);const old=fs.readFileSync(`qa/evidence/medium-bvh-gpu/baseline-state-${i}.bin`);let changed=0,numericChanged=0,maxDelta=0,nonFinite=0;const examples=[];for(let n=0;n<b.length;n+=4){const a=old.readFloatLE(n),v=b.readFloatLE(n);if(!Number.isFinite(v))nonFinite++;if(old.readUInt32LE(n)!==b.readUInt32LE(n)){changed++;if(a!==v)numericChanged++;maxDelta=Math.max(maxDelta,Math.abs(a-v));if(examples.length<4)examples.push({index:n/4,a,v});}}diff.push({attachment:i,changed,numericChanged,maxDelta,nonFinite,examples});});
  report.controls.push({name,count:64,state,errors,diff});console.log(JSON.stringify({name,diff,errors}));await page.close();
 }
 for(const name of ['hero','left']){
  const original=JSON.parse(fs.readFileSync(`qa/evidence/medium-bvh-traps/${name}-analysis.json`)),history=JSON.parse(fs.readFileSync(`qa/evidence/medium-bvh-history/${name}.json`)),keys=new Set(original.events.filter(e=>!e.full.inRestrictedTree).map(e=>JSON.stringify(e.pixel)));
  targets=history.traps.events.filter(e=>keys.has(JSON.stringify(e.pixel)));
  const {page,errors}=await open('/bvh-wavefront-prototype.html?assetCandidate=v012&mediumBvh=history');if(name==='left')await page.evaluate(()=>window.__rimTest.orbit(-.6));
  const {buffers,state}=await run(page,name==='hero'?64:32);buffers.forEach((b,i)=>fs.writeFileSync(`${out}/${name}-${i}.bin`,b));
  const events=targets.map(t=>{const i=(t.pixel.yFromBottom*192+t.pixel.x)*16,values=buffers.map(b=>[0,1,2,3].map(n=>b.readFloatLE(i+n*4))),id=values[2][3],marker=values[3][3];return {target:t,values,incomingOrigin:values[0].slice(0,3),incomingMedium:values[0][3],incomingDirection:values[1].slice(0,3),frozen:values[1][3]===-1,unshiftedHit:values[2].slice(0,3),triangle:(Math.abs(id)-1)/3,side:Math.sign(id),normal:values[3].slice(0,3),previousMarker:marker,branch:(marker&2)?'reflection':'transmission'};});
  report.captures.push({name,count:name==='hero'?64:32,state,errors,events});console.log(JSON.stringify({name,events,errors}));await page.close();
 }
}finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
