import {IDLE_TIMELINE,idleSampleProgress} from './core/liquid-idle.js';
import {phaseAtTime} from './core/specialty-rig.js';

const IDS=['bbf-negroni','ichigo-negroni','negroni-express'];
const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const finite=(value,label)=>{if(!Number.isFinite(value))throw new Error(`Invalid ${label}`);return value;};
const sameOrigin=(url,base)=>{const result=new URL(url,base);if(result.origin!==new URL(base).origin)throw new Error('Cinematic assets must share the manifest origin');return result;};

export function validateCinematicManifest(manifest,{id,manifestUrl,baseUrl,expectedModelSha256}={}){
  if(!IDS.includes(id)||manifest?.drinkId!==id||manifest.schemaVersion!==1)throw new Error('Cinematic drink identity does not match');
  if(manifest.fps!==60||manifest.frameCount!==433||manifest.idleFrameCount!==144||manifest.duration!==7.2||manifest.idleDuration!==2.4||!Number.isFinite(manifest.mediaDuration)||Math.abs(manifest.mediaDuration-433/60)>1e-8)throw new Error('Cinematic timeline is not the required native 60 fps sequence');
  if(!/^[a-f0-9]{20}$/.test(manifest.version))throw new Error('Cinematic manifest has no immutable version');
  const base=new URL(manifestUrl,baseUrl),prefix=`/cinematic/specialty/${id}/${manifest.version}/`;
  if(base.pathname!==`${prefix}manifest.json`)throw new Error('Cinematic manifest URL does not match its drink/version');
  const sources={};
  for(const name of ['forward','reverse','idle','poster']){
    const url=sameOrigin(manifest[name],base);
    if(url.pathname!==`${prefix}${name==='poster'?'poster.png':`${name}.mp4`}`||!/^([a-f0-9]{64})$/.test(manifest.sha256?.[name]||''))throw new Error('Cinematic assets do not share one immutable bundle');
    sources[name]=url.href;
  }
  if(expectedModelSha256&&manifest.sourceModelSha256!==expectedModelSha256)throw new Error('Cinematic model hash does not match the visible model');
  return sources;
}

