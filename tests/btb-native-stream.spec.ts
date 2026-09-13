import {test,expect} from '@playwright/test';
import {mock} from 'node:test';
import {NativeMotion} from '../src/behind-the-bar/native';
import {Preparation} from '../src/behind-the-bar/model';

// Deterministic transport fixtures only; these do not establish physical-device acceptance.
const originalFetch=globalThis.fetch;
let motion:NativeMotion;
test.beforeEach(()=>{
 Object.assign(globalThis,{window:new EventTarget(),document:Object.assign(new EventTarget(),{hidden:false,hasFocus:()=>true})});
 motion=new NativeMotion(new Preparation('stir-demo'));
});
test.afterEach(()=>{motion.dispose();mock.timers.reset();mock.restoreAll();globalThis.fetch=originalFetch;Reflect.deleteProperty(globalThis,'window');Reflect.deleteProperty(globalThis,'document');});
function clock(){
 let now=performance.now();mock.method(performance,'now',()=>now);mock.timers.enable({apis:['setInterval','Date'],now:Date.now()});
 return {advance(ms:number){now+=ms;mock.timers.tick(ms);}};
}
function stream(holdHeaders=false){
 let controller!:ReadableStreamDefaultController<Uint8Array>;let signal:AbortSignal|null|undefined;let ended=false,releaseHeaders=()=>{};
 globalThis.fetch=async(_url,options)=>{signal=options?.signal;const response=new Response(new ReadableStream<Uint8Array>({start(c){controller=c;signal?.addEventListener('abort',()=>{if(!ended){ended=true;controller.error(new DOMException('Aborted','AbortError'));}},{once:true});},cancel(){ended=true;}}));
  return holdHeaders?new Promise<Response>((resolve,reject)=>{releaseHeaders=()=>resolve(response);signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});}):response;
 };
 return {releaseHeaders(){releaseHeaders();},push(value:string){controller.enqueue(new TextEncoder().encode(value));},close(){if(!ended){ended=true;controller.close();}},get aborted(){return signal?.aborted;}};
}
function packet(seq:number,t=performance.now()/1000){return {v:1,session:'a'.repeat(32),seq,expires:Date.now()+600000,accel:[0,0,-1],gyro:[0,0,0],t,unit:'g-deg/s',kind:'native-spu'};}

test('coalesced native reports larger than 16 KB and a split final line remain connected',async()=>{
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 const t=performance.now()/1000,lines=Array.from({length:100},(_,i)=>JSON.stringify(packet(i+1,t+i*.00001))+'\n').join('');
 expect(lines.length).toBeGreaterThan(16000);expect(motion.fresh).toBe(false);expect(motion.ready).toBe(false);
 const last=JSON.stringify(packet(101,t+.002)),half=Math.floor(last.length/2);
 transport.push(lines+last.slice(0,half));await expect.poll(()=>motion.received).toBe(100);
 expect(motion.connected).toBe(true);transport.push(last.slice(half)+'\n');await expect.poll(()=>motion.received).toBe(101);
 expect(motion.rejected).toBe(0);expect(motion.fresh).toBe(true);expect(motion.ready).toBe(false);expect(motion.calibrate()).toBe(true);expect(motion.ready).toBe(true);expect(motion.arm('move')).toBe(true);
 transport.close();await pending;expect(motion.model.armed).toBeNull();
});

test('buffered stale reports cannot rearm when fresh reports resume in a large chunk',async()=>{
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 const t=performance.now()/1000;transport.push(Array.from({length:60},(_,i)=>JSON.stringify(packet(i+1,t+i*.00001))+'\n').join(''));
 await expect.poll(()=>motion.received).toBe(60);expect(motion.calibrate()).toBe(true);expect(motion.arm('move')).toBe(true);
 await new Promise(resolve=>setTimeout(resolve,350));expect(motion.model.armed).toBeNull();expect(motion.connected).toBe(true);expect(motion.calibrated).toBe(true);expect(motion.fresh).toBe(false);expect(motion.ready).toBe(false);expect(motion.arm('move')).toBe(false);expect(transport.aborted).toBe(false);
 const buffered=Array.from({length:100},(_,i)=>JSON.stringify({...packet(i+61,t+.001+i*.00001),sampleEpoch:Date.now()-2000})+'\n').join('');
 transport.push(buffered+JSON.stringify({...packet(161),sampleEpoch:Date.now()})+'\n');
 await expect.poll(()=>motion.received).toBe(61);expect(motion.rejected).toBe(100);expect(motion.connected).toBe(true);expect(motion.fresh).toBe(true);expect(motion.ready).toBe(true);expect(motion.model.armed).toBeNull();expect(motion.arm('move')).toBe(true);
 transport.close();await pending;
});

