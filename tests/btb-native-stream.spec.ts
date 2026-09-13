import {test,expect} from '@playwright/test';
import {NativeMotion} from '../src/behind-the-bar/native';
import {Preparation} from '../src/behind-the-bar/model';

// Deterministic transport fixtures only; these do not establish physical-device acceptance.
const originalFetch=globalThis.fetch;
let motion:NativeMotion;
test.beforeEach(()=>{
 Object.assign(globalThis,{window:new EventTarget(),document:Object.assign(new EventTarget(),{hidden:false,hasFocus:()=>true})});
 motion=new NativeMotion(new Preparation('stir-demo'));
});
test.afterEach(()=>{motion.dispose();globalThis.fetch=originalFetch;Reflect.deleteProperty(globalThis,'window');Reflect.deleteProperty(globalThis,'document');});
function stream(){
 let controller!:ReadableStreamDefaultController<Uint8Array>;let signal:AbortSignal|null|undefined;
 globalThis.fetch=async(_url,options)=>{signal=options?.signal;return new Response(new ReadableStream<Uint8Array>({start(c){controller=c;}}));};
 return {push(value:string){controller.enqueue(new TextEncoder().encode(value));},close(){controller.close();},get aborted(){return signal?.aborted;}};
}
function packet(seq:number,t=performance.now()/1000){return {v:1,session:'a'.repeat(32),seq,expires:Date.now()+600000,accel:[0,0,-1],gyro:[0,0,0],t,unit:'g-deg/s',kind:'native-spu'};}

test('coalesced native reports larger than 16 KB and a split final line remain connected',async()=>{
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 const t=performance.now()/1000,lines=Array.from({length:100},(_,i)=>JSON.stringify(packet(i+1,t+i*.00001))+'\n').join('');
 expect(lines.length).toBeGreaterThan(16000);
 const last=JSON.stringify(packet(101,t+.002)),half=Math.floor(last.length/2);
 transport.push(lines+last.slice(0,half));await expect.poll(()=>motion.received).toBe(100);
 expect(motion.connected).toBe(true);transport.push(last.slice(half)+'\n');await expect.poll(()=>motion.received).toBe(101);
 expect(motion.rejected).toBe(0);expect(motion.calibrate()).toBe(true);expect(motion.arm('move')).toBe(true);
 transport.close();await pending;expect(motion.model.armed).toBeNull();
});

test('buffered stale reports cannot rearm when fresh reports resume in a large chunk',async()=>{
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 const t=performance.now()/1000;transport.push(Array.from({length:60},(_,i)=>JSON.stringify(packet(i+1,t+i*.00001))+'\n').join(''));
 await expect.poll(()=>motion.received).toBe(60);expect(motion.calibrate()).toBe(true);expect(motion.arm('move')).toBe(true);
 await new Promise(resolve=>setTimeout(resolve,350));expect(motion.model.armed).toBeNull();
 const buffered=Array.from({length:100},(_,i)=>JSON.stringify({...packet(i+61,t+.001+i*.00001),sampleEpoch:Date.now()-2000})+'\n').join('');
 transport.push(buffered+JSON.stringify({...packet(161),sampleEpoch:Date.now()})+'\n');
 await expect.poll(()=>motion.received).toBe(61);expect(motion.rejected).toBe(100);expect(motion.connected).toBe(true);expect(motion.model.armed).toBeNull();
 transport.close();await pending;
});

test('an oversized unterminated record closes the transport and disarms',async()=>{
 const transport=stream(),pending=motion.connect('x'.repeat(43));await Promise.resolve();
 transport.push('x'.repeat(2049));await pending;
 expect(motion.status).toBe('Invalid motion stream.');expect(motion.connected).toBe(false);expect(motion.model.armed).toBeNull();expect(transport.aborted).toBe(true);
 transport.close();
});
