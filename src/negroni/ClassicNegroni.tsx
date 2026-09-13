import {useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw} from 'lucide-react';
import {advancePlayback, clampProgress, deconstruct, DEFAULT_IDLE_TIMELINE, idleSampleProgress, INITIAL_PLAYBACK, movieTime, nextDirection, togglePlayback} from './playback';
import type {IdleTimeline, PlaybackState} from './playback';
import type {NegroniRenderer} from './renderer';

type Mode = 'cinematic' | '3d';
type Manifest = {duration: number; forward: string; reverse: string; idle: string; poster: string; idleTimeline: IdleTimeline};
type UIState = PlaybackState & {mode: Mode; suspended: boolean; ready: boolean; loading3D: boolean; status: string};
type Commands = {action: () => void; toggle: () => void; seek: (value: number) => void; speed: () => void; reset: () => void; mode: (value: Mode) => void; rotate: (delta: number) => void};
const ASSET_ROOT = '/classic-negroni/cinematic';
const DEFAULT_MANIFEST: Manifest = {duration: 7.2, forward: `${ASSET_ROOT}/negroni-forward.mp4`, reverse: `${ASSET_ROOT}/negroni-reverse.mp4`, idle: `${ASSET_ROOT}/negroni-idle.mp4`, poster: `${ASSET_ROOT}/poster.png`, idleTimeline: DEFAULT_IDLE_TIMELINE};
const noop = () => {};

