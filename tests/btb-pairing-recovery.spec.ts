import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';

// Synthetic transport fixtures exercise browser recovery only, never physical-device acceptance.
const FIRST_KEY='x'.repeat(43),SECOND_KEY='y'.repeat(43),STORAGE_KEY='spiritatlas.motion-pairing.v1';
type FixtureOptions={expires?:number;blockedStorage?:boolean;status?:number;statuses?:number[]};

async function mockMotion(page:Page,options:FixtureOptions={}){
 const expires=options.expires??Date.now()+600000;
 // Any accidental real loopback request is blocked even if the fetch fixture regresses.
 await page.route('http://127.0.0.1:19876/**',route=>route.abort());
 await page.addInitScript(({expires,blockedStorage,status,statuses,first,second})=>{
  if(blockedStorage)Object.defineProperty(window,'sessionStorage',{get(){throw new DOMException('Storage blocked by fixture','SecurityError');}});
  const fixture={requests:[] as string[],aborted:0};
  (window as any).__pairingFixture=fixture;
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(input,init)=>{
   const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
   if(url!=='http://127.0.0.1:19876/motion')return originalFetch(input,init);
   const key=new Headers(init?.headers).get('Authorization')?.replace(/^Bearer /,'')??'';
   fixture.requests.push(key);
   if(statuses){
    const counterKey='spiritatlas.test.motion-recovery.request-count';
    const requestCount=Number(sessionStorage.getItem(counterKey)||0);
    sessionStorage.setItem(counterKey,String(requestCount+1));
    const responseStatus=statuses[requestCount]??200;
    if(responseStatus!==200)return new Response(null,{status:responseStatus});
   }
   if(status)return new Response(null,{status});
   if(key!==first&&key!==second)return new Response(null,{status:401});
   const signal=init?.signal,encoder=new TextEncoder();let seq=0,ended=false,timer:number;
   return new Response(new ReadableStream<Uint8Array>({
    start(controller){
     const send=()=>{if(ended)return;controller.enqueue(encoder.encode(JSON.stringify({v:1,session:(key===first?'a':'b').repeat(32),seq:++seq,expires,accel:[0,0,-1],gyro:[0,0,0],t:performance.now()/1000,sampleEpoch:Date.now(),unit:'g-deg/s',kind:'native-spu'})+'\n'));};
     timer=window.setInterval(send,16);send();
     signal?.addEventListener('abort',()=>{if(ended)return;ended=true;fixture.aborted++;clearInterval(timer);controller.error(new DOMException('Aborted','AbortError'));},{once:true});
    },
    cancel(){ended=true;clearInterval(timer);},
   }),{headers:{'Content-Type':'application/x-ndjson'}});
  };
 },{expires,blockedStorage:!!options.blockedStorage,status:options.status??0,statuses:options.statuses,first:FIRST_KEY,second:SECOND_KEY});
 return expires;
}

async function connected(page:Page){
 await expect.poll(()=>page.evaluate(()=>!!window.__btbNative?.fresh&&window.__btbNative.received>=60),{timeout:10000}).toBe(true);
 await expect(page.locator('#btb-motion-panel')).toBeVisible();
}
async function armStirring(page:Page){
 const nearGlass=page.locator('.btb-live-motion');
 await nearGlass.getByRole('button',{name:'Calibrate',exact:true}).click();
 await nearGlass.getByRole('button',{name:'Arm stirring',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>window.__btb?.model.armed)).toBe('stir');
}
async function storedPairing(page:Page){return page.evaluate(key=>JSON.parse(sessionStorage.getItem(key)||'null'),STORAGE_KEY);}
async function expectUnpairedReload(page:Page){
 await page.reload();
 await expect(page.getByRole('button',{name:'Enable laptop motion',exact:true})).toBeVisible();
 await expect(page.locator('#btb-motion-panel')).toHaveCount(0);
 expect(await page.evaluate(()=>({native:!!window.__btbNative,requests:(window as any).__pairingFixture.requests}))).toEqual({native:false,requests:[]});
}

