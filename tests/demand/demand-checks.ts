import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { drinkIds, snapshot, viewer, waitLive, positionError, cameraPositionError, observedAzimuth, type DrinkId, type ViewerSnapshot } from '../helpers';
type State=ViewerSnapshot & {renderedFrames:number;renderedAt:number;parts:(ViewerSnapshot['parts'][number]&{emissive:string|null;emissiveIntensity:number|null})[]};
const read=async(page:Page,id:DrinkId)=>(await snapshot(page,id)) as State;
const collect=async(page:Page,ids:readonly DrinkId[])=>Object.fromEntries(await Promise.all(ids.map(async id=>[id,await read(page,id)]))) as Record<DrinkId,State>;
async function attach(info:TestInfo,name:string,value:unknown){await info.attach(name,{body:JSON.stringify(value,null,2),contentType:'application/json'});}
async function idle(page:Page,ids:readonly DrinkId[],info:TestInfo,name:string){
  const observations:unknown[]=[];let last='',stableAt=Date.now(),stable=false;
  for(const deadline=Date.now()+15_000;Date.now()<deadline;){
    const states=await collect(page,ids),counts=ids.map(id=>states[id].renderedFrames);
    counts.forEach(n=>expect(Number.isInteger(n)&&n>0,'Actual completed-frame telemetry exists').toBe(true));
    const key=counts.join(',');if(key!==last){last=key;stableAt=Date.now();}observations.push({at:Date.now(),counts});
    if(Date.now()-stableAt>=600){stable=true;break;}await page.waitForTimeout(120);
  }
  expect(stable,'Viewer reaches rest without continuing its render loop').toBe(true);
  const before=await collect(page,ids);await page.waitForTimeout(1100);const after=await collect(page,ids);
  for(const id of ids){expect(after[id].renderedFrames,`${id}: no additional draws during the 1100ms idle observation`).toBe(before[id].renderedFrames);expect(after[id].renderedAt).toBe(before[id].renderedAt);}
  await attach(info,name,{observations,before,after});return after;
}
async function wake(page:Page,id:DrinkId,before:State){await expect.poll(async()=> (await read(page,id)).renderedFrames).toBeGreaterThan(before.renderedFrames);return read(page,id);}
async function endpoint(page:Page,ids:readonly DrinkId[],target:number){for(const id of ids)await expect.poll(async()=> (await read(page,id)).e,{intervals:[20,40,80,120]}).toBe(target);}
function stageAt(state:State,e:number){expect(state.stage).toBeDefined();expect(state.stage!.backgroundBlurriness).toBeCloseTo(.05+.05*e,5);expect(state.stage!.backgroundIntensity).toBeCloseTo(.6-.26*e,5);expect(state.stage!.stoneStrength).toBeCloseTo(.16-.04*e,5);expect(state.stage!.environmentIntensity).toBe(1);}

