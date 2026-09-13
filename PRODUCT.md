# SpiritAtlas

<!-- impeccable:product-schema 1 -->

## Platform
web

## Stack
The PRD delegates an empty-project implementation to TypeScript, React with Vite, Three.js/React Three Fiber, and MapLibre GL JS. Blender authors editable scenes and runtime assets; the browser does not require Blender.

## Users
Visitors exploring Singapore bars who want to understand three filmed interpretations of the Negroni without needing cocktail expertise.

## Product Purpose
Discover three real venues on a geographically accurate map, inspect each cocktail as interactive 3D, understand a deliberately separated recipe composition, and compare any two or all three drinks.

## Positioning
This atlas reconstructs the specific BBF Negroni, Ichigo Negroni, and Negroni Express servings in the supplied film. Ingredient evidence stays tied to those versions.

## Operating Context
Visitors navigate a map or equivalent venue list, enter a drink showcase, expand and orbit it, then compare aligned ingredients. Desktop, tablet, mobile, keyboard, touch, reduced motion, and unavailable WebGL must all retain useful routes.

## Capabilities and Constraints
Map/list selection, visible reversible expansion controls, full horizontal orbit, projected labels and text equivalents, synchronized or independent comparison rotation, shared comparison expansion, recoverable loading, and URL restoration are required. Exact recipe quantities, unverified brands, flower species, and red-garnish composition remain unknown. Current opening hours, prices, and availability are omitted.

Recipe exploration includes 3D objects labeled by category and “Unknown” for unspecified recipe categories, as requested by the user. These remain unverified in the content data. Their shapes, sizes, and number describe the explanatory categories, not measured amounts or a verified count of ingredients in the drink.

## Brand Commitments
SpiritAtlas; controlled warm studio presentation, dark neutral surroundings, cream text, refined typography, and restrained accent. Preserve each drink's observed glass, ice, color, and garnish identity. The PRD is the product and acceptance authority.

## Evidence on Hand
PRD.md; negroni-bar-crawl.mp4; bar-somma-negroni-reference.jpg; derived and audited reference evidence under references/ and qa/. Official venue pages and Singapore OneMap provide address and coordinate evidence. The reference media remain outside the deployed bundle.

## Product Principles
- Keep the drinks and their differences central.
- Distinguish observed appearance, verified ingredients, preparation processes, and unknowns.
- An explanatory recipe view never claims that mixed liquids exist in separate physical layers.
- Show unspecified recipe categories as clearly labeled Unknown objects while preserving unknown identities and null quantities.
- Every important gesture has a visible accessible control.
- Acceptance requires real browser and source comparison evidence, not a build alone.

## Accessibility & Inclusion
Accessible venue list equivalent to the map; semantic navigation; visible keyboard focus; slider labels and values; ingredient text; touch scrolling outside drag surfaces; reduced motion; independent asset retry and map fallback.

## Open Decisions
No user interview is required for routine choices: the supplied PRD and objective explicitly authorize autonomous implementation. Unseen geometry and unresolved source details must be tracked as uncertainty, not invented facts.