/** The original Negroni films and optional live scene share one reversible timeline. */
export default function ClassicNegroni() {
  const rootRef = useRef<HTMLElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const forwardRef = useRef<HTMLVideoElement>(null);
  const reverseRef = useRef<HTMLVideoElement>(null);
  const idleRef = useRef<HTMLVideoElement>(null);
  const commands = useRef<Commands>({action: noop, toggle: noop, seek: noop, speed: noop, reset: noop, mode: noop, rotate: noop});
  const [ui, setUI] = useState<UIState>({...INITIAL_PLAYBACK, mode: 'cinematic', suspended: false, ready: false, loading3D: false, status: ''});

  useEffect(() => {
    const root = rootRef.current!;
    const container = liveRef.current!;
    const videos = [forwardRef.current!, reverseRef.current!, idleRef.current!];
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const controller = new AbortController();
    let rendererController: AbortController | null = null;
    let disposed = false, reducedMotion = mediaQuery.matches, inView = true;
    let state: PlaybackState = {...INITIAL_PLAYBACK};
    let manifest = DEFAULT_MANIFEST, mode: Mode = 'cinematic', current = videos[0];
    let renderer: NegroniRenderer | null = null, loading3D = false, status = '', ready = false;
    let suspended = document.hidden, pendingSeek = true, playRequest = 0, lastUI = 0, previous = performance.now();
    let frame = 0, shownVideo: HTMLVideoElement | null = null, lastPublished = '';
    const unbind: (() => void)[] = [];

    function publish() {
      if (disposed) return;
      const actuallyPlaying = state.playing && !suspended && (mode === 'cinematic' ? !current.paused : !!renderer);
      const signature = JSON.stringify([state, mode, suspended, ready, loading3D, status, actuallyPlaying]);
      if (signature === lastPublished) return;
      lastPublished = signature;
      root.dataset.mode = mode;
      root.dataset.progress = state.progress.toFixed(5);
      root.dataset.playing = String(actuallyPlaying);
      root.dataset.playIntent = String(state.playing);
      root.dataset.looping = String(state.looping);
      root.dataset.idleTime = state.idleTime.toFixed(5);
      root.dataset.sampleProgress = (state.looping ? idleSampleProgress(state.idleTime, manifest.duration, manifest.idleTimeline) : state.progress).toFixed(5);
      root.dataset.direction = String(state.direction);
      root.dataset.suspended = String(suspended);
      setUI({...state, mode, suspended, ready, loading3D, status});
    }

    function readFilm() {
      if (mode !== 'cinematic' || pendingSeek || current.readyState < 2) return;
      if (state.looping) state.idleTime = current.currentTime;
      else if (state.playing) state.progress = clampProgress(state.direction === 1 ? current.currentTime / manifest.duration : 1 - current.currentTime / manifest.duration);
    }

    function revealFilm() {
      if (mode !== 'cinematic' || current.readyState < 2 || pendingSeek || current.error) return;
      shownVideo = current;
      videos.forEach(video => {video.hidden = video !== current;});
      ready = true;
      publish();
    }

    function startFilm() {
      if (mode !== 'cinematic' || !state.playing || suspended || pendingSeek || current.readyState < 2 || current.error) return;
      const request = ++playRequest;
      current.play().catch(error => {
        if (disposed || request !== playRequest || error?.name === 'AbortError') return;
        state.playing = false;
        status = 'Press play to continue the animation.';
        publish();
      });
    }

    function pose() {
      if (!renderer || mode !== '3d') return;
      const sample = state.looping ? idleSampleProgress(state.idleTime, manifest.duration, manifest.idleTimeline) : state.progress;
      renderer.setPose(sample, state.looping ? 1 : undefined);
    }

    function syncMedia(forceSeek = false) {
      ++playRequest;
      if (mode !== 'cinematic') {
        videos.forEach(video => video.pause());
        renderer?.setVisible(!suspended);
        pose();
        return;
      }
      renderer?.setVisible(false);
      const next = videos[state.looping ? 2 : state.direction === 1 ? 0 : 1];
      const changed = next !== current;
      if (changed) current.pause();
      current = next;
      videos.forEach(video => {if (video !== current) video.pause();});
      current.playbackRate = state.speed;
      const target = movieTime(state, manifest.duration);
      if (changed || forceSeek || Math.abs(current.currentTime - target) > .12) {
        if (current.readyState >= 1) {
          const seekTo = Math.min(target, Number.isFinite(current.duration) ? Math.max(0, current.duration - .001) : target);
          pendingSeek = Math.abs(current.currentTime - seekTo) > .002;
          if (pendingSeek) current.currentTime = seekTo;
        } else pendingSeek = true;
      }
      if (!state.playing || suspended || pendingSeek) current.pause();
      revealFilm();
      startFilm();
    }

    function update(next: PlaybackState, seek = true) {
      state = next;
      status = '';
      syncMedia(seek);
      publish();
    }

    function restoreFilm() {
      if (disposed) return;
      rendererController?.abort();
      const failedRenderer = renderer;
      renderer = null;
      loading3D = false;
      mode = 'cinematic';
      failedRenderer?.dispose();
      container.hidden = true;
      status = '3D view is unavailable on this device. Cinematic view restored.';
      syncMedia(true);
      publish();
    }

    async function loadRenderer() {
      if (renderer || loading3D || disposed) return;
      loading3D = true;
      rendererController = new AbortController();
      const signal = rendererController.signal;
      publish();
      try {
        const {createNegroniRenderer} = await import('./renderer.js');
        if (disposed || signal.aborted) return;
        const created = await createNegroniRenderer(container, {
          signal,
          reducedMotion,
          onError: () => {if (!signal.aborted) restoreFilm();},
        });
        if (disposed || signal.aborted) {created.dispose(); return;}
        renderer = created;
        renderer.setReducedMotion(reducedMotion);
        loading3D = false;
        container.hidden = mode !== '3d';
        renderer.setVisible(mode === '3d' && !suspended);
        previous = performance.now();
        pose();
        publish();
      } catch {
        if (!disposed && !signal.aborted) restoreFilm();
      }
    }

    commands.current = {
      action() {readFilm(); update(deconstruct(state, reducedMotion, manifest.duration, manifest.idleTimeline));},
      toggle() {readFilm(); update(togglePlayback(state, reducedMotion), false);},
      seek(value) {
        readFilm();
        const progress = clampProgress(value);
        update({...state, progress, direction: progress >= state.progress ? 1 : -1, playing: false, looping: false, idleTime: 0});
      },
      speed() {readFilm(); const speeds = [1, .5, .25]; update({...state, speed: speeds[(speeds.indexOf(state.speed) + 1) % speeds.length]}, false);},
      reset() {update({...INITIAL_PLAYBACK, speed: state.speed}); renderer?.resetCamera();},
      mode(next) {
        if (next === mode) return;
        readFilm();
        mode = next;
        status = '';
        if (next === 'cinematic' && loading3D) {
          rendererController?.abort();
          rendererController = null;
          loading3D = false;
        }
        container.hidden = next !== '3d' || !renderer;
        previous = performance.now();
        syncMedia(true);
        publish();
        if (next === '3d') void loadRenderer();
      },
      rotate(delta) {if (mode === '3d') renderer?.rotate(delta);},
    };

    videos.forEach(video => {
      video.muted = true;
      const metadata = () => {if (video === current && mode === 'cinematic') syncMedia(true);};
      const loaded = () => {if (video === current) {revealFilm(); startFilm();}};
      const seeked = () => {if (video === current) {pendingSeek = false; revealFilm(); startFilm();}};
      const ended = () => {
        if (mode !== 'cinematic' || video !== current || state.looping || !state.playing) return;
        state.progress = state.direction === 1 ? 1 : 0;
        if (state.direction === 1 && !reducedMotion) {state.looping = true; state.idleTime = 0;}
        else state.playing = false;
        syncMedia(true);
        publish();
      };
      const error = () => {
        if (disposed || video !== current || mode !== 'cinematic') return;
        state.playing = false;
        status = 'The film could not load. Try Explore 3D to see the drink.';
        if (shownVideo === video) {video.hidden = true; shownVideo = null; ready = false;}
        publish();
      };
      const handlers = {loadedmetadata: metadata, loadeddata: loaded, canplay: loaded, seeked, ended, error};
      for (const [event, handler] of Object.entries(handlers)) {
        video.addEventListener(event, handler);
        unbind.push(() => video.removeEventListener(event, handler));
      }
    });

    function visibility() {
      readFilm();
      suspended = document.hidden || !inView;
      previous = performance.now();
      syncMedia(false);
      publish();
    }
    const observer = new IntersectionObserver(entries => {inView = entries[0]?.isIntersecting ?? true; visibility();}, {threshold: .01});
    observer.observe(root);
    document.addEventListener('visibilitychange', visibility);
    const motionChanged = () => {
      reducedMotion = mediaQuery.matches;
      renderer?.setReducedMotion(reducedMotion);
      if (reducedMotion) {
        readFilm();
        if (state.looping) state.progress = idleSampleProgress(state.idleTime, manifest.duration, manifest.idleTimeline);
        update({...state, playing: false, looping: false, idleTime: 0});
      }
    };
    mediaQuery.addEventListener('change', motionChanged);

    function animate(now: number) {
      if (disposed) return;
      frame = requestAnimationFrame(animate);
      const delta = Math.min((now - previous) / 1000, .15);
      previous = now;
      if (!suspended) {
        if (mode === 'cinematic') readFilm();
        else if (renderer) {state = advancePlayback(state, delta, reducedMotion, manifest.duration, manifest.idleTimeline); pose();}
      }
      if (now - lastUI > 50) {lastUI = now; publish();}
    }

    async function loadFilms() {
      try {
        const response = await fetch(`${ASSET_ROOT}/manifest.json`, {signal: controller.signal});
        if (!response.ok) throw new Error('Film manifest unavailable');
        const value = await response.json();
        if (disposed) return;
        manifest = {...DEFAULT_MANIFEST, ...value, idleTimeline: value.idleTimeline ?? DEFAULT_IDLE_TIMELINE};
      } catch {
        if (disposed || controller.signal.aborted) return;
        // The stable local filenames remain usable if only the manifest failed.
      }
      if (disposed) return;
      [manifest.forward, manifest.reverse, manifest.idle].forEach((src, index) => {videos[index].src = src;});
      videos[0].poster = manifest.poster;
      syncMedia(true);
    }
    void loadFilms();
    frame = requestAnimationFrame(animate);
    publish();

    return () => {
      disposed = true;
      ++playRequest;
      controller.abort();
      rendererController?.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      mediaQuery.removeEventListener('change', motionChanged);
      unbind.forEach(remove => remove());
      videos.forEach(video => {video.pause(); video.removeAttribute('src'); video.load();});
      renderer?.dispose();
    };
  }, []);

  const percent = Math.round(ui.progress * 100);
  const comingTogether = nextDirection(ui) === -1;
  const sceneState = ui.looping ? 'Every ingredient, in motion' : ui.progress < .002 ? 'The perfect serve' : ui.progress > .998 ? 'Five beautiful parts' : ui.playing ? ui.direction === 1 ? 'Coming apart' : 'Coming together' : 'A moment, suspended';
  const videoProps = {muted: true, playsInline: true, preload: 'auto', controls: false, 'aria-hidden': true as const, tabIndex: -1, className: 'cn-video'};

  return <section className={`cn-hero${ui.progress > .5 ? ' is-expanded' : ''}`} ref={rootRef} aria-label="Classic Negroni experience">
    <div className="cn-mode-switch" role="group" aria-label="Negroni view">
      <button type="button" aria-pressed={ui.mode === 'cinematic'} onClick={() => commands.current.mode('cinematic')}>Cinematic</button>
      <button type="button" aria-pressed={ui.mode === '3d'} onClick={() => commands.current.mode('3d')}>Explore 3D</button>
    </div>
    <div className="cn-experience">
      <div className="cn-stage" tabIndex={0} aria-label="Classic Negroni animation. Press Enter to look inside, Space to play or pause, R to reset." onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.code === 'Space') {event.preventDefault(); commands.current.toggle();}
        else if (event.code === 'Enter') {event.preventDefault(); commands.current.action();}
        else if (event.code === 'KeyR') commands.current.reset();
      }}>
        <img className="cn-poster" src={DEFAULT_MANIFEST.poster} alt="Classic Negroni with ruby red liquid, clear ice, and a fresh orange slice in a rocks glass" fetchPriority="high" />
        <video {...videoProps} ref={forwardRef} data-sequence="forward" hidden />
        <video {...videoProps} ref={reverseRef} data-sequence="reverse" hidden />
        <video {...videoProps} ref={idleRef} data-sequence="idle" loop hidden />
        <div className="cn-renderer" ref={liveRef} hidden />
        {((!ui.ready && ui.mode === 'cinematic' && !ui.status) || ui.loading3D) && <div className="cn-loading" role="status">{ui.loading3D ? 'Preparing your 3D view…' : 'Preparing your drink…'}</div>}
        <div className="cn-scene-caption" aria-hidden="true"><span className="cn-scene-state">{sceneState}</span><span>{ui.progress > .5 ? '02 / 02' : '01 / 02'}</span></div>
      </div>
    </div>
    <div className="cn-header">
      <div><span className="cn-eyebrow">THE ORIGINAL / 1 : 1 : 1</span><h2 className="cn-title">Classic Negroni</h2><p className="cn-intro">Gin · Campari · sweet vermouth</p></div>
      <button type="button" className="cn-primary-action" aria-expanded={ui.progress > .5} onClick={() => commands.current.action()}>{comingTogether ? 'Bring it together' : 'Look inside'}{comingTogether ? <RotateCcw size={16} aria-hidden="true"/> : <ArrowUpRight size={17} aria-hidden="true"/>}</button>
    </div>
    <div className="cn-controls">
      <div className="cn-transport">
        <button type="button" className="cn-icon-button" aria-label={ui.playing ? 'Pause animation' : 'Play animation'} title={ui.playing ? 'Pause animation' : 'Play animation'} onClick={() => commands.current.toggle()}>{ui.playing ? <Pause size={16} aria-hidden="true"/> : <Play size={16} aria-hidden="true"/>}</button>
        <input className="cn-timeline" type="range" min={0} max={1000} step={1} value={Math.round(ui.progress * 1000)} style={{'--progress': `${percent}%`} as CSSProperties} aria-label="Deconstruction progress" aria-valuetext={`${percent}% deconstructed`} onChange={event => commands.current.seek(Number(event.currentTarget.value) / 1000)} />
        <span className="cn-progress-value" aria-hidden="true">{String(percent).padStart(2, '0')}%</span>
        <button type="button" className="cn-speed" aria-label={`Playback speed: ${ui.speed} times. Change speed`} onClick={() => commands.current.speed()}>{ui.speed}×</button>
        <button type="button" className="cn-icon-button" aria-label="Reset Negroni" title="Reset Negroni" onClick={() => commands.current.reset()}><RotateCcw size={15} aria-hidden="true"/></button>
      </div>
      <div className="cn-hint"><span>{ui.mode === '3d' ? 'Drag to explore another angle' : 'Unfold the ingredients. Take your time.'}</span>{ui.mode === '3d' && <div className="cn-orbit-controls"><button type="button" className="cn-icon-button" disabled={ui.loading3D} aria-label="Rotate Negroni left" onClick={() => commands.current.rotate(-Math.PI / 8)}><ChevronLeft size={16} aria-hidden="true"/></button><button type="button" className="cn-icon-button" disabled={ui.loading3D} aria-label="Rotate Negroni right" onClick={() => commands.current.rotate(Math.PI / 8)}><ChevronRight size={16} aria-hidden="true"/></button></div>}</div>
    </div>
    <ul className="cn-ingredients" aria-label="Classic Negroni ingredients" aria-hidden={ui.progress <= .65}><li>Gin</li><li>Campari</li><li>Sweet vermouth</li><li>Ice</li><li>Orange</li></ul>
    <p className="cn-status" role="status" aria-live="polite">{ui.status}</p>
  </section>;
}
