// Run against an already built preview server with other task GPU work paused.
// This records evidence; it does not declare fidelity or physical-mobile passes.
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import { installGpuDrawTiming } from './helpers/gpu-draw-timing.mjs';

const baseURL = process.env.ATLAS_BENCH_URL ?? 'http://127.0.0.1:4173';
const output = process.env.ATLAS_BENCH_OUTPUT ?? 'qa/performance-results';
const dprs = (process.env.ATLAS_BENCH_DPRS ?? '1,2').split(',').map(Number);
const pipelines = (process.env.ATLAS_BENCH_PIPELINES ?? 'optimized').split(',');
const modes = (process.env.ATLAS_BENCH_MODES ?? 'single,comparison').split(',');
const areaLights = process.env.ATLAS_BENCH_AREA_LIGHTS ?? 'on';
if (!['on', 'off'].includes(areaLights)) throw new Error('ATLAS_BENCH_AREA_LIGHTS must be on or off');
const warmStates = process.env.ATLAS_BENCH_WARM_STATES === '1';
const captureStates = process.env.ATLAS_BENCH_CAPTURE_STATES === '1';
const continuousOrbit = process.env.ATLAS_BENCH_CONTINUOUS === '1';
const gpuTiming = process.env.ATLAS_BENCH_GPU === '1';
const splitFramebuffers = process.env.ATLAS_BENCH_GPU_SCOPE === 'framebuffer';
mkdirSync(output, { recursive: true });
const ids = ['bbf-negroni', 'ichigo-negroni', 'negroni-express'];
const hash = (path) => { const b = readFileSync(path); return { path, bytes: b.length, sha256: createHash('sha256').update(b).digest('hex') }; };
const percentile = (values, p) => values.length ? values.slice().sort((a, b) => a - b)[Math.ceil(p * values.length) - 1] : null;
function summarize(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return { samples: values.length, meanMs: mean, medianMs: percentile(values, .5), p95Ms: percentile(values, .95), p99Ms: percentile(values, .99), maxMs: Math.max(...values), callbackFps: 1000 / mean, over33ms: values.filter((v) => v > 33.34).length, over50ms: values.filter((v) => v > 50).length, over100ms: values.filter((v) => v > 100).length };
}
const report = {
  startedAt: new Date().toISOString(), baseURL,
  instrumentation: { continuousOrbit, gpuTiming, splitFramebuffers, files: ['tests/measure-performance.mjs', 'tests/helpers/gpu-draw-timing.mjs'].map(hash), gpuQueryScope: gpuTiming ? 'EXT_disjoint_timer_query_webgl2 from the first WebGL draw call until existing post-draw telemetry, optionally split when DRAW_FRAMEBUFFER changes. Clears before the first draw and input/React work before GL drawing are excluded. Results are polled asynchronously after the phase closes; missing, pending, disjoint and context-lost results remain explicit.' : null },
  conditions: 'Production preview; one automated browser page at a time; no video or trace recording during samples. Other task browser and Blender GPU work paused by coordination. Unrelated user applications remain running. Headless desktop Chrome uses the Apple M4 Pro GPU; DPR2 is a desktop quality scenario, not physical mobile evidence. RAF intervals measure page scheduling, not viewer rendering or GPU duration. Actual completed viewer frames are counted separately when supported; a demand viewer can draw zero frames while page RAF remains near display refresh. Automated input latency includes runner/actionability/IPC and snapshot publication. Current snapshots publish on first/final or stationary frames and every fifth frame during expansion.',
  hardware: { platform: os.platform(), release: os.release(), architecture: os.arch(), cpu: os.cpus()[0]?.model, logicalCpuCount: os.cpus().length, memoryBytes: os.totalmem(), osVersion: execFileSync('sw_vers', { encoding: 'utf8' }), display: execFileSync('system_profiler', ['SPDisplaysDataType'], { encoding: 'utf8' }) },
  concurrentProcessesAtStart: execFileSync('ps', ['-Ao', 'pid,pcpu,comm'], { encoding: 'utf8' }).split('\n').filter((line) => /Chrome|Blender|rekordbox|WindowServer/.test(line)),
  sources: ['src/scenes/Viewer.tsx', 'src/scenes/BarEnvironment.tsx', 'src/scenes/BarLighting.tsx', 'public/textures/somma-interior-panorama-v2.png', 'public/textures/somma-stone-tile-v1.png', 'src/App.tsx', 'src/styles.css', 'package-lock.json', ...ids.flatMap((id) => [`public/models/${id}.glb`, `assets/blender/${id}.json`])].map(hash),
  authoringWorkspace: { currentBuilder: hash('scripts/build-assets.py'), note: 'The active authoring script may be an unpromoted candidate. Production asset manifests record their authoritative builder hash; the working script does not affect the running benchmark.' },
  cases: [],
};
const browser = await chromium.launch({ channel: 'chrome', headless: true });
report.browser = browser.version();
try {
for (const pipeline of pipelines) {
for (const dpr of dprs) {
for (const mode of modes) {
  const drinkIds = mode === 'single' ? ['negroni-express'] : ids;
  const subjectId = drinkIds[0];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: dpr });
  const page = await context.newPage();
  if (gpuTiming) await page.addInitScript(installGpuDrawTiming, { splitFramebuffers });
  await page.addInitScript(() => {
    window.__atlasAreaLightDeclarations = [];
    const original = WebGL2RenderingContext.prototype.shaderSource;
    WebGL2RenderingContext.prototype.shaderSource = function(shader, source) {
      const match = source.match(/uniform\s+RectAreaLight\s+rectAreaLights\s*\[\s*(\d+)\s*\]/);
      if (match) window.__atlasAreaLightDeclarations.push(Number(match[1]));
      return original.call(this, shader, source);
    };
  });
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('response', (response) => { if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`); });
  const route = mode === 'single' ? `${baseURL}/?drink=${subjectId}` : `${baseURL}/?compare=${drinkIds.join(',')}`;
  const pipelineQuery = (pipeline === 'baseline' ? '&pipeline=baseline' : '') + `&areaLights=${areaLights}`;
  await page.goto(`${route}&expand=0${pipelineQuery}`);
  await page.waitForFunction((list) => list.every((id) => window.__atlasViewers?.[id]?.ready && document.querySelector(`[data-testid="viewer-${id}"]`)?.dataset.live === 'true'), drinkIds, { timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const readyMs = await page.evaluate(() => performance.now());
  await page.waitForTimeout(2000);
  const environment = await page.evaluate(() => ({ shaderAreaLightCounts: [...new Set(window.__atlasAreaLightDeclarations)], userAgent: navigator.userAgent, dpr: devicePixelRatio, viewport: { width: innerWidth, height: innerHeight }, canvases: [...document.querySelectorAll('[data-live="true"] canvas')].map((canvas) => { const gl = canvas.getContext('webgl2'); const extension = gl?.getExtension('WEBGL_debug_renderer_info'); return { cssWidth: canvas.clientWidth, cssHeight: canvas.clientHeight, bufferWidth: canvas.width, bufferHeight: canvas.height, renderer: extension ? gl.getParameter(extension.UNMASKED_RENDERER_WEBGL) : null }; }), resources: performance.getEntriesByType('resource').map((r) => ({ name: r.name, initiatorType: r.initiatorType, durationMs: r.duration, transferSize: r.transferSize, encodedBodySize: r.encodedBodySize, decodedBodySize: r.decodedBodySize })).filter((r) => /models\/|textures\/|\.js|\.hdr/.test(r.name)) }));
  const result = { mode, pipeline, areaLights, drinkIds, readyMs, environment, phases: [], captures: [], errors };
  const region = mode === 'single' ? page.getByRole('region', { name: 'Negroni Express showcase', exact: true }) : page.getByRole('region', { name: 'Compare BBF Negroni', exact: true });
  if (warmStates) {
    const started = await page.evaluate(() => performance.now());
    for (const target of [1, 0]) {
      const name = mode === 'single' ? (target ? 'Explore ingredients' : 'Reassemble drink') : (target ? 'Expand all' : 'Reassemble all');
      await page.getByRole('button', { name, exact: true }).click();
      await page.waitForFunction(({ ids, target }) => ids.every((id) => Math.abs(window.__atlasViewers[id].e - target) < .001), { ids: drinkIds, target });
      await page.waitForTimeout(350);
    }
    result.prewarm = { states: [1, 0], durationMs: await page.evaluate((start) => performance.now() - start, started) };
  }
  async function startPhase() {
    await page.evaluate(() => {
      // Observe the existing post-draw telemetry without adding viewer invalidations
      // or relying on the page RAF count. Both snapshot replacement and mutation
      // occur in the viewer; keep the original values and property semantics.
      if (!window.__atlasDrawObserverInstalled) {
        const record = (id, snapshot) => {
          const phase = window.__atlasPerf;
          if (!phase?.observingDraws || !Number.isFinite(snapshot.renderedFrames) || !Number.isFinite(snapshot.renderedAt)) return;
          const rows = phase.viewerDraws[id] ??= [];
          if (rows.at(-1)?.frame !== snapshot.renderedFrames) {
            rows.push({ frame: snapshot.renderedFrames, at: snapshot.renderedAt });
            window.__atlasGpuDrawFinished?.(id, snapshot.renderedFrames);
          }
        };
        const wrap = (id, snapshot) => new Proxy(snapshot, {
          set(target, key, value) {
            const ok = Reflect.set(target, key, value);
            if (key === 'renderedAt') record(id, target);
            return ok;
          },
        });
        const map = window.__atlasViewers;
        for (const [id, snapshot] of Object.entries(map)) map[id] = wrap(id, snapshot);
        window.__atlasViewers = new Proxy(map, {
          set(target, key, value) {
            const ok = Reflect.set(target, key, wrap(key, value));
            record(key, value);
            return ok;
          },
        });
        window.__atlasDrawObserverInstalled = true;
      }
      const state = { frames: [], longtasks: [], last: 0, raf: 0, start: performance.now(), observer: null, observingDraws: true, viewerDraws: {}, viewerFramesAtStart: Object.fromEntries(Object.entries(window.__atlasViewers ?? {}).map(([id, snapshot]) => [id, Number.isFinite(snapshot.renderedFrames) ? snapshot.renderedFrames : null])) };
      state.observer = new PerformanceObserver((list) => state.longtasks.push(...list.getEntries().map((entry) => ({ startTime: entry.startTime, duration: entry.duration }))));
      state.observer.observe({ type: 'longtask', buffered: false });
      const tick = (now) => { if (state.last) state.frames.push(now - state.last); state.last = now; state.raf = requestAnimationFrame(tick); };
      state.raf = requestAnimationFrame(tick); window.__atlasPerf = state;
    });
  }
  async function endPhase(name, inputs = []) {
    // Freeze the measured window before allowing asynchronous GPU results to
    // become available. The drain must not inflate the phase's duration/counts.
    await page.evaluate(() => {
      const s = window.__atlasPerf;
      s.end = performance.now(); s.observingDraws = false;
      s.viewerFramesAtEnd = Object.fromEntries(Object.entries(window.__atlasViewers).map(([id, value]) => [id, value.renderedFrames]));
      cancelAnimationFrame(s.raf); s.observer.disconnect();
    });
    if (gpuTiming) await page.evaluate(() => new Promise((resolve) => {
      const deadline = performance.now() + 2000;
      const poll = () => {
        const pending = window.__atlasPollGpuTiming();
        if (!pending || performance.now() >= deadline) resolve();
        else setTimeout(poll, 20);
      };
      setTimeout(poll, 0);
    }));
    const data = await page.evaluate(() => {
      const s = window.__atlasPerf;
      const durationMs = s.end - s.start;
      const viewerRendering = Object.fromEntries(Object.entries(window.__atlasViewers).map(([id, value]) => {
        const start = s.viewerFramesAtStart[id], end = s.viewerFramesAtEnd[id];
        const available = Number.isFinite(start) && Number.isFinite(end) && end >= start;
        const completedFrames = available ? end - start : null;
        const draws = s.viewerDraws[id] ?? [];
        return [id, { available, start: start ?? null, end: end ?? null, completedFrames, completedFramesPerSecond: available && durationMs > 0 ? completedFrames * 1000 / durationMs : null, postDrawEvents: draws, observedCountMatchesCounter: available ? draws.length === completedFrames : null, postDrawIntervalsMs: draws.slice(1).map((event, index) => event.at - draws[index].at) }];
      }));
      return { durationMs, intervalsMs: s.frames, longtasks: s.longtasks, viewerRendering, gpuDraws: s.gpuDraws ?? null, gpuTiming: window.__atlasGpuTiming ?? null, app: Object.fromEntries(Object.entries(window.__atlasViewers).map(([id, value]) => [id, { frameTimes: value.frameTimes.slice(), e: value.e, camera: value.camera }])) };
    });
    for (const value of Object.values(data.viewerRendering)) {
      if (value.postDrawIntervalsMs.length) {
        const { callbackFps, ...intervals } = summarize(value.postDrawIntervalsMs);
        value.postDrawSummary = { ...intervals, intervalFrequencyHz: callbackFps };
      } else value.postDrawSummary = null;
    }
    result.phases.push({ name, ...data, summary: summarize(data.intervalsMs), summaryMeaning: 'Page RAF scheduling only. Viewer events occur after the optical draw calls return on the CPU; they do not prove GPU completion or display presentation. completedFramesPerSecond includes idle/input gaps. Post-draw intervals describe this input workload, not an unrestricted maximum.', inputs });
  }
  // A prewarm threshold of .001 can still leave several expensive settling
  // frames. Require the exact final pose and a resting window before idle data.
  await page.waitForFunction((list) => list.every((id) => {
    const snapshot = window.__atlasViewers[id];
    return snapshot.e === 0 && (!Number.isFinite(snapshot.renderedAt) || performance.now() - snapshot.renderedAt >= 600);
  }), drinkIds, { timeout: 30000 });
  await startPhase(); await page.waitForTimeout(5000); await endPhase('assembled-idle');
  await startPhase();
  const orbitInputs = [];
  for (let step = 0; step < 18; step++) {
    const before = await page.evaluate((id) => ({ time: performance.now(), camera: window.__atlasViewers[id].camera.position }), subjectId);
    await region.getByRole('button', { name: 'Rotate right', exact: true }).click();
    await page.waitForFunction(({ id, before }) => Math.hypot(...window.__atlasViewers[id].camera.position.map((v, axis) => v - before[axis])) > .1, { id: subjectId, before: before.camera });
    orbitInputs.push(await page.evaluate(({ id, before }) => ({ observedLatencyMs: performance.now() - before.time, camera: window.__atlasViewers[id].camera }), { id: subjectId, before }));
    await page.waitForTimeout(180);
  }
  await endPhase('input-driven-horizontal-orbit', orbitInputs);
  if (continuousOrbit) {
    const host = page.getByTestId(`viewer-${subjectId}`);
    const box = await host.boundingBox();
    if (!box) throw new Error('Continuous orbit requires a visible viewer.');
    // Start with a trusted pointer so setPointerCapture has a real active ID.
    await host.evaluate((element) => element.addEventListener('pointerdown', (event) => { window.__atlasBenchPointerId = event.pointerId; }, { once: true }));
    const x = box.x + box.width * .5, y = box.y + box.height * .5;
    await page.mouse.move(x, y); await page.mouse.down();
    await startPhase();
    let input;
    try {
      input = await host.evaluate((element, initial) => new Promise((resolve) => {
        const started = performance.now(), duration = 10000, radiansPerSecond = .65;
        const cameraStart = window.__atlasViewers[initial.id].camera.azimuth;
        let events = 0;
        const step = (now) => {
          const elapsed = Math.min(now - started, duration);
          element.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, pointerId: window.__atlasBenchPointerId, pointerType: 'mouse', buttons: 1, clientX: initial.x - elapsed / 1000 * radiansPerSecond / .009, clientY: initial.y }));
          events++;
          if (elapsed < duration) requestAnimationFrame(step);
          else resolve({ eventCount: events, requestedDurationMs: duration, inputDurationMs: now - started, requestedRadians: duration / 1000 * radiansPerSecond, cameraStart, method: 'Trusted pointerdown, then one synthetic pointermove per page RAF through the real React pointer handler. Coordinates continue under pointer capture. No direct camera or render invalidation calls.' });
        };
        requestAnimationFrame(step);
      }), { x, y, id: subjectId });
      await page.waitForFunction(({ id, angle }) => Math.abs(window.__atlasViewers[id].camera.azimuth - angle) < 1e-9, { id: subjectId, angle: input.cameraStart + input.requestedRadians });
      input.endpointObservedBeforePhaseEnd = await page.evaluate((id) => ({ azimuth: window.__atlasViewers[id].camera.azimuth, renderedFrame: window.__atlasViewers[id].renderedFrames, observedAt: performance.now() }), subjectId);
      await endPhase('continuous-handler-orbit', [input]);
    } finally { await page.mouse.up(); }
    await page.waitForTimeout(500);
    input.cameraEnd = await page.evaluate((id) => window.__atlasViewers[id].camera.azimuth, subjectId);
    input.actualRadians = input.cameraEnd - input.cameraStart;
    input.finalAngularError = Math.abs(input.actualRadians - input.requestedRadians);
    if (input.finalAngularError > .001) throw new Error(`Continuous orbit failed to reach its requested angle: ${input.finalAngularError}`);
  }
  await startPhase();
  const expansionInputs = [];
  for (let step = 0; step < 4; step++) {
    const target = step % 2 === 0 ? 1 : 0;
    const before = await page.evaluate(() => performance.now());
    const name = mode === 'single' ? (target ? 'Explore ingredients' : 'Reassemble drink') : (target ? 'Expand all' : 'Reassemble all');
    await page.getByRole('button', { name, exact: true }).click();
    await page.waitForFunction(({ ids, target }) => ids.every((id) => Math.abs(window.__atlasViewers[id].e - target) < .015), { ids: drinkIds, target });
    expansionInputs.push(await page.evaluate(({ ids, target, before }) => ({ target, observedSettledMs: performance.now() - before, expansion: Object.fromEntries(ids.map((id) => [id, window.__atlasViewers[id].e])) }), { ids: drinkIds, target, before }));
    await page.waitForTimeout(350);
  }
  await endPhase('input-driven-expand-reassemble', expansionInputs);
  await page.screenshot({ path: `${output}/${pipeline}-${mode}-dpr${dpr}-post-measurement.png` });
  if (captureStates) for (const expansion of [0, .5, 1]) {
    await page.goto(`${route}&expand=${expansion}${pipelineQuery}`);
    await page.waitForFunction(({ list, target }) => list.every((id) => window.__atlasViewers?.[id]?.ready && Math.abs(window.__atlasViewers[id].e - target) < .001), { list: drinkIds, target: expansion }, { timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(500);
    await page.mouse.move(0, 0);
    for (const id of drinkIds) {
      const filename = `${pipeline}-${mode}-dpr${dpr}-e${expansion}-${id}.png`;
      await page.getByTestId(`viewer-${id}`).screenshot({ path: `${output}/${filename}` });
      result.captures.push({ expansion, drinkId: id, filename, state: await page.evaluate((id) => window.__atlasViewers[id], id) });
    }
  }
  report.cases.push(result);
  writeFileSync(`${output}/production-measurement.json`, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ mode, pipeline, areaLights, dpr, readyMs, phases: result.phases.map(({ name, summary }) => ({ name, ...summary })), errors }));
  await context.close();
}
}
}
} finally { await browser.close(); }
report.finishedAt = new Date().toISOString();
report.sourcesUnchanged = report.sources.every((entry) => hash(entry.path).sha256 === entry.sha256);
writeFileSync(`${output}/production-measurement.json`, JSON.stringify(report, null, 2) + '\n');