test('reload restores explicitly validated pairing with its original expiry, disarmed and uncalibrated',async({page})=>{
 const expires=await mockMotion(page);
 await page.goto(`/behind-the-bar?preset=stir-demo#motion=${FIRST_KEY}`);await connected(page);
 expect(new URL(page.url()).hash).toBe('');
 expect(await storedPairing(page)).toEqual({v:1,token:FIRST_KEY,expires});
 await armStirring(page);
 await page.reload();await connected(page);
 expect(await storedPairing(page)).toEqual({v:1,token:FIRST_KEY,expires});
 expect(await page.evaluate(()=>({requests:(window as any).__pairingFixture.requests,armed:window.__btb?.model.armed,calibrated:window.__btbNative?.calibrated,ready:window.__btbNative?.ready}))).toEqual({requests:[FIRST_KEY],armed:null,calibrated:false,ready:false});
 await expect(page.locator('.btb-live-motion').getByRole('button',{name:'Calibrate',exact:true})).toBeEnabled();
 await expect(page.getByRole('button',{name:'Arm spoon stirring',exact:true})).toBeDisabled();
});

test('expired validated pairing is not restored after a tab reload',async({page})=>{
 const expires=await mockMotion(page);
 await page.goto(`/behind-the-bar?preset=stir-demo#motion=${FIRST_KEY}`);await connected(page);await armStirring(page);
 // Advance only this test page's wall clock; no native process or system clock is touched.
 await page.clock.setSystemTime(expires+1);
 await expect(page.locator('.btb-live-motion').getByRole('status')).toHaveText('Session expired. Restart the helper and pair again.');
 expect(await page.evaluate(()=>({connected:window.__btbNative?.connected,armed:window.__btb?.model.armed}))).toEqual({connected:false,armed:null});
 await expectUnpairedReload(page);expect(await storedPairing(page)).toBeNull();
});

test('Disconnect forgets the validated pairing and reload stays unpaired',async({page})=>{
 await mockMotion(page);await page.goto(`/behind-the-bar?preset=stir-demo#motion=${FIRST_KEY}`);await connected(page);await armStirring(page);
 await page.getByRole('button',{name:'Disconnect',exact:true}).click();
 await expect(page.locator('.btb-live-motion').getByRole('status')).toHaveText('Disconnected');
 expect(await storedPairing(page)).toBeNull();
 expect(await page.evaluate(()=>({armed:window.__btb?.model.armed,aborted:(window as any).__pairingFixture.aborted}))).toEqual({armed:null,aborted:1});
 await expectUnpairedReload(page);expect(await storedPairing(page)).toBeNull();
});

test('pairing hash changes open a bare studio and replace an already mounted connection',async({page})=>{
 const expires=await mockMotion(page);await page.goto('/behind-the-bar?preset=stir-demo');
 await expect(page.getByRole('button',{name:'Enable laptop motion',exact:true})).toBeVisible();
 expect(await page.evaluate(()=>!!window.__btbNative)).toBe(false);
 await page.evaluate(key=>{location.hash=`motion=${key}&keep=fixture`;},FIRST_KEY);await connected(page);await armStirring(page);
 expect(new URL(page.url()).hash).toBe('#keep=fixture');
 await page.evaluate(key=>{location.hash=`motion=${key}&keep=fixture`;},SECOND_KEY);
 await expect.poll(()=>page.evaluate(()=>window.__btbNative?.session)).toBe('b'.repeat(32));await connected(page);
 expect(new URL(page.url()).hash).toBe('#keep=fixture');
 expect(await storedPairing(page)).toEqual({v:1,token:SECOND_KEY,expires});
 expect(await page.evaluate(()=>({requests:(window as any).__pairingFixture.requests,aborted:(window as any).__pairingFixture.aborted,armed:window.__btb?.model.armed,calibrated:window.__btbNative?.calibrated}))).toEqual({requests:[FIRST_KEY,SECOND_KEY],aborted:1,armed:null,calibrated:false});
});

