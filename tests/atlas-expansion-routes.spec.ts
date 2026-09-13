import {expect, test, type Page} from '@playwright/test';
import {barById, barsForFamily, categoriesForFamily, cocktailFamilies, drinkById, drinks, drinksForFamily, type CocktailFamilyId} from '../src/data/drinks';
import {parseRoute, routeUrl} from '../src/routes';

const additions = ['martini','highball'] as CocktailFamilyId[];
const collectionNav = (page:Page) => page.getByRole('navigation',{name:'Cocktail collections'});

test('four collection routes resolve reused venues to the correct drink and retain legacy links',() => {
  expect(cocktailFamilies.map(family => family.id)).toEqual(['negroni','espresso-martini','martini','highball']);
  expect(drinks).toHaveLength(12);expect(new Set(drinks.map(drink => drink.barId)).size).toBe(6);
  const originalBars=new Set(drinks.filter(drink => !additions.includes(drink.family)).map(drink => drink.barId));
  for (const family of additions) {
    const collection=drinksForFamily(family);
    expect(collection).toHaveLength(3);expect(new Set(collection.map(drink => drink.barId)).size).toBe(3);
    for (const drink of collection) {
      expect(originalBars.has(drink.barId)).toBe(true);
      const atlas=parseRoute(`?collection=${family}&bar=${drink.barId}`);
      expect(atlas.page).toBe('atlas');expect(atlas.barId).toBe(drink.barId);expect(atlas.drinkId).toBe(drink.id);
      expect(parseRoute(routeUrl(atlas))).toEqual(atlas);
      const individual=parseRoute(`?drink=${drink.id}&expand=0.37`);
      expect(individual.collection).toBe(family);expect(individual.drinkId).toBe(drink.id);expect(individual.barId).toBe(drink.barId);
      expect(parseRoute(routeUrl(individual))).toEqual(individual);
    }
    const comparison=parseRoute(`?compare=${[collection[0].id,'bbf-negroni',...collection.map(drink => drink.id)].join(',')}&expand=0&sync=0`);
    expect(comparison.collection).toBe(family);expect(comparison.compareIds).toEqual(collection.map(drink => drink.id));
    expect(comparison.expansion).toBe(0);expect(comparison.sync).toBe(false);
    expect(parseRoute(routeUrl(comparison))).toEqual(comparison);
  }
  expect(parseRoute('?bar=moga').collection).toBe('negroni');
  expect(parseRoute('?drink=nighthawks').collection).toBe('espresso-martini');
  expect(routeUrl(parseRoute('?drink=bbf-negroni'))).toBe('?drink=bbf-negroni');
});

test('new collection map markers and reused venue previews open their collection-specific drinks',async ({page}) => {
  test.setTimeout(90000);
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const family of additions) {
    const venues=barsForFamily(family),collection=drinksForFamily(family);
    await page.goto(`/?collection=${family}`);
    await expect(page.locator('.venue-row')).toHaveCount(3);
    await expect(page.locator('.venue-marker')).toHaveCount(new Set(venues.map(bar => bar.buildingId)).size);
    await expect(page.locator('.map-loading')).toHaveCount(0,{timeout:30000});await expect(page.locator('.map-error')).toHaveCount(0);
    for (const bar of venues) {
      const drink=collection.find(drink => drink.barId===bar.id)!;
      await page.locator(`.venue-marker[data-building="${bar.buildingId}"]`).click();
      if (venues.filter(venue => venue.buildingId===bar.buildingId).length>1) await page.locator('.building-choice').filter({has:page.getByText(bar.name,{exact:true})}).click();
      await expect(page.locator('.map-preview h3')).toHaveText(bar.name);await expect(page.locator('.map-preview p')).toHaveText(drink.name);
      expect(parseRoute(new URL(page.url()).search).collection).toBe(family);
      await page.locator('.map-preview').getByRole('button',{name:'Explore drink',exact:true}).click();
      expect(parseRoute(new URL(page.url()).search).drinkId).toBe(drink.id);
      await expect(page.getByRole('heading',{level:1,name:drink.name,exact:true})).toBeVisible();
      await page.locator('.drink-topline').getByRole('button',{name:'Back to the atlas',exact:true}).click();
      await expect(page.locator('.map-preview p')).toHaveText(drink.name);
    }
    await expect(page.locator('.atlas-footnote')).toContainText('12 drinks · 6 Singapore bars');
    await page.getByRole('button',{name:'Show all featured venues',exact:true}).click();
  }
});

