# Motion recovery and equal-parts mixing

Prepared 13 September 2026 in the isolated motion-recovery worktree, preserving integrated application 13c1529 and acceptance evidence 2612147.

The reported unresponsive demo reproduced an HTTP 409 because another Chrome window owned the helper subscriber. The helper itself had fresh real sensor samples. The old page also consumed pairing links without retaining valid same-tab pairing across refresh.

This update retains only validated, unexpired pairing in sessionStorage; refresh reconnects disarmed and uncalibrated. Transient failures keep the credential; explicit Disconnect, matching authorization rejection and expiry forget it. Updated links work in an already mounted studio. Network/permission waiting and first-sample waiting have separate deadlines; stale controls cannot arm. Another browser is never silently displaced.

Fresh studio mixing defaults to the requested 1:1:1 guide. Each authored portion is 0.3 normalized units, including drops in flight. Each target stops pouring and disarms; component amounts remain conserved. Free pouring is still available. Per-stage laptop buttons beside the preparation instructions make calibration and arming visible, and stage changes keep pairing/calibration while disarming motion. This is laptop input within a selected stage; selecting ingredients, progressing stages, and finishing still use on-screen controls. Full gesture-only navigation is not implemented.

## Local verification

- Production TypeScript/Vite build passed.
- 12 native-stream checks passed (permission wait, first-sample timeout, expiry/auth callbacks, stale recovery, transport framing).
- 11 model checks passed (equal targets, transit, cap/stop, pause/resume, conservation, free mixing).
- 8 pairing browser checks passed (reload, expiry, disconnect, URL changes, storage unavailable, HTTP 409, transient restoration and authorization replacement).
- 2 guided laptop browser checks passed (synthetic sensor input through all three pours, Stir and Strain, neutral pause, retained connection, desktop/mobile layout).
- 20 existing studio/browser checks passed, including full free-mix preparation, keyboard/touch, rendering fallback/retry and strain geometry. Existing custom-quantity tests explicitly select free pouring.

Total: 53 local checks. Sensor protocol fixtures are synthetic and do not establish a new physical hardware acceptance. The owner is separately using the live helper; this verification does not take its one subscriber.

Desktop/mobile guided captures: guided-laptop-pour-desktop.png, guided-laptop-pour-mobile.png.

## Production verification

Source a629de01a4d8baa2161ec793b0617f1ffacbac0c is READY as dpl_5vfTyjcwzMdu8AgWQB936KovEeSA at https://spiritatlas-one.vercel.app. Immutable URL: https://spiritatlas-ewe1wrgir-ilham-firdausi-putras-projects.vercel.app. The public index-CCytpPmt.js and Studio-nCigC3I7.js exactly match the built application.

All 32 public routes/assets passed. All 13 public browser checks passed in 94.9 seconds: eight pairing recovery cases, two guided native-fixture flows/layouts, and three strain geometry/behavior/layout checks. No skipped, unexpected, or flaky tests. The live initial mixing controls were also inspected through the in-app browser. Public guided desktop/mobile screenshots and results are in public-* alongside the local evidence.

## Separate hardware rendering issue

During the owner's physical test, the existing Chrome scene reported repeated WebGPU destroyed-texture submission errors at fractional render-target dimensions (1328/1327 × 855). Quantities kept updating while the picture froze. Passing tests at standard viewport/DPR settings do not clear that issue. The Behind the Bar task is investigating the renderer from this exact application revision, with sole next publication ownership returned after this evidence commit. No new claim of complete physical-hardware acceptance is made by this recovery release. Ingredient/stage navigation still uses visible controls; this release does not implement full motion-only navigation.
