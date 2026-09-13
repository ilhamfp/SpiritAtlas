# SpiritAtlas behavior verification

## Accepted application and public URL

Public URL: https://spiritatlas-one.vercel.app. Application `b52c971` is the rewritten identity of tested `2807652`. Deployment `dpl_AspB2EQxQBkkjL3AFZ94DwaGZ99s` builds documentation commit `e13da8e` with identical application bytes. The fresh 34-resource comparison in `final-public/current-resource-check.json` confirms this boundary. Uncommitted refinements in another task are outside these results.

## Final verification

| Evidence | Result | Coverage |
| --- | --- | --- |
| `final-public/results.json` | 17/17 passed; 107.2 s; no skipped/flaky cases | Three viewport sizes, primary CTA, three bar entries, cinematic pixel changes/playback, live 3D, ingredients, comparison, direct routes/refresh, loading cancellation, offscreen pause, touch and reduced motion |
| `final-photos/results.json` | 4/4 passed; 23.6 s | All 11 local photo/source records; on-demand photos preserving mounted pose/camera; independent comparison photos and expansion; mobile without WebGL, image retry and the explicit missing-photo state |
| `final-live/results.json` | 1/1 mobile probe passed; zero errors | Visible keyboard focus, held renderer and faithful film loading state, actual keyboard/touch canvas changes, live expansion/reassembly, drawing stopped after reduced-motion settling |
| `final-public/current-resource-check.json` | 34/34 HTTP 200 and exact hashes | Public HTML, scripts, styles, both fonts, 11 photographs, generated artwork and loading posters |
| `final-public/current-vercel-build.log` | TypeScript and production build passed | Current public deployment from `e13da8e`; matches the saved application build |
| `animation-integration-final/README.md` | 11 unit checks and build passed; final three compositions passed | Playback/assets unchanged by the final compositor fix; caption minimum measured assembled-pose contrast 5.99:1 |
| `release-controls/results.json` | Six control groups passed | Stage Enter/R, visible keyboard focus, range, speeds, left orbit/exact reset, navigation anchors/footer; controls unchanged in accepted app |
| `release-extra/results.json` | Two desktop/mobile cases passed | Held real renderer, keyboard and pointer/touch orbit, live expand/collapse and reduced-motion settling; supplemented by current mobile probe |
| `dpr-motion/` | Eight public cases passed | Unchanged artwork at desktop/mobile widths, DPR 1/2 and normal/reduced motion; stable pixels after 1,500 ms and identical grid-cell coverage |

The focused suite rejects uncaught page errors, failed first-party HTTP responses and failed requests except navigation aborts. The unavailable-WebGL case deliberately records the expected context-creation diagnostic and verifies recovery; it is not a normal runtime error. With movie requests held, first contentful paint was 316 ms in the recorded browser sample, the headline/CTA and decoded poster were usable, and no heavy 3D scene assets were requested. Live rendering loads on demand.

Final visual and source-fidelity acceptance is recorded in [the final visual audit](final-public/visual-audit.md). Pixel screenshots alone do not prove interactions; the runtime results above do.

## Preservation and historical failures

The existing route/content/recipe/source/reference suite passed 39/39 locally before Classic integration. The later public `release-existing/` run recorded 36/39, exposing three real photo-loading failures: an unanchored Vercel exclusion dropped `public/references`. The final photo rerun above covers all three failed flows after the fix; current atlas/data/route hashes also match their recorded versions. This establishes preserved coverage across the runs without relabeling the failed run as a pass.

`production-release/` recorded 15/16 while an external deployment replaced a loaded asset version. The subsequent stable `final-public/` run passed all 17 focused cases. Earlier BBF runs and `production-accepted/` remain historical; the latter recorded 6 passes and 4 failures during the hero/deployment change. None are counted as final Classic acceptance.

## Reproduction

Use the accepted source revision for these recorded expectations; later refinements may change its tests. Set `ATLAS_BRAND_URL` to the public visitor alias and `ATLAS_BRAND_RUN` to a new evidence directory to preserve prior results.

```sh
ATLAS_BRAND_URL=https://spiritatlas-one.vercel.app ATLAS_BRAND_RUN=verify-public npx playwright test -c tests/brand.config.ts
ATLAS_BRAND_URL=https://spiritatlas-one.vercel.app ATLAS_BRAND_EXISTING=1 ATLAS_BRAND_RUN=verify-photos npx playwright test -c tests/brand.config.ts reference-photos.spec.ts
node docs/brand-evidence/final-live/probe.mjs
```

The mobile probe uses Chrome touch emulation and real WebGL on the test computer. It does not establish physical-device GPU performance or physically simulated ingredient separation.
