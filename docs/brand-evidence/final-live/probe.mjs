import {chromium,expect} from '@playwright/test';
import fs from 'node:fs/promises';import{createHash}from'node:crypto';
const dir=process.env.ATLAS_LIVE_EVIDENCE || new URL('../verify-live/',import.meta.url).pathname;await fs.mkdir(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome'});const results=[];
try{for(const width of [390]){
 const context=await browser.newContext({viewport:{width,height:width===390?844:1000},hasTouch:width===390,isMobile:width===390,reducedMotion:'reduce'});const page=await context.newPage();const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});page.on('response',r=>{if(r.status()>=400&&new URL(r.url()).origin==='https://spiritatlas-one.vercel.app')errors.push(r.status()+' '+r.url())});page.on('requestfailed',r=>{if(!r.failure()?.errorText.includes('ERR_ABORTED')&&new URL(r.url()).origin==='https://spiritatlas-one.vercel.app')errors.push(r.failure()?.errorText+' '+r.url())});
 await page.goto('https://spiritatlas-one.vercel.app');const hero=page.getByRole('region',{name:'Classic Negroni experience',exact:true});const film=hero.locator('video[data-sequence="forward"]');
 await expect.poll(()=>film.evaluate(v=>v.readyState)).toBeGreaterThanOrEqual(2);
 const controls=await hero.locator('button,input').evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {name:e.getAttribute('aria-label')||e.textContent,width:r.width,height:r.height,color:s.color,background:s.backgroundColor}}));
 const mode=hero.getByRole('button',{name:'Explore 3D',exact:true});await mode.focus();const focus=await mode.evaluate(e=>{const s=getComputedStyle(e);return{style:s.outlineStyle,width:s.outlineWidth,color:s.outlineColor}});expect(focus.style).toBe('solid');expect(parseFloat(focus.width)).toBeGreaterThanOrEqual(2);
 await page.screenshot({path:dir+`/focus-${width}.png`});
 let release;const hold=new Promise(r=>release=r);let codeHeld=0;
 await page.route(/\/assets\/renderer-[^/]+\.js$/,async route=>{codeHeld++;await hold;await route.continue()});
 await mode.press('Enter');await expect.poll(()=>codeHeld).toBe(1);await expect(hero.getByText('Preparing your 3D view…',{exact:true})).toBeVisible();await expect(film).toBeVisible();
 await hero.locator('.cn-stage').scrollIntoViewIfNeeded();await page.screenshot({path:dir+`/live-loading-${width}.png`});
 const loading=await hero.locator('.cn-loading').evaluate(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{bounds:{x:r.x,y:r.y,width:r.width,height:r.height},foreground:s.color,background:s.backgroundColor}});
 release();
 const canvas=hero.getByRole('img',{name:'Interactive classic Negroni',exact:true});await expect(canvas).toBeVisible({timeout:45000});await expect.poll(async()=>Number(await canvas.getAttribute('data-rendered-frames')),{timeout:45000}).toBeGreaterThan(0);
 await expect(hero.locator('.cn-loading')).toHaveCount(0);await page.waitForTimeout(600);
 const hash=async()=>createHash('sha256').update(await canvas.screenshot()).digest('hex');const before=await hash();const framesBefore=Number(await canvas.getAttribute('data-rendered-frames'));
 const right=hero.getByRole('button',{name:'Rotate Negroni right',exact:true});await right.focus();await right.press('Enter');await page.waitForTimeout(450);const afterKey=await hash();expect(afterKey).not.toBe(before);
 await hero.getByRole('button',{name:'Reset Negroni',exact:true}).click();await page.waitForTimeout(500);await canvas.scrollIntoViewIfNeeded();const afterReset=await hash();const box=await canvas.boundingBox();
 const cdp=await context.newCDPSession(page);const x=box.x+box.width*.65,y=box.y+box.height*.5;
 if(width===390){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});for(let i=1;i<=12;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x-i*7,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]})}else{await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-100,y,{steps:12});await page.mouse.up()}
 await page.waitForTimeout(1200);const afterGesture=await hash();expect(afterGesture).not.toBe(afterReset);
 await page.screenshot({path:dir+`/live-assembled-${width}.png`});
 await hero.getByRole('button',{name:'Look inside',exact:true}).click();await expect(hero).toHaveAttribute('data-progress','1.00000');await expect.poll(async()=>Number(await canvas.getAttribute('data-progress'))).toBe(1);await page.waitForTimeout(1200);await canvas.scrollIntoViewIfNeeded();await page.screenshot({path:dir+`/live-expanded-${width}.png`});
 const expanded=await hash();await hero.getByRole('button',{name:'Bring it together',exact:true}).click();await expect(hero).toHaveAttribute('data-progress','0.00000');await page.waitForTimeout(1000);const reassembled=await hash();expect(expanded).not.toBe(reassembled);
 const framesSettled=Number(await canvas.getAttribute('data-rendered-frames'));await page.waitForTimeout(400);const framesLater=Number(await canvas.getAttribute('data-rendered-frames'));expect(framesLater).toBe(framesSettled);
 expect(errors).toEqual([]);results.push({width,controls,focus,loading,actual3D:{before,afterKey,afterReset,afterGesture,expanded,reassembled,framesBefore,framesSettled,framesLater},errors});await context.close();
}}finally{await fs.writeFile(dir+'/results.json',JSON.stringify(results,null,2)+'\n');await browser.close()}
console.log(JSON.stringify({cases:results.length,errors:results.map(r=>r.errors)},null,2));
