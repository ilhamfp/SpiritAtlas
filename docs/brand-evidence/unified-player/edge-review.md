# Player edge and single-player review

The user reported an abrupt right edge beside the marbled background and requested one player instead of separate viewing tabs.

The player now retains an opaque charcoal surface under its controls, while a separate background layer fades outward over 32px at the right and 24px below. The border is transparent. Only the background fades: media, type, ingredient labels and keyboard focus remain sharp. At widths up to 740px the outward layer is disabled because the player already sits on plain charcoal; the existing inset padding is preserved.

Visually inspected the saved local Chromium captures at [1440×1000](homepage-1440x1000.png), [768×1024](homepage-768x1024.png) and [390×844](homepage-390x844.png). The former vertical panel cutoff blends into the decorative field, with no visible seam beneath the controls. The two mode tabs are absent; playback, expansion and always-visible rotation arrows share one player. No new crop, overlap or horizontal overflow is visible in those captures.

The mechanical scan in `design-detector.json` has 19 advisories, all about the existing type scale, compact control radii or ingredient-marker colors. The new black mask stop describes alpha coverage, not a displayed palette color. These do not require changes to the pinned design. Behavioral results and WebKit/public verification are recorded separately by the integration task; this image review does not substitute for them.

## Final confirmation

Also inspected the WebKit [desktop edge crop](webkit-player-edge-1440.png), [390px player](webkit-player-390.png) and [320px player](webkit-player-320.png). The outward right/bottom fade is continuous on desktop; the small-screen player remains on uniform charcoal with no lost padding or clipped controls. The screenshot shows a single set of playback, ingredient and rotation controls. No further visual correction is needed for this request.

The final runtime report records 24/24 passing checks with no skipped or flaky cases, after fixing a transient loading-message layout jump. `webkit-verification.json` separately confirms actual composed-frame changes, autoplay, circulation, pause and reduced motion at 1440, 768, 390 and 320px, with no page errors or document overflow and 44px control targets. These are local preview results; production verification must identify its deployment after release.
