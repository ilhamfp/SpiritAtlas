import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync} from 'node:fs';
import path from 'node:path';

// Synthetic sensor transport verifies browser behavior, never physical MacBook acceptance.
const PAIRING_KEY='g'.repeat(43);
const evidence=path.resolve('docs/behind-the-bar/evidence/motion-recovery');
type Ingredient='core'|'ancho'|'rice';

async function syntheticMotion(page:Page){
 await page.route('http://127.0.0.1:19876/**',route=>route.abort());
 await page.addInitScript(({key,expires})=>{
  const fixture={pitch:0,gyro:[0,0,0],requests:0,aborted:0};
  (window as any).__guidedPourFixture=fixture;
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
   const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
   if(url!=='http://127.0.0.1:19876/motion')return originalFetch(input,init);
   fixture.requests++;
   if(new Headers(init?.headers).get('Authorization')!==`Bearer ${key}`)return new Response(null,{status:401});
   const encoder=new TextEncoder();let seq=0,ended=false,timer:number;
   return new Response(new ReadableStream<Uint8Array>({
    start(controller){
     const send=()=>{if(ended)return;controller.enqueue(encoder.encode(JSON.stringify({v:1,session:'c'.repeat(32),seq:++seq,expires,accel:[0,Math.sin(fixture.pitch),-Math.cos(fixture.pitch)],gyro:fixture.gyro,t:performance.now()/1000,sampleEpoch:Date.now(),unit:'g-deg/s',kind:'native-spu'})+'\n'));};
     timer=window.setInterval(send,16);send();
     init?.signal?.addEventListener('abort',()=>{if(ended)return;ended=true;fixture.aborted++;clearInterval(timer);controller.error(new DOMException('Aborted','AbortError'));},{once:true});
    },
    cancel(){ended=true;clearInterval(timer);},
   }),{headers:{'Content-Type':'application/x-ndjson'}});
  };
 },{key:PAIRING_KEY,expires:Date.now()+600000});
}

async function fixtureMotion(page:Page,pitch:number,gyro=[0,0,0]){
 await page.evaluate(({pitch,gyro})=>{Object.assign((window as any).__guidedPourFixture,{pitch,gyro});},{pitch,gyro});
}
async function state(page:Page){return page.evaluate(()=>window.__btb!.model.snapshot());}
async function expectConnectionRetained(page:Page){
 await expect.poll(()=>page.evaluate(()=>({fresh:window.__btbNative?.fresh,calibrated:window.__btbNative?.calibrated,requests:(window as any).__guidedPourFixture.requests,aborted:(window as any).__guidedPourFixture.aborted}))).toEqual({fresh:true,calibrated:true,requests:1,aborted:0});
}
async function returnNeutral(page:Page){
 await fixtureMotion(page,0);
 await expect.poll(()=>page.evaluate(()=>Math.max(Math.abs(window.__btbNative!.pitch-window.__btbNative!.neutral[0]),Math.abs(window.__btbNative!.roll-window.__btbNative!.neutral[1]))),{timeout:10000}).toBeLessThan(.025);
}
async function freshPairedMix(page:Page){
 await syntheticMotion(page);await page.goto('/behind-the-bar');
 await page.getByRole('button',{name:'Add mixing ice',exact:true}).click();
 await expect(page.getByRole('checkbox',{name:'Equal parts'})).toBeChecked();
 await page.getByRole('button',{name:'Connect laptop for pouring',exact:true}).click();
 const panel=page.locator('#btb-motion-panel');
 await panel.getByText('Pair manually',{exact:true}).click();
 await panel.getByLabel('Temporary pairing key',{exact:true}).fill(PAIRING_KEY);
 await panel.getByRole('button',{name:'Connect helper',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__btbNative?.received??0),{timeout:10000}).toBeGreaterThanOrEqual(60);
 await page.locator('.btb-laptop-step').getByRole('button',{name:'Calibrate laptop at rest',exact:true}).click();
 await expectConnectionRetained(page);
}

