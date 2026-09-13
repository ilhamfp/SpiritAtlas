import { expect, test } from '@playwright/test';
import { snapshot, viewer, waitExpansion, waitLive } from './helpers';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 390, height: 844 }, video: 'on' });

test('touch rotation, visible expansion and page scrolling remain available on a phone', async ({ page }, testInfo) => {
  const id = 'bbf-negroni';
  await page.goto(`/?drink=${id}`);
  await waitLive(page, [id]);
  await viewer(page, id).scrollIntoViewIfNeeded();
  const rect = await viewer(page, id).boundingBox();
  expect(rect).not.toBeNull();
  const start = await snapshot(page, id);
  const x = rect!.x + rect!.width * 0.72;
  const y = Math.min(720, rect!.y + rect!.height * 0.45);
  const client = await page.context().newCDPSession(page);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  for (let step = 1; step <= 12; step++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - step * 8, y }] });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth - start.camera.azimuth)).toBeGreaterThan(0.15);
  expect((await snapshot(page, id)).e).toBeLessThan(0.015);
  await page.getByRole('button', { name: 'Explore ingredients', exact: true }).tap();
  await waitExpansion(page, [id], 1);
  await page.getByRole('heading', { name: 'Inside the drink', exact: true }).scrollIntoViewIfNeeded();
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 20, y: 680 }] });
  for (let step = 1; step <= 10; step++) {
    await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 20, y: 680 - step * 30 }] });
  }
  await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await expect.poll(async () => page.evaluate(() => window.scrollY)).toBeGreaterThan(scrollBefore + 20);
  await testInfo.attach('touch-recipe-view', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
