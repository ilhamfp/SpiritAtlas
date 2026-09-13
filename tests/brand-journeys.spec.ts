import { test, expect, type Page } from '@playwright/test';
import fs from 'node:fs/promises';
import { drinkIds, expectNoPageOverflow, snapshot, waitExpansion, waitLive } from './helpers';

const evidenceDir = `docs/brand-evidence/${process.env.ATLAS_BRAND_RUN || 'local'}`;
const entries = [
  { id: 'bbf-negroni', bar: 'Bar Bon Funk', name: 'BBF Negroni' },
  { id: 'ichigo-negroni', bar: 'MOGA', name: 'Ichigo Negroni' },
  { id: 'negroni-express', bar: 'Bar Somma', name: 'Negroni Express' },
] as const;
const headline = (page: Page) => page.getByRole('heading', { level: 1, name: 'Singapore’s cocktails. Inside out.' });
const failures = new WeakMap<Page, string[]>();
const expectedFailures = new WeakMap<Page, RegExp[]>();
const classic = (page: Page) => page.getByRole('region', { name: 'Classic Negroni experience', exact: true });
const film = (page: Page, sequence = 'forward') => classic(page).locator(`video[data-sequence="${sequence}"]`);
const progress = async (page: Page) => Number(await classic(page).getAttribute('data-progress'));
const filmTime = (page: Page, sequence = 'forward') => film(page, sequence).evaluate((video: HTMLVideoElement) => video.currentTime);
const heavyAsset = (url: string) => /\/classic-negroni\/(?:simulation\/|textures\/|[^/]+\.hdr)|\/src\/negroni\/renderer\.js|\/assets\/(?:renderer|three)-[^/]+\.js|\.glb(?:\?|$)/.test(url);

async function waitFilm(page: Page, sequence = 'forward') {
  await expect(classic(page)).toHaveAttribute('data-mode', 'cinematic');
  await expect(classic(page).locator('.cn-stage')).toHaveAttribute('data-film-ready', 'true');
  await expect(film(page, sequence)).toHaveAttribute('data-active', 'true');
  await expect(film(page, sequence)).toHaveCSS('opacity', '1');
  await expect(film(page, sequence)).toBeVisible();
  await expect(classic(page).locator('.cn-poster')).toHaveCSS('opacity', '0');
  await expect(classic(page).locator('video[data-active="true"]')).toHaveCount(1);
  await expect.poll(() => film(page, sequence).evaluate((video: HTMLVideoElement) => video.readyState)).toBeGreaterThanOrEqual(2);
  await expect.poll(() => film(page, sequence).evaluate((video: HTMLVideoElement) => video.seeking)).toBe(false);
}

async function compareStagePixels(page: Page, before: Buffer, after: Buffer) {
  // Decode screenshots of the composed page, rather than drawImage(video): a
  // decoded video frame can advance while WebKit still paints a stale poster.
  return page.evaluate(async ({ beforePng, afterPng }) => {
    const read = async (png: string) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d')!;
      context.drawImage(image, 0, 0);
      return { width: canvas.width, height: canvas.height, pixels: context.getImageData(0, 0, canvas.width, canvas.height).data };
    };
    const [a, b] = await Promise.all([read(beforePng), read(afterPng)]);
    if (a.width !== b.width || a.height !== b.height) throw new Error('The cinematic stage changed dimensions during the image comparison.');
    let changed = 0, compared = 0, difference = 0;
    // Leave out the top caption, focus outline and rounded frame, so changing
    // UI labels cannot make an unchanged drink count as rendered animation.
    for (let y = Math.ceil(a.height * .15); y < Math.floor(a.height * .94); y++) {
      for (let x = Math.ceil(a.width * .08); x < Math.floor(a.width * .92); x++) {
        const offset = (y * a.width + x) * 4;
        const delta = (Math.abs(a.pixels[offset] - b.pixels[offset]) + Math.abs(a.pixels[offset + 1] - b.pixels[offset + 1]) + Math.abs(a.pixels[offset + 2] - b.pixels[offset + 2])) / 3;
        if (delta > 18) changed++;
        difference += delta;
        compared++;
      }
    }
    return { changedRatio: changed / compared, meanChannelDifference: difference / compared, comparedPixels: compared };
  }, { beforePng: before.toString('base64'), afterPng: after.toString('base64') });
}

