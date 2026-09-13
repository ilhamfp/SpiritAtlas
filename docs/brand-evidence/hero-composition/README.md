# Hero composition verification

The original smooth marble now spans the hero, including the lower-left ribbon. Its final contour dissolves on the existing stable 5-CSS-pixel grid. The player photograph blends into the same visual plane, with independent masks that leave text, controls and keyboard focus sharp. The SpiritAtlas wordmark has more presence; the mobile composition uses its portrait asset and keeps the controls within the 390×844 first screen.

The initial pass exposed a straight top edge in the photographic mask. The final pass adds an edge fade around the radial mask; `chrome-*.png` and `webkit-*.png` show the corrected result. Both assembled and fully separated ingredients remain visible. A separate reviewer found no additional material visual defects.

Local production build and `git diff --check` pass. Seven existing checks passed in 55.3 seconds: the three required compositions and links, full forward/reverse/full-forward playback, lazy rotation/pose/reset, desktop control framing, and reduced-motion touch scrolling. `results.json` records those checks; its composition screenshots precede the final top-edge fade.

After the final edge adjustment, the production build passed again. `verify.mjs` checks Chrome and WebKit at 1440×1000, 768×1024, 390×844 and 320×568, including DPR 1/2. All eight passed with no page errors, horizontal overflow or clipped stage bounds. The hero has zero outer padding; only its inner content has gutters. Canvas pixels remain identical between captures, keyboard focus is visible and keyboard End reaches the fully expanded pose. The actual final screenshots and measurements are in `visual-checks.json` and the browser-named captures.

Controls finish at y858.5 on desktop, y771.2 on tablet and y812.6 on the 844px-tall phone. The short 320×568 viewport scrolls vertically to the controls, preserving readable type and 44px targets. No playback code, catalogue content or studio source changed. The existing lazy-loaded Three.js bundle size warning remains.

Production integration is delegated to the animation task, preserving its combined studio/playback release. Public verification will be recorded separately after deployment.