test('four mobile collections remain reachable by keyboard and restore captions and history',async ({page},info) => {
  await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  await page.goto('/?collection=highball');
  const nav=collectionNav(page);await expect(nav.getByRole('button')).toHaveCount(4);
  const highball=cocktailFamilies.find(family => family.id==='highball')!;
  const selected=nav.getByRole('button',{name:highball.name,exact:true});
  await expect(selected).toHaveAttribute('aria-pressed','true');
  const navBounds=await nav.boundingBox(),selectedBounds=await selected.boundingBox();
  expect(selectedBounds!.x).toBeGreaterThanOrEqual(navBounds!.x);expect(selectedBounds!.x+selectedBounds!.width).toBeLessThanOrEqual(navBounds!.x+navBounds!.width+.5);
  const capture=info.outputPath('four-collection-mobile-navigation.png');await page.screenshot({path:capture});await info.attach('four-collection-mobile-navigation',{path:capture,contentType:'image/png'});
  for (const family of cocktailFamilies) {
    const button=nav.getByRole('button',{name:family.name,exact:true});await button.focus();await page.keyboard.press('Enter');
    await expect(button).toHaveAttribute('aria-pressed','true');expect(parseRoute(new URL(page.url()).search).collection).toBe(family.id);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  }
  const sourceDrink=drinksForFamily('highball')[0];
  await page.locator('.venue-row-actions .text-button').first().click();
  await expect(page.locator('.drink-information .appearance-reference')).toHaveText(highball.sourceCaption!);
  await expect(page.locator('.drink-information .appearance-reference')).not.toContainText('April 2024');
  await page.getByText('About this menu version',{exact:true}).click();
  await expect(page.locator('.source-details[open]')).toContainText('Recipe measurements are not shown.');
  await page.locator('.next-drink button').click();
  const next=drinksForFamily('highball')[1];expect(parseRoute(new URL(page.url()).search).drinkId).toBe(next.id);
  await page.goBack();expect(parseRoute(new URL(page.url()).search).drinkId).toBe(sourceDrink.id);
  await page.goBack();await expect(page.locator('.venue-list')).toBeVisible();expect(parseRoute(new URL(page.url()).search).collection).toBe('highball');

});

test('new families compare two or three with their own rows and preserve shared state on refresh',async ({page}) => {
  for (const family of additions) {
    const collection=drinksForFamily(family),ids=collection.map(drink => drink.id),rows=categoriesForFamily(family);
    await page.goto(`/?compare=${ids.slice(0,2).join(',')}&webgl=off`);
    await expect(page.locator('.comparison-column')).toHaveCount(2);
    await page.locator('.comparison-add button').click();await expect(page.locator('.comparison-column')).toHaveCount(3);
    await expect(page.locator('.comparison-add button')).toHaveCount(0);
    await expect(page.locator('.comparison-ingredient')).toHaveCount(3*rows.length);
    for (const drink of collection) {
      const column=page.locator(`.comparison-column[data-drink-id="${drink.id}"]`);
      await expect(column.locator('.comparison-ingredient small')).toHaveText(rows.map(row => row.label));
      await expect(column.locator('.comparison-drink-heading')).toContainText(barById[drink.barId].name);
    }
    await expect(page.locator('.comparison-heading .appearance-reference')).toHaveText(cocktailFamilies.find(item => item.id===family)!.sourceCaption!);
    await page.getByRole('button',{name:'Reassemble all',exact:true}).click();await page.getByRole('switch').click();
    await page.reload();await expect(page.locator('#compare-expansion')).toHaveValue('0');await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');
    expect(parseRoute(new URL(page.url()).search).compareIds).toEqual(ids);
    await page.locator('.comparison-drink-heading>button').last().click();await expect(page.locator('.comparison-column')).toHaveCount(2);
    await page.locator('.comparison-drink-heading>button').last().click();await expect(page.locator('.drink-page')).toBeVisible();
    expect(drinkById[parseRoute(new URL(page.url()).search).drinkId].family).toBe(family);
  }
});