/** Instance-scoped video controller. It creates no global controls or selectors. */
export async function createSpecialtyCinematic(container,options){
  const {id,manifestUrl,onStateChange,onModeChange,onUnavailable}=options;
  if(!container?.ownerDocument)throw new Error('Supply a mounted cinematic container');
  const document=container.ownerDocument,fetcher=options.fetch||globalThis.fetch;
  const response=await fetcher(manifestUrl,{signal:options.signal});
  if(!response.ok)throw new Error(`Cinematic manifest unavailable (${response.status})`);
  const manifest=await response.json();
  const sources=validateCinematicManifest(manifest,{id,manifestUrl,baseUrl:document.baseURI,expectedModelSha256:options.expectedModelSha256});
  if(options.signal?.aborted)throw new Error('Cinematic creation aborted');
  const layer=document.createElement('div');layer.className='specialty-cinematic';layer.dataset.drink=id;
  layer.setAttribute('role','img');layer.setAttribute('aria-label',options.label||'Cinematic cocktail ingredient animation');
  Object.assign(layer.style,{position:'absolute',inset:'0',overflow:'hidden',pointerEvents:'none',background:'#16130f'});
  const videos={};
  for(const name of ['forward','reverse','idle']){
    const video=document.createElement('video');video.src=sources[name];video.preload='auto';video.muted=true;video.playsInline=true;video.controls=false;
    video.loop=name==='idle';video.hidden=name!=='forward';video.dataset.sequence=name;video.setAttribute('aria-hidden','true');
    Object.assign(video.style,{position:'absolute',width:'100%',height:'100%',inset:'0',objectFit:'contain'});
    if(name==='forward')video.poster=sources.poster;layer.appendChild(video);videos[name]=video;
  }
  container.appendChild(layer);
  let active=options.active!==false,status='loading',error=null,disposed=false,current=videos.forward,sequence='forward';
  let progress=0,sampleProgress=0,direction=1,speed=1,target=0,looping=false,idleTime=0,wantsPlay=false,seekTarget=null,playRequest=0;
  let idleEnabled=options.idleEnabled!==false,reducedMotion=!!options.reducedMotion;
  let frameRequest=null,baseline=null,lastNotice=-Infinity;
  const removers=[],metrics={fps:null,presentedFrames:0,droppedFrames:0,method:typeof current.requestVideoFrameCallback==='function'?'video-frame-callback':'unavailable'};
  function listen(video,event,callback){video.addEventListener(event,callback);removers.push(()=>video.removeEventListener(event,callback));}
  function sync(){
    if(active&&!disposed&&seekTarget===null&&!current.seeking&&current.readyState>=2){
      if(looping)idleTime=((current.currentTime%manifest.idleDuration)+manifest.idleDuration)%manifest.idleDuration;
      else progress=clamp(direction>0?current.currentTime/manifest.duration:1-current.currentTime/manifest.duration);
    }
    sampleProgress=looping?idleSampleProgress(idleTime,manifest.duration,IDLE_TIMELINE):progress;
  }
  function read(){sync();return {id,status,available:status==='ready',error,active,progress:looping?1:progress,sampleProgress,
    rigProgress:looping?1:phaseAtTime(sampleProgress*manifest.duration),time:sampleProgress*manifest.duration,transitionTime:(looping?1:progress)*manifest.duration,
    duration:manifest.duration,direction,speed,target,playing:active&&wantsPlay&&!reducedMotion&&status!=='unavailable'&&!disposed,
    looping,idleTime,reducedMotion,idleEnabled,moving:active&&wantsPlay&&!reducedMotion&&status==='ready',sequence};}
  function notify(){if(!disposed)onStateChange?.(read());}
  function resetMetrics(){baseline=null;metrics.fps=null;layer.dataset.fps='';layer.dataset.fpsMethod=metrics.method;current.dataset.fps='';}
  function stopFrames(){if(frameRequest!==null){current.cancelVideoFrameCallback?.(frameRequest);frameRequest=null;}}
  function observe(){
    stopFrames();resetMetrics();
    if(!active||disposed||typeof current.requestVideoFrameCallback!=='function')return;
    const observed=current;
    const presented=(now,metadata)=>{
      frameRequest=null;if(disposed||observed!==current||!active)return;
      metrics.presentedFrames=metadata.presentedFrames;metrics.droppedFrames=current.getVideoPlaybackQuality?.().droppedVideoFrames??0;
      const timestamp=metadata.expectedDisplayTime;
      if(wantsPlay&&!current.seeking&&seekTarget===null){
        if(!baseline)baseline={time:timestamp,frame:metadata.presentedFrames};
        else if(timestamp-baseline.time>=1000){metrics.fps=(metadata.presentedFrames-baseline.frame)*1000/(timestamp-baseline.time);baseline={time:timestamp,frame:metadata.presentedFrames};}
      }else baseline=null;
      for(const element of [layer,current]){element.dataset.fps=metrics.fps===null?'':metrics.fps.toFixed(1);element.dataset.fpsMethod=metrics.method;
        element.dataset.presentedFrames=String(metrics.presentedFrames);element.dataset.droppedFrames=String(metrics.droppedFrames);element.dataset.presentedAt=String(timestamp);}
      // Video presentation drives measurement. React notices are throttled only;
      // callers can read the exact visible time whenever their UI needs it.
      if(now-lastNotice>=80){lastNotice=now;notify();}
      frameRequest=current.requestVideoFrameCallback(presented);
    };
    frameRequest=current.requestVideoFrameCallback(presented);
  }
  function fail(reason){if(disposed||status==='unavailable')return;const previous=read();error=reason instanceof Error?reason.message:String(reason);status='unavailable';wantsPlay=false;playRequest++;
    Object.values(videos).forEach(video=>video.pause());stopFrames();active=false;layer.hidden=true;onUnavailable?.(new Error(error));onModeChange?.(false,previous);notify();}
  function targetTime(){return looping?idleTime:(direction>0?progress:1-progress)*manifest.duration;}
  function applySeek(){
    if(seekTarget===null||current.readyState<1)return;
    const value=seekTarget;
    try{current.currentTime=value;seekTarget=null;}catch(reason){fail(reason);}
  }
  function applyPlay(){
    const request=++playRequest;
    if(!active||!wantsPlay||reducedMotion||disposed||status==='unavailable'){current.pause();return;}
    const video=current;
    try{Promise.resolve(video.play()).catch(reason=>{if(disposed||request!==playRequest||video!==current)return;wantsPlay=false;error=reason?.message||'Video playback was interrupted';notify();});}
    catch(reason){if(request===playRequest){wantsPlay=false;error=String(reason);notify();}}
  }
  function select({seek=true}={}){
    const name=looping?'idle':direction>0?'forward':'reverse',next=videos[name];
    if(current!==next){stopFrames();current.pause();current=next;sequence=name;Object.values(videos).forEach(video=>video.hidden=video!==current);status=current.readyState>=2?'ready':'loading';}
    current.playbackRate=speed;
    if(seek){seekTarget=targetTime();applySeek();}
    layer.dataset.sequence=sequence;layer.dataset.state=looping?'circulating':direction>0?'deconstructing':'reassembling';
    layer.hidden=!active;observe();applyPlay();notify();
  }
  function leaveIdle(){sync();if(looping){progress=sampleProgress;looping=false;idleTime=0;}}
  function seek(value){if(disposed)return;const previous=read().sampleProgress;progress=clamp(finite(value,'progress'));sampleProgress=progress;target=progress;direction=progress>=previous?1:-1;looping=false;idleTime=0;wantsPlay=false;select();}
  function endpoint(value){if(disposed)return;if(reducedMotion){seek(value);return;}if(value===1&&looping){target=1;wantsPlay=true;select({seek:false});return;}
    leaveIdle();target=value;direction=value===1?1:-1;looping=value===1&&progress===1&&idleEnabled;idleTime=0;wantsPlay=progress!==value||looping;select();}
  function restorePlayback(state={}){
    if(disposed)return;
    // Match the runtime's complete handoff contract and reject an inconsistent
    // visible sample before altering any currently playing video.
    for(const key of ['progress','sampleProgress','direction','idleTime','speed'])finite(state[key],key);
    if(state.id&&state.id!==id)throw new Error('Cannot restore playback from another drink');
    if(state.progress<0||state.progress>1||state.sampleProgress<0||state.sampleProgress>1||![-1,1].includes(state.direction)||state.idleTime<0||state.speed<.1||state.speed>4||typeof state.playing!=='boolean'||typeof state.looping!=='boolean')throw new Error('Invalid specialty playback state');
    const expectedSample=state.looping?idleSampleProgress(state.idleTime,manifest.duration,IDLE_TIMELINE):state.progress;
    if((state.looping&&Math.abs(state.progress-1)>1e-8)||Math.abs(state.sampleProgress-expectedSample)>1e-8)throw new Error('Playback sample does not match its transition/idle clock');
    read();speed=state.speed;direction=state.direction;
    if(state.reducedMotion!==undefined)reducedMotion=!!state.reducedMotion;
    if(state.idleEnabled!==undefined)idleEnabled=!!state.idleEnabled;
    looping=state.looping;
    progress=state.progress;
    idleTime=((state.idleTime%manifest.idleDuration)+manifest.idleDuration)%manifest.idleDuration;
    if(looping)progress=1;
    target=clamp(finite(state.target??(direction>0?1:0),'target'));wantsPlay=!!state.playing&&!reducedMotion;select();
  }
  function setActive(value,state){const previous=read();if(disposed)return previous;
    playRequest++;Object.values(videos).forEach(video=>video.pause());stopFrames();active=!!value;layer.hidden=!active;
    if(state)restorePlayback(state);else {observe();applyPlay();notify();}
    onModeChange?.(active,previous);return previous;
  }
  const controller={layer,manifest,read,restorePlayback,setActive,setMode:setActive,
    get active(){return active;},get state(){return read();},get metrics(){return {...metrics};},
    setTarget(value){value=clamp(finite(value,'target'));if(value===0||value===1)endpoint(value);else seek(value);},seek,
    play(){if(disposed||reducedMotion)return;sync();if(progress===1&&!looping){if(!idleEnabled)return;looping=true;idleTime=0;direction=1;}else if(progress===0)direction=1;target=direction>0?1:0;wantsPlay=true;select();},
    pause(){if(disposed)return;sync();wantsPlay=false;playRequest++;current.pause();resetMetrics();notify();},
    reverse(){if(disposed)return;const wasIdle=looping;leaveIdle();direction=wasIdle?-1:-direction;target=direction>0?1:0;if(reducedMotion){seek(target);return;}wantsPlay=true;select();},
    explode(){endpoint(1);},assemble(){endpoint(0);},reset(){seek(0);direction=1;select();},
    setSpeed(value){sync();speed=clamp(finite(value,'speed'),.1,4);current.playbackRate=speed;resetMetrics();notify();},
    setReducedMotion(value){reducedMotion=!!value;if(reducedMotion)controller.pause();else notify();},
    setIdleEnabled(value){idleEnabled=!!value;if(!idleEnabled&&looping){leaveIdle();wantsPlay=false;select();}else notify();},
    dispose(){if(disposed)return;disposed=true;status='disposed';active=false;wantsPlay=false;playRequest++;stopFrames();removers.forEach(remove=>remove());options.signal?.removeEventListener('abort',controller.dispose);
      Object.values(videos).forEach(video=>{video.pause();video.removeAttribute('src');video.load();});layer.remove();}
  };
  for(const [name,video] of Object.entries(videos)){
    listen(video,'loadedmetadata',()=>{if(status==='unavailable')return;const duration=name==='idle'?manifest.idleDuration:manifest.mediaDuration;
      if(!Number.isFinite(video.duration)||Math.abs(video.duration-duration)>.003){fail(new Error(`Invalid ${name} movie duration`));return;}if(video===current)applySeek();});
    listen(video,'loadeddata',()=>{if(status!=='unavailable'&&video===current){status='ready';applySeek();applyPlay();notify();}});
    listen(video,'seeked',()=>{if(video===current){resetMetrics();notify();}});
    listen(video,'timeupdate',()=>{if(video===current&&active&&metrics.method==='unavailable')notify();});
    listen(video,'ended',()=>{if(video!==current||!active||looping||disposed)return;progress=direction>0?1:0;sampleProgress=progress;seekTarget=null;
      if(direction>0&&idleEnabled&&!reducedMotion){looping=true;idleTime=0;wantsPlay=true;select();}else {wantsPlay=false;resetMetrics();notify();}});
    listen(video,'error',()=>fail(new Error(`Cinematic ${name} video failed to load`)));
  }
  options.signal?.addEventListener('abort',controller.dispose,{once:true});
  restorePlayback(options.initialState||{progress:0,sampleProgress:0,playing:false,looping:false,idleTime:0,speed:1,direction:1,target:0});return controller;
}
