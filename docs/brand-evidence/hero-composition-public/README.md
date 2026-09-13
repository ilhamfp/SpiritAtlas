# Public hero composition acceptance

Public site: https://spiritatlas-one.vercel.app

Production revision `36fb1649d3f8e6706f01203a67f0d00cbd69877f` is READY as `dpl_B39i9712QWwALxTBi1zPQBpPKH6N`. Remote main was fast-forwarded from the completed continuous-player release, preserving its public verification and all studio/native changes. Only the landing wrapper, marble drawing and scoped hero/player styling changed.

All seven focused public checks passed in 65.9 seconds, with no skipped, failed or flaky cases: desktop/tablet/phone composition and links; full 0→100→0→100 playback; lazy rotation, pose preservation and reset; desktop controls in view; and reduced-motion touch scrolling. See `results.json`.

Final independent captures explicitly wait for the decorative texture to finish drawing. Chrome at 1440×1000, 768×1024 and 390×844, plus WebKit at 390×844, passed stable canvas/DPR, keyboard focus and fully expanded pose checks. These actual public screenshots were visually inspected: the full-width ribbon is visible on both sides, the former straight photographic edge is absent, and the glass, garnish, ice and separated liquid remain complete. Controls are readable and reachable. See `final/` and `webkit/`. Earlier composition captures can precede the decorative image decode; headline, action and drink remain usable during loading.

The public entry JavaScript, stylesheet, shared runtimes, studio JavaScript and both marble assets return 200 and match the locally built SHA-256 hashes. Exact deployment, aliases and hashes are in `deployment.json`.

No material visual defect remains identified in this refinement. A short 320×568 viewport still scrolls to preserve readable controls; its local Chrome/WebKit checks passed. Existing physical laptop rehearsal gates belong to the separate studio acceptance record and are unaffected by this visual pass.

This evidence commit is pushed to `codex/hero-composition-release`; main remains at the verified production application revision above. The landing task completed this publication. The earlier pending requests for the animation task to integrate source `5683aa7` are superseded by this accepted release.