async function seekMidpoint(page: Page) {
  const slider = classic(page).getByRole('slider', { name: 'Deconstruction progress' });
  await slider.scrollIntoViewIfNeeded();
  const box = await slider.boundingBox();
  await slider.click({ position: { x: box!.width / 2, y: box!.height / 2 } });
  await expect.poll(() => progress(page)).toBeGreaterThan(.48);
  await expect.poll(() => progress(page)).toBeLessThan(.52);
  await expect(classic(page)).toHaveAttribute('data-playing', 'false');
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
  expect(failures.get(page)?.filter(message => !expectedFailures.get(page)?.some(pattern => pattern.test(message))), 'No unexpected first-party runtime errors or failed required asset requests').toEqual([]);
});

test('headline, CTA and original Negroni poster remain usable while cinematic files are delayed, without requesting 3D assets', async ({ page }, testInfo) => {
  const heavyRequests: string[] = [];
  const movies: string[] = [];
  let release!: () => void;
  const held = new Promise<void>(resolve => { release = resolve; });
  page.on('request', request => { if (heavyAsset(request.url())) heavyRequests.push(new URL(request.url()).pathname); });
  await page.route('**/classic-negroni/cinematic/*.mp4*', async route => {
    movies.push(new URL(route.request().url()).pathname);
    await held;
    await route.continue();
  });
  try {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(headline(page)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeVisible();
    await expect(classic(page).getByRole('heading', { name: 'Classic Negroni', exact: true })).toBeVisible();
    await expect.poll(() => movies.length).toBeGreaterThan(0);
    const poster = classic(page).locator('.cn-poster');
    await expect(poster).toBeVisible();
    await expect(poster).toHaveCSS('opacity', '1');
    await expect.poll(() => poster.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
    expect(heavyRequests).toEqual([]);
    await expect(classic(page).locator('canvas')).toHaveCount(0);
    // Default playback waits for decoded frames without losing the poster.
    await expect(poster).toBeVisible();
    await expect(poster).toHaveCSS('opacity', '1');
    await expect(classic(page)).toHaveAttribute('data-playing', 'false');
    await expect(classic(page)).toHaveAttribute('data-play-intent', 'true');
    await page.screenshot({ path: `${evidenceDir}/classic-loading-poster-1440x1000.png` });
    await testInfo.attach('initial-classic-loading', { body: JSON.stringify({ movies, heavyRequests, posterDecoded: true }), contentType: 'application/json' });
  } finally { release(); }
  await waitFilm(page);
  await expect.poll(() => filmTime(page)).toBeGreaterThan(.15);
  expect(heavyRequests).toEqual([]);
  await classic(page).getByRole('button', { name: 'Pause animation', exact: true }).click();
  const timings = await page.evaluate(() => ({
    paint: performance.getEntriesByType('paint').map(entry => ({ name: entry.name, ms: entry.startTime })),
    fonts: performance.getEntriesByType('resource').filter(entry => /\.woff2/.test(entry.name)).map(entry => entry.name),
    loadedFonts: [...document.fonts].filter(font => font.status === 'loaded').map(font => font.family),
  }));
  expect(timings.fonts.some(url => url.includes('instrument-sans'))).toBe(true);
  expect(timings.loadedFonts.some(font => font.includes('Instrument Sans'))).toBe(true);
  await testInfo.attach('initial-font-loading', { body: JSON.stringify(timings), contentType: 'application/json' });
});

for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  test(`landing composition and links at ${viewport.width}x${viewport.height}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await expect(headline(page)).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await waitFilm(page);
    await classic(page).getByRole('button', { name: 'Reset Negroni', exact: true }).click();
    await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
    await page.mouse.move(0, 0);
    await expectNoPageOverflow(page);
    const stage = await classic(page).locator('.cn-stage').boundingBox();
    expect(stage!.width).toBeGreaterThan(230);
    expect(Math.abs(stage!.width - stage!.height)).toBeLessThan(2);
    expect(stage!.x).toBeGreaterThanOrEqual(0);
    expect(stage!.x + stage!.width).toBeLessThanOrEqual(viewport.width + 1);
    expect(await film(page).evaluate(video => getComputedStyle(video).objectFit)).toBe('contain');
    await expect(page.getByRole('link', { name: 'Explore the atlas', exact: true })).toBeInViewport();
    const contrasts = await page.evaluate(() => {
      const rgba = (value: string) => value.match(/[\d.]+/g)!.map(Number);
      const luminance = (rgb: number[]) => rgb.slice(0, 3).map(value => {
        const linear = value / 255;
        return linear <= .04045 ? linear / 12.92 : ((linear + .055) / 1.055) ** 2.4;
      }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
      return ['.sa-hero h1', '.sa-hero h1 span', '.sa-hero-copy .sa-action'].map(selector => {
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
    await expect(classic(page).locator('.cn-scene-caption, .cn-hint, .cn-intro, .cn-ingredients')).toHaveCount(0);
    await expect(page.locator('.sa-hero-copy p, .sa-section-heading p, .sa-comparison-inner > p')).toHaveCount(0);
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
    await page.getByRole('link', { name: 'Meet the three bars', exact: true }).click();
    await expect(page).toHaveURL(/#the-bars$/);
    await expect(page.getByRole('heading', { name: 'Three bars. Distinctly their own.' })).toBeInViewport();
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

test('the composed cinematic image visibly changes from assembled to exploded and returns after reset', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitFilm(page);
  const hero = classic(page);
  const stage = hero.locator('.cn-stage');
  await hero.getByRole('button', { name: 'Reset Negroni', exact: true }).click();
  await expect.poll(() => film(page).evaluate((video: HTMLVideoElement) => video.seeking)).toBe(false);
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await expect(hero).toHaveAttribute('data-progress', '0.00000');
  const assembled = await stage.screenshot();

  // Use the actual accessible timeline to select a still, with no animation
  // clock or moving caption capable of making the screenshot assertion pass.
  await hero.getByRole('slider', { name: 'Deconstruction progress' }).press('End');
  await expect(hero).toHaveAttribute('data-progress', '1.00000');
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await expect.poll(() => filmTime(page)).toBeGreaterThan(7.1);
  await waitFilm(page);
  let exploded = assembled;
  await expect.poll(async () => {
    exploded = await stage.screenshot();
    return (await compareStagePixels(page, assembled, exploded)).changedRatio;
  }, { message: 'The drink itself must visibly deconstruct in the composed page, even when media time and progress already advanced.' }).toBeGreaterThan(.025);
  const expansionDifference = await compareStagePixels(page, assembled, exploded);

  await hero.getByRole('button', { name: 'Reset Negroni', exact: true }).click();
  await expect(hero).toHaveAttribute('data-progress', '0.00000');
  await expect.poll(() => filmTime(page)).toBeLessThan(.01);
  await waitFilm(page);
  await expect.poll(async () => (await compareStagePixels(page, assembled, await stage.screenshot())).changedRatio,
    { message: 'Reset restores the original composed image.' }).toBeLessThan(.015);
  await testInfo.attach('classic-composed-assembled', { body: assembled, contentType: 'image/png' });
  await testInfo.attach('classic-composed-exploded', { body: exploded, contentType: 'image/png' });
  await testInfo.attach('classic-composed-pixel-difference', { body: JSON.stringify(expansionDifference), contentType: 'application/json' });
});

test('original cinematic frames advance, pause, reverse at the same pose, and scrub with visible controls', async ({ page }, testInfo) => {
  await page.goto('/');
  await waitFilm(page);
  const hero = classic(page);
  await hero.getByRole('button', { name: 'Reset Negroni', exact: true }).click();
  await hero.getByRole('button', { name: 'Look inside', exact: true }).click();
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await expect.poll(() => filmTime(page)).toBeGreaterThan(.8);
  const decodedFrames = await film(page).evaluate((video: HTMLVideoElement) => typeof video.getVideoPlaybackQuality === 'function' ? video.getVideoPlaybackQuality().totalVideoFrames : null);
  if (decodedFrames !== null) expect(decodedFrames).toBeGreaterThan(5);
  await hero.getByRole('button', { name: 'Pause animation', exact: true }).click();
  const paused = await filmTime(page);
  await page.waitForTimeout(300);
  expect(await filmTime(page)).toBeCloseTo(paused, 2);
  expect(await film(page).evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
  await hero.getByRole('button', { name: 'Play animation', exact: true }).click();
  await expect.poll(() => filmTime(page)).toBeGreaterThan(paused + .3);
  const beforeReverse = await progress(page);
  await hero.getByRole('button', { name: 'Bring it together', exact: true }).click();
  await waitFilm(page, 'reverse');
  await expect(hero).toHaveAttribute('data-direction', '-1');
  expect(Math.abs(await progress(page) - beforeReverse)).toBeLessThan(.1);
  await expect.poll(() => progress(page)).toBeLessThan(beforeReverse - .05);
  await expect(hero).toHaveAttribute('data-direction', '1');
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await hero.getByRole('button', {name: 'Pause animation', exact: true}).click();
  await seekMidpoint(page);
  await waitFilm(page);
  expect(await filmTime(page)).toBeCloseTo(3.6, 1);
  await hero.getByRole('button', { name: 'Playback speed: 1 times. Change speed', exact: true }).click();
  expect(await film(page).evaluate((video: HTMLVideoElement) => video.playbackRate)).toBe(.5);
  await expect(hero.getByRole('button', { name: 'Playback speed: 0.5 times. Change speed', exact: true })).toBeVisible();
  await hero.locator('.cn-stage').focus();
  await hero.locator('.cn-stage').press('Space');
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await hero.locator('.cn-stage').press('Space');
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await page.screenshot({ path: `${evidenceDir}/classic-scrubbed-1440x1000.png` });
  await testInfo.attach('cinematic-playback', { body: JSON.stringify({ paused, beforeReverse, scrubbed: await progress(page) }), contentType: 'application/json' });
});

test('automatic playback completes 0 to 100 to 0 to 100 using the full forward and reverse films', async ({page}, testInfo) => {
  await page.goto('/');
  await waitFilm(page);
  const hero = classic(page);
  await hero.evaluate(root => {
    const endpoints: {sequence: string; time: number}[] = [];
    Reflect.set(window, '__negroniEndpoints', endpoints);
    root.querySelectorAll('video').forEach(video => video.addEventListener('ended', () => endpoints.push({sequence: video.dataset.sequence!, time: video.currentTime})));
  });
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__negroniEndpoints').length), {timeout: 30000}).toBeGreaterThanOrEqual(3);
  const endpoints = await page.evaluate(() => Reflect.get(window, '__negroniEndpoints') as {sequence: string; time: number}[]);
  expect(endpoints.slice(0, 3).map(item => item.sequence)).toEqual(['forward', 'reverse', 'forward']);
  for (const endpoint of endpoints.slice(0, 3)) expect(endpoint.time).toBeGreaterThan(7.1);
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await waitFilm(page, 'reverse');
  await hero.getByRole('button', {name: 'Pause animation', exact: true}).click();
  const pausedAt = await progress(page);
  await page.waitForTimeout(250);
  expect(await progress(page)).toBeCloseTo(pausedAt, 4);
  await page.screenshot({path: `${evidenceDir}/classic-full-cycle-1440x1000.png`});
  await testInfo.attach('full-cycle-endpoints', {body: JSON.stringify(endpoints), contentType: 'application/json'});
});

test('one player loads rotation on demand, preserves the selected pose and resets to the original film', async ({ page }, testInfo) => {
  const heavyRequests: string[] = [];
  page.on('request', request => { if (heavyAsset(request.url())) heavyRequests.push(new URL(request.url()).pathname); });
  await page.goto('/');
  await waitFilm(page);
  await seekMidpoint(page);
  const selectedPose = await progress(page);
  expect(heavyRequests).toEqual([]);
  const hero = classic(page);
  await expect(hero.getByRole('button', {name: /^(Cinematic|Explore 3D)$/})).toHaveCount(0);
  await hero.getByRole('button', { name: 'Rotate Negroni right', exact: true }).click();
  await expect(hero).toHaveAttribute('data-mode', '3d');
  const canvas = hero.getByRole('img', { name: 'Interactive classic Negroni', exact: true });
  await expect(canvas).toBeVisible();
  await expect.poll(async () => Number(await canvas.getAttribute('data-rendered-frames'))).toBeGreaterThan(0);
  await expect.poll(async () => Number(await canvas.getAttribute('data-progress'))).toBeCloseTo(selectedPose, 3);
  expect(heavyRequests.some(url => url.includes('/simulation/negroni.bin'))).toBe(true);
  expect(heavyRequests.some(url => url.includes('bbf-negroni'))).toBe(false);
  expect(await film(page).evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
  const beforeOrbit = await canvas.screenshot();
  await hero.getByRole('button', { name: 'Rotate Negroni right', exact: true }).click();
  await expect.poll(async () => beforeOrbit.equals(await canvas.screenshot())).toBe(false);
  await hero.getByRole('button', { name: 'Reset Negroni', exact: true }).click();
  await waitFilm(page);
  expect(await progress(page)).toBe(0);
  expect(await filmTime(page)).toBeCloseTo(0, 2);
  await expect(canvas).toBeHidden();
  await seekMidpoint(page);
  await hero.locator('.cn-stage').focus();
  await hero.locator('.cn-stage').press('ArrowLeft');
  await expect(canvas).toBeVisible();
  expect(await progress(page)).toBeCloseTo(selectedPose, 3);
  await hero.getByRole('button', { name: 'Play animation', exact: true }).click();
  await expect.poll(async () => Number(await canvas.getAttribute('data-progress'))).toBeGreaterThan(selectedPose + .025);
  await expect(hero).toHaveAttribute('data-direction', '-1');
  await expect.poll(async () => Number(await canvas.getAttribute('data-progress'))).toBeLessThan(.9);
  await expect(hero).toHaveAttribute('data-direction', '1');
  await expect.poll(async () => Number(await canvas.getAttribute('data-progress'))).toBeGreaterThan(.03);
  await hero.getByRole('button', { name: 'Pause animation', exact: true }).click();
  await page.screenshot({ path: `${evidenceDir}/classic-live-3d-1440x1000.png` });
  await testInfo.attach('classic-live-scene', { body: JSON.stringify({ selectedPose, finalPose: await progress(page), heavyRequests }), contentType: 'application/json' });
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

test('WebGL unavailable restores the cinematic film without blocking the landing or ingredient entry', async ({ page }) => {
  // THREE logs its intentional context-creation failure before throwing. All
  // other runtime and network errors remain fatal and are attached as evidence.
  expectedFailures.set(page, [/THREE\.WebGLRenderer: Error creating WebGL context\./]);
  await page.addInitScript(() => {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, kind: string, ...args: unknown[]) {
      if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
      return getContext.apply(this, [kind, ...args] as Parameters<typeof getContext>);
    } as typeof getContext;
  });
  await page.goto('/');
  await expect(headline(page)).toBeVisible();
  await waitFilm(page);
  await seekMidpoint(page);
  const selectedPose = await progress(page);
  const hero = classic(page);
  await hero.getByRole('button', { name: 'Rotate Negroni right', exact: true }).click();
  await expect(hero.getByText('Rotation is unavailable on this device. You can still play the animation.', { exact: true })).toBeVisible();
  await waitFilm(page);
  await expect(hero).toHaveAttribute('data-mode', 'cinematic');
  expect(await progress(page)).toBeCloseTo(selectedPose, 3);
  await hero.getByRole('button', { name: 'Play animation', exact: true }).click();
  await expect.poll(() => filmTime(page)).toBeGreaterThan(selectedPose * 7.2 + .2);
  await page.getByRole('link', { name: 'Explore ingredients', exact: true }).click();
  await expect(page).toHaveURL(/drink=ichigo-negroni&expand=1/);
  await expect(page.getByText('Interactive 3D is unavailable in this browser.', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Inside the drink', exact: true })).toBeVisible();
});

test.describe('phone touch and reduced motion', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  test('touch controls choose stable cinematic endpoints and explicit playback does not start an idle loop', async ({ page }, testInfo) => {
    await page.goto('/');
    await waitFilm(page);
    expect(await page.locator('.sa-hero-copy').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
    await expectNoPageOverflow(page);
    const hero = classic(page);
    await expect(hero).toHaveAttribute('data-playing', 'false');
    await hero.getByRole('button', { name: 'Look inside', exact: true }).tap();
    await expect(hero).toHaveAttribute('data-progress', '1.00000');
    await waitFilm(page);
    const still = await filmTime(page);
    await page.waitForTimeout(350);
    expect(await filmTime(page)).toBeCloseTo(still, 2);
    expect(await film(page).evaluate((video: HTMLVideoElement) => video.paused)).toBe(true);
    await hero.getByRole('button', { name: 'Bring it together', exact: true }).tap();
    await expect(hero).toHaveAttribute('data-progress', '0.00000');
    await expect(hero).toHaveAttribute('data-playing', 'false');
    await hero.getByRole('button', { name: 'Play animation', exact: true }).tap();
    await expect(hero).toHaveAttribute('data-playing', 'true');
    await expect.poll(() => progress(page)).toBeGreaterThan(.1);
    await expect(hero).toHaveAttribute('data-progress', '1.00000');
    await expect(hero).toHaveAttribute('data-playing', 'false');
    await page.screenshot({ path: `${evidenceDir}/classic-reduced-motion-390x844.png` });
    await page.getByRole('link', { name: 'Explore the atlas', exact: true }).tap();
    await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
    await expect(page.locator('.atlas-intro h1')).toHaveText('Three bars. Three takes on the Negroni.');
    await expectNoPageOverflow(page);
    await testInfo.attach('touch-reduced-motion', { body: JSON.stringify({ endpointSeconds: still, explicitPlaybackCompleted: true }), contentType: 'application/json' });
  });
});
