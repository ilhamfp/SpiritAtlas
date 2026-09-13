export type SpecialtyControlAction = 'unavailable' | 'start' | 'pause' | 'resume';
/** Shared structural subset used by both the simulation and native video. */
export interface SpecialtyControlState {
  status: string;
  reducedMotion: boolean;
  moving: boolean;
  progress: number;
  direction: number;
  target: number;
}
export interface SpecialtyMotionController {
  readonly state: SpecialtyControlState;
  pause(): void;
  explode(): void;
  setTarget(value: number): void;
  play(): void;
}
export function specialtyControl(state:SpecialtyControlState|null):{action:SpecialtyControlAction;label:string;disabled:boolean};
export function activateSpecialtyControl(runtime:SpecialtyMotionController,onExpansionChange:(value:number)=>void):void;
