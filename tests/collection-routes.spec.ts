import {expect,test} from '@playwright/test';
import {barsForFamily,drinksForFamily} from '../src/data/drinks';
import {parseRoute,routeUrl} from '../src/routes';

const espressoIds=['atlas-espresso-martini','jigger-espresso-martini','nighthawks'];
const collectionNav=(page:import('@playwright/test').Page)=>page.getByRole('navigation',{name:'Cocktail collections'});

test('routes infer collection, filter mixed comparisons and preserve legacy Negronis',()=>{
 const results= ['?drink=bbf-negroni','?collection=espresso-martini','?drink=nighthawks','?collection=negroni&drink=atlas-espresso-martini','?compare=atlas-espresso-martini,bbf-negroni,jigger-espresso-martini,nighthawks,atlas-espresso-martini&expand=0&sync=0','?compare=bbf-negroni,atlas-espresso-martini,ichigo-negroni,negroni-express,nighthawks','?collection=invalid&drink=missing'].map(search=>{const route=parseRoute(search);return {route,url:routeUrl(route)};});
 expect(results[0].route.collection).toBe('negroni');expect(results[0].url).toBe('?drink=bbf-negroni');
 expect(results[1].route.collection).toBe('espresso-martini');expect(results[1].route.page).toBe('atlas');
 expect(results[2].route.collection).toBe('espresso-martini');expect(results[3].route.collection).toBe('espresso-martini');
 expect(results[4].route.compareIds).toEqual(espressoIds);expect(results[4].route.expansion).toBe(0);expect(results[4].route.sync).toBe(false);
 expect(results[4].url).toContain('collection=espresso-martini');expect(results[4].url).toContain('expand=0');
 expect(results[5].route.compareIds).toEqual(['bbf-negroni','ichigo-negroni','negroni-express']);expect(results[6].route.collection).toBe('negroni');
});

test('switching collection clears selection and browser history restores the collection',async({page})=>{
 await page.goto('/?bar=bar-bon-funk');await page.getByRole('button',{name:'Add BBF Negroni to comparison',exact:true}).click();
 await expect(page.getByRole('complementary',{name:'Comparison selection'})).toBeVisible();
 const espresso=collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true});await espresso.focus();await page.keyboard.press('Enter');
 await expect(espresso).toHaveAttribute('aria-pressed','true');await expect(page).toHaveURL(/collection=espresso-martini/);
 await expect(page.getByRole('complementary',{name:'Comparison selection'})).toHaveCount(0);
 await expect(page.locator('.venue-row')).toHaveCount(3);await expect(page.locator('.venue-list')).not.toContainText('Bar Bon Funk');
 for(const bar of barsForFamily('espresso-martini'))await expect(page.locator('.venue-list')).toContainText(bar.name);
 await page.goBack();await expect(collectionNav(page).getByRole('button',{name:'Negronis',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.venue-list')).toContainText('Bar Bon Funk');await expect(page.getByRole('complementary',{name:'Comparison selection'})).toHaveCount(0);
 await page.goForward();await expect(espresso).toHaveAttribute('aria-pressed','true');
});

test('menu drink deep links have family categories, source links and same-family next navigation',async({page})=>{
 await page.goto('/?drink=atlas-espresso-martini');
 const atlas=drinksForFamily('espresso-martini').find(drink=>drink.id==='atlas-espresso-martini')!;
 await expect(page.getByRole('heading',{level:1,name:atlas.name,exact:true})).toBeVisible();
 await expect(collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true})).toHaveAttribute('aria-pressed','true');
 await expect(page.locator('.ingredient-list')).toContainText('Coffee');await expect(page.locator('.ingredient-list')).toContainText('Liqueur / amaro');
 await expect(page.locator('.ingredient-list')).not.toContainText('Vermouth / wine');
 await page.getByText('About this menu version',{exact:true}).click();
 await expect(page.locator('.source-details[open] .menu-source-links a').first()).toHaveAttribute('href',/^https:\/\//);
 await expect(page.locator('.source-details[open]')).not.toContainText('user-supplied film');
 await page.locator('.next-drink button').click();await expect(page).toHaveURL(/collection=espresso-martini/);
 await expect(page).not.toHaveURL(/drink=(bbf-negroni|ichigo-negroni|negroni-express)/);
 await page.reload();await expect(collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true})).toHaveAttribute('aria-pressed','true');
});

test('two-drink comparison adds only its third collection drink and removal remains in collection',async({page})=>{
 await page.goto('/?compare=atlas-espresso-martini,jigger-espresso-martini');
 await expect(page.locator('.comparison-column')).toHaveCount(2);
 await page.locator('.comparison-add button').click();await expect(page.locator('.comparison-column')).toHaveCount(3);
 await expect(page.locator('.comparison-add button')).toHaveCount(0);await expect(page.locator('.comparison-ingredient')).toHaveCount(18);
 await expect(page.locator('.comparison-columns')).not.toContainText('Vermouth / wine');
 await page.getByRole('button',{name:'Reassemble all',exact:true}).click();await expect(page.locator('#compare-expansion')).toHaveValue('0');
 await page.getByRole('switch',{name:'Rotation synchronized'}).click();await expect(page.getByRole('switch',{name:'Rotate independently'})).toHaveAttribute('aria-checked','false');
 await page.reload();await expect(page.locator('#compare-expansion')).toHaveValue('0');await expect(page.getByRole('switch',{name:'Rotate independently'})).toHaveAttribute('aria-checked','false');
 await page.locator('.comparison-drink-heading>button').last().click();await expect(page.locator('.comparison-column')).toHaveCount(2);
 await page.locator('.comparison-drink-heading>button').last().click();await expect(page.locator('.drink-page')).toBeVisible();await expect(page).toHaveURL(/collection=espresso-martini/);
});

