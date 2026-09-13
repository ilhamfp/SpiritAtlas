// Serialize this function with Playwright addInitScript. It has no module-scope
// dependencies and does not change application sources or request viewer frames.
export function installGpuDrawTiming({ splitFramebuffers = false } = {}) {
  const contexts = new Map();
  const statuses = [];
  const failures = [];
  const result = { scope: splitFramebuffers ? 'framebuffer-segments' : 'whole-frame', contexts: statuses, failures, pending: 0 };
  window.__atlasGpuTiming = result;

  function stateFor(gl) {
    if (contexts.has(gl)) return contexts.get(gl);
    const id = gl.canvas.closest?.('[data-testid]')?.getAttribute('data-testid')?.replace(/^viewer-/, '');
    if (!id) return null;
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
    const status = { id, supported: !!ext, disjointEvents: 0, contextLost: false };
    statuses.push(status);
    const state = { gl, id, ext, status, active: null, pending: [], segment: null,
      framebuffer: splitFramebuffers ? gl.getParameter(gl.DRAW_FRAMEBUFFER_BINDING) : null,
      framebufferIds: new Map() };
    contexts.set(gl, state);
    if (ext) gl.getParameter(ext.GPU_DISJOINT_EXT);
    return state;
  }

  function openQuery(state) {
    const { gl, ext } = state;
    if (!ext || gl.isContextLost()) return null;
    if (gl.getQuery(ext.TIME_ELAPSED_EXT, gl.CURRENT_QUERY)) {
      failures.push({ id: state.id, reason: 'An existing elapsed query prevented instrumentation.' });
      return null;
    }
    const query = gl.createQuery();
    gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    return query;
  }

  function finishSegment(state) {
    const segment = state.segment;
    if (!segment) return;
    state.segment = null;
    if (segment.query) state.gl.endQuery(state.ext.TIME_ELAPSED_EXT);
    const row = { target: segment.target, drawCalls: segment.drawCalls,
      firstCallAt: segment.firstCallAt, cpuSubmissionSpanMs: performance.now() - segment.firstCallAt,
      gpuElapsedMs: null, status: segment.query ? 'pending' : 'unavailable' };
    state.active.segments.push(row);
    if (segment.query) state.pending.push({ query: segment.query, row });
  }

  function beforeDraw(gl) {
    const phase = window.__atlasPerf;
    if (!phase?.observingDraws) return;
    const state = stateFor(gl);
    if (!state) return;
    if (!state.active) {
      const active = { phase, query: null, firstCallAt: performance.now(), drawCalls: 0, segments: [] };
      if (!splitFramebuffers) active.query = openQuery(state);
      state.active = active;
    }
    if (splitFramebuffers && !state.segment) {
      let target = 'default';
      if (state.framebuffer) {
        if (!state.framebufferIds.has(state.framebuffer)) state.framebufferIds.set(state.framebuffer, `offscreen-${state.framebufferIds.size + 1}`);
        target = state.framebufferIds.get(state.framebuffer);
      }
      state.segment = { query: openQuery(state), target, firstCallAt: performance.now(), drawCalls: 0 };
    }
    state.active.drawCalls++;
    if (state.segment) state.segment.drawCalls++;
  }

  if (splitFramebuffers) {
    const bind = WebGL2RenderingContext.prototype.bindFramebuffer;
    WebGL2RenderingContext.prototype.bindFramebuffer = function (target, framebuffer) {
      const state = contexts.get(this);
      if (state && (target === this.FRAMEBUFFER || target === this.DRAW_FRAMEBUFFER) && state.framebuffer !== framebuffer) {
        finishSegment(state);
        state.framebuffer = framebuffer;
      }
      return Reflect.apply(bind, this, [target, framebuffer]);
    };
  }

  for (const name of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) {
    const original = WebGL2RenderingContext.prototype[name];
    WebGL2RenderingContext.prototype[name] = function (...args) {
      beforeDraw(this);
      return Reflect.apply(original, this, args);
    };
  }

  // Called from the existing benchmark's post-draw snapshot observer. The query
  // spans from the first GL draw through the last optical/final-scene draw.
  window.__atlasGpuDrawFinished = (id, frame) => {
    for (const state of contexts.values()) {
      if (state.id !== id || !state.active) continue;
      const active = state.active;
      if (splitFramebuffers) finishSegment(state);
      state.active = null;
      if (active.query) state.gl.endQuery(state.ext.TIME_ELAPSED_EXT);
      const row = { frame, drawCalls: active.drawCalls, firstCallAt: active.firstCallAt,
        cpuSubmissionSpanMs: performance.now() - active.firstCallAt,
        gpuElapsedMs: null, status: splitFramebuffers ? 'segmented' : active.query ? 'pending' : 'unavailable',
        ...(splitFramebuffers ? { segments: active.segments } : {}) };
      (active.phase.gpuDraws ??= {})[id] ??= [];
      active.phase.gpuDraws[id].push(row);
      if (active.query) state.pending.push({ query: active.query, row });
    }
  };

  // Poll only after returning to the browser event loop. Never use finish(),
  // block for a result, or treat an unavailable/disjoint query as zero duration.
  window.__atlasPollGpuTiming = () => {
    for (const state of contexts.values()) {
      const { gl, ext } = state;
      if (!ext) continue;
      if (gl.isContextLost()) {
        state.status.contextLost = true;
        for (const entry of state.pending) entry.row.status = 'context-lost';
        state.pending.length = 0;
        continue;
      }
      const disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
      if (disjoint) state.status.disjointEvents++;
      state.pending = state.pending.filter((entry) => {
        const available = gl.getQueryParameter(entry.query, gl.QUERY_RESULT_AVAILABLE);
        if (!disjoint && !available) return true;
        if (disjoint) entry.row.status = 'disjoint';
        else {
          entry.row.gpuElapsedMs = gl.getQueryParameter(entry.query, gl.QUERY_RESULT) / 1e6;
          entry.row.status = 'available';
        }
        gl.deleteQuery(entry.query);
        return false;
      });
    }
    result.pending = [...contexts.values()].reduce((count, state) => count + state.pending.length, 0);
    return result.pending;
  };
}
