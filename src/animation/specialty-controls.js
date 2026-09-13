/** UI actions follow actual playback, including a paused idle or reversed seek. */
export function specialtyControl(state) {
  if (!state || state.status !== 'ready' || state.reducedMotion)
    return {action:'unavailable',label:'Motion unavailable',disabled:true};
  if (state.moving) return {action:'pause',label:'Pause motion',disabled:false};
  if (state.progress === 0) return {action:'start',label:'Deconstruct',disabled:false};
  return {action:'resume',label:'Resume motion',disabled:false};
}

export function activateSpecialtyControl(runtime, onExpansionChange) {
  const state = runtime.state, control = specialtyControl(state);
  if (control.disabled) return;
  if (control.action === 'pause') { runtime.pause(); return; }
  if (control.action === 'start') {
    runtime.explode();
    onExpansionChange(1);
    return;
  }
  const destination = state.progress === 1 || state.direction > 0 ? 1 : 0;
  // Resuming a scrub must also update the surrounding slider/button target.
  // A paused idle already has the right target; preserve its exact sample.
  if (state.target !== destination) {
    runtime.setTarget(destination);
    onExpansionChange(destination);
  }
  runtime.play();
}
