# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reference-photos.spec.ts >> phone photos work without WebGL, retry a failed image and explain Pine’s unavailable reference
- Location: tests/reference-photos.spec.ts:115:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false

Call Log:
- Timeout 25000ms exceeded while waiting on the predicate
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
    - button "Espresso Martinis" [ref=e20] [cursor=pointer]
    - button "Martinis" [pressed] [ref=e21] [cursor=pointer]
    - button "Highballs" [ref=e22] [cursor=pointer]
  - status
  - main [ref=e23]:
    - generic [ref=e24]:
      - generic [ref=e25]:
        - button "Back to the atlas" [ref=e26] [cursor=pointer]
        - generic "Choose cocktail" [ref=e29]:
          - button "View ATLAS Martini" [pressed] [ref=e30] [cursor=pointer]: ATLAS
          - button "View Dirty Sake-Tini" [ref=e31] [cursor=pointer]: MOGA
          - button "View Mirko’s Martini" [ref=e32] [cursor=pointer]: Bar Somma
      - region "ATLAS Martini showcase" [ref=e33]:
        - generic [ref=e34]:
          - link "ATLAS · Bugis" [ref=e35] [cursor=pointer]:
            - /url: https://www.google.com/maps/search/?api=1&query=ATLAS+600+North+Bridge+Road+Singapore
            - text: ATLAS
            - generic [ref=e39]: · Bugis
          - heading "ATLAS Martini" [level=1] [ref=e43]
          - paragraph [ref=e44]: A lemon twist above gin, ambrato vermouth and a bright touch of champagne vinegar.
          - paragraph [ref=e45]: ATLAS’s own gin meets ambrato vermouth, orange bitters and champagne vinegar. Its published recipe finishes the drink with lemon oils and a twist.
          - paragraph [ref=e46]: Official recipes · Serving details are illustrative.
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
          - group "ATLAS Martini image view" [ref=e85]:
            - button "3D model" [ref=e86] [cursor=pointer]
            - button "Reference photo" [pressed] [ref=e90] [cursor=pointer]
          - figure "Official ATLAS photograph; publication date unstated. The photo shows a rounded crystal bowl. The model’s V-shaped glass is an illustrative interpretation of the recipe card. ATLAS · official website ATLAS · The Story of the ATLAS Martini (opens in a new tab)" [ref=e96]:
            - alert [ref=e98]:
              - paragraph [ref=e99]: The reference photo couldn’t load.
              - button "Retry reference photo" [ref=e100] [cursor=pointer]
            - generic [ref=e104]:
              - paragraph [ref=e105]: Official ATLAS photograph; publication date unstated. The photo shows a rounded crystal bowl. The model’s V-shaped glass is an illustrative interpretation of the recipe card.
              - generic [ref=e106]:
                - generic [ref=e107]: ATLAS · official website
                - link "ATLAS · The Story of the ATLAS Martini (opens in a new tab)" [ref=e108] [cursor=pointer]:
                  - /url: https://www.atlasbar.sg/atlaslondondrygin
                  - text: ATLAS · The Story of the ATLAS Martini
        - generic [ref=e113]:
          - heading "Inside the drink" [level=2] [ref=e114]
          - paragraph [ref=e115]: Recipe view · ingredients shown separately. Estimated matches are marked. Shapes and sizes do not indicate measured amounts.
          - generic [ref=e116]:
            - button "1 Garnish Lemon twist" [ref=e118] [cursor=pointer]:
              - generic [ref=e119]: "1"
              - generic [ref=e120]:
                - generic [ref=e121]: Garnish
                - strong [ref=e122]: Lemon twist
            - button "2 Acidity & accents Champagne vinegar · orange bitters" [ref=e125] [cursor=pointer]:
              - generic [ref=e126]: "2"
              - generic [ref=e127]:
                - generic [ref=e128]: Acidity & accents
                - strong [ref=e129]: Champagne vinegar · orange bitters
            - button "3 Vermouth Ambrato vermouth" [ref=e132] [cursor=pointer]:
              - generic [ref=e133]: "3"
              - generic [ref=e134]:
                - generic [ref=e135]: Vermouth
                - strong [ref=e136]: Ambrato vermouth
            - button "4 Base spirit ATLAS London Dry Gin" [ref=e139] [cursor=pointer]:
              - generic [ref=e140]: "4"
              - generic [ref=e141]:
                - generic [ref=e142]: Base spirit
                - strong [ref=e143]: ATLAS London Dry Gin
            - button "5 Serving structure Waterford-style martini glass" [ref=e146] [cursor=pointer]:
              - generic [ref=e147]: "5"
              - generic [ref=e148]:
                - generic [ref=e149]: Serving structure
                - strong [ref=e150]: Waterford-style martini glass
          - generic [ref=e152]:
            - heading "How it’s made" [level=3] [ref=e153]
            - group [ref=e154]:
              - generic "Stir, strain & express lemon" [ref=e155] [cursor=pointer]
          - group [ref=e157]:
            - generic "About this menu version" [ref=e158] [cursor=pointer]
      - generic [ref=e161]:
        - generic [ref=e162]:
          - heading "Find ATLAS" [level=2] [ref=e163]
          - paragraph [ref=e164]: An Art Deco grand lobby with a cinnamon-and-cream interpretation of the espresso martini.
        - generic [ref=e165]:
          - text: Parkview Square
          - generic [ref=e166]: Parkview Square, 600 North Bridge Road, Singapore 188778
          - generic [ref=e167]:
            - link "Get directions" [ref=e168] [cursor=pointer]:
              - /url: https://www.google.com/maps/search/?api=1&query=ATLAS+600+North+Bridge+Road+Singapore
            - link "Visit the bar’s website" [ref=e172] [cursor=pointer]:
              - /url: https://www.atlasbar.sg/
      - generic [ref=e176]:
        - text: Another interpretation
        - button "Dirty Sake-Tini" [ref=e177] [cursor=pointer]
  - contentinfo [ref=e180]:
    - link "SpiritAtlas" [ref=e181] [cursor=pointer]:
      - /url: /
    - button "Return to the atlas" [ref=e182] [cursor=pointer]
