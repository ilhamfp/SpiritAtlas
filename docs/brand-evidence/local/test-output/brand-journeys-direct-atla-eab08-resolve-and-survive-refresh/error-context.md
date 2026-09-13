# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> direct atlas and all Negroni routes resolve and survive refresh
- Location: tests/brand-journeys.spec.ts:182:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('.atlas-page, .drink-page, .comparison-page')
Expected: visible
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" locator('.atlas-page, .drink-page, .comparison-page') with timeout 25000ms
  - waiting for locator('.atlas-page, .drink-page, .comparison-page')

```

```yaml
- link "Skip to the atlas":
  - /url: "#main-content"
- banner:
  - link "SpiritAtlas home":
    - /url: /
    - text: SpiritAtlas.
  - navigation "Main navigation":
    - button "The atlas"
    - button "Compare the drinks"
  - button "Copy a link to this view": Share
- navigation "Cocktail collections":
  - button "Negronis" [pressed]
  - button "Espresso Martinis"
  - button "Martinis"
  - button "Highballs"
- status
- main:
  - heading "Three bars. Three takes on the Negroni." [level=1]:
    - text: Three bars. Three takes on
    - emphasis: the Negroni.
  - paragraph: From oak-aged red to clarified amber. Explore the three filmed interpretations. Explore the bars and unfold their drinks.
  - region "Singapore venue map":
    - region "Navigable Singapore map showing New Bahru, MOGA. Equivalent venue choices are in the bar list."
    - 'button "New Bahru, two bars: Bar Bon Funk and Bar Somma" [pressed]':
      - text: "2"
      - strong: New Bahru
      - text: 2 bars
    - button "Select MOGA on Hill Street":
      - text: M
      - strong: MOGA
      - text: City Hall
    - button "Zoom in"
    - button "Zoom out"
    - group:
      - link "OpenFreeMap":
        - /url: https://openfreemap.org
      - link "© OpenMapTiles":
        - /url: https://www.openmaptiles.org/
      - text: Data from
      - link "OpenStreetMap":
        - /url: https://www.openstreetmap.org/copyright
    - text: Singapore 1°17′ N · 103°50′ E
    - button "Show all featured venues"
    - text: "New Bahru · Level 2 · #02-01"
    - heading "Bar Bon Funk" [level=3]
    - paragraph: BBF Negroni
    - button "Explore drink"
  - region "Featured bars":
    - heading "The three stops" [level=2]
    - text: Singapore
    - article:
      - 'button "Bar Bon Funk BBF Negroni New Bahru · Level 2 · #02-01" [pressed]':
        - strong: Bar Bon Funk
        - text: "BBF Negroni New Bahru · Level 2 · #02-01"
      - button "Explore drink"
      - button "Add BBF Negroni to comparison": Compare
    - article:
      - button "MOGA Ichigo Negroni Pullman Hill Street · Level 1":
        - strong: MOGA
        - text: Ichigo Negroni Pullman Hill Street · Level 1
      - button "Explore drink"
      - button "Add Ichigo Negroni to comparison": Compare
    - article:
      - 'button "Bar Somma Negroni Express New Bahru · Level 4 · #04-02A"':
        - strong: Bar Somma
        - text: "Negroni Express New Bahru · Level 4 · #04-02A"
      - button "Explore drink"
      - button "Add Negroni Express to comparison": Compare
    - button "Compare all three"
    - paragraph: Two of these bars share New Bahru. Same building, different stories. 12 drinks · 6 Singapore bars in the atlas.
