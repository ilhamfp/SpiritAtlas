# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> WebGL unavailable offers informative fallback without blocking landing and ingredient entry
- Location: tests/brand-journeys.spec.ts:229:1

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
      - button "Compare the drinks" [ref=f1e11] [cursor=pointer]:
        - text: Compare
        - generic [ref=f1e14]: the drinks
    - button "Copy a link to this view" [ref=f1e15] [cursor=pointer]:
      - generic [ref=f1e19]: Share
  - navigation "Cocktail collections" [ref=f1e20]:
    - button "Negronis" [pressed] [ref=f1e21] [cursor=pointer]
    - button "Espresso Martinis" [ref=f1e22] [cursor=pointer]
    - button "Martinis" [ref=f1e23] [cursor=pointer]
    - button "Highballs" [ref=f1e24] [cursor=pointer]
  - status
  - main [ref=f1e25]:
    - generic [ref=f1e26]:
      - generic [ref=f1e27]:
        - button "Back to the atlas" [ref=f1e28] [cursor=pointer]
        - generic "Choose cocktail" [ref=f1e31]:
          - button "View BBF Negroni" [ref=f1e32] [cursor=pointer]: Bar Bon Funk
          - button "View Ichigo Negroni" [pressed] [ref=f1e33] [cursor=pointer]: MOGA
          - button "View Negroni Express" [ref=f1e34] [cursor=pointer]: Bar Somma
      - region "Ichigo Negroni showcase" [ref=f1e35]:
        - generic [ref=f1e36]:
          - link "MOGA · City Hall" [ref=f1e37] [cursor=pointer]:
            - /url: https://www.google.com/maps/search/?api=1&query=MOGA+1+Hill+Street+Singapore
            - text: MOGA
            - generic [ref=f1e41]: · City Hall
          - heading "Ichigo Negroni" [level=1] [ref=f1e45]
          - paragraph [ref=f1e46]: Strawberry and milk clarification transform the classic into a transparent golden-amber drink.
          - paragraph [ref=f1e47]: A clear amber interpretation with strawberry in the drink, a densely petalled yellow flower, and a glossy round red garnish.
          - generic [ref=f1e48]:
            - button "Reassemble drink" [ref=f1e49] [cursor=pointer]
            - button "Add to comparison" [ref=f1e53] [cursor=pointer]
          - generic [ref=f1e55]:
            - generic [ref=f1e56]:
              - generic [ref=f1e57]: Expansion
              - generic [ref=f1e58]: 100%
            - slider "Expansion" [ref=f1e59] [cursor=pointer]: "1"
            - generic [ref=f1e60]:
              - generic [ref=f1e61]: Assembled
              - generic [ref=f1e62]: Recipe view
          - generic "3D inspection controls" [ref=f1e63]:
            - generic [ref=f1e64]:
              - button "Rotate left" [ref=f1e65] [cursor=pointer]
              - button "Rotate right" [ref=f1e68] [cursor=pointer]
              - button "View from higher angle" [ref=f1e71] [cursor=pointer]
              - button "View from lower angle" [ref=f1e74] [cursor=pointer]
              - button "Zoom in" [ref=f1e77] [cursor=pointer]
              - button "Zoom out" [ref=f1e79] [cursor=pointer]
            - button "Reset view" [ref=f1e81] [cursor=pointer]
          - paragraph [ref=f1e85]: Drag to rotate · + / − to zoom · Double-click to expand
        - generic [ref=f1e87]:
          - group "Ichigo Negroni image view" [ref=f1e88]:
            - button "3D model" [pressed] [ref=f1e89] [cursor=pointer]
            - button "Reference photo" [ref=f1e93] [cursor=pointer]
          - generic [ref=f1e99]:
            - group "Ichigo Negroni interactive 3D viewer" [ref=f1e100]:
              - status [ref=f1e101]:
                - paragraph [ref=f1e102]: Interactive 3D is unavailable in this browser.
                - generic [ref=f1e103]: You can still explore every ingredient, compare the recipes, and find the bars.
              - generic:
                - button "1 Yellow flower · red garnish" [ref=f1e104] [cursor=pointer]:
                  - generic [ref=f1e105]: "1"
                  - text: Yellow flower · red garnish
                - button "2 Strawberry" [ref=f1e106] [cursor=pointer]:
                  - generic [ref=f1e107]: "2"
                  - text: Strawberry
                - button "3 Sweet vermouth · estimated" [ref=f1e108] [cursor=pointer]:
                  - generic [ref=f1e109]: "3"
                  - text: Sweet vermouth · estimated
                - button "4 Campari" [ref=f1e110] [cursor=pointer]:
                  - generic [ref=f1e111]: "4"
                  - text: Campari
                - button "5 Tanqueray gin · estimated" [ref=f1e112] [cursor=pointer]:
                  - generic [ref=f1e113]: "5"
                  - text: Tanqueray gin · estimated
                - button "6 Clear ice · rocks glass" [ref=f1e114] [cursor=pointer]:
                  - generic [ref=f1e115]: "6"
                  - text: Clear ice · rocks glass
            - generic: Recipe view · shapes do not show amounts
        - generic [ref=f1e116]:
          - heading "Inside the drink" [level=2] [ref=f1e117]
          - paragraph [ref=f1e118]: Recipe view · ingredients shown separately. Estimated matches are marked. Shapes and sizes do not indicate measured amounts.
          - generic [ref=f1e119]:
            - button "1 Garnish Yellow flower · red garnish" [ref=f1e121] [cursor=pointer]:
              - generic [ref=f1e122]: "1"
              - generic [ref=f1e123]:
                - generic [ref=f1e124]: Garnish
                - strong [ref=f1e125]: Yellow flower · red garnish
            - button "2 Distinctive modifiers Strawberry" [ref=f1e128] [cursor=pointer]:
              - generic [ref=f1e129]: "2"
              - generic [ref=f1e130]:
                - generic [ref=f1e131]: Distinctive modifiers
                - strong [ref=f1e132]: Strawberry
            - button "3 Vermouth / wine Sweet vermouth · estimated" [ref=f1e135] [cursor=pointer]:
              - generic [ref=f1e136]: "3"
              - generic [ref=f1e137]:
                - generic [ref=f1e138]: Vermouth / wine
                - strong [ref=f1e139]: Sweet vermouth · estimated
            - button "4 Bitter / amaro Campari" [ref=f1e142] [cursor=pointer]:
              - generic [ref=f1e143]: "4"
              - generic [ref=f1e144]:
                - generic [ref=f1e145]: Bitter / amaro
                - strong [ref=f1e146]: Campari
            - button "5 Base spirit Tanqueray gin · estimated" [ref=f1e149] [cursor=pointer]:
              - generic [ref=f1e150]: "5"
              - generic [ref=f1e151]:
                - generic [ref=f1e152]: Base spirit
                - strong [ref=f1e153]: Tanqueray gin · estimated
            - button "6 Serving structure Clear ice · rocks glass" [ref=f1e156] [cursor=pointer]:
              - generic [ref=f1e157]: "6"
              - generic [ref=f1e158]:
                - generic [ref=f1e159]: Serving structure
                - strong [ref=f1e160]: Clear ice · rocks glass
          - generic [ref=f1e162]:
            - heading "How it’s made" [level=3] [ref=f1e163]
            - group [ref=f1e164]:
              - generic "Milk clarification" [ref=f1e165] [cursor=pointer]
          - group [ref=f1e167]:
            - generic "About this filmed version" [ref=f1e168] [cursor=pointer]
      - generic [ref=f1e171]:
        - generic [ref=f1e172]:
          - heading "Find MOGA" [level=2] [ref=f1e173]
          - paragraph [ref=f1e174]: A Japanese-inspired bar on Hill Street. Its filmed Ichigo Negroni brings strawberry and milk clarification to the classic.
        - generic [ref=f1e175]:
          - generic [ref=f1e176]: Pullman Hill Street · Level 1
          - generic [ref=f1e177]: 1 Hill Street, Level 1, Pullman Singapore Hill Street, Singapore 179949
          - generic [ref=f1e178]:
            - link "Get directions" [ref=f1e179] [cursor=pointer]:
              - /url: https://www.google.com/maps/search/?api=1&query=MOGA+1+Hill+Street+Singapore
            - link "Visit the bar’s website" [ref=f1e183] [cursor=pointer]:
              - /url: https://www.moga.com.sg/find-us/
      - generic [ref=f1e187]:
        - generic [ref=f1e188]: Another interpretation
        - button "Negroni Express" [ref=f1e189] [cursor=pointer]
  - contentinfo [ref=f1e192]:
    - link "SpiritAtlas" [ref=f1e193] [cursor=pointer]:
      - /url: /
    - generic [ref=f1e194]: Three interpretations. An invitation to look closer.
    - button "Return to the atlas" [ref=f1e195] [cursor=pointer]
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