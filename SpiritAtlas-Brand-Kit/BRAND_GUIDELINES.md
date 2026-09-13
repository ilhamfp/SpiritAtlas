# SpiritAtlas — Brand Guidelines

Version 0.1 · 13 September 2026 · Step 01: visual foundation

## The direction

**Singapore’s cocktails, inside out.**

SpiritAtlas is an invitation to discover Singapore through its bars and the details inside their drinks. The experience moves from a map to a cocktail, then opens the cocktail into an explorable composition of ingredients.

The identity combines a warm editorial palette, fluid marbled imagery, partial dither, and precise typography. Photographic cocktail detail provides the focal point. The atmosphere should feel intriguing, tactile, confident, and considered.

**Signature treatment: marbled gradients with dot-dissolve edges.** A smooth orange-and-peach form breaks into small, regularly spaced square dots along selected boundaries. The transition between fluid and discrete detail connects naturally to SpiritAtlas’s act of revealing a drink’s components.

Read [VISUAL_REFERENCE.md](VISUAL_REFERENCE.md) for the source-image analysis and implementation guidance. The source reference is inspiration; the SpiritAtlas wordmark, composition, and artwork should be original.

## Color

The first four colors below were sampled from dominant flat-color pixels in the supplied reference. Ink and Muted are proposed functional extensions. Screenshot sampling does not establish the original designer’s official palette.

| Token | Name | Hex | Role |
| --- | --- | --- | --- |
| `--sa-charcoal` | Charcoal | `#2C2A2D` | Main page background, navigation, panels |
| `--sa-orange` | Peel | `#FF682F` | Primary action, active map marker, a short display accent, marbling |
| `--sa-peach` | Blush | `#FFBBB0` | Dissolve particles, marbling highlights, occasional light panels |
| `--sa-cream` | Paper | `#FFFFE3` | Primary type, fine graphics, light surfaces |
| `--sa-ink` | Ink | `#171518` | Deeper cocktail stage, footer, image surround |
| `--sa-muted` | Muted | `#B9B3B0` | Secondary text on dark surfaces |

Start a landing-page viewport with roughly 70% dark surface, 20% warm image/color, and 10% light type or accents. These are composition guides, not quotas. A later orange editorial section may deliberately invert the balance.

Use one orange emphasis per text group. Give the three initial bars equal typographic treatment; distinguish their actual drinks through glass, liquid, garnish, bar name, and numbered index. Do not recolor cocktails to match the brand palette.

### Legible pairings

Calculated WCAG contrast ratios for opaque, flat backgrounds:

| Foreground / background | Contrast | Use |
| --- | ---: | --- |
| Paper / Charcoal | 14.00:1 | Main copy and navigation |
| Peel / Charcoal | 4.93:1 | Links, active labels, selected accents |
| Charcoal / Peel | 4.93:1 | Primary-button text |
| Charcoal / Blush | 8.80:1 | Text on a pale feature panel |
| Muted / Charcoal | 6.87:1 | Secondary copy |
| Paper / Peel | 2.84:1 | Fails normal-text contrast; do not use for button labels |

Maintain at least 4.5:1 for normal text and 3:1 for large text and essential non-text controls. Check contrast again over images, gradients, transparent surfaces, hover states, and focus states. A palette-level result does not validate every component.

## Typography

**Primary: Instrument Sans. Secondary: IBM Plex Mono.** These are recommended fonts for SpiritAtlas, not an identification of the reference’s exact typeface.

Instrument Sans has an approachable, precise sans-serif voice that works at both poster and interface scale. IBM Plex Mono adds a quiet sense of coordinates, indexing, and observation.

| Role | Family / weight | Desktop | Mobile | Treatment |
| --- | --- | --- | --- | --- |
| Wordmark | Instrument Sans 600 | 24–28px | 22–24px | `SpiritAtlas`; tracking −0.04em |
| Hero | Instrument Sans 500 | 88–112px | 48–60px | Line height 0.98–1.04; tracking −0.045em |
| Section heading | Instrument Sans 500 | 48–64px | 32–40px | Line height 1.06; tracking −0.035em |
| Cocktail / bar title | Instrument Sans 500 | 28–36px | 24–28px | Line height 1.12; tracking −0.025em |
| Body | Instrument Sans 400 | 18px | 16px | Line height 1.55; tracking 0 |
| Controls | Instrument Sans 600 | 14–16px | 16px | Sentence case; tracking 0 |
| Index / coordinates | IBM Plex Mono 400 or 500 | 11–12px | 11–12px | Line height 1.4; tracking 0.08em |

Use uppercase only for short utility labels such as `SINGAPORE / 001`. Keep body paragraphs around 45–65 characters per line. Avoid using mono for paragraphs or ingredient explanations.

Instrument Sans supports weights 400–700 and a width axis from 75–100. Start with normal width (100); the main identity does not need artificial horizontal scaling. Preserve font proportions.

Both families are distributed under the SIL Open Font License. If shipping font files, retain their license notices. Self-host the selected WOFF2 files for a production build; use `font-display: swap`. The included CSS declares the families and fallbacks but does not bundle or download font binaries.

