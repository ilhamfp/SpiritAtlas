# SpiritAtlas implementation and evidence

## Current release status — 13 September 2026

Remote `main` at `6e6effd` introduced the Classic Negroni hero while public verification was running. That feature has been preserved in the integrated working tree alongside the existing brand work. The original landing goal is **not marked complete**: the changed hero needs its own visual, loading, fallback and interaction acceptance, followed by a coherent public run against one stable deployment.

Public production alias: https://spiritatlas-one.vercel.app. Earlier unauthenticated checks returned HTTP 200. Historical screenshots and passing runs below describe their recorded versions; they do not establish acceptance of the Classic Negroni release. Immutable deployment metadata URLs were Vercel-protected when checked and are not the public visitor URL.

## Current integration checks

The integrated Classic Negroni working tree passes 11 unit checks (`node --experimental-strip-types`), the production build, and all 12 focused local journeys in about 1.4 minutes (`brand-evidence/integration-local/results.json`). These current local checks do not turn the mixed-deployment public run into a pass. Current-release public visual and behavioral acceptance remain unproven.

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

Retain the integrated Classic Negroni feature and verify its changed hero against the full objective: real interactive rendering, faithful loading/fallback states, visible and accessible controls, all three required viewport compositions, and the preserved bar/ingredient/comparison journeys. Run final public checks after deployment stabilizes and record that release’s screenshots and results. The prior BBF screenshots cannot prove the changed hero’s acceptance.

Detailed behavior scope: [behavior verification](brand-evidence/behavior-verification.md). Historical visual audit and the current release boundary: [visual audit](brand-evidence/completion/visual-audit.md). No final goal-completion claim is made.
