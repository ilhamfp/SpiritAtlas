# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> featured live drink expands and collapses real parts and supports visible, keyboard and pointer orbit
- Location: tests/brand-journeys.spec.ts:192:1

# Error details

```
Error: expect(locator).toHaveAttribute(expected) failed

Locator: getByTestId('viewer-bbf-negroni')
Expected: "true"
Timeout: 45000ms
Error: element(s) not found

Call log:
  - Expect "toHaveAttribute" getByTestId('viewer-bbf-negroni') with timeout 45000ms
  - waiting for getByTestId('viewer-bbf-negroni')

```

```yaml
- link "Skip to content":
  - /url: "#landing-content"
- banner:
  - link "SpiritAtlas home":
    - /url: /
    - text: SpiritAtlas.
  - navigation "Main navigation":
    - link "The bars":
      - /url: "#the-bars"
    - link "Inside the drink":
      - /url: "#inside"
    - link "Open atlas":
      - /url: /?bar=bar-bon-funk
- main:
  - region "Singapore’s cocktails. Inside out.":
    - heading "Singapore’s cocktails. Inside out." [level=1]
    - paragraph: Explore the bars. Unfold the ingredients. Discover a different side of every drink.
    - link "Explore the atlas":
      - /url: /?bar=bar-bon-funk
    - region "Classic Negroni experience":
      - group "Negroni view":
        - button "Cinematic" [pressed]
        - button "Explore 3D"
      - img "Classic Negroni with ruby red liquid, clear ice, and a fresh orange slice in a rocks glass"
      - text: "THE ORIGINAL / 1 : 1 : 1"
      - heading "Classic Negroni" [level=2]
      - paragraph: Gin · Campari · sweet vermouth
      - button "Look inside"
      - button "Play animation"
      - slider "Deconstruction progress": "0"
      - 'button "Playback speed: 1 times. Change speed"': 1×
      - button "Reset Negroni"
      - text: Unfold the ingredients. Take your time.
    - text: SINGAPORE, THROUGH A DIFFERENT GLASS
    - link "Meet the three bars":
      - /url: "#the-bars"
  - region "Three bars. Distinctly their own.":
    - heading "Three bars. Distinctly their own." [level=2]
    - paragraph: One city. Three interpretations of the Negroni. Start with a familiar drink. See where it takes you.
    - article:
      - 'link "Explore Bar Bon Funk: BBF Negroni"':
        - /url: /?drink=bbf-negroni
        - text: 01 River Valley
        - img "Deep red to brown-red liquid. Straight rocks glass with substantial clear base. Large clear ice and rounded orange garnish"
        - heading "Bar Bon Funk" [level=3]
        - text: BBF Negroni
      - paragraph: Time, cold and orange aroma. An oak-aged take at New Bahru.
      - link "Explore the drink":
        - /url: /?drink=bbf-negroni
    - article:
      - 'link "Explore MOGA: Ichigo Negroni"':
        - /url: /?drink=ichigo-negroni
        - text: 02 City Hall
        - img "Transparent golden-amber liquid. Cylindrical rocks glass and large clear ice. Densely petalled yellow flower over a round red garnish"
        - heading "MOGA" [level=3]
        - text: Ichigo Negroni
      - paragraph: Strawberry meets milk clarification in the Ichigo Negroni.
      - link "Explore the drink":
        - /url: /?drink=ichigo-negroni
    - article:
      - 'link "Explore Bar Somma: Negroni Express"':
        - /url: /?drink=negroni-express
        - text: 03 River Valley
        - img "Red-orange liquid in a low tumbler with curved lower profile. Prominent clear ice block. Curved wrinkled green shishito with its stem"
        - heading "Bar Somma" [level=3]
        - text: Negroni Express
      - paragraph: A red-orange Negroni with a distinctive pickled shishito garnish.
      - link "Explore the drink":
        - /url: /?drink=negroni-express
  - region "There’s more in the glass.":
    - heading "There’s more in the glass." [level=2]
    - paragraph: A garnish. A spirit. An unexpected detail. Open up a cocktail and explore the ingredients that make it its own.
    - link "Explore ingredients":
      - /url: /?drink=ichigo-negroni&expand=1
    - text: Ingredients shown separately to help you explore. Estimates are marked; shapes don’t indicate amounts. A CLOSER LOOK / ICHIGO NEGRONI 01
    - heading "The finishing touch" [level=3]
    - paragraph: A yellow flower, a red garnish. The first details you see.
    - text: "02"
    - heading "A different clarity" [level=3]
    - paragraph: Strawberry and milk clarification shape MOGA’s interpretation.
    - text: "03"
    - heading "The foundation" [level=3]
    - paragraph: Explore the spirit, bitter and vermouth categories behind the drink.
    - link "Look inside the Ichigo Negroni":
      - /url: /?drink=ichigo-negroni&expand=1
  - region "Same starting point. A different point of view.":
    - text: BAR BON FUNK / MOGA / BAR SOMMA
    - heading "Same starting point. A different point of view." [level=2]
    - paragraph: Put the three Negronis side by side. Rotate together. Open them up. Notice what changes.
    - link "Compare the three":
      - /url: /?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=1
- contentinfo:
  - link "SpiritAtlas.":
    - /url: /
  - paragraph: Singapore’s cocktails. Inside out.
  - link "Back to Singapore":
    - /url: /?bar=bar-bon-funk
```

# Test source

