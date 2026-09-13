# SpiritAtlas implementation and evidence

## Objective and authority
User objective: attachment goal-objective.md. Exact palette, typography and artwork rules: SpiritAtlas-Brand-Kit. Both reference images visually inspected on 2026-09-13.

## Application scope
SpiritAtlas contains four cocktail collections. The landing page focuses on Bar Bon Funk’s BBF Negroni, MOGA’s Ichigo Negroni and Bar Somma’s Negroni Express, while retaining atlas navigation, ingredient exploration, reference photographs and comparison.

## Art direction
Visual thesis: a spacious charcoal cocktail publication, with smooth orange ribbons and peach pools dissolving into ordered squares around a sharply rendered real Negroni.
Content plan: editorial hero and live drink; three bar entries; explanation of ingredient exploration; three-Negroni comparison invitation.
Interaction thesis: restrained hero reveal; manual orbit and ingredient reveal; editorial links transition into preserved atlas/drink/comparison routes. No ambient spin, random moving particles or visitor image generation.

## Initial implementation notes
- Read all five required kit files and visually inspected reference and supplied texture.
- Existing atlas includes query routes, explicit expansion controls, touch/keyboard orbit, comparison sync and reference photographs.
- Vercel CLI authenticated as ilhamfp; no existing SpiritAtlas project link found.
- .env is ignored and never read into frontend code; development generation only.
- Requested image model verified in official documentation; asset agent checks actual account access.

## Initial work plan
Implement landing composition, integrate brand fonts/tokens, render faithful posters, inspect and refine all three viewports, run existing behavioral gates, production deploy and verify unauthenticated journeys.

## Visual pass 1 (local Chromium)
Actual screenshots captured at 1440×1000, 768×1024, 390×844. Fonts loaded; no horizontal overflow. Identified: decorative field behind caption/coordinates reduced contrast, redundant viewer instructions, mobile cocktail too small, pending MOGA/Somma posters. Correcting artwork fade/calm label surfaces and responsive live camera sizing before next review. Build and TypeScript pass; expected large Three.js chunk remains lazy-loaded.
- Mobile framing root cause found in actual computed canvas dimensions: canvas was 382×150 inside a 310px stage. Made live viewer fill a definite positioned stage; now 382×310, preserving authored camera.
- Exact-model texture generation complete: gpt-image-2.5-sunburst, verified account access, desktop and independently recomposed mobile images. Separate stable 5-CSS-pixel Bayer coverage mask, no per-frame randomness. Prompts and provenance: docs/brand-evidence/texture-provenance.md.
- New Vercel project spiritatlas linked under authenticated account. Initial production deployment underway; final verification will follow the completed visual fixes.
- Poster/loading assets now rendered from the actual scenes, including all original three Negronis. Dedicated BBF loading poster matches the final landing camera. Scene provenance: docs/brand-evidence/scene-study/.
- Canvas Suspense boundary moved inside the stable Canvas after repeated captures exposed canvas recreation during load. Browser orbit → expansion → reassembly passes for all three; materials/geometry and atlas optical behavior preserved.
- First local behavior run: 9/10 tests passed; the remaining failure was an incorrect test selector, corrected. Required user journeys, fallback, fonts, reduced motion and only one initial GLB all passed. Relevant existing collection gates running.
- Accessibility review corrections: mobile zoom/rotation targets at least 44×44 px; mono indices minimum 11 px; ingredient annotations 12 px. Dark text remains on orange and peach actions.
- Source and built frontend scan found no OPENAI_API_KEY, public key variable, or API-key token pattern. git check-ignore confirms .env and .vercel metadata excluded; git ls-files .env empty.
- Public alias returned HTTP 200 without authentication. Final build/deployment inspection remains pending latest visual adjustments.

## Final local verification
- Brand journey suite: 10/10 passing at 1440×1000, 768×1024 and 390×844. No horizontal overflow; font files loaded; poster images decoded; contrast checks pass. All required links, orbit, ingredient expansion/reassembly, comparison synchronization/independence, touch and keyboard journeys pass.
- Existing relevant collection/content/geometry/source gates: 39 unique tests pass. Two assertions were updated for the intentional landing route and existing reference-viewer toolbar; a hardcoded test port was corrected to use the configured application URL. Run history retained.
- Existing held-loading, failed-model retry, WebGL fallback and reduced-motion runtime gates: 4/4 pass. Hero orbit/expand/reassemble also verified for each of the three drinks during poster capture.
- Hero review: neutral studio environment removes blue ice cast; controlled outer-glass coverage allows the base to transmit the decorative field instead of appearing solid brown. Original atlas scene environment/materials remain. No model geometry regenerated.
- WebGL fallback exposes ingredient navigation and disables unavailable hero orbit arrows.
- Relevant artifacts: docs/brand-evidence/local-final/, existing/, existing-additional/, scene-study/, scene-qa-results.json. Production verification pending final deployment.

## Production deployment
Public alias: https://spiritatlas-one.vercel.app
Initial code deployment: https://spiritatlas-7w418snuo-ilham-firdausi-putras-projects.vercel.app
Vercel deployment ID: dpl_9RW7C1VagL7hxj7gHuhsNcSfXK3S. Ready, production, 2026-09-13. Remote Vercel build (TypeScript + Vite) passed, alongside local production build. No separate lint script exists in the existing project.
A fresh unauthenticated Chromium verification of this deployment is in progress; production screenshots/results will be under docs/brand-evidence/production/.
