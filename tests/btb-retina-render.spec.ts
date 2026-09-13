import {test,expect} from '@playwright/test';
import type {Page} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';

// The owner's 1512px Retina window produces an odd 885px canvas, rendered at 1.5x.
test.use({viewport:{width:1512,height:806},deviceScaleFactor:2});
const evidence=path.resolve('docs/behind-the-bar/evidence/strain-motion',process.env.BTB_EVIDENCE_NAME||'local');
async function capture(page:Page,name:string){mkdirSync(evidence,{recursive:true});const png=await page.locator('.btb-canvas').screenshot();writeFileSync(path.join(evidence,`${name}.png`),png);return png;}
async function changedPixels(page:Page,a:Buffer,b:Buffer){
 return page.evaluate(async(encoded)=>{
  const images=await Promise.all(encoded.map(data=>createImageBitmap(new Blob([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],{type:'image/png'}))));
  if(images[0].width!==images[1].width||images[0].height!==images[1].height)throw new Error('Canvas screenshot dimensions changed during comparison.');
  const pixels=images.map(img=>{const c=new OffscreenCanvas(img.width,img.height),ctx=c.getContext('2d')!;ctx.drawImage(img,0,0);const p=ctx.getImageData(0,0,img.width,img.height).data;img.close();return p;});let changed=0;
  for(let i=0;i<pixels[0].length;i+=4)if(Math.abs(pixels[0][i]-pixels[1][i])+Math.abs(pixels[0][i+1]-pixels[1][i+1])+Math.abs(pixels[0][i+2]-pixels[1][i+2])>18)changed++;
  return changed/(pixels[0].length/4);
 },[a.toString('base64'),b.toString('base64')]);
}
async function tilt(page:Page,pitch:number,gyro=[0,0,0]){await page.evaluate(({pitch,gyro})=>Object.assign((window as any).__retinaMotion,{pitch,gyro}),{pitch,gyro});}
async function nativeReady(page:Page){
 // Never compete with the owner's real helper; these labelled packets test the native mapping.
 await page.route('http://127.0.0.1:19876/**',route=>route.abort());
 await page.goto('/behind-the-bar/diagnostics?preset=stir-demo');await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:25000});
 await page.evaluate(()=>{const w=window as any,n=w.__btbNative,f=w.__retinaMotion={seq:0,pitch:0,gyro:[0,0,0]};f.timer=setInterval(()=>n.accept({v:1,session:'d'.repeat(32),seq:++f.seq,expires:Date.now()+600000,accel:[0,Math.sin(f.pitch),-Math.cos(f.pitch)],gyro:f.gyro,t:performance.now()/1000,sampleEpoch:Date.now(),unit:'g-deg/s',kind:'native-spu'}),16);});
 await expect.poll(()=>page.evaluate(()=>window.__btbNative!.received)).toBeGreaterThanOrEqual(60);
 await page.locator('.btb-live-motion').getByRole('button',{name:'Calibrate',exact:true}).click();
}

