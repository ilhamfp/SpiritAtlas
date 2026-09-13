# Final public loading-label contrast

The canonical production site, [SpiritAtlas](https://spiritatlas-one.vercel.app), was opened in fresh unauthenticated Chrome contexts at 1440×1000 and 390×844. The Three.js dependency was deliberately held for the first loading phase, then released while the actual `/models/bbf-negroni.glb` request was held for the second. No other model was requested. Four screenshots record these states.

Both status phases have an opaque `#2C2A2D` backing and opacity 1. “Preparing your drink…” measures **6.87:1**; “Preparing live 3D” measures **11.36:1**, and its subtitle measures **7.12:1**. All label bounds are within the viewport. The canonical homepage returned HTTP 200 and no first-party page errors or failed HTTP asset responses were observed. `results.json` sets `loadingContrastPassed: true`.

The separate immutable deployment URL was also opened without authentication. It redirected to Vercel login; its protection was not changed. `immutableHomepagePublic: false` records that distinction, and the combined `passed` field is therefore false. Use the canonical public URL above for the delivered site and the successful production journeys.

Visual inspection confirmed both labels were legible. The initial opaque model-loading panel on mobile covered part of the poster glass and slightly overlapped the zoom-in control. This was corrected with a compact single-line badge; the [accepted public loading evidence](../loading-accepted/README.md) confirms no overlap with the glass or either zoom control and 11.36:1 contrast. These pre-compaction screenshots remain historical evidence. The ready-state screenshots were unaffected.
