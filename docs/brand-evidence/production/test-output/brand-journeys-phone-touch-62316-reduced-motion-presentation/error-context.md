# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> phone touch and reduced motion >> touch orbit, visible ingredient controls and stable reduced-motion presentation
- Location: tests/brand-journeys.spec.ts:247:3

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
- generic [ref=f1e2]:
  - link "Skip to the atlas" [ref=f1e3] [cursor=pointer]:
    - /url: "#main-content"
  - banner [ref=f1e4]:
    - link "SpiritAtlas home" [ref=f1e5] [cursor=pointer]:
      - /url: /
      - text: SpiritAtlas.
    - navigation "Main navigation" [ref=f1e6]:
      - button "The atlas" [ref=f1e7] [cursor=pointer]
      - button "Compare" [ref=f1e11] [cursor=pointer]
    - button "Copy a link to this view" [ref=f1e14] [cursor=pointer]
  - navigation "Cocktail collections" [ref=f1e18]:
    - button "Negronis" [pressed] [ref=f1e19] [cursor=pointer]
    - button "Espresso Martinis" [ref=f1e20] [cursor=pointer]
    - button "Martinis" [ref=f1e21] [cursor=pointer]
    - button "Highballs" [ref=f1e22] [cursor=pointer]
  - status
  - main [ref=f1e23]:
    - generic [ref=f1e24]:
      - generic [ref=f1e25]:
        - heading [level=1] [ref=f1e26]:
          - text: Three bars.Three takes on
          - emphasis [ref=f1e27]: the Negroni.
        - paragraph [ref=f1e28]: From oak-aged red to clarified amber. Explore the three filmed interpretations. Explore the bars and unfold their drinks.
      - region "Singapore venue map" [ref=f1e29]:
        - generic [ref=f1e30]:
          - generic:
            - region "Navigable Singapore map showing New Bahru, MOGA. Equivalent venue choices are in the bar list." [ref=f1e31]
            - 'button "New Bahru, two bars: Bar Bon Funk and Bar Somma" [pressed] [ref=f1e32] [cursor=pointer]':
              - generic [ref=f1e33]: "2"
              - generic [ref=f1e34]:
                - strong [ref=f1e35]: New Bahru
                - generic [ref=f1e36]: 2 bars
            - button "Select MOGA on Hill Street" [ref=f1e37] [cursor=pointer]:
              - generic [ref=f1e38]: M
              - generic [ref=f1e39]:
                - strong [ref=f1e40]: MOGA
                - generic [ref=f1e41]: City Hall
          - generic:
            - generic [ref=f1e42]:
              - button "Zoom in" [ref=f1e43] [cursor=pointer]
              - button "Zoom out" [ref=f1e45] [cursor=pointer]
            - group [ref=f1e47]:
              - generic [ref=f1e48]:
                - link "OpenFreeMap" [ref=f1e49] [cursor=pointer]:
                  - /url: https://openfreemap.org
                - link "© OpenMapTiles" [ref=f1e50] [cursor=pointer]:
                  - /url: https://www.openmaptiles.org/
                - text: Data from
                - link "OpenStreetMap" [ref=f1e51] [cursor=pointer]:
                  - /url: https://www.openstreetmap.org/copyright
        - generic [ref=f1e52]: Singapore
        - button "Show all featured venues" [ref=f1e57] [cursor=pointer]
        - generic [ref=f1e61]:
          - generic [ref=f1e62]:
            - generic [ref=f1e63]: "New Bahru · Level 2 · #02-01"
            - heading "Bar Bon Funk" [level=3] [ref=f1e64]
            - paragraph [ref=f1e65]: BBF Negroni
          - button "Explore drink" [ref=f1e66] [cursor=pointer]
      - region "Featured bars" [ref=f1e70]:
        - generic [ref=f1e71]:
          - heading "The three stops" [level=2] [ref=f1e72]
          - generic [ref=f1e73]: Singapore
        - article [ref=f1e74]:
          - 'button "Bar Bon Funk BBF Negroni New Bahru · Level 2 · #02-01" [pressed] [ref=f1e75] [cursor=pointer]':
            - strong [ref=f1e77]: Bar Bon Funk
            - generic [ref=f1e81]: BBF Negroni
            - generic [ref=f1e82]: "New Bahru · Level 2 · #02-01"
          - generic [ref=f1e83]:
            - button "Explore drink" [ref=f1e84] [cursor=pointer]
            - button "Add BBF Negroni to comparison" [ref=f1e87] [cursor=pointer]:
              - generic [ref=f1e89]: Compare
        - article [ref=f1e90]:
          - button "MOGA Ichigo Negroni Pullman Hill Street · Level 1" [ref=f1e91] [cursor=pointer]:
            - strong [ref=f1e93]: MOGA
            - generic [ref=f1e97]: Ichigo Negroni
            - generic [ref=f1e98]: Pullman Hill Street · Level 1
          - generic [ref=f1e99]:
            - button "Explore drink" [ref=f1e100] [cursor=pointer]
            - button "Add Ichigo Negroni to comparison" [ref=f1e103] [cursor=pointer]:
              - generic [ref=f1e105]: Compare
        - article [ref=f1e106]:
          - 'button "Bar Somma Negroni Express New Bahru · Level 4 · #04-02A" [ref=f1e107] [cursor=pointer]':
            - strong [ref=f1e109]: Bar Somma
            - generic [ref=f1e113]: Negroni Express
            - generic [ref=f1e114]: "New Bahru · Level 4 · #04-02A"
          - generic [ref=f1e115]:
            - button "Explore drink" [ref=f1e116] [cursor=pointer]
            - button "Add Negroni Express to comparison" [ref=f1e119] [cursor=pointer]:
              - generic [ref=f1e121]: Compare
        - button "Compare all three" [ref=f1e122] [cursor=pointer]
        - paragraph [ref=f1e127]: Two of these bars share New Bahru.Same building, different stories.12 drinks · 6 Singapore bars in the atlas.
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
  21  |     if (!source || new URL(source, page.url()).origin === new URL(page.url()).origin) errors.push(`${message.text()}${source ? ` [${source}]` : ''}`);
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