# Specialty Negroni runtime migration

This imports the completed `bar-test` animation snapshot into the existing
SpiritAtlas viewer for `bbf-negroni`, `ichigo-negroni` and `negroni-express`.
The homepage Classic Negroni, other cocktail collections, reference photos,
recipe evidence and diagnostic model routes retain their existing behavior.

The three specialty scenes use the original classic glass, three ice cubes,
cached liquid deconstruction, continuous separated circulation and reassembly.
Their palettes and garnishes come from the completed source snapshot: orange
for BBF, the yellow flower and red garnish for Ichigo, and pickled shishito for
Negroni Express. This is the snapshot before the separately requested larger
ice block, larger chilli and subsequent performance work.

## Integration

- `src/scenes/Viewer.tsx` selects the new renderer only for the three IDs. It
  derives liquid labels from the current SpiritAtlas catalog, including
  confirmed Campari and explicitly marked ingredient estimates.
- `src/scenes/ClassicVariantViewer.tsx` connects the source renderer to the
  existing expansion, orbit, ingredient-selection and reference-photo controls.
- `src/animation/` contains the required runtime dependency closure. Source
  animation, geometry and garnish modules are preserved.
- The new runtime assets are
  `public/classic-negroni/simulation/droplet-clearance.json` and its versioned
  binary, `droplet-clearance.0d17a63a2ee0db8175db.bin`.
- The 12 existing shared cinematic, simulation, texture and HDR assets matched
  the source hashes and were not overwritten.

The specialty scenes run in live 3D. No specialty cinematic movies are enabled
in this snapshot. Optional film-controller code remains available for a later
completed render. Native source caches, partial Cycles renders and intermediate
artifacts are not required or included.

The five visible groups illustrate the liquid foundations, serving structure
and garnish. The existing recipe sidebar retains the full ingredient list,
including modifiers. Shapes and sizes do not imply measured quantities.

## Validation

- Production build and TypeScript pass.
- The 12 current homepage asset/playback checks pass (29 checks total with the
  specialty runtime tests).
- The five imported test files contain 17 passing checks covering playback,
  palette transitions, garnish geometry, droplet masking and the shipped
  clearance artifact. The artifact check obtains phases from the shipped fluid
  cache instead of requiring a local offline-export manifest.
- `@napi-rs/canvas` is a development dependency for portable garnish checks.
- In-app browser checks covered all three live drink routes, visible separated
  circulation with the correct palettes/garnishes, Express and Ichigo returning
  to their assembled endpoints, the BBF reference photograph, and all three
  live scenes together in the comparison view. Shared reassembly returned all
  three to phase zero with playback stopped; no browser errors were reported.

The existing browser tests that assert the old six-category GLB mesh inventory
remain specific to that renderer. They are not evidence for these new fluid
scenes; the migration does not claim a full legacy browser-suite pass or a
measured frame-rate target.

The migration is applied on top of the updated `main` revision `36fb164`,
retaining its Behind the Bar studio, native-motion integration and unified
homepage player. No source files from the subsequent bar-test revision were
recopied after this snapshot was captured.
