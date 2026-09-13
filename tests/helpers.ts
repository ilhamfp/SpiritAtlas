import { expect, type Page, type TestInfo } from '@playwright/test';

export const drinkIds = ['bbf-negroni', 'ichigo-negroni', 'negroni-express'] as const;
export type DrinkId = typeof drinkIds[number];
export type ViewerSnapshot = {
  e: number;
  parts: { id: string; position: [number, number, number]; category?: string; role?: string; visible?: boolean; scale?: [number, number, number]; normalMap?: { width: number; height: number } | null }[];
  camera: { azimuth: number; elevation: number; zoom: number; target: [number, number, number]; position: [number, number, number]; fov: number };
  frameTimes: number[];
  ready: boolean;
  stage?: { backgroundBlurriness: number; backgroundIntensity: number; environmentIntensity: number; stoneStrength: number; stoneMipBias: number };
};

export const viewer = (page: Page, id: DrinkId) => page.getByTestId(`viewer-${id}`);

export async function snapshot(page: Page, id: DrinkId): Promise<ViewerSnapshot> {
  return page.evaluate((drinkId) => {
    const state = (window as unknown as { __atlasViewers?: Record<string, ViewerSnapshot> }).__atlasViewers?.[drinkId];
    if (!state) throw new Error(`Live viewer snapshot missing for ${drinkId}`);
    return JSON.parse(JSON.stringify(state)) as ViewerSnapshot;
  }, id);
}

export async function waitLive(page: Page, ids: readonly DrinkId[]) {
  for (const id of ids) {
    await expect(viewer(page, id)).toHaveAttribute('data-live', 'true', { timeout: 45_000 });
    await expect.poll(() => page.evaluate((drinkId) => Boolean((window as unknown as { __atlasViewers?: Record<string, ViewerSnapshot> }).__atlasViewers?.[drinkId]?.ready), id)).toBe(true);
    await expect(viewer(page, id).locator('canvas')).toBeVisible();
  }
}

export async function waitExpansion(page: Page, ids: readonly DrinkId[], target: number) {
  await expect.poll(async () => {
    const values = await Promise.all(ids.map((id) => snapshot(page, id)));
    return Math.max(...values.map((state) => Math.abs(state.e - target)));
  }, { message: `Actual rendered expansion reaches ${target}` }).toBeLessThan(0.015);
}

export function positionError(a: ViewerSnapshot, b: ViewerSnapshot) {
  if (a.parts.length !== b.parts.length) return Infinity;
  return Math.max(0, ...a.parts.map((part) => {
    const counterpart = b.parts.find((other) => other.id === part.id);
    return counterpart ? Math.hypot(...part.position.map((value, axis) => value - counterpart.position[axis])) : Infinity;
  }));
}

export function cameraPositionError(a: ViewerSnapshot, b: ViewerSnapshot) {
  return Math.hypot(...a.camera.position.map((value, axis) => value - b.camera.position[axis]));
}

export function observedAzimuth(state: ViewerSnapshot) {
  return Math.atan2(state.camera.position[0] - state.camera.target[0], state.camera.position[2] - state.camera.target[2]);
}

export const angularStep = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));

export async function recordState(page: Page, testInfo: TestInfo, name: string, ids: readonly DrinkId[]) {
  const states = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await snapshot(page, id)])));
  await testInfo.attach(`${name}-rendered-state`, { body: JSON.stringify(states, null, 2), contentType: 'application/json' });
  const environment = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    devicePixelRatio: window.devicePixelRatio,
    viewport: { width: window.innerWidth, height: window.innerHeight },
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    canvases: Array.from(document.querySelectorAll<HTMLCanvasElement>('[data-live="true"] canvas')).map((canvas) => {
      const gl = canvas.getContext('webgl2');
      const info = gl?.getExtension('WEBGL_debug_renderer_info');
      return { width: canvas.width, height: canvas.height, renderer: gl && info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null };
    }),
  }));
  await testInfo.attach(`${name}-browser-environment`, { body: JSON.stringify(environment, null, 2), contentType: 'application/json' });
  await testInfo.attach(`${name}-live-browser`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
}

export async function expectNoPageOverflow(page: Page) {
  const widths = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    document: document.documentElement.scrollWidth,
    body: document.body.scrollWidth,
  }));
  expect(widths.document, JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport + 1);
  expect(widths.body, JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport + 1);
}
