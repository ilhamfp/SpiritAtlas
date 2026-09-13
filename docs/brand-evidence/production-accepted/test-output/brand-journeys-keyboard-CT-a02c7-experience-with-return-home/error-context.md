# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> keyboard CTA enters atlas and each featured bar opens the correct working experience with return home
- Location: tests/brand-journeys.spec.ts:167:1

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: getByRole('heading', { level: 1 })
Expected: "Ichigo Negroni"
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toHaveText" getByRole('heading', { level: 1 }) with timeout 25000ms
  - waiting for getByRole('heading', { level: 1 })

```

```
Error: No first-party runtime errors or failed required asset requests

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 5

- Array []
+ Array [
+   "404 https://spiritatlas-one.vercel.app/assets/App-CNqJ4F8m.js",
+   "Failed to load resource: the server responded with a status of 404 () [https://spiritatlas-one.vercel.app/assets/App-CNqJ4F8m.js]",
+   "Failed to fetch dynamically imported module: https://spiritatlas-one.vercel.app/assets/App-CNqJ4F8m.js",
+ ]
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
  14  | async function expectLoadingStatusContrast(page: Page, selector: string) {
  15  |   const status = page.locator(selector);
  16  |   await expect(status).toBeVisible();
  17  |   const contrast = await status.evaluate(element => {
  18  |     const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  19  |     const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
  20  |       const linear = value / 255;
  21  |       return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
  22  |     }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  23  |     const background = rgba(getComputedStyle(element).backgroundColor);
  24  |     const ratios = [element, ...element.querySelectorAll('span:not(.loading-orbit)')].filter(label => getComputedStyle(label).display !== 'none').map(label => {
  25  |       const foreground = rgba(getComputedStyle(label).color);
  26  |       const a = luminance(foreground), b = luminance(background);
  27  |       return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
  28  |     });
  29  |     return { backgroundAlpha: background[3] ?? 1, minimumRatio: Math.min(...ratios) };
  30  |   });
  31  |   expect(contrast.backgroundAlpha, 'Loading feedback has an opaque backdrop over the artwork').toBe(1);
  32  |   expect(contrast.minimumRatio, 'Every loading status label meets normal-text contrast').toBeGreaterThanOrEqual(4.5);
  33  |   return contrast;
  34  | }
  35  |
  36  | test.beforeEach(async ({ page }) => {
  37  |   const errors: string[] = [];
  38  |   failures.set(page, errors);
  39  |   page.on('pageerror', error => errors.push(error.message));
  40  |   page.on('console', message => {
  41  |     if (message.type() !== 'error') return;
  42  |     const source = message.location().url;
  43  |     if (!source || new URL(source, page.url()).origin === new URL(page.url()).origin) errors.push(`${message.text()}${source ? ` [${source}]` : ''}`);
  44  |   });
  45  |   page.on('response', response => {
  46  |     if (response.status() >= 400 && new URL(response.url()).origin === new URL(page.url()).origin) errors.push(`${response.status()} ${response.url()}`);
  47  |   });
  48  |   page.on('requestfailed', request => {
  49  |     if (!request.failure()?.errorText.includes('ERR_ABORTED') && new URL(request.url()).origin === new URL(page.url()).origin) errors.push(`${request.failure()?.errorText} ${request.url()}`);
  50  |   });
  51  |   await fs.mkdir(evidenceDir, { recursive: true });
  52  | });
  53  |
  54  | test.afterEach(async ({ page }, testInfo) => {
  55  |   await testInfo.attach('runtime-errors', { body: JSON.stringify(failures.get(page)), contentType: 'application/json' });
> 56  |   expect(failures.get(page), 'No first-party runtime errors or failed required asset requests').toEqual([]);
      |                                                                                                 ^ Error: No first-party runtime errors or failed required asset requests
  57  | });
  58  |
  59  | test('headline, CTA and faithful poster appear while 3D code and models are held; only the hero model is requested initially', async ({ page }, testInfo) => {
  60  |   const codeRequests: string[] = [];
  61  |   const models: string[] = [];
  62  |   let releaseCode!: () => void;
  63  |   const heldCode = new Promise<void>(resolve => { releaseCode = resolve; });
  64  |   let release!: () => void;
  65  |   const held = new Promise<void>(resolve => { release = resolve; });
  66  |   await page.route(/\/(?:assets\/three-[^/]+\.js|src\/scenes\/Viewer\.tsx)(?:\?.*)?$/, async route => {
  67  |     codeRequests.push(new URL(route.request().url()).pathname);
  68  |     await heldCode;
  69  |     await route.continue();
  70  |   });
  71  |   await page.route('**/*.glb*', async route => {
  72  |     models.push(new URL(route.request().url()).pathname);
  73  |     await held;
  74  |     await route.continue();
  75  |   });
  76  |   try {
  77  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  78  |     await expect(headline(page)).toBeVisible();
  79  |     await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeVisible();
  80  |     await expect.poll(() => codeRequests.length).toBeGreaterThan(0);
  81  |     await expect(page.locator('.hero-poster img')).toBeVisible();
  82  |     await expect.poll(() => page.locator('.hero-poster img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 10_000 }).toBe(true);
  83  |     const codeLoadingContrast = await expectLoadingStatusContrast(page, '.hero-poster > span');
  84  |     expect(models).toEqual([]);
  85  |     await page.screenshot({ path: `${evidenceDir}/loading-before-3d-code-1440x1000.png` });
  86  |     await testInfo.attach('blocked-3d-code', { body: JSON.stringify({ codeRequests, models, headlineVisible: true, ctaVisible: true, posterDecoded: true }), contentType: 'application/json' });
  87  |     releaseCode();
  88  |     await expect.poll(() => models.length).toBeGreaterThan(0);
  89  |     const poster = page.locator('.sa-hero-viewer img').first();
  90  |     await expect(poster).toBeVisible();
  91  |     await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 10_000 }).toBe(true);
  92  |     const modelLoadingContrast = await expectLoadingStatusContrast(page, '.sa-hero-viewer .viewer-loading');
  93  |     await testInfo.attach('loading-status-contrast', { body: JSON.stringify({ codeLoadingContrast, modelLoadingContrast }), contentType: 'application/json' });
  94  |     await page.waitForTimeout(800);
  95  |     expect(models.length).toBe(1);
  96  |     expect(models[0]).toContain('bbf-negroni');
  97  |     await page.screenshot({ path: `${evidenceDir}/loading-poster-1440x1000.png` });
  98  |     const timings = await page.evaluate(() => ({
  99  |       paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: entry.startTime })),
  100 |       fonts: performance.getEntriesByType('resource').filter(entry => /\.woff2/.test(entry.name)).map(entry => entry.name),
  101 |       loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
  102 |     }));
  103 |     await testInfo.attach('initial-loading', { body: JSON.stringify({ models, ...timings }, null, 2), contentType: 'application/json' });
  104 |     expect(timings.fonts.some(url => url.includes('instrument-sans'))).toBe(true);
  105 |     expect(timings.loadedFonts.some(font => font.includes('Instrument Sans'))).toBe(true);
  106 |   } finally { releaseCode(); release(); }
  107 |   await waitLive(page, ['bbf-negroni']);
  108 | });
  109 |
  110 | for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  111 |   test(`landing composition and links at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
  112 |     await page.setViewportSize(viewport);
  113 |     await page.goto('/');
  114 |     await expect(headline(page)).toBeVisible();
  115 |     await page.evaluate(() => document.fonts.ready);
  116 |     await waitLive(page, ['bbf-negroni']);
  117 |     await expectNoPageOverflow(page);
  118 |     await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeInViewport();
  119 |     const contrasts = await page.evaluate(() => {
  120 |       const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
  121 |       const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
  122 |         const linear = value / 255;
  123 |         return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
  124 |       }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
  125 |       return ['.sa-hero h1', '.sa-hero h1 span', '.sa-hero-copy p', '.sa-hero-copy .sa-action'].map(selector => {
  126 |         const style = getComputedStyle(document.querySelector(selector)!);
  127 |         const foreground = rgba(style.color);
  128 |         const background = rgba(selector.endsWith('.sa-action') ? style.backgroundColor : getComputedStyle(document.querySelector('.sa-landing')!).backgroundColor);
  129 |         const alpha = foreground[3] ?? 1;
  130 |         const rendered = foreground.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
  131 |         const a = luminance(rendered), b = luminance(background);
  132 |         return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
  133 |       });
  134 |     });
  135 |     for (const color of contrasts) expect(color.ratio, `${color.selector} text contrast`).toBeGreaterThanOrEqual(4.5);
  136 |     await testInfo.attach('hero-text-contrast', { body: JSON.stringify(contrasts), contentType: 'application/json' });
  137 |     for (const entry of entries) {
  138 |       const link = page.getByRole('link', { name: `Explore ${entry.bar}: ${entry.name}`, exact: true });
  139 |       await expect(link).toHaveAttribute('href', `/?drink=${entry.id}`);
  140 |     }
  141 |     await expect(page.locator('.sa-section-heading p')).toHaveText('One city. Three interpretations of the Negroni. Start with a familiar drink. See where it takes you.');
  142 |     await page.screenshot({ path: `${evidenceDir}/homepage-${viewport.width}x${viewport.height}.png` });
  143 |     // Visit each section before the full-page capture so native lazy images are
  144 |     // decoded and reveal transitions reflect an actual completed scroll journey.
  145 |     for (const reveal of await page.locator('.sa-reveal').all()) {
  146 |       await reveal.scrollIntoViewIfNeeded();
  147 |       await expect(reveal).toHaveClass(/is-revealed/);
  148 |     }
  149 |     for (const poster of await page.locator('.sa-bar-image img').all()) {
  150 |       await poster.scrollIntoViewIfNeeded();
  151 |       await poster.evaluate((image: HTMLImageElement) => image.decode());
  152 |     }
  153 |     await page.getByRole('heading', { name: 'Same starting point. A different point of view.' }).scrollIntoViewIfNeeded();
  154 |     await expectNoPageOverflow(page);
  155 |     await expect.poll(() => page.locator('.sa-bar-image img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
  156 |     // Full-page captures begun mid-page can place fixed offscreen skip links in
```
