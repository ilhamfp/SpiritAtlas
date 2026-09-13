# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: btb-browser.spec.ts >> complete three-vessel preparation, personal garnish and comparison preserve the result
- Location: tests/btb-browser.spec.ts:5:1

# Error details

```
Test timeout of 60000ms exceeded.
```

```
Error: locator.click: Test timeout of 60000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: 'Pause pour', exact: true })

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - banner [ref=e4]:
    - link "SpiritAtlas" [ref=e5] [cursor=pointer]:
      - /url: /
    - link "Back to Bar Somma" [ref=e6] [cursor=pointer]:
      - /url: /?drink=negroni-express
    - button "Mute sound" [ref=e9] [cursor=pointer]
  - main [ref=e14]:
    - generic [ref=e15]:
      - generic [ref=e16]:
        - heading "Behind the bar." [level=1] [ref=e17]
        - paragraph [ref=e18]: Studio remix · inspired by Bar Somma
      - button "About this remix" [ref=e19] [cursor=pointer]
    - generic [ref=e20]:
      - region "Interactive preparation" [ref=e21]:
        - generic: NEGRONI EXPRESS / STUDIO
        - generic "Live cocktail. Drag a circle to stir; use arrow keys or the controls beside the glass." [ref=e23]
        - generic [ref=e24]:
          - generic "Gesture mode" [ref=e25]:
            - button "Tools" [pressed] [ref=e26] [cursor=pointer]
            - button "Move glass" [ref=e33] [cursor=pointer]
            - button "Look around" [ref=e40] [cursor=pointer]
          - generic [ref=e46]:
            - button "Zoom out" [ref=e47] [cursor=pointer]
            - button "Zoom in" [ref=e49] [cursor=pointer]
        - status [ref=e51]: Live liquid ready
      - region "Preparation controls" [ref=e52]:
        - list "Preparation progress" [ref=e53]:
          - listitem [ref=e54]:
            - generic [ref=e55]: "1"
            - text: Mix
          - listitem [ref=e56]:
            - generic [ref=e57]: "2"
            - text: Stir
          - listitem [ref=e58]:
            - generic [ref=e59]: "3"
            - text: Pour
          - listitem [ref=e60]:
            - generic [ref=e61]: "4"
            - text: Finish
        - generic [ref=e62]:
          - heading "Find your balance." [level=2] [ref=e63]
          - paragraph [ref=e64]: Pick a vessel. Pour a little, or a little more.
        - generic [ref=e65]:
          - button "Core blend Unbranded prepared blend 79% left" [pressed] [ref=e66] [cursor=pointer]:
            - generic [ref=e69]:
              - strong [ref=e70]: Core blend
              - generic [ref=e71]: Unbranded prepared blend
            - generic [ref=e72]:
              - text: 79%
              - generic [ref=e73]: left
          - button "Ancho Verde Optional modifier 100% left" [ref=e74] [cursor=pointer]:
            - generic [ref=e77]:
              - strong [ref=e78]: Ancho Verde
              - generic [ref=e79]: Optional modifier
            - generic [ref=e80]:
              - text: 100%
              - generic [ref=e81]: left
          - button "Rice syrup Optional modifier 100% left" [ref=e82] [cursor=pointer]:
            - generic [ref=e85]:
              - strong [ref=e86]: Rice syrup
              - generic [ref=e87]: Optional modifier
            - generic [ref=e88]:
              - text: 100%
              - generic [ref=e89]: left
        - generic [ref=e90]:
          - generic [ref=e91]:
            - text: Core blend tilt
            - status [ref=e92]: 0°
          - slider "Core blend tilt" [ref=e93] [cursor=pointer]: "0"
          - button "Pour" [active] [ref=e94] [cursor=pointer]
          - paragraph [ref=e97]: Click to pour, click again to pause. Every drop stays yours.
        - generic [ref=e98]:
          - button "Back" [disabled] [ref=e99]
          - button "Stir" [ref=e102] [cursor=pointer]
        - generic [ref=e105]:
          - generic [ref=e106]:
            - generic [ref=e107]: In the mixing glass
            - strong [ref=e108]: 18%
          - text: Illustrative fill · amounts remain when you go back
    - generic [ref=e111]:
      - button "Start over" [ref=e112] [cursor=pointer]
      - button "Try stirring" [ref=e116] [cursor=pointer]
      - button "Enable laptop motion" [ref=e117] [cursor=pointer]
```

# Test source

