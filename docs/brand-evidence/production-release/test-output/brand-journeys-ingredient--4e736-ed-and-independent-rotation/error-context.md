# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> ingredient entry restores expansion and the comparison entry preserves synchronized and independent rotation
- Location: tests/brand-journeys.spec.ts:292:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByTestId('viewer-bbf-negroni')
Expected: "true"
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByTestId('viewer-bbf-negroni') with timeout 45000ms
  - waiting for getByTestId('viewer-bbf-negroni')

```

```
Error: No unexpected first-party runtime errors or failed required asset requests

expect(received).toEqual(expected) // deep equality

- Expected  - 1
+ Received  + 5

- Array []
+ Array [
+   "404 https://spiritatlas-one.vercel.app/assets/index-crkEXD8-.js",
+   "Failed to load resource: the server responded with a status of 404 () [https://spiritatlas-one.vercel.app/assets/index-crkEXD8-.js]",
+   "Refused to apply style from 'https://spiritatlas-one.vercel.app/assets/index-BeujEBp8.css' because its MIME type ('text/plain') is not a supported stylesheet MIME type, and strict MIME checking is enabled. [https://spiritatlas-one.vercel.app/?compare=bbf-negroni%2Cichigo-negroni%2Cnegroni-express&sync=0&expand=0]",
+ ]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import fs from 'node:fs/promises';
  3   | import { drinkIds, expectNoPageOverflow, snapshot, waitExpansion, waitLive } from './helpers';
  4   |
  5   | const evidenceDir = `docs/brand-evidence/${process.env.ATLAS_BRAND_RUN || 'local'}`;
  6   | const entries = [
  7   |   { id: 'bbf-negroni', bar: 'Bar Bon Funk', name: 'BBF Negroni' },
  8   |   { id: 'ichigo-negroni', bar: 'MOGA', name: 'Ichigo Negroni' },
  9   |   { id: 'negroni-express', bar: 'Bar Somma', name: 'Negroni Express' },
  10  | ] as const;
  11  | const headline = (page: Page) => page.getByRole('heading', { level: 1, name: 'Singapore’s cocktails. Inside out.' });
  12  | const failures = new WeakMap<Page, string[]>();
  13  | const expectedFailures = new WeakMap<Page, RegExp[]>();
  14  | const classic = (page: Page) => page.getByRole('region', { name: 'Classic Negroni experience', exact: true });
  15  | const film = (page: Page, sequence = 'forward') => classic(page).locator(`video[data-sequence="${sequence}"]`);
  16  | const progress = async (page: Page) => Number(await classic(page).getAttribute('data-progress'));
  17  | const sampleProgress = async (page: Page) => Number(await classic(page).getAttribute('data-sample-progress'));
  18  | const filmTime = (page: Page, sequence = 'forward') => film(page, sequence).evaluate((video: HTMLVideoElement) => video.currentTime);
  19  | const heavyAsset = (url: string) => /\/classic-negroni\/(?:simulation\/|textures\/|[^/]+\.hdr)|\/src\/negroni\/renderer\.js|\/assets\/(?:renderer|three)-[^/]+\.js|\.glb(?:\?|$)/.test(url);
  20  |
  21  | async function waitFilm(page: Page, sequence = 'forward') {
  22  |   await expect(classic(page)).toHaveAttribute('data-mode', 'cinematic');
  23  |   await expect(film(page, sequence)).toBeVisible();
  24  |   await expect.poll(() => film(page, sequence).evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2);
  25  | }
  26  |
  27  | async function seekMidpoint(page: Page) {
  28  |   const slider = classic(page).getByRole('slider', { name: 'Deconstruction progress' });
  29  |   await slider.scrollIntoViewIfNeeded();
  30  |   const box = await slider.boundingBox();
  31  |   await slider.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  32  |   await expect.poll(() => progress(page)).toBeGreaterThan(.48);
  33  |   await expect.poll(() => progress(page)).toBeLessThan(.52);
  34  |   await expect(classic(page)).toHaveAttribute('data-playing', 'false');
  35  | }
  36  |
  37  | test.beforeEach(async ({ page }) => {
  38  |   const errors: string[] = [];
  39  |   failures.set(page, errors);
  40  |   page.on('pageerror', error => errors.push(error.message));
  41  |   page.on('console', message => {
  42  |     if (message.type() !== 'error') return;
  43  |     const source = message.location().url;
  44  |     if (!source || new URL(source, page.url()).origin === new URL(page.url()).origin) errors.push(`${message.text()}${source ? ` [${source}]` : ''}`);
  45  |   });
  46  |   page.on('response', response => {
  47  |     if (response.status() >= 400 && new URL(response.url()).origin === new URL(page.url()).origin) errors.push(`${response.status()} ${response.url()}`);
  48  |   });
  49  |   page.on('requestfailed', request => {
  50  |     if (!request.failure()?.errorText.includes('ERR_ABORTED') && new URL(request.url()).origin === new URL(page.url()).origin) errors.push(`${request.failure()?.errorText} ${request.url()}`);
  51  |   });
  52  |   await fs.mkdir(evidenceDir, { recursive: true });
  53  | });
  54  |
  55  | test.afterEach(async ({ page }, testInfo) => {
  56  |   await testInfo.attach('runtime-errors', { body: JSON.stringify(failures.get(page)), contentType: 'application/json' });
> 57  |   expect(failures.get(page)?.filter(message => !expectedFailures.get(page)?.some(pattern => pattern.test(message))), 'No unexpected first-party runtime errors or failed required asset requests').toEqual([]);
      |                                                                                                                                                                                                    ^ Error: No unexpected first-party runtime errors or failed required asset requests
  58  | });
  59  |
  60  | test('headline, CTA and original Negroni poster remain usable while cinematic files are delayed, without requesting 3D assets', async ({ page }, testInfo) => {
  61  |   const heavyRequests: string[] = [];
  62  |   const movies: string[] = [];
  63  |   let release!: () => void;
  64  |   const held = new Promise<void>(resolve => { release = resolve; });
  65  |   page.on('request', request => { if (heavyAsset(request.url())) heavyRequests.push(new URL(request.url()).pathname); });
  66  |   await page.route('**/classic-negroni/cinematic/*.mp4*', async route => {
  67  |     movies.push(new URL(route.request().url()).pathname);
  68  |     await held;
  69  |     await route.continue();
  70  |   });
  71  |   try {
  72  |     await page.goto('/', { waitUntil: 'domcontentloaded' });
  73  |     await expect(headline(page)).toBeVisible();
  74  |     await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeVisible();
  75  |     await expect(classic(page).getByRole('heading', { name: 'Classic Negroni', exact: true })).toBeVisible();
  76  |     await expect.poll(() => movies.length).toBeGreaterThan(0);
  77  |     const poster = classic(page).locator('.cn-poster');
  78  |     await expect(poster).toBeVisible();
  79  |     await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  80  |     expect(heavyRequests).toEqual([]);
  81  |     await expect(classic(page).locator('canvas')).toHaveCount(0);
  82  |     // A user can ask to expand before decoding completes without losing the poster.
  83  |     await classic(page).getByRole('button', { name: 'Look inside', exact: true }).click();
  84  |     await expect(poster).toBeVisible();
  85  |     await expect(classic(page)).toHaveAttribute('data-playing', 'false');
  86  |     await expect(classic(page)).toHaveAttribute('data-play-intent', 'true');
  87  |     await page.screenshot({ path: `${evidenceDir}/classic-loading-poster-1440x1000.png` });
  88  |     await testInfo.attach('initial-classic-loading', { body: JSON.stringify({ movies, heavyRequests, posterDecoded: true }), contentType: 'application/json' });
  89  |   } finally { release(); }
  90  |   await waitFilm(page);
  91  |   await expect.poll(() => filmTime(page)).toBeGreaterThan(.15);
  92  |   expect(heavyRequests).toEqual([]);
  93  |   await classic(page).getByRole('button', { name: 'Pause animation', exact: true }).click();
  94  |   const timings = await page.evaluate(() => ({
  95  |     paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: entry.startTime })),
  96  |     fonts: performance.getEntriesByType('resource').filter(entry => /\.woff2/.test(entry.name)).map(entry => entry.name),
  97  |     loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
  98  |   }));
  99  |   expect(timings.fonts.some(url => url.includes('instrument-sans'))).toBe(true);
  100 |   expect(timings.loadedFonts.some(font => font.includes('Instrument Sans'))).toBe(true);
  101 |   await testInfo.attach('initial-font-loading', { body: JSON.stringify(timings), contentType: 'application/json' });
  102 | });
  103 |
  104 | for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  105 |   test(`landing composition and links at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
  106 |     await page.setViewportSize(viewport);
  107 |     await page.goto('/');
  108 |     await expect(headline(page)).toBeVisible();
  109 |     await page.evaluate(() => document.fonts.ready);
  110 |     await waitFilm(page);
  111 |     await expectNoPageOverflow(page);
  112 |     const stage = await classic(page).locator('.cn-stage').boundingBox();
  113 |     expect(stage!.width).toBeGreaterThan(230);
  114 |     expect(Math.abs(stage!.width - stage!.height)).toBeLessThan(2);
  115 |     expect(stage!.x).toBeGreaterThanOrEqual(0);
  116 |     expect(stage!.x + stage!.width).toBeLessThanOrEqual(viewport.width + 1);
  117 |     expect(await film(page).evaluate(video => getComputedStyle(video).objectFit)).toBe('contain');
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
  157 |     // the document image. Return to the actual top before recording the page.
```
