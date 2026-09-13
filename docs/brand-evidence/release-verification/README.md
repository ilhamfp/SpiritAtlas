# Public landing verification at bc4f017

The prior goal turn made concrete progress: it preserved the incoming Classic Negroni feature, reconciled the landing fixes, verified local behavior, scanned rewritten history, and pushed `bc4f017`.

This resumed audit checked the actual public alias at Vercel deployment `dpl_2wmqnZPCcrmew1UUL8tN3jKFXhHk`:

- All 18 HTML/script/style/font assets matched the local production build. The Vercel build log identifies Git revision `bc4f017` and a successful TypeScript/Vite build.
- All 12 public landing journeys passed. The single browser error in the report is the intentionally induced WebGL context failure; normal journeys had no runtime errors.
- The headline and primary action were usable while the movies were held; the faithful poster decoded, with no scene assets requested. This run measured first contentful paint at668ms on this desktop browser, not a low-end-device promise.
- Two additional public desktop/mobile cases verify held live-renderer loading, keyboard and real pointer/touch orbit, live expansion/reassembly, and drawing stopping after a reduced-motion view settles. See `../release-extra/`.
- Six additional control groups passed, including actual stage focus, Enter/R, keyboard range, all speed values, left orbit and exact reset, header anchors and footer returns. See `../release-controls/`.
- All three viewport/full-page compositions and actual live/load states were visually inspected. The small translucent scene caption has a confirmed mobile contrast defect (about4.37:1); the animation integration task is correcting it to solid Paper.
- Existing collection tests finished36/39. Three reference-photo journeys exposed actual production404s for all11 published reference images. The unanchored `references` rule in `.vercelignore` excluded `public/references`; commit `520d446` anchors the development exclusion at the root. See `../release-existing/`.

This is not final completion. The release owner must publish the photo fix and bounded Classic refinements, then current production evidence must verify them. Prior report files remain unchanged.

The design detector reports only design-system size/radius/color advisories. Their rendered roles were reviewed: compact media controls and ingredient markers use the existing Classic component's scale and source colors. They are not runtime failures or a mandate to alter the pinned artwork. The measured caption contrast issue is tracked separately above.
