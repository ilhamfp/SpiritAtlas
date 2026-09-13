import { expect, test } from '@playwright/test';
import { angularStep, cameraPositionError, drinkIds, expectNoPageOverflow, observedAzimuth, positionError, recordState, snapshot, viewer, waitExpansion, waitLive } from './helpers';

test('venue selection, exact deep links, and browser back preserve the chosen drink', async ({ page }) => {
  await page.goto('/?bar=bar-somma');
  const featured = page.getByRole('region', { name: 'Featured bars' });
  await expect(featured.getByRole('button', { name: /Bar Somma Negroni Express/ })).toHaveAttribute('aria-pressed', 'true');
  const somma = featured.locator('article').filter({ hasText: 'Bar Somma' });
  await somma.getByRole('button', { name: 'Explore drink' }).click();
  await expect(page).toHaveURL(/drink=negroni-express/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Negroni Express');
  await page.getByRole('button', { name: 'View Ichigo Negroni', exact: true }).click();
  await expect(page).toHaveURL(/drink=ichigo-negroni/);
  await page.goBack();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Negroni Express');
  await page.getByRole('button', { name: 'Back to the atlas', exact: true }).click();
  await expect(featured).toBeVisible();
  await expect(featured.getByRole('button', { name: /Bar Somma Negroni Express/ })).toHaveAttribute('aria-pressed', 'true');
});

test('shared New Bahru marker exposes both venues without moving a location', async ({ page }, testInfo) => {
  const mapFailures: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400 && /maplibre.*worker|tiles\.openfreemap\.org/.test(response.url())) mapFailures.push(`${response.status()} ${response.url()}`);
  });
  await page.goto('/');
  const marker = page.getByRole('button', { name: 'New Bahru, two bars: Bar Bon Funk and Bar Somma', exact: true });
  await expect(marker).toBeVisible();
  await expect(page.getByRole('button', { name: 'Select MOGA on Hill Street', exact: true })).toBeVisible();
  await marker.click();
  const picker = page.locator('[aria-label="Venues at New Bahru"]');
  await expect(picker).toBeVisible();
  await expect(picker.getByRole('button', { name: /Bar Bon Funk/ })).toContainText('#02-01');
  await expect(picker.getByRole('button', { name: /Bar Somma/ })).toContainText('#04-02A');
  await picker.getByRole('button', { name: /Bar Somma/ }).click();
  await expect(page).toHaveURL(/bar=bar-somma/);
  await expect(page.locator('.map-preview')).toContainText('Negroni Express');
  await expect(page.getByRole('link', { name: 'OpenStreetMap', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'OpenFreeMap', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: /OpenMapTiles/ })).toBeVisible();
  await expect(page.locator('.map-loading')).toHaveCount(0);
  await expect(page.locator('.map-error')).toHaveCount(0);
  expect(mapFailures, 'Map worker and basemap requests succeed').toEqual([]);
  await testInfo.attach('verified-map', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});

test('keyboard and visible rotation controls change the real camera through a full orbit', async ({ page }, testInfo) => {
  const id = 'bbf-negroni';
  await page.goto(`/?drink=${id}`);
  await waitLive(page, [id]);
  const start = await snapshot(page, id);
  const stage = page.getByLabel('BBF Negroni interactive 3D viewer', { exact: true });
  await stage.focus();
  await stage.press('ArrowRight');
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth - start.camera.azimuth)).toBeGreaterThan(0.05);
  expect(cameraPositionError(start, await snapshot(page, id)), 'The actual Three camera moved').toBeGreaterThan(0.05);
  await stage.press('ArrowUp');
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.elevation - start.camera.elevation)).toBeGreaterThan(0.02);
  await stage.press('+');
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.zoom - start.camera.zoom)).toBeGreaterThan(0.01);
  await stage.press('Space');
  await waitExpansion(page, [id], 1);
  let previousAngle = observedAzimuth(await snapshot(page, id));
  let actualTravel = 0;
  for (let step = 0; step < 17; step++) {
    await page.getByRole('button', { name: 'Rotate right', exact: true }).click();
    await expect.poll(async () => angularStep(previousAngle, observedAzimuth(await snapshot(page, id)))).toBeGreaterThan(0.3);
    const nextAngle = observedAzimuth(await snapshot(page, id));
    actualTravel += angularStep(previousAngle, nextAngle);
    previousAngle = nextAngle;
  }
  expect(actualTravel, 'The observed camera completed a full horizontal orbit').toBeGreaterThan(Math.PI * 2);
  await recordState(page, testInfo, 'keyboard-full-orbit', [id]);
  await page.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth - start.camera.azimuth)).toBeLessThan(0.01);
});

