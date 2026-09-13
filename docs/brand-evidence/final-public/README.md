# Public verification of SpiritAtlas

Tested application revision: `2807652c4a82f93851a280ab9191ce1c68ef85a7`, before the requested history amendments. Public URL: https://spiritatlas-one.vercel.app.

- All 17 focused browser journeys passed in 107.2 seconds, with no skipped or flaky cases. The suite includes three viewport sizes, navigation and refresh, cinematic frame composition, live 3D, ingredients, comparison, touch and reduced motion.
- All 34 checked resources returned HTTP 200 and matched local bytes, including all 11 reference images. `deployment.json` records each hash and the inspected Vercel deployment.
- Local and Vercel production builds passed; their logs are retained here.
- Screenshots record desktop 1440×1000, tablet 768×1024 and mobile 390×844, plus live, loading and expanded states.

The deliberate WebGL-unavailable case tests recovery from an induced failure. Previous failed or mixed-deployment results remain in their original directories; they are not counted as passes. After the history cleanup, the resumed final review passed all four photo gates and the mobile live probe, and accepted the final screenshots. Current deployment `dpl_AspB2EQxQBkkjL3AFZ94DwaGZ99s` at `e13da8e` serves identical application bytes; see `current-resource-check.json` and `current-vercel-build.log`. The requirement-by-requirement completion record is in `../../brand-implementation.md`.
