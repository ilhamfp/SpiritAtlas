import {test, expect, type Page} from '@playwright/test';

const classic = (page: Page) => page.getByRole('region', {name: 'Classic Negroni experience', exact: true});
const liveScene = (page: Page) => page.getByRole('img', {name: 'Interactive classic Negroni', exact: true});

async function openClassic(page: Page) {
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const forward = classic(page).locator('video[data-sequence="forward"]');
  await expect(forward).toHaveAttribute('data-active', 'true');
  await expect(forward).toHaveCSS('opacity', '1');
  await expect(classic(page).locator('.cn-poster')).toHaveCSS('opacity', '0');
}

for (const viewport of [{width: 1440, height: 1000}, {width: 390, height: 844}]) {
  test(`cinematic autoplay is muted, continuous and pausable at ${viewport.width}px`, async ({page}) => {
    await page.setViewportSize(viewport);
    const heavyRequests: string[] = [];
    page.on('request', request => {
      if (/classic-negroni\/(simulation|textures)|\/assets\/(renderer|three)-/.test(request.url())) heavyRequests.push(request.url());
    });
    await page.addInitScript(() => {
      let frames = 0;
      const request = window.requestAnimationFrame.bind(window);
      Object.defineProperty(window, '__rafCalls', {get: () => frames});
      window.requestAnimationFrame = callback => request(time => {frames++; callback(time);});
    });
    await openClassic(page);
    const hero = classic(page);
    await expect(hero).toHaveAttribute('data-playing', 'true');
    await expect.poll(async () => Number(await hero.getAttribute('data-progress'))).toBeGreaterThan(0);
    await expect(hero).toHaveAttribute('data-looping', 'true');
    const idle = hero.locator('video[data-sequence="idle"]');
    await expect(idle).toHaveAttribute('data-active', 'true');
    expect(await idle.evaluate((video: HTMLVideoElement) => video.muted && video.playsInline && !video.paused)).toBe(true);
    expect(heavyRequests).toEqual([]);
    await hero.getByRole('button', {name: 'Pause animation', exact: true}).click();
    const time = await idle.evaluate((video: HTMLVideoElement) => video.currentTime);
    await page.waitForTimeout(100);
    const frames = await page.evaluate(() => Reflect.get(window, '__rafCalls'));
    await page.waitForTimeout(250);
    expect(await idle.evaluate((video: HTMLVideoElement) => video.currentTime)).toBeCloseTo(time, 2);
    expect(await page.evaluate(() => Reflect.get(window, '__rafCalls'))).toBe(frames);
  });
}

test('blocked autoplay leaves a usable manual play control', async ({page}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let interacted = false;
    document.addEventListener('pointerdown', event => {if (event.isTrusted) interacted = true;}, {capture: true});
    HTMLMediaElement.prototype.play = function () {
      if (!interacted) return Promise.reject(new DOMException('Autoplay blocked', 'NotAllowedError'));
      return play.call(this);
    };
  });
  await openClassic(page);
  const hero = classic(page);
  await expect(hero.getByText('Press play to continue the animation.', {exact: true})).toBeVisible();
  await expect(hero).toHaveAttribute('data-playing', 'false');
  await hero.getByRole('button', {name: 'Play animation', exact: true}).click();
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await expect(hero.locator('.cn-status')).toBeEmpty();
});

test('desktop framing keeps playback controls in view and ingredient reveals preserve the layout', async ({page}) => {
  await page.emulateMedia({reducedMotion: 'reduce'});
  for (const viewport of [{width: 1440, height: 1000}, {width: 1280, height: 900}]) {
    await page.setViewportSize(viewport);
    await openClassic(page);
    const hero = classic(page);
    const controls = await hero.locator('.cn-controls').boundingBox();
    expect(controls!.y + controls!.height).toBeLessThan(viewport.height);
    const before = await page.locator('.sa-hero-foot').boundingBox();
    await hero.getByRole('button', {name: 'Look inside', exact: true}).click();
    await expect(hero.getByRole('list', {name: 'Classic Negroni ingredients'})).toBeVisible();
    expect(await page.locator('.sa-hero-foot').boundingBox()).toEqual(before);
    await hero.getByRole('button', {name: 'Bring it together', exact: true}).click();
    expect(await page.locator('.sa-hero-foot').boundingBox()).toEqual(before);
  }
});