test('dragging orbits without accidental expansion; double-click remains a shortcut', async ({ page }) => {
  const id = 'ichigo-negroni';
  await page.goto(`/?drink=${id}`);
  await waitLive(page, [id]);
  const before = await snapshot(page, id);
  const rect = await viewer(page, id).boundingBox();
  expect(rect).not.toBeNull();
  const x = rect!.x + rect!.width * 0.6;
  const y = rect!.y + rect!.height * 0.55;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x - 100, y + 30, { steps: 18 });
  await page.mouse.up();
  await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth - before.camera.azimuth)).toBeGreaterThan(0.1);
  expect(cameraPositionError(before, await snapshot(page, id))).toBeGreaterThan(0.05);
  expect((await snapshot(page, id)).e).toBeLessThan(0.015);
  await page.mouse.dblclick(x, y);
  await waitExpansion(page, [id], 1);
  await page.mouse.dblclick(x, y);
  await waitExpansion(page, [id], 0);
});

test('shareable comparison URL restores partial expansion and independent mode', async ({ page }) => {
  await page.goto('/?compare=bbf-negroni,negroni-express&expand=0.43&sync=0');
  await waitLive(page, ['bbf-negroni', 'negroni-express']);
  await waitExpansion(page, ['bbf-negroni', 'negroni-express'], 0.43);
  await expect(page.getByRole('slider', { name: 'Expansion', exact: true })).toHaveValue('0.43');
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  await page.reload();
  await waitLive(page, ['bbf-negroni', 'negroni-express']);
  await waitExpansion(page, ['bbf-negroni', 'negroni-express'], 0.43);
  const range = page.getByRole('slider', { name: 'Expansion', exact: true });
  await range.focus();
  await range.press('Home');
  await waitExpansion(page, ['bbf-negroni', 'negroni-express'], 0);
  await page.reload();
  await waitLive(page, ['bbf-negroni', 'negroni-express']);
  await expect(range).toHaveValue('0');
  await waitExpansion(page, ['bbf-negroni', 'negroni-express'], 0);
});

test('source details explain unknown quantities and avoid fabricated garnish identities', async ({ page }) => {
  await page.goto('/?drink=ichigo-negroni');
  await page.getByText('About this filmed version', { exact: false }).click();
  await expect(page.getByText('Recipe quantities are unknown.', { exact: false })).toBeVisible();
  await expect(page.getByText('Flower species and red garnish composition', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Garnish Yellow flower/ }).click();
  await expect(page.getByText('A densely petalled yellow flower rests above a round red garnish.', { exact: false })).toBeVisible();
  await page.getByText('Milk clarification', { exact: true }).click();
  await expect(page.getByText('Milk is used in the clarification process.', { exact: false })).toBeVisible();
});

for (const width of [390, 768, 1440]) {
  test(`responsive ${width}px: discovery, showcase and comparison retain controls without page overflow`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/?webgl=off');
    await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.goto('/?drink=bbf-negroni&webgl=off');
    await expect(page.getByRole('button', { name: 'Explore ingredients', exact: true })).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Expansion', exact: true })).toBeVisible();
    await expectNoPageOverflow(page);
    await page.goto('/?compare=bbf-negroni,ichigo-negroni,negroni-express&webgl=off');
    await expect(page.getByRole('switch')).toBeVisible();
    await expect(page.getByRole('slider', { name: 'Expansion', exact: true })).toBeVisible();
    await expectNoPageOverflow(page);
    const comparison = page.locator('.comparison-scroll');
    if (width < 900) {
      expect(await comparison.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
      await comparison.evaluate((element) => { element.scrollLeft = element.scrollWidth; });
      await expect(page.getByRole('button', { name: 'Negroni Express', exact: true })).toBeInViewport();
    }
    await testInfo.attach(`comparison-${width}px`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
}
