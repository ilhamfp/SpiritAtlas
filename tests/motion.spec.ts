import { expect, test } from '@playwright/test';
import { cameraPositionError, drinkIds, positionError, recordState, snapshot, waitExpansion, waitLive } from './helpers';
import { categories, drinkById } from '../src/data/drinks';

test.use({ video: 'on' });

test.describe('live recipe motion evidence', () => {
for (const id of drinkIds) {
  test(`${id}: expansion moves real components and restores their original positions`, async ({ page }, testInfo) => {
    // This collects two full-page PNGs and video alongside many transforms;
    // elapsed test duration is not a rendering-performance acceptance metric.
    test.setTimeout(120_000);
    await page.goto(`/?drink=${id}`);
    await waitLive(page, [id]);
    await waitExpansion(page, [id], 0);
    const assembled = await snapshot(page, id);
    expect(assembled.parts.length).toBeGreaterThan(2);
    const recipeRows = drinkById[id].ingredients.filter((ingredient) => ingredient.role === 'representative' || ingredient.evidence === 'unverified').map((ingredient) => `recipe_${ingredient.category}`).sort();
    const unknownCategories = drinkById[id].ingredients.filter((ingredient) => ingredient.evidence === 'unverified').map((ingredient) => ingredient.category);
    expect(assembled.parts.map((part) => part.id).filter((partId) => partId.startsWith('recipe_')).sort(), 'Confirmed and Unknown recipe representations both have actual mesh identities').toEqual(recipeRows);
    for (const category of unknownCategories) {
      const part = assembled.parts.find((candidate) => candidate.id === `recipe_${category}`)!;
      expect(part.visible, 'Unknown placeholder is absent from the assembled serving').toBe(false);
    }
    await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
    await waitExpansion(page, [id], 1);
    const expanded = await snapshot(page, id);
    expect(positionError(assembled, expanded), 'Real geometry moved into recipe view').toBeGreaterThan(0.02);
    const labelRail = page.getByTestId(`viewer-${id}`).locator('.ingredient-labels');
    await expect(labelRail.locator('button[data-category]'), 'Expanded viewer has one label for every category').toHaveCount(categories.length);
    for (const category of categories) {
      const label = labelRail.locator(`button[data-category="${category.id}"]`);
      await expect.poll(() => label.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.95);
      expect(expanded.parts.some((part) => part.category === category.id && part.visible), `${category.label}: at least one actual visible 3D part`).toBe(true);
    }
    for (const category of unknownCategories) {
      const part = expanded.parts.find((candidate) => candidate.id === `recipe_${category}`)!;
      expect(part.visible).toBe(true);
      expect(part.role).toBe('recipe');
      expect(part.category).toBe(category);
      expect(part.scale).toHaveLength(3);
      expect(Math.min(...part.scale!), 'Unknown placeholder is rendered at full expansion scale').toBeGreaterThan(0.95);
      const label = labelRail.locator(`button[data-category="${category}"]`);
      await expect(label).toContainText('Unknown');
      await expect(label).toContainText(new RegExp(category, 'i'));
      await expect(label).toHaveAttribute('data-evidence', 'unverified');
    }
    await expect(page.getByText('Recipe view · shapes do not show amounts', { exact: true })).toBeVisible();
    await expect(page.locator('.recipe-note')).toContainText('Unknown objects mark unspecified recipe categories. Shapes and sizes do not indicate measured amounts.');
    await recordState(page, testInfo, 'fully-expanded', [id]);
    await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
    await waitExpansion(page, [id], 0);
    expect(positionError(assembled, await snapshot(page, id)), 'Reassembly restores authored pose').toBeLessThan(0.002);
    for (const category of unknownCategories) expect((await snapshot(page, id)).parts.find((part) => part.id === `recipe_${category}`)?.visible, 'Reassembly removes the explanatory Unknown objects').toBe(false);

    await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
    await page.waitForTimeout(150);
    await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
    await waitExpansion(page, [id], 0);
    expect(positionError(assembled, await snapshot(page, id)), 'Mid-animation reversal has no accumulated displacement').toBeLessThan(0.002);

    const range = page.getByRole('slider', { name: 'Expansion', exact: true });
    await range.focus();
    await range.press('End');
    await range.press('ArrowLeft');
    await range.press('ArrowLeft');
    const scrubbed = Number(await range.inputValue());
    expect(scrubbed).toBeGreaterThan(0);
    expect(scrubbed).toBeLessThan(1);
    await waitExpansion(page, [id], scrubbed);
    await range.press('Home');
    await waitExpansion(page, [id], 0);
    expect(positionError(assembled, await snapshot(page, id))).toBeLessThan(0.002);
    await recordState(page, testInfo, 'restored-assembled', [id]);
  });
}
});

