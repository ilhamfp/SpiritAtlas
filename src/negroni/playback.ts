export type Direction = 1 | -1;
export type PlaybackState = {
  progress: number;
  direction: Direction;
  playing: boolean;
  speed: number;
  looping: boolean;
  idleTime: number;
};
export type IdleTimeline = {duration: number; sourceStart: number; sourceEnd: number};
export const DEFAULT_IDLE_TIMELINE: IdleTimeline = {duration: 2.4, sourceStart: 6.4, sourceEnd: 7.2};
export const INITIAL_PLAYBACK: PlaybackState = {progress: 0, direction: 1, playing: false, speed: 1, looping: false, idleTime: 0};
export const clampProgress = (value: number) => Math.max(0, Math.min(1, value));

// Match the original film's cosine turnaround, including when leaving its loop.
export function idleSampleProgress(time: number, duration = 7.2, timeline = DEFAULT_IDLE_TIMELINE) {
  const phase = ((time % timeline.duration) + timeline.duration) % timeline.duration;
  const blend = .5 - .5 * Math.cos(2 * Math.PI * phase / timeline.duration);
  return (timeline.sourceEnd + (timeline.sourceStart - timeline.sourceEnd) * blend) / duration;
}

export function nextDirection(state: PlaybackState): Direction {
  return state.looping ? -1 : state.playing ? (state.direction === 1 ? -1 : 1) : state.progress > .5 ? -1 : 1;
}

export function deconstruct(state: PlaybackState, reducedMotion = false, duration = 7.2, timeline = DEFAULT_IDLE_TIMELINE): PlaybackState {
  const direction = nextDirection(state);
  return {...state, direction, looping: false, idleTime: 0,
    progress: reducedMotion ? (direction === 1 ? 1 : 0) : state.looping ? idleSampleProgress(state.idleTime, duration, timeline) : state.progress,
    playing: !reducedMotion};
}

export function togglePlayback(state: PlaybackState, reducedMotion = false): PlaybackState {
  if (state.playing) return {...state, playing: false};
  if (state.progress >= 1 && !state.looping) {
    return {...state, playing: true, direction: reducedMotion ? -1 : 1, looping: !reducedMotion, idleTime: 0};
  }
  return {...state, playing: true, direction: state.progress <= 0 ? 1 : state.direction};
}

export function advancePlayback(state: PlaybackState, delta: number, reducedMotion = false, duration = 7.2, timeline = DEFAULT_IDLE_TIMELINE): PlaybackState {
  if (!state.playing) return state;
  if (state.looping) return {...state, idleTime: (state.idleTime + delta * state.speed) % timeline.duration};
  const progress = clampProgress(state.progress + delta * state.speed * state.direction / duration);
  if (progress === 1 && state.direction === 1) return {...state, progress, looping: !reducedMotion, playing: !reducedMotion, idleTime: 0};
  if (progress === 0 && state.direction === -1) return {...state, progress, playing: false};
  return {...state, progress};
}

export function movieTime(state: PlaybackState, duration = 7.2) {
  return state.looping ? state.idleTime : (state.direction === 1 ? state.progress : 1 - state.progress) * duration;
}
