import {chromium} from '@playwright/test';
import {mkdirSync,writeFileSync,statSync} from 'node:fs';
const output='qa/performance-results/collections-release';mkdirSync(output,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000},deviceScaleFactor:2,reducedMotion:'reduce'});
const results=[];
try{
 for(const ids of [['bbf-negroni','ichigo-negroni','negroni-express'],['atlas-espresso-martini','jigger-espresso-martini','nighthawks']]){
  const page=await context.newPage();await page.goto(`http://127.0.0.1:4173/?compare=${ids.join(',')}&expand=1`);
  for(const id of ids)await page.getByTestId(`viewer-${id}`).waitFor({state:'visible'});
  await page.waitForFunction(ids=>ids.every(id=>window.__atlasViewers?.[id]?.ready),ids,{timeout:60000});
  await page.waitForTimeout(500);
  const measured=await page.evaluate(async ids=>{
   const viewer=document.querySelector(`[data-testid="viewer-${ids[0]}"]`);
   const start=performance.now(),before=ids.map(id=>window.__atlasViewers[id].renderedFrames);
   await new Promise(resolve=>{
    function step(){if(performance.now()-start>=8000){resolve();return}
     viewer.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));requestAnimationFrame(step);
    }step();
   });
   const elapsed=performance.now()-start,after=ids.map(id=>window.__atlasViewers[id].renderedFrames);
   await new Promise(r=>setTimeout(r,500));const resting=ids.map(id=>window.__atlasViewers[id].renderedFrames);
   await new Promise(r=>setTimeout(r,1000));const final=ids.map(id=>window.__atlasViewers[id].renderedFrames);
   return {elapsedMs:elapsed,draws:after.map((n,i)=>n-before[i]),completedViewerFramesPerSecond:after.map((n,i)=>(n-before[i])*1000/elapsed),idleExtraDraws:final.map((n,i)=>n-resting[i]),canvases:[...document.querySelectorAll('[data-live="true"] canvas')].map(canvas=>({width:canvas.width,height:canvas.height,cssWidth:canvas.clientWidth,cssHeight:canvas.clientHeight})),userAgent:navigator.userAgent};
  },ids);
  results.push({ids,...measured,models:ids.map(id=>({id,bytes:statSync(`public/models/${id}.glb`).size}))});
  await page.close();
 }
 writeFileSync(`${output}/measurement.json`,JSON.stringify({date:new Date().toISOString(),method:'8 seconds of synchronized keyboard-driven orbit, three visible expanded viewers; counts completed viewer draws, not browser RAF, GPU presentation or physical-device FPS.',results},null,2));
 console.log(JSON.stringify(results,null,2));
}finally{await browser.close()}
