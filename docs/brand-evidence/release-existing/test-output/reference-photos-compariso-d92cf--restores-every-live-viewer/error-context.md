# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reference-photos.spec.ts >> comparison photos switch independently and shared expansion restores every live viewer
- Location: tests/reference-photos.spec.ts:80:1

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
      - button "Compare the drinks" [ref=e11] [cursor=pointer]:
        - text: Compare
        - generic [ref=e14]: the drinks
    - button "Copy a link to this view" [ref=e15] [cursor=pointer]:
      - generic [ref=e19]: Share
  - navigation "Cocktail collections" [ref=e20]:
    - button "Negronis" [ref=e21] [cursor=pointer]
    - button "Espresso Martinis" [ref=e22] [cursor=pointer]
    - button "Martinis" [pressed] [ref=e23] [cursor=pointer]
    - button "Highballs" [ref=e24] [cursor=pointer]
  - status
  - main [ref=e25]:
    - generic [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]:
          - button "Back to the atlas" [ref=e29] [cursor=pointer]
          - heading [level=1] [ref=e32]:
            - text: A study in
            - emphasis [ref=e33]: difference.
          - paragraph [ref=e34]: Recipe view · ingredients shown separately. Estimated matches are marked. Shapes and sizes do not indicate measured amounts.
          - paragraph [ref=e35]: Official recipes · Serving details are illustrative.
        - generic [ref=e36]: All three interpretations
      - generic [ref=e38]:
        - button "Reassemble all" [ref=e39] [cursor=pointer]
        - generic [ref=e43]:
          - generic [ref=e44]:
            - generic [ref=e45]: Expansion
            - generic [ref=e46]: 100%
          - slider "Expansion" [ref=e47] [cursor=pointer]: "1"
          - generic [ref=e48]:
            - generic [ref=e49]: Assembled
            - generic [ref=e50]: Recipe view
        - switch "Rotate independently" [ref=e51] [cursor=pointer]
        - button "Reset alignment" [ref=e55] [cursor=pointer]
      - generic [ref=e60]:
        - region "Compare ATLAS Martini" [ref=e61]:
          - generic [ref=e62]:
            - generic [ref=e63]:
              - text: ATLAS
              - heading [level=2] [ref=e64]:
                - button "ATLAS Martini" [ref=e65] [cursor=pointer]
              - paragraph [ref=e66]: Lemon oils. Ambrato. Champagne vinegar.
            - button "Remove ATLAS Martini from comparison" [ref=e67] [cursor=pointer]
          - generic [ref=e72]:
            - group "ATLAS Martini image view" [ref=e73]:
              - button "3D model" [ref=e74] [cursor=pointer]
              - button "Reference photo" [active] [pressed] [ref=e78] [cursor=pointer]
            - figure "Official ATLAS photograph; publication date unstated. The photo shows a rounded crystal bowl. The model’s V-shaped glass is an illustrative interpretation of the recipe card. ATLAS · official website ATLAS · The Story of the ATLAS Martini (opens in a new tab)" [ref=e84]:
              - alert [ref=e86]:
                - paragraph [ref=e87]: The reference photo couldn’t load.
                - button "Retry reference photo" [ref=e88] [cursor=pointer]
              - generic [ref=e92]:
                - paragraph [ref=e93]: Official ATLAS photograph; publication date unstated. The photo shows a rounded crystal bowl. The model’s V-shaped glass is an illustrative interpretation of the recipe card.
                - generic [ref=e94]:
                  - generic [ref=e95]: ATLAS · official website
                  - link "ATLAS · The Story of the ATLAS Martini (opens in a new tab)" [ref=e96] [cursor=pointer]:
                    - /url: https://www.atlasbar.sg/atlaslondondrygin
                    - text: ATLAS · The Story of the ATLAS Martini
          - generic "3D inspection controls" [ref=e101]:
            - generic [ref=e102]:
              - button "Rotate left" [ref=e103] [cursor=pointer]
              - button "Rotate right" [ref=e106] [cursor=pointer]
              - button "View from higher angle" [ref=e109] [cursor=pointer]
              - button "View from lower angle" [ref=e112] [cursor=pointer]
              - button "Zoom in" [ref=e115] [cursor=pointer]
              - button "Zoom out" [ref=e117] [cursor=pointer]
            - button "Reset view" [ref=e119] [cursor=pointer]
          - generic [ref=e123]:
            - button "Garnish Lemon twist Listed in the official menu" [ref=e124] [cursor=pointer]:
              - generic [ref=e125]: Garnish
              - strong [ref=e126]: Lemon twist
              - generic [ref=e127]: Listed in the official menu
            - button "Acidity & accents Champagne vinegar · orange bitters Listed in the official menu" [ref=e128] [cursor=pointer]:
              - generic [ref=e129]: Acidity & accents
              - strong [ref=e130]: Champagne vinegar · orange bitters
              - generic [ref=e131]: Listed in the official menu
            - button "Vermouth Ambrato vermouth Listed in the official menu" [ref=e132] [cursor=pointer]:
              - generic [ref=e133]: Vermouth
              - strong [ref=e134]: Ambrato vermouth
              - generic [ref=e135]: Listed in the official menu
            - button "Base spirit ATLAS London Dry Gin Listed in the official menu" [ref=e136] [cursor=pointer]:
              - generic [ref=e137]: Base spirit
              - strong [ref=e138]: ATLAS London Dry Gin
              - generic [ref=e139]: Listed in the official menu
            - button "Serving structure Waterford-style martini glass Listed in the official menu" [ref=e140] [cursor=pointer]:
              - generic [ref=e141]: Serving structure
              - strong [ref=e142]: Waterford-style martini glass
              - generic [ref=e143]: Listed in the official menu
          - generic [ref=e144]:
            - heading "Preparation" [level=3] [ref=e145]
            - paragraph [ref=e146]: Stir, strain & express lemon
          - group [ref=e147]:
            - generic "About this menu version" [ref=e148] [cursor=pointer]
        - region "Compare Dirty Sake-Tini" [ref=e151]:
          - generic [ref=e152]:
            - generic [ref=e153]:
              - text: MOGA
              - heading [level=2] [ref=e154]:
                - button "Dirty Sake-Tini" [ref=e155] [cursor=pointer]
              - paragraph [ref=e156]: Sake & shochu. Pickling brine.
            - button "Remove Dirty Sake-Tini from comparison" [ref=e157] [cursor=pointer]
          - generic [ref=e162]:
            - group "Dirty Sake-Tini image view" [ref=e163]:
              - button "3D model" [pressed] [ref=e164] [cursor=pointer]
              - button "Reference photo" [ref=e168] [cursor=pointer]
            - group "Dirty Sake-Tini interactive 3D viewer" [ref=e175]:
              - generic:
                - button "1 Cucumber ribbon · estimated" [ref=e179] [cursor=pointer]:
                  - generic [ref=e180]: "1"
                  - text: Cucumber ribbon · estimated
                - button "2 Pickling brine" [ref=e181] [cursor=pointer]:
                  - generic [ref=e182]: "2"
                  - text: Pickling brine
                - button "3 Dry vermouth" [ref=e183] [cursor=pointer]:
                  - generic [ref=e184]: "3"
                  - text: Dry vermouth
                - button "4 Sake · Saiten shochu" [ref=e185] [cursor=pointer]:
                  - generic [ref=e186]: "4"
                  - text: Sake · Saiten shochu
                - button "5 Shallow stemmed coupe" [ref=e187] [cursor=pointer]:
                  - generic [ref=e188]: "5"
                  - text: Shallow stemmed coupe
              - generic [ref=e189]:
                - button "Zoom in" [ref=e190] [cursor=pointer]
                - button "Zoom out" [ref=e192] [cursor=pointer]
              - generic:
                - text: Drag to rotate ·
                - generic: double-click to reassemble
          - generic "3D inspection controls" [ref=e194]:
            - generic [ref=e195]:
              - button "Rotate left" [ref=e196] [cursor=pointer]
              - button "Rotate right" [ref=e199] [cursor=pointer]
              - button "View from higher angle" [ref=e202] [cursor=pointer]
              - button "View from lower angle" [ref=e205] [cursor=pointer]
              - button "Zoom in" [ref=e208] [cursor=pointer]
              - button "Zoom out" [ref=e210] [cursor=pointer]
            - button "Reset view" [ref=e212] [cursor=pointer]
          - generic [ref=e216]:
            - button "Garnish Cucumber ribbon · estimated Closest recipe match" [ref=e217] [cursor=pointer]:
              - generic [ref=e218]: Garnish
              - strong [ref=e219]: Cucumber ribbon · estimated
              - generic [ref=e220]: Closest recipe match
            - button "Acidity & accents Pickling brine Listed in the official menu" [ref=e221] [cursor=pointer]:
              - generic [ref=e222]: Acidity & accents
              - strong [ref=e223]: Pickling brine
              - generic [ref=e224]: Listed in the official menu
            - button "Vermouth Dry vermouth Listed in the official menu" [ref=e225] [cursor=pointer]:
              - generic [ref=e226]: Vermouth
              - strong [ref=e227]: Dry vermouth
              - generic [ref=e228]: Listed in the official menu
            - button "Base spirit Sake · Saiten shochu Listed in the official menu" [ref=e229] [cursor=pointer]:
              - generic [ref=e230]: Base spirit
              - strong [ref=e231]: Sake · Saiten shochu
              - generic [ref=e232]: Listed in the official menu
            - button "Serving structure Shallow stemmed coupe Observed in the finished serving" [ref=e233] [cursor=pointer]:
              - generic [ref=e234]: Serving structure
              - strong [ref=e235]: Shallow stemmed coupe
              - generic [ref=e236]: Observed in the finished serving
          - group [ref=e237]:
            - generic "About this menu version" [ref=e238] [cursor=pointer]
        - region "Compare Mirko’s Martini" [ref=e241]:
          - generic [ref=e242]:
            - generic [ref=e243]:
              - text: Bar Somma
              - heading [level=2] [ref=e244]:
                - button "Mirko’s Martini" [ref=e245] [cursor=pointer]
              - paragraph [ref=e246]: Cygnet 22. Italicus. Olive brine.
            - button "Remove Mirko’s Martini from comparison" [ref=e247] [cursor=pointer]
          - generic [ref=e252]:
            - group "Mirko’s Martini image view" [ref=e253]:
              - button "3D model" [pressed] [ref=e254] [cursor=pointer]
              - button "Reference photo" [ref=e258] [cursor=pointer]
            - group "Mirko’s Martini interactive 3D viewer" [ref=e265]:
              - generic:
                - button "1 Olive · cheese" [ref=e269] [cursor=pointer]:
                  - generic [ref=e270]: "1"
                  - text: Olive · cheese
                - button "2 Italicus · olive brine" [ref=e271] [cursor=pointer]:
                  - generic [ref=e272]: "2"
                  - text: Italicus · olive brine
                - button "3 Dolin dry vermouth" [ref=e273] [cursor=pointer]:
                  - generic [ref=e274]: "3"
                  - text: Dolin dry vermouth
                - button "4 Cygnet 22 Gin" [ref=e275] [cursor=pointer]:
                  - generic [ref=e276]: "4"
                  - text: Cygnet 22 Gin
                - button "5 Rounded stemmed coupe" [ref=e277] [cursor=pointer]:
                  - generic [ref=e278]: "5"
                  - text: Rounded stemmed coupe
              - generic [ref=e279]:
                - button "Zoom in" [ref=e280] [cursor=pointer]
                - button "Zoom out" [ref=e282] [cursor=pointer]
              - generic:
                - text: Drag to rotate ·
                - generic: double-click to reassemble
          - generic "3D inspection controls" [ref=e284]:
            - generic [ref=e285]:
              - button "Rotate left" [ref=e286] [cursor=pointer]
              - button "Rotate right" [ref=e289] [cursor=pointer]
              - button "View from higher angle" [ref=e292] [cursor=pointer]
              - button "View from lower angle" [ref=e295] [cursor=pointer]
              - button "Zoom in" [ref=e298] [cursor=pointer]
              - button "Zoom out" [ref=e300] [cursor=pointer]
            - button "Reset view" [ref=e302] [cursor=pointer]
          - generic [ref=e306]:
            - button "Garnish Olive · cheese Observed in the finished serving" [ref=e307] [cursor=pointer]:
              - generic [ref=e308]: Garnish
              - strong [ref=e309]: Olive · cheese
              - generic [ref=e310]: Observed in the finished serving
            - button "Acidity & accents Italicus · olive brine Listed in the official menu" [ref=e311] [cursor=pointer]:
              - generic [ref=e312]: Acidity & accents
              - strong [ref=e313]: Italicus · olive brine
              - generic [ref=e314]: Listed in the official menu
            - button "Vermouth Dolin dry vermouth Listed in the official menu" [ref=e315] [cursor=pointer]:
              - generic [ref=e316]: Vermouth
              - strong [ref=e317]: Dolin dry vermouth
              - generic [ref=e318]: Listed in the official menu
            - button "Base spirit Cygnet 22 Gin Listed in the official menu" [ref=e319] [cursor=pointer]:
              - generic [ref=e320]: Base spirit
              - strong [ref=e321]: Cygnet 22 Gin
              - generic [ref=e322]: Listed in the official menu
            - button "Serving structure Rounded stemmed coupe Observed in the finished serving" [ref=e323] [cursor=pointer]:
              - generic [ref=e324]: Serving structure
              - strong [ref=e325]: Rounded stemmed coupe
              - generic [ref=e326]: Observed in the finished serving
          - group [ref=e327]:
            - generic "About this menu version" [ref=e328] [cursor=pointer]
  - contentinfo [ref=e331]:
    - link "SpiritAtlas" [ref=e332] [cursor=pointer]:
      - /url: /
    - generic [ref=e333]: Three interpretations. An invitation to look closer.
    - button "Return to the atlas" [ref=e334] [cursor=pointer]
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
