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
- `node --test tests/classic-negroni*.test.mjs` passes all 11 checks for asset
  integrity, video metadata, cache layout and reversible playback behavior.
- Browser checks covered cinematic separation, circulation, pause, reassembly,
  timeline scrubbing, half speed and switching between cinematic and live 3D
  while preserving the paused liquid pose.
- The final live renderer loads the 4,800-particle cache, responds to rotation
  and stops drawing once a paused view settles. No integration errors appeared
  in the browser console.
- The homepage fits both 390-pixel and 872-pixel viewports without horizontal
  overflow; the longer reassembly button also fits the mobile header.

The updated Playwright brand journeys were typechecked but the full suite was
not run. Browser verification above was performed interactively against the
local production preview.