test('blocked sessionStorage permits current-page pairing and does not pretend to persist it',async({page})=>{
 await mockMotion(page,{blockedStorage:true});await page.goto(`/behind-the-bar?preset=stir-demo#motion=${FIRST_KEY}`);await connected(page);await armStirring(page);
 expect(await page.evaluate(()=>{try{sessionStorage.getItem('anything');return false;}catch{return true;}})).toBe(true);
 expect(await page.evaluate(()=>window.__btbNative?.fresh)).toBe(true);expect(new URL(page.url()).hash).toBe('');
 await expectUnpairedReload(page);
});

test('another browser owning the pairing is explained beside the canvas',async({page})=>{
 await mockMotion(page,{status:409});await page.goto(`/behind-the-bar?preset=stir-demo#motion=${FIRST_KEY}`);
 const nearGlass=page.locator('.btb-live-motion');
 await expect(nearGlass.getByRole('status')).toHaveText('Another browser owns this session. Disconnect it first.');
 await expect(nearGlass.getByRole('button',{name:'Pair laptop',exact:true})).toBeVisible();
 expect(await storedPairing(page)).toBeNull();
 expect(await page.evaluate(()=>({requests:(window as any).__pairingFixture.requests,connected:window.__btbNative?.connected,armed:window.__btb?.model.armed}))).toEqual({requests:[FIRST_KEY],connected:false,armed:null});
});

test('a failed restore preserves validated pairing for recovery on the next reload',async({page})=>{
 const expires=await mockMotion(page,{statuses:[200,503,200]});
 await page.goto(`/behind-the-bar?preset=stir-demo#motion=${FIRST_KEY}`);await connected(page);await armStirring(page);
 await page.reload();
 await expect(page.locator('.btb-live-motion').getByRole('status')).toHaveText('Connection failed (503).');
 expect(await storedPairing(page)).toEqual({v:1,token:FIRST_KEY,expires});
 expect(await page.evaluate(()=>({requests:(window as any).__pairingFixture.requests,connected:window.__btbNative?.connected,armed:window.__btb?.model.armed}))).toEqual({requests:[FIRST_KEY],connected:false,armed:null});
 await page.reload();await connected(page);
 expect(await storedPairing(page)).toEqual({v:1,token:FIRST_KEY,expires});
 expect(await page.evaluate(()=>({requests:(window as any).__pairingFixture.requests,armed:window.__btb?.model.armed,calibrated:window.__btbNative?.calibrated}))).toEqual({requests:[FIRST_KEY],armed:null,calibrated:false});
});

test('401 forgets only the matching saved credential and does not restore it again',async({page})=>{
 const expires=await mockMotion(page,{statuses:[200,401,401]});
 await page.goto(`/behind-the-bar?preset=stir-demo#motion=${FIRST_KEY}`);await connected(page);
 // An invalid replacement must not erase the previously validated key.
 await page.evaluate(key=>{location.hash=`motion=${key}`;},SECOND_KEY);
 await expect(page.locator('.btb-live-motion').getByRole('status')).toHaveText('Pairing expired or not authorized. Open the helper’s pairing page.');
 expect(await storedPairing(page)).toEqual({v:1,token:FIRST_KEY,expires});
 await page.reload();
 await expect(page.locator('.btb-live-motion').getByRole('status')).toHaveText('Pairing expired or not authorized. Open the helper’s pairing page.');
 expect(await storedPairing(page)).toBeNull();
 expect(await page.evaluate(()=>({requests:(window as any).__pairingFixture.requests,connected:window.__btbNative?.connected,armed:window.__btb?.model.armed}))).toEqual({requests:[FIRST_KEY],connected:false,armed:null});
 await expectUnpairedReload(page);
});
