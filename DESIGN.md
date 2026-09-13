---
name: SpiritAtlas
description: An evening atlas and three interactive cocktail studies.
colors:
  primary: "#af3f2c"
  primary-hover: "#bb4933"
  background: "#171512"
  surface: "#211e19"
  foreground: "#f1e8da"
  muted: "#c1b6a7"
  quiet: "#aca294"
  divider: "#3c362e"
typography:
  display:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "clamp(52px, 4.6vw, 72px)"
    fontWeight: 400
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  atlas-heading:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "clamp(42px, 3.65vw, 56px)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.035em"
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.75
  control:
    fontFamily: "Manrope, sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.5
  utility:
    fontFamily: "Manrope, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.6
  section:
    fontFamily: "Bodoni Moda, Georgia, serif"
    fontSize: "32px"
    fontWeight: 400
    lineHeight: 1.2
rounded:
  control: "0px"
  icon-button: "50%"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  desktop-gutter: "3.5vw"
  mobile-gutter: "20px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#fff7ef"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "13px 18px"
---

# Design System: SpiritAtlas

## September 2026 polish — prebuild direction

**Visual thesis:** An intimate Singapore cocktail atlas with warm bone typography on deep espresso, an editorial serif, and one vermilion action accent; the map and photographic drink remain the dominant surfaces.

**Content plan:** The masthead establishes the atlas; the map and three unboxed venue rows invite exploration. Each drink opens with its name and defining twist beside the live object, then reveals ingredients, techniques and evidence. Comparison keeps those same categories aligned. The final action leads to another drink or to the venue. Research remains inside its existing disclosure.

**Interaction thesis:** Keep a brief route entrance that settles the content, a precise underline and directional response on navigation/venue hover, and the renderer’s reversible ingredient expansion. Mobile comparison keeps its shared controls and current drink identity visible while the user scrolls. Reduced motion removes ornamental transitions and preserves immediate control feedback.

The first critique uses the existing `review-fix-*` screenshots: the composition is sound, but 8–11px text makes controls and evidence difficult to read; mixed tan highlights muddy the palette; display names and utilitarian controls need a clearer shared scale. Retain the self-hosted Bodoni Moda and Manrope pair. Raise utility copy to 12px, reading copy to 14px, and leads to 16px. Use 32px section titles and a 48–72px display range, with measured responsive changes instead of shrinking the interface to fit.

## Overview

**Creative North Star: "An evening atlas and a cocktail study"**

The built interface follows the PRD’s warm, dark studio direction. Editorial drink names and a restrained venue index support the real map and 3D objects. Controls use compact, precise language and recede from the drinks.

**Key Characteristics:**

- Cream type on warm charcoal, with one vermilion action accent.
- Unboxed venue rows and aligned ingredient columns.
- Large interactive objects, persistent visible controls, and discreet evidence details.

This file records the implemented interface, not a claim that its evolving 3D assets have passed visual fidelity review. UI evidence is under `qa/evidence/ui/`; overall acceptance remains in the project QA files.

## Colors

The primary accent marks exploration actions, selected locations, the selected venue’s thin left rule, and the enabled synchronization switch. Warm bone replaces the previous collection of tan selection colors. The primary button’s `#fff7ef` text has a computed contrast ratio of 5.547:1 on its default accent and 4.814:1 on hover. Main text has 15.008:1 contrast on the page and 13.678:1 on the panel; muted reading text has 9.126:1 and 8.317:1 respectively. Quiet utility text has 7.245:1 and 6.604:1. These are specific solid-color token checks, recorded in `qa/evidence/ui/typography-polish/contrast.json`, not a blanket accessibility certification or a measurement of every changing 3D pixel. Dividers create structure without framing every piece of content.

The basemap uses OpenFreeMap’s real Dark vector style with its own geographic color hierarchy. Keep required OpenFreeMap, OpenMapTiles, and OpenStreetMap attribution visible. The earlier CARTO raster trial produced API-key watermarks and was replaced; do not restore it as a working default.

## Typography

Bodoni Moda is the display face for the wordmark, venue and drink names, atlas introduction, and section headings. Manrope serves navigation, controls, ingredient names, and explanations, including the HTML map labels and attribution. Both families remain self-hosted through the package build using Latin subsets; no font dependency or external font request was added. Display text enables optical sizing where supported by the font.

The typography uses a shared scale: 12px for metadata, compact inspection controls and 3D labels; 14px for body copy, source disclosures, ingredient descriptions and primary controls; 16px for ingredient names in mobile and comparison; 22–26px for editorial twists; 32px for section headings; and 50–72px for drink titles. The mobile atlas headline reaches 39px at narrow 320px layouts. Display tracking is slightly tight at −0.035em for major titles. Reading copy uses 1.7–1.8 line height. Utilities remain readable rather than shrinking below 12px to fit. Source links visibly underline and announce new-tab behavior to assistive technology.

Italic display type appears selectively in the atlas introduction and comparison heading. Do not turn every heading into an italic emphasis.

## Layout

The masthead is 100px on desktop and 96px on tablet. At 600px and below it becomes a deliberate two-row, 126px masthead: the wordmark and share action above, navigation below. This preserves the brand and readable control labels on narrow screens.

The map view uses a narrow left venue index and a map across the remaining width. The larger venue index may extend below the first screen. On desktop and tablet, the map stays within the available viewport height, with its preview, controls and attribution visible while the page scrolls through the index. The corrected captures measure the attribution bottom at exactly 1000px in a 1440 × 1000 viewport and 1024px at 768 × 1024. Below 600px, the introduction, 440px map, and complete venue list stack vertically.

