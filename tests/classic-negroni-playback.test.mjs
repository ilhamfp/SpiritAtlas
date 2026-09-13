import test from 'node:test';
import assert from 'node:assert/strict';
import {advancePlayback, deconstruct, idleSampleProgress, INITIAL_PLAYBACK, movieTime, togglePlayback} from '../src/negroni/playback.ts';

test('the reverse film resumes at the identical pose when reversing mid-transition', () => {
  const forward = {...INITIAL_PLAYBACK, playing: true, progress: .37};
  const reverse = deconstruct(forward);
  assert.equal(reverse.direction, -1);
  assert.equal(reverse.progress, .37);
  assert.ok(Math.abs(movieTime(forward) + movieTime(reverse) - 7.2) < 1e-10);
  assert.equal(deconstruct(reverse).direction, 1);
});

test('pausing and resuming preserves loop phase and playback speed', () => {
  const circulating = {...INITIAL_PLAYBACK, progress: 1, playing: true, looping: true, idleTime: .8, speed: .25};
  const paused = togglePlayback(circulating);
  assert.equal(paused.playing, false);
  assert.deepEqual(advancePlayback(paused, .6), paused);
  assert.deepEqual(togglePlayback(paused), circulating);
});

test('loop samples have matching endpoint poses and smoothly turn around', () => {
  assert.equal(idleSampleProgress(0), 1);
  assert.equal(idleSampleProgress(2.4), 1);
  assert.ok(Math.abs(idleSampleProgress(1.2) - 6.4 / 7.2) < 1e-10);
  assert.ok(Math.abs(idleSampleProgress(.3) - idleSampleProgress(2.1)) < 1e-10);
});

test('reassembly begins at the currently visible circulation pose', () => {
  const circulating = {...INITIAL_PLAYBACK, progress: 1, playing: true, looping: true, idleTime: 1.2};
  const reverse = deconstruct(circulating);
  assert.equal(reverse.looping, false);
  assert.equal(reverse.direction, -1);
  assert.ok(Math.abs(movieTime(reverse) - .8) < 1e-10);
});

test('live playback reaches circulation and reverse reaches a paused assembled state', () => {
  const end = advancePlayback({...INITIAL_PLAYBACK, progress: .99, playing: true}, 1);
  assert.equal(end.progress, 1);
  assert.equal(end.looping, true);
  assert.equal(end.playing, true);
  const back = advancePlayback({...INITIAL_PLAYBACK, progress: .01, direction: -1, playing: true}, 1);
  assert.equal(back.progress, 0);
  assert.equal(back.looping, false);
  assert.equal(back.playing, false);
});

test('reduced motion action selects a still and explicit playback never starts automatic circulation', () => {
  const still = deconstruct(INITIAL_PLAYBACK, true);
  assert.equal(still.progress, 1);
  assert.equal(still.playing, false);
  assert.equal(still.looping, false);
  const explicit = togglePlayback(still, true);
  assert.equal(explicit.direction, -1);
  assert.equal(explicit.looping, false);
  const end = advancePlayback({...INITIAL_PLAYBACK, progress: .99, playing: true}, 1, true);
  assert.equal(end.looping, false);
  assert.equal(end.playing, false);
});
