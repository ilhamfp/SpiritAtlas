# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: collection-routes.spec.ts >> unsupported WebGL has compact phone layout and comparison keeps its source qualifier
- Location: tests/collection-routes.spec.ts:83:1

# Error details

```
Error: expect(received).toBeCloseTo(expected, precision)

Expected: 210
Received: 266

Expected precision:    1
Expected difference: < 0.05
Received difference:   56
```

# Page snapshot

```yaml
- generic [ref=e2]:
  - link "Skip to the atlas" [ref=e3] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=e4]:
    - link "SpiritAtlas home" [ref=e5] [cursor=pointer]:
      - /url: /
      - text: SpiritAtlas.
    - navigation "Main navigation" [ref=e6]:
      - button "The atlas" [ref=e7] [cursor=pointer]
      - button "Compare" [ref=e11] [cursor=pointer]
    - button "Copy a link to this view" [ref=e14] [cursor=pointer]
  - navigation "Cocktail collections" [ref=e18]:
    - button "Negronis" [ref=e19] [cursor=pointer]
    - button "Espresso Martinis" [pressed] [ref=e20] [cursor=pointer]
    - button "Martinis" [ref=e21] [cursor=pointer]
    - button "Highballs" [ref=e22] [cursor=pointer]
  - status
  - main [ref=e23]:
    - generic [ref=e24]:
      - generic [ref=e25]:
        - button "Back to the atlas" [ref=e26] [cursor=pointer]
        - generic "Choose cocktail" [ref=e29]:
          - button "View ATLAS Espresso Martini" [ref=e30] [cursor=pointer]: ATLAS
          - button "View Espresso Martini" [ref=e31] [cursor=pointer]: Jigger & Pony
          - button "View Nighthawks" [pressed] [ref=e32] [cursor=pointer]: Night Hawk
      - region "Nighthawks showcase" [ref=e33]:
        - generic [ref=e34]:
          - link "Night Hawk · Tanjong Pagar" [ref=e35] [cursor=pointer]:
            - /url: https://www.google.com/maps/search/?api=1&query=Night+Hawk+43+Tanjong+Pagar+Road+Singapore
            - text: Night Hawk
            - generic [ref=e39]: · Tanjong Pagar
          - heading "Nighthawks" [active] [level=1] [ref=e43]
          - paragraph [ref=e44]: Rum and vodka, coffee and amaro, crowned with hot coconut foam.
          - paragraph [ref=e45]: An espresso-martini riff. Chocolate and MSG accompany a dual-spirit coffee base beneath warm coconut foam.
          - paragraph [ref=e46]: Current menu ingredients · Appearance reference April 2024.
          - generic [ref=e47]:
            - button "Explore ingredients" [ref=e48] [cursor=pointer]
            - button "Add to comparison" [ref=e50] [cursor=pointer]
          - generic [ref=e52]:
            - generic [ref=e53]:
              - generic [ref=e54]: Expansion
              - generic [ref=e55]: 0%
            - slider "Expansion" [ref=e56] [cursor=pointer]: "0"
            - generic [ref=e57]:
              - generic [ref=e58]: Assembled
              - generic [ref=e59]: Recipe view
          - generic "3D inspection controls" [ref=e60]:
            - generic [ref=e61]:
              - button "Rotate left" [ref=e62] [cursor=pointer]
              - button "Rotate right" [ref=e65] [cursor=pointer]
              - button "View from higher angle" [ref=e68] [cursor=pointer]
              - button "View from lower angle" [ref=e71] [cursor=pointer]
              - button "Zoom in" [ref=e74] [cursor=pointer]
              - button "Zoom out" [ref=e76] [cursor=pointer]
            - button "Reset view" [ref=e78] [cursor=pointer]
          - paragraph [ref=e82]: Drag to rotate · + / − to zoom · Double-click to expand
        - generic [ref=e84]:
          - group "Nighthawks image view" [ref=e85]:
            - button "3D model" [pressed] [ref=e86] [cursor=pointer]
            - button "Reference photo" [ref=e90] [cursor=pointer]
          - generic [ref=e96]:
            - group "Nighthawks interactive 3D viewer" [ref=e97]:
              - status [ref=e98]:
                - paragraph [ref=e99]: Interactive 3D is unavailable in this browser.
                - generic [ref=e100]: You can still explore every ingredient, compare the recipes, and find the bars.
              - generic [aria-hidden]:
                - button [ref=e101] [cursor=pointer]:
                  - generic [ref=e102]: "1"
                  - text: Chocolate seal · feather
                - button [ref=e103] [cursor=pointer]:
                  - generic [ref=e104]: "2"
                  - text: Coconut foam · chocolate · MSG
                - button [ref=e105] [cursor=pointer]:
                  - generic [ref=e106]: "3"
                  - text: Coffee
                - button [ref=e107] [cursor=pointer]:
                  - generic [ref=e108]: "4"
                  - text: Amaro
                - button [ref=e109] [cursor=pointer]:
                  - generic [ref=e110]: "5"
                  - text: Rum · vodka
                - button [ref=e111] [cursor=pointer]:
                  - generic [ref=e112]: "6"
                  - text: Rounded stemmed glass
            - generic: The finished drink
        - generic [ref=e113]:
          - heading "Inside the drink" [level=2] [ref=e114]
          - paragraph [ref=e115]: Recipe view · ingredients shown separately. Estimated matches are marked. Shapes and sizes do not indicate measured amounts.
          - generic [ref=e116]:
            - button "1 Garnish Chocolate seal · feather" [ref=e118] [cursor=pointer]:
              - generic [ref=e119]: "1"
              - generic [ref=e120]:
                - generic [ref=e121]: Garnish
                - strong [ref=e122]: Chocolate seal · feather
            - button "2 Cream & accents Coconut foam · chocolate · MSG" [ref=e125] [cursor=pointer]:
              - generic [ref=e126]: "2"
              - generic [ref=e127]:
                - generic [ref=e128]: Cream & accents
                - strong [ref=e129]: Coconut foam · chocolate · MSG
            - button "3 Coffee Coffee" [ref=e132] [cursor=pointer]:
              - generic [ref=e133]: "3"
              - generic [ref=e134]:
                - generic [ref=e135]: Coffee
                - strong [ref=e136]: Coffee
            - button "4 Liqueur / amaro Amaro" [ref=e139] [cursor=pointer]:
              - generic [ref=e140]: "4"
              - generic [ref=e141]:
                - generic [ref=e142]: Liqueur / amaro
                - strong [ref=e143]: Amaro
            - button "5 Base spirit Rum · vodka" [ref=e146] [cursor=pointer]:
              - generic [ref=e147]: "5"
              - generic [ref=e148]:
                - generic [ref=e149]: Base spirit
                - strong [ref=e150]: Rum · vodka
            - button "6 Serving structure Rounded stemmed glass" [ref=e153] [cursor=pointer]:
              - generic [ref=e154]: "6"
              - generic [ref=e155]:
                - generic [ref=e156]: Serving structure
                - strong [ref=e157]: Rounded stemmed glass
          - generic [ref=e159]:
            - heading "How it’s made" [level=3] [ref=e160]
            - group [ref=e161]:
              - generic "Hot coconut foam" [ref=e162] [cursor=pointer]
          - group [ref=e164]:
            - generic "About this menu version" [ref=e165] [cursor=pointer]
      - generic [ref=e168]:
        - generic [ref=e169]:
          - heading "Find Night Hawk" [level=2] [ref=e170]
          - paragraph [ref=e171]: A neighbourhood bar whose Nighthawks rethinks the espresso martini with hot coconut foam.
        - generic [ref=e172]:
          - text: 43 Tanjong Pagar Road
          - generic [ref=e173]: 43 Tanjong Pagar Road, Singapore 088464
          - generic [ref=e174]:
            - link "Get directions" [ref=e175] [cursor=pointer]:
              - /url: https://www.google.com/maps/search/?api=1&query=Night+Hawk+43+Tanjong+Pagar+Road+Singapore
            - link "Visit the bar’s website" [ref=e179] [cursor=pointer]:
              - /url: https://www.nighthawk.sg/
      - generic [ref=e183]:
        - text: Another interpretation
        - button "ATLAS Espresso Martini" [ref=e184] [cursor=pointer]
  - contentinfo [ref=e187]:
    - link "SpiritAtlas" [ref=e188] [cursor=pointer]:
      - /url: /
    - button "Return to the atlas" [ref=e189] [cursor=pointer]
```

