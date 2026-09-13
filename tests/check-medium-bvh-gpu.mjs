// Bounded correctness diagnostic. gl.finish timings are synchronized CPU+GPU
// completion durations, not an isolated GPU benchmark or production FPS claim.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';

const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:5173';
const out='qa/evidence/medium-bvh-gpu';fs.mkdirSync(out,{recursive:true});
const width=192,height=240,passes=64;
const sources=['src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts','src/scenes/medium-bvh-forest.ts','qa/baselines/medium-bvh-before/bvh-wavefront-prototype.ts','qa/baselines/medium-bvh-before/bvh-wavefront-transport.glsl.ts','public/models/candidates/v012/negroni-express-interfaces-air-gap.glb'];
const sha=data=>createHash('sha256').update(data).digest('hex');
const report={date:new Date().toISOString(),settings:{width,height,dpr:1,passes,interfacesPerPass:2},hashes:Object.fromEntries(sources.map(p=>[p,sha(fs.readFileSync(p))])),cases:[],comparisons:[],limitations:'Small fixed-resolution/pass correctness workload. gl.finish serializes each measured pass; durations include CPU submission and GPU completion, exclude RAF waiting, and establish no production FPS or general GPU speedup. Finite samples do not prove all-ray containment or reference fidelity.'};
const hook=`
window.__forestTest={
 reset(){resetState=true;},
 step(){const start=performance.now();frame();renderer.getContext().finish();return performance.now()-start;},
 orbit(angle){camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),angle);controls.update();resetState=true;},
 sample(){
  const gl=renderer.getContext(),target=stateTargets[sourceIndex],arrays=[];
  for(let attachment=0;attachment<4;attachment++){
   const value=new Float32Array(size.x*size.y*4);renderer.readRenderTargetPixels(target,0,0,size.x,size.y,value,undefined,attachment);arrays.push(value);
  }
  const encode=value=>{const bytes=new Uint8Array(value.buffer);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));return btoa(s);};
  const state=arrays.map(a=>{let nonFinite=0,min=Infinity,max=-Infinity;for(const v of a){if(!Number.isFinite(v))nonFinite++;else{min=Math.min(min,v);max=Math.max(max,v);}}return {nonFinite,min,max};});
  let completed=0,minSamples=Infinity,maxSamples=0;for(let i=3;i<arrays[3].length;i+=4){const n=arrays[3][i];completed+=n;minSamples=Math.min(minSamples,n);maxSamples=Math.max(maxSamples,n);}
  const programs=renderer.info.programs.map(p=>{
   const shaders=gl.getAttachedShaders(p.program)||[];
   const transport=shaders.some(s=>(gl.getShaderSource(s)||'').includes('uniform sampler2D originState'));
   const uniforms=[];for(let i=0;i<gl.getProgramParameter(p.program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(p.program,i);uniforms.push({name:u.name,type:u.type,size:u.size});}
   const samplers=uniforms.filter(u=>[gl.SAMPLER_2D,gl.UNSIGNED_INT_SAMPLER_2D,gl.INT_SAMPLER_2D,gl.SAMPLER_CUBE].includes(u.type));
   return {transport,linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),log:gl.getProgramInfoLog(p.program),samplers,samplerCount:samplers.reduce((n,u)=>n+u.size,0)};
  });
  const dbg=gl.getExtension('WEBGL_debug_renderer_info');
  return {raw:arrays.map(encode),image:renderer.domElement.toDataURL('image/png').split(',')[1],state,completed,minSamples,maxSamples,programs,
   device:{renderer:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),version:gl.getParameter(gl.VERSION),fragmentSamplers:gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),timerQuery:!!gl.getExtension('EXT_disjoint_timer_query_webgl2')},
   glError:gl.getError(),contextLost:gl.isContextLost(),camera:camera.position.toArray(),cameraWorld:camera.matrixWorld.toArray(),inverseProjection:camera.projectionMatrixInverse.toArray(),
   passes:diagnostics.passes,metadata:diagnostics.mediumBvh??null,audit:diagnostics.sampleTraversalAudit?.()??null};
 }
};
`;
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});
await context.addInitScript(()=>{
 const nativeRAF=requestAnimationFrame.bind(window);window.__nativeRAF=nativeRAF;
 window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};
});
await context.route(/bvh-wavefront-prototype\.ts(?:\?.*)?$/,async route=>{
 const response=await route.fetch();const body=await response.text();
 await route.fulfill({response,body:body+'\n'+hook});
});

