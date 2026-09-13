export type Direction = 1 | -1;
export type PlaybackState = {
  progress: number;
  direction: Direction;
  playing: boolean;
  speed: number;
};
export const INITIAL_PLAYBACK: PlaybackState = {progress: 0, direction: 1, playing: false, speed: 1};
export const initialPlayback = (reducedMotion = false): PlaybackState => ({...INITIAL_PLAYBACK, playing: !reducedMotion});
export const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

export function nextDirection(state: PlaybackState): Direction {
  return state.playing ? (state.direction === 1 ? -1 : 1) : state.progress > .5 ? -1 : 1;
}

export function deconstruct(state: PlaybackState, reducedMotion = false): PlaybackState {
  const direction = nextDirection(state);
  return {...state, direction,
    progress: reducedMotion ? (direction === 1 ? 1 : 0) : state.progress,
    playing: !reducedMotion};
}

export function togglePlayback(state: PlaybackState): PlaybackState {
  if (state.playing) return {...state, playing: false};
  return {...state, playing: true, direction: state.progress >= 1 ? -1 : state.progress <= 0 ? 1 : state.direction};
}

/** Both films reverse at their endpoints; reduced motion plays only one leg. */
export function finishPlaybackLeg(state: PlaybackState, reducedMotion = false): PlaybackState {
  return {...state, progress: state.direction === 1 ? 1 : 0,
    direction: reducedMotion ? state.direction : state.direction === 1 ? -1 : 1,
    playing: !reducedMotion};
}

export function advancePlayback(state: PlaybackState, delta: number, reducedMotion = false, duration = 7.2): PlaybackState {
  if (!state.playing || delta <= 0) return state;
  const distance = delta * state.speed / duration;
  if (reducedMotion) {
    const progress = state.progress + distance * state.direction;
    return progress >= 1 || progress <= 0 ? finishPlaybackLeg(state, true) : {...state, progress};
  }
  // Reflect the travelled distance so a frame crossing either endpoint keeps
  // its remaining time, including across multiple full cycles.
  const phase = ((state.direction === 1 ? state.progress : 2 - state.progress) + distance) % 2;
  return {...state, progress: phase <= 1 ? phase : 2 - phase, direction: phase < 1 ? 1 : -1};
}

export function movieTime(state: PlaybackState, duration = 7.2) {
  return (state.direction === 1 ? state.progress : 1 - state.progress) * duration;
}
