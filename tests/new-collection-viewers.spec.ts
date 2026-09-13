import {expect, test, type Page} from '@playwright/test';
import {categoriesForFamily, drinksForFamily, type CocktailFamilyId} from '../src/data/drinks';

type Part = {id: string; category: string; role: string; visible: boolean; position: number[]; rotation: number[]; scale: number[]};
type View = {ready: boolean; e: number; parts: Part[]; renderedFrames: number; camera: {azimuth: number; elevation: number; zoom: number}};
const view = (page: Page, id: string): Promise<View> => page.evaluate(id => structuredClone((window as unknown as {__atlasViewers: Record<string, View>}).__atlasViewers[id]), id);
async function settled(page: Page, id: string, e: number) {
  await expect(page.getByTestId(`viewer-${id}`)).toHaveAttribute('data-live', 'true', {timeout: 45000});
  await expect.poll(async () => (await view(page,id))?.e).toBe(e);
}
async function labelsFit(page: Page, id: string) {
  const geometry = await page.getByTestId(`viewer-${id}`).evaluate(host => {
    const bounds = host.getBoundingClientRect();
    return {width: bounds.width, height: bounds.height, labels: Array.from(host.querySelectorAll<HTMLElement>('.ingredient-labels button')).map(el => {
      const b = el.getBoundingClientRect(); return {name: el.textContent, x: b.left-bounds.left, y: b.top-bounds.top, width: b.width, height: b.height, opacity: getComputedStyle(el).opacity};
    })};
  });
  for (const label of geometry.labels) {
    expect(label.opacity).toBe('1'); expect(label.x).toBeGreaterThanOrEqual(0); expect(label.y).toBeGreaterThanOrEqual(0);
    expect(label.x+label.width).toBeLessThanOrEqual(geometry.width+.5); expect(label.y+label.height).toBeLessThanOrEqual(geometry.height+.5);
  }
  for (let i=0;i<geometry.labels.length;i++) for(let j=i+1;j<geometry.labels.length;j++) {
    const a=geometry.labels[i],b=geometry.labels[j];
    expect(Math.min(a.x+a.width,b.x+b.width)-Math.max(a.x,b.x)>.5 && Math.min(a.y+a.height,b.y+b.height)-Math.max(a.y,b.y)>.5, `${a.name} overlaps ${b.name}`).toBe(false);
  }
}
for (const family of ['martini','highball'] as CocktailFamilyId[]) {
  test(`${family} real models load, expose every category and restore all assembled poses`, async ({page},info) => {
    test.setTimeout(180000); await page.emulateMedia({reducedMotion:'reduce'});
    const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
    for (const drink of drinksForFamily(family)) {
      await page.goto(`/?drink=${drink.id}`);await settled(page,drink.id,0);
      const viewer=page.getByTestId(`viewer-${drink.id}`);await viewer.scrollIntoViewIfNeeded();
      const assembled=await view(page,drink.id);
      expect(assembled.parts.filter(p=>p.visible&&p.role==='recipe')).toHaveLength(0);
      expect(assembled.parts.some(p=>p.id==='liquid'&&p.visible)).toBe(true);
      const assembledFile=info.outputPath(`${drink.id}-assembled.png`);await viewer.screenshot({path:assembledFile});await info.attach(`${drink.id}-assembled`,{path:assembledFile,contentType:'image/png'});
      await page.getByRole('button',{name:'Explore ingredients',exact:true}).click();await settled(page,drink.id,1);
      const expanded=await view(page,drink.id);
      expect([...new Set(expanded.parts.filter(p=>p.visible).map(p=>p.category))].sort()).toEqual(categoriesForFamily(family).map(c=>c.id).sort());
      expect(expanded.parts.find(p=>p.id==='liquid')?.visible).toBe(false);
      expect(expanded.parts.some(p=>p.role==='recipe'&&p.visible)).toBe(true);
      for (const p of expanded.parts) for (const numbers of [p.position,p.rotation,p.scale]) expect(numbers.every(Number.isFinite)).toBe(true);
      await expect(viewer.locator('.ingredient-labels button')).toHaveCount(drink.ingredients.length);await labelsFit(page,drink.id);
      const expandedFile=info.outputPath(`${drink.id}-expanded.png`);await viewer.screenshot({path:expandedFile});await info.attach(`${drink.id}-expanded`,{path:expandedFile,contentType:'image/png'});
      await viewer.focus();await page.keyboard.press('ArrowRight');
      await expect.poll(async()=>(await view(page,drink.id)).camera.azimuth).toBeCloseTo(.2,5);
      await page.getByRole('button',{name:'Reassemble drink',exact:true}).click();await settled(page,drink.id,0);
      const restored=await view(page,drink.id);
      for (const p of assembled.parts) {
        const next=restored.parts.find(candidate=>candidate.id===p.id)!;
        expect(next.position,`${p.id} position`).toEqual(p.position);expect(next.rotation,`${p.id} rotation`).toEqual(p.rotation);expect(next.scale,`${p.id} scale`).toEqual(p.scale);expect(next.visible).toBe(p.visible);
      }
    }
    expect(errors).toEqual([]);
  });
  test(`${family} three live viewers synchronize, settle and retain readable phone labels`, async ({page},info) => {
    test.setTimeout(120000);await page.emulateMedia({reducedMotion:'reduce'});
    const drinks=drinksForFamily(family);await page.goto(`/?compare=${drinks.map(d=>d.id).join(',')}`);
    for(const drink of drinks)await settled(page,drink.id,1);
    await page.locator('.comparison-columns').scrollIntoViewIfNeeded();
    for(const drink of drinks)await labelsFit(page,drink.id);
    const comparison=info.outputPath(`${family}-live-comparison.png`);await page.locator('.comparison-columns').screenshot({path:comparison});await info.attach(`${family}-live-comparison`,{path:comparison,contentType:'image/png'});
    await page.getByTestId(`viewer-${drinks[0].id}`).focus();await page.keyboard.press('ArrowRight');
    for(const drink of drinks)await expect.poll(async()=>(await view(page,drink.id)).camera.azimuth).toBeCloseTo(.2,5);
    await page.getByRole('button',{name:'Reassemble all',exact:true}).click();for(const drink of drinks)await settled(page,drink.id,0);
    await page.getByRole('button',{name:'Expand all',exact:true}).click();for(const drink of drinks)await settled(page,drink.id,1);
    await page.getByTestId(`viewer-${drinks[0].id}`).focus();await page.keyboard.press('ArrowLeft');
    for(const drink of drinks)await expect.poll(async()=>(await view(page,drink.id)).camera.azimuth).toBeCloseTo(0,5);
    // Demand rendering must settle after transitions and observer-driven label layout.
    await page.waitForTimeout(250);
    const before=await Promise.all(drinks.map(d=>view(page,d.id)));await page.waitForTimeout(350);
    const after=await Promise.all(drinks.map(d=>view(page,d.id)));
    expect(after.map(v=>v.renderedFrames)).toEqual(before.map(v=>v.renderedFrames));
    const phone=family==='martini'?'moga-dirty-sake-tini':'moga-salted-yuzu-highball';
    await page.setViewportSize({width:390,height:844});await page.goto(`/?drink=${phone}&expand=1`);await settled(page,phone,1);await labelsFit(page,phone);
    const mobile=info.outputPath(`${phone}-phone.png`);await page.getByTestId(`viewer-${phone}`).screenshot({path:mobile});await info.attach(`${phone}-phone`,{path:mobile,contentType:'image/png'});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  });
}
