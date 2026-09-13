# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> headline, CTA and faithful poster appear while 3D code and models are held; only the hero model is requested initially
- Location: tests/brand-journeys.spec.ts:37:1

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Skip to content" [ref=e4] [cursor=pointer]:
    - /url: "#landing-content"
  - banner [ref=e5]:
    - link "SpiritAtlas home" [ref=e6] [cursor=pointer]:
      - /url: /
      - text: SpiritAtlas.
    - navigation "Main navigation" [ref=e7]:
      - link "The bars" [ref=e8] [cursor=pointer]:
        - /url: "#the-bars"
      - link "Inside the drink" [ref=e9] [cursor=pointer]:
        - /url: "#inside"
      - link "Open atlas" [ref=e10] [cursor=pointer]:
        - /url: /?bar=bar-bon-funk
  - main [ref=e14]:
    - region [ref=e15]:
      - generic:
        - heading "Singapore’s cocktails. Inside out." [level=1] [ref=e16]: Singapore’scocktails.Inside out.
        - paragraph [ref=e17]: Explore the bars. Unfold the ingredients. Discover a different side of every drink.
        - link "Explore the atlas" [ref=e18] [cursor=pointer]:
          - /url: /?bar=bar-bon-funk
      - generic [ref=e22]:
        - generic [ref=e23]: 1.2922° N / 103.8393° E
        - generic [ref=e25]:
          - img "BBF Negroni, with dark red liquid and an orange garnish in a rocks glass" [ref=e26]
          - status [ref=e27]: Preparing your drink…
        - generic [ref=e28]:
          - generic [ref=e29]:
            - generic [ref=e30]: 01 / BAR BON FUNK
            - link "BBF Negroni" [ref=e31] [cursor=pointer]:
              - /url: /?drink=bbf-negroni
          - button "Look inside" [ref=e35] [cursor=pointer]
        - generic [ref=e39]:
          - generic [ref=e40]: Drag to discover another angle
          - generic [ref=e41]:
            - button "Rotate featured cocktail left" [ref=e42] [cursor=pointer]
            - button "Rotate featured cocktail right" [ref=e45] [cursor=pointer]
      - generic [ref=e48]:
        - generic [ref=e49]: SINGAPORE, THROUGH A DIFFERENT GLASS
        - link "Meet the three bars" [ref=e50] [cursor=pointer]:
          - /url: "#the-bars"
    - region [ref=e53]:
      - generic [ref=e54]:
        - heading "Three bars. Distinctly their own." [level=2] [ref=e55]: Three bars.Distinctly their own.
        - paragraph [ref=e56]: One city. Three interpretations of the Negroni.Start with a familiar drink. See where it takes you.
      - generic [ref=e57]:
        - article [ref=e58]:
          - 'link "Explore Bar Bon Funk: BBF Negroni" [ref=e59] [cursor=pointer]':
            - /url: /?drink=bbf-negroni
            - generic [ref=e60]:
              - generic [ref=e61]: "01"
              - generic [ref=e62]: River Valley
            - img "Deep red to brown-red liquid. Straight rocks glass with substantial clear base. Large clear ice and rounded orange garnish" [ref=e67]
            - heading "Bar Bon Funk" [level=3] [ref=e68]
            - generic [ref=e69]: BBF Negroni
          - paragraph [ref=e70]: Time, cold and orange aroma. An oak-aged take at New Bahru.
          - link "Explore the drink" [ref=e71] [cursor=pointer]:
            - /url: /?drink=bbf-negroni
        - article [ref=e74]:
          - 'link "Explore MOGA: Ichigo Negroni" [ref=e75] [cursor=pointer]':
            - /url: /?drink=ichigo-negroni
            - generic [ref=e76]:
              - generic [ref=e77]: "02"
              - generic [ref=e78]: City Hall
            - img "Transparent golden-amber liquid. Cylindrical rocks glass and large clear ice. Densely petalled yellow flower over a round red garnish" [ref=e83]
            - heading "MOGA" [level=3] [ref=e84]
            - generic [ref=e85]: Ichigo Negroni
          - paragraph [ref=e86]: Strawberry meets milk clarification in the Ichigo Negroni.
          - link "Explore the drink" [ref=e87] [cursor=pointer]:
            - /url: /?drink=ichigo-negroni
        - article [ref=e90]:
          - 'link "Explore Bar Somma: Negroni Express" [ref=e91] [cursor=pointer]':
            - /url: /?drink=negroni-express
            - generic [ref=e92]:
              - generic [ref=e93]: "03"
              - generic [ref=e94]: River Valley
            - img "Red-orange liquid in a low tumbler with curved lower profile. Prominent clear ice block. Curved wrinkled green shishito with its stem" [ref=e99]
            - heading "Bar Somma" [level=3] [ref=e100]
            - generic [ref=e101]: Negroni Express
          - paragraph [ref=e102]: A red-orange Negroni with a distinctive pickled shishito garnish.
          - link "Explore the drink" [ref=e103] [cursor=pointer]:
            - /url: /?drink=negroni-express
    - region [ref=e106]:
      - generic [ref=e107]:
        - heading "There’s more in the glass." [level=2] [ref=e108]: There’s morein the glass.
        - paragraph [ref=e109]: A garnish. A spirit. An unexpected detail.Open up a cocktail and explore the ingredients that make it its own.
        - link "Explore ingredients" [ref=e110] [cursor=pointer]:
          - /url: /?drink=ichigo-negroni&expand=1
        - generic [ref=e114]: Ingredients shown separately to help you explore.Estimates are marked; shapes don’t indicate amounts.
      - generic [ref=e115]:
        - generic [ref=e116]: A CLOSER LOOK / ICHIGO NEGRONI
        - generic [ref=e117]:
          - generic [ref=e118]: "01"
          - generic [ref=e119]:
            - heading "The finishing touch" [level=3] [ref=e120]
            - paragraph [ref=e121]: A yellow flower, a red garnish. The first details you see.
        - generic [ref=e122]:
          - generic [ref=e123]: "02"
          - generic [ref=e124]:
            - heading "A different clarity" [level=3] [ref=e125]
            - paragraph [ref=e126]: Strawberry and milk clarification shape MOGA’s interpretation.
        - generic [ref=e127]:
          - generic [ref=e128]: "03"
          - generic [ref=e129]:
            - heading "The foundation" [level=3] [ref=e130]
            - paragraph [ref=e131]: Explore the spirit, bitter and vermouth categories behind the drink.
        - link "Look inside the Ichigo Negroni" [ref=e132] [cursor=pointer]:
          - /url: /?drink=ichigo-negroni&expand=1
    - region [ref=e135]:
      - generic [ref=e136]:
        - generic [ref=e137]: BAR BON FUNK / MOGA / BAR SOMMA
        - heading "Same starting point. A different point of view." [level=2] [ref=e138]: Same starting point.A different point of view.
        - paragraph [ref=e139]: Put the three Negronis side by side.Rotate together. Open them up. Notice what changes.
        - link "Compare the three" [ref=e140] [cursor=pointer]:
          - /url: /?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=1
  - contentinfo [ref=e148]:
    - link "SpiritAtlas." [ref=e149] [cursor=pointer]:
      - /url: /
    - paragraph [ref=e150]: Singapore’s cocktails. Inside out.
    - link "Back to Singapore" [ref=e151] [cursor=pointer]:
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
  34  |   expect(failures.get(page), 'No first-party runtime errors or failed required asset requests').toEqual([]);
  35  | });
  36  |
  37  | test('headline, CTA and faithful poster appear while 3D code and models are held; only the hero model is requested initially', async ({ page }, testInfo) => {
  38  |   const codeRequests: string[] = [];
  39  |   const models: string[] = [];
  40  |   let releaseCode!: () => void;
  41  |   const heldCode = new Promise<void>(resolve => { releaseCode = resolve; });
  42  |   let release!: () => void;
  43  |   const held = new Promise<void>(resolve => { release = resolve; });
  44  |   await page.route(/\/(?:assets\/three-[^/]+\.js|src\/scenes\/Viewer\.tsx)(?:\?.*)?$/, async route => {
  45  |     codeRequests.push(new URL(route.request().url()).pathname);
  46  |     await heldCode;
  47  |     await route.continue();
  48  |   });
  49  |   await page.route('**/*.glb*', async route => {
  50  |     models.push(new URL(route.request().url()).pathname);
  51  |     await held;
  52  |     await route.continue();
  53  |   });
  54  |   try {
  55  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  56  |     await expect(headline(page)).toBeVisible();
  57  |     await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeVisible();
  58  |     await expect.poll(() => codeRequests.length).toBeGreaterThan(0);
  59  |     await expect(page.locator('.hero-poster img')).toBeVisible();
> 60  |     expect(await page.locator('.hero-poster img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
      |                                                                                                                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  61  |     expect(models).toEqual([]);
  62  |     await page.screenshot({ path: `${evidenceDir}/loading-before-3d-code-1440x1000.png` });
  63  |     await testInfo.attach('blocked-3d-code', { body: JSON.stringify({ codeRequests, models, headlineVisible: true, ctaVisible: true, posterDecoded: true }), contentType: 'application/json' });
  64  |     releaseCode();
  65  |     await expect.poll(() => models.length).toBeGreaterThan(0);
  66  |     const poster = page.locator('.sa-hero-viewer img').first();
  67  |     await expect(poster).toBeVisible();
  68  |     expect(await poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  69  |     await page.waitForTimeout(800);
  70  |     expect(models.length).toBe(1);
  71  |     expect(models[0]).toContain('bbf-negroni');
  72  |     await page.screenshot({ path: `${evidenceDir}/loading-poster-1440x1000.png` });
  73  |     const timings = await page.evaluate(() => ({
  74  |       paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: entry.startTime })),
  75  |       fonts: performance.getEntriesByType('resource').filter(entry => /\.woff2/.test(entry.name)).map(entry => entry.name),
  76  |       loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
  77  |     }));
  78  |     await testInfo.attach('initial-loading', { body: JSON.stringify({ models, ...timings }, null, 2), contentType: 'application/json' });
  79  |     expect(timings.fonts.some(url => url.includes('instrument-sans'))).toBe(true);
  80  |     expect(timings.loadedFonts.some(font => font.includes('Instrument Sans'))).toBe(true);
  81  |   } finally { releaseCode(); release(); }
  82  |   await waitLive(page, ['bbf-negroni']);
  83  | });
  84  |
  85  | for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  86  |   test(`landing composition and links at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
  87  |     await page.setViewportSize(viewport);
  88  |     await page.goto('/');
  89  |     await expect(headline(page)).toBeVisible();
  90  |     await page.evaluate(() => document.fonts.ready);
  91  |     await waitLive(page, ['bbf-negroni']);
  92  |     await expectNoPageOverflow(page);
  93  |     await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeInViewport();
  94  |     const contrasts = await page.evaluate(() => {
  95  |       const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  96  |       const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
  97  |         const linear = value / 255;
  98  |         return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
  99  |       }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  100 |       return ['.sa-hero h1', '.sa-hero h1 span', '.sa-hero-copy p', '.sa-hero-copy .sa-action'].map(selector => {
  101 |         const style = getComputedStyle(document.querySelector(selector)!);
  102 |         const foreground = rgba(style.color);
  103 |         const background = rgba(selector.endsWith('.sa-action') ? style.backgroundColor : getComputedStyle(document.querySelector('.sa-landing')!).backgroundColor);
  104 |         const alpha = foreground[3] ?? 1;
  105 |         const rendered = foreground.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
  106 |         const a = luminance(rendered), b = luminance(background);
  107 |         return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  108 |       });
  109 |     });
  110 |     for (const color of contrasts) expect(color.ratio, `${color.selector} text contrast`).toBeGreaterThanOrEqual(4.5);
  111 |     await testInfo.attach('hero-text-contrast', { body: JSON.stringify(contrasts), contentType: 'application/json' });
  112 |     for (const entry of entries) {
  113 |       const link = page.getByRole('link', { name: `Explore ${entry.bar}: ${entry.name}`, exact: true });
  114 |       await expect(link).toHaveAttribute('href', `/?drink=${entry.id}`);
  115 |     }
  116 |     await page.screenshot({ path: `${evidenceDir}/homepage-${viewport.width}x${viewport.height}.png` });
  117 |     // Visit each section before the full-page capture so native lazy images are
  118 |     // decoded and reveal transitions reflect an actual completed scroll journey.
  119 |     for (const reveal of await page.locator('.sa-reveal').all()) {
  120 |       await reveal.scrollIntoViewIfNeeded();
  121 |       await expect(reveal).toHaveClass(/is-revealed/);
  122 |     }
  123 |     for (const poster of await page.locator('.sa-bar-image img').all()) {
  124 |       await poster.scrollIntoViewIfNeeded();
  125 |       await poster.evaluate((image: HTMLImageElement) => image.decode());
  126 |     }
  127 |     await page.getByRole('heading', { name: 'Same starting point. A different point of view.' }).scrollIntoViewIfNeeded();
  128 |     await expectNoPageOverflow(page);
  129 |     await expect.poll(() => page.locator('.sa-bar-image img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  130 |     // Full-page captures begun mid-page can place fixed offscreen skip links in
  131 |     // the document image. Return to the actual top before recording the page.
  132 |     await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  133 |     await page.screenshot({ path: `${evidenceDir}/homepage-full-${viewport.width}x${viewport.height}.png`, fullPage: true, animations: 'disabled' });
  134 |     await testInfo.attach('viewport-layout', { body: JSON.stringify(await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family) }))), contentType: 'application/json' });
  135 |   });
  136 | }
  137 |
  138 | test('keyboard CTA enters atlas and each featured bar opens the correct working experience with return home', async ({ page }) => {
  139 |   await page.goto('/');
  140 |   const cta = page.getByRole('link', { name: 'Explore the atlas', exact: true });
  141 |   await cta.focus();
  142 |   await expect(cta).toBeFocused();
  143 |   expect(await cta.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  144 |   expect(parseFloat(await cta.evaluate(element => getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2);
  145 |   await cta.press('Enter');
  146 |   await expect(page).toHaveURL(/bar=bar-bon-funk/);
  147 |   await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
  148 |   await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  149 |   await expect(headline(page)).toBeVisible();
  150 |   for (const entry of entries) {
  151 |     await page.getByRole('link', { name: `Explore ${entry.bar}: ${entry.name}`, exact: true }).click();
  152 |     await expect(page).toHaveURL(new RegExp(`drink=${entry.id}`));
  153 |     await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.name);
  154 |     await waitLive(page, [entry.id]);
  155 |     await page.reload();
  156 |     await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.name);
  157 |     await waitLive(page, [entry.id]);
  158 |     await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  159 |     await expect(headline(page)).toBeVisible();
  160 |   }
```
