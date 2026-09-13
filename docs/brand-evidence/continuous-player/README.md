# Continuous playback and minimal copy

Verified locally on 13 September 2026 against the production build at
`http://127.0.0.1:4175`.

The original forward and reverse films now play continuously in sequence:
0% → 100% → 0% → 100%. The rotatable scene follows the same complete cycle.
The idle-only movie is no longer requested. Pause, seek, reset, speed,
offscreen suspension, loading recovery and reduced-motion behavior remain.

Removed the player's motion caption, ratio, recipe subtitle, rotation hint and
ingredient list. Removed repeated instructional paragraphs and decorative
taglines from the landing page. Useful bar descriptions, drink details and
button labels remain. Controls fit one row on desktop and two compact rows
on phones, without shrinking their 44px targets.

## Verification

- Production build and TypeScript pass; the existing shared Three.js chunk
  warning remains.
- All 12 asset/playback checks pass. Tests cover film turnarounds, live cycles,
  pause/resume, speed, frame-time overshoot and reduced motion. Assets retain
  their original bytes.
- All 24 Chromium browser checks pass on the first run; see `results.json`.
  The full-cycle test records three actual movie end events in order:
  forward, reverse, forward, each beyond 7.1 seconds. The live-renderer test
  also crosses both endpoints while retaining continuous playback.
- Delayed reverse playback keeps the last decoded frame and offers retry;
  initial and preloaded-clip failure recovery still pass.
- WebKit at 1440, 768, 390 and 320px passes autoplay, visible frame changes,
  full reversal and restart, pause, and reduced motion. There is no horizontal
  overflow or page error. Insets remain 16–20px and button targets remain 44px.
  See `webkit-verification.json`. These are engine/emulation checks, not a
  physical iPhone verification.
- Visually reviewed desktop/mobile compositions and the 390/320px WebKit
  player. Copy removal creates a clear hierarchy without empty caption rows,
  clipped controls or changing layout during motion. No second visual edit
  was required.

## Captures

- [Desktop](homepage-1440x1000.png)
- [Complete mobile page](homepage-full-390x844.png)
- [Mobile player](webkit-player-390.png)
- [Small-screen player](webkit-player-320.png)
- [Full-cycle endpoint capture](classic-full-cycle-1440x1000.png)

## Reproduce

```sh
npm run build
node --experimental-strip-types --test tests/classic-negroni*.test.mjs
ATLAS_BRAND_URL=http://127.0.0.1:4175 ATLAS_BRAND_RUN=continuous-player npx playwright test --config tests/brand.config.ts
```

Combined-release and public verification are recorded separately in the
release worktree, preserving the existing Behind the Bar acceptance snapshot.
