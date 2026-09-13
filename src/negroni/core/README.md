# Original Negroni studio sources

These modules come from the existing `explode-anim` Negroni study in this
workspace. They preserve the original glass and garnish geometry, fluid cache
interpolation, liquid surface reconstruction, materials and choreography.
The source project's package declares the ISC license.

- `studio.js`, `garnish.js`, `citrus-material.js`: original lighting, refraction,
  hand-cut ice and Valencia orange v2 material.
- `cached-fluid.js`, `particle-surface.js`: original 4,800-particle baked fluid
  reconstruction at a 128³ grid; requests now accept an abort signal and use
  `/classic-negroni/` assets.
- `choreography.js`, `liquid-idle.js`: original garnish motion and idle sampling.
- `bounded-marching-cubes.js`: Three.js r186 MarchingCubes with the original
  conservative bounds and upload optimizations. Its upstream MIT license and
  attribution remain embedded in the file.

Runtime dependency: the application's existing Three.js `0.186.0`, including
OrbitControls, HDRLoader, RectAreaLightUniformsLib and RoundedBoxGeometry.
`renderer.js` owns resource lifetime and adds no application document listeners.
Upstream OrbitControls temporarily uses document pointer and modifier-key
listeners; its `dispose()` removes all of them. It does not install page
playback shortcuts or opt into arrow-key navigation.
The parent component should pass an `AbortSignal`, call `setVisible(false)`
when hidden, and dispose the resolved instance on unmount.
