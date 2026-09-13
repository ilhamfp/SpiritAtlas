# SpiritAtlas — Product Requirements

**Version 3.1 · Collection contract · 13 September 2026**

This document records the collection requirements. The subsequent landing page and deployment work is recorded in [implementation and evidence](docs/brand-implementation.md).

The product lets visitors discover twelve cocktails across six Singapore bars, inspect them as real interactive 3D objects, explore ingredients and compare two or three interpretations within a collection. The user accepts the current drink visuals and has ended further photographic refinement. This contract governs the delivered product; [acceptance status](qa/acceptance-status.md) records its verification and limits.

## 1. Scope and delivery

| Collection | Cocktail | Venue |
|---|---|---|
| Negronis | BBF Negroni | Bar Bon Funk |
| Negronis | Ichigo Negroni | MOGA |
| Negronis | Negroni Express | Bar Somma |
| Espresso Martinis | ATLAS Espresso Martini | ATLAS |
| Espresso Martinis | Espresso Martini | Jigger & Pony |
| Espresso Martinis | Nighthawks | Night Hawk |
| Martinis | ATLAS Martini | ATLAS |
| Martinis | Dirty Sake-Tini | MOGA |
| Martinis | Mirko’s Martini | Bar Somma |
| Highballs | Salted Yuzu Highball | MOGA |
| Highballs | Pine Highball | Bar Somma |
| Highballs | Wasabi Highball | Jigger & Pony |

Retain the current typography, palette and shared softly blurred bar/counter presentation. Each cocktail must keep its distinctive serving form and ingredients. Nighthawks is an espresso-martini riff; membership in the collection does not imply a classic recipe or equal measures.

Deliver a locally runnable production build with source data, editable Blender scenes and reproducible runtime exports. Runtime use requires neither Blender nor private services. External hosting, reservations, payments and venue messaging are outside this delivery.

## 2. Discover bars and navigate

- Provide clearly named Negronis, Espresso Martinis, Martinis and Highballs collection controls, an interactive Singapore map and an equivalent accessible venue list.
- Selecting a marker or list entry identifies the same venue and shows its name, verified address/floor, cocktail and an action to explore the drink. Keep the map position when returning from a drink.
- Use official venue addresses and verified building coordinates, retaining verification sources and dates. Bar Bon Funk and Bar Somma share New Bahru's building point but remain independently selectable; do not displace either marker to an invented location.
- Show required basemap attribution. If tiles or the map fail, preserve the venue list, address/directions and a retry action.
- A venue may appear in multiple collections. Map previews, list actions, bar deep links and next-drink navigation must select that collection’s drink without duplicating the venue identity. Keep original bar-only links deterministic.
- Individual drink pages show the venue, drink name, identifying twist, source/version information, interactive viewer and ingredient details. Next-drink navigation stays within the collection.

Location evidence: [original venues](qa/location-verification.md) and [espresso venues](references/espresso-martini/research.md).

## 3. Content, evidence and uncertainty

Keep recipe content separate from UI and geometry. Stable collection, venue, drink, ingredient and scene-part IDs must connect routes, models, labels and sources. Preserve the original video/photo and reference metadata outside the production web root.

Selected exact reference copies may be embedded under `public/references/` for the user-requested photo comparison. Retain their provenance, credits, dates, native image content and original hashes. A source photograph must be clearly identified as a photograph, separate from live 3D.

- Distinguish the filmed Negronis, current official menu facts, dated appearance observations and atlas-editor corrections. A current menu or older article must not silently establish a filmed edition's brands or proportions.
- The espresso collection uses menus checked on 13 September 2026 and explicitly dated April 2024 appearance references. Historical garnish details, including Night Hawk's seal/feather treatment, must remain qualified as historical appearance evidence.
- The Martini and Highball additions use current official recipe listings. MOGA’s gallery photos and Somma’s dated 2025 Mirko serving remain qualified; the Pine Highball lacks an individually identified photo and uses an explicitly illustrative glass, ice and tint. Garnish identity estimates must carry source links and the same visible estimate treatment as recipe estimates.
- Include **Campari in all three Negronis**, attributed to **Confirmed by atlas editor**. BBF retains its amaro blend without invented constituents or proportions. Preserve this correction separately from independent menu/video evidence in the [editor correction record](references/recipe-editor-corrections.json).
- Keep quantities and units as `null` in the atlas’s explanatory display. Some sources, including the ATLAS Martini recipe card, publish measures; say measurements are not shown rather than claiming all source quantities are unknown. Do not infer standard equal-parts recipes, ABV, taste scores or ingredient counts. A source-based brand estimate must be explicitly distinguished from a verified brand.
- Following the user's ingredient-completion request, replace generic **Unknown** ingredient names with the closest researched match. Mark each inference **estimated** in ingredient lists, projected labels and comparisons; provide its source and explain whether it comes from this bar, an earlier recipe or a classic cocktail. An estimate must never receive a menu/film-confirmed badge. Jigger & Pony's coffee liqueur is a classic-recipe estimate: its current menu does not list a liqueur.
- Give each completed category a visible, selectable representative 3D form. Shape, size and color are illustrative and do not establish quantities. Keep each ingredient in a relevant category without inventing an additional dose: BBF's orange-zest-oil form explains the existing orange's aromatic finish. Show techniques separately where documented; aging wood or clarification milk must not appear as asserted finished-drink ingredients.
- Make source links and version disclosures available as readable text. Ingredient details must remain accessible without WebGL or hover.

