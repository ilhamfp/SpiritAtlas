# Autoplay and responsive visual review

Verified locally on 13 September 2026 against the production preview on port 4175.

## Changes

- Cinematic playback starts muted and inline without a gesture, unfolds the
  drink, and continues in the existing circulation loop. Pause, Reset, scrubbing
  and reassembly retain visitor control. Reduced motion starts with a still;
  rejected autoplay presents a working manual Play control.
- The controller runs animation frames only during active visible playback.
  It suspends when the actual stage leaves the viewport or the page is hidden.
  The heavy live renderer remains an explicit, lazy-loaded option.
- The player has one solid charcoal frame with 16–20px content padding.
  Captions sit below the cinematic image on a consistent background. Narrow
  players give the title and action separate rows, including the longer
  reassembly label. Stable ingredient space prevents layout shifts.
- Mobile uses a plain charcoal field around the film. Desktop retains subdued
  marbling. Hidden mobile artwork does not initiate its image request.
- Headings scale with available width, supporting text and metadata use a
  consistent type scale, and sentence case replaces decorative all-caps labels.
  Proper names remain intact. Section and paragraph spacing follow the existing
  grid. The cinematic stylesheet now follows the base styles in import order.

## Verification

- Production build / TypeScript: passed; the existing lazy Three.js chunk-size
  warning remains.
- Asset integrity and playback checks: 11/11 passed.
- Focused browser suite: 20/20 passed. Covers autoplay and circulation on desktop
  and mobile, blocked autoplay recovery, stopped frame callbacks after pausing,
  reduced motion, native touch scrolling, cinematic pixels, loading, 3D mode
  continuity, atlas entry, featured drinks, comparison, and route restoration.
- WebKit desktop and mobile: actual autoplay, changed cinematic pixels, looping,
  mute, pause and reduced-motion start passed (`webkit-autoplay.json`).
- Visual review: 1440×1000, 768×1024, 390×844 and 320×740. No clipped inspected
  text or horizontal document overflow (`visual-checks.json`). Final screenshots
  include the expanded mobile player and full 320px page.
- Text on the player surface measures at least 6.87:1 contrast; its title
  measures 14.00:1 (`text-contrast.json`).

The first run exposed two test-fixture issues: Reset scrolled the phone away
from its initial CTA, and the autoplay-block mock counted script evaluation as
user activation. The final run corrects those fixtures and passes every check.
The product code was unchanged between those runs.

The atlas layouts were also inspected for visual continuity; its route and
comparison behavior passed the existing journeys. This pass did not alter its
map, venue content or drink renderers. Original movie and 3D assets are unchanged.

This directory records local verification. The Behind the Bar task coordinates
the combined release; this pass does not claim public deployment acceptance.
