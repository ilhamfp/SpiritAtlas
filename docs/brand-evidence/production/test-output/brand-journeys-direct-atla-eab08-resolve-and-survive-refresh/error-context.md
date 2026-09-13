# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> direct atlas and all Negroni routes resolve and survive refresh
- Location: tests/brand-journeys.spec.ts:219:1

# Error details

```
Error: No first-party runtime errors or failed required asset requests

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 3

- Array []
+ Array [
+   "Failed to load resource: the server responded with a status of 404 ()",
+ ]
```

# Page snapshot

```yaml
- generic [ref=f13e2]:
  - link "Skip to the atlas" [ref=f13e3] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=f13e4]:
    - link "SpiritAtlas home" [ref=f13e5] [cursor=pointer]:
      - /url: /
      - text: SpiritAtlas.
    - navigation "Main navigation" [ref=f13e6]:
      - button "The atlas" [ref=f13e7] [cursor=pointer]
      - button "Compare the drinks" [ref=f13e11] [cursor=pointer]:
        - text: Compare
        - generic [ref=f13e14]: the drinks
    - button "Copy a link to this view" [ref=f13e15] [cursor=pointer]:
      - generic [ref=f13e19]: Share
  - navigation "Cocktail collections" [ref=f13e20]:
    - button "Negronis" [pressed] [ref=f13e21] [cursor=pointer]
    - button "Espresso Martinis" [ref=f13e22] [cursor=pointer]
    - button "Martinis" [ref=f13e23] [cursor=pointer]
    - button "Highballs" [ref=f13e24] [cursor=pointer]
  - status
  - main [ref=f13e25]:
    - generic [ref=f13e26]:
      - generic [ref=f13e27]:
        - generic [ref=f13e28]:
          - button "Back to the atlas" [ref=f13e29] [cursor=pointer]
          - heading [level=1] [ref=f13e32]:
            - text: A study in
            - emphasis [ref=f13e33]: difference.
          - paragraph [ref=f13e34]: Recipe view · ingredients shown separately. Estimated matches are marked. Shapes and sizes do not indicate measured amounts.
        - generic [ref=f13e35]: All three interpretations
      - generic [ref=f13e37]:
        - button "Expand all" [ref=f13e38] [cursor=pointer]
        - generic [ref=f13e40]:
          - generic [ref=f13e41]:
            - generic [ref=f13e42]: Expansion
            - generic [ref=f13e43]: 43%
          - slider "Expansion" [ref=f13e44] [cursor=pointer]: "0.43"
          - generic [ref=f13e45]:
            - generic [ref=f13e46]: Assembled
            - generic [ref=f13e47]: Recipe view
        - switch "Rotate independently" [ref=f13e48] [cursor=pointer]
        - button "Reset alignment" [ref=f13e52] [cursor=pointer]
      - generic [ref=f13e57]:
        - region "Compare BBF Negroni" [ref=f13e58]:
          - generic [ref=f13e59]:
            - generic [ref=f13e60]:
              - text: Bar Bon Funk
              - heading [level=2] [ref=f13e61]:
                - button "BBF Negroni" [ref=f13e62] [cursor=pointer]
              - paragraph [ref=f13e63]: Oak-aged. Deep red. Orange aroma.
            - button "Remove BBF Negroni from comparison" [ref=f13e64] [cursor=pointer]
          - generic [ref=f13e69]:
            - group "BBF Negroni image view" [ref=f13e70]:
              - button "3D model" [pressed] [ref=f13e71] [cursor=pointer]
              - button "Reference photo" [ref=f13e75] [cursor=pointer]
            - group "BBF Negroni interactive 3D viewer" [ref=f13e82]:
              - generic [aria-hidden]:
                - button:
                  - generic: "1"
                  - text: Orange garnish
                - button:
                  - generic: "2"
                  - text: Orange zest oils · estimated
                - button:
                  - generic: "3"
                  - text: Blended vermouths
                - button:
                  - generic: "4"
                  - text: Campari · amaro blend
                - button:
                  - generic: "5"
                  - text: Gin
                - button:
                  - generic: "6"
                  - text: Clear ice · heavy-base glass
              - generic [ref=f13e86]:
                - button "Zoom in" [ref=f13e87] [cursor=pointer]
                - button "Zoom out" [ref=f13e89] [cursor=pointer]
              - generic:
                - text: Drag to rotate ·
                - generic: double-click to expand
          - generic "3D inspection controls" [ref=f13e91]:
            - generic [ref=f13e92]:
              - button "Rotate left" [ref=f13e93] [cursor=pointer]
              - button "Rotate right" [ref=f13e96] [cursor=pointer]
              - button "View from higher angle" [ref=f13e99] [cursor=pointer]
              - button "View from lower angle" [ref=f13e102] [cursor=pointer]
              - button "Zoom in" [ref=f13e105] [cursor=pointer]
              - button "Zoom out" [ref=f13e107] [cursor=pointer]
            - button "Reset view" [ref=f13e109] [cursor=pointer]
          - generic [ref=f13e113]:
            - button "Garnish Orange garnish Observed in the finished serving" [ref=f13e114] [cursor=pointer]:
              - generic [ref=f13e115]: Garnish
              - strong [ref=f13e116]: Orange garnish
              - generic [ref=f13e117]: Observed in the finished serving
            - button "Distinctive modifiers Orange zest oils · estimated Closest recipe match" [ref=f13e118] [cursor=pointer]:
              - generic [ref=f13e119]: Distinctive modifiers
              - strong [ref=f13e120]: Orange zest oils · estimated
              - generic [ref=f13e121]: Closest recipe match
            - button "Vermouth / wine Blended vermouths Confirmed in the film" [ref=f13e122] [cursor=pointer]:
              - generic [ref=f13e123]: Vermouth / wine
              - strong [ref=f13e124]: Blended vermouths
              - generic [ref=f13e125]: Confirmed in the film
            - button "Bitter / amaro Campari · amaro blend Confirmed by atlas editor" [ref=f13e126] [cursor=pointer]:
              - generic [ref=f13e127]: Bitter / amaro
              - strong [ref=f13e128]: Campari · amaro blend
              - generic [ref=f13e129]: Confirmed by atlas editor
            - button "Base spirit Gin Confirmed in the film" [ref=f13e130] [cursor=pointer]:
              - generic [ref=f13e131]: Base spirit
              - strong [ref=f13e132]: Gin
              - generic [ref=f13e133]: Confirmed in the film
            - button "Serving structure Clear ice · heavy-base glass Observed in the finished serving" [ref=f13e134] [cursor=pointer]:
              - generic [ref=f13e135]: Serving structure
              - strong [ref=f13e136]: Clear ice · heavy-base glass
              - generic [ref=f13e137]: Observed in the finished serving
          - generic [ref=f13e138]:
            - heading "Preparation" [level=3] [ref=f13e139]
            - paragraph [ref=f13e140]: American-oak aging
            - paragraph [ref=f13e141]: Freezing for texture
            - paragraph [ref=f13e142]: Flamed orange aroma
          - group [ref=f13e143]:
            - generic "About this filmed version" [ref=f13e144] [cursor=pointer]
        - region "Compare Ichigo Negroni" [ref=f13e147]:
          - generic [ref=f13e148]:
            - generic [ref=f13e149]:
              - text: MOGA
              - heading [level=2] [ref=f13e150]:
                - button "Ichigo Negroni" [ref=f13e151] [cursor=pointer]
              - paragraph [ref=f13e152]: Strawberry. Clarified. Golden amber.
            - button "Remove Ichigo Negroni from comparison" [ref=f13e153] [cursor=pointer]
          - generic [ref=f13e158]:
            - group "Ichigo Negroni image view" [ref=f13e159]:
              - button "3D model" [pressed] [ref=f13e160] [cursor=pointer]
              - button "Reference photo" [ref=f13e164] [cursor=pointer]
            - group "Ichigo Negroni interactive 3D viewer" [ref=f13e171]:
              - generic [aria-hidden]:
                - button:
                  - generic: "1"
                  - text: Yellow flower · red garnish
                - button:
                  - generic: "2"
                  - text: Strawberry
                - button:
                  - generic: "3"
                  - text: Sweet vermouth · estimated
                - button:
                  - generic: "4"
                  - text: Campari
                - button:
                  - generic: "5"
                  - text: Tanqueray gin · estimated
                - button:
                  - generic: "6"
                  - text: Clear ice · rocks glass
              - generic [ref=f13e175]:
                - button "Zoom in" [ref=f13e176] [cursor=pointer]
                - button "Zoom out" [ref=f13e178] [cursor=pointer]
              - generic:
                - text: Drag to rotate ·
                - generic: double-click to expand
          - generic "3D inspection controls" [ref=f13e180]:
            - generic [ref=f13e181]:
              - button "Rotate left" [ref=f13e182] [cursor=pointer]
              - button "Rotate right" [ref=f13e185] [cursor=pointer]
              - button "View from higher angle" [ref=f13e188] [cursor=pointer]
              - button "View from lower angle" [ref=f13e191] [cursor=pointer]
              - button "Zoom in" [ref=f13e194] [cursor=pointer]
              - button "Zoom out" [ref=f13e196] [cursor=pointer]
            - button "Reset view" [ref=f13e198] [cursor=pointer]
          - generic [ref=f13e202]:
            - button "Garnish Yellow flower · red garnish Observed in the finished serving" [ref=f13e203] [cursor=pointer]:
              - generic [ref=f13e204]: Garnish
              - strong [ref=f13e205]: Yellow flower · red garnish
              - generic [ref=f13e206]: Observed in the finished serving
            - button "Distinctive modifiers Strawberry Confirmed in the film" [ref=f13e207] [cursor=pointer]:
              - generic [ref=f13e208]: Distinctive modifiers
              - strong [ref=f13e209]: Strawberry
              - generic [ref=f13e210]: Confirmed in the film
            - button "Vermouth / wine Sweet vermouth · estimated Closest recipe match" [ref=f13e211] [cursor=pointer]:
              - generic [ref=f13e212]: Vermouth / wine
              - strong [ref=f13e213]: Sweet vermouth · estimated
              - generic [ref=f13e214]: Closest recipe match
            - button "Bitter / amaro Campari Confirmed by atlas editor" [ref=f13e215] [cursor=pointer]:
              - generic [ref=f13e216]: Bitter / amaro
              - strong [ref=f13e217]: Campari
              - generic [ref=f13e218]: Confirmed by atlas editor
            - button "Base spirit Tanqueray gin · estimated Closest recipe match" [ref=f13e219] [cursor=pointer]:
              - generic [ref=f13e220]: Base spirit
              - strong [ref=f13e221]: Tanqueray gin · estimated
              - generic [ref=f13e222]: Closest recipe match
            - button "Serving structure Clear ice · rocks glass Observed in the finished serving" [ref=f13e223] [cursor=pointer]:
              - generic [ref=f13e224]: Serving structure
              - strong [ref=f13e225]: Clear ice · rocks glass
              - generic [ref=f13e226]: Observed in the finished serving
          - generic [ref=f13e227]:
            - heading "Preparation" [level=3] [ref=f13e228]
            - paragraph [ref=f13e229]: Milk clarification
          - group [ref=f13e230]:
            - generic "About this filmed version" [ref=f13e231] [cursor=pointer]
        - region "Compare Negroni Express" [ref=f13e234]:
          - generic [ref=f13e235]:
            - generic [ref=f13e236]:
              - text: Bar Somma
              - heading [level=2] [ref=f13e237]:
                - button "Negroni Express" [ref=f13e238] [cursor=pointer]
              - paragraph [ref=f13e239]: Ancho Verde. Rice syrup. Shishito.
            - button "Remove Negroni Express from comparison" [ref=f13e240] [cursor=pointer]
          - generic [ref=f13e245]:
            - group "Negroni Express image view" [ref=f13e246]:
              - button "3D model" [pressed] [ref=f13e247] [cursor=pointer]
              - button "Reference photo" [ref=f13e251] [cursor=pointer]
            - group "Negroni Express interactive 3D viewer" [ref=f13e258]:
              - status [ref=f13e259]:
                - text: Preparing live 3D
                - generic [ref=f13e261]: Glass, ingredients & garnish
              - generic [aria-hidden]:
                - button [ref=f13e265] [cursor=pointer]:
                  - generic [ref=f13e266]: "1"
                  - text: Pickled shishito
                - button [ref=f13e267] [cursor=pointer]:
                  - generic [ref=f13e268]: "2"
                  - text: Ancho Verde · rice syrup
                - button [ref=f13e269] [cursor=pointer]:
                  - generic [ref=f13e270]: "3"
                  - text: Sweet red vermouth · estimated
                - button [ref=f13e271] [cursor=pointer]:
                  - generic [ref=f13e272]: "4"
                  - text: Campari
                - button [ref=f13e273] [cursor=pointer]:
                  - generic [ref=f13e274]: "5"
                  - text: Gin · estimated
                - button [ref=f13e275] [cursor=pointer]:
                  - generic [ref=f13e276]: "6"
                  - text: Large ice · low tumbler
              - generic [ref=f13e277]:
                - button "Zoom in" [ref=f13e278] [cursor=pointer]
                - button "Zoom out" [ref=f13e280] [cursor=pointer]
              - generic:
                - text: Drag to rotate ·
                - generic: double-click to expand
          - generic "3D inspection controls" [ref=f13e282]:
            - generic [ref=f13e283]:
              - button "Rotate left" [ref=f13e284] [cursor=pointer]
              - button "Rotate right" [ref=f13e287] [cursor=pointer]
              - button "View from higher angle" [ref=f13e290] [cursor=pointer]
              - button "View from lower angle" [ref=f13e293] [cursor=pointer]
              - button "Zoom in" [ref=f13e296] [cursor=pointer]
              - button "Zoom out" [ref=f13e298] [cursor=pointer]
            - button "Reset view" [ref=f13e300] [cursor=pointer]
          - generic [ref=f13e304]:
            - button "Garnish Pickled shishito Confirmed in the film" [ref=f13e305] [cursor=pointer]:
              - generic [ref=f13e306]: Garnish
              - strong [ref=f13e307]: Pickled shishito
              - generic [ref=f13e308]: Confirmed in the film
            - button "Distinctive modifiers Ancho Verde · rice syrup Confirmed in the film" [ref=f13e309] [cursor=pointer]:
              - generic [ref=f13e310]: Distinctive modifiers
              - strong [ref=f13e311]: Ancho Verde · rice syrup
              - generic [ref=f13e312]: Confirmed in the film
            - button "Vermouth / wine Sweet red vermouth · estimated Closest recipe match" [ref=f13e313] [cursor=pointer]:
              - generic [ref=f13e314]: Vermouth / wine
              - strong [ref=f13e315]: Sweet red vermouth · estimated
              - generic [ref=f13e316]: Closest recipe match
            - button "Bitter / amaro Campari Confirmed by atlas editor" [ref=f13e317] [cursor=pointer]:
              - generic [ref=f13e318]: Bitter / amaro
              - strong [ref=f13e319]: Campari
              - generic [ref=f13e320]: Confirmed by atlas editor
            - button "Base spirit Gin · estimated Closest recipe match" [ref=f13e321] [cursor=pointer]:
              - generic [ref=f13e322]: Base spirit
              - strong [ref=f13e323]: Gin · estimated
              - generic [ref=f13e324]: Closest recipe match
            - button "Serving structure Large ice · low tumbler Observed in the finished serving" [ref=f13e325] [cursor=pointer]:
              - generic [ref=f13e326]: Serving structure
              - strong [ref=f13e327]: Large ice · low tumbler
              - generic [ref=f13e328]: Observed in the finished serving
          - generic [ref=f13e329]:
            - heading "Preparation" [level=3] [ref=f13e330]
            - paragraph [ref=f13e331]: Expressed orange oil
          - group [ref=f13e332]:
            - generic "About this filmed version" [ref=f13e333] [cursor=pointer]
  - contentinfo [ref=f13e336]:
    - link "SpiritAtlas" [ref=f13e337] [cursor=pointer]:
      - /url: /
    - generic [ref=f13e338]: Three interpretations. An invitation to look closer.
    - button "Return to the atlas" [ref=f13e339] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import fs from 'node:fs/promises';
  3   | import { drinkIds, expectNoPageOverflow, positionError, snapshot, viewer, waitExpansion, waitLive } from './helpers';
  4   | 
  5   | const evidenceDir = `docs/brand-evidence/${process.env.ATLAS_BRAND_RUN || 'local'}`;
  6   | const entries = [
  7   |   { id: 'bbf-negroni', bar: 'Bar Bon Funk', name: 'BBF Negroni' },
  8   |   { id: 'ichigo-negroni', bar: 'MOGA', name: 'Ichigo Negroni' },
  9   |   { id: 'negroni-express', bar: 'Bar Somma', name: 'Negroni Express' },
  10  | ] as const;
  11  | const headline = (page: Page) => page.getByRole('heading', { level: 1, name: 'Singapore’s cocktails. Inside out.' });
  12  | const failures = new WeakMap<Page, string[]>();
  13  | 
  14  | test.beforeEach(async ({ page }) => {
  15  |   const errors: string[] = [];
  16  |   failures.set(page, errors);
  17  |   page.on('pageerror', error => errors.push(error.message));
  18  |   page.on('console', message => {
  19  |     if (message.type() !== 'error') return;
  20  |     const source = message.location().url;
  21  |     if (!source || new URL(source, page.url()).origin === new URL(page.url()).origin) errors.push(message.text());
  22  |   });
  23  |   page.on('response', response => {
  24  |     if (response.status() >= 400 && new URL(response.url()).origin === new URL(page.url()).origin) errors.push(`${response.status()} ${response.url()}`);
  25  |   });
  26  |   page.on('requestfailed', request => {
  27  |     if (!request.failure()?.errorText.includes('ERR_ABORTED') && new URL(request.url()).origin === new URL(page.url()).origin) errors.push(`${request.failure()?.errorText} ${request.url()}`);
  28  |   });
  29  |   await fs.mkdir(evidenceDir, { recursive: true });
  30  | });
  31  | 
  32  | test.afterEach(async ({ page }, testInfo) => {
  33  |   await testInfo.attach('runtime-errors', { body: JSON.stringify(failures.get(page)), contentType: 'application/json' });
> 34  |   expect(failures.get(page), 'No first-party runtime errors or failed required asset requests').toEqual([]);
      |                                                                                                 ^ Error: No first-party runtime errors or failed required asset requests
  35  | });
  36  | 
  37  | test('headline, CTA and faithful poster appear while models are held; only the hero model is requested initially', async ({ page }, testInfo) => {
  38  |   const models: string[] = [];
  39  |   let release!: () => void;
  40  |   const held = new Promise<void>(resolve => { release = resolve; });
  41  |   await page.route('**/*.glb*', async route => {
  42  |     models.push(new URL(route.request().url()).pathname);
  43  |     await held;
  44  |     await route.continue();
  45  |   });
  46  |   try {
  47  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  48  |     await expect(headline(page)).toBeVisible();
  49  |     await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeVisible();
  50  |     await expect.poll(() => models.length).toBeGreaterThan(0);
  51  |     const poster = page.locator('.sa-hero-viewer img').first();
  52  |     await expect(poster).toBeVisible();
  53  |     expect(await poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  54  |     await page.waitForTimeout(800);
  55  |     expect(models.length).toBe(1);
  56  |     expect(models[0]).toContain('bbf-negroni');
  57  |     await page.screenshot({ path: `${evidenceDir}/loading-poster-1440x1000.png` });
  58  |     const timings = await page.evaluate(() => ({
  59  |       paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: entry.startTime })),
  60  |       fonts: performance.getEntriesByType('resource').filter(entry => /\.woff2/.test(entry.name)).map(entry => entry.name),
  61  |       loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
  62  |     }));
  63  |     await testInfo.attach('initial-loading', { body: JSON.stringify({ models, ...timings }, null, 2), contentType: 'application/json' });
  64  |     expect(timings.fonts.some(url => url.includes('instrument-sans'))).toBe(true);
  65  |     expect(timings.loadedFonts.some(font => font.includes('Instrument Sans'))).toBe(true);
  66  |   } finally { release(); }
  67  |   await waitLive(page, ['bbf-negroni']);
  68  | });
  69  | 
  70  | for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  71  |   test(`landing composition and links at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
  72  |     await page.setViewportSize(viewport);
  73  |     await page.goto('/');
  74  |     await expect(headline(page)).toBeVisible();
  75  |     await page.evaluate(() => document.fonts.ready);
  76  |     await waitLive(page, ['bbf-negroni']);
  77  |     await expectNoPageOverflow(page);
  78  |     await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeInViewport();
  79  |     const contrasts = await page.evaluate(() => {
  80  |       const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  81  |       const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
  82  |         const linear = value / 255;
  83  |         return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
  84  |       }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  85  |       return ['.sa-hero h1', '.sa-hero h1 span', '.sa-hero-copy p', '.sa-hero-copy .sa-action'].map(selector => {
  86  |         const style = getComputedStyle(document.querySelector(selector)!);
  87  |         const foreground = rgba(style.color);
  88  |         const background = rgba(selector.endsWith('.sa-action') ? style.backgroundColor : getComputedStyle(document.querySelector('.sa-landing')!).backgroundColor);
  89  |         const alpha = foreground[3] ?? 1;
  90  |         const rendered = foreground.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
  91  |         const a = luminance(rendered), b = luminance(background);
  92  |         return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  93  |       });
  94  |     });
  95  |     for (const color of contrasts) expect(color.ratio, `${color.selector} text contrast`).toBeGreaterThanOrEqual(4.5);
  96  |     await testInfo.attach('hero-text-contrast', { body: JSON.stringify(contrasts), contentType: 'application/json' });
  97  |     for (const entry of entries) {
  98  |       const link = page.getByRole('link', { name: `Explore ${entry.bar}: ${entry.name}`, exact: true });
  99  |       await expect(link).toHaveAttribute('href', `/?drink=${entry.id}`);
  100 |     }
  101 |     await page.screenshot({ path: `${evidenceDir}/homepage-${viewport.width}x${viewport.height}.png` });
  102 |     // Visit each section before the full-page capture so native lazy images are
  103 |     // decoded and reveal transitions reflect an actual completed scroll journey.
  104 |     for (const reveal of await page.locator('.sa-reveal').all()) {
  105 |       await reveal.scrollIntoViewIfNeeded();
  106 |       await expect(reveal).toHaveClass(/is-revealed/);
  107 |     }
  108 |     for (const poster of await page.locator('.sa-bar-image img').all()) {
  109 |       await poster.scrollIntoViewIfNeeded();
  110 |       await poster.evaluate((image: HTMLImageElement) => image.decode());
  111 |     }
  112 |     await page.getByRole('heading', { name: 'Same starting point. A different point of view.' }).scrollIntoViewIfNeeded();
  113 |     await expectNoPageOverflow(page);
  114 |     await expect.poll(() => page.locator('.sa-bar-image img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  115 |     // Full-page captures begun mid-page can place fixed offscreen skip links in
  116 |     // the document image. Return to the actual top before recording the page.
  117 |     await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  118 |     await page.screenshot({ path: `${evidenceDir}/homepage-full-${viewport.width}x${viewport.height}.png`, fullPage: true, animations: 'disabled' });
  119 |     await testInfo.attach('viewport-layout', { body: JSON.stringify(await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family) }))), contentType: 'application/json' });
  120 |   });
  121 | }
  122 | 
  123 | test('keyboard CTA enters atlas and each featured bar opens the correct working experience with return home', async ({ page }) => {
  124 |   await page.goto('/');
  125 |   const cta = page.getByRole('link', { name: 'Explore the atlas', exact: true });
  126 |   await cta.focus();
  127 |   await expect(cta).toBeFocused();
  128 |   expect(await cta.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  129 |   expect(parseFloat(await cta.evaluate(element => getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2);
  130 |   await cta.press('Enter');
  131 |   await expect(page).toHaveURL(/bar=bar-bon-funk/);
  132 |   await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
  133 |   await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  134 |   await expect(headline(page)).toBeVisible();
```