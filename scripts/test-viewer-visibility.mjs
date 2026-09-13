// CPU-only lifecycle verification; run: node --experimental-strip-types scripts/test-viewer-visibility.mjs
import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { observeViewerVisibility } from '../src/scenes/useViewerVisibility.ts';

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const subscriptions = [];

function setup({ intersection = true, mutations = true, hidden = false } = {}) {
  const observers = [];
  const mutationObservers = [];
  const frames = new Map();
  let frameId = 0;
  class IO {
    targets = new Set();
    disconnected = false;
    constructor(callback, options) { this.callback = callback; this.options = options; observers.push(this); }
    observe(target) { this.targets.add(target); }
    unobserve(target) { this.targets.delete(target); }
    disconnect() { this.disconnected = true; this.targets.clear(); }
    emit(target, ratio) { this.callback([{ target, isIntersecting: ratio >= 0, intersectionRatio: Math.max(0, ratio) }]); }
  }
  class MO {
    disconnected = false;
    constructor(callback) { this.callback = callback; mutationObservers.push(this); }
    observe() {}
    disconnect() { this.disconnected = true; }
    emit() { this.callback([]); }
  }
  const doc = Object.assign(new EventTarget(), { hidden, documentElement: {} });
  const win = Object.assign(new EventTarget(), {
    innerWidth: 1000, innerHeight: 800,
    IntersectionObserver: intersection ? IO : undefined,
    MutationObserver: mutations ? MO : undefined,
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
  });
  globalThis.window = win;
  globalThis.document = doc;
  return {
    observers, mutationObservers, frames,
    scroll() { win.dispatchEvent(new Event('scroll')); },
    resize() { win.dispatchEvent(new Event('resize')); },
    pageshow() { win.dispatchEvent(new Event('pageshow')); },
    visibility(value) { doc.hidden = value; doc.dispatchEvent(new Event('visibilitychange')); },
    flush() { const pending = [...frames.values()]; frames.clear(); pending.forEach(callback => callback(0)); },
    watch(ref) {
      const changes = [];
      const subscription = observeViewerVisibility(ref, visible => changes.push(visible));
      subscriptions.push(subscription);
      return { ...subscription, changes };
    },
  };
}

function element(rect = {}) {
  return {
    isConnected: true,
    rect: { left: 0, top: 0, right: 400, bottom: 550, width: 400, height: 550, ...rect },
    getBoundingClientRect() { return this.rect; },
  };
}

afterEach(() => {
  subscriptions.splice(0).forEach(subscription => subscription.dispose());
  if (originalWindow === undefined) delete globalThis.window; else globalThis.window = originalWindow;
  if (originalDocument === undefined) delete globalThis.document; else globalThis.document = originalDocument;
});

test('visible host starts immediately, with scroll recovery before the first IO callback', () => {
  const env = setup();
  const host = element();
  const watch = env.watch({ current: host });
  assert.deepEqual(watch.changes, [true]);
  host.rect.left = 1000; host.rect.right = 1400;
  env.scroll(); env.flush();
  assert.deepEqual(watch.changes, [true, false]);
  host.rect.left = 600; host.rect.right = 1000;
  env.scroll(); env.flush();
  assert.deepEqual(watch.changes, [true, false, true]);
});

test('IO remains authoritative for clipping and edge contact has no visible pixels', () => {
  const env = setup();
  const host = element();
  const watch = env.watch({ current: host });
  const io = env.observers[0];
  io.emit(host, 0);
  env.scroll(); env.resize(); env.flush();
  assert.deepEqual(watch.changes, [true, false]);
  io.emit(host, 0.01);
  assert.deepEqual(watch.changes, [true, false, true]);
  assert.ok(io.options.threshold.some(value => value > 0 && value < 0.01));
});

test('hidden document pauses immediately and resumes at the current position', () => {
  const env = setup();
  const host = element();
  const watch = env.watch({ current: host });
  env.scroll();
  assert.equal(env.frames.size, 1);
  env.visibility(true);
  assert.equal(env.frames.size, 0);
  env.observers[0].emit(host, 1);
  assert.deepEqual(watch.changes, [true, false]);
  host.rect.top = 900; host.rect.bottom = 1450;
  env.visibility(false);
  assert.deepEqual(watch.changes, [true, false]);
  host.rect.top = 0; host.rect.bottom = 550;
  env.observers[0].emit(host, 1);
  assert.deepEqual(watch.changes, [true, false, true]);
});

test('a host appearing after Suspense is observed without requiring a parent render', () => {
  const env = setup();
  const ref = { current: null };
  const watch = env.watch(ref);
  assert.deepEqual(watch.changes, [false]);
  ref.current = element();
  env.mutationObservers[0].emit();
  assert.deepEqual(watch.changes, [false, true]);
  assert.equal(env.mutationObservers[0].disconnected, true);
  assert.ok(env.observers[0].targets.has(ref.current));
});

test('host replacement ignores stale IO entries and detaches the old target', () => {
  const env = setup();
  const first = element();
  const ref = { current: first };
  const watch = env.watch(ref);
  ref.current = element({ top: 900, bottom: 1450 });
  watch.checkHost();
  env.observers[0].emit(first, 1);
  assert.deepEqual(watch.changes, [true, false]);
  assert.equal(env.observers[0].targets.has(first), false);
  assert.ok(env.observers[0].targets.has(ref.current));
});

test('without IO, scrolling and resizing update visibility without duplicate notifications', () => {
  const env = setup({ intersection: false });
  const host = element({ width: 0 });
  const watch = env.watch({ current: host });
  host.rect.width = 400;
  env.resize(); env.scroll(); env.flush();
  env.scroll(); env.flush();
  host.rect.bottom = 0; host.rect.top = -550;
  env.scroll(); env.flush();
  assert.deepEqual(watch.changes, [false, true, false]);
});

test('BFCache return refreshes the host without waiting for an IO delivery', () => {
  const env = setup();
  const host = element({ top: 900, bottom: 1450 });
  const watch = env.watch({ current: host });
  env.observers[0].emit(host, -1);
  host.rect.top = 0; host.rect.bottom = 550;
  env.pageshow();
  assert.deepEqual(watch.changes, [false, true]);
});

test('cleanup cancels frames, observers, listeners, and stale callbacks', () => {
  const env = setup();
  const host = element();
  const watch = env.watch({ current: host });
  env.scroll();
  watch.dispose();
  assert.equal(env.frames.size, 0);
  assert.equal(env.observers[0].disconnected, true);
  env.scroll(); env.resize(); env.visibility(true); env.pageshow();
  env.observers[0].emit(host, -1);
  env.flush();
  assert.deepEqual(watch.changes, [true]);
  assert.equal(env.frames.size, 0);
});

test('initially absent host and missing observers recover with cancellable RAF fallback', () => {
  const env = setup({ intersection: false, mutations: false });
  const ref = { current: null };
  const watch = env.watch(ref);
  assert.equal(env.frames.size, 1);
  ref.current = element();
  env.flush();
  assert.deepEqual(watch.changes, [false, true]);
  assert.equal(env.frames.size, 0);
});

test('cleanup disconnects the observer waiting for a delayed host', () => {
  const env = setup();
  const watch = env.watch({ current: null });
  watch.dispose();
  assert.equal(env.mutationObservers[0].disconnected, true);
  env.mutationObservers[0].emit();
  assert.deepEqual(watch.changes, [false]);
});