An individual drink uses three desktop regions: identity and controls, the large 3D object, and the ingredient inspector. The inspector has at least 280px at the three-column breakpoint. Below 1150px, ingredient details move below the object and controls. On mobile, the name introduces a 480px live viewer, with the twist and visible controls immediately after it. This brings the complete glass into the first 390 × 844 viewport. The longer description, ingredient explanations and source evidence follow in reading order.

Comparison uses equal desktop columns and aligned recipe categories. At 800px and below, the columns scroll horizontally while the document keeps its normal width. Mobile columns retain approximately 320px of reading width. Scroll padding preserves the leading gutter. The shared toolbar stays visible while scrolling; its controls reflow at 720px and 600px instead of shrinking. It retains expansion, synchronization state, reset, and a current-drink selector with the identifying twist and a remove action. Horizontal scrolling updates that identity; selecting another name brings its column into view.

## Elevation & Depth

Flat surfaces and thin dividers carry most structure. The selected map preview uses a dark translucent surface to remain legible over the geographic map. The comparison selection tray is cream, with a soft downward shadow that distinguishes its temporary foreground role. Shadows do not surround every panel.

A short entrance transition introduces a drink or comparison route. Marker and row affordances respond on hover; the map preview changes with a restrained reveal. Reduced-motion preferences remove these transitions. The continuous 3D expansion is owned by the renderer and must also honor reduced motion.

## Shapes

Primary and secondary buttons have square corners. Circular controls are reserved for compact icon actions and geographic pins. Map venue labels, ingredient rows, and source disclosures follow the layout without generic rounded card shells.

## Components

- **Navigation:** The masthead always returns to the atlas or opens comparison. The active view has a small accent underline. The share action copies the current URL and provides a manual-copy field when clipboard access fails.
- **Venue row:** Name, filmed drink, building, and floor lead into separate explore and compare actions. Active map and list selection share the same venue identity.
- **Building marker:** New Bahru represents one real coordinate with two selectable venues. The selection surface distinguishes their levels and units. Never visually offset a venue to an invented location.
- **Map preview:** One selected venue, its drink and floor, and a direct explore action. Map failure leaves the equivalent list, location details, and retry usable.
- **Expansion controls:** A named 0–100% slider and a visible assembled/recipe toggle accompany every viewer journey. The text identifies recipe shapes as explanatory, without implied quantities.
- **Ingredient inspector:** Six consistent categories. Unspecified categories show the category name and “Unknown” in the text inspector and receive clearly labeled Unknown objects during 3D recipe exploration. Their shapes and sizes are illustrative, with no measured amounts or verified ingredient count implied. The content retains unverified evidence and null quantities. Focus and hover highlight the corresponding renderer category; click, Enter, and Space independently open and close the explanation. Preparation techniques are separate disclosures.
- **Comparison tray:** A lightweight foreground selection summary. Comparison is disabled until two drinks are selected; each chosen drink can be removed. Below 1150px the tray adds a visible wrapping row of selected names with individual remove actions, and the document reserves room below its content.
- **Comparison columns:** Names and twists remain visible above the viewers. Selecting a category highlights that row in every column; rotation may be shared or independent. An independent column’s Reset view affects only that drink; Reset alignment is the shared reset. Individual 3D failures retain their own retry surface.

On touch layouts, sliders, drink switching, repeated rotation controls, comparison removal, and named tray removal use effective areas of at least 44px. Small icons remain visually restrained inside those larger hit areas.

Focus-visible treatments use a light warm outline. Controls do not rely on hover or double-click alone. External venue and source links visibly communicate their destination.

## September polish verification

`npm run build` passed after the typography and palette implementation. The browser inspection used an isolated Chrome session at 1440 × 1000, 768 × 1024, and 390 × 844, with real map tiles and live viewers. Each atlas, drink and three-way comparison received viewport and full-page captures under `qa/evidence/ui/typography-polish/`. All nine initial views had no horizontal page overflow and no visible DOM text below 12px. The map’s inherited Helvetica control styling was corrected to Manrope after that first inspection.

Targeted recaptures verified viewport-bound map attribution, the compact tablet toolbar, and the mobile image-first order. The first tablet drink capture was caught during a loading transition; its replacement was verified with one live viewer and no loading overlay. All corrected comparison captures have three live viewers. `inspection.json` preserves the original observations and `corrections.json` records the corrective checks; the screenshot files show the latest inspected state.

An isolated GPU-disabled interaction check covers widths 320, 390, 600, 601, 720, 768, 1150 and 1440: expansion changes the URL, synchronization toggles, reset remains clickable, and the sticky current-drink selector preserves its selection. Toolbar controls measure at least 44px high. Additional checks cover keyboard ingredient disclosure, source links, and named comparison-tray removal. The evidence is in `interaction-checks.json`, with the current palette calculation in `contrast.json`.

These are UI composition, readability and interaction checks. They do not change the separate rendering-fidelity verdicts for glass, liquid, ice or garnishes.

## Do's and Don'ts

- Do preserve the pinned dark studio identity and each cocktail’s distinct observed appearance.
- Do keep map attribution, keyboard focus, recipe disclaimers, and recovery actions legible.
- Do use real source evidence and null quantities for unknown recipe measures.
- Do preserve aligned categories in comparison, including unverified rows.
- Don’t use photographs or loading posters as substitutes for interactive geometry.
- Don’t introduce conventional equal-parts recipe measures, inferred brands, or numeric taste ratings.
- Don’t turn technique explanations into physical layers in the finished drink.
- Don’t restore a map provider without inspecting its rendered tiles and worker behavior in both development and production.
