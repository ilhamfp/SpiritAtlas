import {test,expect} from '@playwright/test';
import {surfaceIntercept,strainAngle,LIQUID_BOTTOM,LIQUID_RIM,LIQUID_RADIUS} from '../src/behind-the-bar/strain';

test('tilted free surface preserves fill and raises the pour angle as the glass empties',()=>{
 for(const level of [.2,.45,.9,1.3])for(const angle of [0,.4,.8,1.3]){
  const slope=Math.tan(angle),intercept=surfaceIntercept(level,slope);let sum=0;
  // Independent dense polar integration, rather than the solver's sparse sample pattern.
  for(let ring=0;ring<80;ring++)for(let j=0;j<128;j++){const x=LIQUID_RADIUS*Math.sqrt((ring+.5)/80)*Math.cos(j/128*Math.PI*2);sum+=Math.min(LIQUID_RIM,Math.max(LIQUID_BOTTOM,intercept+slope*x));}
  expect(Math.abs(sum/(80*128)-level)).toBeLessThan(.012);
 }
 expect(strainAngle(.85,.3)).toBeGreaterThan(strainAngle(.85,1.2));expect(strainAngle(0,.3)).toBe(0);
});

test('straining clears the receiving ice, keeps liquid level, and pauses without losing the partial serving',async({page})=>{
 await page.goto('/behind-the-bar/diagnostics?preset=stir-demo');await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:25000});
 await page.getByRole('button',{name:'Strain',exact:true}).click();await page.getByRole('button',{name:'Pour',exact:true}).click();await page.waitForTimeout(2000);
 const flowing=await page.evaluate(()=>({scene:window.__btb!.scene!.inspect(),model:window.__btb!.model.snapshot()}));
 expect(flowing.scene.stream.visible).toBe(true);expect(flowing.scene.stream.from[1]-flowing.scene.stream.to[1]).toBeGreaterThan(.7);
 expect(flowing.scene.stream.to[1]).toBeGreaterThan(1.8);expect(flowing.scene.liquid[0].worldSurfaceSpan).toBeLessThan(.12);expect(flowing.scene.liquid[1].worldSurfaceSpan).toBeLessThan(.03);expect(flowing.scene.iceRetained).toBe(3);
 await page.getByRole('button',{name:'Pause pour',exact:true}).click();await page.waitForTimeout(900);
 const paused=await page.evaluate(()=>({scene:window.__btb!.scene!.inspect(),model:window.__btb!.model.snapshot()}));
 expect(paused.scene.stream.visible).toBe(false);expect(Math.abs(paused.scene.mixingTilt[2])).toBeLessThan(.001);expect(paused.scene.mixingPosition[1]).toBeLessThan(.001);expect(paused.model.mix.core).toBeGreaterThan(0);expect(paused.model.serving.core).toBeGreaterThan(0);
 await page.waitForTimeout(500);expect(await page.evaluate(()=>window.__btb!.model.serving)).toEqual(paused.model.serving);
 for(const delta of Object.values(paused.model.conservation))expect(Math.abs(delta as number)).toBeLessThan(1e-7);
 await page.getByRole('button',{name:'Pour',exact:true}).click();await page.waitForFunction(()=>window.__btb!.model.pourTilt===0,{},{timeout:15000});await page.waitForTimeout(500);
 expect(await page.evaluate(()=>window.__btb!.scene!.inspect().stream.visible)).toBe(false);expect(await page.evaluate(()=>window.__btb!.model.mix.core)).toBe(0);expect(await page.evaluate(()=>window.__btb!.model.serving.core)).toBeCloseTo(.65,5);
 await page.getByRole('button',{name:'Reset demo'}).click();await page.waitForTimeout(300);expect(await page.evaluate(()=>window.__btb!.scene!.inspect().mixingTilt[2])).toBe(0);
});

test('strain scene and laptop toolbar stay separate on desktop and phone',async({page})=>{
 for(const [width,height] of [[1440,1000],[390,844]]){
  await page.setViewportSize({width,height});await page.goto('/behind-the-bar/diagnostics?preset=stir-demo');await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:25000});
  await page.getByRole('button',{name:'Strain',exact:true}).click();await page.waitForTimeout(600);
  const bar=await page.locator('.btb-live-motion').boundingBox(),canvas=await page.locator('.btb-canvas').boundingBox();expect(bar!.y+bar!.height).toBeLessThanOrEqual(canvas!.y+1);
  await page.screenshot({path:`docs/behind-the-bar/evidence/strain-final-${width}-rest.png`,fullPage:true});
  await page.getByRole('button',{name:'Pour',exact:true}).click();await page.waitForTimeout(1300);await page.screenshot({path:`docs/behind-the-bar/evidence/strain-final-${width}-pour.png`,fullPage:true});
  await page.getByRole('button',{name:'Pause pour',exact:true}).click();await page.waitForTimeout(850);await page.screenshot({path:`docs/behind-the-bar/evidence/strain-final-${width}-pause.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
