// Native, same-stage geometry comparison. The transport remains a known
// incomplete diagnostic. Counts/errors are recorded, not a fidelity verdict.
import fs from 'node:fs';import {createHash} from 'node:crypto';import {chromium} from '@playwright/test';
const out='qa/evidence/contact-runtime-integration';fs.mkdirSync(out,{recursive:true});const sha=b=>createHash('sha256').update(b).digest('hex');
const sources=['src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts','src/scenes/contact-runtime-schema.ts','public/models/candidates/v012-contact/negroni-express-interfaces.glb','public/models/candidates/v012/negroni-express-interfaces-air-gap.glb'];
const report={date:new Date().toISOString(),sourceHashes:Object.fromEntries(sources.map(p=>[p,sha(fs.readFileSync(p))])),runnerSha256:sha(fs.readFileSync(import.meta.filename)),cases:[],limits:'Native720×900,DPR1,600passes,two interfaces per pass,actual authored triangles. Same product stage/absorption and explicit two emitters. Fixed offsets/old epsilon remain an incomplete numerical transport. Finite Monte Carlo counts are not convergence or fidelity acceptance; wall duration is not GPU timing.'};
const hook=`
window.__contactTest={
 reset(){resetState=true;diagnostics.passes=0;},step(){frame();},
 sample(){
  const gl=renderer.getContext(),state=[],raw=[],counts={total:0,min:Infinity,max:0,zero:0},media={};
  for(let attachment=0;attachment<4;attachment++){
   const v=new Float32Array(size.x*size.y*4);renderer.readRenderTargetPixels(stateTargets[sourceIndex],0,0,size.x,size.y,v,undefined,attachment);
   let nonFinite=0,min=Infinity,max=-Infinity;for(const x of v){if(!Number.isFinite(x))nonFinite++;else{min=Math.min(min,x);max=Math.max(max,x);}}
   state.push({attachment,nonFinite,min,max});
   if(attachment===3)for(let i=3;i<v.length;i+=4){counts.total+=v[i];counts.min=Math.min(counts.min,v[i]);counts.max=Math.max(counts.max,v[i]);if(v[i]===0)counts.zero++;}
   if(attachment===0)for(let i=3;i<v.length;i+=4)media[v[i]]=(media[v[i]]||0)+1;
   const b=new Uint8Array(v.buffer);let s='';for(let i=0;i<b.length;i+=16384)s+=String.fromCharCode(...b.subarray(i,i+16384));raw.push(btoa(s));
  }
  const programs=renderer.info.programs.map(p=>{let samplers=0;for(let i=0;i<gl.getProgramParameter(p.program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(p.program,i);if([gl.SAMPLER_2D,gl.UNSIGNED_INT_SAMPLER_2D,gl.INT_SAMPLER_2D,gl.SAMPLER_CUBE].includes(u.type))samplers+=u.size;}return {linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),samplers};});
  return {state,raw,counts,media,programs,glError:gl.getError(),contextLost:gl.isContextLost(),size:size.toArray(),camera:camera.position.toArray(),cameraWorld:camera.matrixWorld.toArray(),inverseProjection:camera.projectionMatrixInverse.toArray(),passes:diagnostics.passes,triangles:diagnostics.triangles,contact:diagnostics.contactGeometry,precision:diagnostics.precisionRepair,medium:diagnostics.mediumBvh,traceEmitters:diagnostics.traceEmitters,absorption:commonUniforms.absorption.value.toArray(),absorptionDistance:commonUniforms.absorptionDistance.value,counterBase:commonUniforms.counterBase.value.toArray(),samplePoints:diagnostics.sampleState(),image:renderer.domElement.toDataURL('image/png').split(',')[1]};
 }
};`;
const browser=await chromium.launch({channel:'chrome',headless:true});
try{
 for(const [name,candidate,width,height,count,extra]of [['contact-smoke','v012-contact',192,240,8,'&mediumBvh=1&precisionRay=1'],['air-gap-native','v012',720,900,600,''],['contact-native','v012-contact',720,900,600,'']]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1});await context.addInitScript(()=>{window.__nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
  await context.route(/bvh-wavefront-prototype\.ts(?:\?.*)?$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\n'+hook});});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://127.0.0.1:5173/bvh-wavefront-prototype.html?assetCandidate='+candidate+'&emitters=1'+extra);await page.waitForFunction(()=>window.__contactTest&&window.wavefrontQA?.ready,{timeout:120000});
  const start=Date.now();await page.evaluate(()=>window.__contactTest.reset());
  for(let offset=0;offset<count;offset+=50){await page.evaluate(async n=>{for(let i=0;i<n;i++){await new Promise(r=>window.__nativeRAF(r));window.__contactTest.step();}},Math.min(50,count-offset));if(offset%150===0)console.log(JSON.stringify({name,passes:Math.min(count,offset+50),wallMs:Date.now()-start}));}
  const {raw,image,...data}=await page.evaluate(()=>window.__contactTest.sample());const buffers=raw.map(x=>Buffer.from(x,'base64')),imageBytes=Buffer.from(image,'base64');
  fs.writeFileSync(out+'/'+name+'.png',imageBytes);const row={name,candidate,count,wallMs:Date.now()-start,...data,stateSha256:buffers.map(sha),imageSha256:sha(imageBytes),errors};
  report.cases.push(row);fs.writeFileSync(out+'/gpu.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({name,counts:row.counts,errors,state:row.state,glError:row.glError,contextLost:row.contextLost}));await context.close();
  if(errors.length||data.glError||data.contextLost||data.state.some(s=>s.nonFinite))throw Error('Contact capture has invalid GPU state');
 }
}catch(error){report.failure=String(error);throw error;}finally{fs.writeFileSync(out+'/gpu.json',JSON.stringify(report,null,2)+'\n');await browser.close();}
