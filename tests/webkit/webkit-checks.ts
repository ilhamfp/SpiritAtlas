import { expect, test } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { cameraPositionError, drinkIds, positionError, recordState, snapshot, viewer, waitExpansion, waitLive } from '../helpers';

test.beforeEach(async ({ browser, page }, testInfo) => {
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(String(error)));
  page.on('console', (message) => {
    if (message.type() === 'error' && /shader|program.*link|framebuffer.*incomplete/i.test(message.text())) runtimeErrors.push(message.text());
  });
  const sources = ['src/scenes/Viewer.tsx', 'src/App.tsx', ...drinkIds.flatMap((id) => [`public/models/${id}.glb`, `assets/blender/${id}.json`])].map((path) => {
    const bytes = readFileSync(path);
    return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
  await testInfo.attach('webkit-runtime-and-sources', { body: JSON.stringify({ browser: browser.version(), startedAt: new Date().toISOString(), sources }, null, 2), contentType: 'application/json' });
  // Expose only this test's observations to afterEach, without modifying app state.
  (testInfo as unknown as { runtimeErrors: string[] }).runtimeErrors = runtimeErrors;
});

test.afterEach(async ({ page }, testInfo) => {
  const runtimeErrors = (testInfo as unknown as { runtimeErrors: string[] }).runtimeErrors;
  await testInfo.attach('webkit-runtime-errors', { body: JSON.stringify(runtimeErrors), contentType: 'application/json' });
  if (!testInfo.title.includes('failed model')) expect(runtimeErrors).toEqual([]);
  await testInfo.attach('webkit-final-screen', { body: await page.screenshot(), contentType: 'image/png' });
});

test('WebKit loads all three GLBs and preserves synchronized and independent actual cameras', async ({ page }, testInfo) => {
  await page.goto('/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=0');
  await waitLive(page, drinkIds);
  await waitExpansion(page, drinkIds, 0);
  const bbf = page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
  const initial = await snapshot(page, 'bbf-negroni');
  await bbf.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await expect.poll(async () => cameraPositionError(initial, await snapshot(page, 'bbf-negroni'))).toBeGreaterThan(0.2);
  for (const id of drinkIds.slice(1)) await expect.poll(async () => cameraPositionError(await snapshot(page, 'bbf-negroni'), await snapshot(page, id))).toBeLessThan(0.02);
  await page.getByRole('switch').click();
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  const untouched = await snapshot(page, 'ichigo-negroni');
  await bbf.getByRole('button', { name: 'View from higher angle', exact: true }).click();
  await expect.poll(async () => cameraPositionError(untouched, await snapshot(page, 'bbf-negroni'))).toBeGreaterThan(0.2);
  expect(cameraPositionError(untouched, await snapshot(page, 'ichigo-negroni'))).toBeLessThan(0.01);
  await page.getByRole('button', { name: 'Reset alignment', exact: true }).click();
  for (const id of drinkIds) await expect.poll(async () => cameraPositionError(initial, await snapshot(page, id))).toBeLessThan(0.02);
  await recordState(page, testInfo, 'webkit-all-three-assembled', drinkIds);
});

test('WebKit Somma recipe shows six categories and selectable Unknown geometry then restores pose', async ({ page }, testInfo) => {
  const id = 'negroni-express';
  await page.goto(`/?drink=${id}&expand=0`);
  await waitLive(page, [id]);
  const assembled = await snapshot(page, id);
  await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
  await waitExpansion(page, [id], 1);
  const labels = viewer(page, id).locator('.ingredient-labels button[data-category]');
  await expect(labels).toHaveCount(6);
  for (const label of await labels.all()) await expect.poll(() => label.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.95);
  const expanded = await snapshot(page, id);
  expect(new Set(expanded.parts.filter((part) => part.visible).map((part) => part.category)).size).toBe(6);
  for (const category of ['spirit', 'bitter', 'vermouth']) {
    const part = expanded.parts.find((part) => part.id === `recipe_${category}`)!;
    expect(part.visible).toBe(true);
    expect(Math.min(...part.scale!)).toBeGreaterThan(0.95);
    await expect(viewer(page, id).locator(`.ingredient-labels button[data-category="${category}"]`)).toContainText('Unknown');
  }
  const selected = viewer(page, id).locator('.ingredient-labels button[data-category="spirit"]');
  await selected.click();
  await expect(selected).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.ingredient-item.is-active')).toContainText('Base spirit');
  await recordState(page, testInfo, 'webkit-somma-expanded', [id]);
  await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
  await waitExpansion(page, [id], 0);
  expect(positionError(assembled, await snapshot(page, id))).toBeLessThan(0.002);
  for (const category of ['spirit', 'bitter', 'vermouth']) expect((await snapshot(page, id)).parts.find((part) => part.id === `recipe_${category}`)?.visible).toBe(false);
});

test('WebKit loads real map vectors through the bundled worker and shared venue selection', async ({ page }, testInfo) => {
  const requests: { url: string; status: number }[] = [];
  const failures: string[] = [];
  page.on('response', (response) => {
    if (/tiles\.openfreemap\.org|maplibre-gl-worker/.test(response.url())) requests.push({ url: response.url(), status: response.status() });
  });
  page.on('requestfailed', (request) => { if (/tiles\.openfreemap\.org|maplibre-gl-worker/.test(request.url())) failures.push(`${request.url()} ${request.failure()?.errorText}`); });
  await page.goto('/');
  await expect(page.locator('.map-loading')).toHaveCount(0, { timeout: 30_000 });
  await expect(page.locator('.map-error')).toHaveCount(0);
  await expect.poll(() => requests.filter((request) => /\.pbf(?:\?|$)/.test(request.url) && request.status === 200).length).toBeGreaterThan(0);
  expect(requests.some((request) => /maplibre-gl-worker/.test(request.url) && request.status === 200)).toBe(true);
  await page.getByRole('button', { name: 'New Bahru, two bars: Bar Bon Funk and Bar Somma', exact: true }).click();
  const picker = page.locator('[aria-label="Venues at New Bahru"]');
  await picker.getByRole('button', { name: /Bar Somma/ }).click();
  await expect(page).toHaveURL(/bar=bar-somma/);
  for (const attribution of ['OpenFreeMap', 'OpenStreetMap']) await expect(page.getByRole('link', { name: attribution, exact: true })).toBeVisible();
  expect(failures).toEqual([]);
  expect(requests.filter((request) => request.status >= 400)).toEqual([]);
  await testInfo.attach('webkit-map-requests', { body: JSON.stringify({ requests, failures }, null, 2), contentType: 'application/json' });
});

test('WebKit reduced motion and focused keyboard alter the real camera and recipe state', async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const id = 'negroni-express';
  await page.goto(`/?drink=${id}&expand=0`);
  await waitLive(page, [id]);
  const before = await snapshot(page, id);
  const stage = page.getByLabel('Negroni Express interactive 3D viewer', { exact: true });
  await stage.focus();
  await stage.press('ArrowRight');
  await expect.poll(async () => cameraPositionError(before, await snapshot(page, id))).toBeGreaterThan(0.05);
  await stage.press('ArrowUp');
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.elevation - before.camera.elevation)).toBeGreaterThan(0.02);
  await stage.press('+');
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.zoom - before.camera.zoom)).toBeGreaterThan(0.01);
  await stage.press('Space');
  await expect.poll(async () => (await snapshot(page, id)).e, { timeout: 1500 }).toBeGreaterThan(0.985);
  await stage.press('Space');
  await waitExpansion(page, [id], 0);
  await recordState(page, testInfo, 'webkit-keyboard-reduced-motion', [id]);
});

test('WebKit failed model recovers and explicit unavailable WebGL keeps useful facts', async ({ page }) => {
  let blocked = true;
  await page.route('**/models/bbf-negroni.glb*', async (route) => { if (blocked) await route.abort('failed'); else await route.continue(); });
  await page.goto('/?drink=bbf-negroni');
  await expect(page.getByText('3D model could not load', { exact: false })).toBeVisible();
  blocked = false;
  await page.getByRole('button', { name: 'Retry 3D', exact: true }).click();
  await waitLive(page, ['bbf-negroni']);
  await page.goto('/?drink=negroni-express&webgl=off');
  await expect(viewer(page, 'negroni-express')).not.toHaveAttribute('data-live', 'true');
  await expect(page.getByText(/WebGL|3D.*unavailable/).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Negroni Express', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Garnish Pickled shishito/ }).click();
  await expect(page.getByText('A curved green shishito with wrinkled skin', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get directions', exact: false })).toBeVisible();
});
