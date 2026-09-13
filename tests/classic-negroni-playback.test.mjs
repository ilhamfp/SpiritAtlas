import test from 'node:test';
import assert from 'node:assert/strict';
import {advancePlayback, deconstruct, finishPlaybackLeg, INITIAL_PLAYBACK, movieTime, togglePlayback} from '../src/negroni/playback.ts';

const close = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} should equal ${expected}`);

test('the reverse film resumes at the identical pose when reversing mid-transition', () => {
  const forward = {...INITIAL_PLAYBACK, playing: true, progress: .37};
  const reverse = deconstruct(forward);
  assert.equal(reverse.direction, -1);
  assert.equal(reverse.progress, .37);
  close(movieTime(forward) + movieTime(reverse), 7.2);
  assert.equal(deconstruct(reverse).direction, 1);
});

test('pausing and resuming preserves position, direction and playback speed', () => {
  const moving = {...INITIAL_PLAYBACK, progress: .65, direction: -1, playing: true, speed: .25};
  const paused = togglePlayback(moving);
  assert.equal(paused.playing, false);
  assert.deepEqual(advancePlayback(paused, .6), paused);
  assert.deepEqual(togglePlayback(paused), moving);
});

test('each film endpoint reverses into the next leg without stopping playback', () => {
  const expanded = finishPlaybackLeg({...INITIAL_PLAYBACK, playing: true});
  assert.equal(expanded.progress, 1);
  assert.equal(expanded.direction, -1);
  assert.equal(expanded.playing, true);
  assert.equal(movieTime(expanded), 0);
  const assembled = finishPlaybackLeg(expanded);
  assert.equal(assembled.progress, 0);
  assert.equal(assembled.direction, 1);
  assert.equal(assembled.playing, true);
  assert.equal(movieTime(assembled), 0);
});

test('live playback continuously traverses 0 to 100 to 0 and starts again', () => {
  const start = {...INITIAL_PLAYBACK, playing: true};
  const top = advancePlayback(start, 7.2);
  close(top.progress, 1);
  assert.equal(top.direction, -1);
  const bottom = advancePlayback(top, 7.2);
  close(bottom.progress, 0);
  assert.equal(bottom.direction, 1);
  const again = advancePlayback(bottom, 3.6);
  close(again.progress, .5);
  assert.equal(again.playing, true);
});

test('live turnaround retains overshoot time and respects playback speed', () => {
  const end = advancePlayback({...INITIAL_PLAYBACK, progress: .98, playing: true, speed: .5}, .576);
  close(end.progress, .98);
  assert.equal(end.direction, -1);
  const start = advancePlayback({...INITIAL_PLAYBACK, progress: .02, direction: -1, playing: true, speed: .5}, .576);
  close(start.progress, .02);
  assert.equal(start.direction, 1);
  close(advancePlayback({...INITIAL_PLAYBACK, playing: true}, 7.2 * 4.25).progress, .25);
});

test('explicit playback at either endpoint starts in the available direction', () => {
  assert.equal(togglePlayback({...INITIAL_PLAYBACK, progress: 1}).direction, -1);
  assert.equal(togglePlayback({...INITIAL_PLAYBACK, direction: -1}).direction, 1);
});

test('reduced motion keeps still actions and stops explicit playback at the next endpoint', () => {
  const still = deconstruct(INITIAL_PLAYBACK, true);
  assert.equal(still.progress, 1);
  assert.equal(still.playing, false);
  const explicit = togglePlayback(still);
  assert.equal(explicit.direction, -1);
  const back = advancePlayback(explicit, 8, true);
  assert.equal(back.progress, 0);
  assert.equal(back.playing, false);
  const end = advancePlayback({...INITIAL_PLAYBACK, progress: .99, playing: true}, 1, true);
  assert.equal(end.progress, 1);
  assert.equal(end.playing, false);
});