```ts
  1 | import {test,expect} from '@playwright/test';
  2 | async function ready(page:any,preset=''){await page.goto(`/behind-the-bar${preset?'?preset='+preset:''}`);await expect(page.getByText('Live liquid ready',{exact:true})).toBeVisible({timeout:20000});}
> 3 | async function pour(page:any,seconds:number){await page.getByRole('button',{name:'Pour',exact:true}).click();await page.waitForTimeout(seconds*1000);await page.getByRole('button',{name:'Pause pour',exact:true}).click();await page.waitForTimeout(250);}
    |                                                                                                                                                                                                                    ^ Error: locator.click: Test timeout of 60000ms exceeded.
  4 | test('GPU responds to held input, reversal, release and reset',async({page})=>{await ready(page,'stir-demo');const before=await page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuDispatches);await page.getByRole('button',{name:'Hold to stir right'}).focus();await page.keyboard.down('Space');await page.waitForTimeout(1100);let positive=await page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4]);expect(positive).toBeGreaterThan(1);await page.keyboard.up('Space');await page.getByRole('button',{name:'Hold to stir left'}).focus();await page.keyboard.down('Space');await page.waitForTimeout(100);const transient=await page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4]);expect(transient).toBeGreaterThan(0);await page.waitForTimeout(1400);expect(await page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4])).toBeLessThan(-1);await page.keyboard.up('Space');await page.waitForTimeout(4000);expect(Math.abs(await page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4]))).toBeLessThan(.1);expect(await page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuDispatches)).toBeGreaterThan(before);await page.getByRole('button',{name:'Reset demo'}).click();await page.waitForTimeout(150);expect(await page.evaluate(()=>window.__btb!.scene!.diagnostics.gpuState[4])).toBe(0);await page.getByRole('button',{name:'Start my remix'}).click();expect(await page.evaluate(()=>window.__btb!.model.origin)).toBe('user');await expect(page.getByRole('button',{name:'Add mixing ice'})).toBeVisible();});
  5 | test('complete three-vessel preparation, personal garnish and comparison preserve the result',async({page})=>{await ready(page);await page.getByRole('button',{name:'Add mixing ice'}).click();await pour(page,1.1);await pour(page,1.2);await page.getByRole('button',{name:/Ancho Verde Optional modifier/}).click();await pour(page,.7);await page.getByRole('button',{name:/Rice syrup Optional modifier/}).click();await pour(page,.45);await page.getByRole('button',{name:'Stir',exact:true}).click();await page.getByRole('button',{name:'Strain',exact:true}).click();await pour(page,1.8);await page.getByRole('button',{name:'Finish pouring'}).click();await page.getByRole('button',{name:'Express orange oil'}).click();await page.getByRole('button',{name:'Place garnish'}).click();await page.getByRole('slider',{name:'Rotate pepper'}).fill('1.2');await page.getByRole('slider',{name:'Across the rim'}).fill('0.12');await page.getByRole('button',{name:'Place pepper',exact:true}).click();await page.getByRole('button',{name:'Serve',exact:true}).click();await expect(page.getByRole('heading',{name:'Your studio remix'})).toBeVisible();const result=await page.evaluate(()=>window.__btb!.model.snapshot());expect(result.result!.garnish.angle).toBeCloseTo(1.2);expect(result.serving.rice).toBeGreaterThan(0);expect(result.mix.core).toBeGreaterThan(0);for(const d of Object.values(result.conservation))expect(Math.abs(d as number)).toBeLessThan(1e-7);await page.screenshot({path:'docs/behind-the-bar/evidence/serving-personal-desktop.png',fullPage:true});await page.getByRole('button',{name:'Compare with Bar Somma’s presentation'}).click();await page.getByRole('button',{name:'Return to my remix'}).first().click();await page.getByRole('button',{name:'Look around',exact:true}).click();await page.locator('.btb-canvas').focus();await page.keyboard.press('ArrowLeft');expect(await page.evaluate(()=>window.__btb!.model.result)).toEqual(result.result);await page.getByRole('link',{name:'Return to the real drink'}).click();await expect(page).toHaveURL(/drink=negroni-express/);});
  6 | test('mobile and tablet layouts retain readable controls, direct preview and no overflow',async({page})=>{for(const [width,height] of [[390,844],[768,1024]]){await page.setViewportSize({width,height});await ready(page,'stir-demo');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`docs/behind-the-bar/evidence/preview-${width}x${height}.png`,fullPage:true});await page.getByRole('button',{name:'Strain',exact:true}).click();await expect(page.getByRole('button',{name:'Pour',exact:true})).toBeVisible();await page.reload();await expect(page.getByText('Prefilled live preview')).toBeVisible();}});
  7 | test('native boundary rejects wrong session/order/invalid values and disarms on stale/reset/takeover',async({page})=>{await ready(page,'stir-demo');await page.getByRole('button',{name:'Enable laptop motion'}).click();const result=await page.evaluate(async()=>{const n=window.__btbNative!,m=window.__btb!.model;const packet={v:1,session:'a'.repeat(32),seq:1,expires:Date.now()+600000,accel:[0,0,-1],gyro:[0,0,0],t:1,unit:'g-deg/s',kind:'native-spu'};const accepted=n.accept(packet);const duplicate=n.accept(packet);const wrong=n.accept({...packet,seq:2,t:2,session:'b'.repeat(32)});const nan=n.accept({...packet,seq:2,t:2,accel:[NaN,0,-1]});for(let i=2;i<65;i++)n.accept({...packet,seq:i,t:i/60+2});const calibrated=n.calibrate();const armed=n.arm('move');m.reset();const reset=m.armed;n.arm('move');m.takeover();const local=m.armed;n.arm('move');await new Promise(r=>setTimeout(r,350));const stale=m.armed;n.accept({...packet,seq:90,t:90});return{accepted,duplicate,wrong,nan,calibrated,armed,reset,local,stale,rearmed:m.armed};});expect(result).toEqual({accepted:true,duplicate:false,wrong:false,nan:false,calibrated:true,armed:true,reset:null,local:null,stale:null,rearmed:null});});
  8 |
```
