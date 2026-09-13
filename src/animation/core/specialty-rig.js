const clamp=(n,a=0,b=1)=>Math.min(b,Math.max(a,n));
const ease=n=>{const t=clamp(n);return t*t*t*(t*(t*6-15)+10);};
const mix=(a,b,t)=>a+(b-a)*t;
export const TRANSITION_SECONDS=7.2;
export const MOTION_SECONDS=6.4;
export const phaseAtTime=time=>1-(1-clamp(time/MOTION_SECONDS))**2;

export function blenderVectorToRuntime([x,y,z]){return [x,z,-y];}
export function blenderQuaternionToRuntime([x,y,z,w]){return [x,z,-y,w];}

/** Translation of the collider shared by simulation, interpolation and render. */
export function sampleIceCenter(vessel,ice,phase){
  const center=ice.center,clearY=Math.max(vessel.rim+ice.verticalHalfExtent+.08,center[1]);
  const lift=ease((phase-.045)/.275),traverse=ease((phase-.32)/.32),settle=ease((phase-.64)/.28);
  const destination=ice.destination || [-1.75,1.75,.50];
  return [mix(center[0],destination[0],traverse),
    mix(mix(center[1],clearY,lift),destination[1],settle),
    mix(center[2],destination[2],traverse)];
}

/** One reproducible path for the actual large ice block and attached garnish. */
export function sampleSpecialtyRig(config, phase){
  const ice=config.ice, garnish=config.garnish;
  const iceCenter=ice.center;
  const minimumIceCenter=config.vessel.rim+ice.verticalHalfExtent+.08;
  // Garnish releases first; both aggregates clear the rim before traversing.
  const garnishLift=ease(phase/.20), garnishFan=ease((phase-.20)/.42);
  const clearGarnishY=minimumIceCenter+ice.verticalHalfExtent+garnish.anchor[1]-garnish.minimumY+.18;
  const garnishClear=[garnish.anchor[0],Math.max(clearGarnishY,garnish.anchor[1]),garnish.anchor[2]];
  const garnishEnd=garnish.destination || [2.12,5.28,.05];
  const garnishCenter=garnishClear.map((value,i)=>mix(mix(garnish.anchor[i],value,garnishLift),garnishEnd[i],garnishFan));
  const icePoint=sampleIceCenter(config.vessel,ice,phase);
  return {
    iceOffset:icePoint.map((value,i)=>value-iceCenter[i]),
    garnishOffset:garnishCenter.map((value,i)=>value-garnish.anchor[i]),
    iceCenter:icePoint, garnishCenter,
    // Effects describe preparation; no permanent flame/oil is left in the glass.
    preparationPulse:Math.sin(Math.PI*clamp((phase-.10)/.24))**2,
    modifierReveal:ease((phase-.35)/.35),
  };
}

export function updateIceCollider(box, config, phase){
  const pose=sampleSpecialtyRig(config,phase);
  box.center[0]=pose.iceCenter[0];box.center[1]=pose.iceCenter[1];box.center[2]=pose.iceCenter[2];
  return pose;
}
