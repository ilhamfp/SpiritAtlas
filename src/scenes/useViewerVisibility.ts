import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';

type HostRef = RefObject<HTMLElement | null>;
type VisibilitySubscription = { checkHost: () => void; dispose: () => void };

/** Observe the stable viewer host, which must sit outside the model's Suspense boundary. */
export function observeViewerVisibility(hostRef: HostRef, onChange: (visible: boolean) => void): VisibilitySubscription {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    onChange(false);
    return { checkHost() {}, dispose() {} };
  }

  let host: HTMLElement | null = null;
  let intersects = false;
  let hasIntersection = false;
  let lastVisible: boolean | undefined;
  let disposed = false;
  let frame = 0;
  let awaitingHost: MutationObserver | null = null;

  function publish() {
    const visible = !document.hidden && !!host?.isConnected && intersects;
    if (!disposed && visible !== lastVisible) {
      lastVisible = visible;
      onChange(visible);
    }
  }

  function measure() {
    if (!host || document.hidden) return;
    const rect = host.getBoundingClientRect();
    intersects = rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.right > 0
      && rect.top < window.innerHeight && rect.left < window.innerWidth;
  }

  const observer = typeof window.IntersectionObserver === 'function'
    ? new window.IntersectionObserver(entries => {
        checkHost();
        for (const entry of entries) {
          if (entry.target !== host) continue;
          // Merely touching the viewport edge has no visible pixels.
          intersects = entry.isIntersecting && entry.intersectionRatio > 0;
          hasIntersection = true;
        }
        publish();
      }, { threshold: [0, Number.EPSILON] })
    : null;

  function cancelFrame() {
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function scheduleFallback() {
    if (disposed || document.hidden || frame || (observer && hasIntersection)) return;
    frame = window.requestAnimationFrame(() => {
      frame = 0;
      checkHost();
      // Once IO reports, it is authoritative about clipping by scroll containers.
      if (!hasIntersection) measure();
      publish();
      if (!host && !awaitingHost) scheduleFallback();
    });
  }

  function watchForHost() {
    if (awaitingHost || disposed) return;
    if (typeof window.MutationObserver === 'function' && document.documentElement) {
      awaitingHost = new window.MutationObserver(() => checkHost());
      awaitingHost.observe(document.documentElement, { childList: true, subtree: true });
    } else {
      scheduleFallback();
    }
  }

  function checkHost(force = false) {
    if (disposed) return;
    const next = hostRef.current;
    if (!force && next === host) {
      if (!host) watchForHost();
      return;
    }
    if (host) observer?.unobserve(host);
    host = next;
    hasIntersection = false;
    intersects = false;
    if (host) {
      awaitingHost?.disconnect();
      awaitingHost = null;
      // Do not wait for the first IO callback: a suspended Canvas still needs
      // to start rendering as soon as its already-visible host becomes ready.
      measure();
      observer?.observe(host);
    } else {
      watchForHost();
    }
    publish();
  }

  function onVisibilityChange() {
    if (document.hidden) {
      cancelFrame();
      publish();
    } else {
      // Refresh immediately on tab return, including a scroll made while hidden.
      // Re-observing also replaces stale clipping information on the next frame.
      checkHost(true);
    }
  }

  function onPageShow() { checkHost(true); }

  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pageshow', onPageShow);
  // These are only a fallback until the first IO result, or without IO support.
  // Capture observes horizontal comparison scrolling as well as page scrolling.
  window.addEventListener('scroll', scheduleFallback, { capture: true, passive: true });
  window.addEventListener('resize', scheduleFallback, { passive: true });
  checkHost(true);

  return {
    checkHost,
    dispose() {
      disposed = true;
      cancelFrame();
      observer?.disconnect();
      awaitingHost?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pageshow', onPageShow);
      window.removeEventListener('scroll', scheduleFallback, true);
      window.removeEventListener('resize', scheduleFallback);
    },
  };
}

const useBrowserLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Keep the Canvas mounted; use the result to switch its frameloop between demand and never. */
export function useViewerVisibility(hostRef: HostRef): boolean {
  const [visible, setVisible] = useState(false);
  const subscription = useRef<VisibilitySubscription | null>(null);

  useBrowserLayoutEffect(() => {
    const next = observeViewerVisibility(hostRef, setVisible);
    subscription.current = next;
    return () => {
      next.dispose();
      subscription.current = null;
    };
  }, [hostRef]);

  // A ref can switch hosts without changing its identity. This only compares
  // references during ordinary renders; it does not measure layout each frame.
  useBrowserLayoutEffect(() => { subscription.current?.checkHost(); });
  return visible;
}
