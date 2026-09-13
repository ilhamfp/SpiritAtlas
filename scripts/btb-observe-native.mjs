// Passive observation of the owned Chrome page. No navigation, arming or sensor injection.
import {chromium} from '@playwright/test';
import fs from 'node:fs/promises';
import {recordRealPage} from './btb-real-browser.mjs';
const seconds=Number(process.env.BTB_OBSERVE_SECONDS||90),name=process.env.BTB_EVIDENCE||'native-stir-owner';
const browser=await chromium.connectOverCDP('http://127.0.0.1:9228',{noDefaults:true});
const page=browser.contexts()[0].pages().find(p=>p.url().startsWith('https://spiritatlas-one.vercel.app/behind-the-bar'));
if(!page)throw Error('Owned SpiritAtlas diagnostic page not found');
let stopVideo;
try{
 stopVideo=await recordRealPage(page,`docs/behind-the-bar/evidence/native-video/${name}.webm`);
 const entry=await page.evaluate(()=>document.querySelector('script[type="module"]').getAttribute('src'));
 await page.evaluate(()=>{
  window.__btbObserver=[];window.__btb.scene.diagnostics.frameTimes.length=0;
  window.__btbObserverTimer=setInterval(()=>{const n=window.__btbNative,m=window.__btb.model,d=window.__btb.scene.diagnostics;
   window.__btbObserver.push({wall:Date.now(),focused:document.hasFocus(),visible:!document.hidden,native:{...n.snapshot(),receiptToApply:undefined},sample:n.sample?{seq:n.sample.seq,t:n.sample.t,sampleEpoch:n.sample.sampleEpoch,gyro:n.sample.gyro,accel:n.sample.accel}:null,armed:m.armed,stage:m.stage,stirInput:m.stirInput,spoonAngle:m.spoonAngle,effectiveStir:m.effectiveStir,tilt:[m.vesselX,m.vesselZ],pour:m.pourTilt,mix:{...m.mix},serving:{...m.serving},gpu:d.gpuState.slice(),frame:d.frames});
  },100);
 });
 console.log('Passive real native observation ready. The owner controls arming and movement.');
 await page.waitForTimeout(seconds*1000);
 const result=await page.evaluate(()=>{clearInterval(window.__btbObserverTimer);const d=window.__btb.scene.diagnostics;return {rows:window.__btbObserver,latency:d.nativeLatency,frameTimes:d.frameTimes,errors:d.errors,state:window.__btb.model.snapshot()};});
 await fs.writeFile(`docs/behind-the-bar/evidence/${name}.json`,JSON.stringify({at:new Date().toISOString(),entry,source:'Actual native HID -> public HTTPS page, normal Chrome. Passive observation; no injected samples or automated arming.',revision:process.env.BTB_REVISION||null,deployment:process.env.BTB_DEPLOYMENT||null,...result},null,2));
 console.log({rows:result.rows.length,arms:[...new Set(result.rows.map(r=>r.armed))],maxStir:Math.max(...result.rows.map(r=>Math.abs(r.stirInput))),maxTilt:Math.max(...result.rows.flatMap(r=>r.tilt.map(Math.abs))),errors:result.errors});
}finally{if(stopVideo)await stopVideo();await browser.close();}