```ts
  1  | import { expect, type Page, type TestInfo } from '@playwright/test';
  2  |
  3  | export const drinkIds = ['bbf-negroni', 'ichigo-negroni', 'negroni-express'] as const;
  4  | export type DrinkId = typeof drinkIds[number];
  5  | export type ViewerSnapshot = {
  6  |   e: number;
  7  |   parts: { id: string; position: [number, number, number]; category?: string; role?: string; visible?: boolean; scale?: [number, number, number]; normalMap?: { width: number; height: number } | null }[];
  8  |   camera: { azimuth: number; elevation: number; zoom: number; target: [number, number, number]; position: [number, number, number]; fov: number };
  9  |   frameTimes: number[];
  10 |   ready: boolean;
  11 |   stage?: { backgroundBlurriness: number; backgroundIntensity: number; environmentIntensity: number; stoneStrength: number; stoneMipBias: number };
  12 | };
  13 |
  14 | export const viewer = (page: Page, id: DrinkId) => page.getByTestId(`viewer-${id}`);
  15 |
  16 | export async function snapshot(page: Page, id: DrinkId): Promise<ViewerSnapshot> {
  17 |   return page.evaluate((drinkId) => {
  18 |     const state = (window as unknown as { __atlasViewers?: Record<string, ViewerSnapshot> }).__atlasViewers?.[drinkId];
  19 |     if (!state) throw new Error(`Live viewer snapshot missing for ${drinkId}`);
  20 |     return JSON.parse(JSON.stringify(state)) as ViewerSnapshot;
  21 |   }, id);
  22 | }
  23 |
  24 | export async function waitLive(page: Page, ids: readonly DrinkId[]) {
  25 |   for (const id of ids) {
> 26 |     await expect(viewer(page, id)).toHaveAttribute('data-live', 'true', { timeout: 45_000 });
     |                                    ^ Error: expect(locator).toHaveAttribute(expected) failed
  27 |     await expect.poll(() => page.evaluate((drinkId) => Boolean((window as unknown as { __atlasViewers?: Record<string, ViewerSnapshot> }).__atlasViewers?.[drinkId]?.ready), id)).toBe(true);
  28 |     await expect(viewer(page, id).locator('canvas')).toBeVisible();
  29 |   }
  30 | }
  31 |
  32 | export async function waitExpansion(page: Page, ids: readonly DrinkId[], target: number) {
  33 |   await expect.poll(async () => {
  34 |     const values = await Promise.all(ids.map((id) => snapshot(page, id)));
  35 |     return Math.max(...values.map((state) => Math.abs(state.e - target)));
  36 |   }, { message: `Actual rendered expansion reaches ${target}` }).toBeLessThan(0.015);
  37 | }
  38 |
  39 | export function positionError(a: ViewerSnapshot, b: ViewerSnapshot) {
  40 |   if (a.parts.length !== b.parts.length) return Infinity;
  41 |   return Math.max(0, ...a.parts.map((part) => {
  42 |     const counterpart = b.parts.find((other) => other.id === part.id);
  43 |     return counterpart ? Math.hypot(...part.position.map((value, axis) => value - counterpart.position[axis])) : Infinity;
  44 |   }));
  45 | }
  46 |
  47 | export function cameraPositionError(a: ViewerSnapshot, b: ViewerSnapshot) {
  48 |   return Math.hypot(...a.camera.position.map((value, axis) => value - b.camera.position[axis]));
  49 | }
  50 |
  51 | export function observedAzimuth(state: ViewerSnapshot) {
  52 |   return Math.atan2(state.camera.position[0] - state.camera.target[0], state.camera.position[2] - state.camera.target[2]);
  53 | }
  54 |
  55 | export const angularStep = (from: number, to: number) => Math.atan2(Math.sin(to - from), Math.cos(to - from));
  56 |
  57 | export async function recordState(page: Page, testInfo: TestInfo, name: string, ids: readonly DrinkId[]) {
  58 |   const states = Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await snapshot(page, id)])));
  59 |   await testInfo.attach(`${name}-rendered-state`, { body: JSON.stringify(states, null, 2), contentType: 'application/json' });
  60 |   const environment = await page.evaluate(() => ({
  61 |     userAgent: navigator.userAgent,
  62 |     devicePixelRatio: window.devicePixelRatio,
  63 |     viewport: { width: window.innerWidth, height: window.innerHeight },
  64 |     reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
  65 |     canvases: Array.from(document.querySelectorAll<HTMLCanvasElement>('[data-live="true"] canvas')).map((canvas) => {
  66 |       const gl = canvas.getContext('webgl2');
  67 |       const info = gl?.getExtension('WEBGL_debug_renderer_info');
  68 |       return { width: canvas.width, height: canvas.height, renderer: gl && info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : null };
  69 |     }),
  70 |   }));
  71 |   await testInfo.attach(`${name}-browser-environment`, { body: JSON.stringify(environment, null, 2), contentType: 'application/json' });
  72 |   await testInfo.attach(`${name}-live-browser`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  73 | }
  74 |
  75 | export async function expectNoPageOverflow(page: Page) {
  76 |   const widths = await page.evaluate(() => ({
  77 |     viewport: document.documentElement.clientWidth,
  78 |     document: document.documentElement.scrollWidth,
  79 |     body: document.body.scrollWidth,
  80 |   }));
  81 |   expect(widths.document, JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport + 1);
  82 |   expect(widths.body, JSON.stringify(widths)).toBeLessThanOrEqual(widths.viewport + 1);
  83 | }
  84 |
```
