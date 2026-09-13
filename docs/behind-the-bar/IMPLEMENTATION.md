# Behind the Bar implementation

This feature links to canonical `negroni-express`; canonical catalogue data are not changed. `src/behind-the-bar/model.ts` defines separate studio source identity/quantity provenance, state and conservation. Source capacities (1 core, .4 Ancho, .3 rice), baseline (.65/.18/.1), mixing capacity 1.15 and serving capacity 1.0 are uncalibrated authoring units. The .015 minimum is an internal rendering-validity threshold, not a recipe measure. No ABV, measured dilution, temperature or taste score is inferred.

## Renderer and solver

A lazy route boundary isolates the imperative Three WebGPU preparation scene from the atlas's WebGL viewer. TypeGPU 0.12.5, unplugin-typegpu 0.12.3 and Three 0.186.0 are pinned in the lockfile. `gpu.ts` dispatches real compute for fixed-step damped free-surface modes and circulation. State readback on the same GPU device drives a closed, quantity-dependent polar surface mesh and bounded ice dynamics. This is a reduced hybrid model, not SPH/Navier–Stokes or calibrated hydrodynamics. It models retained velocity, reversal, release and settling. Guided streams use per-component parcels with .1-second transit. Capacity reserves include in-flight liquid; closing a stage waits for parcels and a stopped pour. Optional modifiers, early strain and partial transfer are legal.

Ice/light/material identity is inherited from existing negroni-express.glb. The static canonical liquid is excluded. Source-mesh normals, glass thickness and pepper/stem textures remain. Separate render targets capture opaque scene → ice → live liquid → outer glass to avoid nested transparent objects vanishing. Refraction and absorption are screen-space approximations with environment Fresnel reflection. The result uses retained serving quantities and garnish pose, not the canonical assembly. Comparison is a separate photo overlay.

Simulation advances at 1/120 s with a capped 6-step catch-up. Raw measured frame intervals are retained separately from the simulation cap. Hidden/blurred input disarms; background time is discarded. Resets clear GPU state and input, restore the current preset, retain mute and a still-valid motion session, and require explicit rearming. A browser without WebGPU receives labelled guided WebGL rendering with the same state/controls; that fallback does not establish the TypeGPU gate.

## Interaction

`/behind-the-bar` opens `start-empty`. `?preset=stir-demo` opens a legal, zero-force prefilled preview with demo origin. `Start my remix` clears it to user origin; continuing the preview to service remains `Demo serving`.

Circular pointer/touch movement drives spoon speed/direction. Arrow keys on the scene or hold-to-stir buttons give equivalent control. Move-glass and orbit are separate gesture modes. Pour click toggles and angle sliders allow pause/resume. Garnish sliders or drag set bounded position and rotation; service retains them. Native control is explicit arm/disarm; input never requires holding a key while lifting the laptop.

WebAudio uses project-generated deterministic filtered noise and transient glass tones, unlocked on a gesture. Pour intensity, circulation and ice contact control audio; mute persists locally. No remote audio assets or per-gesture generation requests.

## Native boundary

`tools/mac-motion/reader.c` adapts the MIT upstream report format at `203685640287449eaecf521c24d1f5e52486ecb7`. Actual target macOS allowed both devices to open and stream as uid 501, so neither reader nor bridge elevates. Reader has no network or command receiver. Node bridge listens only on 127.0.0.1, validates bounded real reports, authenticates the exact intended origin with a 256-bit short-lived credential, accepts one subscriber, and streams inertial data. It never hosts on Vercel or assumes persistent Vercel functions.

Pairing credentials are ignored owner-only local files and URL fragments removed immediately by the app. No token in evidence, source, logs or public environment. Production localhost access succeeded on ordinary Chrome 153 from the actual HTTPS alias without flags or permission overrides; final integrated feature rehearsal remains distinct. See MACBOOK-PREFLIGHT.md and tools/mac-motion/README.md for exact commands, units and pending physical evidence.

## Verification commands

- `npm run build`
- `npx playwright test -c tests/btb.config.ts`
- `node scripts/btb-live-probe.mjs`
- `node scripts/btb-transport-probe.mjs` while the local bridge runs

Headful Chrome on the actual M4 Pro is used for GPU checks. Synthetic protocol validation is separately labelled and cannot substitute for physical laptop-motion acceptance. STATUS.md is the current gate ledger; passing code checks do not certify fidelity, release performance or production.

## Final control and timing refinements

Pointer stirring supplies a 100 ms force pulse refreshed by actual movement. A held stationary pointer stops injecting circulation and earning readiness; the GPU retains and damps its existing flow. Deliberate hold buttons remain sustained inputs. Local translation acceleration also expires after 100 ms; tilt may remain while a control is held. Keyboard Move glass arrows now produce bounded tilt and key release returns the vessel to neutral.

Native packets optionally include `sampleEpoch`, derived from the HID monotonic timestamp and a same-machine Node `hrtime`/wall-clock anchor. The reader's IOHID callback receives the hardware report timestamp. An actual comparison found Node monotonic time 2.20 ms after the sample timestamp on receipt, establishing compatible timebases on this machine. TypeGPU readback carries the corresponding input marker into the rendered frame. Diagnostics distinguish sensor timestamp → next animation frame after render submission, browser receipt → that frame, and receiver processing time. The frame measurement includes readback delay and one animation frame; it is an estimate of visible presentation, not a photodiode measurement or a measurement of undocumented sensor-internal latency. Physical movement onset still requires the real-device rehearsal.

Asset failures dispose acquired device/renderer/resources before presenting Retry scene; retry retains the preparation ledger. Device-loss status offers the same recovery control. The optical renderer uses three offscreen captures plus the displayed glass pass. The hybrid model renders a height surface from GPU modes and CPU positions for three flow-coupled ice bodies; it is not a full volumetric fluid/rigid-body solver. Height maps authored normalized quantities and approximate ice displacement, and visibly decreases/increases with actual ledger transfers.
