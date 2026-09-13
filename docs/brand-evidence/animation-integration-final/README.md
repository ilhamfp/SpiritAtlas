# Classic Negroni integration verification

Verified 13 September 2026 against the local production preview on port 4175.
The imported movies, poster, particle cache, and textures remain unchanged.

The desktop scene scales with viewport height so its playback controls remain
visible. Ingredient labels reserve space, view and transport controls have 44px
targets, vertical swipes scroll over the live scene, reduced-motion camera
changes settle immediately, and returning to Cinematic cancels pending 3D work.

## Results

- Production build and TypeScript: passed. The existing shared Three.js chunk
  size warning remains; live 3D still loads only when requested.
- Asset integrity and playback: 11/11 checks passed using
  `node --experimental-strip-types --test tests/classic-negroni*.test.mjs`.
- Full focused browser suite: 16/16 passed in 1.8 minutes. The report and
  interaction screenshots are in `../animation-integration/`.
- Final correction: changed the scene caption from translucent 10px text to
  opaque Paper at 11px. Rebuilt and repeated all three responsive composition
  journeys: 3/3 passed. This directory contains their final screenshots/report.
- Caption contrast was sampled against every underlying decoded video pixel
  within each caption's bounding rectangle at the assembled pose. Minimum
  ratios were 7.07:1 at 1440px, 6.20:1 at 768px, and 5.99:1 at 390px. See
  `caption-contrast.json`. This measurement does not certify every movie frame.

The four new integration regressions cover desktop controls at 1440×1000 and
1280×900, stable layout while revealing ingredients, canceling and retrying a
delayed 3D load, offscreen playback suspension/resumption, and a real vertical
touch gesture over the live reduced-motion scene. Existing journeys cover
cinematic playback/reversal/looping, scrubbing, 3D mode continuity and rotation,
fallbacks, keyboard/touch navigation, all featured drinks, ingredient expansion,
comparison synchronization, and direct links/refresh.

Visual inspection covered 1440×1000, 768×1024, and 390×844 in two bounded rounds.
The classic retains its own identity; venue cards and their working atlas and
comparison scenes remain distinct.

This is local verification. The Behind the Bar task owns the combined release
and public verification; this task did not push or deploy independently.
