# SpiritAtlas implementation and evidence

## Current release status — 13 September 2026

The public application at tested revision `2807652` includes the Classic Negroni framing, touch, reduced-motion and loading refinements, the reference-photo deployment fix, and the cinematic frame-composition fix. Its final focused public run passed all 17 journeys. Website work is paused at the user's request while the repository history is reviewed and republished; this document does not claim completion of the full design objective.

Public URL: https://spiritatlas-one.vercel.app. The latest inspected deployment is `dpl_9fenqtE46JZBHSUm3pCTxz47haEp`; its Vercel and local production builds succeeded. All 34 checked resources returned HTTP 200 and matched local bytes, including both font families, all 11 reference photographs, textures and posters. See `brand-evidence/final-public/`. Immutable metadata URLs are Vercel-protected; the public alias is the visitor URL. Revision IDs in historical evidence identify the code tested before the requested history amendments.

## Latest verification and identified corrections

- Public `2807652`: 17/17 focused journeys passed, covering all three viewport sizes, cinematic frame changes and playback, live 3D, touch scrolling, reduced motion, loading cancellation, the atlas and bar entries, ingredients, comparison, direct routes and refresh. Screenshots and machine-readable results: `brand-evidence/final-public/`.
- Earlier Classic refinement batch: production build and 11 unit checks passed, followed by 16/16 local browser journeys. The final solid Paper caption was rebuilt and all three viewport composition checks passed; the lowest sampled caption contrast is 5.99:1. Evidence: `brand-evidence/animation-integration-final/`.
- Public `bc4f017`: 12/12 landing journeys, 2 desktop/mobile live-3D loading/orbit/expansion checks, and 6 additional control groups passed. Both real fonts loaded. No normal first-party runtime errors occurred; the WebGL-failure test records its intentional context-creation diagnostic. Evidence: `brand-evidence/release-verification/`, `release-extra/`, and `release-controls/`.
- Historical public preservation checks: 36/39 passed. Three photo-loading journeys exposed 404 responses for all 11 reference images. The root-anchored `.vercelignore` fix now ships those images, and the latest public resource checks confirm all 11 return the correct bytes. The three photo interaction journeys have not yet been rerun after that fix. Evidence: `brand-evidence/release-existing/` and `final-public/deployment.json`.
- The intermediate `production-release/` browser run recorded 15 passes and one failure when an external deployment replaced its loaded asset version. Preserve that result as a mixed-deployment run; the subsequent stable `final-public/` run passed all 17 journeys.
- The original artwork and Bayer mask are unchanged; their source/asset hashes still match the recorded generation and DPR/motion evidence. No API-key pattern appears in current source/build assets; `.env` remains untracked.

The history review found zero removed-name matches across all 12 application commits and all 1,227 objects reachable from their main history, including archived and compressed assets. The wider scan of all current references also found zero matches in 1,490 objects. That review does not substitute for the remaining design acceptance.

## Scope and design authority

The user objective is the supplied `goal-objective.md`; exact typography, palette and artwork rules are in `SpiritAtlas-Brand-Kit/`. All five required kit files and both reference images were read or visually inspected. SpiritAtlas retains four cocktail collections. Its three featured bar entries connect Bar Bon Funk’s BBF Negroni, MOGA’s Ichigo Negroni and Bar Somma’s Negroni Express to the atlas, ingredient exploration, reference photographs and comparison.

The original art direction combines charcoal negative space, Instrument Sans and restrained IBM Plex Mono, orange ribbons, peach pools, dark channels and selected square-dot contours. Orange actions use dark text. The generated artwork is separate from drink rendering and interface layers; normal visits make no image-generation requests.

## Completed work and its evidence boundary

- Generated original desktop and separately recomposed mobile smooth textures with the verified `gpt-image-2.5-sunburst` identifier. Prompts, model/access verification and static asset records: [texture provenance](brand-evidence/texture-provenance.md).
- Applied an independent stable 5-CSS-pixel Bayer coverage mask. Eight public DPR/motion cases showed unchanged canvas pixels over 1,500 ms and identical grid-cell coverage across DPR 1/2 and normal/reduced motion. This remains evidence for the unchanged artwork, not the replacement hero. See `brand-evidence/dpr-motion/`.
- In the BBF hero version through `87c9eca`, preserved the live scene and reversible ingredient/orbit controls, rendered faithful loading posters, corrected mobile text joins, protected label contrast and compacted loading feedback so it cleared the glass and zoom controls. BBF visual and loading captures are historical; the Classic Negroni feature owns acceptance of its changed presentation and controls.
- Separated React from the lazy Three.js bundle, fixed the favicon, and stabilized the Canvas Suspense boundary in the earlier implementation. Prior scans found no API key in frontend source/build output; `.env` and `.vercel` were excluded from version control. These recorded checks do not replace final checks after integration.

## Recorded verification

| Evidence | Recorded result | Scope |
| --- | --- | --- |
| `brand-evidence/existing-complete/results.json` | 39/39 passed, 89.2 s | Existing route, content, ingredient, source and reference checks before Classic Negroni integration |
| `brand-evidence/production-complete/results.json` | 10/10 passed, 105.9 s | Public BBF landing at `2d39e07` |
| `brand-evidence/loading-accepted/results.json` | Passed | Public compact BBF loading badge at `87c9eca`; 11.36:1 contrast and no overlap with glass/zoom controls |
| `brand-evidence/production-accepted/results.json` | **6 passed, 4 failed**, 229.6 s | Mixed-deployment run; not final acceptance |

During `production-accepted/`, navigation requested an obsolete `App-CNqJ4F8m.js` chunk and received HTTP 404 as the deployment changed. Other failures targeted the BBF hero or its fallback after Classic Negroni replaced it. These are recorded failures, not a passing run or proof that the new hero satisfies the original goal. The directory name does not imply acceptance.

Earlier local BBF evidence includes 10/10 focused journeys, 4/4 loading/retry/WebGL/reduced-motion gates and source-grounded poster studies. Earlier public `production-final/` recorded 9/10 with an immediate poster-decode assertion failure; the subsequent readiness assertion waited for actual decode. Preserve these as history rather than current release status.

## Remaining work

Before completing the full design objective, review the final `2807652` screenshots against the brand checklist and rerun the three photo interaction journeys after the verified deployment fix. The latest focused public behavior run is complete; the prior BBF screenshots cannot prove the changed hero's visual acceptance. These remaining website checks were paused by the user's explicit stop instruction.

Detailed behavior scope: [behavior verification](brand-evidence/behavior-verification.md). Historical visual audit and the current release boundary: [visual audit](brand-evidence/completion/visual-audit.md). No final goal-completion claim is made.
