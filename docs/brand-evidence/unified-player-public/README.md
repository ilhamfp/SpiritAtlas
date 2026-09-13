# Public single-player verification

Public URL: https://spiritatlas-one.vercel.app. Deployed application `058149b` includes feature `f9cef66`; exact Vercel metadata is retained in `deployment.json`.

All six targeted checks passed in a fresh headless Chrome session: landing composition and links at 1440×1000, 768×1024 and 390×844; one player loading rotation on demand, preserving its selected pose and resetting to the film; and actual muted autoplay, circulation and pause at desktop and phone sizes. No skipped or flaky checks. Tests were pinned to the deployed feature because a separate task had already started later playback refinements.

The public desktop and mobile screenshots were visually inspected. The mode tabs are absent, controls are padded and readable, and the right/bottom background feather blends the player into the decorative field. The live rotation check also confirms the interactive renderer remains available. These public results supplement the 24 passing local checks and four-size WebKit verification in `../unified-player/`.

This verifies the requested edge treatment and single player in the identified deployment. It does not claim publication or acceptance of subsequent loop/copy changes.
