import {useEffect,useRef,useState} from 'react';
import {Minus,Pause,Play,Plus,RotateCcw} from 'lucide-react';
import type {ViewerProps,Orbit} from './Viewer';
import type {CategoryId} from '../data/drinks';
import type {ClassicVariant} from '../animation/classic-variants.js';
import {createClassicPlayback} from '../animation/classic/playback.js';
import type {ClassicPlayback} from '../animation/classic/playback.js';
import {createNegroniRenderer} from '../animation/classic/renderer.js';
import type {NegroniRenderer,RenderFrame} from '../animation/classic/renderer.js';
import type {GarnishVariantId} from '../animation/classic/variant-garnish.js';
import {createVariantGarnish} from '../animation/classic/variant-garnish.js';
import {createSpecialtyCinematic} from '../animation/specialty-cinematic.js';
import type {SpecialtyCinematic,SpecialtyPlaybackState} from '../animation/specialty-cinematic.js';
import {specialtyControl,activateSpecialtyControl} from '../animation/specialty-controls.js';
import {useViewerVisibility} from './useViewerVisibility';
const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));

/** Each card owns one classic scene and clock; the Atlas controls remain shared. */
export function ClassicVariantViewer(props:ViewerProps&{variant:ClassicVariant}){
 const {variant,drinkId}=props;
 const latest=useRef(props);latest.current=props;
 const host=useRef<HTMLDivElement>(null),liveHost=useRef<HTMLDivElement>(null),filmHost=useRef<HTMLDivElement>(null),rail=useRef<HTMLDivElement>(null),lines=useRef<SVGSVGElement>(null),telemetry=useRef<HTMLOutputElement>(null);
 const legend=useRef<HTMLDivElement>(null);
 const [ready,setReady]=useState(false),[error,setError]=useState<string|null>(null),[attempt,setAttempt]=useState(0);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 const reducedRef=useRef(reduced);reducedRef.current=reduced;
 const onScreen=useViewerVisibility(host),visible=onScreen&&props.active!==false,visibleRef=useRef(visible);visibleRef.current=visible;
 const renderer=useRef<NegroniRenderer|null>(null),clock=useRef<ClassicPlayback|null>(null),film=useRef<SpecialtyCinematic|null>(null);
 const [filmAvailable,setFilmAvailable]=useState(false),[mode,setMode]=useState<'live'|'cinematic'>('live'),modeRef=useRef<'live'|'cinematic'>('live');
 useEffect(()=>{if(ready||filmAvailable)props.onSupportChange?.(true);else if(error)props.onSupportChange?.(false)},[ready,filmAvailable,error,props.onSupportChange]);
 const [action,setAction]=useState('unavailable');const wake=useRef<()=>void>(()=>{});
 const hiddenFilm=useRef<SpecialtyPlaybackState|null>(null);
 const active=()=>modeRef.current==='cinematic'?film.current:clock.current;
 const publish=()=>{
  const state=active()?.state;if(!state)return;
  if(legend.current)legend.current.hidden=modeRef.current!=='cinematic'||state.rigProgress<.68;
  const next=specialtyControl(state).action;setAction(old=>old===next?old:next);
  if(host.current){const d=host.current.dataset;d.currentPhase=String(state.progress);d.sampleProgress=String(state.sampleProgress);d.rigProgress=String(state.rigProgress);d.playing=String(state.playing);d.looping=String(state.looping);}
  const output=telemetry.current;if(output){output.dataset.mode=modeRef.current;output.dataset.progress=String(state.progress);output.dataset.sampleProgress=String(state.sampleProgress);output.dataset.looping=String(state.looping);output.dataset.playing=String(state.playing);
   const metrics=film.current?.metrics;const fps=modeRef.current==='cinematic'?metrics?.fps:renderer.current?.state.fps;
   output.dataset.fps=fps==null?'':fps.toFixed(1);output.dataset.fpsMethod=modeRef.current==='cinematic'?(metrics?.method??'video-frame-callback'):'completed-webgl-frame';
   output.value=!state.playing?'Paused':fps==null?'Measuring fps':`${Math.round(fps)} fps`;
  }
 };
 const switchMode=useRef<(next:'live'|'cinematic',snapshot?:SpecialtyPlaybackState)=>void>(()=>{});
 switchMode.current=(next,override)=>{
  if(next===modeRef.current&&!override)return;
  if(next==='cinematic'&&(!film.current||film.current.state.status==='unavailable'))return;
  const previous=override??hiddenFilm.current??active()?.state;hiddenFilm.current=null;
  const state=previous?{...previous,reducedMotion:reducedRef.current,playing:previous.playing&&!reducedRef.current}:undefined;
  modeRef.current=next;
  if(next==='live'){film.current?.setActive(false);if(state)clock.current?.restorePlayback(state);renderer.current?.setVisible(visibleRef.current);wake.current();}
  else {clock.current?.pause();renderer.current?.setVisible(false);film.current?.setActive(true,state);if(!visibleRef.current&&film.current){hiddenFilm.current=film.current.read();film.current.pause();}}
  setMode(next);publish();
 };
 useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(mq.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change)},[]);
 useEffect(()=>{
  const container=liveHost.current;if(!container)return;
  const abort=new AbortController();let cancelled=false,instance:NegroniRenderer|null=null,raf=0,lastTime=0,ticking=false;
  setReady(false);setError(null);
  const playback=createClassicPlayback({id:drinkId,reducedMotion:reducedRef.current,onChange:state=>{
   if(modeRef.current==='live'){instance?.setPose(state.sampleProgress,state.looping?1:undefined);publish();wake.current();}
  }});clock.current=playback;
  const tick=(now:number)=>{raf=0;if(cancelled||modeRef.current!=='live'||!visibleRef.current||!instance)return;
   const dt=lastTime?(now-lastTime)/1000:0;lastTime=now;
   ticking=true;playback.update(Math.min(dt,.1));ticking=false;if(playback.state.moving)raf=requestAnimationFrame(tick);else lastTime=0;
  };
  wake.current=()=>{if(!raf&&!ticking&&!cancelled&&instance&&visibleRef.current&&modeRef.current==='live'&&playback.state.moving){lastTime=0;raf=requestAnimationFrame(tick);}};
  let labelWidth=0;const labelHeights=new Map<HTMLElement,number>();
  function frame(info:RenderFrame){
   if(cancelled)return;publish();
   if(telemetry.current){telemetry.current.dataset.renderedFrames=String(info.renderedFrames);telemetry.current.dataset.renderedAt=String(info.renderedAt);}
   const width=container!.clientWidth,height=container!.clientHeight;let previous=15;
   if(width!==labelWidth){labelWidth=width;labelHeights.clear();}
   const labels=Array.from(rail.current?.children??[]) as HTMLElement[];
   labels.sort((a,b)=>(info.anchors[a.dataset.anchor!]?.y??0)-(info.anchors[b.dataset.anchor!]?.y??0));
   for(const label of labels){const point=info.anchors[label.dataset.anchor!];if(!point)continue;
    if(!labelHeights.has(label))labelHeights.set(label,label.offsetHeight+10);
    const y=clamp(Math.max(point.y,previous),24,height-95);previous=y+Math.max(37,labelHeights.get(label)!);
    const shown=modeRef.current==='live'&&info.rigProgress>.68&&point.visible;label.style.transform=`translate3d(0,${y-15}px,0)`;label.style.opacity=shown?'1':'0';label.style.pointerEvents=shown?'auto':'none';label.tabIndex=shown?0:-1;
    const path=lines.current?.querySelector(`[data-anchor="${label.dataset.anchor}"]`);path?.setAttribute('d',`M ${Math.min(width*.28,135)} ${y} L ${Math.min(width*.28,135)+12} ${y} L ${point.x.toFixed(1)} ${point.y.toFixed(1)}`);path?.setAttribute('opacity',shown?'.5':'0');
   }
  }
  // Establish URL/parent intent before either asynchronous renderer can resolve.
  playback.setTarget(latest.current.expansion);
  createNegroniRenderer(container,{id:drinkId,label:variant.name,palette:variant,signal:abort.signal,reducedMotion:reducedRef.current,
   garnishFactory:(three,classic)=>createVariantGarnish(three,drinkId as GarnishVariantId,classic),onFrame:frame,
   onOrbitChange:orbit=>latest.current.onOrbitChange(orbit),onError:problem=>{if(!cancelled){playback.pause();cancelAnimationFrame(raf);setError(problem instanceof Error?problem.message:String(problem));}}
  }).then(created=>{
   if(cancelled){created.dispose();return;}instance=created;renderer.current=created;
   created.setOrbit(latest.current.orbit);created.setVisible(visibleRef.current&&modeRef.current==='live');
   if(modeRef.current==='cinematic'&&film.current)playback.restorePlayback({...film.current.state,playing:false});
   created.setPose(playback.state.sampleProgress,playback.state.looping?1:undefined);setReady(true);publish();wake.current();
  }).catch(problem=>{if(!cancelled&&!abort.signal.aborted)setError(problem instanceof Error?problem.message:'The classic scene could not load.');});
  return()=>{cancelled=true;abort.abort();cancelAnimationFrame(raf);instance?.dispose();playback.dispose();if(renderer.current===instance)renderer.current=null;if(clock.current===playback)clock.current=null;wake.current=()=>{};};
 },[drinkId,variant,attempt]);
 useEffect(()=>{
  if(!variant.cinematicManifestUrl||!filmHost.current)return;
  const abort=new AbortController();let cancelled=false,instance:SpecialtyCinematic|null=null;
  createSpecialtyCinematic(filmHost.current,{id:drinkId,manifestUrl:variant.cinematicManifestUrl,active:false,reducedMotion:reducedRef.current,signal:abort.signal,label:`${variant.name} cinematic animation`,
   onStateChange:()=>{if(modeRef.current==='cinematic')publish();},
   onUnavailable:()=>{if(!cancelled)setFilmAvailable(false);},
   onModeChange:(enabled,state)=>{if(!cancelled&&!enabled&&modeRef.current==='cinematic')switchMode.current('live',state);}
  }).then(created=>{if(cancelled){created.dispose();return;}instance=created;film.current=created;setFilmAvailable(true);switchMode.current('cinematic');}).catch(()=>{if(!cancelled){setFilmAvailable(false);switchMode.current('live');}});
  return()=>{cancelled=true;abort.abort();instance?.dispose();if(film.current===instance)film.current=null;};
 },[drinkId,variant.cinematicManifestUrl,variant.name]);
 useEffect(()=>{active()?.setTarget(props.expansion);
  if(modeRef.current==='cinematic'&&!visibleRef.current&&film.current){hiddenFilm.current=film.current.read();film.current.pause();}
  publish();
 },[props.expansion]);
 useEffect(()=>{
  clock.current?.setReducedMotion(reduced);renderer.current?.setReducedMotion(reduced);film.current?.setReducedMotion(reduced);
  // A visibility snapshot carries playback intent, but cannot override a newer
  // system preference or restart motion after that preference paused it.
  if(hiddenFilm.current)hiddenFilm.current={...hiddenFilm.current,reducedMotion:reduced,playing:hiddenFilm.current.playing&&!reduced};
  publish();
 },[reduced]);
 useEffect(()=>{
  renderer.current?.setVisible(visible&&modeRef.current==='live');
  if(modeRef.current==='cinematic'&&film.current){if(!visible&&!hiddenFilm.current){hiddenFilm.current=film.current.read();film.current.pause();}else if(visible&&hiddenFilm.current){const saved=hiddenFilm.current;hiddenFilm.current=null;film.current.restorePlayback({...saved,reducedMotion:reducedRef.current,playing:saved.playing&&!reducedRef.current});}}
  if(visible)wake.current();
 },[visible,mode]);
 const lastOrbit=useRef(props.orbit);
 useEffect(()=>{const previous=lastOrbit.current;lastOrbit.current=props.orbit;
  if(previous.azimuth!==props.orbit.azimuth||previous.elevation!==props.orbit.elevation||previous.zoom!==props.orbit.zoom){switchMode.current('live');renderer.current?.setOrbit(props.orbit);}
 },[props.orbit]);
 function orbitBy(azimuth=0,elevation=0,zoom=0){switchMode.current('live');const o=renderer.current?.getOrbit()??latest.current.orbit;latest.current.onOrbitChange({azimuth:clamp(o.azimuth+azimuth,-.7,.7),elevation:clamp(o.elevation+elevation,-.03,1.15),zoom:clamp(o.zoom+zoom,.65,1.8)} as Orbit);}
 const labels=[{anchor:'gin',category:'spirit',label:variant.liquidLabels[0]},{anchor:'campari',category:'bitter',label:variant.liquidLabels[1]},{anchor:'vermouth',category:'vermouth',label:variant.liquidLabels[2]},{anchor:'ice',category:'structure',label:'Clear ice'},{anchor:'orange',category:'garnish',label:variant.garnishLabel}];
 const control=specialtyControl(active()?.state??null);
 return <div ref={host} className={`cocktail-viewer classic-variant-viewer ${props.comparison?'is-comparison':''} ${props.hero?'is-hero':''} ${ready?'is-live':''} ${mode==='cinematic'?'is-cinematic':''}`} data-testid={`viewer-${drinkId}`} data-drink-id={drinkId} data-model-base="classic-negroni" data-live={ready} data-render-active={visible} data-mode={mode} data-control={action} tabIndex={0} role="group" aria-label={`${variant.name} interactive ingredient animation`}
  onDoubleClick={e=>{if(!(e.target as HTMLElement).closest('button'))props.onExpansionChange(props.expansion>.5?0:1);}}
  onKeyDown={e=>{if(e.target!==e.currentTarget)return;const keys:Record<string,()=>void>={ArrowLeft:()=>orbitBy(-.2),ArrowRight:()=>orbitBy(.2),ArrowUp:()=>orbitBy(0,.1),ArrowDown:()=>orbitBy(0,-.1),'+':()=>orbitBy(0,0,.1),'-':()=>orbitBy(0,0,-.1),' ':()=>props.onExpansionChange(props.expansion>.5?0:1)};if(keys[e.key]){e.preventDefault();keys[e.key]();}}}>
  <div ref={liveHost} className="classic-variant-live" aria-hidden={mode==='cinematic'}/>
  <div ref={filmHost} className="viewer-cinematic-host" aria-hidden={mode!=='cinematic'}/>
  {mode!=='cinematic'&&!ready&&!error?<div className="viewer-loading" role="status"><span className="loading-orbit"/>Preparing live 3D<span>Glass, ice & flowing ingredients</span></div>:null}
  {mode!=='cinematic'&&error?<div className="viewer-fallback" role="alert"><p>The 3D scene could not load.</p><button onClick={()=>setAttempt(n=>n+1)}><RotateCcw size={16}/>Retry 3D</button></div>:null}
  <svg ref={lines} className="ingredient-leaders" aria-hidden="true">{labels.map(i=><path key={i.anchor} data-anchor={i.anchor} fill="none" stroke="currentColor" strokeWidth=".75" opacity="0"/>)}</svg>
  <div ref={rail} className="ingredient-labels" aria-label="Separated ingredients">{labels.map(i=><button key={i.anchor} data-anchor={i.anchor} style={{opacity:0,pointerEvents:'none'}} tabIndex={-1} aria-pressed={props.selectedCategory===i.category} onClick={()=>props.onSelectCategory?.(i.category as CategoryId)}>{i.label}</button>)}</div>
  <div ref={legend} className="viewer-cinematic-legend" hidden={mode!=='cinematic'||(active()?.state.rigProgress??0)<.68} role="group" aria-label="Separated cinematic ingredients">
   <span className="viewer-cinematic-legend-title">Inside the drink</span>
   {labels.map((i,index)=><button key={i.anchor} aria-pressed={props.selectedCategory===i.category} onClick={()=>props.onSelectCategory?.(i.category as CategoryId)}><span className="viewer-cinematic-swatch" aria-hidden="true" style={{background:index<3?variant.liquidColors[index]:index===3?'#dae4e6':variant.accent}}/>{i.label}</button>)}
  </div>
  {filmAvailable?<div className="viewer-mode-controls" role="group" aria-label="Rendering view"><button aria-pressed={mode==='cinematic'} onClick={()=>switchMode.current('cinematic')}>Cinema 60 fps</button><button aria-pressed={mode==='live'} onClick={()=>switchMode.current('live')}>Explore 3D</button></div>:null}
  {(ready||(mode==='cinematic'&&filmAvailable))&&!reduced?<div className="viewer-animation-controls"><button aria-label={control.label} disabled={control.disabled} onClick={()=>{const c=active();if(c)activateSpecialtyControl(c,props.onExpansionChange);publish();}}>{control.action==='pause'?<Pause size={14}/>:<Play size={14}/>}<span>{control.label}</span></button><output ref={telemetry} aria-label="Measured animation frame rate" aria-live="off" data-drink-id={drinkId}>Paused</output></div>:null}
  <div className="viewer-zoom"><button aria-label="Zoom in" onClick={()=>orbitBy(0,0,.15)}><Plus size={17}/></button><button aria-label="Zoom out" onClick={()=>orbitBy(0,0,-.15)}><Minus size={17}/></button></div>
  <span className="viewer-input-hint">Drag to rotate · <span className="desktop-hint">double-click to {props.expansion>.5?'reassemble':'expand'}</span><span className="touch-hint">swipe horizontally</span></span>
 </div>;
}
