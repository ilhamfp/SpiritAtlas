# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> keyboard CTA enters atlas and each featured bar opens the correct working experience with return home
- Location: tests/brand-journeys.spec.ts:123:1

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
- generic [ref=f11e3]:
  - link "Skip to content" [ref=f11e4] [cursor=pointer]:
    - /url: "#landing-content"
  - banner [ref=f11e5]:
    - link "SpiritAtlas home" [ref=f11e6] [cursor=pointer]:
      - /url: /
      - text: SpiritAtlas.
    - navigation "Main navigation" [ref=f11e7]:
      - link "The bars" [ref=f11e8] [cursor=pointer]:
        - /url: "#the-bars"
      - link "Inside the drink" [ref=f11e9] [cursor=pointer]:
        - /url: "#inside"
      - link "Open atlas" [ref=f11e10] [cursor=pointer]:
        - /url: /?bar=bar-bon-funk
  - main [ref=f11e14]:
    - region [ref=f11e15]:
      - generic:
        - heading "Singapore’s cocktails. Inside out." [level=1] [ref=f11e16]: Singapore’scocktails.Inside out.
        - paragraph [ref=f11e17]: Explore the bars. Unfold the ingredients. Discover a different side of every drink.
        - link "Explore the atlas" [ref=f11e18] [cursor=pointer]:
          - /url: /?bar=bar-bon-funk
      - generic [ref=f11e22]:
        - generic [ref=f11e23]: 1.2922° N / 103.8393° E
        - group "BBF Negroni interactive 3D viewer" [ref=f11e25]:
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
          - generic [ref=f11e29]:
            - button "Zoom in" [ref=f11e30] [cursor=pointer]
            - button "Zoom out" [ref=f11e32] [cursor=pointer]
        - generic [ref=f11e34]:
          - generic [ref=f11e35]:
            - generic [ref=f11e36]: 01 / BAR BON FUNK
            - link "BBF Negroni" [ref=f11e37] [cursor=pointer]:
              - /url: /?drink=bbf-negroni
          - button "Look inside" [ref=f11e41] [cursor=pointer]
        - generic [ref=f11e45]:
          - generic [ref=f11e46]: Drag to discover another angle
          - generic [ref=f11e47]:
            - button "Rotate featured cocktail left" [ref=f11e48] [cursor=pointer]
            - button "Rotate featured cocktail right" [ref=f11e51] [cursor=pointer]
      - generic [ref=f11e54]:
        - generic [ref=f11e55]: SINGAPORE, THROUGH A DIFFERENT GLASS
        - link "Meet the three bars" [ref=f11e56] [cursor=pointer]:
          - /url: "#the-bars"
    - region [ref=f11e59]:
      - generic [ref=f11e60]:
        - heading "Three bars. Distinctly their own." [level=2] [ref=f11e61]: Three bars.Distinctly their own.
        - paragraph [ref=f11e62]: One city. Three interpretations of the Negroni.Start with a familiar drink. See where it takes you.
      - generic [ref=f11e63]:
        - article [ref=f11e64]:
          - 'link "Explore Bar Bon Funk: BBF Negroni" [ref=f11e65] [cursor=pointer]':
            - /url: /?drink=bbf-negroni
            - generic [ref=f11e66]:
              - generic [ref=f11e67]: "01"
              - generic [ref=f11e68]: River Valley
            - img "Deep red to brown-red liquid. Straight rocks glass with substantial clear base. Large clear ice and rounded orange garnish" [ref=f11e73]
            - heading "Bar Bon Funk" [level=3] [ref=f11e74]
            - generic [ref=f11e75]: BBF Negroni
          - paragraph [ref=f11e76]: Time, cold and orange aroma. An oak-aged take at New Bahru.
          - link "Explore the drink" [ref=f11e77] [cursor=pointer]:
            - /url: /?drink=bbf-negroni
        - article [ref=f11e80]:
          - 'link "Explore MOGA: Ichigo Negroni" [ref=f11e81] [cursor=pointer]':
            - /url: /?drink=ichigo-negroni
            - generic [ref=f11e82]:
              - generic [ref=f11e83]: "02"
              - generic [ref=f11e84]: City Hall
            - img "Transparent golden-amber liquid. Cylindrical rocks glass and large clear ice. Densely petalled yellow flower over a round red garnish" [ref=f11e89]
            - heading "MOGA" [level=3] [ref=f11e90]
            - generic [ref=f11e91]: Ichigo Negroni
          - paragraph [ref=f11e92]: Strawberry meets milk clarification in the Ichigo Negroni.
          - link "Explore the drink" [ref=f11e93] [cursor=pointer]:
            - /url: /?drink=ichigo-negroni
        - article [ref=f11e96]:
          - 'link "Explore Bar Somma: Negroni Express" [ref=f11e97] [cursor=pointer]':
            - /url: /?drink=negroni-express
            - generic [ref=f11e98]:
              - generic [ref=f11e99]: "03"
              - generic [ref=f11e100]: River Valley
            - img "Red-orange liquid in a low tumbler with curved lower profile. Prominent clear ice block. Curved wrinkled green shishito with its stem" [ref=f11e105]
            - heading "Bar Somma" [level=3] [ref=f11e106]
            - generic [ref=f11e107]: Negroni Express
          - paragraph [ref=f11e108]: A red-orange Negroni with a distinctive pickled shishito garnish.
          - link "Explore the drink" [ref=f11e109] [cursor=pointer]:
            - /url: /?drink=negroni-express
    - region [ref=f11e112]:
      - generic [ref=f11e113]:
        - heading "There’s more in the glass." [level=2] [ref=f11e114]: There’s morein the glass.
        - paragraph [ref=f11e115]: A garnish. A spirit. An unexpected detail.Open up a cocktail and explore the ingredients that make it its own.
        - link "Explore ingredients" [ref=f11e116] [cursor=pointer]:
          - /url: /?drink=ichigo-negroni&expand=1
        - generic [ref=f11e120]: Ingredients shown separately to help you explore.Estimates are marked; shapes don’t indicate amounts.
      - generic [ref=f11e121]:
        - generic [ref=f11e122]: A CLOSER LOOK / ICHIGO NEGRONI
        - generic [ref=f11e123]:
          - generic [ref=f11e124]: "01"
          - generic [ref=f11e125]:
            - heading "The finishing touch" [level=3] [ref=f11e126]
            - paragraph [ref=f11e127]: A yellow flower, a red garnish. The first details you see.
        - generic [ref=f11e128]:
          - generic [ref=f11e129]: "02"
          - generic [ref=f11e130]:
            - heading "A different clarity" [level=3] [ref=f11e131]
            - paragraph [ref=f11e132]: Strawberry and milk clarification shape MOGA’s interpretation.
        - generic [ref=f11e133]:
          - generic [ref=f11e134]: "03"
          - generic [ref=f11e135]:
            - heading "The foundation" [level=3] [ref=f11e136]
            - paragraph [ref=f11e137]: Explore the spirit, bitter and vermouth categories behind the drink.
        - link "Look inside the Ichigo Negroni" [ref=f11e138] [cursor=pointer]:
          - /url: /?drink=ichigo-negroni&expand=1
    - region [ref=f11e141]:
      - generic [ref=f11e142]:
        - generic [ref=f11e143]: BAR BON FUNK / MOGA / BAR SOMMA
        - heading "Same starting point. A different point of view." [level=2] [ref=f11e144]: Same starting point.A different point of view.
        - paragraph [ref=f11e145]: Put the three Negronis side by side.Rotate together. Open them up. Notice what changes.
        - link "Compare the three" [ref=f11e146] [cursor=pointer]:
          - /url: /?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=1
  - contentinfo [ref=f11e154]:
    - link "SpiritAtlas." [ref=f11e155] [cursor=pointer]:
      - /url: /
    - paragraph [ref=f11e156]: Singapore’s cocktails. Inside out.
    - link "Back to Singapore" [ref=f11e157] [cursor=pointer]:
      - /url: /?bar=bar-bon-funk
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