test('three equal laptop pours retain the connection through stirring and partial straining',async({page})=>{
 await freshPairedMix(page);
 const controls=page.getByRole('region',{name:'Preparation controls',exact:true});
 const primary=controls.locator('.btb-laptop-step');
 const ingredients:[Ingredient,string][]=[['core','Core blend'],['ancho','Ancho Verde'],['rice','Rice syrup']];
 for(const [ingredient,label] of ingredients){
  await returnNeutral(page);
  await controls.getByRole('button',{name:new RegExp(`^${label}`)}).click();
  await primary.getByRole('button',{name:`Pour ${label} with laptop`,exact:true}).click();
  await expect.poll(async()=>(await state(page)).armed).toBe('pour');
  await fixtureMotion(page,.24);
  await expect.poll(()=>page.evaluate(c=>window.__btb!.model.mix[c],ingredient),{timeout:15000}).toBeCloseTo(.3,7);
  await expect.poll(async()=>({armed:(await state(page)).armed,transit:(await state(page)).transit.length})).toEqual({armed:null,transit:0});
  await expect(primary.getByRole('button',{name:'One part poured',exact:true})).toBeDisabled();
  // Continue the same held-tilt packets past the cap: no implicit rearm or extra liquid.
  const receipt=await page.evaluate(()=>window.__btbNative!.received);
  await expect.poll(()=>page.evaluate(()=>window.__btbNative!.received)).toBeGreaterThan(receipt+35);
  expect((await state(page)).mix[ingredient]).toBeCloseTo(.3,7);
  expect((await state(page)).armed).toBeNull();
  await expectConnectionRetained(page);
 }
 await returnNeutral(page);
 const filled=await state(page);
 for(const ingredient of ['core','ancho','rice'] as const){expect(filled.mix[ingredient]).toBeCloseTo(.3,7);expect(Math.abs(filled.conservation[ingredient])).toBeLessThan(1e-8);}
 await controls.getByRole('button',{name:'Stir',exact:true}).click();
 await expectConnectionRetained(page);expect((await state(page)).armed).toBeNull();
 await primary.getByRole('button',{name:'Start laptop stirring',exact:true}).click();
 await fixtureMotion(page,0,[0,18,0]);
 await expect.poll(async()=>(await state(page)).effectiveStir,{timeout:10000}).toBeGreaterThan(.25);
 await returnNeutral(page);
 await controls.getByRole('button',{name:'Strain',exact:true}).click();
 await expectConnectionRetained(page);expect((await state(page)).armed).toBeNull();
 await primary.getByRole('button',{name:'Start laptop pour',exact:true}).click();
 await fixtureMotion(page,.24);
 await expect.poll(async()=>{const s=await state(page);return s.serving.core+s.serving.ancho+s.serving.rice;},{timeout:10000}).toBeGreaterThan(.06);
 await returnNeutral(page);
 await expect.poll(async()=>({tilt:(await state(page)).pourTilt,transit:(await state(page)).transit.length})).toEqual({tilt:0,transit:0});
 const paused=await state(page),served=paused.serving.core+paused.serving.ancho+paused.serving.rice;
 expect(served).toBeGreaterThan(.06);expect(served).toBeLessThan(.6);
 const receipt=await page.evaluate(()=>window.__btbNative!.received);
 await expect.poll(()=>page.evaluate(()=>window.__btbNative!.received)).toBeGreaterThan(receipt+35);
 const afterPause=await state(page);
 for(const ingredient of ['core','ancho','rice'] as const){expect(afterPause.serving[ingredient]).toBeCloseTo(paused.serving[ingredient],8);expect(Math.abs(afterPause.conservation[ingredient])).toBeLessThan(1e-8);}
 await expectConnectionRetained(page);
 mkdirSync(evidence,{recursive:true});await page.screenshot({path:path.join(evidence,'guided-laptop-pour-desktop.png'),fullPage:true});
});

test('guided laptop-pour controls fit a 390px viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await freshPairedMix(page);
 const primary=page.locator('.btb-laptop-step').getByRole('button',{name:'Pour Core blend with laptop',exact:true});
 await expect(primary).toBeVisible();await expect(primary).toBeEnabled();
 await expect(page.getByRole('checkbox',{name:'Equal parts'})).toBeChecked();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth)).toBeLessThanOrEqual(1);
 const bounds=await primary.boundingBox();expect(bounds).not.toBeNull();expect(bounds!.x).toBeGreaterThanOrEqual(0);expect(bounds!.x+bounds!.width).toBeLessThanOrEqual(391);
 mkdirSync(evidence,{recursive:true});await page.screenshot({path:path.join(evidence,'guided-laptop-pour-mobile.png'),fullPage:true});
});
