import { test, expect } from '@playwright/test';
import type { Page, TestInfo } from '@playwright/test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { drinkById } from '../../src/data/drinks';
import { drinkIds, positionError, recordState, snapshot, viewer, waitExpansion, waitLive, type DrinkId, type ViewerSnapshot } from '../helpers';

const modelContracts = Object.fromEntries(drinkIds.map((id) => {
  const manifest = JSON.parse(readFileSync(`assets/blender/${id}.json`, 'utf8')) as { version: string; parts: { id: string }[]; normalBake?: { objects: string[]; normalTextureSize: [number, number] } };
  return [id, { version: manifest.version, ids: manifest.parts.map((part) => part.id).sort(), normalBake: manifest.normalBake ?? null }];
}));

test.beforeEach(async ({ page, browser }, info) => {
  if (process.env.ATLAS_EXPECT_ASSET_REVISION) for (const id of drinkIds) expect(modelContracts[id].version).toBe(process.env.ATLAS_EXPECT_ASSET_REVISION);
  const errors: string[] = [];
  const modelRequests: { drinkId: string; url: string; status: number }[] = [];
  page.on('response', (response) => { const url = new URL(response.url()); const id = drinkIds.find((id) => url.pathname === `/models/${id}.glb`); if (id) modelRequests.push({ drinkId: id, url: response.url(), status: response.status() }); });
  (info as unknown as { modelRequests: typeof modelRequests }).modelRequests = modelRequests;
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('console', (message) => { if (message.type() === 'error' && /shader|WebGL|framebuffer|program.*link|texture/i.test(message.text())) errors.push(message.text()); });
  const sources = ['src/scenes/Viewer.tsx', 'src/scenes/BarEnvironment.tsx', 'src/scenes/BarLighting.tsx', 'src/App.tsx', 'src/styles.css', 'src/scenes/viewer.css', 'src/main.tsx', 'src/data/drinks.ts', 'package-lock.json', 'public/textures/somma-interior-panorama-v2.png', 'public/textures/somma-stone-tile-v1.png', ...drinkIds.flatMap((id) => [`public/models/${id}.glb`, `assets/blender/${id}.json`])].map((path) => {
    const bytes = readFileSync(path); return { path, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
  (info as unknown as { stageErrors: string[] }).stageErrors = errors;
  await info.attach('stage-source-and-engine', { body: JSON.stringify({ browser: browser.version(), sources, modelContracts, startedAt: new Date().toISOString() }, null, 2), contentType: 'application/json' });
});

test.afterEach(async ({}, info) => {
  const errors = (info as unknown as { stageErrors: string[] }).stageErrors;
  await info.attach('stage-runtime-errors', { body: JSON.stringify(errors), contentType: 'application/json' });
  expect(errors).toEqual([]);
  const requests = (info as unknown as { modelRequests: { drinkId: string; url: string; status: number }[] }).modelRequests;
  await info.attach('stage-versioned-model-requests', { body: JSON.stringify(requests, null, 2), contentType: 'application/json' });
  expect(requests.length).toBeGreaterThan(0);
  for (const request of requests) { expect(request.status).toBe(200); expect(new URL(request.url).searchParams.get('revision')).toBe(modelContracts[request.drinkId].version); }
});

async function verifyExpanded(page: Page, id: DrinkId) {
  const labels = viewer(page, id).locator('.ingredient-labels button[data-category]');
  await expect(labels).toHaveCount(6);
  for (const label of await labels.all()) await expect.poll(() => label.evaluate((el) => Number(getComputedStyle(el).opacity))).toBeGreaterThan(.95);
  const expanded = await snapshot(page, id);
  verifyNormalMaps(expanded, id);
  expect([...new Set(expanded.parts.map((part) => part.id))].sort(), `${id}: actual rendered nodes match the promoted source manifest`).toEqual(modelContracts[id].ids);
  expect(new Set(expanded.parts.filter((part) => part.visible).map((part) => part.category)).size).toBe(6);
  const unknown = drinkById[id].ingredients.filter((ingredient) => ingredient.evidence === 'unverified');
  for (const ingredient of unknown) {
    const part = expanded.parts.find((part) => part.id === `recipe_${ingredient.category}`)!;
    expect(part.visible).toBe(true); expect(Math.min(...part.scale!)).toBeGreaterThan(.95);
    const label = viewer(page, id).locator(`.ingredient-labels button[data-category="${ingredient.category}"]`);
    await expect(label).toContainText('Unknown');
    await label.click(); await expect(label).toHaveAttribute('aria-pressed', 'true');
  }
  expect(expanded.stage?.stoneMipBias).toBe(2);
}

function verifyNormalMaps(state: ViewerSnapshot, id: DrinkId) {
  const bake = modelContracts[id].normalBake;
  if (!bake) return;
  const mapped = state.parts.filter((part) => part.normalMap != null);
  expect(mapped.map((part) => part.id).sort(), `${id}: actual runtime materials retain the exact baked normal-map assignments`).toEqual(bake.objects.slice().sort());
  for (const part of mapped) expect(part.normalMap, `${id}/${part.id}: the embedded image is decoded at its authored dimensions`).toEqual({ width: bake.normalTextureSize[0], height: bake.normalTextureSize[1] });
}

async function verifyLabelBounds(page: Page, info: TestInfo, id: DrinkId, name: string) {
  await page.evaluate(() => document.fonts.ready);
  const bounds = await viewer(page, id).evaluate((element) => {
    const parent = element.getBoundingClientRect();
    return { parent: { left: parent.left, right: parent.right, top: parent.top, bottom: parent.bottom }, labels: [...element.querySelectorAll<HTMLElement>('.ingredient-labels button[data-category]')].map((el) => {
      const r = el.getBoundingClientRect(), style = getComputedStyle(el);
      return { text: el.textContent, category: el.dataset.category, left: r.left, right: r.right, top: r.top, bottom: r.bottom, fontSize: parseFloat(style.fontSize), fontFamily: style.fontFamily, horizontalOverflow: el.scrollWidth > el.clientWidth + 1, verticalOverflow: el.scrollHeight > el.clientHeight + 1 };
    }) };
  });
  expect(bounds.labels).toHaveLength(6);
  for (const r of bounds.labels) {
    expect(r.fontSize, `${r.text}: enlarged legible label text`).toBeGreaterThanOrEqual(12);
    expect(r.horizontalOverflow, r.text ?? '').toBe(false); expect(r.verticalOverflow, r.text ?? '').toBe(false);
    expect(r.left).toBeGreaterThanOrEqual(bounds.parent.left - .5); expect(r.right).toBeLessThanOrEqual(bounds.parent.right + .5);
    expect(r.top).toBeGreaterThanOrEqual(bounds.parent.top - .5); expect(r.bottom).toBeLessThanOrEqual(bounds.parent.bottom + .5);
  }
  for (let a = 0; a < bounds.labels.length; a++) for (let b = a + 1; b < bounds.labels.length; b++) {
    const x = bounds.labels[a], y = bounds.labels[b];
    const overlapWidth = Math.min(x.right, y.right) - Math.max(x.left, y.left), overlapHeight = Math.min(x.bottom, y.bottom) - Math.max(x.top, y.top);
    expect(overlapWidth > .5 && overlapHeight > .5, `${id}: ${x.text} overlaps ${y.text}`).toBe(false);
  }
  await info.attach(name, { body: JSON.stringify(bounds, null, 2), contentType: 'application/json' });
}

async function capture(page: Page, info: TestInfo, name: string, ids: readonly DrinkId[]) {
  await recordState(page, info, name, ids);
  for (const id of ids) await info.attach(`${name}-${id}-native-viewer`, { body: await viewer(page, id).screenshot(), contentType: 'image/png' });
}

for (const id of drinkIds) test(`stage ${id}: quiet bar preserves assembled, six recipe categories and reassembly`, async ({ page }, info) => {
  await page.goto(`/?drink=${id}&expand=0`);
  await waitLive(page, [id]); await waitExpansion(page, [id], 0);
  const assembled = await snapshot(page, id);
  verifyNormalMaps(assembled, id);
  await capture(page, info, 'stage-assembled', [id]);
  await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
  await waitExpansion(page, [id], 1);
  await verifyExpanded(page, id);
  await capture(page, info, 'stage-expanded', [id]);
  await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
  await waitExpansion(page, [id], 0);
  expect(positionError(assembled, await snapshot(page, id))).toBeLessThan(.002);
  for (const ingredient of drinkById[id].ingredients.filter((ingredient) => ingredient.evidence === 'unverified')) expect((await snapshot(page, id)).parts.find((part) => part.id === `recipe_${ingredient.category}`)?.visible).toBe(false);
});

test('stage mobile 390: six readable labels and selectable Unknown objects remain in the viewer', async ({ page }, info) => {
  const id = 'negroni-express';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?drink=${id}&expand=1`); await viewer(page, id).scrollIntoViewIfNeeded();
  await waitLive(page, [id]); await waitExpansion(page, [id], 1); await verifyExpanded(page, id);
  await verifyLabelBounds(page, info, id, 'stage-mobile-label-bounds');
  await capture(page, info, 'stage-mobile-expanded', [id]);
});

test('stage three-way comparison preserves six categories and shared expansion', async ({ page }, info) => {
  await page.goto('/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=0');
  await waitLive(page, drinkIds); await waitExpansion(page, drinkIds, 0);
  const assembled = await Promise.all(drinkIds.map((id) => snapshot(page, id)));
  await capture(page, info, 'stage-comparison-assembled', drinkIds);
  await page.getByRole('button', { name: 'Expand all', exact: true }).click(); await waitExpansion(page, drinkIds, 1);
  for (const id of drinkIds) { await verifyExpanded(page, id); await verifyLabelBounds(page, info, id, `stage-comparison-label-bounds-${id}`); }
  await capture(page, info, 'stage-comparison-expanded', drinkIds);
  await page.getByRole('button', { name: 'Reassemble all', exact: true }).click(); await waitExpansion(page, drinkIds, 0);
  for (let i = 0; i < drinkIds.length; i++) expect(positionError(assembled[i], await snapshot(page, drinkIds[i]))).toBeLessThan(.002);
});

test('stage normal transition follows real expansion continuously and reduced motion settles together', async ({ page }, info) => {
  const id = 'negroni-express';
  await page.goto(`/?drink=${id}&expand=0`);await waitLive(page, [id]);
  const start = await snapshot(page, id);
  expect(start.stage).toBeDefined();
  await page.evaluate(() => {
    const samples: { e: number; stage: ViewerSnapshot['stage']; time: number }[] = [];
    const tick = () => { const s = (window as unknown as { __atlasViewers: Record<string, ViewerSnapshot> }).__atlasViewers['negroni-express']; if (s) samples.push({ e: s.e, stage: s.stage, time: performance.now() }); (window as unknown as { stageRAF: number }).stageRAF = requestAnimationFrame(tick); };
    (window as unknown as { stageSamples: unknown[] }).stageSamples = samples;tick();
  });
  await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
  await expect.poll(async () => (await snapshot(page, id)).e).toBeGreaterThan(.999);
  const finish = await snapshot(page, id);
  const samples = await page.evaluate(() => { cancelAnimationFrame((window as unknown as { stageRAF: number }).stageRAF);return (window as unknown as { stageSamples: { e: number; stage: NonNullable<ViewerSnapshot['stage']>; time: number }[] }).stageSamples; });
  const intermediate = samples.filter((s) => s.e > .05 && s.e < .95);
  expect(new Set(intermediate.map((s) => s.e)).size).toBeGreaterThanOrEqual(3);
  const measures = ['backgroundBlurriness', 'backgroundIntensity', 'stoneStrength'] as const;
  for (const key of measures) {
    const from = start.stage![key], to = finish.stage![key];expect(Math.abs(to - from)).toBeGreaterThan(.005);
    const fractions = intermediate.map((s) => (s.stage[key] - from) / (to - from));
    for (let i = 0; i < fractions.length; i++) { expect(Math.abs(fractions[i] - intermediate[i].e), `${key}: actual stage change follows actual geometry expansion`).toBeLessThan(.06); if (i) expect(fractions[i]).toBeGreaterThanOrEqual(fractions[i - 1] - .002); }
  }
  for (const s of samples) expect(s.stage.environmentIntensity).toBeCloseTo(start.stage!.environmentIntensity, 5);
  await info.attach('stage-normal-transition-readback', { body: JSON.stringify({ start, finish, samples }, null, 2), contentType: 'application/json' });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
  await expect.poll(async () => (await snapshot(page, id)).e, { timeout: 1500 }).toBeLessThan(.015);
  const reduced = await snapshot(page, id);
  for (const key of measures) expect(reduced.stage![key]).toBeCloseTo(start.stage![key], 3);
  await capture(page, info, 'stage-reduced-assembled', [id]);
});

test('stage WebKit loads new panorama, mip-biased stone and area lights with recipe controls', async ({ page }, info) => {
  const id = 'negroni-express';
  await page.goto(`/?drink=${id}&expand=0`);await waitLive(page, [id]);
  const assembled = await snapshot(page, id);await capture(page, info, 'stage-webkit-assembled', [id]);
  await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();await waitExpansion(page, [id], 1);await verifyExpanded(page, id);
  await capture(page, info, 'stage-webkit-expanded', [id]);
  await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();await waitExpansion(page, [id], 0);
  expect(positionError(assembled, await snapshot(page, id))).toBeLessThan(.002);
});
