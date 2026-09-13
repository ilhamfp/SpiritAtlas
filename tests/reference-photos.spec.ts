import {expect, test, type Locator, type Page} from '@playwright/test';
import {createHash} from 'node:crypto';
import {readFileSync, statSync} from 'node:fs';
import {drinks, drinksForFamily} from '../src/data/drinks';
import {drinkReferences, missingReferenceNotes} from '../src/data/drinkReferences';

type View = {ready:boolean;e:number;renderedFrames:number;camera:Record<string,unknown>;parts:{id:string;position:number[];rotation:number[];scale:number[];visible:boolean}[]};
const view=(page:Page,id:string):Promise<View> => page.evaluate(id => structuredClone((window as unknown as {__atlasViewers:Record<string,View>}).__atlasViewers[id]),id);
const wrapper=(page:Page,id:string) => page.getByTestId(`reference-viewer-${id}`);
const model=(page:Page,id:string) => page.getByTestId(`viewer-${id}`);
async function live(page:Page,id:string,e:number) {
  await expect(model(page,id)).toHaveAttribute('data-live','true',{timeout:45000});
  await expect.poll(async () => (await view(page,id))?.e).toBe(e);
}
async function loadedPhoto(page:Page,id:string) {
  const reference=drinkReferences[id]!,stage=page.getByTestId(`reference-photo-${id}`);
  const image=stage.getByRole('img',{name:reference.alt,exact:true});
  await expect(stage).toBeVisible();await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((image:HTMLImageElement) => image.complete&&image.naturalWidth>0)).toBe(true);
  await expect(stage).toHaveAttribute('data-status','ready');await expect(image).toHaveCSS('opacity','1');
  await expect(stage).toContainText(reference.caption);await expect(stage).toContainText(reference.credit);
  if (reference.sourceUrl) await expect(stage.locator('a').filter({hasText:reference.sourceLabel!})).toHaveAttribute('href',reference.sourceUrl);
  return {stage,image};
}
async function hiddenModel(host:Locator) {
  expect(await host.evaluate(element => Boolean(element.closest('[inert]')))).toBe(true);
  expect(await host.evaluate(element => Boolean(element.closest('[aria-hidden="true"]')))).toBe(true);
}
function preserved(before:View,after:View) {
  expect(after.e).toBe(before.e);expect(after.camera).toEqual(before.camera);
  expect(after.parts.map(part => ({id:part.id,position:part.position,rotation:part.rotation,scale:part.scale,visible:part.visible})))
    .toEqual(before.parts.map(part => ({id:part.id,position:part.position,rotation:part.rotation,scale:part.scale,visible:part.visible})));
}

