import {useEffect, useRef, useState} from 'react';
import type {CSSProperties} from 'react';
import {ArrowUpRight, ChevronLeft, ChevronRight, Pause, Play, RotateCcw} from 'lucide-react';
import {advancePlayback, clampProgress, deconstruct, finishPlaybackLeg, initialPlayback, INITIAL_PLAYBACK, movieTime, nextDirection, togglePlayback} from './playback';
import type {PlaybackState} from './playback';
import type {NegroniRenderer} from './renderer';

type Mode = 'cinematic' | '3d';
type Manifest = {duration: number; forward: string; reverse: string; poster: string};
type MediaIssue = '' | 'slow' | 'failed';
type UIState = PlaybackState & {mode: Mode; suspended: boolean; hasFrame: boolean; loading3D: boolean; mediaIssue: MediaIssue; status: string};
type Commands = {action: () => void; toggle: () => void; seek: (value: number) => void; speed: () => void; reset: () => void; retry: () => void; rotate: (delta: number) => void};
const ASSET_ROOT = '/classic-negroni/cinematic';
const DEFAULT_MANIFEST: Manifest = {duration: 7.2, forward: `${ASSET_ROOT}/negroni-forward.mp4`, reverse: `${ASSET_ROOT}/negroni-reverse.mp4`, poster: `${ASSET_ROOT}/poster.png`};
const noop = () => {};

