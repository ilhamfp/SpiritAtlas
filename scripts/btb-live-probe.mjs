import {chromium} from '@playwright/test';import fs from 'node:fs/promises';
const browser=await chromium.launch({channel:'chrome',headless:false});const page=await browser.newPage({viewport:{width:1440,height:1000},recordVideo:{dir:'docs/behind-the-bar/evidence/video',size:{width:1440,height:1000}}});
await page.goto('http://127.0.0.1:4190/behind-the-bar?preset=stir-demo');await page.waitForFunction(()=>window.__btb?.scene?.diagnostics.gpuReads>3);
const samples=[];const sample=async label=>{samples.push({label,...await page.evaluate(async()=>({state:window.__btb.model.snapshot(),gpu:await window.__btb.scene.probe(),ice:window.__btb.scene.diagnostics.ice}))});};
await sample('idle');const box=await page.locator('.btb-canvas').boundingBox();const cx=box.x+box.width/2,cy=box.y+box.height/2;
async function circle(sign,seconds){const count=seconds*45;await page.mouse.move(cx+130,cy);await page.mouse.down();for(let i=0;i<count;i++){const a=i/45*Math.PI*2*sign;await page.mouse.move(cx+Math.cos(a)*130,cy+Math.sin(a)*70);await page.waitForTimeout(16);}await page.mouse.up();}
await circle(1,2);await sample('clockwise');await circle(-1,2);await sample('reversed');await page.waitForTimeout(250);await sample('released');await page.waitForTimeout(4000);await sample('settled');
await page.screenshot({path:'docs/behind-the-bar/evidence/preview-live-desktop.png',fullPage:true});
await fs.writeFile('docs/behind-the-bar/evidence/first-gesture-gpu.json',JSON.stringify(samples,null,2));console.log(samples.map(s=>({label:s.label,gpu:s.gpu})));await page.close();await browser.close();
