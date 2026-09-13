# Accepted mobile loading state

Verified [SpiritAtlas](https://spiritatlas-one.vercel.app) in a fresh unauthenticated Chrome context at 390×844 with the actual `/models/bbf-negroni.glb` request deliberately held. The final compact “Preparing live 3D” badge has an opaque charcoal backing and **11.36:1** text contrast.

The decoded faithful poster's visible alpha bounds end at y=682.49 CSS pixels; the badge begins at y=684.72, clearing the full glass. Its right edge at x=257.72 clears the Zoom in control at x=286 and Zoom out at x=334. The badge is 35.5px tall and fully within the viewport. No first-party page errors or failed HTTP asset responses were observed. The public homepage returned HTTP 200.

The screenshot was visually inspected: glass, garnish, loading feedback and both zoom controls remain distinct and unobscured. `results.json` records the measurements and `passed: true`. This closes the mobile panel obstruction observed in [the earlier loading contrast audit](../loading-contrast-final/README.md); its screenshots remain historical evidence. Full live-scene journeys and final viewport captures belong to `../production-accepted/`.