test.describe('comparison motion evidence', () => {
test('two- and three-drink comparison shares expansion, supports independent orbit, and restores alignment', async ({ page }, testInfo) => {
  await page.goto('/?compare=bbf-negroni,ichigo-negroni');
  await waitLive(page, drinkIds.slice(0, 2));
  await waitExpansion(page, drinkIds.slice(0, 2), 1);
  const sync = page.getByRole('switch');
  await expect(sync).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Add Bar Somma', exact: true }).click();
  await waitLive(page, drinkIds);
  await waitExpansion(page, drinkIds, 1);
  const bbf = page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
  await bbf.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await expect.poll(async () => {
    const states = await Promise.all(drinkIds.map((id) => snapshot(page, id)));
    return Math.max(...states.map((state) => state.camera.azimuth)) - Math.min(...states.map((state) => state.camera.azimuth));
  }).toBeLessThan(0.01);
  expect((await snapshot(page, 'bbf-negroni')).camera.azimuth).toBeGreaterThan(0.1);
  for (const id of drinkIds.slice(1)) {
    expect(cameraPositionError(await snapshot(page, 'bbf-negroni'), await snapshot(page, id)), 'Synchronized real cameras share framing').toBeLessThan(0.02);
  }
  await sync.click();
  await expect(sync).toHaveAttribute('aria-checked', 'false');
  const untouched = await snapshot(page, 'ichigo-negroni');
  await bbf.getByRole('button', { name: 'Rotate left', exact: true }).click();
  await bbf.getByRole('button', { name: 'View from higher angle', exact: true }).click();
  await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - untouched.camera.azimuth)).toBeGreaterThan(0.1);
  expect((await snapshot(page, 'ichigo-negroni')).camera.azimuth).toBeCloseTo(untouched.camera.azimuth, 3);
  expect((await snapshot(page, 'ichigo-negroni')).camera.elevation).toBeCloseTo(untouched.camera.elevation, 3);
  expect(cameraPositionError(untouched, await snapshot(page, 'ichigo-negroni')), 'Independent inspection does not move another camera').toBeLessThan(0.01);
  expect(cameraPositionError(untouched, await snapshot(page, 'bbf-negroni'))).toBeGreaterThan(0.2);
  await page.getByRole('button', { name: 'Reassemble all', exact: true }).click();
  await waitExpansion(page, drinkIds, 0);
  await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  await waitExpansion(page, drinkIds, 1);
  await page.getByRole('button', { name: 'Reset alignment', exact: true }).click();
  for (const id of drinkIds) {
    await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth)).toBeLessThan(0.01);
  }
  await bbf.locator('.comparison-ingredients').getByRole('button', { name: /Base spirit Gin/ }).click();
  for (const name of ['BBF Negroni', 'Ichigo Negroni', 'Negroni Express']) {
    await expect(page.getByRole('region', { name: `Compare ${name}`, exact: true }).locator('.comparison-ingredients').getByRole('button', { name: /Base spirit/ })).toHaveAttribute('aria-pressed', 'true');
  }
  const expansion = page.getByRole('slider', { name: 'Expansion', exact: true });
  await expansion.focus();
  await expansion.press('Home');
  for (let step = 0; step < 50; step++) await expansion.press('ArrowRight');
  await waitExpansion(page, drinkIds, 0.5);
  await recordState(page, testInfo, 'mid-expansion-comparison', drinkIds);
  await expansion.press('End');
  await waitExpansion(page, drinkIds, 1);
  await recordState(page, testInfo, 'three-drink-comparison', drinkIds);
  await page.getByRole('button', { name: 'Remove Negroni Express from comparison', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Compare Negroni Express', exact: true })).toHaveCount(0);
  await expect(page).toHaveURL(/compare=bbf-negroni%2Cichigo-negroni/);
});
});

test('phone 390px shows six readable recipe labels and selectable Unknown objects', async ({ page }, testInfo) => {
  const id = 'negroni-express';
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/?drink=${id}&expand=1`);
  const stage = page.getByTestId(`viewer-${id}`);
  // The visibility hook correctly pauses offscreen canvases: inspect this one
  // in the viewport before requiring a fresh rendered-state snapshot.
  await stage.scrollIntoViewIfNeeded();
  await waitLive(page, [id]);
  await waitExpansion(page, [id], 1);
  const labels = stage.locator('.ingredient-labels button[data-category]');
  await expect(labels).toHaveCount(6);
  for (const category of categories) {
    const exact = stage.locator(`.ingredient-labels button[data-category="${category.id}"]`);
    await expect.poll(() => exact.evaluate((element) => Number(getComputedStyle(element).opacity))).toBeGreaterThan(0.95);
  }
  const measured = await stage.evaluate((element) => {
    const viewer = element.getBoundingClientRect();
    const labels = [...element.querySelectorAll<HTMLElement>('.ingredient-labels button[data-category]')].map((label) => {
      const r = label.getBoundingClientRect();
      return { text: label.textContent, left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height, overflow: label.scrollWidth > label.clientWidth + 1 };
    });
    return { viewer: { left: viewer.left, right: viewer.right, top: viewer.top, bottom: viewer.bottom }, labels };
  });
  for (const label of measured.labels) {
    expect(label.overflow, `${label.text}: label text fits its width`).toBe(false);
    expect(label.left).toBeGreaterThanOrEqual(measured.viewer.left);
    expect(label.right).toBeLessThanOrEqual(measured.viewer.right);
    expect(label.top).toBeGreaterThanOrEqual(measured.viewer.top);
    expect(label.bottom).toBeLessThanOrEqual(measured.viewer.bottom);
  }
  const sorted = measured.labels.slice().sort((a, b) => a.top - b.top);
  for (let index = 1; index < sorted.length; index++) expect(sorted[index].top, `${sorted[index - 1].text} and ${sorted[index].text} do not overlap`).toBeGreaterThanOrEqual(sorted[index - 1].bottom);
  const unknown = stage.locator('.ingredient-labels button[data-category="spirit"]');
  await unknown.click();
  await expect(unknown).toHaveAttribute('aria-pressed', 'true');
  await expect(unknown).toContainText('Base spirit');
  await expect(unknown).toContainText('Unknown');
  await expect(page.locator('.ingredient-item.is-active')).toContainText('Base spirit');
  const state = await snapshot(page, id);
  for (const category of ['spirit', 'bitter', 'vermouth']) expect(state.parts.find((part) => part.id === `recipe_${category}`)?.visible).toBe(true);
  await testInfo.attach('phone-six-label-bounds', { body: JSON.stringify(measured, null, 2), contentType: 'application/json' });
  await testInfo.attach('phone-selected-unknown-live-browser', { body: await page.screenshot(), contentType: 'image/png' });
});
