# SpiritAtlas visual audit — evidence scope

## Current release status

This report records visual review of the BBF landing through `87c9eca`, not final acceptance of the current release. Remote `main` at `6e6effd` added Classic Negroni while the public suite was running. That feature is preserved in the integrated working tree; its changed hero needs separate visual, loading, fallback and interaction acceptance against the original objective. **The goal is not marked complete.** The integration passes 11 unit checks, the production build and 12/12 local journeys in about 1.4 minutes (`../integration-local/results.json`). No new Classic Negroni visual audit or current-release public pass is claimed.

`production-complete/results.json` passed 10/10 public journeys at `2d39e07`; `existing-complete/results.json` passed 39/39 existing checks. The later `production-accepted/results.json` recorded **6 passes and 4 failures** across changing deployments, including an obsolete App chunk returning 404 and checks targeting the replaced BBF hero. Neither that directory’s name nor its earlier BBF screenshots establish a final passing release.

## Review method and sources

An independent visual reviewer read the exact user objective, all five brand-kit inputs, project design context and the Impeccable review guidance. Both supplied reference PNGs were opened with image-viewing tools, as were the real BBF, Ichigo and Negroni Express reference crops. The review inspected actual saved production viewport and full-page screenshots at 1440×1000, 768×1024 and 390×844, plus expanded hero, comparison and mobile atlas views. Native-size crops were used where full-page downscaling obscured small text.

Reviewed evidence includes `production-final/`, `production-verified/`, `production-complete/`, the BBF homepage captures written early in `production-accepted/`, and `loading-accepted/`. These are historical images of the BBF version. Still-image inspection was kept distinct from browser behavior, runtime and accessibility checks.

## Findings for the original artwork and BBF composition

| Criterion | Observed evidence and scope |
| --- | --- |
| Editorial hierarchy | Charcoal negative space, quiet wordmark/navigation, large three-line headline, concise copy and a distinct dark-on-orange primary action. |
| Marbling and partial dissolve | Smooth directional orange ribbons and peach pools separated by dark channels, with selected contours transitioning through dense and sparse regular squares. Copy and controls remain outside the decorative treatment. |
| Responsive composition | Complete BBF glass and garnish at all three widths; a deliberate desktop two-column composition and mobile headline/action/scene stack. Three equal bar entries, ingredient explanation and comparison invitation continue below. |
| Real drink identity | BBF reference traits remain recognizable: straight rocks glass, heavy base, deep red liquid and rounded orange garnish. Ichigo stays amber with flower/red garnish; Somma retains red-orange liquid and curved green shishito. These observations do not establish Classic Negroni fidelity. |
| Typography and color | Instrument Sans with restrained IBM Plex Mono, cream/orange hierarchy and dark text on orange buttons match the kit. Historical browser runs separately verified font loading and contrast. |
| Corrected responsive text | The BBF release corrected missing spaces in the mobile atlas headline and landing bar introduction. New integration must preserve those corrections. |
| Atlas evidence | The later mobile capture shows a settled map with street detail and venue markers, replacing the earlier loading-overlay screenshot. |
| Loading presentation | BBF code-loading text has an opaque charcoal backing and 6.87:1 contrast. Its compact model-loading badge measures 11.36:1, clears the poster glass and both zoom buttons, and is recorded in `loading-accepted/`. These badge checks apply to that BBF component. |

No unresolved material visual defect was identified in those inspected BBF states after the recorded corrections. This is a scoped historical finding, not a claim about the replacement hero.

## Stable artwork measurements

`dpr-motion/results.json` records eight fresh public Chrome contexts: 1440×1000 and 390×844, each at DPR 1/2 with normal/reduced motion. The actual decorative Canvas2D RGBA hashes remained identical over 1,500 ms in every case. Coverage at 51,552 desktop and 13,806 mobile cell centers matched exactly across DPR and motion settings. Reduced motion removed the headline animation. The 3D dependency was intentionally held to isolate the decorative layer.

These original asset and stable-grid results remain valid for unchanged decorative code. They cannot prove a changed hero’s frame, motion, touch controls, fallback or real-time interaction. The new Classic Negroni feature owns those acceptance checks.

## Public URL and completion boundary

The visitor URL is https://spiritatlas-one.vercel.app; historical fresh unauthenticated sessions returned HTTP 200. Immutable deployment metadata URLs were Vercel-protected when checked. The public alias changed during the last suite, so a coherent current-release acceptance result requires a stable deployment and new evidence for the changed feature.

Retain the integrated work, then verify all required viewports, headline/loading behavior, real interactive rendering, bar entries, ingredient expansion/collapse, orbit, comparison, return paths, touch, keyboard, reduced motion and runtime asset health. Earlier BBF images and passing tests must not substitute for those current-state checks.
