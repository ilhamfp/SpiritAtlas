import {expect, test, type Page} from '@playwright/test';
import {categoriesForFamily, drinks as allDrinks, drinksForFamily, type CocktailFamilyId} from '../src/data/drinks';
import {ingredientDisplayName, ingredientEvidenceLabel} from '../src/data/ingredientEvidence';
import {recipePresentation} from '../src/data/recipePresentation';
// Retained regression scope: the original six cocktails, before later collections.
const drinks = allDrinks.filter(drink => drink.family === 'negroni' || drink.family === 'espresso-martini');

const expectedEstimates:Record<string,{title:string;color:string}> = {
  'bbf-modifiers':{title:'Orange zest oils',color:'#e5a24e'},
  'ichigo-vermouth':{title:'Sweet vermouth',color:'#ad563a'},
  'ichigo-spirit':{title:'Tanqueray gin',color:'#d8cfb3'},
  'somma-vermouth':{title:'Sweet red vermouth',color:'#a94e32'},
  'somma-spirit':{title:'Gin',color:'#d8cfb3'},
  'jigger-liqueur':{title:'Coffee liqueur',color:'#855035'},
};
type Snapshot={ready:boolean;e:number;parts:{id:string;category:string;role:string;visible:boolean;representation?:string;evidence?:string}[]};
const snapshot=(page:Page,id:string):Promise<Snapshot> => page.evaluate(id => structuredClone((window as unknown as {__atlasViewers:Record<string,Snapshot>}).__atlasViewers[id]),id);
async function ready(page:Page,id:string) {
  await expect(page.getByTestId(`viewer-${id}`)).toHaveAttribute('data-live','true',{timeout:45000});
  await expect.poll(async () => {const view=await snapshot(page,id);return Boolean(view?.ready&&view.e===1)}).toBe(true);
}

test('all six recipes have exactly six sourced estimates, no Unknown names, and retain editor-confirmed Campari',() => {
  expect(drinks).toHaveLength(6);
  const inferred=drinks.flatMap(drink => drink.ingredients.filter(ingredient => ingredient.evidence==='inferred'));
  expect(inferred.map(ingredient => ingredient.id).sort()).toEqual(Object.keys(expectedEstimates).sort());
  for (const drink of drinks) {
    expect(drink.ingredients.map(ingredient => ingredient.category)).toEqual(categoriesForFamily(drink.family).map(category => category.id));
    expect(drink.ingredients).toHaveLength(6);expect(drink.ratios).toBeNull();
    for (const ingredient of drink.ingredients) {
      expect(ingredient.title.trim()).not.toBe('');expect(ingredient.title).not.toMatch(/\bunknown\b/i);
      expect(ingredient.quantity).toBeNull();expect(ingredient.unit).toBeNull();
      expect(ingredient.evidence).not.toBe('unverified');expect(ingredient.role).not.toBe('unverified');
      if (ingredient.evidence!=='inferred') continue;
      const expected=expectedEstimates[ingredient.id];
      expect(ingredient.title).toBe(expected.title);expect(ingredient.role).toBe('representative');
      expect(ingredient.sources?.length).toBeGreaterThan(0);
      for (const source of ingredient.sources!) {expect(source.label.trim()).not.toBe('');expect(new URL(source.url).protocol).toBe('https:')}
      expect(ingredientDisplayName(ingredient)).toBe(`${expected.title} · estimated`);
      expect(ingredientEvidenceLabel(ingredient,drink.source.kind)).toBe('Closest recipe match');
      const metadata=recipePresentation(drink,ingredient.category)!;
      expect(metadata.evidence).toBe('inferred');expect(metadata.representation).toBe('representative-ingredient');
      expect(metadata.illustrationColor).toBe(expected.color);expect(metadata.quantity).toBeNull();expect(metadata.unit).toBeNull();
    }
  }
  for (const drink of drinksForFamily('negroni')) {
    const bitter=drink.ingredients.find(ingredient => ingredient.category==='bitter')!;
    expect(bitter.title).toBe(drink.id==='bbf-negroni'?'Campari · amaro blend':'Campari');
    expect(bitter.evidence).toBe('user-confirmed');expect(ingredientEvidenceLabel(bitter)).toBe('Confirmed by atlas editor');
    expect(ingredientDisplayName(bitter)).not.toContain('estimated');
  }
});

