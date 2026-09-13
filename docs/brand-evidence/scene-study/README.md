# Cocktail hero and poster evidence

Captured 13 September 2026 from the actual browser renderer. These cocktail images are static loading/preview captures of the same live GLBs, not image-generated drinks or replacements for the interactive experience.

## Source and changes

- Preserved the original three Negroni GLBs, ingredient identities, expansion poses and liquid attenuation colors. `model-provenance.json` records versions and SHA-256 hashes.
- Visually inspected `public/references/bbf-negroni.png`, `ichigo-negroni.png` and `negroni-express.png` against the existing scenes. The original source video is retained at `negroni-bar-crawl.mp4`.
- The optional `hero` viewer presentation keeps the original optical capture pipeline, with a transparent outer canvas. Its capture countertop is neutral and quieter. Hero lighting uses the already-supplied **Studio Small 09** HDRI by Sergej Majboroda / Poly Haven, CC0; see `public/textures/LICENSE.md`. It is a studio setting, not a photograph of a featured venue.
- Hero optical environment intensity is 0.3; background intensity is 0.14. The outer glass has 0.58 coverage alpha to composite its clear base over the page artwork. Original atlas scenes retain their bar environment and glass settings. No geometry or liquid tint was changed.
- Moved the model Suspense boundary inside the persistent Canvas. This fixes the observed delayed WebGL context loss after loading and subsequent orbit/expansion input.
- Hidden the duplicate internal hero drag instruction; accessible zoom buttons, keyboard orbit and expansion remain available.
- Added optional `onSupportChange(supported)` reporting so the landing can disable unavailable orbit controls and offer an ingredient-navigation fallback.

## Approved static assets

- `public/posters/{bbf-negroni,ichigo-negroni,negroni-express}-hero.png`: transparent 900 × 975 PNGs from 600 × 650 CSS-pixel live scenes, zoom 1.2. Used for the three bar previews.
- `public/posters/bbf-negroni-loading.png`: transparent 975 × 900 PNG, matching the landing's final initial orbit `{azimuth: -0.08, elevation: 0.16, zoom: 1.04}` in a 650 × 600 scene.
- `public/posters/{bbf-negroni,ichigo-negroni,negroni-express}.jpg`: original atlas setting, for each viewer's previously missing poster path.
- `bbf-negroni-mobile.png`: actual 382 × 310 CSS-pixel scene, inspected for mobile framing. The full glass and garnish remain within the canvas.

Regenerate with `node scripts/capture-posters.mjs`. The script starts a dedicated Vite server with file watching/HMR disabled, exercises each hero's keyboard orbit → expansion → reassembly, and then saves actual canvas PNGs and standard-view JPGs. Production builds include none of the development capture entry points.

## Verification

- All three hero scenes pass keyboard orbit, complete expansion and complete reassembly; no page errors. See `poster-capture-results.json`.
- Existing focused tests pass: held model loading remains explicit; a deliberately failed model request recovers through Retry 3D; unavailable WebGL retains usable facts/ingredients/navigation; reduced motion supports prompt expansion, collapse and keyboard inspection. Run `npx playwright test -c scripts/scene-qa.config.ts`; result: **4 passed**. Evidence: `../scene-qa-results.json`. Deliberately aborted model requests are expected only in the retry test.
- `npx tsc --noEmit` passes after the scene changes.
- Desktop hero captures and mobile framing were visually reviewed. These retain the source model's illustrative geometry; no claim of photographic equivalence is made.

The parent task records final production deployment, complete page screenshots and public navigation journeys separately.