test('espresso map contains all three venues and marker selection updates its preview',async({page})=>{
 await page.goto('/?collection=espresso-martini');
 await expect(page.locator('.venue-marker')).toHaveCount(3);await expect(page.locator('.map-loading')).toHaveCount(0,{timeout:30000});await expect(page.locator('.map-error')).toHaveCount(0);
 for(const bar of barsForFamily('espresso-martini')){
  await page.getByRole('button',{name:`Select ${bar.name}`,exact:true}).click();
  await expect(page.locator('.map-preview h3')).toHaveText(bar.name);await expect(page).toHaveURL(new RegExp(`bar=${bar.id}`));
 }
 await expect(page.getByRole('button',{name:'New Bahru, two bars: Bar Bon Funk and Bar Somma',exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'Show all featured venues',exact:true}).click();
});

test('mobile collection controls, tray names and menu disclosure remain keyboard accessible',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/?collection=espresso-martini');
 const collection=collectionNav(page);await expect(collection).toBeVisible();
 const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);expect(overflow).toBe(false);
 const add=page.locator('.venue-row-actions .venue-add').first();await add.focus();await page.keyboard.press('Enter');
 await expect(page.getByRole('complementary',{name:'Comparison selection'})).toBeVisible();
 await expect(page.locator('.selection-names button')).toHaveCount(1);await page.locator('.selection-names button').click();await expect(page.getByRole('complementary',{name:'Comparison selection'})).toHaveCount(0);
 await page.locator('.venue-row-actions .text-button').first().click();
 const source=page.getByText('About this menu version',{exact:true});await source.focus();await page.keyboard.press('Enter');await expect(page.locator('.source-details')).toHaveAttribute('open','');
 await expect(page.locator('.source-details .menu-source-links a').first()).toBeVisible();
 await collection.getByRole('button',{name:'Negronis',exact:true}).click();await expect(page.locator('.venue-list')).toContainText('Bar Bon Funk');
});

test('unsupported WebGL has compact phone layout and comparison keeps its source qualifier',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/?drink=nighthawks&webgl=off');
 await expect(page.getByText('Interactive 3D is unavailable in this browser.',{exact:true})).toBeVisible();
 const viewer=await page.locator('.drink-viewer').boundingBox(),host=await page.locator('.cocktail-viewer').boundingBox();
 expect(viewer!.height).toBeCloseTo(266,1);expect(host!.height).toBeCloseTo(210,1);
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
 await expect(page.getByRole('button',{name:'Explore ingredients',exact:true})).toBeVisible();
 await page.screenshot({path:'qa/evidence/ui/collections-independent/unsupported-mobile-390-fixed.png',fullPage:false});
 await page.goto('/?compare=atlas-espresso-martini,jigger-espresso-martini,nighthawks&webgl=off');
 await expect(page.locator('.comparison-heading .appearance-reference')).toHaveText('Current menu ingredients · Appearance reference April 2024.');
 await expect(page.locator('.viewer-fallback[role="status"]')).toHaveCount(3);
 for(const viewer of await page.locator('.comparison-viewer').all())expect((await viewer.boundingBox())!.height).toBeCloseTo(266,1);
 await expect(page.locator('.site-footer')).toContainText('Three interpretations.');
});

test('Share copies a restorable comparison with its current expansion and rotation mode',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as unknown as {copiedAtlasLink:string}).copiedAtlasLink=value;}}}));
 await page.goto('/?compare=atlas-espresso-martini,bbf-negroni,nighthawks,nighthawks&expand=0.43&sync=0');
 await page.getByRole('button',{name:'Copy a link to this view',exact:true}).click();
 await expect(page.locator('.share-status')).toHaveText('Link copied');
 const copied=await page.evaluate(()=>(window as unknown as {copiedAtlasLink:string}).copiedAtlasLink);
 const params=new URL(copied).searchParams;
 expect(params.get('compare')).toBe('atlas-espresso-martini,nighthawks');
 expect(params.get('collection')).toBe('espresso-martini');
 expect(params.get('expand')).toBe('0.43');expect(params.get('sync')).toBe('0');
 await page.goto(copied);
 await expect(page.locator('.comparison-column')).toHaveCount(2);
 await expect(page.getByRole('slider',{name:'Expansion',exact:true})).toHaveValue('0.43');
 await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');
});

test('denied clipboard access supports keyboard copying and keeps the fallback link current',async({page})=>{
 await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('Clipboard denied','NotAllowedError');}}}));
 await page.goto('/?drink=negroni-express&expand=0.43');
 const share=page.getByRole('button',{name:'Copy a link to this view',exact:true});
 await share.focus();await page.keyboard.press('Enter');
 const input=page.getByRole('textbox',{name:'Copy this link to share the current view'});
 await expect(input).toBeFocused();
 const selection=await input.evaluate((element:HTMLInputElement)=>({start:element.selectionStart,end:element.selectionEnd,length:element.value.length}));
 expect(selection.start).toBe(0);expect(selection.end).toBe(selection.length);
 await input.press('Escape');await expect(input).toHaveCount(0);await expect(share).toBeFocused();
 await page.keyboard.press('Enter');await expect(input).toBeFocused();
 await collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true}).click();
 const copied=new URL(await input.inputValue());
 expect(copied.searchParams.get('collection')).toBe('espresso-martini');expect(copied.searchParams.has('drink')).toBe(false);
 expect(parseRoute(copied.search).barId).toBe(parseRoute(new URL(page.url()).search).barId);
 await page.getByRole('button',{name:'Close share link',exact:true}).click();await expect(input).toHaveCount(0);await expect(share).toBeFocused();
});
