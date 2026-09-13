import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

const output = process.env.ATLAS_ALLOCATION_OUTPUT ?? 'qa/performance-results/transmission-allocation-probe';
const base = process.env.ATLAS_ALLOCATION_URL ?? 'http://127.0.0.1:4173';
mkdirSync(output, { recursive: true });
const hash = path => ({ path, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') });
const report = { startedAt: new Date().toISOString(), sources: ['tests/inspect-transmission-framebuffers.mjs', 'src/scenes/Viewer.tsx', 'node_modules/three/src/renderers/WebGLRenderer.js', 'node_modules/@react-three/drei/core/Fbo.js'].map(hash), samples: [], errors: [] };
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  page.on('pageerror', error => report.errors.push(String(error)));
  await page.addInitScript(() => {
    const probe = window.__atlasAllocationProbe = { active: false, events: [] };
    const objects = new WeakMap(); let sequence = 0;
    const objectId = value => value ? (objects.has(value) ? objects.get(value) : (objects.set(value, ++sequence), sequence)) : null;
    const states = new WeakMap();
    function state(gl) {
      if (!states.has(gl)) states.set(gl, { framebuffer: gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING), viewport: [...gl.getParameter(gl.VIEWPORT)] });
      return states.get(gl);
    }
    function record(gl, event) {
      if (!probe.active) return;
      const id = gl.canvas.closest?.('[data-testid]')?.getAttribute('data-testid')?.replace(/^viewer-/, '');
      if (!id) return;
      probe.events.push({ ...event, id, afterFrame: window.__atlasViewers[id]?.renderedFrames ?? null, at: performance.now() });
    }
    const proto = WebGL2RenderingContext.prototype;
    for (const name of ['createFramebuffer', 'deleteFramebuffer', 'bindFramebuffer', 'viewport', 'renderbufferStorageMultisample', 'drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
      const original = proto[name];
      proto[name] = function (...args) {
        const result = Reflect.apply(original, this, args);
        if (name === 'createFramebuffer') record(this, { name, object: objectId(result), stack: new Error().stack });
        else if (name === 'deleteFramebuffer') record(this, { name, object: objectId(args[0]) });
        else if (name === 'bindFramebuffer') {
          if (args[0] === this.FRAMEBUFFER || args[0] === this.DRAW_FRAMEBUFFER) state(this).framebuffer = args[1];
          record(this, { name, target: args[0], object: objectId(args[1]) });
        } else if (name === 'viewport') {
          state(this).viewport = args;
          record(this, { name, values: args });
        } else if (name === 'renderbufferStorageMultisample') record(this, { name, samples: args[1], width: args[3], height: args[4] });
        else record(this, { name, framebuffer: objectId(state(this).framebuffer), viewport: state(this).viewport });
        return result;
      };
    }
  });
  await page.goto(`${base}/?drink=negroni-express`);
  await page.waitForFunction(() => window.__atlasViewers?.['negroni-express']?.ready && performance.now() - window.__atlasViewers['negroni-express'].renderedAt >= 600);
  report.browser = browser.version();
  report.layout = await page.evaluate(() => {
    const canvas = document.querySelector('[data-testid="viewer-negroni-express"] canvas');
    const rect = canvas.getBoundingClientRect(), hostRect = canvas.parentElement.getBoundingClientRect();
    return { dpr: devicePixelRatio, canvas: { width: canvas.width, height: canvas.height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight, rect: { width: rect.width, height: rect.height } }, measuringParent: { width: hostRect.width, height: hostRect.height } };
  });
  for (let step = 0; step < 3; step++) {
    const before = await page.evaluate(() => { window.__atlasAllocationProbe.events = []; window.__atlasAllocationProbe.active = true; return window.__atlasViewers['negroni-express'].renderedFrames; });
    await page.getByRole('region', { name: 'Negroni Express showcase', exact: true }).getByRole('button', { name: 'Rotate right', exact: true }).click();
    await page.waitForFunction(start => window.__atlasViewers['negroni-express'].renderedFrames > start && performance.now() - window.__atlasViewers['negroni-express'].renderedAt >= 200, before);
    report.samples.push(await page.evaluate(() => { window.__atlasAllocationProbe.active = false; return { after: window.__atlasViewers['negroni-express'].renderedFrames, events: window.__atlasAllocationProbe.events }; }));
  }
} finally { await browser.close(); }
report.finishedAt = new Date().toISOString();
report.sourcesUnchanged = report.sources.every(item => hash(item.path).sha256 === item.sha256);
writeFileSync(`${output}/report.json`, JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify({ layout: report.layout, samples: report.samples.map(s => ({ frame: s.after, creates: s.events.filter(e => e.name === 'createFramebuffer').length, deletes: s.events.filter(e => e.name === 'deleteFramebuffer').length, allocations: s.events.filter(e => e.name === 'renderbufferStorageMultisample').map(e => [e.width, e.height]), drawViewports: [...new Set(s.events.filter(e => e.name.startsWith('draw')).map(e => e.viewport.join(',')))] })), errors: report.errors }));
