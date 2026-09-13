# Public verification of SpiritAtlas

Tested application revision: `2807652c4a82f93851a280ab9191ce1c68ef85a7`, before the requested history amendments. Public URL: https://spiritatlas-one.vercel.app.

- All 17 focused browser journeys passed in 107.2 seconds, with no skipped or flaky cases. The suite includes three viewport sizes, navigation and refresh, cinematic frame composition, live 3D, ingredients, comparison, touch and reduced motion.
- All 34 checked resources returned HTTP 200 and matched local bytes, including all 11 reference images. `deployment.json` records each hash and the inspected Vercel deployment.
- Local and Vercel production builds passed; their logs are retained here.
- Screenshots record desktop 1440×1000, tablet 768×1024 and mobile 390×844, plus live, loading and expanded states.

The deliberate WebGL-unavailable case tests recovery from an induced failure. Previous failed or mixed-deployment results remain in their original directories; they are not counted as passes. The user paused further website review to request the history cleanup and force push, so this evidence does not by itself claim completion of the broader design objective.
