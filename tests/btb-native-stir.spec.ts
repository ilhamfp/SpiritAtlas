import {test,expect} from '@playwright/test';

// Protocol fixtures exercise the real GPU path; physical hardware is verified separately.
async function ready(page:any){
 await page.goto('/behind-the-bar/diagnostics?preset=stir-demo');
 await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:20000});
 await page.evaluate(()=>{
  const w=window as any,n=w.__btbNative;w.stirFixture={seq:0,gyro:[0,0,0],accel:[0,0,-1]};
  const send=()=>{const f=w.stirFixture;n.accept({v:1,session:'c'.repeat(32),seq:++f.seq,expires:Date.now()+600000,accel:f.accel,gyro:f.gyro,t:performance.now()/1000,unit:'g-deg/s',kind:'native-spu'});};
  w.stirFixture.timer=setInterval(send,16);
 });
 await page.waitForFunction(()=>window.__btbNative!.received>=60);
 await page.getByRole('button',{name:'Calibrate',exact:true}).click();
 await page.getByRole('button',{name:'Arm stirring',exact:true}).click();
}
async function gyro(page:any,value:number[]){await page.evaluate((g:number[])=>{(window as any).stirFixture.gyro=g;},value);}

test('laptop stirring drives spoon and GPU circulation, reverses, and settles with an upright glass',async({page})=>{
 await ready(page);const initial=await page.evaluate(()=>window.__btb!.model.spoonAngle);
 await gyro(page,[0,-24,0]);
 await expect.poll(()=>page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4])).toBeGreaterThan(2);
 const moving=await page.evaluate(()=>{const m=window.__btb!.model;return {angle:m.spoonAngle,tilt:[m.vesselX,m.vesselZ],pour:m.pourTilt,stir:m.effectiveStir};});
 expect(moving.angle).toBeGreaterThan(initial+.3);expect(moving.tilt).toEqual([0,0]);expect(moving.pour).toBe(0);expect(moving.stir).toBeGreaterThan(.3);
 await gyro(page,[0,24,0]);
 await expect.poll(()=>page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4])).toBeLessThan(-2);
 // A stationary but tilted laptop must not keep stirring.
 await page.evaluate(()=>{const f=(window as any).stirFixture;f.gyro=[0,0,0];f.accel=[.25,.2,-.9474];});
 await expect.poll(()=>page.evaluate(()=>window.__btb!.model.stirInput)).toBe(0);
 const stopped=await page.evaluate(()=>window.__btb!.model.spoonAngle);
 await expect.poll(()=>page.evaluate(()=>Math.abs(window.__btb!.scene!.diagnostics.gpuState[4])),{timeout:6000}).toBeLessThan(.1);
 expect(await page.evaluate(()=>window.__btb!.model.spoonAngle)).toBeCloseTo(stopped,4);
 expect(await page.evaluate(()=>[window.__btb!.model.vesselX,window.__btb!.model.vesselZ,window.__btb!.model.pourTilt])).toEqual([0,0,0]);
 expect(await page.evaluate(()=>window.__btb!.scene!.diagnostics.errors)).toEqual([]);
});

test('native stirring releases on stale input, stage change and local takeover without rearming',async({page})=>{
 await ready(page);await gyro(page,[30,0,0]);
 await expect.poll(()=>page.evaluate(()=>window.__btb!.model.stirInput)).toBeGreaterThan(2);
 await page.evaluate(()=>clearInterval((window as any).stirFixture.timer));
 await expect.poll(()=>page.evaluate(()=>window.__btb!.model.armed)).toBeNull();
 expect(await page.evaluate(()=>window.__btb!.model.stirInput)).toBe(0);
 const reconnect=await page.evaluate(()=>{const w=window as any,n=w.__btbNative,f=w.stirFixture;n.accept({v:1,session:'c'.repeat(32),seq:++f.seq,expires:Date.now()+600000,accel:[0,0,-1],gyro:[0,0,40],t:performance.now()/1000,unit:'g-deg/s',kind:'native-spu'});const afterFresh=w.__btb.model.armed;const rearm=n.arm('stir');w.__btb.model.takeover();return {afterFresh,rearm,afterLocal:w.__btb.model.armed};});
 expect(reconnect).toEqual({afterFresh:null,rearm:true,afterLocal:null});
 await page.getByRole('button',{name:'Strain',exact:true}).click();
 await expect(page.getByRole('button',{name:'Arm stirring',exact:true})).toHaveCount(0);
 expect(await page.evaluate(()=>window.__btbNative!.arm('stir'))).toBe(false);
 expect(await page.evaluate(()=>window.__btb!.model.armed)).toBeNull();
});

test('paired native stir controls fit desktop and phone viewports',async({page})=>{
 for(const [width,height] of [[1440,1000],[390,844]]){
  await page.setViewportSize({width,height});await ready(page);
  await expect(page.getByText('Armed · Stirring',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Disarm',exact:true})).toBeVisible();
  await page.screenshot({path:`docs/behind-the-bar/evidence/native-stir-${width}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