test('an oversized unterminated record closes the transport and disarms',async()=>{
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 transport.push('x'.repeat(2049));await pending;
 expect(motion.status).toBe('Invalid motion stream.');expect(motion.connected).toBe(false);expect(motion.model.armed).toBeNull();expect(transport.aborted).toBe(true);
 transport.close();
});

test('a helper with no valid first sample times out and aborts with recovery guidance',async()=>{
 const sessions:number[]=[];let invalidated=0;motion.dispose();const time=clock();motion=new NativeMotion(new Preparation('stir-demo'),expires=>sessions.push(expires),()=>invalidated++);
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 transport.push(JSON.stringify({...packet(1),unit:'invalid'})+'\n');
 await expect.poll(()=>motion.rejected).toBe(1);expect(motion.status).toBe('Helper reached. Waiting for live motion samples…');
 time.advance(4999);expect(transport.aborted).toBe(false);time.advance(1);await pending;
 expect(transport.aborted).toBe(true);expect(motion.status).toBe('No live motion samples received. Restart the local helper and allow local network access, then pair again.');
 expect(motion.connected).toBe(false);expect(motion.ready).toBe(false);expect(motion.model.armed).toBeNull();expect(sessions).toEqual([]);expect(invalidated).toBe(0);
});

test('a fetch awaiting the helper or network permission times out after sixty seconds',async()=>{
 let signal:AbortSignal|null|undefined,invalidated=0;motion.dispose();const time=clock();motion=new NativeMotion(new Preparation('stir-demo'),undefined,()=>invalidated++);
 globalThis.fetch=(_url,options)=>new Promise((_resolve,reject)=>{signal=options?.signal;signal?.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError')),{once:true});});
 const pending=motion.connect('x'.repeat(43));time.advance(59999);
 expect(signal?.aborted).toBe(false);expect(motion.status).toBe('Connecting to the local helper…');
 time.advance(1);await pending;
 expect(signal?.aborted).toBe(true);expect(motion.status).toContain('Still unable to reach the local helper.');expect(motion.status).toContain('allow local network access');expect(motion.connected).toBe(false);expect(invalidated).toBe(0);
});

test('permission taking six seconds still leaves five seconds for the first sample after headers',async()=>{
 const sessions:number[]=[];motion.dispose();const time=clock();motion=new NativeMotion(new Preparation('stir-demo'),expires=>sessions.push(expires));
 const transport=stream(true),pending=motion.connect('x'.repeat(43));time.advance(6000);
 expect(transport.aborted).toBe(false);expect(motion.status).toBe('Connecting to the local helper…');expect(sessions).toEqual([]);
 transport.releaseHeaders();await expect.poll(()=>motion.status).toBe('Helper reached. Waiting for live motion samples…');
 time.advance(4999);expect(transport.aborted).toBe(false);
 const first=packet(1);transport.push(JSON.stringify(first)+'\n');await expect.poll(()=>motion.received).toBe(1);
 expect(motion.fresh).toBe(true);expect(motion.calibrated).toBe(false);expect(motion.model.armed).toBeNull();expect(sessions).toEqual([first.expires]);
 time.advance(1);expect(transport.aborted).toBe(false);expect(motion.connected).toBe(true);
 transport.close();await pending;
});

test('session expiry aborts the stream without replacing the expiry explanation',async()=>{
 const invalidated:boolean[]=[];motion.dispose();const time=clock();motion=new NativeMotion(new Preparation('stir-demo'),undefined,()=>invalidated.push(motion.connected));
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 const expires=Date.now()+500,t=performance.now()/1000;
 transport.push(Array.from({length:60},(_,i)=>JSON.stringify({...packet(i+1,t+i*.00001),expires})+'\n').join(''));
 await expect.poll(()=>motion.received).toBe(60);expect(motion.calibrate()).toBe(true);expect(motion.arm('stir')).toBe(true);
 time.advance(500);await pending;
 expect(transport.aborted).toBe(true);expect(motion.status).toBe('Session expired. Restart the helper and pair again.');expect(motion.connected).toBe(false);expect(motion.calibrated).toBe(false);expect(motion.ready).toBe(false);expect(motion.model.armed).toBeNull();
 time.advance(1000);expect(invalidated).toEqual([true]);
});

test('validated session callback fires once per connect with the original expiry',async()=>{
 const sessions:number[]=[];motion.dispose();motion=new NativeMotion(new Preparation('stir-demo'),expires=>sessions.push(expires));
 const first=stream(),pendingFirst=motion.connect('x'.repeat(43));await Promise.resolve();
 first.push(JSON.stringify({...packet(1),session:'invalid'})+'\n');await expect.poll(()=>motion.rejected).toBe(1);expect(sessions).toEqual([]);
 const expires=Date.now()+600000,t=performance.now()/1000;
 first.push([1,2].map(seq=>JSON.stringify({...packet(seq,t+seq*.00001),expires})+'\n').join(''));
 await expect.poll(()=>motion.received).toBe(2);expect(sessions).toEqual([expires]);
 const second=stream(),pendingSecond=motion.connect('y'.repeat(43));await Promise.resolve();await pendingFirst;
 expect(first.aborted).toBe(true);expect(motion.connected).toBe(false);expect(motion.calibrated).toBe(false);expect(motion.model.armed).toBeNull();
 const nextExpiry=expires+1000;second.push(JSON.stringify({...packet(1),expires:nextExpiry,session:'b'.repeat(32)})+'\n');
 await expect.poll(()=>motion.received).toBe(1);expect(sessions).toEqual([expires,nextExpiry]);expect(motion.fresh).toBe(true);expect(motion.ready).toBe(false);expect(motion.model.armed).toBeNull();
 second.close();await pendingSecond;
});

test('browser network rejection explains the helper and local-network recovery',async()=>{
 let invalidated=0;motion.dispose();motion=new NativeMotion(new Preparation('stir-demo'),undefined,()=>invalidated++);
 globalThis.fetch=async()=>{throw new TypeError('Failed to fetch');};await motion.connect('x'.repeat(43));
 expect(motion.status).toBe('Connection unavailable. Start the local helper and allow local network access for SpiritAtlas, then pair again.');expect(motion.connected).toBe(false);expect(motion.ready).toBe(false);expect(invalidated).toBe(0);
});

test('another browser owning the helper remains an explicit pairing conflict',async()=>{
 let invalidated=0;motion.dispose();motion=new NativeMotion(new Preparation('stir-demo'),undefined,()=>invalidated++);
 globalThis.fetch=async()=>new Response(null,{status:409});await motion.connect('x'.repeat(43));
 expect(motion.status).toBe('Another browser owns this session. Disconnect it first.');expect(motion.connected).toBe(false);expect(motion.model.armed).toBeNull();expect(invalidated).toBe(0);
});

test('unauthorized pairing invalidates once before aborting and explains how to pair again',async()=>{
 const invalidated:(boolean|undefined)[]=[];motion.dispose();motion=new NativeMotion(new Preparation('stir-demo'),undefined,()=>invalidated.push(motion.controller?.signal.aborted));
 globalThis.fetch=async()=>new Response(null,{status:401});await motion.connect('x'.repeat(43));
 expect(motion.status).toBe('Pairing expired or not authorized. Open the helper’s pairing page.');expect(motion.connected).toBe(false);expect(invalidated).toEqual([false]);
 motion.disconnect();expect(invalidated).toEqual([false]);
});

test('a late unauthorized response from an old request cannot invalidate the current pairing',async()=>{
 let invalidated=0,finishOld!:(response:Response)=>void;motion.dispose();motion=new NativeMotion(new Preparation('stir-demo'),undefined,()=>invalidated++);
 // Deliberately ignore abort to simulate an older response already queued by the browser.
 globalThis.fetch=()=>new Promise(resolve=>{finishOld=resolve;});const old=motion.connect('x'.repeat(43));
 const transport=stream(),pending=motion.connect('y'.repeat(43));await Promise.resolve();
 transport.push(JSON.stringify({...packet(1),session:'b'.repeat(32)})+'\n');await expect.poll(()=>motion.received).toBe(1);
 finishOld(new Response(null,{status:401}));await old;
 expect(invalidated).toBe(0);expect(transport.aborted).toBe(false);expect(motion.fresh).toBe(true);expect(motion.session).toBe('b'.repeat(32));expect(motion.status).toBe('Live native samples · recenter to calibrate');
 transport.close();await pending;
});


test('long-session reports accept eight hours and reject expired or more than twenty-four hours',()=>{
 const valid={...packet(1),expires:Date.now()+8*60*60_000};
 expect(motion.accept({...valid,expires:Date.now()+25*60*60_000})).toBe(false);
 expect(motion.accept({...valid,expires:Date.now()-1})).toBe(false);
 expect(motion.accept(valid)).toBe(true);expect(motion.fresh).toBe(true);
 expect(motion.expires).toBe(valid.expires);expect(motion.model.armed).toBeNull();
});
