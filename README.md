# SpiritAtlas

A local React application for exploring six Singapore bars through four cocktail collections and twelve drinks. Choose a venue on the map, inspect its live 3D drink, separate the ingredients, and compare two or three interpretations with shared expansion and optional synchronized rotation.

| Collection | Drinks and venues |
|---|---|
| Negronis | BBF Negroni · Bar Bon Funk; Ichigo Negroni · MOGA; Negroni Express · Bar Somma |
| Espresso Martinis | ATLAS Espresso Martini · ATLAS; Espresso Martini · Jigger & Pony; Nighthawks · Night Hawk |
| Martinis | ATLAS Martini · ATLAS; Dirty Sake-Tini · MOGA; Mirko’s Martini · Bar Somma |
| Highballs | Salted Yuzu Highball · MOGA; Pine Highball · Bar Somma; Wasabi Highball · Jigger & Pony |

The Negronis preserve the supplied filmed versions. Espresso recipes come from current official menus checked **13 September 2026**, while their serving geometry uses explicitly dated **April 2024** bar-supplied photos. Nighthawks is an espresso-martini riff with hot coconut foam. The collection does not imply every recipe follows the classic formula.

The user ended the photographic-perfection work and expanded the product scope on 13 September 2026. [PRD v3.1](PRD.md) is the release contract. The current visual baseline is retained; old optical experiments and photographic failures remain archived honestly and do not restart that work. [GOAL_STATUS.md](GOAL_STATUS.md) records completion; [the reference-photo follow-up](qa/reference-photos.md) records eleven passing checks. [The preceding expansion report](qa/new-collections.md) records 17 passing focused checks, and [the earlier two-collection release report](qa/collections-release.md) preserves its 19 passing executions and measurement limits.

The Martini and Highball additions use current official menus and attributed serving references. Pine Highball has an explicitly illustrative presentation. Martini comparisons use five categories and highballs four, without filler garnish rows. [New collection research and verification](qa/new-collections.md) records their source qualifications and delivery.

## Run locally

Verified environment: Node 22.17.1, npm 10.9.2. No API keys, private services, or running Blender process are required.

```sh
npm ci
npm run dev -- --host 127.0.0.1 --port 5173
```

Open http://127.0.0.1:5173. Build and inspect the local production bundle:

```sh
npm run build
npm run preview -- --port 4173
```

The app is in `dist/`. Fonts, stage textures and GLBs are local. Maps require internet access; a useful venue list and directions remain available when map tiles fail. Original source photos, video and editable Blender files are preserved outside `public/`. Eleven selected reference copies are bundled under `public/references/` and load only when requested with the Reference photo button. Nothing has been externally deployed.

## Routes and controls

| Route | Restored state |
|---|---|
| `/?collection=espresso-martini` | Espresso martini atlas |
| `/?collection=martini` | Martini atlas |
| `/?collection=highball&bar=bar-somma` | Highball atlas with Somma’s Pine Highball selected |
| `/?compare=atlas-martini,moga-dirty-sake-tini,somma-mirkos-martini&expand=1` | Expanded Martini trio |
| `/?bar=bar-somma` | Original atlas with Bar Somma selected |
| `/?drink=atlas-espresso-martini` | ATLAS drink; family inferred from the drink |
| `/?drink=nighthawks&expand=1` | Expanded Nighthawks |
| `/?compare=atlas-espresso-martini,jigger-espresso-martini,nighthawks&expand=1` | Expanded espresso trio |
| `/?compare=bbf-negroni,negroni-express&sync=0&expand=0` | Original two-drink comparison with independent orbit |
| `/?drink=nighthawks&webgl=off` | Useful no-WebGL fallback diagnostic |

Comparisons stay within the selected collection and contain at most three drinks. Changing collections resets the selection. The first valid comparison drink determines the family; malformed mixed-family URLs are filtered. Existing Negroni links remain valid.

Share copies a clean link to the current view, including expansion and comparison synchronization. If clipboard access is unavailable, a selected text field supports manual copying and stays current during navigation. Escape closes it and returns focus to Share. [Functional follow-up checks](qa/prd-functional-followup.md) cover both flows.

Drag to orbit. Visible controls rotate, tilt, zoom and reset; a focused viewer accepts arrow keys, `+`/`-`, and Space to expand/reassemble. The expansion button and slider are available alongside double-click. Horizontal touch dragging rotates; surrounding content scrolls normally. Reduced-motion preferences make expansion immediate. Resting and offscreen viewers stop drawing.

Each drink viewer and comparison column has **3D model / Reference photo** buttons. Photo mode shows the full image, attribution, source link and date/scope notes; returning to 3D preserves the current orbit and expansion. Photos remain available without WebGL. Pine Highball has no verified serving photograph and says so explicitly. The new ATLAS Martini photo shows a rounded crystal coupe, making the model's illustrative V-shaped glass difference visible. [Reference comparison implementation and checks](qa/reference-photos.md) document the feature.

