import { expect, test } from '@playwright/test';
import { snapshot, viewer, waitExpansion, waitLive } from './helpers';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
const bbfAsset = JSON.parse(readFileSync(new URL('../assets/blender/bbf-negroni.json', import.meta.url), 'utf8')) as { version: string };

const expectedRevision = bbfAsset.version;


test('loading state stays explicit until the runtime asset is available', async ({ page }, info) => {
  const requests: string[] = [];
  let release: (() => void) | undefined;
  const released = new Promise<void>((resolve) => { release = resolve; });
  await page.route('**/models/bbf-negroni.glb*', async (route) => { requests.push(route.request().url()); await released; await route.continue(); });
  await page.goto('/?drink=bbf-negroni');
  try {
    await expect(page.getByText('Preparing live 3D', { exact: false })).toBeVisible();
    await expect(viewer(page, 'bbf-negroni')).toHaveAttribute('data-live', 'false');
    await expect(page.getByRole('heading', { name: 'BBF Negroni', exact: true })).toBeVisible();
  } finally { release?.(); }
  await waitLive(page, ['bbf-negroni']);
  expect(requests.length).toBeGreaterThan(0);
  for (const url of requests) expect(new URL(url).searchParams.get('revision')).toBe(expectedRevision);
  await info.attach('versioned-model-loading', { body: JSON.stringify({ expectedRevision, requests }, null, 2), contentType: 'application/json' });
});

test('map failure preserves all venues and useful directions', async ({ page }) => {
  await page.route('https://tiles.openfreemap.org/**', (route) => route.abort('failed'));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'The map is unavailable.', exact: true })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: 'Retry map', exact: true })).toBeVisible();
  const featured = page.getByRole('region', { name: 'Featured bars' });
  for (const venue of ['Bar Bon Funk', 'MOGA', 'Bar Somma']) {
    await expect(featured.locator('article').filter({ hasText: venue })).toBeVisible();
  }
  await featured.locator('article').filter({ hasText: 'MOGA' }).getByRole('button', { name: 'Explore drink', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ichigo Negroni');
  await expect(page.getByRole('link', { name: 'Get directions', exact: false })).toHaveAttribute('href', /MOGA\+1\+Hill\+Street/);
});

test('model error reports failure and Retry 3D can recover to a live model', async ({ page }, info) => {
  const requests: { url: string; deliberatelyFailed: boolean }[] = [];
  let failModel = true;
  await page.route('**/models/bbf-negroni.glb*', async (route) => {
    requests.push({ url: route.request().url(), deliberatelyFailed: failModel });
    if (failModel) await route.abort('failed'); else await route.continue();
  });
  await page.goto('/?drink=bbf-negroni');
  await expect(page.getByText('3D model could not load', { exact: false })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: 'BBF Negroni', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Explore ingredients', exact: true })).toBeVisible();
  await expect(viewer(page, 'bbf-negroni')).not.toHaveAttribute('data-live', 'true');
  failModel = false;
  await page.getByRole('button', { name: 'Retry 3D', exact: true }).click();
  await waitLive(page, ['bbf-negroni']);
  await expect(page.getByText('3D model could not load', { exact: false })).toHaveCount(0);
  expect(requests.some((request) => request.deliberatelyFailed)).toBe(true);
  expect(requests.some((request) => !request.deliberatelyFailed)).toBe(true);
  for (const request of requests) expect(new URL(request.url).searchParams.get('revision')).toBe(expectedRevision);
  const sources = ['src/scenes/Viewer.tsx', 'assets/blender/bbf-negroni.json', 'public/models/bbf-negroni.glb'].map((path) => ({ path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') }));
  await info.attach('versioned-model-retry', { body: JSON.stringify({ expectedRevision, requests, sources, finalState: await snapshot(page, 'bbf-negroni') }, null, 2), contentType: 'application/json' });
});

test('unavailable WebGL keeps drink facts, ingredients, directions and comparison reachable', async ({ page }) => {
  await page.goto('/?drink=negroni-express&webgl=off');
  await expect(page.getByRole('heading', { name: 'Negroni Express', exact: true })).toBeVisible();
  await expect(viewer(page, 'negroni-express')).not.toHaveAttribute('data-live', 'true');
  await expect(page.getByText(/WebGL|3D.*unavailable/).first()).toBeVisible();
  await page.getByRole('button', { name: /Garnish Pickled shishito/ }).click();
  await expect(page.getByText('A curved green shishito with wrinkled skin', { exact: false })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Get directions', exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Add to comparison', exact: true }).click();
  await expect(page.getByRole('complementary', { name: 'Comparison selection' })).toContainText('1 of 3 drinks');
});

test('reduced motion renders the selected expansion promptly and still supports keyboard inspection', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?drink=bbf-negroni');
  await waitLive(page, ['bbf-negroni']);
  await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
  await expect.poll(async () => (await snapshot(page, 'bbf-negroni')).e, { timeout: 1_500 }).toBeGreaterThan(0.985);
  await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
  await waitExpansion(page, ['bbf-negroni'], 0);
  const before = (await snapshot(page, 'bbf-negroni')).camera.azimuth;
  await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await expect.poll(async () => (await snapshot(page, 'bbf-negroni')).camera.azimuth).toBeGreaterThan(before + 0.1);
});
