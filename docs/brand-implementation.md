# SpiritAtlas implementation and evidence

## Accepted public release — 13 September 2026

Public URL: https://spiritatlas-one.vercel.app. The inspected production deployment is `dpl_AspB2EQxQBkkjL3AFZ94DwaGZ99s`, built from `e13da8e`. Its application is identical to `b52c971` (formerly `2807652` before the requested history amendments). Fresh checks confirm all 34 recorded public resources have the same bytes as the tested application. Historical revision IDs identify the source originally tested.

The original landing objective is satisfied by the evidence below. All three required viewport compositions, the live cocktail, loading states and continuation were visually reviewed. No material visual defect remains in the inspected states. Later autoplay and studio refinements are separate ongoing work and are not represented as part of this accepted release.

## What changed

- Built the editorial landing with real Instrument Sans and IBM Plex Mono fonts, the exact charcoal/orange/peach/cream palette, the requested headline, and direct atlas, bar, ingredient and comparison entries. Existing four-collection behavior is preserved.
- Generated distinct desktop and portrait marbled textures using the verified `gpt-image-2.5-sunburst` identifier. A separate stable 5-CSS-pixel square-grid mask creates selected dissolve contours while keeping drink, type and controls sharp. Normal visits serve static artwork.
- Preserved the supplied Classic Negroni film and working interactive 3D scene. Corrected cinematic frame composition, scene framing, caption contrast, touch scrolling, reduced-motion camera behavior and cancellation of pending renderer loads.
- Kept initial copy and actions independent of heavy scenes, with a decoded poster and useful WebGL recovery. Fixed the Vercel exclusion rule so all 11 reference photographs ship.

## Completion evidence

| Objective criterion | Authoritative evidence and result |
| --- | --- |
| 1. Build and relevant gates | Local and Vercel TypeScript/production builds passed. The 11 playback/asset unit checks passed; their implementation and tests are unchanged in this release. Final public journeys: 17/17. Final reference gates: 4/4. No normal first-party runtime errors or failed required resources in these checks. |
| 2. Visual acceptance | Actual public first-viewport and full-page captures at 1440×1000, 768×1024 and 390×844, plus live/loading/expanded states: [final visual audit](brand-evidence/final-public/visual-audit.md). Fonts decoded, crops are intentional, and no material overflow or overlap was found. |
| 3. Controls and preservation | The 17 public journeys cover the primary CTA, all three bar entries, ingredients, comparison, route refresh, touch and reduced motion. Additional current mobile live and earlier unchanged control checks verify actual pointer/keyboard orbit, reset, visible focus, speed/range controls and return paths. The three previously failed photo interactions now pass. |
| 4. Loading and fallback | With cinematic files held, the headline, CTA and decoded poster remain usable without early heavy 3D requests; recorded FCP was 316 ms in that browser sample. Held renderer loading, cancellation/retry, induced WebGL failure and reduced-motion settling all pass. |
| 5. Public deployment | Fresh unauthenticated journeys pass at the public alias. All 34 checked resources return HTTP 200 with expected hashes, including fonts, all 11 reference photos, textures and posters. Direct atlas/drink routes and refresh pass. |
| 6. Final artifacts | Screenshots, build logs, resource/provenance checks and results are in `brand-evidence/final-public/`, `final-photos/` and `final-live/`. This document and the [behavior record](brand-evidence/behavior-verification.md) identify their scope and limitations. |

The full existing suite previously passed 39/39 locally. Its public rerun recorded 36/39 because of the photo deployment issue; the four final reference gates include the three corrected photo flows. These are complementary runs, not a claimed new single 39-case public run. Earlier failed and mixed-deployment evidence remains intact and is identified in the behavior record.

## Artwork, sources and credentials

All five required brand-kit files and both supplied reference images were inspected. The texture prompts, access verification, actual model identifier and asset hashes are recorded in [texture provenance](brand-evidence/texture-provenance.md). Eight public DPR/motion cases proved stable square coverage across DPR 1/2 and normal/reduced motion. Fresh source and asset hashes confirm that renderer and both textures are unchanged.

The bar descriptions, drink identities and reference photographs use existing project sources. The Classic Negroni keeps its original glass, ice, liquid and garnish assets; the live rendering remains available alongside the film. `.env` is ignored and absent from the committed application. The fresh scan of 136 relevant committed files found no credential patterns; source/build checks and provenance are retained without key values.

## Limits

The live renderer approximates the offline film's lighting. Ingredient motion is explanatory choreography, not a physical unmixing simulation. Timing and touch checks use desktop Chrome with mobile emulation; no physical low-end-phone GPU performance claim is made. Immutable Vercel metadata URLs remain protected; the public visitor alias above is verified without authentication.