# Test source

```ts
  1   | import {expect,test} from '@playwright/test';
  2   | import {barsForFamily,drinksForFamily} from '../src/data/drinks';
  3   | import {parseRoute,routeUrl} from '../src/routes';
  4   | 
  5   | const espressoIds=['atlas-espresso-martini','jigger-espresso-martini','nighthawks'];
  6   | const collectionNav=(page:import('@playwright/test').Page)=>page.getByRole('navigation',{name:'Cocktail collections'});
  7   | 
  8   | test('routes infer collection, filter mixed comparisons and preserve legacy Negronis',()=>{
  9   |  const results= ['?drink=bbf-negroni','?collection=espresso-martini','?drink=nighthawks','?collection=negroni&drink=atlas-espresso-martini','?compare=atlas-espresso-martini,bbf-negroni,jigger-espresso-martini,nighthawks,atlas-espresso-martini&expand=0&sync=0','?compare=bbf-negroni,atlas-espresso-martini,ichigo-negroni,negroni-express,nighthawks','?collection=invalid&drink=missing'].map(search=>{const route=parseRoute(search);return {route,url:routeUrl(route)};});
  10  |  expect(results[0].route.collection).toBe('negroni');expect(results[0].url).toBe('?drink=bbf-negroni');
  11  |  expect(results[1].route.collection).toBe('espresso-martini');expect(results[1].route.page).toBe('atlas');
  12  |  expect(results[2].route.collection).toBe('espresso-martini');expect(results[3].route.collection).toBe('espresso-martini');
  13  |  expect(results[4].route.compareIds).toEqual(espressoIds);expect(results[4].route.expansion).toBe(0);expect(results[4].route.sync).toBe(false);
  14  |  expect(results[4].url).toContain('collection=espresso-martini');expect(results[4].url).toContain('expand=0');
  15  |  expect(results[5].route.compareIds).toEqual(['bbf-negroni','ichigo-negroni','negroni-express']);expect(results[6].route.collection).toBe('negroni');
  16  | });
  17  | 
  18  | test('switching collection clears selection and browser history restores the collection',async({page})=>{
  19  |  await page.goto('/?bar=bar-bon-funk');await page.getByRole('button',{name:'Add BBF Negroni to comparison',exact:true}).click();
  20  |  await expect(page.getByRole('complementary',{name:'Comparison selection'})).toBeVisible();
  21  |  const espresso=collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true});await espresso.focus();await page.keyboard.press('Enter');
  22  |  await expect(espresso).toHaveAttribute('aria-pressed','true');await expect(page).toHaveURL(/collection=espresso-martini/);
  23  |  await expect(page.getByRole('complementary',{name:'Comparison selection'})).toHaveCount(0);
  24  |  await expect(page.locator('.venue-row')).toHaveCount(3);await expect(page.locator('.venue-list')).not.toContainText('Bar Bon Funk');
  25  |  for(const bar of barsForFamily('espresso-martini'))await expect(page.locator('.venue-list')).toContainText(bar.name);
  26  |  await page.goBack();await expect(collectionNav(page).getByRole('button',{name:'Negronis',exact:true})).toHaveAttribute('aria-pressed','true');
  27  |  await expect(page.locator('.venue-list')).toContainText('Bar Bon Funk');await expect(page.getByRole('complementary',{name:'Comparison selection'})).toHaveCount(0);
  28  |  await page.goForward();await expect(espresso).toHaveAttribute('aria-pressed','true');
  29  | });
  30  | 
  31  | test('menu drink deep links have family categories, source links and same-family next navigation',async({page})=>{
  32  |  await page.goto('/?drink=atlas-espresso-martini');
  33  |  const atlas=drinksForFamily('espresso-martini').find(drink=>drink.id==='atlas-espresso-martini')!;
  34  |  await expect(page.getByRole('heading',{level:1,name:atlas.name,exact:true})).toBeVisible();
  35  |  await expect(collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true})).toHaveAttribute('aria-pressed','true');
  36  |  await expect(page.locator('.ingredient-list')).toContainText('Coffee');await expect(page.locator('.ingredient-list')).toContainText('Liqueur / amaro');
  37  |  await expect(page.locator('.ingredient-list')).not.toContainText('Vermouth / wine');
  38  |  await page.getByText('About this menu version',{exact:true}).click();
  39  |  await expect(page.locator('.source-details[open] .menu-source-links a').first()).toHaveAttribute('href',/^https:\/\//);
  40  |  await expect(page.locator('.source-details[open]')).not.toContainText('user-supplied film');
  41  |  await page.locator('.next-drink button').click();await expect(page).toHaveURL(/collection=espresso-martini/);
  42  |  await expect(page).not.toHaveURL(/drink=(bbf-negroni|ichigo-negroni|negroni-express)/);
  43  |  await page.reload();await expect(collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true})).toHaveAttribute('aria-pressed','true');
  44  | });
  45  | 
  46  | test('two-drink comparison adds only its third collection drink and removal remains in collection',async({page})=>{
  47  |  await page.goto('/?compare=atlas-espresso-martini,jigger-espresso-martini');
  48  |  await expect(page.locator('.comparison-column')).toHaveCount(2);
  49  |  await page.locator('.comparison-add button').click();await expect(page.locator('.comparison-column')).toHaveCount(3);
  50  |  await expect(page.locator('.comparison-add button')).toHaveCount(0);await expect(page.locator('.comparison-ingredient')).toHaveCount(18);
  51  |  await expect(page.locator('.comparison-columns')).not.toContainText('Vermouth / wine');
  52  |  await page.getByRole('button',{name:'Reassemble all',exact:true}).click();await expect(page.locator('#compare-expansion')).toHaveValue('0');
  53  |  await page.getByRole('switch',{name:'Rotation synchronized'}).click();await expect(page.getByRole('switch',{name:'Rotate independently'})).toHaveAttribute('aria-checked','false');
  54  |  await page.reload();await expect(page.locator('#compare-expansion')).toHaveValue('0');await expect(page.getByRole('switch',{name:'Rotate independently'})).toHaveAttribute('aria-checked','false');
  55  |  await page.locator('.comparison-drink-heading>button').last().click();await expect(page.locator('.comparison-column')).toHaveCount(2);
  56  |  await page.locator('.comparison-drink-heading>button').last().click();await expect(page.locator('.drink-page')).toBeVisible();await expect(page).toHaveURL(/collection=espresso-martini/);
  57  | });
  58  | 
  59  | test('espresso map contains all three venues and marker selection updates its preview',async({page})=>{
  60  |  await page.goto('/?collection=espresso-martini');
  61  |  await expect(page.locator('.venue-marker')).toHaveCount(3);await expect(page.locator('.map-loading')).toHaveCount(0,{timeout:30000});await expect(page.locator('.map-error')).toHaveCount(0);
  62  |  for(const bar of barsForFamily('espresso-martini')){
  63  |   await page.getByRole('button',{name:`Select ${bar.name}`,exact:true}).click();
  64  |   await expect(page.locator('.map-preview h3')).toHaveText(bar.name);await expect(page).toHaveURL(new RegExp(`bar=${bar.id}`));
  65  |  }
  66  |  await expect(page.getByRole('button',{name:'New Bahru, two bars: Bar Bon Funk and Bar Somma',exact:true})).toHaveCount(0);
  67  |  await page.getByRole('button',{name:'Show all featured venues',exact:true}).click();
  68  | });
  69  | 
  70  | test('mobile collection controls, tray names and menu disclosure remain keyboard accessible',async({page})=>{
  71  |  await page.setViewportSize({width:390,height:844});await page.goto('/?collection=espresso-martini');
  72  |  const collection=collectionNav(page);await expect(collection).toBeVisible();
  73  |  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);expect(overflow).toBe(false);
  74  |  const add=page.locator('.venue-row-actions .venue-add').first();await add.focus();await page.keyboard.press('Enter');
  75  |  await expect(page.getByRole('complementary',{name:'Comparison selection'})).toBeVisible();
  76  |  await expect(page.locator('.selection-names button')).toHaveCount(1);await page.locator('.selection-names button').click();await expect(page.getByRole('complementary',{name:'Comparison selection'})).toHaveCount(0);
  77  |  await page.locator('.venue-row-actions .text-button').first().click();
  78  |  const source=page.getByText('About this menu version',{exact:true});await source.focus();await page.keyboard.press('Enter');await expect(page.locator('.source-details')).toHaveAttribute('open','');
  79  |  await expect(page.locator('.source-details .menu-source-links a').first()).toBeVisible();
  80  |  await collection.getByRole('button',{name:'Negronis',exact:true}).click();await expect(page.locator('.venue-list')).toContainText('Bar Bon Funk');
  81  | });
  82  | 
  83  | test('unsupported WebGL has compact phone layout and comparison keeps its source qualifier',async({page})=>{
  84  |  await page.setViewportSize({width:390,height:844});await page.goto('/?drink=nighthawks&webgl=off');
  85  |  await expect(page.getByText('Interactive 3D is unavailable in this browser.',{exact:true})).toBeVisible();
  86  |  const viewer=await page.locator('.drink-viewer').boundingBox(),host=await page.locator('.cocktail-viewer').boundingBox();
> 87  |  expect(viewer!.height).toBeCloseTo(210,1);expect(host!.height).toBeCloseTo(210,1);
      |                         ^ Error: expect(received).toBeCloseTo(expected, precision)
  88  |  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  89  |  await expect(page.getByRole('button',{name:'Explore ingredients',exact:true})).toBeVisible();
  90  |  await page.screenshot({path:'qa/evidence/ui/collections-independent/unsupported-mobile-390-fixed.png',fullPage:false});
  91  |  await page.goto('/?compare=atlas-espresso-martini,jigger-espresso-martini,nighthawks&webgl=off');
  92  |  await expect(page.locator('.comparison-heading .appearance-reference')).toHaveText('Current menu ingredients · Appearance reference April 2024.');
  93  |  await expect(page.locator('.viewer-fallback[role="status"]')).toHaveCount(3);
  94  |  for(const viewer of await page.locator('.comparison-viewer').all())expect((await viewer.boundingBox())!.height).toBeCloseTo(210,1);
  95  |  await expect(page.locator('.site-footer')).toContainText('Three interpretations.');
  96  | });
  97  | 
  98  | test('Share copies a restorable comparison with its current expansion and rotation mode',async({page})=>{
  99  |  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(value:string)=>{(window as unknown as {copiedAtlasLink:string}).copiedAtlasLink=value;}}}));
  100 |  await page.goto('/?compare=atlas-espresso-martini,bbf-negroni,nighthawks,nighthawks&expand=0.43&sync=0');
  101 |  await page.getByRole('button',{name:'Copy a link to this view',exact:true}).click();
  102 |  await expect(page.locator('.share-status')).toHaveText('Link copied');
  103 |  const copied=await page.evaluate(()=>(window as unknown as {copiedAtlasLink:string}).copiedAtlasLink);
  104 |  const params=new URL(copied).searchParams;
  105 |  expect(params.get('compare')).toBe('atlas-espresso-martini,nighthawks');
  106 |  expect(params.get('collection')).toBe('espresso-martini');
  107 |  expect(params.get('expand')).toBe('0.43');expect(params.get('sync')).toBe('0');
  108 |  await page.goto(copied);
  109 |  await expect(page.locator('.comparison-column')).toHaveCount(2);
  110 |  await expect(page.getByRole('slider',{name:'Expansion',exact:true})).toHaveValue('0.43');
  111 |  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked','false');
  112 | });
  113 | 
  114 | test('denied clipboard access supports keyboard copying and keeps the fallback link current',async({page})=>{
  115 |  await page.addInitScript(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new DOMException('Clipboard denied','NotAllowedError');}}}));
  116 |  await page.goto('/?drink=negroni-express&expand=0.43');
  117 |  const share=page.getByRole('button',{name:'Copy a link to this view',exact:true});
  118 |  await share.focus();await page.keyboard.press('Enter');
  119 |  const input=page.getByRole('textbox',{name:'Copy this link to share the current view'});
  120 |  await expect(input).toBeFocused();
  121 |  const selection=await input.evaluate((element:HTMLInputElement)=>({start:element.selectionStart,end:element.selectionEnd,length:element.value.length}));
  122 |  expect(selection.start).toBe(0);expect(selection.end).toBe(selection.length);
  123 |  await input.press('Escape');await expect(input).toHaveCount(0);await expect(share).toBeFocused();
  124 |  await page.keyboard.press('Enter');await expect(input).toBeFocused();
  125 |  await collectionNav(page).getByRole('button',{name:'Espresso Martinis',exact:true}).click();
  126 |  const copied=new URL(await input.inputValue());
  127 |  expect(copied.searchParams.get('collection')).toBe('espresso-martini');expect(copied.searchParams.has('drink')).toBe(false);
  128 |  expect(parseRoute(copied.search).barId).toBe(parseRoute(new URL(page.url()).search).barId);
  129 |  await page.getByRole('button',{name:'Close share link',exact:true}).click();await expect(input).toHaveCount(0);await expect(share).toBeFocused();
  130 | });
  131 | 
```