async function openCase(url,{alterHash=false}={}){
 const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
 page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});
 if(alterHash)await page.route('**/models/candidates/v012/negroni-express-interfaces-air-gap.glb',async route=>{
  const bytes=Buffer.from(fs.readFileSync(sources.at(-1))),jsonEnd=20+bytes.readUInt32LE(12);
  if(bytes[jsonEnd-1]!==32)throw new Error('Expected GLB JSON padding');bytes[jsonEnd-1]=10;
  await route.fulfill({status:200,contentType:'model/gltf-binary',body:bytes});
 });
 await page.goto(origin+url,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.__forestTest&&window.wavefrontQA?.ready,{timeout:120000});
 return {page,errors};
}
async function capture(page,name,errors,count=passes){
 const timeStart=Date.now();
 const timings=await page.evaluate(async count=>{
  window.__forestTest.reset();const times=[];
  for(let i=0;i<count;i++){await new Promise(resolve=>window.__nativeRAF(resolve));times.push(window.__forestTest.step());}
  return times;
 },count);
 const sample=await page.evaluate(()=>window.__forestTest.sample());
 const {raw,image,...data}=sample;
 const buffers=raw.map(x=>Buffer.from(x,'base64'));
 for(let i=0;i<buffers.length;i++)fs.writeFileSync(`${out}/${name}-state-${i}.bin`,buffers[i]);
 fs.writeFileSync(`${out}/${name}.png`,Buffer.from(image,'base64'));
 const sorted=timings.slice().sort((a,b)=>a-b),timing={durationsMs:timings,medianMs:sorted[Math.floor(sorted.length/2)],p90Ms:sorted[Math.floor(sorted.length*.9)],totalSynchronizedMs:timings.reduce((a,b)=>a+b,0),wallMs:Date.now()-timeStart,method:'Per pass wall time around frame() plus gl.finish(); CPU+GPU completion, excludes native RAF wait; includes display draw.'};
 const row={name,count,...data,stateSha256:buffers.map(sha),imageSha256:sha(Buffer.from(image,'base64')),timing,errors:errors.slice()};
 report.cases.push(row);fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({name,completed:row.completed,audit:row.audit,errors:row.errors,glError:row.glError,contextLost:row.contextLost,transportProgram:row.programs.find(p=>p.transport),medianMs:timing.medianMs}));
 return row;
}
function compare(before,after,{ignoreAudit=false}={}){
 const channels=[];
 for(let attachment=0;attachment<4;attachment++){
  const a=fs.readFileSync(`${out}/${before}-state-${attachment}.bin`),b=fs.readFileSync(`${out}/${after}-state-${attachment}.bin`);
  let changed=0,maxDelta=0,nonFinite=0;const examples=[];
  for(let i=0;i<a.byteLength;i+=4){if(ignoreAudit&&attachment===1&&(i/4)%4===3)continue;
   const av=a.readFloatLE(i),bv=b.readFloatLE(i);if(!Number.isFinite(av)||!Number.isFinite(bv))nonFinite++;
   if(!Object.is(av,bv)){changed++;const delta=Math.abs(av-bv);maxDelta=Math.max(maxDelta,delta);if(examples.length<4)examples.push({floatIndex:i/4,before:av,after:bv});}
  }
  channels.push({attachment,changed,maxDelta,nonFinite,examples});
 }
 const result={before,after,ignoreAudit,channels,pngExact:sha(fs.readFileSync(`${out}/${before}.png`))===sha(fs.readFileSync(`${out}/${after}.png`))};
 report.comparisons.push(result);console.log(JSON.stringify({comparison:result}));
}
try{
 const baseline=await openCase('/qa/baselines/medium-bvh-before/index.html?assetCandidate=v012');
 await capture(baseline.page,'baseline',baseline.errors);await baseline.page.close();
 const current=await openCase('/bvh-wavefront-prototype.html?assetCandidate=v012');
 await capture(current.page,'default',current.errors);await current.page.close();compare('baseline','default');
 const packed=await openCase('/bvh-wavefront-prototype.html?assetCandidate=v012&mediumBvh=full');
 await capture(packed.page,'packed-full',packed.errors);compare('baseline','packed-full');
 await packed.page.evaluate(()=>window.wavefrontQA.setBvhMode('verify'));
 await capture(packed.page,'verify',packed.errors);compare('packed-full','verify',{ignoreAudit:true});
 await packed.page.evaluate(()=>window.wavefrontQA.setBvhMode('medium'));
 await capture(packed.page,'medium',packed.errors);compare('packed-full','medium');
 for(const [name,angle] of [['orbit-left',-.6],['orbit-right',1.2]]){
  await packed.page.evaluate(angle=>{window.__forestTest.orbit(angle);window.wavefrontQA.setBvhMode('full');},angle);
  await capture(packed.page,`${name}-full`,packed.errors,32);
  await packed.page.evaluate(()=>window.wavefrontQA.setBvhMode('verify'));
  await capture(packed.page,`${name}-verify`,packed.errors,32);compare(`${name}-full`,`${name}-verify`,{ignoreAudit:true});
 }
 await packed.page.close();
 const emitter=await openCase('/bvh-wavefront-prototype.html?assetCandidate=v012&emitters=1&mediumBvh=full');
 await capture(emitter.page,'emitter-full',emitter.errors,32);
 await emitter.page.evaluate(()=>window.wavefrontQA.setBvhMode('verify'));
 await capture(emitter.page,'emitter-verify',emitter.errors,32);compare('emitter-full','emitter-verify',{ignoreAudit:true});
 await emitter.page.close();
 const badCandidate=await openCase('/bvh-wavefront-prototype.html?mediumBvh=1');
 await capture(badCandidate.page,'rejected-candidate',badCandidate.errors,2);await badCandidate.page.close();
 const badHash=await openCase('/bvh-wavefront-prototype.html?assetCandidate=v012&mediumBvh=1',{alterHash:true});
 await capture(badHash.page,'rejected-hash',badHash.errors,2);await badHash.page.close();
}catch(error){report.failure=String(error);throw error;}
finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2)+'\n');await browser.close();}
