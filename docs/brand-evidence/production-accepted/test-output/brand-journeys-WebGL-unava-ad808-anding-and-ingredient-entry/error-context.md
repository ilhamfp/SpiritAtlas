# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: brand-journeys.spec.ts >> WebGL unavailable offers informative fallback without blocking landing and ingredient entry
- Location: tests/brand-journeys.spec.ts:273:1

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Interactive 3D is unavailable in this browser.', { exact: true })
Expected: visible
Timeout: 25000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" getByText('Interactive 3D is unavailable in this browser.', { exact: true }) with timeout 25000ms
  - waiting for getByText('Interactive 3D is unavailable in this browser.', { exact: true })

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
  183 |     await waitLive(page, [entry.id]);
  184 |     await page.reload();
  185 |     await expect(page.getByRole('heading', { level: 1 })).toHaveText(entry.name);
  186 |     await waitLive(page, [entry.id]);
  187 |     await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  188 |     await expect(headline(page)).toBeVisible();
  189 |   }
  190 | });
  191 |
  192 | test('featured live drink expands and collapses real parts and supports visible, keyboard and pointer orbit', async ({ page }, testInfo) => {
  193 |   await page.goto('/');
  194 |   await waitLive(page, ['bbf-negroni']);
  195 |   const assembled = await snapshot(page, 'bbf-negroni');
  196 |   await page.getByRole('button', { name: 'Look inside', exact: true }).click();
  197 |   await waitExpansion(page, ['bbf-negroni'], 1);
  198 |   expect(positionError(assembled, await snapshot(page, 'bbf-negroni'))).toBeGreaterThan(.02);
  199 |   await page.screenshot({ path: `${evidenceDir}/hero-expanded-1440x1000.png` });
  200 |   await page.getByRole('button', { name: 'Bring it together', exact: true }).click();
  201 |   await waitExpansion(page, ['bbf-negroni'], 0);
  202 |   expect(positionError(assembled, await snapshot(page, 'bbf-negroni'))).toBeLessThan(.002);
  203 |   await page.getByRole('button', { name: 'Rotate featured cocktail right', exact: true }).click();
  204 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - assembled.camera.azimuth)).toBeGreaterThan(.2);
  205 |   const stage = viewer(page, 'bbf-negroni');
  206 |   const beforeKeyboard = await snapshot(page, 'bbf-negroni');
  207 |   await stage.focus();
  208 |   await stage.press('ArrowRight');
  209 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - beforeKeyboard.camera.azimuth)).toBeGreaterThan(.05);
  210 |   const beforePointer = await snapshot(page, 'bbf-negroni');
  211 |   const box = await stage.boundingBox();
  212 |   await page.mouse.move(box!.x + box!.width * .6, box!.y + box!.height * .5);
  213 |   await page.mouse.down();
  214 |   await page.mouse.move(box!.x + box!.width * .6 - 110, box!.y + box!.height * .5 + 10, { steps: 12 });
  215 |   await page.mouse.up();
  216 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - beforePointer.camera.azimuth)).toBeGreaterThan(.1);
  217 |   expect((await snapshot(page, 'bbf-negroni')).e).toBeLessThan(.015);
  218 |   await testInfo.attach('hero-rendered-motion', { body: JSON.stringify({ assembled, final: await snapshot(page, 'bbf-negroni') }), contentType: 'application/json' });
  219 | });
  220 |
  221 | test('ingredient entry restores expansion and the comparison entry preserves synchronized and independent rotation', async ({ page }, testInfo) => {
  222 |   await page.goto('/');
  223 |   await page.getByRole('link', { name: 'Explore ingredients', exact: true }).click();
  224 |   await expect(page).toHaveURL(/drink=ichigo-negroni&expand=1/);
  225 |   await waitLive(page, ['ichigo-negroni']);
  226 |   await waitExpansion(page, ['ichigo-negroni'], 1);
  227 |   await page.getByRole('button', { name: 'Reassemble drink', exact: true }).click();
  228 |   await waitExpansion(page, ['ichigo-negroni'], 0);
  229 |   await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  230 |   await page.getByRole('link', { name: 'Compare the three', exact: true }).click();
  231 |   await expect(page.locator('.comparison-column')).toHaveCount(3);
  232 |   await waitLive(page, drinkIds);
  233 |   await waitExpansion(page, drinkIds, 1);
  234 |   const bbf = page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
  235 |   const initial = await snapshot(page, 'bbf-negroni');
  236 |   await bbf.getByRole('button', { name: 'Rotate right', exact: true }).click();
  237 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - initial.camera.azimuth)).toBeGreaterThan(.2);
  238 |   await expect.poll(async () => {
  239 |     const states = await Promise.all(drinkIds.map(id => snapshot(page, id)));
  240 |     return Math.max(...states.map(state => state.camera.azimuth)) - Math.min(...states.map(state => state.camera.azimuth));
  241 |   }).toBeLessThan(.01);
  242 |   await page.getByRole('switch', { name: 'Rotation synchronized' }).click();
  243 |   const untouched = await snapshot(page, 'ichigo-negroni');
  244 |   await bbf.getByRole('button', { name: 'Rotate left', exact: true }).click();
  245 |   await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - untouched.camera.azimuth)).toBeGreaterThan(.1);
  246 |   expect((await snapshot(page, 'ichigo-negroni')).camera.azimuth).toBeCloseTo(untouched.camera.azimuth, 3);
  247 |   await page.getByRole('button', { name: 'Reassemble all', exact: true }).click();
  248 |   await waitExpansion(page, drinkIds, 0);
  249 |   await page.reload();
  250 |   await waitLive(page, drinkIds);
  251 |   await waitExpansion(page, drinkIds, 0);
  252 |   await expect(page.getByRole('switch', { name: 'Rotate independently' })).toHaveAttribute('aria-checked', 'false');
  253 |   await page.getByRole('button', { name: 'Expand all', exact: true }).click();
  254 |   await waitExpansion(page, drinkIds, 1);
  255 |   await page.getByRole('button', { name: 'Reset alignment', exact: true }).click();
  256 |   for (const id of drinkIds) await expect.poll(async () => Math.abs((await snapshot(page, id)).camera.azimuth)).toBeLessThan(.01);
  257 |   await page.screenshot({ path: `${evidenceDir}/comparison-1440x1000.png` });
  258 |   await testInfo.attach('comparison-rendered-cameras', { body: JSON.stringify(await Promise.all(drinkIds.map(id => snapshot(page, id)))), contentType: 'application/json' });
  259 |   await page.getByRole('link', { name: 'SpiritAtlas home', exact: true }).click();
  260 |   await expect(headline(page)).toBeVisible();
  261 | });
  262 |
  263 | test('direct atlas and all Negroni routes resolve and survive refresh', async ({ page }) => {
  264 |   for (const path of ['/?bar=bar-bon-funk', '/?bar=moga', '/?bar=bar-somma', '/?drink=bbf-negroni', '/?drink=ichigo-negroni&expand=1', '/?drink=negroni-express', '/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=.43&sync=0']) {
  265 |     await page.goto(path);
  266 |     await expect(page.locator('.atlas-layout:visible, .drink-page, .comparison-page')).toBeVisible();
  267 |     await page.reload();
  268 |     await expect(page.locator('.atlas-layout:visible, .drink-page, .comparison-page')).toBeVisible();
  269 |     await expectNoPageOverflow(page);
  270 |   }
  271 | });
  272 |
  273 | test('WebGL unavailable offers informative fallback without blocking landing and ingredient entry', async ({ page }) => {
  274 |   await page.addInitScript(() => {
  275 |     const getContext = HTMLCanvasElement.prototype.getContext;
  276 |     HTMLCanvasElement.prototype.getContext = function (kind: string, ...args: unknown[]) {
  277 |       if (kind === 'webgl' || kind === 'webgl2' || kind === 'experimental-webgl') return null;
  278 |       return getContext.apply(this, [kind, ...args] as Parameters<typeof getContext>);
  279 |     } as typeof getContext;
  280 |   });
  281 |   await page.goto('/');
  282 |   await expect(headline(page)).toBeVisible();
> 283 |   await expect(page.getByText('Interactive 3D is unavailable in this browser.', { exact: true })).toBeVisible();
      |                                                                                                   ^ Error: expect(locator).toBeVisible() failed
  284 |   await expect(page.getByRole('button', { name: 'Rotate featured cocktail left', exact: true })).toBeDisabled();
  285 |   await expect(page.getByRole('button', { name: 'Rotate featured cocktail right', exact: true })).toBeDisabled();
  286 |   await page.getByRole('button', { name: 'Explore ingredients', exact: true }).click();
  287 |   await expect(page).toHaveURL(/drink=bbf-negroni&expand=1/);
  288 |   await expect(page.getByText('Interactive 3D is unavailable in this browser.', { exact: true })).toBeVisible();
  289 |   await expect(page.getByRole('heading', { name: 'Inside the drink', exact: true })).toBeVisible();
  290 | });
  291 |
  292 | test.describe('phone touch and reduced motion', () => {
  293 |   test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: 'reduce' });
  294 |   test('touch orbit, visible ingredient controls and stable reduced-motion presentation', async ({ page }, testInfo) => {
  295 |     await page.goto('/');
  296 |     await waitLive(page, ['bbf-negroni']);
  297 |     expect(await page.locator('.sa-hero-copy').evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  298 |     expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  299 |     await expectNoPageOverflow(page);
  300 |     const stage = viewer(page, 'bbf-negroni');
  301 |     await stage.scrollIntoViewIfNeeded();
  302 |     const before = await snapshot(page, 'bbf-negroni');
  303 |     const box = await stage.boundingBox();
  304 |     const x = box!.x + box!.width * .7;
  305 |     const y = box!.y + box!.height * .5;
  306 |     const client = await page.context().newCDPSession(page);
  307 |     await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  308 |     for (let i = 1; i <= 12; i++) await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - i * 8, y }] });
  309 |     await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  310 |     await expect.poll(async () => Math.abs((await snapshot(page, 'bbf-negroni')).camera.azimuth - before.camera.azimuth)).toBeGreaterThan(.15);
  311 |     await page.getByRole('button', { name: 'Look inside', exact: true }).tap();
  312 |     await waitExpansion(page, ['bbf-negroni'], 1);
  313 |     await page.getByRole('button', { name: 'Bring it together', exact: true }).tap();
  314 |     await waitExpansion(page, ['bbf-negroni'], 0);
  315 |     const after = await snapshot(page, 'bbf-negroni');
  316 |     await page.waitForTimeout(350);
  317 |     expect(positionError(after, await snapshot(page, 'bbf-negroni'))).toBeLessThan(.002);
  318 |     await page.getByRole('link', { name: 'Explore the atlas', exact: true }).tap();
  319 |     await expect(page.getByRole('region', { name: 'Featured bars' })).toBeVisible();
  320 |     await expect(page.locator('.atlas-intro h1')).toHaveText('Three bars. Three takes on the Negroni.');
  321 |     await expect(page.locator('.map-loading')).toHaveCount(0, { timeout: 20_000 });
  322 |     await expectNoPageOverflow(page);
  323 |     await page.screenshot({ path: `${evidenceDir}/atlas-mobile-390x844.png` });
  324 |     await testInfo.attach('touch-reduced-motion', { body: JSON.stringify({ before, after }), contentType: 'application/json' });
  325 |   });
  326 | });
  327 |
```
