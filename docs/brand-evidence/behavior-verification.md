# SpiritAtlas behavior verification

## Current evidence boundary

Remote `main` at `6e6effd` introduced Classic Negroni during the last public run. The feature has been preserved in the integrated working tree. The saved BBF checks and screenshots are historical evidence through `87c9eca`; they must not be presented as final verification of the replacement hero. Its changed controls, rendering, loading and fallback behavior require their own acceptance. The original goal remains incomplete.

The integrated working tree passes 11 unit checks (`node --experimental-strip-types`), the production build, and **12/12 focused local journeys** in about 1.4 minutes (`integration-local/results.json`). Current-release public visual and behavioral acceptance remain unproven.

## Recorded runs

| Run | Result | What it proves |
| --- | --- | --- |
| `integration-local/results.json` | **12/12 passed**, about 1.4 min | Current integrated Classic Negroni release, local browser verification |
| `existing-complete/results.json` | **39/39 passed**, 89.2 s | Existing route, content, source geometry, ingredient, recipe and reference gates before integration |
| `production-complete/results.json` | **10/10 passed**, 105.9 s | Public BBF landing journeys at `2d39e07` |
| `loading-accepted/results.json` | Passed | Public BBF compact loading state at `87c9eca`, including a held real GLB request, 11.36:1 text contrast and no glass/control overlap |
| `production-accepted/results.json` | **6 passed, 4 failed**, 229.6 s | A run spanning different deployments; not final public acceptance |

The failed keyboard/bar journey in `production-accepted/` records HTTP 404 for `/assets/App-CNqJ4F8m.js` and a failed dynamic import during the deployment change. Two other failures wait for `viewer-bbf-negroni` after the landing hero changed; the fallback check expects the earlier BBF unavailable-WebGL message. These failures are retained without converting them into passes. A new, coherent public run must exercise the integrated release once its deployment is stable.

The public visitor URL is https://spiritatlas-one.vercel.app. Earlier fresh unauthenticated sessions returned HTTP 200. A separate immutable deployment URL redirected to Vercel login; no authentication settings were changed.

## Historical focused coverage

Independent Playwright Chrome/Chromium contexts exercised the BBF implementation’s meaningful risks:

- Headline, primary CTA, real fonts and decoded poster before 3D code or models finished; only the hero GLB requested initially.
- Landing views at 1440×1000, 768×1024 and 390×844, with overflow, image decode, CTA visibility and text-contrast checks.
- Keyboard CTA and visible focus, all three bar entries, direct route navigation/refresh and return home.
- Real component expansion/reassembly and actual mouse, keyboard and touch camera changes.
- Ingredient navigation and the three-drink comparison, including synchronized/independent rotation, reset, refresh and return paths.
- Unavailable-WebGL fallback and reduced-motion behavior without blocking ingredient information.

These runs rejected uncaught page errors, failed first-party HTTP responses and non-navigation-abort request failures. Simulated WebGL unavailability was an explicit test condition. Historical passing runs do not revalidate changed code automatically.

## Earlier local evidence

`local-final/results.json` records 10/10 BBF journeys in 73 seconds. Existing baseline evidence previously combined 38 passes with a separately corrected fallback assertion; `existing-complete/` now contains the clean 39/39 run. Additional content and editable-asset files recorded 8/8 and 1/1 passes. Separate loading, retry, unavailable-WebGL and reduced-motion gates recorded 4/4.

Two earlier tests were maintained for the landing route and configured server URL. Fallback assertions account for the 56px reference toolbar while retaining a 210px fallback content area. The original local 324ms first contentful paint sample is a single local-machine observation, not a public-network or low-end-device guarantee.

`production-final/results.json` recorded 9/10 after favicon/bundle corrections, with a premature poster-decode assertion. The later test waits for actual image decode. That historical result is superseded by the passing BBF run at `2d39e07`, not by a claimed pass for the current Classic Negroni feature.

## Reverification commands

```sh
npx playwright test -c tests/brand.config.ts
ATLAS_BRAND_EXISTING=1 ATLAS_BRAND_RUN=existing npx playwright test -c tests/brand.config.ts
ATLAS_BRAND_URL=https://spiritatlas-one.vercel.app ATLAS_BRAND_RUN=production npx playwright test -c tests/brand.config.ts
```

Focused expectations now exercise the integrated hero while retaining meaningful behavior assertions; all 12 local journeys passed. Final public success, runtime cleanliness and visual acceptance remain unproven until that release is checked.