Current recipe data controls labels, evidence and illustrative colors over reusable model geometry. Preserved source/export metadata must remain traceable when an editor correction or sourced estimate updates the live interpretation. See [Campari correction](qa/campari-correction.md) and [ingredient completion](qa/recipe-completion.md).

## 4. Interactive drink and recipe view

Both assembled and expanded states must use the actual exported 3D model. A loading image or fallback must not masquerade as a live model.

- Provide **3D model / Reference photo** buttons on individual drinks and each comparison column. Only fetch a photo when requested. Show the entire reference without stretching/cropping it, with attribution, a source link and relevant date/appearance qualifications.
- Returning from a photo must preserve the existing 3D scene, orbit and expansion. Photo mode makes the hidden model inert and pauses its draw loop. Expansion controls return to 3D; comparison columns may otherwise switch independently.
- Keep reference photos available without WebGL, with a readable image-error state and retry. If no verified photo exists, show an explicit unavailable note. Never substitute a different drink or generated image as a reference.

- Provide visible Explore ingredients/Reassemble controls, a named expansion slider, Reset view, comparison selection, rotation/tilt and zoom controls. Double-click is an optional shortcut with drag discrimination.
- Allow a complete horizontal orbit and useful vertical inspection with bounded zoom and no camera inversion. Visible controls and keyboard input provide equivalent essential actions.
- Drive expansion with one continuous value in `[0,1]`, deriving transforms from stored assembled poses and authored targets. Slider movement, mid-transition reversal and repeated toggles must restore exact assembled transforms without accumulated offsets.
- Preserve relative positions of physically attached garnish parts during expansion. Separate the glass/ice/garnish and explanatory recipe objects enough to inspect and select them.
- Tiny or flat ingredients must remain visible in recipe view. Use explicitly illustrative enlarged forms or reversible group tilts where needed, retaining the assembled serving and avoiding any implied ingredient amount.
- Introduce the expanded state as a recipe illustration. Mixed ingredients are represented separately for explanation; the display must not imply physical layers inside the served drink or measured ratios.
- Keep the shared bar/counter stage coherent through expansion and reassembly. Reduced motion must settle immediately into the requested state.
- Project readable labels from the corresponding real component anchors. Labels must remain usable through rotation, expansion and resizing, with deliberate handling of collisions and offscreen targets.
- Hover, keyboard focus and selection highlight the corresponding form. Ingredient disclosures must open and close independently; essential text remains available in the ingredient list.

Use aligned rows appropriate to each family. Preserve the original six-row Negroni and Espresso Martini views:

| Order, top to bottom | Negronis | Espresso Martinis |
|---|---|---|
| 1 | Garnish | Garnish |
| 2 | Distinctive modifiers | Distinctive modifiers |
| 3 | Vermouth / wine | Coffee |
| 4 | Bitter / amaro | Liqueur / amaro |
| 5 | Base spirit | Base spirit |
| 6 | Serving structure | Serving structure |

Martinis use five rows: garnish, acidity/accents, vermouth, base spirit and serving structure. Highballs use four: flavour/seasoning, soda/lengthener, base spirit/infusion and glass/ice. Do not invent a garnish or duplicate a mixed component to fill an arbitrary row count. Detailed descriptions must retain every published recipe component.


## 5. Compare within a collection

- Support any two or all three drinks from one family, with a maximum of three distinct selections. Changing collections clears the previous family's selection.
- Default a new comparison to expanded and synchronized rotation. A shared slider and Expand all/Reassemble all controls act on every selected drink.
- Synchronized orbit shares azimuth, elevation and normalized framing while preserving authored scale and offsets. Independent mode lets each drink rotate separately; its local Reset view must leave the other drinks unchanged. Reset alignment restores shared alignment.
- Align category rows and highlight a selected category across columns. Keep drink identities and identifying twists visible.
- Allow named removal and selection changes. Removing from three leaves two; reducing a comparison to one opens the remaining drink.
- At narrow widths, use horizontally scrollable columns with persistent shared controls, current-drink identity and an accessible drink selector. Keep named selection/removal controls available and allow normal vertical page scrolling.

## 6. Routes, history and sharing