test('eleven local references retain credited source provenance and Pine has an explicit missing-photo note',() => {
  const manifest=JSON.parse(readFileSync('references/embedded-reference-manifest.json','utf8')) as {references:{drinkId:string;sourcePath:string;publicPath:string;src:string;sha256:string;sourceSha256:string;exactCopy:boolean;originalUnchanged:boolean;bytes:number;dimensions:number[]}[]};
  expect(Object.keys(drinkReferences)).toHaveLength(11);
  expect(Object.keys(missingReferenceNotes)).toEqual(['somma-pine-highball']);
  expect([...Object.keys(drinkReferences),...Object.keys(missingReferenceNotes)].sort()).toEqual(drinks.map(drink => drink.id).sort());
  expect(manifest.references.map(reference => reference.drinkId).sort()).toEqual(Object.keys(drinkReferences).sort());
  for (const [id,reference] of Object.entries(drinkReferences)) {
    expect(reference).toBeDefined();expect(reference!.src).toMatch(/^\/references\/[a-z0-9-]+\.(png|jpg)$/);
    for (const text of [reference!.alt,reference!.caption,reference!.credit]) expect(text.trim()).not.toBe('');
    if (reference!.sourceUrl) {expect(new URL(reference!.sourceUrl).protocol).toBe('https:');expect(reference!.sourceLabel?.trim()).toBeTruthy()}
    const record=manifest.references.find(record => record.drinkId===id)!;
    expect(record.src).toBe(reference!.src);expect(record.publicPath).toBe(`public${reference!.src}`);
    expect(record.exactCopy).toBe(true);expect(record.originalUnchanged).toBe(true);
    expect(record.bytes).toBeGreaterThan(1000);expect(statSync(record.publicPath).size).toBe(record.bytes);
    const hash=(path:string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    expect(hash(record.publicPath)).toBe(record.sha256);expect(hash(record.sourcePath)).toBe(record.sourceSha256);expect(record.sha256).toBe(record.sourceSha256);
    expect(record.dimensions).toHaveLength(2);expect(record.dimensions.every(size => size>100)).toBe(true);
  }
});

test('a Martini loads its photo only on request and resumes the same mounted 3D pose and camera',async ({page},info) => {
  const id='atlas-martini',requested:string[]=[];
  page.on('request',request => {const path=new URL(request.url()).pathname;if(path.startsWith('/references/'))requested.push(path)});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`/?drink=${id}&expand=0.43`);await live(page,id,.43);
  const host=model(page,id),originalNode=await host.elementHandle(),controls=wrapper(page,id);
  await expect(controls.getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(requested).toEqual([]);
  await host.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');
  await expect.poll(async () => (await view(page,id)).camera.azimuth).toBeCloseTo(.2,5);
  await expect.poll(async () => (await view(page,id)).camera.zoom).toBeCloseTo(1.1,5);
  const before=await view(page,id);
  await controls.getByRole('button',{name:'Reference photo',exact:true}).click();const {stage}=await loadedPhoto(page,id);
  await expect(controls.getByRole('button',{name:'Reference photo',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(requested).toEqual([drinkReferences[id]!.src]);await hiddenModel(host);
  expect(await originalNode!.evaluate((element,id) => element.isConnected&&document.querySelector(`[data-testid="viewer-${id}"]`)===element,id)).toBe(true);
  await page.waitForTimeout(250);const paused=(await view(page,id)).renderedFrames;await page.waitForTimeout(350);expect((await view(page,id)).renderedFrames).toBe(paused);
  const photo=info.outputPath('atlas-martini-reference-photo.png');await stage.screenshot({path:photo});await info.attach('atlas-martini-reference-photo',{path:photo,contentType:'image/png'});
  await controls.getByRole('button',{name:'3D model',exact:true}).click();await live(page,id,.43);
  await expect(controls.getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');
  expect(await host.evaluate(element => Boolean(element.closest('[inert],[aria-hidden="true"]')))).toBe(false);
  expect(await originalNode!.evaluate((element,id) => element.isConnected&&document.querySelector(`[data-testid="viewer-${id}"]`)===element,id)).toBe(true);
  preserved(before,await view(page,id));
  await host.focus();await page.keyboard.press('ArrowRight');await expect.poll(async () => (await view(page,id)).camera.azimuth).toBeCloseTo(.4,5);
});

test('comparison photos switch independently and shared expansion restores every live viewer',async ({page},info) => {
  test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
  const ids=drinksForFamily('martini').map(drink => drink.id);
  await page.goto(`/?compare=${ids.join(',')}&sync=0`);for (const id of ids) await live(page,id,1);
  await model(page,ids[0]).focus();await page.keyboard.press('ArrowRight');await model(page,ids[1]).focus();await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => (await view(page,ids[0])).camera.azimuth).toBeCloseTo(.2,5);await expect.poll(async () => (await view(page,ids[1])).camera.azimuth).toBeCloseTo(-.2,5);
  const first=await view(page,ids[0]),second=await view(page,ids[1]);
  for (const id of ids.slice(0,2)) {await wrapper(page,id).getByRole('button',{name:'Reference photo',exact:true}).click();await loadedPhoto(page,id);await hiddenModel(model(page,id))}
  // Legacy negative canvas margins must not clip photo controls or captions at
  // the scroller edges when all three desktop columns fit in the viewport.
  const scrollBounds=(await page.locator('.comparison-scroll').boundingBox())!;
  for (const id of ids) {
    const controls=(await wrapper(page,id).locator('.reference-toolbar').boundingBox())!;
    expect(controls.x).toBeGreaterThanOrEqual(scrollBounds.x-.5);
    expect(controls.x+controls.width).toBeLessThanOrEqual(scrollBounds.x+scrollBounds.width+.5);
  }
  for (const id of ids.slice(0,2)) {
    const photo=(await page.getByTestId(`reference-photo-${id}`).boundingBox())!;
    expect(photo.x).toBeGreaterThanOrEqual(scrollBounds.x-.5);
    expect(photo.x+photo.width).toBeLessThanOrEqual(scrollBounds.x+scrollBounds.width+.5);
  }
  await expect(wrapper(page,ids[2]).getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');
  await model(page,ids[2]).focus();await page.keyboard.press('ArrowRight');await expect.poll(async () => (await view(page,ids[2])).camera.azimuth).toBeCloseTo(.2,5);
  await page.waitForTimeout(250);const stopped=await Promise.all(ids.slice(0,2).map(async id => (await view(page,id)).renderedFrames));await page.waitForTimeout(350);
  expect(await Promise.all(ids.slice(0,2).map(async id => (await view(page,id)).renderedFrames))).toEqual(stopped);
  const capture=info.outputPath('independent-comparison-reference-photos.png');await page.locator('.comparison-columns').screenshot({path:capture});await info.attach('independent-comparison-reference-photos',{path:capture,contentType:'image/png'});
  await wrapper(page,ids[0]).getByRole('button',{name:'3D model',exact:true}).click();await live(page,ids[0],1);preserved(first,await view(page,ids[0]));
  await expect(wrapper(page,ids[1]).getByRole('button',{name:'Reference photo',exact:true})).toHaveAttribute('aria-pressed','true');preserved(second,await view(page,ids[1]));
  await wrapper(page,ids[0]).getByRole('button',{name:'Reference photo',exact:true}).click();
  await page.getByRole('button',{name:'Reassemble all',exact:true}).click();
  for (const id of ids) {await expect(wrapper(page,id).getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');await live(page,id,0)}
  await wrapper(page,ids[1]).getByRole('button',{name:'Reference photo',exact:true}).click();await loadedPhoto(page,ids[1]);
  await page.getByRole('button',{name:'Expand all',exact:true}).click();for (const id of ids) {await expect(wrapper(page,id).getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');await live(page,id,1)}
});

test('phone photos work without WebGL, retry a failed image and explain Pine’s unavailable reference',async ({page},info) => {
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  const id='atlas-martini',reference=drinkReferences[id]!;let fail=true,requests=0;
  await page.route(url => url.pathname===reference.src,async route => {requests++;if(fail)await route.abort();else await route.continue()});
  await page.goto(`/?drink=${id}&webgl=off`);
  await expect(page.getByText('Interactive 3D is unavailable in this browser.',{exact:true})).toBeVisible();expect(requests).toBe(0);
  const controls=wrapper(page,id);await controls.getByRole('button',{name:'Reference photo',exact:true}).click();
  const retry=controls.getByRole('button',{name:'Retry reference photo',exact:true});await expect(retry).toBeVisible();expect(requests).toBe(1);
  fail=false;await retry.click();const {stage,image}=await loadedPhoto(page,id);expect(requests).toBe(2);
  await expect(image).toHaveCSS('object-fit','contain');
  for (const name of ['Reference photo','3D model']) {const bounds=await controls.getByRole('button',{name,exact:true}).boundingBox();expect(bounds!.height).toBeGreaterThanOrEqual(44);expect(bounds!.width).toBeGreaterThanOrEqual(44)}
  const frame=await stage.boundingBox(),picture=await image.boundingBox();
  expect(picture!.x).toBeGreaterThanOrEqual(frame!.x-.5);expect(picture!.y).toBeGreaterThanOrEqual(frame!.y-.5);
  expect(picture!.x+picture!.width).toBeLessThanOrEqual(frame!.x+frame!.width+.5);expect(picture!.y+picture!.height).toBeLessThanOrEqual(frame!.y+frame!.height+.5);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  const capture=info.outputPath('reference-photo-phone-no-webgl.png');await controls.screenshot({path:capture});await info.attach('reference-photo-phone-no-webgl',{path:capture,contentType:'image/png'});
  await controls.getByRole('button',{name:'3D model',exact:true}).click();await expect(page.getByText('Interactive 3D is unavailable in this browser.',{exact:true})).toBeVisible();
  await page.goto('/?drink=somma-pine-highball&webgl=off');
  const pine=wrapper(page,'somma-pine-highball');await expect(pine.getByRole('button',{name:'Reference photo',exact:true})).toBeDisabled();
  await expect(pine).toContainText(missingReferenceNotes['somma-pine-highball']);await expect(page.getByTestId('reference-photo-somma-pine-highball')).toHaveCount(0);
});