```

# Test source

```ts
  85  | 
  86  | test('keyboard CTA enters atlas and each featured bar opens the correct working experience with return home', async ({ page }) => {
  87  |   await page.goto('/');
  88  |   const cta = page.getByRole('link', { name: 'Explore the atlas', exact: true });
  89  |   await cta.focus();
  90  |   await expect(cta).toBeFocused();
  91  |   expect(await cta.evaluate(element => getComputedStyle(element).outlineStyle)).toBe('solid');
  92  |   expect(parseFloat(await cta.evaluate(element => getComputedStyle(element).outlineWidth))).toBeGreaterThanOrEqual(2);
  93  |   await cta.press('Enter');
  94  |   await expect(page).toHaveURL(/bar=bar-bon-funk/);
  95  |   await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
  96  |   await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  97  |   await expect(headline(page)).toBeVisible();
  98  |   for (const entry of entries) {
  99  |     await page.getByRole('link', { name: `Explore ${entry.bar}: ${entry.name}`, exact: true }).click();
  100 |     await expect(page).toHaveURL(new RegExp(`drink=${entry.id}`));
  101 |     await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.name);
  102 |     await waitLive(page, [entry.id]);
  103 |     await page.reload();
  104 |     await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.name);
  105 |     await waitLive(page, [entry.id]);
  106 |     await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  107 |     await expect(headline(page)).toBeVisible();
  108 |   }
  109 | });
  110 | 
  111 | test('featured live drink expands and collapses real parts and supports visible, keyboard and pointer orbit', async ({ page }, testInfo) => {
  112 |   await page.goto('/');
  113 |   await waitLive(page, ['bbf-negroni']);
  114 |   const assembled = await snapshot(page, 'bbf-negroni');
  115 |   await page.getByRole('button', { name: 'Look inside', exact: true }).click();
  116 |   await waitExpansion(page, ['bbf-negroni'], 1);
  117 |   expect(positionError(assembled, await snapshot(page, 'bbf-negroni'))).toBeGreaterThan(.02);
  118 |   await page.screenshot({ path: `${evidenceDir}/hero-expanded-1440x1000.png` });
  119 |   await page.getByRole('button', { name: 'Bring it together', exact: true }).click();
  120 |   await waitExpansion(page, ['bbf-negroni'], 0);
  121 |   expect(positionError(assembled, await snapshot(page, 'bbf-negroni'))).toBeLessThan(.002);
  122 |   await page.getByRole('button', { name: 'Rotate featured cocktail right', exact: true }).click();
  123 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - assembled.camera.azimuth)).toBeGreaterThan(.2);
  124 |   const stage = viewer(page, 'bbf-negroni');
  125 |   const beforeKeyboard = await snapshot(page, 'bbf-negroni');
  126 |   await stage.focus();
  127 |   await stage.press('ArrowRight');
  128 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - beforeKeyboard.camera.azimuth)).toBeGreaterThan(.05);
  129 |   const beforePointer = await snapshot(page, 'bbf-negroni');
  130 |   const box = await stage.boundingBox();
  131 |   await page.mouse.move(box!.x + box!.width * .6, box!.y + box!.height * .5);
  132 |   await page.mouse.down();
  133 |   await page.mouse.move(box!.x + box!.width * .6 - 110, box!.y + box!.height * .5 + 10, { steps: 12 });
  134 |   await page.mouse.up();
  135 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - beforePointer.camera.azimuth)).toBeGreaterThan(.1);
  136 |   expect((await snapshot(page, 'bbf-negroni')).e).toBeLessThan(.015);
  137 |   await testInfo.attach('hero-rendered-motion', { body: JSON.stringify({ assembled, final: await snapshot(page, 'bbf-negroni') }), contentType: 'application/json' });
  138 | });
  139 | 
  140 | test('ingredient entry restores expansion and the comparison entry preserves synchronized and independent rotation', async ({ page }, testInfo) => {
  141 |   await page.goto('/');
  142 |   await page.getByRole('link', { name: 'Explore ingredients', exact: true }).click();
  143 |   await expect(page).toHaveURL(/drink=ichigo-negroni&expand=1/);
  144 |   await waitLive(page, ['ichigo-negroni']);
  145 |   await waitExpansion(page, ['ichigo-negroni'], 1);
  146 |   await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
  147 |   await waitExpansion(page, ['ichigo-negroni'], 0);
  148 |   await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  149 |   await page.getByRole('link', { name: 'Compare the three', exact: true }).click();
  150 |   await expect(page.locator('.comparison-column')).toHaveCount(3);
  151 |   await waitLive(page, drinkIds);
  152 |   await waitExpansion(page, drinkIds, 1);
  153 |   const bbf = page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
  154 |   const initial = await snapshot(page, 'bbf-negroni');
  155 |   await bbf.getByRole('button', { name: 'Rotate right', exact: true }).click();
  156 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - initial.camera.azimuth)).toBeGreaterThan(.2);
  157 |   await expect.poll(async () => {
  158 |     const states = await Promise.all(drinkIds.map(id => snapshot(page, id)));
  159 |     return Math.max(...states.map(state => state.camera.azimuth)) - Math.min(...states.map(state => state.camera.azimuth));
  160 |   }).toBeLessThan(.01);
  161 |   await page.getByRole('switch', { name: 'Rotation synchronized' }).click();
  162 |   const untouched = await snapshot(page, 'ichigo-negroni');
  163 |   await bbf.getByRole('button', { name: 'Rotate left', exact: true }).click();
  164 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - untouched.camera.azimuth)).toBeGreaterThan(.1);
  165 |   expect((await snapshot(page, 'ichigo-negroni')).camera.azimuth).toBeCloseTo(untouched.camera.azimuth, 3);
  166 |   await page.getByRole('button', { name: 'Reassemble all', exact: true }).click();
  167 |   await waitExpansion(page, drinkIds, 0);
  168 |   await page.reload();
  169 |   await waitLive(page, drinkIds);
  170 |   await waitExpansion(page, drinkIds, 0);
  171 |   await expect(page.getByRole('switch', { name: 'Rotate independently' })).toHaveAttribute('aria-checked', 'false');
  172 |   await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  173 |   await waitExpansion(page, drinkIds, 1);
  174 |   await page.getByRole('button', { name: 'Reset alignment', exact: true }).click();
  175 |   for (const id of drinkIds) await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth)).toBeLessThan(.01);
  176 |   await page.screenshot({ path: `${evidenceDir}/comparison-1440x1000.png` });
  177 |   await testInfo.attach('comparison-rendered-cameras', { body: JSON.stringify(await Promise.all(drinkIds.map(id => snapshot(page, id)))), contentType: 'application/json' });
  178 |   await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  179 |   await expect(headline(page)).toBeVisible();
  180 | });
  181 | 
  182 | test('direct atlas and all Negroni routes resolve and survive refresh', async ({ page }) => {
  183 |   for (const path of ['/?bar=bar-bon-funk', '/?bar=moga', '/?bar=bar-somma', '/?drink=bbf-negroni', '/?drink=ichigo-negroni&expand=1', '/?drink=negroni-express', '/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=.43&sync=0']) {
  184 |     await page.goto(path);
> 185 |     await expect(page.locator('.atlas-layout:visible, .drink-page, .comparison-page')).toBeVisible();
      |                                                                              ^ Error: expect(locator).toBeVisible() failed
  186 |     await page.reload();
  187 |     await expect(page.locator('.atlas-layout:visible, .drink-page, .comparison-page')).toBeVisible();
  188 |     await expectNoPageOverflow(page);
  189 |   }
  190 | });
  191 | 
  192 | test('WebGL unavailable offers informative fallback without blocking landing and ingredient entry', async ({ page }) => {
  193 |   await page.addInitScript(() => {
  194 |     const getContext = HTMLCanvasElement.prototype.getContext;
  195 |     HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
  196 |       if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
  197 |       return getContext.apply(this, [kind, ...args] as Parameters<typeof getContext>);
  198 |     } as typeof getContext;
  199 |   });
  200 |   await page.goto('/');
  201 |   await expect(headline(page)).toBeVisible();
  202 |   await expect(page.getByText('Interactive 3D is unavailable in this browser.', { exact: true })).toBeVisible();
  203 |   await page.getByRole('link', { name: 'Explore ingredients', exact: true }).click();
  204 |   await expect(page.getByText('Interactive 3D is unavailable in this browser.', { exact: true })).toBeVisible();
  205 |   await expect(page.getByRole('heading', { name: 'Inside the drink', exact: true })).toBeVisible();
  206 | });
  207 | 
  208 | test.describe('phone touch and reduced motion', () => {
  209 |   test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  210 |   test('touch orbit, visible ingredient controls and stable reduced-motion presentation', async ({ page }, testInfo) => {
  211 |     await page.goto('/');
  212 |     await waitLive(page, ['bbf-negroni']);
  213 |     expect(await page.locator('.sa-hero-copy').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  214 |     expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  215 |     await expectNoPageOverflow(page);
  216 |     const stage = viewer(page, 'bbf-negroni');
  217 |     await stage.scrollIntoViewIfNeeded();
  218 |     const before = await snapshot(page, 'bbf-negroni');
  219 |     const box = await stage.boundingBox();
  220 |     const x = box!.x + box!.width * .7;
  221 |     const y = box!.y + box!.height * .5;
  222 |     const client = await page.context().newCDPSession(page);
  223 |     await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  224 |     for (let i = 1; i <= 12; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 8, y }] });
  225 |     await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  226 |     await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - before.camera.azimuth)).toBeGreaterThan(.15);
  227 |     await page.getByRole('button', { name: 'Look inside', exact: true }).tap();
  228 |     await waitExpansion(page, ['bbf-negroni'], 1);
  229 |     await page.getByRole('button', { name: 'Bring it together', exact: true }).tap();
  230 |     await waitExpansion(page, ['bbf-negroni'], 0);
  231 |     const after = await snapshot(page, 'bbf-negroni');
  232 |     await page.waitForTimeout(350);
  233 |     expect(positionError(after, await snapshot(page, 'bbf-negroni'))).toBeLessThan(.002);
  234 |     await page.getByRole('link', { name: 'Explore the atlas', exact: true }).tap();
  235 |     await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
  236 |     await expectNoPageOverflow(page);
  237 |     await page.screenshot({ path: `${evidenceDir}/atlas-mobile-390x844.png` });
  238 |     await testInfo.attach('touch-reduced-motion', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
  239 |   });
  240 | });
  241 | 
```