for (const family of ['negroni','espresso-martini'] as CocktailFamilyId[]) test(`${family} shows estimated names and sources in live comparison and readable phone labels`,async ({page},info) => {
  test.setTimeout(120000);
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors:string[]=[];page.on('pageerror',error => errors.push(error.message));
  const collection=drinksForFamily(family),ids=collection.map(drink => drink.id);
  await page.goto(`/?compare=${ids.join(',')}&expand=1`);
  await expect(page.locator('.comparison-column')).toHaveCount(3);
  for (const drink of collection) {
    await ready(page,drink.id);
    const column=page.locator(`.comparison-column[data-drink-id="${drink.id}"]`);
    const viewer=page.getByTestId(`viewer-${drink.id}`);
    await expect(column.locator('.comparison-ingredient')).toHaveCount(6);
    await expect(viewer.locator('.ingredient-labels button')).toHaveCount(6);
    const view=await snapshot(page,drink.id);
    expect(new Set(view.parts.filter(part => part.visible).map(part => part.category)).size).toBe(6);
    for (const ingredient of drink.ingredients) {
      const title=ingredient.evidence==='inferred'?`${ingredient.title} · estimated`:ingredient.title;
      await expect(column.locator('.comparison-ingredient strong').filter({hasText:title})).toHaveCount(1);
      const label=viewer.locator(`.ingredient-labels button[data-category="${ingredient.category}"]`);
      await expect(label).toContainText(title);await expect(label).toHaveCSS('opacity','1');
      if (ingredient.evidence!=='inferred') continue;
      await expect(label).toHaveAttribute('data-evidence','inferred');
      const row=column.locator('.comparison-ingredient').filter({has:page.locator('strong',{hasText:title})});
      await expect(row.locator('span')).toHaveText('Closest recipe match');
      expect(await row.innerText()).not.toMatch(/Confirmed in the film|Listed in the official menu/);
      const forms=view.parts.filter(part => part.category===ingredient.category&&part.role==='recipe');
      expect(forms.length).toBeGreaterThan(0);
      for (const form of forms) {expect(form.visible).toBe(true);expect(form.evidence).toBe('inferred');expect(form.representation).toBe('representative-ingredient')}
    }
  }
  const comparisonCapture=info.outputPath(`${family}-estimated-comparison.png`);
  await page.screenshot({path:comparisonCapture});await info.attach(`${family}-estimated-comparison`,{path:comparisonCapture,contentType:'image/png'});
  for (const drink of collection.filter(drink => drink.ingredients.some(ingredient => ingredient.evidence==='inferred'))) {
    const disclosure=page.locator(`.comparison-column[data-drink-id="${drink.id}"] .source-details`);
    await disclosure.locator('summary').click();
    const estimates=disclosure.locator('section').filter({has:page.getByRole('heading',{name:'Estimated recipe matches',exact:true})});
    await expect(estimates).toBeVisible();await expect(estimates).toContainText('the bar’s recipe specifications remain unverified');
    for (const ingredient of drink.ingredients.filter(ingredient => ingredient.evidence==='inferred')) for (const source of ingredient.sources!) {
      const links=estimates.getByRole('link',{name:`${source.label} (opens in a new tab)`,exact:true});
      for (const link of await links.all()) {await expect(link).toBeVisible();await expect(link).toHaveAttribute('href',source.url)}
      expect(await links.count()).toBeGreaterThan(0);
    }
  }
  for (const drink of collection) {
    await page.goto(`/?drink=${drink.id}&expand=1`);await ready(page,drink.id);
    await expect(page.locator('.ingredient-item')).toHaveCount(6);
    for (const ingredient of drink.ingredients) await expect(page.locator('.ingredient-item strong').filter({hasText:ingredient.evidence==='inferred'?`${ingredient.title} · estimated`:ingredient.title})).toHaveCount(1);
    await expect(page.locator('.recipe-note')).toContainText('Estimated matches are marked.');
    await expect(page.locator('.recipe-note')).not.toContainText('Unknown objects');
  }
  const phoneId=family==='negroni'?'ichigo-negroni':'jigger-espresso-martini';
  await page.setViewportSize({width:390,height:844});await page.goto(`/?drink=${phoneId}&expand=1`);await ready(page,phoneId);
  const viewer=page.getByTestId(`viewer-${phoneId}`);await viewer.scrollIntoViewIfNeeded();
  const layout=await viewer.evaluate(host => {
    const bounds=host.getBoundingClientRect();
    return {width:bounds.width,height:bounds.height,labels:Array.from(host.querySelectorAll<HTMLElement>('.ingredient-labels button')).map(label => {const r=label.getBoundingClientRect();return {text:label.textContent,x:r.x-bounds.x,y:r.y-bounds.y,width:r.width,height:r.height,opacity:getComputedStyle(label).opacity}})};
  });
  const phoneCapture=info.outputPath(`${phoneId}-estimated-labels-390.png`);
  await page.screenshot({path:phoneCapture});await info.attach(`${phoneId}-estimated-labels-390`,{path:phoneCapture,contentType:'image/png'});
  await info.attach(`${phoneId}-label-bounds`,{body:JSON.stringify(layout,null,2),contentType:'application/json'});
  expect(layout.labels).toHaveLength(6);
  for (const label of layout.labels) {
    expect(label.opacity,label.text!).toBe('1');expect(label.x).toBeGreaterThanOrEqual(0);expect(label.y).toBeGreaterThanOrEqual(0);
    expect(label.x+label.width).toBeLessThanOrEqual(layout.width+.5);expect(label.y+label.height).toBeLessThanOrEqual(layout.height+.5);
  }
  for (let a=0;a<layout.labels.length;a++) for (let b=a+1;b<layout.labels.length;b++) {
    const first=layout.labels[a],second=layout.labels[b];
    const overlapX=Math.min(first.x+first.width,second.x+second.width)-Math.max(first.x,second.x);
    const overlapY=Math.min(first.y+first.height,second.y+second.height)-Math.max(first.y,second.y);
    expect(overlapX>.5&&overlapY>.5,`${phoneId}: labels overlap: ${first.text} / ${second.text}`).toBe(false);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  expect(errors).toEqual([]);
});