test('Retina native stirring and straining change visible pixels through pause, resize and resume',async({page})=>{
 const errors:string[]=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('pageerror',e=>errors.push(e.message));
 await nativeReady(page);
 const dimensions=await page.locator('.btb-canvas').evaluate((c:HTMLCanvasElement)=>({css:c.clientWidth,buffer:c.width,dpr:devicePixelRatio}));expect(dimensions).toEqual({css:885,buffer:1327,dpr:2});
 const still=await capture(page,'stir-rest');
 await page.locator('.btb-live-motion').getByRole('button',{name:'Arm stirring',exact:true}).click();await tilt(page,0,[0,-24,0]);
 await expect.poll(()=>page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4])).toBeGreaterThan(2);
 const stirChange=await changedPixels(page,still,await capture(page,'stir-moving'));expect(stirChange).toBeGreaterThan(.005);
 await tilt(page,0);await page.locator('.btb-live-motion').getByRole('button',{name:'Disarm',exact:true}).click();
 await page.getByRole('button',{name:'Strain',exact:true}).click();await page.waitForTimeout(650);
 const rest=await capture(page,'strain-rest');const initial=await page.evaluate(()=>window.__btb!.model.mix.core);
 await page.locator('.btb-live-motion').getByRole('button',{name:'Arm pour',exact:true}).click();await tilt(page,.24);
 await expect.poll(()=>page.evaluate(()=>window.__btb!.model.serving.core)).toBeGreaterThan(.07);
 const pouring=await page.evaluate(()=>({model:window.__btb!.model.snapshot(),scene:window.__btb!.scene!.inspect()}));
 expect(pouring.model.mix.core).toBeLessThan(initial-.07);expect(pouring.scene.stream.visible).toBe(true);expect(pouring.scene.renderedPourAngle).toBeGreaterThan(.4);
 const flow=await capture(page,'strain-flow');const pourChange=await changedPixels(page,rest,flow);expect(pourChange).toBeGreaterThan(.02);
 await page.waitForTimeout(700);const flowChange=await changedPixels(page,flow,await capture(page,'strain-flow-later'));expect(flowChange).toBeGreaterThan(.001);
 await tilt(page,0);await expect.poll(()=>page.evaluate(()=>({tilt:window.__btb!.model.pourTilt,transit:window.__btb!.model.transit.length})),{timeout:10000}).toEqual({tilt:0,transit:0});
 await page.waitForTimeout(750);const pauseChange=await changedPixels(page,flow,await capture(page,'strain-paused'));expect(pauseChange).toBeGreaterThan(.02);
  const paused=await page.evaluate(()=>window.__btb!.model.snapshot());expect(await page.evaluate(()=>window.__btb!.scene!.inspect().stream.visible)).toBe(false);
  // Cross odd/even pixel widths and the mobile breakpoint without recreating the scene.
  const disarm=page.locator('.btb-live-motion').getByRole('button',{name:'Disarm',exact:true});if(await disarm.count())await disarm.click();
  for(const width of [1513,1440,390,1512]){await page.setViewportSize({width,height:806});await page.waitForTimeout(300);expect(errors,`Rendering after viewport width ${width}`).toEqual([]);}
  expect(await page.evaluate(()=>window.__btb!.model.serving)).toEqual(paused.serving);
  // Resizing can stall delivery and must never imply that stale motion silently rearms.
  await page.locator('.btb-live-motion').getByRole('button',{name:'Arm pour',exact:true}).click();
  await tilt(page,.24);await expect.poll(()=>page.evaluate(()=>window.__btb!.model.serving.core)).toBeGreaterThan(paused.serving.core+.025);
 expect(await page.evaluate(()=>window.__btb!.scene!.inspect().stream.visible)).toBe(true);await capture(page,'strain-resumed');
 await page.locator('.btb-live-motion').getByRole('button',{name:'Disarm',exact:true}).click();
 expect(errors).toEqual([]);expect(await page.evaluate(()=>window.__btb!.scene!.diagnostics.errors)).toEqual([]);
 const report={dimensions,stirChange,pourChange,flowChange,pauseChange,errors,pouring,paused};writeFileSync(path.join(evidence,'visible-motion.json'),JSON.stringify(report,null,2));
});

test('a real WebGPU validation error pauses accounting and retry preserves the drink',async({page})=>{
 await page.addInitScript(()=>{const request=GPUAdapter.prototype.requestDevice;GPUAdapter.prototype.requestDevice=async function(...args){const d=await request.apply(this,args);(window as any).__renderTestDevice=d;return d;};});
 await page.goto('/behind-the-bar/diagnostics?preset=stir-demo');await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:25000});
 await page.getByRole('button',{name:'Strain',exact:true}).click();await page.getByRole('button',{name:'Pour',exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.__btb!.model.serving.core)).toBeGreaterThan(.02);
 // An invalid write produces an actual backend validation event, not an injected UI status.
 await page.evaluate(()=>{const d=(window as any).__renderTestDevice as GPUDevice,b=d.createBuffer({size:4,usage:GPUBufferUsage.COPY_DST});b.destroy();d.queue.writeBuffer(b,0,new Uint32Array([1]));});
 await expect(page.locator('.btb-render-status')).toContainText('Scene could not continue. Pouring is paused. Retry scene to recover.');
 const paused=await page.evaluate(()=>window.__btb!.model.snapshot());expect(paused.armed).toBeNull();expect(paused.pourTilt).toBe(0);
 expect((await page.evaluate(()=>window.__btb!.scene!.diagnostics.errors)).length).toBeGreaterThan(0);
 await page.waitForTimeout(500);expect(await page.evaluate(()=>window.__btb!.model.snapshot())).toEqual(paused);
 await page.getByRole('button',{name:'Retry scene',exact:true}).click();await expect(page.getByRole('button',{name:'Retry scene',exact:true})).toHaveCount(0);await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:25000});
 const recovered=await page.evaluate(()=>window.__btb!.model.snapshot());expect(recovered.mix).toEqual(paused.mix);
 for(const component of ['core','ancho','rice'] as const){const inFlight=paused.transit.reduce((n,p)=>n+p.q[component],0);expect(recovered.serving[component]).toBeCloseTo(paused.serving[component]+inFlight,7);expect(Math.abs(recovered.conservation[component])).toBeLessThan(1e-7);}
 const before=await capture(page,'recovered-rest');await page.getByRole('button',{name:'Pour',exact:true}).click();await page.waitForTimeout(900);
 expect(await changedPixels(page,before,await capture(page,'recovered-pour'))).toBeGreaterThan(.02);expect(await page.evaluate(()=>window.__btb!.scene!.diagnostics.errors)).toEqual([]);
});