Campari is included in all three Negronis following the atlas editor’s confirmation. Source details distinguish that correction from independent menu/video evidence. Current recipe data supplies live labels and illustrative colors over the preserved model geometry; [the correction record](qa/campari-correction.md) documents this separation.

Recipe objects are explanatory forms. Their size does not imply a quantity or a literal unmixed layer. All six former **Unknown** ingredient labels now use researched matches, visibly marked **estimated** in lists, 3D labels and comparisons. Source details explain each choice. Jigger & Pony's coffee liqueur is a classic-recipe estimate; its current BLOOM menu does not list a liqueur. All unpublished measures stay `null`. [Ingredient completion](qa/recipe-completion.md) records the choices and evidence.

Small ingredients are enlarged where needed for inspection: ATLAS's cinnamon becomes an illustrative powder mound, and Night Hawk's chocolate, MSG, rum and vodka have distinct forms. Flat espresso garnishes tilt in recipe view. Reassembly restores the original serving. [Visibility changes and checks](qa/ingredient-visibility.md) document the current `espresso-v2-visibility` assets.

Comparison supports shared expansion, synchronized or independent orbit, removal, reset alignment, and a mobile drink selector. Bar Bon Funk and Somma retain separate venue choices at their shared New Bahru building point. The espresso collection adds three independently verified OneMap building locations.

## Sources and editable assets

- `src/data/drinks.ts` retains the filmed Negroni evidence and collection interfaces; `src/data/espresso.ts` contains current-menu facts and dated-photo qualifications.
- [Recipe completion research](references/recipe-completion/) reviews all six cocktails; individual inferred ingredients retain direct source links and an explicit evidence status.
- [Espresso reference dossier](references/espresso-martini/research.md), saved menu PDFs, dated photos, OneMap responses and source hashes are in `references/espresso-martini/`. Selected dated-photo copies are now available through the user-requested reference comparison; originals are preserved.
- [Embedded reference manifest](references/embedded-reference-manifest.json) records exact-copy hashes, dimensions, credits and provenance for all eleven displayed photos/stills. Display metadata is in `src/data/drinkReferences.ts`.
- Every drink has an editable `assets/blender/{drink-id}.blend`, matching JSON manifest and `public/models/{drink-id}.glb`.
- Negroni geometry stays at the existing v0.15.1-baked release baseline. [Its reproducibility report](qa/asset-reproduction.md) records exact geometry reproduction and the limits of bake byte parity.
- [Martini and Highball research](references/new-collections/) contains complete-menu screening, reference provenance and source qualifications. `src/data/newCollections.ts` contains their recipes and render profiles.
- Espresso geometry is independently authored with the reproducible script below. It distinguishes stemmed vessel profiles, cream and foam, cinnamon, cacao tuile and the dated Night Hawk garnish. It is an illustration, not a claim of photographic equivalence.

```sh
# New espresso collection (Blender installed in /Applications)
npm run assets:espresso

# New Martini and Highball collections
npm run assets:collections

# Existing baked Negroni assets
npm run assets:build
```

The commands require Blender 5.2.1 LTS; adjust the executable path on another system. Runtime metadata preserves component IDs, category, role and vertical lift so the live app can restore the assembled poses without a backend. Experiment scripts and optical diagnostic HTML files are separate from the production entry.

## Verification and performance

Build the app and run production preview on 4173, then execute the focused release checks:

```sh
npx playwright test -c tests/collections.config.ts
```

These use installed Google Chrome, one worker, and retain release evidence under `qa/interaction-artifacts/`. Set `ATLAS_COLLECTION_RUN` to give a run its own artifact prefix. The content contract protects the original filmed Negronis; collection checks inspect recipe evidence, runtime geometry, real rendered component poses, recipe reversal, synchronized comparisons and resting draw counts. Additional route checks cover all four collections, reused venue identities and responsive navigation. [Current verification](qa/new-collections.md) separates new checks from retained historical coverage.

The older behavior suites remain available with `npm test`. Historical optical/performance commands and their exact reports are preserved in [the previous README](qa/checkpoints/README-before-cocktail-collections.md).

The viewer caps single-drink resolution at DPR 1.5 and comparison at DPR 1. CSS text remains at native screen resolution. Coffee is opaque, and espresso glasses need one transmission capture; unused ice/liquid buffers are 1×1. The detailed Negronis retain their existing transmission pipeline. Runtime models load on demand rather than all twelve at startup. Large Three.js/map chunks still produce a build advisory; physical mobile GPU performance remains unverified. See [release evidence](qa/collections-release.md) for measured rendering rates and download sizes.

## Implementation references

The app adapts public architectural patterns from Pearl for stable ingredient identities, stored poses, reversible vertical expansion and projected labels. [Pearl reference review](qa/pearl-reference-review.md) records the reviewed revision and attribution decisions. Cocktail geometry, data and runtime assets are independently authored; no private Pearl assets or services are used.