Font sources: [Instrument Sans](https://fonts.google.com/specimen/Instrument+Sans), [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono). Verified family metadata: [Instrument Sans](https://github.com/google/fonts/blob/main/ofl/instrumentsans/METADATA.pb), [IBM Plex Mono](https://github.com/google/fonts/blob/main/ofl/ibmplexmono/METADATA.pb).

## Wordmark and graphic language

Write **SpiritAtlas** as one word, with capital S and A. Start with a clean typographic wordmark. Use Paper on Charcoal, Charcoal on Peel, or Charcoal on Paper. Maintain clear space at least equal to the capital S’s height on all sides.

Keep the wordmark smooth and fully legible. Dither belongs in supporting artwork. A separate symbol can be developed in a later identity step; do not reuse the reference’s small pixel emblem.

Use fine rules, short leader lines, small index numbers, and a restrained grid. The reference’s large rectangles and open space suggest editorial framing. Favor square or gently rounded controls, with 4–8px corner radii. Reserve fully rounded shapes for actual map markers or meaningful chips.

## Texture and imagery

Build the decorative image in three perceptually distinct layers:

1. **Marbled field:** broad orange ribbons and pale peach pools flowing through charcoal negative space. Use directional curves, asymmetry, warm highlights, and darker channels.
2. **Fine grain:** a subtle, static print-like texture. It should enrich the image at close range without becoming visible grit over text.
3. **Partial dither:** clusters of small square dots at selected form boundaries. Dense squares merge into color; sparse squares dissipate into the dark field. Keep smooth regions visible beside the dissolve.

The cocktail is a separate, crisp focal layer. Preserve its rim, glass thickness, ice, garnish texture, condensation, liquid tint, refraction, and reflections. Decorative color should frame the product without tinting away differences between the actual drinks.

Use the treatment around a hero stage, on a section boundary, in a loading-to-ready reveal, or behind a campaign headline. Ingredient labels, buttons, map text, and comparison details require clean backgrounds. See the effect parameters and failure examples in the reference breakdown.

## Landing-page art direction

### First viewport

Use a quiet header with the wordmark at left, a small number of navigation items, and a clear atlas action. The main scene should occupy roughly the right half of a wide viewport, with a large two- or three-line headline on the left. Let some artwork cross the implied column boundary without crossing the copy’s protected space.

Draft copy:

> Singapore’s cocktails.  
> Inside out.
>
> Explore the bars, discover the ingredients, and see what makes each drink its own.
>
> **Explore the atlas** · See the cocktails

Set the first headline line in Paper and use Peel for one short emphasis if the composition benefits from it. Keep the primary button solid Peel with Charcoal text. Make the secondary action a simple text link with a clear focus state.

Show one beautiful, accurately reconstructed cocktail as the hero object, with a small label identifying its bar. Use an actual completed asset rather than an unrelated stock drink. Place the marbled dissolve behind and beside the object, leaving the glass and garnish sharp. Beneath the main copy, a restrained index can introduce `01 Bar Bon Funk`, `02 MOGA`, and `03 Bar Somma`.

Do not overload the first viewport with separate map, comparison, ingredient, and recommendation panels. The primary action should lead into the working atlas; each next interaction reveals another level of detail.

### Continuation

1. **Singapore atlas:** a dark, readable map with Peel active markers, clear bar names, and a coordinated list. When venues share a location, group or offset their markers so each remains selectable.
2. **Cocktail detail:** an ample dark stage, the bar’s name, the drink’s verified description, and an explicit `Explore ingredients` action. Double-click can be a shortcut; touch and keyboard users need the visible control.
3. **Expanded view:** vertically separated components, cream screen-space labels, precise leader lines, and stable camera controls. Treat ingredient separation as an explanatory visualization; do not imply a mixed cocktail physically contains distinct unmixed layers.
4. **Comparison:** the three drinks at a consistent visual scale, with aligned titles and synchronized rotation when enabled. A selected state uses both an outline or label and color. Make the physical and recipe differences easy to inspect.

On narrow screens, stack headline, action, and scene in that order. Allow enough scene height for the complete glass and garnish. Comparison should use a deliberate horizontal pager or selectable pair rather than three unreadably small objects.

## Motion

Keep motion purposeful: a gentle initial reveal, a controlled move from map to drink, then the ingredient expansion. Let the cocktail’s interaction provide the main spectacle.

Suggested starting values: 160–220ms for controls, 500–800ms for scene transitions, and 800–1200ms for ingredient expansion. Tune to scene distance and readability. A dissolve should move its boundary or coverage field; its pixel grid should remain stable, with no random regeneration every frame.

Decorative marbling can be static. If it moves, use slow deformation without flicker. Do not continuously spin the cocktail while the user reads or compares. Under `prefers-reduced-motion`, stop ambient deformation and automatic rotation; provide an immediate state change or short fade for expansion. Preserve manual exploration.

## Writing voice

Use short, curious invitations grounded in what the product actually does:

- `Explore the atlas`
- `Look inside`
- `Explore ingredients`
- `Compare the three`
- `Rotate together`
- `Back to Singapore`

Introduce bar names and cocktail differences before technical explanations. Use verified ingredient descriptions. Keep implementation details out of the consumer interface unless they help explain provenance or uncertainty.

## Review standard

The page should be recognizable from its charcoal, warm marbling, square-dot dissolves, and confident typography before the logo is read. The drink should remain the most detailed object in the viewport. Text must be effortless to read, and the next interaction must be obvious.

Review a wide desktop viewport and a narrow mobile viewport with loaded fonts and real cocktail imagery. Correct the largest visual mismatch first. Check the reference breakdown’s acceptance list before calling the direction implemented.
