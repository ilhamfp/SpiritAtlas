import { expect, test, type Locator } from '@playwright/test';
import { cameraPositionError, expectNoPageOverflow, snapshot, waitLive } from './helpers';

async function targetSize(control: Locator) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width, 'Touch target width').toBeGreaterThanOrEqual(43.9);
  expect(box!.height, 'Touch target height').toBeGreaterThanOrEqual(43.9);
}

test('ingredient disclosures toggle with click and Enter independently of hover and focus', async ({ page }) => {
  await page.goto('/?drink=ichigo-negroni&webgl=off');
  const row = page.getByRole('button', { name: /Garnish Yellow flower/ });
  const text = page.locator('#ingredient-ichigo-negroni-garnish');
  await row.hover();
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await expect(text).toBeHidden();
  await row.focus();
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await row.click();
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  await expect(text).toBeVisible();
  await row.click();
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await expect(text).toBeHidden();
  await row.press('Enter');
  await expect(row).toHaveAttribute('aria-expanded', 'true');
  await expect(text).toBeVisible();
  await row.press('Enter');
  await expect(row).toHaveAttribute('aria-expanded', 'false');
  await expect(text).toBeHidden();
});

test('independent local reset restores only its own real camera', async ({ page }) => {
  await page.goto('/?compare=bbf-negroni,ichigo-negroni&sync=0');
  await waitLive(page, ['bbf-negroni', 'ichigo-negroni']);
  const start = await snapshot(page, 'bbf-negroni');
  const bbf = page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
  const ichigo = page.getByRole('region', { name: 'Compare Ichigo Negroni', exact: true });
  await bbf.getByRole('button', { name: 'Rotate right', exact: true }).click();
  await ichigo.getByRole('button', { name: 'Rotate left', exact: true }).click();
  await ichigo.getByRole('button', { name: 'View from higher angle', exact: true }).click();
  await expect.poll(async () => cameraPositionError(start, await snapshot(page, 'bbf-negroni'))).toBeGreaterThan(0.1);
  await expect.poll(async () => (await snapshot(page, 'ichigo-negroni')).camera.elevation).toBeGreaterThan(0.25);
  const untouched = await snapshot(page, 'ichigo-negroni');
  await bbf.getByRole('button', { name: 'Reset view', exact: true }).click();
  await expect.poll(async () => cameraPositionError(start, await snapshot(page, 'bbf-negroni'))).toBeLessThan(0.01);
  expect(cameraPositionError(untouched, await snapshot(page, 'ichigo-negroni'))).toBeLessThan(0.01);
  await expect(page.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
});

for (const width of [390, 768]) {
  test(`selection tray ${width}px keeps names and individual removals usable`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
    await page.goto('/?webgl=off');
    const bars = page.getByRole('region', { name: 'Featured bars' });
    for (const name of ['BBF Negroni', 'Ichigo Negroni', 'Negroni Express']) {
      await bars.getByRole('button', { name: `Add ${name} to comparison`, exact: true }).click();
    }
    const tray = page.getByRole('complementary', { name: 'Comparison selection' });
    for (const name of ['BBF Negroni', 'Ichigo Negroni', 'Negroni Express']) {
      const remove = tray.getByRole('button', { name: `Remove ${name} from selection`, exact: true });
      await expect(remove).toContainText(name);
      await expect(remove).toBeInViewport();
      await targetSize(remove);
    }
    await expectNoPageOverflow(page);
    await testInfo.attach(`named-selection-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
    await tray.getByRole('button', { name: 'Remove Ichigo Negroni from selection', exact: true }).click();
    await expect(tray).toContainText('2 of 3 drinks');
    await expect(tray.getByRole('button', { name: 'Remove Ichigo Negroni from selection', exact: true })).toHaveCount(0);
    await expect(tray.getByRole('button', { name: 'Compare', exact: true })).toBeEnabled();
  });

  test(`comparison ${width}px preserves active identity and sync while scrolling with touch-sized controls`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1024 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/?compare=bbf-negroni,ichigo-negroni,negroni-express&webgl=off');
    const identity = page.locator('.compare-identity-strip');
    const select = page.getByRole('combobox', { name: 'Drink in view', exact: true });
    await page.evaluate(() => window.scrollTo(0, 1000));
    await expect(identity).toBeInViewport();
    await expect(page.getByRole('switch')).toBeInViewport();
    await targetSize(select);
    await targetSize(page.getByRole('switch'));
    await targetSize(page.getByRole('slider', { name: 'Expansion', exact: true }));
    await select.selectOption('negroni-express');
    await expect(select).toHaveValue('negroni-express');
    await expect(identity).toContainText('Ancho Verde. Rice syrup. Shishito.');
    const scroller = page.locator('.comparison-scroll');
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(50);
    await expect(select).toHaveValue('negroni-express');
    await expect(identity).toBeInViewport();
    await expect(page.getByRole('switch')).toBeInViewport();
    await testInfo.attach(`sticky-comparison-${width}`, { body: await page.screenshot(), contentType: 'image/png' });
    // A real horizontal wheel gesture leaves the explicitly selected column
    // mode; a scripted scroll alone intentionally retains selector intent.
    await page.mouse.move(width * 0.5, 600);
    await page.mouse.wheel(-1500, 0);
    await expect.poll(() => scroller.evaluate((element) => element.scrollLeft)).toBeLessThan(1);
    await expect(select).toHaveValue('bbf-negroni');
    await expect(identity).toContainText('Oak-aged. Deep red. Orange aroma.');
    await expectNoPageOverflow(page);
    const bbf = page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
    for (const name of ['Rotate left', 'Rotate right', 'View from higher angle', 'View from lower angle', 'Zoom in', 'Zoom out', 'Reset view', 'Remove BBF Negroni from comparison']) {
      await targetSize(bbf.getByRole('button', { name, exact: true }));
    }
    await targetSize(identity.getByRole('button', { name: 'Remove current drink, BBF Negroni', exact: true }));
    await identity.getByRole('button', { name: 'Remove current drink, BBF Negroni', exact: true }).click();
    await expect(page).toHaveURL(/compare=ichigo-negroni%2Cnegroni-express/);
    await expect(select.locator('option')).toHaveCount(2);
  });
}

test('primary default and hover text and faint content meet measured normal-text contrast', async ({ page }, testInfo) => {
  await page.goto('/?drink=bbf-negroni&webgl=off');
  const primary = page.getByRole('button', { name: 'Explore ingredients', exact: true });
  async function colors(control: Locator) {
    return control.evaluate((element) => {
      const style = getComputedStyle(element);
      return { color: style.color, background: style.backgroundColor };
    });
  }
  function ratio(pair: { color: string; background: string }) {
    const luminance = (rgb: string) => {
      const channels = rgb.match(/[\d.]+/g)!.slice(0, 3).map(Number).map((v) => v / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
    };
    const a = luminance(pair.color); const b = luminance(pair.background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }
  const normal = await colors(primary);
  expect(ratio(normal)).toBeGreaterThanOrEqual(4.5);
  await primary.hover();
  await expect.poll(async () => (await colors(primary)).background).toBe('rgb(191, 72, 50)');
  await expect.poll(async () => ratio(await colors(primary))).toBeGreaterThanOrEqual(4.5);
  const hover = await colors(primary);
  const faint = await page.locator('.range-extents').first().evaluate((element) => ({ color: getComputedStyle(element).color, background: getComputedStyle(document.documentElement).backgroundColor }));
  expect(ratio(faint)).toBeGreaterThanOrEqual(4.5);
  await testInfo.attach('computed-contrast', { body: JSON.stringify({ normal: { ...normal, ratio: ratio(normal) }, hover: { ...hover, ratio: ratio(hover) }, faint: { ...faint, ratio: ratio(faint) } }, null, 2), contentType: 'application/json' });
});
