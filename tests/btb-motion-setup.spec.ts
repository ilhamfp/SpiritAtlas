import {test,expect} from '@playwright/test';

test('diagnostic setup stays open and Escape disarms without discarding pairing',async({page})=>{
 await page.goto('/behind-the-bar/diagnostics?preset=stir-demo');
 await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:20000});
 await expect(page.getByText('Laptop tilt is off · helper not connected',{exact:true})).toBeVisible();
 await page.getByRole('button',{name:'Pair laptop',exact:true}).click();
 await expect(page.getByRole('link',{name:'Open local pairing page'})).toBeVisible();
 // Protocol fixture validates session retention only; it is not a physical motion test.
 await page.evaluate(()=>{const n=window.__btbNative!;for(let i=1;i<=64;i++)n.accept({v:1,session:'a'.repeat(32),seq:i,expires:Date.now()+600000,accel:[0,0,-1],gyro:[0,0,0],t:i/60,unit:'g-deg/s',kind:'native-spu'});n.calibrate();});
 for(let i=0;i<2;i++){
  await page.getByRole('button',{name:'Motion setup',exact:true}).click();
  expect(await page.evaluate(()=>({received:window.__btbNative?.received,session:window.__btbNative?.session,calibrated:window.__btbNative?.calibrated}))).toEqual({received:64,session:'a'.repeat(32),calibrated:true});
 }
 await page.locator('.btb-canvas').focus();
 await page.evaluate(()=>{window.__btb!.model.armed='move';});
 await page.keyboard.press('Escape');
 expect(await page.evaluate(()=>({armed:window.__btb!.model.armed,connected:window.__btbNative?.connected,calibrated:window.__btbNative?.calibrated}))).toEqual({armed:null,connected:true,calibrated:true});
 await expect(page.getByRole('button',{name:'Motion setup',exact:true})).toHaveAttribute('aria-expanded','true');
});

test('unpaired motion guidance and setup remain usable on desktop and phone',async({page})=>{
 for(const [width,height] of [[1440,1000],[390,844]]){
  await page.setViewportSize({width,height});await page.goto('/behind-the-bar/diagnostics?preset=stir-demo');
  await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:20000});
  const pair=page.getByRole('button',{name:'Pair laptop',exact:true});await expect(pair).toBeVisible();
  await page.screenshot({path:`docs/behind-the-bar/evidence/motion-setup-${width}.png`,fullPage:true});
  await pair.click();await expect(page.getByRole('link',{name:'Helper setup instructions'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 }
});
