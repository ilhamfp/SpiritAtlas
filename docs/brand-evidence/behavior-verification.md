# SpiritAtlas behavior verification

Verified with independent Playwright-driven desktop Chrome/Chromium browser contexts. Local runs target SpiritAtlas at `http://127.0.0.1:4174`. The focused suite rejects accidental use of port 4173.

## Focused coverage

`tests/brand-journeys.spec.ts` exercises ten meaningful browser journeys:

- Hold GLB responses and verify the headline, primary action and decoded loading poster are visible before live geometry; verify only BBF Negroni's GLB is requested before interaction and real Instrument Sans and IBM Plex Mono files load.
- Capture and inspect 1440×1000, 768×1024 and 390×844 landing layouts; check horizontal overflow, decoded featured-bar images, viewport access to the primary action and computed text contrast.
- Activate the primary action with the keyboard, verify its visible focus ring, enter the atlas, enter all three featured bar experiences, reload each and return home.
- Expand/reassemble the hero through its visible button; compare actual component positions before, during and after. Verify visible orbit controls, keyboard arrows and mouse dragging change the real camera without accidental expansion.
- Enter the ingredient explanation through its landing link; enter all-three Negroni comparison; verify rendered synchronized camera changes, independent rotation isolation, expansion/reassembly, persisted refresh state, alignment reset and return home.
- Navigate directly to all three venue and drink routes and the shared comparison route, then refresh each.
- Simulate unavailable WebGL and verify explanatory fallback text and continuing access to ingredients.
- Use a touch-enabled 390×844 context with reduced motion; dispatch real browser touch input to rotate, use visible expansion controls, check stable component positions after settling and enter the atlas.

All focused journeys fail on uncaught browser errors, first-party failed HTTP responses and non-navigation-abort first-party request failures. Expected simulated WebGL unavailability is an explicit test condition.

## Evidence and commands

The baseline local run saved exact-sized viewport PNGs, full-page captures and rendered-motion JSON under `local/`. Its first contentful paint was 324 ms on this local machine, measured with the hero model held. This is a single local sample, not a public-network or low-end-device performance claim. One root-only GLB was requested, and Instrument Sans Variable and IBM Plex Mono were loaded. The initial 9/10 result had a test selector typo in the direct-route test, which was corrected before final verification.

```sh
npx playwright test -c tests/brand.config.ts
ATLAS_BRAND_EXISTING=1 ATLAS_BRAND_RUN=existing npx playwright test -c tests/brand.config.ts
ATLAS_BRAND_URL=https://spiritatlas-one.vercel.app ATLAS_BRAND_RUN=production npx playwright test -c tests/brand.config.ts
```

`tests/brand.config.ts` includes 39 existing route, content, source geometry, ingredient visibility, recipe completion, reference image and Espresso Martini behavior gates. It excludes unrelated optics prototypes and diagnostic suites.

Two existing tests needed maintenance for the current application: the collection-switching test now starts at the explicit atlas URL because `/` is the landing page; the phone Espresso test now inherits the configured base URL instead of hardcoding port 4173. Compact fallback assertions now account for the existing 56 px reference toolbar while retaining a 210 px fallback content area. No UI behavior was changed by these test edits.

## Final local results

- Final landing/browser verification: **10/10 passed**, 73 seconds, `local-final/results.json`. The exact three viewport PNGs are `local-final/homepage-1440x1000.png`, `local-final/homepage-768x1024.png` and `local-final/homepage-390x844.png` (dimensions also independently checked from the image files).
- Existing gates: **39 unique tests passed**. `existing/results.json` records 38 passes and the old fallback assertion loaded before its correction; `existing-fallback-fixed/results.json` records the corrected fallback test passing. Earlier interrupted or misconfigured results are not counted.
- Additional independent asset/source check files: `content/results.json` (8/8) and `editable-assets/results.json` (1/1).
- All measured headline, supporting copy and primary-action text contrasts passed 4.5:1. All featured bar posters decoded. No uncaught page error, failed first-party HTTP response or non-abort asset failure occurred in the focused final local run.
- Rendered-component snapshots demonstrate expansion and accurate reassembly, and actual camera snapshots demonstrate mouse/keyboard/touch orbit and comparison synchronization. This goes beyond checking button labels or URL changes.

The final public-browser run was paused at the user’s request after the favicon and bundle corrections were deployed. A passing final production suite is not claimed.
