import {expect,test} from '@playwright/test';
import {readFileSync,statSync} from 'node:fs';
import {drinksForFamily,categoriesForFamily,barById} from '../src/data/drinks';

const drinks=drinksForFamily('espresso-martini');
const ids=['atlas-espresso-martini','jigger-espresso-martini','nighthawks'];
test('espresso collection has independently sourced venues and genuine editable six-row assets',()=>{
  expect(drinks.map(d=>d.id)).toEqual(ids);
  expect(new Set(drinks.map(d=>d.barId)).size).toBe(3);
  for(const drink of drinks){
    expect(drink.source.kind).toBe('menu');
    expect(drink.source.version).toContain('2024');
    expect(drink.source.links?.some(s=>s.label==='Official menu')).toBe(true);
    expect(drink.ratios).toBeNull();
    expect(drink.ingredients.map(i=>i.category)).toEqual(categoriesForFamily(drink.family).map(c=>c.id));
    for(const ingredient of drink.ingredients){expect(ingredient.quantity).toBeNull();expect(ingredient.unit).toBeNull()}
    const venue=barById[drink.barId];expect(venue.coordinates[0]).toBeGreaterThan(103.8);expect(venue.coordinates[1]).toBeGreaterThan(1.2);
    expect(venue.verificationSources.some(s=>s.includes('onemap.gov.sg'))).toBe(true);
    const binary=readFileSync(`public${drink.assets.model}`);
    expect(binary.toString('ascii',0,4)).toBe('glTF');expect(binary.readUInt32LE(8)).toBe(binary.length);
    const gltf=JSON.parse(binary.toString('utf8',20,20+binary.readUInt32LE(12)).trim());
    const nodes=gltf.nodes.filter((n:any)=>n.mesh!==undefined);
    expect(nodes.some((n:any)=>n.extras?.scenePartId==='glass')).toBe(true);
    expect(nodes.some((n:any)=>n.extras?.scenePartId==='ice')).toBe(false);
    expect(nodes.some((n:any)=>n.extras?.role==='mixture')).toBe(true);
    const rows=new Set(nodes.map((n:any)=>n.extras?.ingredientId));
    expect([...rows].sort()).toEqual(categoriesForFamily(drink.family).map(c=>c.id).sort());
    const manifest=JSON.parse(readFileSync(`assets/blender/${drink.id}.json`,'utf8'));
    expect(manifest.parts.map((p:any)=>p.id).sort()).toEqual(nodes.map((n:any)=>n.extras.scenePartId).sort());
    expect(statSync(`assets/blender/${drink.id}.blend`).size).toBeGreaterThan(1024);
  }
});

