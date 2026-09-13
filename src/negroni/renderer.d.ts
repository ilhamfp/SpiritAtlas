export interface NegroniRendererOptions {
  onReady?: () => void;
  onError?: (error: unknown) => void;
  onOrbit?: () => void;
  /** Aborts pending asset requests and disposes the scene on unmount. */
  signal?: AbortSignal;
}

export interface NegroniRenderer {
  /** Sample the full fluid timeline. Rig defaults to its recorded choreography. */
  setPose(progress: number, rigProgress?: number): void;
  /** Orbit horizontally, in radians. */
  rotate(delta: number): void;
  resetCamera(): void;
  setVisible(visible: boolean): void;
  dispose(): void;
}

export function createNegroniRenderer(
  container: HTMLElement,
  options?: NegroniRendererOptions,
): Promise<NegroniRenderer>;