test.beforeEach(async({page,browser},info)=>{
  const errors:string[]=[];(info as TestInfo & {runtimeErrors:string[]}).runtimeErrors=errors;
  page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&/shader|framebuffer|texture|WebGL/i.test(m.text()))errors.push(m.text());});
  const paths=['src/scenes/Viewer.tsx','src/scenes/BarEnvironment.tsx','src/scenes/useViewerVisibility.ts',...drinkIds.map(id=>`public/models/${id}.glb`)];
  await attach(info,'demand-provenance',{browser:browser.version(),startedAt:new Date().toISOString(),sources:paths.map(path=>{const b=readFileSync(path);return{path,bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')}})});
});
test.afterEach(async({},info)=>{
  const errors=(info as TestInfo & {runtimeErrors:string[]}).runtimeErrors;
  await attach(info,'demand-runtime-errors',errors);
  if(info.title==='model retry starts a complete demand draw then returns to idle'){
    // This case deliberately aborts precisely this request; preserve and require its loader error.
    expect(errors).toEqual(['Error: Could not load /models/negroni-express.glb?revision=0.15.1-baked: Failed to fetch']);
  }else expect(errors).toEqual([]);
});

test('idle viewer wakes on first orbit, zoom, reset and actual material selection',async({page},info)=>{
  const id='negroni-express';await page.goto('/?drink='+id+'&expand=1');await waitLive(page,[id]);await endpoint(page,[id],1);
  const initial=(await idle(page,[id],info,'initial-expanded-idle'))[id];
  await viewer(page,id).focus();await page.keyboard.press('ArrowRight');await wake(page,id,initial);
  const rotated=(await idle(page,[id],info,'first-orbit-idle'))[id];expect(Math.abs(observedAzimuth(rotated)-observedAzimuth(initial))).toBeGreaterThan(.15);
  await viewer(page,id).getByRole('button',{name:'Zoom in',exact:true}).click();await wake(page,id,rotated);
  const zoomed=(await idle(page,[id],info,'first-zoom-idle'))[id];expect(cameraPositionError(rotated,zoomed)).toBeGreaterThan(.1);
  await page.getByRole('button',{name:'Reset view',exact:true}).click();await wake(page,id,zoomed);
  const reset=(await idle(page,[id],info,'reset-idle'))[id];expect(cameraPositionError(initial,reset)).toBeLessThan(.0001);
  await viewer(page,id).locator('.ingredient-labels button[data-category="garnish"]').click();await wake(page,id,reset);
  const highlighted=(await idle(page,[id],info,'material-selection-idle'))[id];
  for(const part of highlighted.parts.filter(p=>p.category==='garnish')){expect(part.emissive).not.toBe('000000');expect(part.emissiveIntensity).toBeGreaterThan(.2);}
  await info.attach('highlighted-viewer',{body:await viewer(page,id).screenshot(),contentType:'image/png'});
});

test('partial expansion, mid-animation reversal and reduced motion finish exactly with the stage',async({page},info)=>{
  const id='negroni-express';await page.goto('/?drink='+id+'&expand=0');await waitLive(page,[id]);const assembled=(await idle(page,[id],info,'assembled-idle'))[id];stageAt(assembled,0);
  const slider=page.getByLabel('Expansion',{exact:true}),box=await slider.boundingBox();expect(box).not.toBeNull();await slider.click({position:{x:box!.width*.5,y:box!.height/2}});const target=Number(await slider.inputValue());expect(target).toBeGreaterThan(.3);expect(target).toBeLessThan(.7);await endpoint(page,[id],target);const partial=(await idle(page,[id],info,'partial-idle'))[id];stageAt(partial,target);
  await slider.focus();await page.keyboard.press('Home');await endpoint(page,[id],0);await idle(page,[id],info,'partial-to-zero-idle');
  await page.getByRole('button',{name:'Explore ingredients',exact:true}).click();await expect.poll(async()=>(await read(page,id)).e,{intervals:[20]}).toBeGreaterThan(.15);const turning=await read(page,id);expect(turning.e).toBeLessThan(.95);
  await page.getByRole('button',{name:'Reassemble drink',exact:true}).click();await endpoint(page,[id],0);const reversed=(await idle(page,[id],info,'reversed-idle'))[id];expect(positionError(assembled,reversed)).toBeLessThan(.0001);stageAt(reversed,0);
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Explore ingredients',exact:true}).click();await endpoint(page,[id],1);const reduced=(await idle(page,[id],info,'reduced-expanded-idle'))[id];stageAt(reduced,1);
  await page.getByRole('button',{name:'Reassemble drink',exact:true}).click();await endpoint(page,[id],0);const final=(await idle(page,[id],info,'reduced-assembled-idle'))[id];expect(positionError(assembled,final)).toBeLessThan(.0001);stageAt(final,0);
});

test('comparison visibility reentry and resize wake stale canvases with synchronized state',async({page},info)=>{
  await page.goto('/?compare='+drinkIds.join(',')+'&expand=0');await waitLive(page,drinkIds);await endpoint(page,drinkIds,0);const initial=await idle(page,drinkIds,info,'comparison-desktop-idle');
  await page.setViewportSize({width:390,height:844});await page.getByLabel('Drink in view',{exact:true}).selectOption(drinkIds[0]);await viewer(page,drinkIds[0]).scrollIntoViewIfNeeded();await idle(page,drinkIds,info,'comparison-phone-idle');
  const hiddenBefore=await read(page,drinkIds[2]);const rect=await viewer(page,drinkIds[2]).boundingBox();expect(rect!.x).toBeGreaterThanOrEqual(390);
  await page.getByRole('button',{name:'Expand all',exact:true}).click();await endpoint(page,[drinkIds[0]],1);await viewer(page,drinkIds[0]).focus();await page.keyboard.press('ArrowRight');const first=(await idle(page,[drinkIds[0]],info,'comparison-visible-input-idle'))[drinkIds[0]];
  expect((await read(page,drinkIds[2])).renderedFrames,'Offscreen model does not render controlled changes while hidden').toBe(hiddenBefore.renderedFrames);
  await page.getByLabel('Drink in view',{exact:true}).selectOption(drinkIds[2]);await viewer(page,drinkIds[2]).scrollIntoViewIfNeeded();await wake(page,drinkIds[2],hiddenBefore);await endpoint(page,[drinkIds[2]],1);const reentered=(await idle(page,[drinkIds[2]],info,'comparison-reentry-idle'))[drinkIds[2]];expect(observedAzimuth(reentered)).toBeCloseTo(observedAzimuth(first),6);
  const smallWidth=await viewer(page,drinkIds[2]).locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width);const beforeResize=await collect(page,drinkIds);await page.setViewportSize({width:1440,height:900});for(const id of drinkIds)await viewer(page,id).scrollIntoViewIfNeeded();await endpoint(page,drinkIds,1);const resized=await idle(page,drinkIds,info,'comparison-resize-idle');for(const id of drinkIds)expect(resized[id].renderedFrames).toBeGreaterThan(beforeResize[id].renderedFrames);expect(await viewer(page,drinkIds[2]).locator('canvas').evaluate(c=>(c as HTMLCanvasElement).width)).not.toBe(smallWidth);
  await page.getByRole('button',{name:'Reset alignment',exact:true}).click();await idle(page,drinkIds,info,'comparison-reset-idle');for(const id of drinkIds)expect(observedAzimuth(await read(page,id))).toBeCloseTo(observedAzimuth(initial[id]),6);
});

test('model retry starts a complete demand draw then returns to idle',async({page},info)=>{
  const id='negroni-express';let reject=true;await page.route('**/models/negroni-express.glb*',route=>reject?route.abort('failed'):route.continue());await page.goto('/?drink='+id+'&expand=0');await expect(page.getByText('3D model could not load.',{exact:true})).toBeVisible();reject=false;await page.getByRole('button',{name:'Retry 3D',exact:true}).click();await waitLive(page,[id]);await endpoint(page,[id],0);const recovered=(await idle(page,[id],info,'retry-recovered-idle'))[id];expect(recovered.parts.some(p=>p.normalMap?.width===2048)).toBe(true);
});

test('isolated real stage components invalidate their own background and stone transitions',async({page},info)=>{
  await page.goto('http://127.0.0.1:5173/tests/demand/stage-harness.html');await page.waitForFunction(()=>Boolean((window as any).__stageDemandProbe?.renderedFrames));
  const probe=()=>page.evaluate(()=>({...((window as any).__stageDemandProbe)}));
  async function resting(name:string){await expect.poll(async()=>{const a=await probe();await page.waitForTimeout(500);const b=await probe();return b.renderedFrames-a.renderedFrames;}).toBe(0);const a=await probe();await page.waitForTimeout(1100);const b=await probe();expect(b.renderedFrames).toBe(a.renderedFrames);await attach(info,name,b);return b;}
  const initial=await resting('stage-only-initial');await page.getByRole('button',{name:'Change background only'}).click();await expect.poll(async()=>(await probe()).intensity).toBe(.28);const background=await resting('stage-only-background');expect(background.renderedFrames).toBeGreaterThan(initial.renderedFrames);expect(background.blur).toBe(.13);expect(background.strength).toBe(.16);
  await page.getByRole('button',{name:'Change stone only'}).click();await expect.poll(async()=>(await probe()).strength).toBe(.07);const stone=await resting('stage-only-stone');expect(stone.renderedFrames).toBeGreaterThan(background.renderedFrames);expect(stone.blur).toBe(.13);
  await page.getByRole('button',{name:'Reduced stage change'}).click();await expect.poll(async()=>(await probe()).strength).toBe(.11);const reduced=await resting('stage-only-reduced');expect(reduced.blur).toBe(.08);expect(reduced.intensity).toBe(.5);
});

test('WebKit demand viewer stops at rest and wakes on first input and expansion',async({page},info)=>{
  const id='negroni-express';await page.goto('/?drink='+id+'&expand=0');await waitLive(page,[id]);const initial=(await idle(page,[id],info,'webkit-initial-idle'))[id];await viewer(page,id).focus();await page.keyboard.press('ArrowRight');await wake(page,id,initial);const moved=(await idle(page,[id],info,'webkit-first-input-idle'))[id];expect(Math.abs(observedAzimuth(moved)-observedAzimuth(initial))).toBeGreaterThan(.15);
  await page.getByRole('button',{name:'Explore ingredients',exact:true}).click();await endpoint(page,[id],1);const expanded=(await idle(page,[id],info,'webkit-expanded-idle'))[id];stageAt(expanded,1);await page.getByRole('button',{name:'Reassemble drink',exact:true}).click();await endpoint(page,[id],0);const final=(await idle(page,[id],info,'webkit-reassembled-idle'))[id];expect(positionError(initial,final)).toBeLessThan(.0001);
});