for(const id of ids)test(`${id} loads live, explores six actual component rows and reverses without residue`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/?drink=${id}`);
  const viewer=page.getByTestId(`viewer-${id}`);
  await expect(viewer).toHaveAttribute('data-live','true',{timeout:45000});
  const assembled=await page.evaluate(id=>structuredClone(window.__atlasViewers[id]),id);
  expect(assembled.parts.some(p=>p.role==='mixture'&&p.visible)).toBe(true);
  expect(assembled.parts.filter(p=>p.role==='recipe').every(p=>!p.visible)).toBe(true);
  await viewer.focus();await page.keyboard.press('ArrowRight');
  await expect.poll(()=>page.evaluate(id=>window.__atlasViewers[id].camera.azimuth,id)).toBeCloseTo(.2,3);
  await info.attach(`${id}-assembled`,{body:await viewer.screenshot(),contentType:'image/png'});
  await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(id=>window.__atlasViewers[id].e,id)).toBe(1);
  const expanded=await page.evaluate(id=>structuredClone(window.__atlasViewers[id]),id);
  expect(expanded.parts.filter(p=>p.role==='recipe').every(p=>p.visible)).toBe(true);
  expect(expanded.parts.filter(p=>p.role==='mixture').every(p=>!p.visible)).toBe(true);
  expect(new Set(expanded.parts.filter(p=>p.visible).map(p=>p.category)).size).toBe(6);
  expect(expanded.parts.filter(p=>p.category==='garnish').some(p=>p.position[1]!==assembled.parts.find(q=>q.id===p.id)!.position[1])).toBe(true);
  await expect(viewer.locator('.ingredient-labels button')).toHaveCount(6);
  await info.attach(`${id}-expanded`,{body:await viewer.screenshot(),contentType:'image/png'});
  await page.keyboard.press('Space');
  await expect.poll(()=>page.evaluate(id=>window.__atlasViewers[id].e,id)).toBe(0);
  const restored=await page.evaluate(id=>structuredClone(window.__atlasViewers[id]),id);
  for(const part of restored.parts)expect(part.position).toEqual(assembled.parts.find(q=>q.id===part.id)!.position);
  expect(errors).toEqual([]);
});

test('three espresso viewers synchronize orbit and expansion and stop drawing at rest',async({page},info)=>{
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto(`/?compare=${ids.join(',')}&expand=0`);
  for(const id of ids)await expect(page.getByTestId(`viewer-${id}`)).toHaveAttribute('data-live','true',{timeout:45000});
  const lead=page.getByTestId(`viewer-${ids[0]}`);await lead.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('Space');
  for(const id of ids){
    await expect.poll(()=>page.evaluate(id=>window.__atlasViewers[id].e,id)).toBe(1);
    expect(await page.evaluate(id=>window.__atlasViewers[id].camera.azimuth,id)).toBeCloseTo(.2,3);
  }
  await info.attach('espresso-comparison-expanded',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  await page.waitForTimeout(1000);
  const before=await page.evaluate(ids=>ids.map(id=>window.__atlasViewers[id].renderedFrames),ids);
  await page.waitForTimeout(1000);
  expect(await page.evaluate(ids=>ids.map(id=>window.__atlasViewers[id].renderedFrames),ids)).toEqual(before);
});

test('espresso loading and failed download retain the recipe and recover on retry',async({page})=>{
  let release!:()=>void;const pending=new Promise<void>(resolve=>release=resolve);let fail=true;
  await page.route('**/models/atlas-espresso-martini.glb*',async route=>{await pending;if(fail)await route.abort();else await route.continue()});
  await page.goto('/?drink=atlas-espresso-martini');
  try{await expect(page.getByText('Preparing live 3D',{exact:false})).toBeVisible()}finally{release()}
  await expect(page.getByText('3D model could not load.',{exact:true})).toBeVisible();
  await expect(page.getByRole('heading',{name:'ATLAS Espresso Martini',exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Explore ingredients',exact:true})).toBeEnabled();
  fail=false;await page.getByRole('button',{name:'Retry 3D',exact:true}).click();
  await expect(page.getByTestId('viewer-atlas-espresso-martini')).toHaveAttribute('data-live','true',{timeout:45000});
});

test('phone espresso viewer responds to touch orbit and exposes accessible recipe controls',async({browser,baseURL},info)=>{
  const context=await browser.newContext({baseURL,viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true,reducedMotion:'reduce'});
  try{
    const page=await context.newPage();await page.goto('/?drink=nighthawks');
    const viewer=page.getByTestId('viewer-nighthawks');await viewer.scrollIntoViewIfNeeded();
    await expect(viewer).toHaveAttribute('data-live','true',{timeout:45000});
    await viewer.evaluate(el=>{
      const rect=el.getBoundingClientRect(),x=rect.x+rect.width*.6,y=rect.y+rect.height*.5;
      el.dispatchEvent(new PointerEvent('pointerdown',{pointerId:7,pointerType:'touch',clientX:x,clientY:y,bubbles:true}));
      // Browser pointer capture is unavailable for a synthetic pointer. Preserve
      // the real movement handler and suppress only that native capture call.
      const native=el.setPointerCapture;el.setPointerCapture=()=>{};
      try{el.dispatchEvent(new PointerEvent('pointermove',{pointerId:7,pointerType:'touch',clientX:x-80,clientY:y+30,bubbles:true}))}finally{el.setPointerCapture=native}
      el.dispatchEvent(new PointerEvent('pointerup',{pointerId:7,pointerType:'touch',bubbles:true}));
    });
    await expect.poll(()=>page.evaluate(()=>window.__atlasViewers.nighthawks.camera.azimuth)).toBeCloseTo(.72,3);
    expect(await page.evaluate(()=>window.__atlasViewers.nighthawks.camera.elevation)).toBeCloseTo(.16,3);
    await page.getByRole('button',{name:'Explore ingredients',exact:true}).click();
    await viewer.scrollIntoViewIfNeeded();await expect.poll(()=>page.evaluate(()=>window.__atlasViewers.nighthawks.e)).toBe(1);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);
    await info.attach('phone-espresso-expanded',{body:await page.screenshot({fullPage:true}),contentType:'image/png'});
  }finally{await context.close()}
});