```

# Test source

```ts
  1   | import {expect, test, type Locator, type Page} from '@playwright/test';
  2   | import {createHash} from 'node:crypto';
  3   | import {readFileSync, statSync} from 'node:fs';
  4   | import {drinks, drinksForFamily} from '../src/data/drinks';
  5   | import {drinkReferences, missingReferenceNotes} from '../src/data/drinkReferences';
  6   |
  7   | type View = {ready:boolean;e:number;renderedFrames:number;camera:Record<string,unknown>;parts:{id:string;position:number[];rotation:number[];scale:number[];visible:boolean}[]};
  8   | const view=(page:Page,id:string):Promise<View> => page.evaluate(id => structuredClone((window as unknown as {__atlasViewers:Record<string,View>}).__atlasViewers[id]),id);
  9   | const wrapper=(page:Page,id:string) => page.getByTestId(`reference-viewer-${id}`);
  10  | const model=(page:Page,id:string) => page.getByTestId(`viewer-${id}`);
  11  | async function live(page:Page,id:string,e:number) {
  12  |   await expect(model(page,id)).toHaveAttribute('data-live','true',{timeout:45000});
  13  |   await expect.poll(async () => (await view(page,id))?.e).toBe(e);
  14  | }
  15  | async function loadedPhoto(page:Page,id:string) {
  16  |   const reference=drinkReferences[id]!,stage=page.getByTestId(`reference-photo-${id}`);
  17  |   const image=stage.getByRole('img',{name:reference.alt,exact:true});
  18  |   await expect(stage).toBeVisible();await expect(image).toBeVisible();
> 19  |   await expect.poll(() => image.evaluate((image:HTMLImageElement) => image.complete&&image.naturalWidth>0)).toBe(true);
      |                                                                                                             ^ Error: expect(received).toBe(expected) // Object.is equality
  20  |   await expect(stage).toHaveAttribute('data-status','ready');await expect(image).toHaveCSS('opacity','1');
  21  |   await expect(stage).toContainText(reference.caption);await expect(stage).toContainText(reference.credit);
  22  |   if (reference.sourceUrl) await expect(stage.locator('a').filter({hasText:reference.sourceLabel!})).toHaveAttribute('href',reference.sourceUrl);
  23  |   return {stage,image};
  24  | }
  25  | async function hiddenModel(host:Locator) {
  26  |   expect(await host.evaluate(element => Boolean(element.closest('[inert]')))).toBe(true);
  27  |   expect(await host.evaluate(element => Boolean(element.closest('[aria-hidden="true"]')))).toBe(true);
  28  | }
  29  | function preserved(before:View,after:View) {
  30  |   expect(after.e).toBe(before.e);expect(after.camera).toEqual(before.camera);
  31  |   expect(after.parts.map(part => ({id:part.id,position:part.position,rotation:part.rotation,scale:part.scale,visible:part.visible})))
  32  |     .toEqual(before.parts.map(part => ({id:part.id,position:part.position,rotation:part.rotation,scale:part.scale,visible:part.visible})));
  33  | }
  34  |
  35  | test('eleven local references retain credited source provenance and Pine has an explicit missing-photo note',() => {
  36  |   const manifest=JSON.parse(readFileSync('references/embedded-reference-manifest.json','utf8')) as {references:{drinkId:string;sourcePath:string;publicPath:string;src:string;sha256:string;sourceSha256:string;exactCopy:boolean;originalUnchanged:boolean;bytes:number;dimensions:number[]}[]};
  37  |   expect(Object.keys(drinkReferences)).toHaveLength(11);
  38  |   expect(Object.keys(missingReferenceNotes)).toEqual(['somma-pine-highball']);
  39  |   expect([...Object.keys(drinkReferences),...Object.keys(missingReferenceNotes)].sort()).toEqual(drinks.map(drink => drink.id).sort());
  40  |   expect(manifest.references.map(reference => reference.drinkId).sort()).toEqual(Object.keys(drinkReferences).sort());
  41  |   for (const [id,reference] of Object.entries(drinkReferences)) {
  42  |     expect(reference).toBeDefined();expect(reference!.src).toMatch(/^\/references\/[a-z0-9-]+\.(png|jpg)$/);
  43  |     for (const text of [reference!.alt,reference!.caption,reference!.credit]) expect(text.trim()).not.toBe('');
  44  |     if (reference!.sourceUrl) {expect(new URL(reference!.sourceUrl).protocol).toBe('https:');expect(reference!.sourceLabel?.trim()).toBeTruthy()}
  45  |     const record=manifest.references.find(record => record.drinkId===id)!;
  46  |     expect(record.src).toBe(reference!.src);expect(record.publicPath).toBe(`public${reference!.src}`);
  47  |     expect(record.exactCopy).toBe(true);expect(record.originalUnchanged).toBe(true);
  48  |     expect(record.bytes).toBeGreaterThan(1000);expect(statSync(record.publicPath).size).toBe(record.bytes);
  49  |     const hash=(path:string) => createHash('sha256').update(readFileSync(path)).digest('hex');
  50  |     expect(hash(record.publicPath)).toBe(record.sha256);expect(hash(record.sourcePath)).toBe(record.sourceSha256);expect(record.sha256).toBe(record.sourceSha256);
  51  |     expect(record.dimensions).toHaveLength(2);expect(record.dimensions.every(size => size>100)).toBe(true);
  52  |   }
  53  | });
  54  |
  55  | test('a Martini loads its photo only on request and resumes the same mounted 3D pose and camera',async ({page},info) => {
  56  |   const id='atlas-martini',requested:string[]=[];
  57  |   page.on('request',request => {const path=new URL(request.url()).pathname;if(path.startsWith('/references/'))requested.push(path)});
  58  |   await page.emulateMedia({reducedMotion:'reduce'});await page.goto(`/?drink=${id}&expand=0.43`);await live(page,id,.43);
  59  |   const host=model(page,id),originalNode=await host.elementHandle(),controls=wrapper(page,id);
  60  |   await expect(controls.getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');
  61  |   expect(requested).toEqual([]);
  62  |   await host.focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');
  63  |   await expect.poll(async () => (await view(page,id)).camera.azimuth).toBeCloseTo(.2,5);
  64  |   await expect.poll(async () => (await view(page,id)).camera.zoom).toBeCloseTo(1.1,5);
  65  |   const before=await view(page,id);
  66  |   await controls.getByRole('button',{name:'Reference photo',exact:true}).click();const {stage}=await loadedPhoto(page,id);
  67  |   await expect(controls.getByRole('button',{name:'Reference photo',exact:true})).toHaveAttribute('aria-pressed','true');
  68  |   expect(requested).toEqual([drinkReferences[id]!.src]);await hiddenModel(host);
  69  |   expect(await originalNode!.evaluate((element,id) => element.isConnected&&document.querySelector(`[data-testid="viewer-${id}"]`)===element,id)).toBe(true);
  70  |   await page.waitForTimeout(250);const paused=(await view(page,id)).renderedFrames;await page.waitForTimeout(350);expect((await view(page,id)).renderedFrames).toBe(paused);
  71  |   const photo=info.outputPath('atlas-martini-reference-photo.png');await stage.screenshot({path:photo});await info.attach('atlas-martini-reference-photo',{path:photo,contentType:'image/png'});
  72  |   await controls.getByRole('button',{name:'3D model',exact:true}).click();await live(page,id,.43);
  73  |   await expect(controls.getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');
  74  |   expect(await host.evaluate(element => Boolean(element.closest('[inert],[aria-hidden="true"]')))).toBe(false);
  75  |   expect(await originalNode!.evaluate((element,id) => element.isConnected&&document.querySelector(`[data-testid="viewer-${id}"]`)===element,id)).toBe(true);
  76  |   preserved(before,await view(page,id));
  77  |   await host.focus();await page.keyboard.press('ArrowRight');await expect.poll(async () => (await view(page,id)).camera.azimuth).toBeCloseTo(.4,5);
  78  | });
  79  |
  80  | test('comparison photos switch independently and shared expansion restores every live viewer',async ({page},info) => {
  81  |   test.setTimeout(90000);await page.emulateMedia({reducedMotion:'reduce'});
  82  |   const ids=drinksForFamily('martini').map(drink => drink.id);
  83  |   await page.goto(`/?compare=${ids.join(',')}&sync=0`);for (const id of ids) await live(page,id,1);
  84  |   await model(page,ids[0]).focus();await page.keyboard.press('ArrowRight');await model(page,ids[1]).focus();await page.keyboard.press('ArrowLeft');
  85  |   await expect.poll(async () => (await view(page,ids[0])).camera.azimuth).toBeCloseTo(.2,5);await expect.poll(async () => (await view(page,ids[1])).camera.azimuth).toBeCloseTo(-.2,5);
  86  |   const first=await view(page,ids[0]),second=await view(page,ids[1]);
  87  |   for (const id of ids.slice(0,2)) {await wrapper(page,id).getByRole('button',{name:'Reference photo',exact:true}).click();await loadedPhoto(page,id);await hiddenModel(model(page,id))}
  88  |   // Legacy negative canvas margins must not clip photo controls or captions at
  89  |   // the scroller edges when all three desktop columns fit in the viewport.
  90  |   const scrollBounds=(await page.locator('.comparison-scroll').boundingBox())!;
  91  |   for (const id of ids) {
  92  |     const controls=(await wrapper(page,id).locator('.reference-toolbar').boundingBox())!;
  93  |     expect(controls.x).toBeGreaterThanOrEqual(scrollBounds.x-.5);
  94  |     expect(controls.x+controls.width).toBeLessThanOrEqual(scrollBounds.x+scrollBounds.width+.5);
  95  |   }
  96  |   for (const id of ids.slice(0,2)) {
  97  |     const photo=(await page.getByTestId(`reference-photo-${id}`).boundingBox())!;
  98  |     expect(photo.x).toBeGreaterThanOrEqual(scrollBounds.x-.5);
  99  |     expect(photo.x+photo.width).toBeLessThanOrEqual(scrollBounds.x+scrollBounds.width+.5);
  100 |   }
  101 |   await expect(wrapper(page,ids[2]).getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');
  102 |   await model(page,ids[2]).focus();await page.keyboard.press('ArrowRight');await expect.poll(async () => (await view(page,ids[2])).camera.azimuth).toBeCloseTo(.2,5);
  103 |   await page.waitForTimeout(250);const stopped=await Promise.all(ids.slice(0,2).map(async id => (await view(page,id)).renderedFrames));await page.waitForTimeout(350);
  104 |   expect(await Promise.all(ids.slice(0,2).map(async id => (await view(page,id)).renderedFrames))).toEqual(stopped);
  105 |   const capture=info.outputPath('independent-comparison-reference-photos.png');await page.locator('.comparison-columns').screenshot({path:capture});await info.attach('independent-comparison-reference-photos',{path:capture,contentType:'image/png'});
  106 |   await wrapper(page,ids[0]).getByRole('button',{name:'3D model',exact:true}).click();await live(page,ids[0],1);preserved(first,await view(page,ids[0]));
  107 |   await expect(wrapper(page,ids[1]).getByRole('button',{name:'Reference photo',exact:true})).toHaveAttribute('aria-pressed','true');preserved(second,await view(page,ids[1]));
  108 |   await wrapper(page,ids[0]).getByRole('button',{name:'Reference photo',exact:true}).click();
  109 |   await page.getByRole('button',{name:'Reassemble all',exact:true}).click();
  110 |   for (const id of ids) {await expect(wrapper(page,id).getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');await live(page,id,0)}
  111 |   await wrapper(page,ids[1]).getByRole('button',{name:'Reference photo',exact:true}).click();await loadedPhoto(page,ids[1]);
  112 |   await page.getByRole('button',{name:'Expand all',exact:true}).click();for (const id of ids) {await expect(wrapper(page,id).getByRole('button',{name:'3D model',exact:true})).toHaveAttribute('aria-pressed','true');await live(page,id,1)}
  113 | });
  114 |
  115 | test('phone photos work without WebGL, retry a failed image and explain Pine’s unavailable reference',async ({page},info) => {
  116 |   await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'reduce'});
  117 |   const id='atlas-martini',reference=drinkReferences[id]!;let fail=true,requests=0;
  118 |   await page.route(url => url.pathname===reference.src,async route => {requests++;if(fail)await route.abort();else await route.continue()});
  119 |   await page.goto(`/?drink=${id}&webgl=off`);
```
