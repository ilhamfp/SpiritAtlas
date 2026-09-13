export const IDLE_TIMELINE={duration:2.4,sourceStart:6.4,sourceEnd:7.2};

/** A smooth turnaround makes the recorded circulation loop without a pose jump. */
export function idleSampleTime(time,timeline=IDLE_TIMELINE){
  const phase=((time%timeline.duration)+timeline.duration)%timeline.duration;
  const blend=.5-.5*Math.cos(2*Math.PI*phase/timeline.duration);
  return timeline.sourceEnd+(timeline.sourceStart-timeline.sourceEnd)*blend;
}

export function idleSampleProgress(time,duration=7.2,timeline=IDLE_TIMELINE){
  return idleSampleTime(time,timeline)/duration;
}
