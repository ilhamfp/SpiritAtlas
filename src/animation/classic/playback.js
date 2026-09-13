import {idleSampleProgress, IDLE_TIMELINE} from './core/liquid-idle.js';
const duration=7.2;
const clamp=n=>n<1e-12?0:n>1-1e-12?1:n;
/** Instance-owned playback clock. The cached renderer remains the authority for rig pose. */
export function createClassicPlayback({id,reducedMotion=false,onChange=()=>{}}={}){
 let progress=0,direction=1,playing=false,looping=false,idleTime=0,speed=1,target=0,disposed=false;
 const read=()=>({id,status:disposed?'disposed':'ready',progress,sampleProgress:looping?idleSampleProgress(idleTime):progress,rigProgress:looping?1:1-(1-Math.min(1,progress*duration/6.4))**2,direction,playing,looping,idleTime,speed,target,reducedMotion,idleEnabled:true,moving:playing&&!reducedMotion,duration});
 const notify=()=>onChange(read());
 function exitIdle(){if(looping){progress=idleSampleProgress(idleTime);looping=false;idleTime=0;}}
 function seek(value){if(!Number.isFinite(value))throw new Error('Invalid progress');const next=clamp(value);if(next!==progress)direction=next>progress?1:-1;progress=target=next;looping=false;idleTime=0;playing=false;notify();}
 function setTarget(value){if(!Number.isFinite(value))throw new Error('Invalid target');value=clamp(value);if(value!==0&&value!==1){seek(value);return;}if(reducedMotion){seek(value);return;}if(value===1&&looping){target=1;return;}exitIdle();target=value;direction=value>=progress?1:-1;playing=progress!==value;if(value===1&&progress===1){looping=true;playing=true;idleTime=0;}notify();}
 const api={get state(){return read();},read,
  update(dt){if(disposed||!playing||reducedMotion||!Number.isFinite(dt)||dt<=0)return false;
   if(looping)idleTime=(idleTime+dt*speed)%IDLE_TIMELINE.duration;
   else{progress=clamp(progress+direction*dt*speed/duration);if(progress===1&&direction>0){looping=true;idleTime=0;}else if(progress===0&&direction<0)playing=false;}notify();return true;},
  setTarget,seek,pause(){playing=false;notify();},play(){if(reducedMotion||disposed)return;if(progress===1&&direction>0&&!looping){looping=true;idleTime=0;}if(progress===0&&direction<0)direction=1;target=direction>0?1:0;playing=true;notify();},
  explode(){setTarget(1);},assemble(){setTarget(0);},reverse(){setTarget(direction>0?0:1);},reset(){seek(0);},
  setSpeed(value){if(!Number.isFinite(value)||value<=0)throw new Error('Invalid speed');speed=value;notify();},
  setReducedMotion(value){reducedMotion=!!value;if(reducedMotion)playing=false;notify();},
  restorePlayback(state){
   if(!state||state.id&&state.id!==id||!['progress','sampleProgress','idleTime','speed','direction'].every(k=>Number.isFinite(state[k]))||state.progress<0||state.progress>1||state.sampleProgress<0||state.sampleProgress>1||state.idleTime<0||state.speed<=0||![1,-1].includes(state.direction)||typeof state.playing!=='boolean'||typeof state.looping!=='boolean')throw new Error('Invalid playback state');
   const expected=state.looping?idleSampleProgress(state.idleTime):state.progress;
   if(state.looping&&state.progress!==1||Math.abs(expected-state.sampleProgress)>1e-6)throw new Error('Playback sample does not match its clock');
   if(state.target!==undefined&&(!Number.isFinite(state.target)||state.target<0||state.target>1))throw new Error('Invalid target');
   progress=state.progress;direction=state.direction;idleTime=state.idleTime;speed=state.speed;looping=state.looping;target=state.target??(direction>0?1:0);playing=state.playing&&!reducedMotion;notify();
  },dispose(){disposed=true;playing=false;}
 };return api;
}
