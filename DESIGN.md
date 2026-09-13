---
name: SpiritAtlas
description: Singapore’s cocktails. Inside out.
colors:
  primary: "#FF682F"
  primary-hover: "#FFBBB0"
  charcoal: "#2C2A2D"
  peach: "#FFBBB0"
  paper: "#FFFFE3"
  ink: "#171518"
  muted: "#B9B3B0"
  divider: "rgb(255 255 227 / 18%)"
  control-border: "#B9B3B0"
typography:
  display:
    fontFamily: "Instrument Sans Variable, Instrument Sans, sans-serif"
    fontSize: "clamp(76px, 7.5vw, 112px)"
    fontWeight: 500
    lineHeight: 0.99
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Instrument Sans Variable, Instrument Sans, sans-serif"
    fontSize: "clamp(40px, 4.2vw, 64px)"
    fontWeight: 500
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Instrument Sans Variable, Instrument Sans, sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Instrument Sans Variable, Instrument Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.6
  control:
    fontFamily: "Instrument Sans Variable, Instrument Sans, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.4
  index:
    fontFamily: "IBM Plex Mono, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "0.08em"
rounded:
  control: "6px"
  secondary-control: "5px"
spacing:
  small: "8px"
  medium: "16px"
  large: "24px"
  section: "112px"
  desktop-gutter: "clamp(24px, 5vw, 80px)"
  mobile-gutter: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.charcoal}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "16px 22px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-dark:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.paper}"
    typography: "{typography.control}"
    rounded: "{rounded.control}"
    padding: "16px 22px"
  button-secondary:
    backgroundColor: "{colors.charcoal}"
    textColor: "{colors.paper}"
    rounded: "{rounded.secondary-control}"
    padding: "8px 12px"
    height: "44px"
---

# Design System: SpiritAtlas

## Overview

**Creative North Star: "Singapore’s cocktails. Inside out."**

SpiritAtlas is a considered cocktail publication with an interactive atlas at its center. Confident sans-serif typography, warm charcoal, orange and peach marbling, and selective square-dot dissolution invite a closer look. The drink remains the most detailed object; its frame expresses the transition from the complete serving to explorable ingredients.

The supplied SpiritAtlas kit establishes this visual world. The landing page and shared atlas token overrides replace the earlier Bodoni Moda, Manrope, espresso, and vermilion direction while preserving existing maps, drink scenes, comparison, evidence disclosures, and routes. Exact brand anchors remain authoritative in `SpiritAtlas-Brand-Kit/BRAND_GUIDELINES.md`, `VISUAL_REFERENCE.md`, and `spiritatlas-tokens.css`.

**Key Characteristics:**

- Large Instrument Sans type with restrained IBM Plex Mono indices and coordinates.
- Smooth orange ribbons and peach pools separated by dark channels.
- Small square dots at selected contours, with stable spacing and changing coverage.
- Calm surfaces for text and controls beside a crisp live cocktail.
- Open editorial rows and deliberate responsive composition, with the atlas one action away.

This documents the implemented system, not a final production acceptance claim. Review findings are in `docs/brand-evidence/design-review.md`; deployment and completed journeys belong in `docs/brand-implementation.md`.

## Colors

### Primary

Peel carries the main action, one short headline emphasis, and active atlas states. Peach supports the marbling and action hover state. Primary buttons use Charcoal text.

### Neutral

Charcoal is the editorial field; Paper carries primary copy. Ink creates the deeper ingredient-exploration surface. Muted supports secondary reading copy. Translucent Paper rules divide content; Muted borders identify outlined controls.

**The Dark-on-Orange Rule.** Orange actions use dark text. Paper on Peel does not meet normal-text contrast and is not a permitted primary-button pairing.

The kit records 4.93:1 for Charcoal on Peel, 14.00:1 for Paper on Charcoal, and 6.87:1 for Muted on Charcoal. These solid-color pairings do not certify every image, transparent state, hover, or focus treatment.

The map retains its provider's geographic hierarchy and required OpenFreeMap, OpenMapTiles, and OpenStreetMap attribution. Keep equivalent venue-list navigation usable if tiles fail. New Bahru's two venues share one verified coordinate; their levels and units distinguish them.

## Typography

Instrument Sans is the display, body, and UI family, loaded from real `@fontsource-variable/instrument-sans` files. IBM Plex Mono's Latin regular font supplies indices and coordinates through `@fontsource/ibm-plex-mono`. Retain font licenses and `font-display: swap`. The legacy atlas `--sans` and `--serif` aliases both resolve to Instrument Sans in the final brand override. Active viewer labels inherit this family.

The hierarchy moves from the large three-line promise to medium-weight section and bar headings, then readable sans-serif copy. Main body copy is generally 16–18px; compact functional atlas copy remains 12–14px. The narrow landing headline is 58px and section headings are 40px. Preserve proportions rather than horizontally scaling the font.

**The Single Voice Rule.** Instrument Sans carries both the editorial and functional interface. Reserve IBM Plex Mono for brief indices and actual coordinates, never paragraphs or ingredient explanations.

Index metadata uses at least 11px, with existing functional labels generally 12px. Hero ingredient labels use 12px. Earlier 9–10px review exceptions are not the system norm. Orange may emphasize one short phrase; it does not make every heading an accent.

## Layout

