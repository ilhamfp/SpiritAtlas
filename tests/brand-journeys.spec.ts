import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { drinkIds, expectNoPageOverflow, positionError, snapshot, viewer, waitExpansion, waitLive } from './helpers';

const evidenceDir = `docs/brand-evidence/${process.env.ATLAS_BRAND_RUN || 'local'}`;
const entries = [
  { id: 'bbf-negroni', bar: 'Bar Bon Funk', name: 'BBF Negroni' },
  { id: 'ichigo-negroni', bar: 'MOGA', name: 'Ichigo Negroni' },
  { id: 'negroni-express', bar: 'Bar Somma', name: 'Negroni Express' },
] as const;
const headline = (page: Page) => page.getByRole('heading', { level: 1, name: 'Singapore’s cocktails. Inside out.' });
const failures = new WeakMap<Page, string[]>();

async function expectLoadingStatusContrast(page: Page, selector: string) {
  const status = page.locator(selector);
  await expect(status).toBeVisible();
  const contrast = await status.evaluate(element => {
    const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
    const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
      const linear = value / 255;
      return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
    }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
    const background = rgba(getComputedStyle(element).backgroundColor);
    const ratios = [element, ...element.querySelectorAll('span:not(.loading-orbit)')].map(label => {
      const foreground = rgba(getComputedStyle(label).color);
      const a = luminance(foreground), b = luminance(background);
      return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
    });
    return { backgroundAlpha: background[3] ?? 1, minimumRatio: Math.min(...ratios) };
  });
  expect(contrast.backgroundAlpha, 'Loading feedback has an opaque backdrop over the artwork').toBe(1);
  expect(contrast.minimumRatio, 'Every loading status label meets normal-text contrast').toBeGreaterThanOrEqual(4.5);
  return contrast;
}

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  failures.set(page, errors);
  page.on('pageerror', error => errors.push(error.message));
  page.on('console', message => {
    if (message.type() !== 'error') return;
    const source = message.location().url;
    if (!source || new URL(source, page.url()).origin === new URL(page.url()).origin) errors.push(`${message.text()}${source ? ` [${source}]` : ''}`);
  });
  page.on('response', response => {
    if (response.status() >= 400 && new URL(response.url()).origin === new URL(page.url()).origin) errors.push(`${response.status()} ${response.url()}`);
  });
  page.on('requestfailed', request => {
    if (!request.failure()?.errorText.includes('ERR_ABORTED') && new URL(request.url()).origin === new URL(page.url()).origin) errors.push(`${request.failure()?.errorText} ${request.url()}`);
  });
  await fs.mkdir(evidenceDir, { recursive: true });
});

test.afterEach(async ({ page }, testInfo) => {
  await testInfo.attach('runtime-errors', { body: JSON.stringify(failures.get(page)), contentType: 'application/json' });
  expect(failures.get(page), 'No first-party runtime errors or failed required asset requests').toEqual([]);
});