Use documented query routes for collection, selected bar, drink, two-/three-drink comparison, expansion and synchronization. Preserve existing Negroni links. Valid drink IDs determine their family; the first valid comparison ID determines its family. Filter invalid, duplicated and mixed-family comparison entries and enforce the selection cap.

Refresh, browser Back/Forward and copied links must restore the represented experience. Preserve explicit `expand=0` for a reassembled comparison, and preserve independent rotation mode through `sync=0`. Camera gestures need not be serialized as a share link.

| Example | Meaning |
|---|---|
| `/?collection=espresso-martini` | Espresso martini atlas |
| `/?bar=bar-somma` | Negroni atlas with Bar Somma selected |
| `/?drink=nighthawks&expand=1` | Expanded Nighthawks |
| `/?compare=bbf-negroni,negroni-express&sync=0&expand=0` | Reassembled, independent Negroni comparison |

Copy/share must use the canonical current route. If clipboard access fails, provide a selectable manual-copy URL that updates with route changes. Focus the fallback input; closing it or pressing Escape must restore focus to the triggering control. Do not imply that a link was copied when it was not.

## 7. Accessibility, responsive behavior and recovery

- Keep the experience usable at desktop, tablet and phone sizes, including 1440, 768 and 390 CSS-pixel widths. At narrow widths, the four-family selector may scroll horizontally and must reveal the selected/focused option. Avoid page overflow; intentional comparison scrolling must remain clear and operable.
- Use semantic controls, visible focus, adequate contrast, accessible names/slider values and practical touch targets. Do not rely on color, hover or double-click alone.
- A focused viewer supports arrows, `+`/`-` and Space for inspection and expansion. Horizontal touch gestures rotate without trapping surrounding vertical scrolling.
- Honor reduced-motion preferences. Resting, offscreen and background viewers should stop rendering; input, resize, visibility reentry and retry must resume the necessary draws.
- Keep readable content available during loading. Provide a clear model-error state with Retry 3D, and recover a failed comparison model without making other drinks unusable.
- Provide a useful no-WebGL state with ingredient text, navigation and controls that remain reachable on phones. Map failure and model failure are independently recoverable.
- Verify Chromium and WebKit where available, recording the actual engine and device conditions. Synthetic touch and desktop WebKit are not proof of physical-phone GPU behavior.

## 8. Runtime, performance and reproducibility

The runtime uses the existing TypeScript/React/Vite, Three.js/React Three Fiber and MapLibre implementation. Preserve the lockfile, structured content, stable component IDs and documented model/material mappings. Blender authoring is offline; exported static assets power runtime interaction.

Each drink must have an editable `assets/blender/{drink-id}.blend`, a JSON manifest and `public/models/{drink-id}.glb`. Generation/export scripts must execute successfully and document versions, seeds, transforms, camera/material settings and reproducibility limits. Preserve source references, provenance and third-party attribution. Keep experimental assets outside the default production path.

Load model assets on demand. Measure real viewer draw activity, interaction/expansion responsiveness and asset sizes under stated browser, viewport, DPR and hardware conditions. Prefer usable resolution and smooth interaction while retaining the accepted visual baseline. Do not describe idle page RAF callbacks as cocktail FPS or extrapolate desktop measurements to physical mobile. Retain measurement limitations explicitly.

The required Pearl architectural review is recorded in [qa/pearl-reference-review.md](qa/pearl-reference-review.md); the independently authored implementation and attribution scope are documented in [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt).

## 9. Verification and scope boundary

Maintain evidence for content/asset integrity, accurate uncertainty, routes/share/history, reversible transforms, comparison, keyboard/touch, responsive labels, reduced motion, loading/retry, map/WebGL fallback, rendering lifecycle, reproducible assets and a successful production build. Use targeted tests and actual browser inspection for affected behavior. Record performance with its conditions and unsupported-device limits.

The delivered v2 baseline and its follow-ups are retained; the two-family expansion is documented in [qa/new-collections.md](qa/new-collections.md), and [qa/acceptance-status.md](qa/acceptance-status.md) is the current evidence index. Physical-device GPU performance remains unverified and is not claimed as part of the desktop/emulated coverage.

The user has accepted the current drink visuals. Historical optical failures remain historical failures; they are not passed by this change and do not constitute active release work for the new collections. The detailed former visual specifications and full prior documents are preserved here:

- [Original pre-collection PRD, including detailed optical specifications](qa/checkpoints/PRD-before-cocktail-collections.md).
- [Complete v2 document before this contract cleanup](qa/checkpoints/PRD-v2-before-contract-cleanup-2026-09-13.md).
- [Complete acceptance ledger before this cleanup](qa/checkpoints/acceptance-status-before-v2-cleanup-2026-09-13.md).

Beyond the two new collections requested here, no further photographic research, redesign or additional product backlog is implied by this contract.
