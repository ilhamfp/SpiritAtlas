# Classic Negroni homepage integration

The featured homepage serving is now the original **Classic Negroni** from the
user's *Negroni — Still Life* project. The venue-specific cards, atlas routes and
comparison viewers retain their own cocktails. The classic is not labeled as a
Bar Bon Funk recipe or linked to its detail page.

## Rendering and motion

- Cinematic uses the original Cycles movies without transcoding: 720 × 720,
  60 fps, 433 transition frames over 7.2 seconds, with a 144-frame, 2.4-second
  circulation loop. Reassembly uses the separately encoded reverse movie.
- Explore 3D reuses the original glass, modeled ice, orange V2 textures, HDR
  studio lighting, layered refraction and 128³ marching-cubes liquid surface.
  Three.js and the 4,800-particle cache load only when this mode is selected.
- The two views share progress, playback direction, pause state and speed.
  During final circulation the liquid samples the original loop while the
  ingredient rig stays fully separated.
- The homepage controls stay local to the component. Loading, visibility,
  reduced-motion and unmount cleanup are handled independently of the atlas.
- The stage scales with desktop viewport height to keep playback controls in
  view. Ingredient labels reserve their space so separation does not move the
  controls or the next section; transport and view controls use 44px targets.
- Vertical swipes scroll over the live scene while horizontal drags orbit it.
  Reduced motion also disables the live camera's easing and inertia, including
  when the preference changes after loading. Explicit playback stays available.
- Returning to Cinematic during a pending 3D load cancels that request. A later
  visit to Explore 3D starts a fresh load without leaving stale loading feedback.

The physical model and artistic limitations from the original study still
apply: directed forces separate ingredients, and reassembly retraces their
trajectory. It is not a simulation of mixed liquids spontaneously unmixing.
The live renderer approximates the cinematic lighting; it does not reproduce
Cycles' multi-bounce volumetric light transport.

## Files

- `src/negroni/ClassicNegroni.tsx`: native homepage playback and controls.
- `src/negroni/renderer.js`: reusable live renderer and resource lifecycle.
- `src/negroni/core/`: original modeling, surface and cache modules.
- `src/negroni/classic-negroni.css`: homepage presentation and responsive layout.
- `public/classic-negroni/`: original movies, poster, simulation and textures.
- `docs/classic-negroni-import.json`: original file sizes and SHA-256 hashes.

Imported movie, image, HDR and cache bytes are unchanged. Asset references in
the JSON manifests use the `/classic-negroni/` namespace so they do not collide
with the atlas's existing assets. No offline Blender regeneration is needed to
run this integration. The original rendering scripts and editable source
remain in the original study.

## Verification

Validated locally on 13 September 2026:

- `npm run build` passes, including TypeScript. Vite retains its existing
  warning about the shared Three.js chunk size.
- `node --experimental-strip-types --test tests/classic-negroni*.test.mjs`
  passes all 11 checks for asset
  integrity, video metadata, cache layout and reversible playback behavior.
- Browser checks covered cinematic separation, circulation, pause, reassembly,
  timeline scrubbing, half speed and switching between cinematic and live 3D
  while preserving the paused liquid pose.
- The final live renderer loads the 4,800-particle cache, responds to rotation
  and stops drawing once a paused view settles. No integration errors appeared
  in the browser console.
- The homepage fits both 390-pixel and 872-pixel viewports without horizontal
  overflow; the longer reassembly button also fits the mobile header.

Before the poster correction below, the focused Playwright suite included the
12 existing brand journeys and four integration regressions. All 16 passed
against that local production build:
desktop control visibility and stable ingredient layout, canceled-load recovery,
offscreen playback suspension, and actual touch scrolling with an immediately
settled reduced-motion camera. Responsive screenshots and the report are in
`docs/brand-evidence/animation-integration/`. A final caption adjustment uses
opaque Paper text at 11px; its responsive confirmation is recorded separately
under `docs/brand-evidence/animation-integration-final/`.

These checks cover the local integration. The Behind the Bar release owner
coordinates the combined production deployment and its public verification.

### Cinematic poster correction

A subsequent in-app browser check reproduced a visual failure: the cinematic
timeline and idle movie advanced while the assembled poster remained painted.
The source movies and copied production assets contained the correct explosion.
Videos now stay attached instead of toggling `display: none`, the selected film
uses an explicit opacity layer, and the standalone poster disappears when its
replacement frame is decoded. The redundant poster on the forward video has
also been removed.

The same browser now visibly shows the separated liquid, ice and orange, then
the assembled drink after reverse playback. The browser regression checks the
composed stage screenshots as well as media time so advancing playback alone
cannot pass this visual requirement.

The poster correction passes the production build and 11 asset/playback tests.
Its updated browser regressions were typechecked; the full browser suite was
not rerun. Visual verification used the in-app browser and local production
preview, including explosion, reassembly, scrubbing and a 3D round trip.