test('headline, CTA and faithful poster appear while 3D code and models are held; only the hero model is requested initially', async ({ page }, testInfo) => {
  const codeRequests: string[] = [];
  const models: string[] = [];
  let releaseCode!: () => void;
  const heldCode = new Promise<void>(resolve => { releaseCode = resolve; });
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  await page.route(/\/(?:assets\/three-[^/]+\.js|src\/scenes\/Viewer\.tsx)(?:\?.*)?$/, async route => {
    codeRequests.push(new URL(route.request().url()).pathname);
    await heldCode;
    await route.continue();
  });
  await page.route('**/*.glb*', async route => {
    models.push(new URL(route.request().url()).pathname);
    await held;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(headline(page)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeVisible();
    await expect.poll(() => codeRequests.length).toBeGreaterThan(0);
    await expect(page.locator('.hero-poster img')).toBeVisible();
    await expect.poll(() => page.locator('.hero-poster img').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 10_000 }).toBe(true);
    const codeLoadingContrast = await expectLoadingStatusContrast(page, '.hero-poster > span');
    expect(models).toEqual([]);
    await page.screenshot({ path: `${evidenceDir}/loading-before-3d-code-1440x1000.png` });
    await testInfo.attach('blocked-3d-code', { body: JSON.stringify({ codeRequests, models, headlineVisible: true, ctaVisible: true, posterDecoded: true }), contentType: 'application/json' });
    releaseCode();
    await expect.poll(() => models.length).toBeGreaterThan(0);
    const poster = page.locator('.sa-hero-viewer img').first();
    await expect(poster).toBeVisible();
    await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0), { timeout: 10_000 }).toBe(true);
    const modelLoadingContrast = await expectLoadingStatusContrast(page, '.sa-hero-viewer .viewer-loading');
    await testInfo.attach('loading-status-contrast', { body: JSON.stringify({ codeLoadingContrast, modelLoadingContrast }), contentType: 'application/json' });
    await page.waitForTimeout(800);
    expect(models.length).toBe(1);
    expect(models[0]).toContain('bbf-negroni');
    await page.screenshot({ path: `${evidenceDir}/loading-poster-1440x1000.png` });
    const timings = await page.evaluate(() => ({
      paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: entry.startTime })),
      fonts: performance.getEntriesByType('resource').filter(entry => /\.woff2/.test(entry.name)).map(entry => entry.name),
      loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
    }));
    await testInfo.attach('initial-loading', { body: JSON.stringify({ models, ...timings }, null, 2), contentType: 'application/json' });
    expect(timings.fonts.some(url => url.includes('instrument-sans'))).toBe(true);
    expect(timings.loadedFonts.some(font => font.includes('Instrument Sans'))).toBe(true);
  } finally { releaseCode(); release(); }
  await waitLive(page, ['bbf-negroni']);
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  test(`landing composition and links at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(headline(page)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await waitLive(page, ['bbf-negroni']);
    await expectNoPageOverflow(page);
    await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeInViewport();
    const contrasts = await page.evaluate(() => {
      const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
      const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
        const linear = value / 255;
        return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      return ['.sa-hero h1', '.sa-hero h1 span', '.sa-hero-copy p', '.sa-hero-copy .sa-action'].map(selector => {
        const style = getComputedStyle(document.querySelector(selector)!);
        const foreground = rgba(style.color);
        const background = rgba(selector.endsWith('.sa-action') ? style.backgroundColor : getComputedStyle(document.querySelector('.sa-landing')!).backgroundColor);
        const alpha = foreground[3] ?? 1;
        const rendered = foreground.slice(0, 3).map((value, index) => value * alpha + background[index] * (1 - alpha));
        const a = luminance(rendered), b = luminance(background);
        return { selector, ratio: (Math.max(a, b) + .05) / (Math.min(a, b) + .05) };
      });
    });
    for (const color of contrasts) expect(color.ratio, `${color.selector} text contrast`).toBeGreaterThanOrEqual(4.5);
    await testInfo.attach('hero-text-contrast', { body: JSON.stringify(contrasts), contentType: 'application/json' });
    for (const entry of entries) {
      const link = page.getByRole('link', { name: `Explore ${entry.bar}: ${entry.name}`, exact: true });
      await expect(link).toHaveAttribute('href', `/?drink=${entry.id}`);
    }
    await expect(page.locator('.sa-section-heading p')).toHaveText('One city. Three interpretations of the Negroni. Start with a familiar drink. See where it takes you.');
    await page.screenshot({ path: `${evidenceDir}/homepage-${viewport.width}x${viewport.height}.png` });
    // Visit each section before the full-page capture so native lazy images are
    // decoded and reveal transitions reflect an actual completed scroll journey.
    for (const reveal of await page.locator('.sa-reveal').all()) {
      await reveal.scrollIntoViewIfNeeded();
      await expect(reveal).toHaveClass(/is-revealed/);
    }
    for (const poster of await page.locator('.sa-bar-image img').all()) {
      await poster.scrollIntoViewIfNeeded();
      await poster.evaluate((image: HTMLImageElement) => image.decode());
    }
    await page.getByRole('heading', { name: 'Same starting point. A different point of view.' }).scrollIntoViewIfNeeded();
    await expectNoPageOverflow(page);
    await expect.poll(() => page.locator('.sa-bar-image img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    // Full-page captures begun mid-page can place fixed offscreen skip links in
    // the document image. Return to the actual top before recording the page.
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: `${evidenceDir}/homepage-full-${viewport.width}x${viewport.height}.png`, fullPage: true, animations: 'disabled' });
    await testInfo.attach('viewport-layout', { body: JSON.stringify(await page.evaluate(() => ({ width: innerWidth, height: innerHeight, documentWidth: document.documentElement.scrollWidth, fonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family) }))), contentType: 'application/json' });
  });
}

test('keyboard CTA enters atlas and each featured bar opens the correct working experience with return home', async ({ page }) => {
  await page.goto('/');
  const cta = page.getByRole('link', { name: 'Explore the atlas', exact: true });
  await cta.focus();
  await expect(cta).toBeFocused();
  expect(await cta.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  expect(parseFloat(await cta.evaluate(element => getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2);
  await cta.press('Enter');
  await expect(page).toHaveURL(/bar=bar-bon-funk/);
  await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
  await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  await expect(headline(page)).toBeVisible();
  for (const entry of entries) {
    await page.getByRole('link', { name: `Explore ${entry.bar}: ${entry.name}`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`drink=${entry.id}`));
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.name);
    await waitLive(page, [entry.id]);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.name);
    await waitLive(page, [entry.id]);
    await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
    await expect(headline(page)).toBeVisible();
  }
});

test('featured live drink expands and collapses real parts and supports visible, keyboard and pointer orbit', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitLive(page, ['bbf-negroni']);
  const assembled = await snapshot(page, 'bbf-negroni');
  await page.getByRole('button', { name: 'Look inside', exact: true }).click();
  await waitExpansion(page, ['bbf-negroni'], 1);
  expect(positionError(assembled, await snapshot(page, 'bbf-negroni'))).toBeGreaterThan(.02);
  await page.screenshot({ path: `${evidenceDir}/hero-expanded-1440x1000.png` });
  await page.getByRole('button', { name: 'Bring it together', exact: true }).click();
  await waitExpansion(page, ['bbf-negroni'], 0);
  expect(positionError(assembled, await snapshot(page, 'bbf-negroni'))).toBeLessThan(.002);
  await page.getByRole('button', { name: 'Rotate featured cocktail right', exact: true }).click();
  await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - assembled.camera.azimuth)).toBeGreaterThan(.2);
  const stage = viewer(page, 'bbf-negroni');
  const beforeKeyboard = await snapshot(page, 'bbf-negroni');
  await stage.focus();
  await stage.press('ArrowRight');
  await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - beforeKeyboard.camera.azimuth)).toBeGreaterThan(.05);
  const beforePointer = await snapshot(page, 'bbf-negroni');
  const box = await stage.boundingBox();
  await page.mouse.move(box!.x + box!.width * .6, box!.y + box!.height * .5);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width * .6 - 110, box!.y + box!.height * .5 + 10, { steps: 12 });
  await page.mouse.up();
  await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - beforePointer.camera.azimuth)).toBeGreaterThan(.1);
  expect((await snapshot(page, 'bbf-negroni')).e).toBeLessThan(.015);
  await testInfo.attach('hero-rendered-motion', { body: JSON.stringify({ assembled, final: await snapshot(page, 'bbf-negroni') }), contentType: 'application/json' });
});

test('ingredient entry restores expansion and the comparison entry preserves synchronized and independent rotation', async ({ page }, testInfo) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Explore ingredients', exact: true }).click();
  await expect(page).toHaveURL(/drink=ichigo-negroni&expand=1/);
  await waitLive(page, ['ichigo-negroni']);
  await waitExpansion(page, ['ichigo-negroni'], 1);
  await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
  await waitExpansion(page, ['ichigo-negroni'], 0);
  await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  await page.getByRole('link', { name: 'Compare the three', exact: true }).click();
  await expect(page.locator('.comparison-column')).toHaveCount(3);
  await waitLive(page, drinkIds);
  await waitExpansion(page, drinkIds, 1);
  const bbf = page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
  const initial = await snapshot(page, 'bbf-negroni');
  await bbf.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - initial.camera.azimuth)).toBeGreaterThan(.2);
  await expect.poll(async () => {
    const states = await Promise.all(drinkIds.map(id => snapshot(page, id)));
    return Math.max(...states.map(state => state.camera.azimuth)) - Math.min(...states.map(state => state.camera.azimuth));
  }).toBeLessThan(.01);
  await page.getByRole('switch', { name: 'Rotation synchronized' }).click();
  const untouched = await snapshot(page, 'ichigo-negroni');
  await bbf.getByRole('button', { name: 'Rotate left', exact: true }).click();
  await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - untouched.camera.azimuth)).toBeGreaterThan(.1);
  expect((await snapshot(page, 'ichigo-negroni')).camera.azimuth).toBeCloseTo(untouched.camera.azimuth, 3);
  await page.getByRole('button', { name: 'Reassemble all', exact: true }).click();
  await waitExpansion(page, drinkIds, 0);
  await page.reload();
  await waitLive(page, drinkIds);
  await waitExpansion(page, drinkIds, 0);
  await expect(page.getByRole('switch', { name: 'Rotate independently' })).toHaveAttribute('aria-checked', 'false');
  await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  await waitExpansion(page, drinkIds, 1);
  await page.getByRole('button', { name: 'Reset alignment', exact: true }).click();
  for (const id of drinkIds) await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth)).toBeLessThan(.01);
  await page.screenshot({ path: `${evidenceDir}/comparison-1440x1000.png` });
  await testInfo.attach('comparison-rendered-cameras', { body: JSON.stringify(await Promise.all(drinkIds.map(id => snapshot(page, id)))), contentType: 'application/json' });
  await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  await expect(headline(page)).toBeVisible();
});

test('direct atlas and all Negroni routes resolve and survive refresh', async ({ page }) => {
  for (const path of ['/?bar=bar-bon-funk', '/?bar=moga', '/?bar=bar-somma', '/?drink=bbf-negroni', '/?drink=ichigo-negroni&expand=1', '/?drink=negroni-express', '/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=.43&sync=0']) {
    await page.goto(path);
    await expect(page.locator('.atlas-layout:visible, .drink-page, .comparison-page')).toBeVisible();
    await page.reload();
    await expect(page.locator('.atlas-layout:visible, .drink-page, .comparison-page')).toBeVisible();
    await expectNoPageOverflow(page);
  }
});

test('WebGL unavailable offers informative fallback without blocking landing and ingredient entry', async ({ page }) => {
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
      if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
      return getContext.apply(this, [kind, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(headline(page)).toBeVisible();
  await expect(page.getByText('Interactive 3D is unavailable in this browser.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Rotate featured cocktail left', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Rotate featured cocktail right', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
  await expect(page).toHaveURL(/drink=bbf-negroni&expand=1/);
  await expect(page.getByText('Interactive 3D is unavailable in this browser.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Inside the drink', exact: true })).toBeVisible();
});

test.describe('phone touch and reduced motion', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  test('touch orbit, visible ingredient controls and stable reduced-motion presentation', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitLive(page, ['bbf-negroni']);
    expect(await page.locator('.sa-hero-copy').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    await expectNoPageOverflow(page);
    const stage = viewer(page, 'bbf-negroni');
    await stage.scrollIntoViewIfNeeded();
    const before = await snapshot(page, 'bbf-negroni');
    const box = await stage.boundingBox();
    const x = box!.x + box!.width * .7;
    const y = box!.y + box!.height * .5;
    const client = await page.context().newCDPSession(page);
    await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 12; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 8, y }] });
    await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - before.camera.azimuth)).toBeGreaterThan(.15);
    await page.getByRole('button', { name: 'Look inside', exact: true }).tap();
    await waitExpansion(page, ['bbf-negroni'], 1);
    await page.getByRole('button', { name: 'Bring it together', exact: true }).tap();
    await waitExpansion(page, ['bbf-negroni'], 0);
    const after = await snapshot(page, 'bbf-negroni');
    await page.waitForTimeout(350);
    expect(positionError(after, await snapshot(page, 'bbf-negroni'))).toBeLessThan(.002);
    await page.getByRole('link', { name: 'Explore the atlas', exact: true }).tap();
    await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
    await expect(page.locator('.atlas-intro h1')).toHaveText('Three bars. Three takes on the Negroni.');
    await expect(page.locator('.map-loading')).toHaveCount(0, { timeout: 20_000 });
    await expectNoPageOverflow(page);
    await page.screenshot({ path: `${evidenceDir}/atlas-mobile-390x844.png` });
    await testInfo.attach('touch-reduced-motion', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
  });
});