Broad gutters and generous section separation support a large left headline and a right-hand live cocktail on desktop. Artwork crosses the implied column division only through protected negative space. A quiet header and clear hero caption leave the promise and drink dominant. The continuation introduces the three bars equally, explains ingredient exploration, and reaches the working comparison.

At 1000px and below, desktop proportions tighten. At 650px and below, headline, copy, primary action, and scene stack in that order. A separately generated portrait texture preserves its own charcoal center and side/lower ribbons. The complete glass and garnish remain framed, and controls stay in normal reading order.

Preserve the atlas's venue-index/map relationship, with introduction, map, and venue list stacked on narrow screens. Individual drink pages retain identity, live scene, visible controls, and ingredient descriptions; the inspector moves below the scene before columns become too narrow.

Comparison keeps equal desktop columns and aligned categories. Deliberate horizontal paging on narrow layouts retains approximately 320px of reading width per drink while the document itself remains within the viewport. Shared controls and current drink identity remain reachable.

**The Protected Space Rule.** Copy, captions, controls, map labels, and ingredient text receive calm backgrounds. Decorative coverage must never be a postprocessing effect on the product or DOM interface.

## Elevation & Depth

Depth comes from real-time glass, ice, liquid, and garnish, framed by an independent artwork layer. Landing surfaces are predominantly flat. Fine rules establish divisions; existing map previews and temporary comparison selection use local layering only where it clarifies state.

Original smooth textures were generated with verified `gpt-image-2.5-sunburst`. `src/components/Marble.tsx` applies ordered square coverage at a fixed 5-CSS-pixel pitch. The Bayer grid has no changing random seed or ambient animation. Smooth interiors remain visible beside sparse and dense edges. Exact prompts and provenance are in `docs/brand-evidence/texture-provenance.md`.

**The Separate Layers Rule.** Decorative marbling, live cocktail optics, and the HTML interface remain independent. Do not use the decorative image as glass or liquid material, or add another dither pass to an already dotted image.

The initial copy entrance and section reveals are brief. Controls respond with modest movement. Reduced motion removes landing transitions and smooth scrolling; the scene uses immediate controlled states while preserving manual exploration. The cocktail does not spin automatically while visitors read.

## Shapes

Controls have small, deliberate corner radii. Fine rectangular rules and unboxed venue entries carry structure. Circular forms remain appropriate for actual map markers and compact existing icon controls. Thin repeated oval linework in the comparison invitation remains subordinate to its text and action.

The signature decorative shape is a small axis-aligned square on a stable lattice. Density changes by enabled coverage rather than uniform whole-image opacity. Preserve smooth interiors beside selected dissolving contours.

## Components

### Navigation and actions

The typographic wordmark returns home. Landing navigation reaches the bars, ingredient section, or working atlas; the mobile header retains the direct atlas action. “Explore the atlas” is the prominent orange action. The comparison section uses a dark action on orange. Outlined and text actions retain visible focus and useful destinations.

Primary actions transition from Peel to Peach. Landing focus uses a contrasting outline with dark separation. Existing route navigation retains a visible active state. Lucide icons share line weight. Small icons sit inside at least 44px touch targets for zoom and rotation.

### Cocktail showcase

The hero loads the existing real-time BBF Negroni behind a faithful poster while scene code and geometry prepare. “Look inside” and “Bring it together” provide reversible expansion; named rotation and zoom buttons accompany gestures. Keyboard exploration, vertical touch scrolling, and informative WebGL fallback remain required.

The poster is a loading state, never a substitute for working geometry. Secondary posters are lazy-loaded and heavy scenes are requested on the relevant journey. Scene failures retain recovery and usable drink content.

### Venue entries and map

Each featured bar has equal typographic treatment, its own drink image, concise factual copy, and a direct route. Map and list share selection. New Bahru's selection distinguishes Bar Bon Funk and Bar Somma by floor and unit. A selected map preview identifies one venue, drink, and location; failure leaves the list and retry usable. Sharing retains a manual-copy fallback.

### Ingredient inspector and comparison

Preserve named expansion sliders and visible assembled/recipe controls. Negroni categories remain aligned. Focus, hover, and selection connect explanations with geometry; click, Enter, and Space toggle details. Preparation techniques stay distinct from finished-drink ingredients.

Maintain the difference between observed appearance, verified content, editor-confirmed facts, researched estimates, and unknowns. Shapes do not encode measured quantities. Comparison retains shared expansion, synchronized or independent rotation, per-drink reset when independent, shared alignment reset, selection removal, and independent scene recovery.

## Do's and Don'ts

### Do:

- Do use exact SpiritAtlas palette anchors and real Instrument Sans and IBM Plex Mono files.
- Do preserve each cocktail's observed glass, liquid, ice, and garnish identity.
- Do show smooth marbling and selective stable square-dot boundaries together.
- Do protect sharp controls, copy, and annotations from decorative noise.
- Do preserve the working atlas, aligned comparison, evidence, and return paths.
- Do verify the actual public deployment across required viewports and interaction modes.

### Don't:

- Don't restore the former Bodoni/Manrope and vermilion visual identity.
- Don't copy the reference company's wording, emblem, or complete poster layouts.
- Don't substitute a blurred orange glow, uniform noise, or full-image pixelation for marbled dissolution.
- Don't recolor cocktails to match the decorative brand palette.
- Don't present photographs, posters, or prerecorded animation as working 3D.
- Don't invent recipes, quantities, reviews, awards, popularity counts, or current venue claims.
- Don't treat a local build or deployment URL alone as completed verification.