test('returning to cinematic cancels a pending 3D load and lets the visitor try again', async ({page}) => {
  let release!: () => void;
  const held = new Promise<void>(resolve => {release = resolve;});
  let requested = false;
  await page.route('**/classic-negroni/simulation/negroni.bin', async route => {
    requested = true;
    await held;
    await route.continue();
  });
  try {
    await openClassic(page);
    const hero = classic(page);
    await hero.getByRole('button', {name: 'Explore 3D', exact: true}).click();
    await expect.poll(() => requested).toBe(true);
    await expect(hero.getByText('Preparing your 3D view…', {exact: true})).toBeVisible();
    await hero.getByRole('button', {name: 'Cinematic', exact: true}).click();
    await expect(hero.locator('.cn-loading')).toHaveCount(0);
    await expect(hero).toHaveAttribute('data-mode', 'cinematic');
    release();
    await hero.getByRole('button', {name: 'Explore 3D', exact: true}).click();
    await expect(liveScene(page)).toBeVisible();
    await expect(hero.locator('.cn-loading')).toHaveCount(0);
    await expect(hero.locator('.cn-status')).toBeEmpty();
  } finally {release();}
});

test('cinematic playback pauses offscreen and resumes at the same point', async ({page}) => {
  await openClassic(page);
  const hero = classic(page);
  const video = hero.locator('video[data-sequence="forward"]');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(.2);
  await page.evaluate(() => window.scrollTo({top: document.body.scrollHeight, behavior: 'instant'}));
  await expect(hero).toHaveAttribute('data-suspended', 'true');
  const pausedAt = await video.evaluate((element: HTMLVideoElement) => element.currentTime);
  await page.waitForTimeout(250);
  expect(await video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeCloseTo(pausedAt, 2);
  await page.evaluate(() => window.scrollTo({top: 0, behavior: 'instant'}));
  await expect(hero).toHaveAttribute('data-playing', 'true');
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(pausedAt);
});

test.describe('live scene on touch screens', () => {
  test.use({viewport: {width: 390, height: 844}, hasTouch: true, isMobile: true, reducedMotion: 'reduce'});

  test('reduced motion settles the camera immediately and vertical swipes scroll over the 3D scene', async ({page}) => {
    await openClassic(page);
    const hero = classic(page);
    await hero.getByRole('button', {name: 'Explore 3D', exact: true}).tap();
    const canvas = liveScene(page);
    await expect(canvas).toBeVisible();
    await hero.getByRole('button', {name: 'Look inside', exact: true}).tap();
    await expect(canvas).toHaveAttribute('data-progress', '1');
    await expect(hero).toHaveAttribute('data-playing', 'false');
    await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))));
    const settledFrames = await canvas.getAttribute('data-rendered-frames');
    await page.waitForTimeout(250);
    expect(await canvas.getAttribute('data-rendered-frames')).toBe(settledFrames);
    await canvas.scrollIntoViewIfNeeded();
    expect(await canvas.evaluate(element => getComputedStyle(element).touchAction)).toBe('pan-y');
    const bounds = await canvas.boundingBox();
    const x = bounds!.x + bounds!.width / 2;
    const y = bounds!.y + bounds!.height * .7;
    const startScroll = await page.evaluate(() => window.scrollY);
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {type: 'touchStart', touchPoints: [{x, y}]});
    for (let step = 1; step <= 8; step++) {
      await session.send('Input.dispatchTouchEvent', {type: 'touchMove', touchPoints: [{x, y: y - step * 18}]});
      await page.waitForTimeout(16);
    }
    await session.send('Input.dispatchTouchEvent', {type: 'touchEnd', touchPoints: []});
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(startScroll + 40);
    await session.detach();
  });
});
