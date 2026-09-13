# Unified player verification

Verified locally on 13 September 2026 against the production build served at
`http://127.0.0.1:4175`. This evidence covers the single-player refinement after
`84a6f93`; it does not claim that the refinement is already deployed publicly.
The Behind the Bar release owner coordinates the combined publication.

## Result

- Production build and TypeScript pass. Vite retains the existing warning about
  the shared Three.js chunk size; the renderer still loads only on rotation.
- All 11 original asset/playback checks pass. Imported media are unchanged.
- All 24 Chromium browser checks pass in the final run; see `results.json`.
  They cover default autoplay and circulation, composed-frame changes, reverse
  playback, scrubbing, speed, rotation, reset, canceled loads, unavailable WebGL,
  reduced motion, touch scrolling, stable geometry and existing atlas journeys.
- Recovery checks cover initial slow/failed media, a failed reverse preload,
  and a delayed circulation clip. Playback is requested before decoding, the
  previous good frame survives delayed transitions, and Retry restores playback.
- WebKit passes at 1440×1000, 768×1024, 390×844 and 320×812. Each viewport shows
  autoplay, visibly different assembled/separated frames, circulation, pause
  and reduced-motion behavior. There is no horizontal overflow or page error.
  Text has 16–20px inset padding and buttons retain 44px targets. See
  `webkit-verification.json`. These are engine/emulation checks, not a physical
  iPhone verification.

The initial browser run passed 23 of 24 checks and caught a transient layout
jump while seeking: a short loading message appeared despite an existing good
frame. The implementation now distinguishes the visible frame from readiness
of the selected clip. Normal seeks retain the geometry, while genuine slow
loads still offer recovery. The full final run passed after this correction.

## Visual review

Inspected the desktop and mobile Chromium compositions and the final WebKit
player captures. The mode tabs are gone. Captions and controls use a consistent
charcoal surface with sentence-case metadata; the mobile action has its own
row. Mobile has a flat background, and the desktop frame blends into the
surrounding artwork. At 320px, the rotation hint wraps cleanly while both arrow
targets remain full size. No additional visual changes were needed.

- [Desktop composition](homepage-1440x1000.png)
- [Complete mobile page](homepage-full-390x844.png)
- [WebKit mobile player](webkit-player-390.png)
- [Small-screen player](webkit-player-320.png)
- [Desktop frame edge](webkit-player-edge-1440.png)
- [Background edge review](edge-review.md)

## Commands

```sh
npm run build
node --experimental-strip-types --test tests/classic-negroni*.test.mjs
ATLAS_BRAND_URL=http://127.0.0.1:4175 ATLAS_BRAND_RUN=unified-player npx playwright test --config tests/brand.config.ts
```
