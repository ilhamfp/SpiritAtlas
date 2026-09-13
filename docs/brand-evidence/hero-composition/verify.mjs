import {chromium, webkit, expect} from '@playwright/test';
import fs from 'node:fs/promises';
const baseURL=process.env.ATLAS_BRAND_URL || 'http://127.0.0.1:4186';
const out=process.env.ATLAS_HERO_EVIDENCE || 'docs/brand-evidence/hero-composition';
await fs.mkdir(out,{recursive:true});
const results=[];
for(const [name,engine,options] of [['chrome',chromium,{channel:'chrome'}],['webkit',webkit,{}]]) {
 const browser=await engine.launch(options);
 for(const [width,height,dpr] of [[1440,1000,1],[768,1024,1],[390,844,2],[320,568,2]]) {
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(baseURL);
  await page.evaluate(()=>document.fonts.ready);
  await expect(page.locator('.cn-stage')).toHaveAttribute('data-film-ready','true',{timeout:45000});
  await expect.poll(()=>page.locator('.sa-marble').evaluate(c=>c.width)).toBe(width*dpr);
  const first=await page.locator('.sa-marble').evaluate(c=>c.toDataURL());
  await page.waitForTimeout(150);
  expect(await page.locator('.sa-marble').evaluate(c=>c.toDataURL())).toBe(first);
  const layout=await page.evaluate(()=>{
   const bounds=s=>{const b=document.querySelector(s).getBoundingClientRect();return {x:b.x,y:b.y,width:b.width,height:b.height,bottom:b.bottom}};
   return {hero:bounds('.sa-hero'),stage:bounds('.cn-stage'),controls:bounds('.cn-controls'),headline:bounds('h1'),documentWidth:document.documentElement.scrollWidth,heroPadding:getComputedStyle(document.querySelector('.sa-hero')).padding,mask:getComputedStyle(document.querySelector('.cn-poster')).maskImage};
  });
  expect(layout.documentWidth).toBe(width);expect(layout.heroPadding).toBe('0px');
  expect(layout.stage.x).toBeGreaterThanOrEqual(0);expect(layout.stage.x+layout.stage.width).toBeLessThanOrEqual(width+1);
  if(height>=844)expect(layout.controls.bottom).toBeLessThan(height);
  await page.screenshot({path:`${out}/${name}-${width}.png`});
  const slider=page.getByRole('slider',{name:'Deconstruction progress'});
  await slider.focus();
  expect(await slider.evaluate(e=>getComputedStyle(e).outlineStyle)).toBe('solid');
  await slider.press('End');
  await expect.poll(async()=>Number(await page.locator('.cn-hero').getAttribute('data-progress'))).toBe(1);
  await page.waitForTimeout(500);
  await page.screenshot({path:`${out}/${name}-expanded-${width}.png`});
  expect(errors).toEqual([]);
  results.push({browser:name,viewport:{width,height},deviceScaleFactor:dpr,stableCanvas:true,keyboardFocus:true,expanded:true,errors,...layout});
  await page.close();
 }
 await browser.close();
}
await fs.writeFile(`${out}/visual-checks.json`,JSON.stringify({baseURL,results},null,2)+'\n');
console.log(JSON.stringify(results.map(({browser,viewport,controls})=>({browser,viewport,controlsBottom:controls.bottom}))));
