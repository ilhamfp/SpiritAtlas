// Real-device diagnostic only. No synthetic packet or sensor override.
import {realBrowser,recordRealPage} from './btb-real-browser.mjs';
import fs from 'node:fs/promises';
const origin=process.env.BTB_URL||'https://spiritatlas-one.vercel.app';
const evidence=process.env.BTB_EVIDENCE||'production-native';
const armMode=process.env.BTB_ARM_MODE==='stir'?'stir':'move';
const seconds=Number(process.env.BTB_SECONDS||120),pair=JSON.parse(await fs.readFile('.mac-motion/pair.json','utf8'));
const real=await realBrowser();const {page}=real;let stopVideo;
try{
await page.goto(`${origin}/behind-the-bar/diagnostics?preset=stir-demo&rehearsal=${Date.now()}#motion=${pair.token}`);await page.waitForFunction(()=>window.__btbNative?.received>100&&window.__btb?.scene?.diagnostics.gpuReads>10,{},{timeout:30000});
await page.getByRole('button',{name:'Recenter at rest',exact:true}).click();await page.locator('.btb-stage').scrollIntoViewIfNeeded();
if(process.env.BTB_MANUAL_ARM==='1'){
 await page.evaluate((mode)=>{const note=document.createElement('div');note.id='btb-rehearsal-note';note.style.cssText='position:fixed;bottom:16px;left:20px;right:20px;z-index:100;pointer-events:none;background:#ffffe3;color:#242125;padding:14px 20px;font:15px system-ui;border:1px solid #ff6425;box-shadow:0 8px 28px #0008';note.textContent=mode==='stir'?'Device rehearsal: click Arm stirring, then gently rock or turn the laptop. Reverse the motion, hold still, and watch the drink settle. The glass should stay upright. Keep this window focused.':'Device rehearsal: click Arm movement, then gently tilt left/right and forward/back. Keep this window focused. Set flat and watch it settle. Next click Strain → Arm pour; tilt briefly, then set flat again.';document.body.append(note);},armMode);
 console.log('Ready for manual arming. On-screen rehearsal steps are visible; keep Chrome focused after arming.');
 await page.waitForFunction(mode=>window.__btb?.model.armed===mode,armMode,{timeout:Math.max(5,Math.min(600,Number(process.env.BTB_ARM_WAIT_SECONDS)||120))*1000});
}else await page.getByRole('button',{name:armMode==='stir'?'Arm stirring':'Arm movement',exact:true}).click();
stopVideo=await recordRealPage(page,`docs/behind-the-bar/evidence/native-video/${evidence}.webm`);await page.evaluate(()=>{window.__btbCapture=[];window.__btbCaptureTimer=setInterval(()=>{const n=window.__btbNative,m=window.__btb.model,d=window.__btb.scene.diagnostics;window.__btbCapture.push({wall:Date.now(),native:{...n.snapshot(),receiptToApply:undefined},sensor:n.sample?{t:n.sample.t,sampleEpoch:n.sample.sampleEpoch,seq:n.sample.seq,accel:n.sample.accel,gyro:n.sample.gyro}:null,stage:m.stage,armed:m.armed,stirInput:m.stirInput,spoonAngle:m.spoonAngle,effectiveStir:m.effectiveStir,pour:m.pourTilt,mix:{...m.mix},serving:{...m.serving},tilt:[m.vesselX,m.vesselZ],gpu:d.gpuState.slice(),frame:d.frames});},100);});
console.log(`Real native scene connected, calibrated and armed for ${armMode}. Move gently, reverse, then hold still and observe settling.`);
await page.waitForTimeout(seconds*1000);await page.evaluate(()=>clearInterval(window.__btbCaptureTimer));
const result=await page.evaluate(()=>({recordedAt:new Date().toISOString(),origin:location.origin,browser:navigator.userAgent,hardware:'Mac16,8 Apple M4 Pro macOS 26.3; identified in MACBOOK-PREFLIGHT.md',samples:window.__btbCapture,latency:window.__btb.scene.diagnostics.nativeLatency,receiverProcessing:window.__btbNative.receiptToApply,state:window.__btb.model.snapshot(),errors:window.__btb.scene.diagnostics.errors,physicalPhaseConfirmation:'Pending owner confirmation; stream contains real data and is not a synthetic fixture.'}));
await fs.writeFile(`docs/behind-the-bar/evidence/${evidence}-session.json`,JSON.stringify({...result,launchArguments:real.args,focusEmulation:false},null,2));await page.screenshot({path:`docs/behind-the-bar/evidence/${evidence}-scene.png`,fullPage:true});if(await page.getByRole('button',{name:'Disarm',exact:true}).count())await page.getByRole('button',{name:'Disarm',exact:true}).click();await stopVideo();stopVideo=null;console.log({samples:result.samples.length,latencyCount:result.latency.length,errors:result.errors,physicalConfirmation:'pending'});

}catch(error){
 const message=String(error?.message||error).replaceAll(pair.token,'<redacted>');
 const attempt={at:new Date().toISOString(),origin,manualArm:process.env.BTB_MANUAL_ARM==='1',outcome:'incomplete',reason:message,physicalTiltPourVerified:false};
 await fs.writeFile(`docs/behind-the-bar/evidence/${evidence}-attempt.json`,JSON.stringify(attempt,null,2));
 console.error('Native rehearsal incomplete:',message);process.exitCode=1;
}finally{if(stopVideo)await stopVideo().catch(()=>{});if(process.env.BTB_KEEP_BROWSER==='1')await real.detach();else await real.close();}