/** The original Negroni films and optional live scene share one reversible timeline. */
export default function ClassicNegroni() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const forwardRef = useRef<HTMLVideoElement>(null);
  const reverseRef = useRef<HTMLVideoElement>(null);
  const commands = useRef<Commands>({action: noop, toggle: noop, seek: noop, speed: noop, reset: noop, retry: noop, rotate: noop});
  const [ui, setUI] = useState<UIState>({...INITIAL_PLAYBACK, mode: 'cinematic', suspended: false, hasFrame: false, loading3D: false, mediaIssue: '', status: ''});

  useEffect(() => {
    const root = rootRef.current!;
    const stage = stageRef.current!;
    const container = liveRef.current!;
    const videos = [forwardRef.current!, reverseRef.current!];
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let controller = new AbortController();
    let rendererController: AbortController | null = null;
    let disposed = false, reducedMotion = mediaQuery.matches, inView = true;
    let state: PlaybackState = initialPlayback(reducedMotion);
    let manifest = DEFAULT_MANIFEST, mode: Mode = 'cinematic', current = videos[0];
    let renderer: NegroniRenderer | null = null, loading3D = false, status = '', ready = false;
    let suspended = document.hidden, pendingSeek = true, playRequest = 0, lastUI = 0, previous = performance.now();
    let frame = 0, shownVideo: HTMLVideoElement | null = null, lastPublished = '';
    let mediaIssue: MediaIssue = '', loadingTimer = 0, pendingRotation = 0;
    const unbind: (() => void)[] = [];

    function syncFrameLoop() {
      const active = !disposed && !suspended && state.playing &&
        (mode === 'cinematic' ? !current.paused && current.readyState >= 2 && !pendingSeek : !!renderer);
      if (active && !frame) {
        previous = performance.now();
        frame = requestAnimationFrame(animate);
      } else if (!active && frame) {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    }

    function publish() {
      if (disposed) return;
      syncFrameLoop();
      const awaitingFilm = mode === 'cinematic' && !ready && !suspended && !mediaIssue;
      if (awaitingFilm && !loadingTimer) loadingTimer = window.setTimeout(() => {
        loadingTimer = 0;
        mediaIssue = 'slow';
        publish();
      }, 8000);
      else if (!awaitingFilm && loadingTimer) {clearTimeout(loadingTimer); loadingTimer = 0;}
      const actuallyPlaying = state.playing && !suspended && (mode === 'cinematic' ? !current.paused && current.readyState >= 2 && !pendingSeek : !!renderer);
      const signature = JSON.stringify([state, mode, suspended, ready, !!shownVideo, loading3D, mediaIssue, status, actuallyPlaying]);
      if (signature === lastPublished) return;
      lastPublished = signature;
      root.dataset.mode = mode;
      root.dataset.progress = state.progress.toFixed(5);
      root.dataset.playing = String(actuallyPlaying);
      root.dataset.playIntent = String(state.playing);
      root.dataset.direction = String(state.direction);
      root.dataset.suspended = String(suspended);
      setUI({...state, mode, suspended, hasFrame: !!shownVideo, loading3D, mediaIssue, status});
    }

    function readFilm() {
      if (mode !== 'cinematic' || pendingSeek || current.readyState < 2) return;
      if (state.playing) state.progress = clampProgress(state.direction === 1 ? current.currentTime / manifest.duration : 1 - current.currentTime / manifest.duration);
    }

    function revealFilm() {
      if (mode !== 'cinematic' || current.readyState < 2 || pendingSeek || current.error) return;
      shownVideo = current;
      // Keep every video attached to the compositor. Toggling display:none on a
      // decoded WebKit video can leave its old poster painted over later frames.
      // The preceding sequence stays visible until this seek has a decoded frame.
      videos.forEach(video => {video.dataset.active = String(video === current);});
      stage.dataset.filmReady = 'true';
      ready = true;
      mediaIssue = '';
      publish();
    }

    function startFilm() {
      // Request playback before decoding: mobile browsers can defer data until
      // play() is called. Nonzero seeks still wait for their correct frame.
      if (mode !== 'cinematic' || !state.playing || suspended || pendingSeek || !current.hasAttribute('src') || current.error) return;
      const request = ++playRequest;
      current.play().then(() => {
        if (!disposed && request === playRequest) publish();
      }).catch(error => {
        if (disposed || request !== playRequest || current.error || error?.name === 'AbortError') return;
        state.playing = false;
        status = 'Press play to continue the animation.';
        publish();
      });
    }

    function pose() {
      if (!renderer || mode !== '3d') return;
      renderer.setPose(state.progress);
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
      const next = videos[state.direction === 1 ? 0 : 1];
      const changed = next !== current;
      if (changed) current.pause();
      current = next;
      if (changed) {ready = false; mediaIssue = '';}
      videos.forEach(video => {if (video !== current) video.pause();});
      // A preloaded secondary sequence may have failed before it was selected.
      // Selecting it must offer recovery even if no new error event is emitted.
      if (current.error) {failFilm(current); return;}
      current.playbackRate = state.speed;
      const target = movieTime(state, manifest.duration);
      if (changed || forceSeek || Math.abs(current.currentTime - target) > .12) {
        if (current.readyState >= 1) {
          const seekTo = Math.min(target, Number.isFinite(current.duration) ? Math.max(0, current.duration - .001) : target);
          pendingSeek = Math.abs(current.currentTime - seekTo) > .002;
          if (pendingSeek) current.currentTime = seekTo;
        } else pendingSeek = target > .002;
      }
      if (pendingSeek || current.readyState < 2) ready = false;
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

    function failFilm(video: HTMLVideoElement) {
      if (disposed || video !== current || mode !== 'cinematic') return;
      state.playing = false;
      status = '';
      mediaIssue = 'failed';
      ready = false;
      if (shownVideo === video || !shownVideo) {
        videos.forEach(item => {item.dataset.active = 'false';});
        stage.dataset.filmReady = 'false';
        shownVideo = null;
      }
      publish();
    }

    function restoreFilm() {
      if (disposed) return;
      rendererController?.abort();
      const failedRenderer = renderer;
      renderer = null;
      loading3D = false;
      pendingRotation = 0;
      mode = 'cinematic';
      failedRenderer?.dispose();
      container.hidden = true;
      status = 'Rotation is unavailable on this device. You can still play the animation.';
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
        if (pendingRotation) renderer.rotate(pendingRotation);
        pendingRotation = 0;
        publish();
      } catch {
        if (!disposed && !signal.aborted) restoreFilm();
      }
    }

    commands.current = {
      action() {readFilm(); update(deconstruct(state, reducedMotion));},
      toggle() {readFilm(); update(togglePlayback(state), false);},
      seek(value) {
        readFilm();
        const progress = clampProgress(value);
        update({...state, progress, direction: progress >= state.progress ? 1 : -1, playing: false});
      },
      speed() {readFilm(); const speeds = [1, .5, .25]; update({...state, speed: speeds[(speeds.indexOf(state.speed) + 1) % speeds.length]}, false);},
      reset() {
        if (loading3D) {
          rendererController?.abort();
          rendererController = null;
          loading3D = false;
        }
        pendingRotation = 0;
        mode = 'cinematic';
        container.hidden = true;
        update({...INITIAL_PLAYBACK, speed: state.speed});
        renderer?.resetCamera();
      },
      retry() {
        commands.current.reset();
        controller.abort();
        controller = new AbortController();
        ++playRequest;
        mediaIssue = '';
        ready = false;
        shownVideo = null;
        pendingSeek = true;
        stage.dataset.filmReady = 'false';
        videos.forEach(video => {video.dataset.active = 'false'; video.pause(); video.removeAttribute('src'); video.load();});
        state = {...initialPlayback(reducedMotion), speed: state.speed};
        void loadFilms();
        publish();
      },
      rotate(delta) {
        if (mode !== '3d') {
          readFilm();
          mode = '3d';
          status = '';
          container.hidden = !renderer;
          previous = performance.now();
          syncMedia(true);
        }
        if (renderer) renderer.rotate(delta);
        else {pendingRotation += delta; void loadRenderer();}
        publish();
      },
    };

    videos.forEach(video => {
      video.muted = true;
      const metadata = () => {if (video === current && mode === 'cinematic') syncMedia(true);};
      const loaded = () => {if (video === current) {revealFilm(); startFilm();}};
      const seeked = () => {if (video === current) {pendingSeek = false; revealFilm(); startFilm();}};
      const ended = () => {
        if (mode !== 'cinematic' || video !== current || !state.playing) return;
        state = finishPlaybackLeg(state, reducedMotion);
        syncMedia(true);
        publish();
      };
      const error = () => failFilm(video);
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
    observer.observe(stage);
    document.addEventListener('visibilitychange', visibility);
    const motionChanged = () => {
      reducedMotion = mediaQuery.matches;
      renderer?.setReducedMotion(reducedMotion);
      if (reducedMotion) {
        readFilm();
        update({...state, playing: false});
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
        else if (renderer) {state = advancePlayback(state, delta, reducedMotion, manifest.duration); pose();}
      }
      if (now - lastUI > 50 || !state.playing) {lastUI = now; publish();}
      syncFrameLoop();
    }

    async function loadFilms() {
      const signal = controller.signal;
      try {
        const response = await fetch(`${ASSET_ROOT}/manifest.json`, {signal});
        if (!response.ok) throw new Error('Film manifest unavailable');
        const value = await response.json();
        if (disposed || signal.aborted) return;
        manifest = {...DEFAULT_MANIFEST, ...value};
      } catch {
        if (disposed || signal.aborted) return;
        // The stable local filenames remain usable if only the manifest failed.
      }
      if (disposed || signal.aborted) return;
      [manifest.forward, manifest.reverse].forEach((src, index) => {videos[index].src = src;});
      syncMedia(true);
    }
    void loadFilms();
    publish();

    return () => {
      disposed = true;
      ++playRequest;
      controller.abort();
      clearTimeout(loadingTimer);
      rendererController?.abort();
      cancelAnimationFrame(frame);
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      mediaQuery.removeEventListener('change', motionChanged);
      unbind.forEach(remove => remove());
      stage.dataset.filmReady = 'false';
      videos.forEach(video => {video.dataset.active = 'false'; video.pause(); video.removeAttribute('src'); video.load();});
      renderer?.dispose();
    };
  }, []);

  const percent = Math.round(ui.progress * 100);
  const comingTogether = nextDirection(ui) === -1;
  const mediaIssue = ui.mode === 'cinematic' ? ui.mediaIssue : '';
  const loadingText = ui.loading3D ? 'Preparing rotation…' : !ui.hasFrame && ui.mode === 'cinematic' && !ui.status && !mediaIssue ? 'Loading animation…' : '';
  const videoProps = {muted: true, playsInline: true, preload: 'auto', controls: false, 'aria-hidden': true as const, tabIndex: -1, className: 'cn-video'};

  return <section className={`cn-hero${ui.progress > .5 ? ' is-expanded' : ''}`} ref={rootRef} aria-label="Classic Negroni experience">
    <div className="cn-experience">
      <div className="cn-stage" ref={stageRef} data-film-ready="false" tabIndex={0} aria-label="Classic Negroni animation. Press Enter to look inside, Space to play or pause, left or right arrow to rotate, R to reset." onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.code === 'Space') {event.preventDefault(); commands.current.toggle();}
        else if (event.code === 'Enter') {event.preventDefault(); commands.current.action();}
        else if (event.code === 'KeyR') commands.current.reset();
        else if (event.code === 'ArrowLeft' || event.code === 'ArrowRight') {event.preventDefault(); commands.current.rotate((event.code === 'ArrowLeft' ? -1 : 1) * Math.PI / 8);}
      }}>
        <img className="cn-poster" src={DEFAULT_MANIFEST.poster} alt="Classic Negroni with ruby red liquid, clear ice, and a fresh orange slice in a rocks glass" fetchPriority="high" />
        <video {...videoProps} ref={forwardRef} data-sequence="forward" data-active="false" />
        <video {...videoProps} ref={reverseRef} data-sequence="reverse" data-active="false" />
        <div className="cn-renderer" ref={liveRef} hidden />
      </div>
    </div>
    <div className="cn-details">
    <div className="cn-header">
      <h2 className="cn-title">Classic Negroni</h2>
      <button type="button" className="cn-primary-action" aria-expanded={ui.progress > .5} onClick={() => commands.current.action()}>{comingTogether ? 'Bring it together' : 'Look inside'}{comingTogether ? <RotateCcw size={16} aria-hidden="true"/> : <ArrowUpRight size={17} aria-hidden="true"/>}</button>
    </div>
    <div className="cn-controls">
      <div className="cn-transport">
        <button type="button" className="cn-icon-button" aria-label={ui.playing ? 'Pause animation' : 'Play animation'} title={ui.playing ? 'Pause animation' : 'Play animation'} onClick={() => commands.current.toggle()}>{ui.playing ? <Pause size={16} aria-hidden="true"/> : <Play size={16} aria-hidden="true"/>}</button>
        <input className="cn-timeline" type="range" min={0} max={1000} step={1} value={Math.round(ui.progress * 1000)} style={{'--progress': `${percent}%`} as CSSProperties} aria-label="Deconstruction progress" aria-valuetext={`${percent}% deconstructed`} onChange={event => commands.current.seek(Number(event.currentTarget.value) / 1000)} />
        <span className="cn-progress-value" aria-hidden="true">{String(percent).padStart(2, '0')}%</span>
      </div>
      <div className="cn-adjustments">
      <div className="cn-playback-options">
        <button type="button" className="cn-speed" aria-label={`Playback speed: ${ui.speed} times. Change speed`} onClick={() => commands.current.speed()}>{ui.speed}×</button>
        <button type="button" className="cn-icon-button" aria-label="Reset Negroni" title="Reset Negroni" onClick={() => commands.current.reset()}><RotateCcw size={15} aria-hidden="true"/></button>
      </div>
      <div className="cn-orbit-controls"><button type="button" className="cn-icon-button" disabled={ui.loading3D} aria-label="Rotate Negroni left" onClick={() => commands.current.rotate(-Math.PI / 8)}><ChevronLeft size={16} aria-hidden="true"/></button><button type="button" className="cn-icon-button" disabled={ui.loading3D} aria-label="Rotate Negroni right" onClick={() => commands.current.rotate(Math.PI / 8)}><ChevronRight size={16} aria-hidden="true"/></button></div></div>
    </div>
    <p className={`cn-status${loadingText ? ' cn-loading' : ''}`} role="status" aria-live="polite">{ui.status || (mediaIssue === 'failed' ? 'The animation could not load. Retry, or use the arrows to rotate the drink.' : mediaIssue === 'slow' ? 'The animation is taking longer to load. You can wait or retry.' : loadingText)}</p>
    {mediaIssue && <button type="button" className="cn-retry" onClick={() => commands.current.retry()}>Retry animation</button>}
    </div>
  </section>;
}
