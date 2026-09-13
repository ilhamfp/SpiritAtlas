export interface SpecialtyPlaybackState {
  id?: string;
  progress: number;
  sampleProgress: number;
  direction: number;
  idleTime: number;
  speed: number;
  playing: boolean;
  looping: boolean;
  target?: number;
  reducedMotion?: boolean;
  idleEnabled?: boolean;
}
export interface SpecialtyCinematicState extends SpecialtyPlaybackState {
  id: string;
  status: 'loading' | 'ready' | 'unavailable' | 'disposed';
  available: boolean;
  active: boolean;
  error: string | null;
  rigProgress: number;
  time: number;
  transitionTime: number;
  duration: number;
  target: number;
  reducedMotion: boolean;
  idleEnabled: boolean;
  moving: boolean;
  sequence: 'forward' | 'reverse' | 'idle';
}
export interface SpecialtyCinematicManifest {
  schemaVersion: 1;
  drinkId: string;
  version: string;
  sourceModelSha256?: string;
  fps: 60;
  frameCount: 433;
  idleFrameCount: 144;
  duration: 7.2;
  mediaDuration: number;
  idleDuration: 2.4;
  forward: string;
  reverse: string;
  idle: string;
  poster: string;
  sha256: { forward: string; reverse: string; idle: string; poster: string };
}
export interface SpecialtyCinematicOptions {
  id: string;
  manifestUrl: string;
  expectedModelSha256?: string;
  label?: string;
  initialState?: SpecialtyPlaybackState;
  active?: boolean;
  idleEnabled?: boolean;
  reducedMotion?: boolean;
  signal?: AbortSignal;
  onStateChange?: (state: SpecialtyCinematicState) => void;
  /** On deactivation, receives the visible pre-pause state for runtime handoff. */
  onModeChange?: (active: boolean, previous: SpecialtyCinematicState) => void;
  onUnavailable?: (error: Error) => void;
  fetch?: typeof globalThis.fetch;
}
export interface SpecialtyCinematic {
  readonly layer: HTMLDivElement;
  readonly manifest: SpecialtyCinematicManifest;
  readonly active: boolean;
  readonly state: SpecialtyCinematicState;
  readonly metrics: { fps: number | null; presentedFrames: number; droppedFrames: number; method: string };
  read(): SpecialtyCinematicState;
  restorePlayback(state: SpecialtyPlaybackState): void;
  setActive(active: boolean, state?: SpecialtyPlaybackState): SpecialtyCinematicState;
  setMode(active: boolean, state?: SpecialtyPlaybackState): SpecialtyCinematicState;
  setTarget(value: number): void;
  seek(value: number): void;
  play(): void;
  pause(): void;
  reverse(): void;
  explode(): void;
  assemble(): void;
  reset(): void;
  setSpeed(value: number): void;
  setReducedMotion(value: boolean): void;
  setIdleEnabled(value: boolean): void;
  dispose(): void;
}
export function validateCinematicManifest(manifest: unknown, options: { id: string; manifestUrl: string; baseUrl: string; expectedModelSha256?: string }): Record<'forward' | 'reverse' | 'idle' | 'poster', string>;
export function createSpecialtyCinematic(container: HTMLElement, options: SpecialtyCinematicOptions): Promise<SpecialtyCinematic>;
