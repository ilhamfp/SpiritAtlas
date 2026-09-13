// Small, explicitly scheduled GPU diagnostic. Run only with the shared GPU slot.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:5173';
const mode=process.env.ATLAS_TRAP_HISTORY==='1'?'history':'trap';
const out=mode==='history'?'qa/evidence/medium-bvh-history':'qa/evidence/medium-bvh-traps';fs.mkdirSync(out,{recursive:true});
const sha=x=>createHash('sha256').update(x).digest('hex');
const files=['src/scenes/medium-bvh-forest.ts','src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts','public/models/candidates/v012/negroni-express-interfaces-air-gap.glb'];
const hashes=Object.fromEntries(files.map(p=>[p,sha(fs.readFileSync(p))]));
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:192,height:240},deviceScaleFactor:1});
await context.addInitScript(()=>{window.__nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
await context.route(/bvh-wavefront-prototype\.ts(?:\?.*)?$/,async route=>{
 const response=await route.fetch(),body=await response.text();
 await route.fulfill({response,body:body+`\nwindow.__trapTest={
  reset(){resetState=true;},step(){frame();},
  orbit(angle){camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),angle);controls.update();resetState=true;},
  snapshot(){
   const gl=renderer.getContext(),values=new Float32Array(size.x*size.y*4),raw=[];let nonFinite=0;
   for(let a=0;a<4;a++){renderer.readRenderTargetPixels(stateTargets[sourceIndex],0,0,size.x,size.y,values,undefined,a);for(const v of values)if(!Number.isFinite(v))nonFinite++;
    const bytes=new Uint8Array(values.buffer);let s='';for(let i=0;i<bytes.length;i+=16384)s+=String.fromCharCode(...bytes.subarray(i,i+16384));raw.push(btoa(s));}
   return {raw,nonFinite,glError:gl.getError(),contextLost:gl.isContextLost(),camera:camera.position.toArray(),passes:diagnostics.passes,metadata:diagnostics.mediumBvh};
  }
 };`});
});
async function advance(page,n){await page.evaluate(async n=>{for(let i=0;i<n;i++){await new Promise(resolve=>window.__nativeRAF(resolve));window.__trapTest.step();}},n);}
async function save(page,name,traceEmitters,passes,errors){
 await page.evaluate(mode=>{window.wavefrontQA.setBvhMode(mode);window.__trapTest.reset();},mode);
 await advance(page,passes);
 const traps=await page.evaluate(()=>window.wavefrontQA.sampleMismatchTraps(4096));
 const {raw,...state}=await page.evaluate(()=>window.__trapTest.snapshot());
 const report={date:new Date().toISOString(),name,mode,hashes,traceEmitters,settings:{width:192,height:240,dpr:1,passes,interfacesPerPass:2},traps,state,errors:errors.slice()};
 raw.forEach((x,i)=>fs.writeFileSync(`${out}/${name}-state-${i}.bin`,Buffer.from(x,'base64')));
 fs.writeFileSync(`${out}/${name}.json`,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({name,traps:traps.trappedPixels,nonFinite:state.nonFinite,errors,glError:state.glError,contextLost:state.contextLost}));
 return report;
}
try{
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto(origin+'/bvh-wavefront-prototype.html?assetCandidate=v012&mediumBvh='+mode);
 await page.waitForFunction(()=>window.__trapTest&&window.wavefrontQA?.ready,{timeout:120000});
 const hero=await save(page,'hero',false,64,errors);
 await advance(page,8);
 const later=await page.evaluate(()=>window.wavefrontQA.sampleMismatchTraps(4096));
 const beforeMap=new Map(hero.traps.events.map(e=>[JSON.stringify(e.pixel),JSON.stringify(e)]));
 const retained=later.events.filter(e=>beforeMap.has(JSON.stringify(e.pixel)));
 const frozenExact=retained.length===beforeMap.size&&retained.every(e=>beforeMap.get(JSON.stringify(e.pixel))===JSON.stringify(e));
 await page.evaluate(()=>window.wavefrontQA.setBvhMode('full'));await advance(page,64);
 const restored=await page.evaluate(()=>window.__trapTest.snapshot());
 const resetParity=restored.raw.map((x,i)=>{const bytes=Buffer.from(x,'base64');return {attachment:i,exact:bytes.equals(fs.readFileSync(`qa/evidence/medium-bvh-gpu/packed-full-state-${i}.bin`))};});
 fs.writeFileSync(`${out}/lifecycle.json`,JSON.stringify({frozenExact,originalTraps:hero.traps.trappedPixels,laterTraps:later.trappedPixels,resetParity,errors},null,2)+'\n');
 console.log(JSON.stringify({frozenExact,resetParity}));
 for(const [name,angle] of (mode==='history'?[['left',-.6]]:[['left',-.6],['right',1.2]])){await page.evaluate(a=>window.__trapTest.orbit(a),angle);await save(page,name,false,32,errors);}
 await page.close();
 if(mode==='history')process.exitCode=0;
 else{
 const emitter=await context.newPage(),emitterErrors=[];emitter.on('pageerror',e=>emitterErrors.push(String(e)));emitter.on('console',m=>{if(m.type()==='error')emitterErrors.push(m.text());});
 await emitter.goto(origin+'/bvh-wavefront-prototype.html?assetCandidate=v012&emitters=1&mediumBvh=trap');
 await emitter.waitForFunction(()=>window.__trapTest&&window.wavefrontQA?.ready,{timeout:120000});
 await save(emitter,'emitters',true,32,emitterErrors);await emitter.close();
 }
}finally{await browser.close();}
