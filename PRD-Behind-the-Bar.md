# SpiritAtlas — Behind the Bar

Version 2.1 · 13 September 2026 · Feature PRD · MacBook Pro / Apple M4 Pro demo

Revision 2.1 makes physical movement of the demonstrator's MacBook Pro with Apple M4 Pro the featured motion input. A native sensor helper and actual-machine verification replace mandatory phone pairing. Full pointer/touch/keyboard play remains required; a phone controller is optional. Preserve the ingredient remixing, player choices, live preview, performance checks, and single production owner from version 2.0.

## 1. Outcome

Add **Studio remix — inspired by Bar Somma** to the existing SpiritAtlas website. The first reference drink is Bar Somma’s Negroni Express. A visitor reveals its components, picks up individually pourable studio ingredients, makes choices about their amounts, stirs over ice, strains into the serving glass, expresses orange oil, and places the distinctive green shishito garnish.

The defining interaction is physical continuity: liquid responds immediately to input, lags behind vessel movement, flows around ice, and continues moving after the user stops. The player's amount choices and garnish placement persist into the final serving. Preserve the photographic character of the existing reference-based asset without replacing a player's different result with the canonical drink.

**Product acceptance:** a first-time visitor can make the drink respond through one obvious gesture, understand the connection, and discover a different response by changing that gesture. Every core interaction must provide visible cause and effect. Completing an orderly sequence of buttons alone does not satisfy this product outcome.

**Demo target:** MacBook Pro with Apple M4 Pro, as identified by the owner. Discover its actual macOS and browser versions during preflight. Rendering capability and native motion access are separate checks: WebGPU does not expose laptop accelerometer readings. Physical laptop input requires a local macOS helper and a verified connection to the deployed website. The exact machine's sensor support is currently unverified.

The promise is **“Look inside. Step behind the bar.”** This is a playable extension of the atlas, with a clear path back to the real bar and its drink.

The repository now contains 12 cocktails: three Negronis, three Espresso Martinis, three Martinis, and three Highballs. Preserve their discovery, detail, expansion, and comparison functionality. This release adds one complete preparation experience; it does not replace the catalogue or require 12 preparation games.

## 2. Selected drink and evidence

Select the existing canonical record and model for Bar Somma’s Negroni Express. Discover its real ID and routes; do not create a duplicate record just to simplify integration.

Relevant existing inputs:

- `SpiritAtlas-Brand-Kit/BRAND_GUIDELINES.md`, `VISUAL_REFERENCE.md`, `TEXTURE_PROMPTS.md`, and `spiritatlas-tokens.css`.
- The current application’s cocktail data, Blender sources, exported models, cameras, materials, and interaction code.
- Root `negroni-bar-crawl.mp4`, or its verified equivalent if renamed.
- Root `bar-somma-negroni-reference.*`, if present. Inspect the actual image before using it; establish whether it shows the same serving.
- Existing source and uncertainty records. Inspect source frames, not only previous prose descriptions.

Prior reference analysis identified a red-orange drink, a low tumbler with a softly curved lower profile, prominent clear ice, a long curved green pickled shishito with visible stem, and expressed orange oil. The video describes Ancho Verde and rice syrup. Recheck these against the actual repository references. Match the pepper’s wrinkled skin, taper, bend, scale, stem, and placement; preserve clear glass and ice detail.

### Canonical reference and studio formulation

Keep two distinct records: the canonical bar cocktail with source-supported facts, and a linked, authored studio formulation used for play. The original evidence did not establish a complete formula or exact quantities. Studio portions are design parameters, not newly discovered facts about Somma.

Default independently pourable vessels:

| Vessel | What it represents | Evidence and representation |
| --- | --- | --- |
| Core blend | The unresolved core of the cocktail, supplied as an unbranded prepared blend | A studio abstraction; do not invent its brands or claim a verified composition |
| Ancho Verde | The named modifier identified in the reference | Reconfirm identity; the offered portion is studio-authored |
| Rice syrup | The modifier identified in the reference | Reconfirm identity; the offered portion is studio-authored |

The core blend excludes the separately represented modifier portions in the studio model: do not double-count those liquids. If reliable evidence establishes additional core ingredients, they may become separate vessels without changing the canonical record's provenance rules. A component whose identity cannot be supported must not be presented as a confirmed Somma ingredient; record the unresolved content check and complete independent work.

Let the agent author and document a default studio preset and allowed amount ranges. Use uncalibrated portion indicators or source fill levels; do not present these as the bar's exact millilitres, equal-parts ratio, or measured serving. Keep ingredient identity provenance and quantity provenance separate in data. The baseline preset should produce the reference-inspired visual composition; it does not prove the actual recipe.

Use **“Studio remix · inspired by Bar Somma”** at entry and on the result. A short `About this remix` disclosure explains illustrative portions and unresolved recipe details. Preserve verified ingredient information in the canonical expanded view. Do not invent ABV, temperature, dilution percentages, flavor accuracy, or numeric taste ratings. Approximate visual mixing is an authored representation, not a chemical measurement.

The prepared core resolves uncertainty while leaving three meaningful liquid interactions. Reducing the entire remix to one premixed bottle does not satisfy this version of the PRD.

## 3. Scope

### Required in this release

- Entry from the selected cocktail's detail and expanded ingredient view through `Remix this drink`, plus a direct `Try stirring` live preview.
- One complete, replayable preparation with three independently pourable studio vessels, amount choices, and a result that retains those choices.
- Live TypeGPU-powered liquid behavior that responds to user input, with moving ice and plausible containment.
- A polished pointer/touch interaction path and an equivalent keyboard/control path.
- Physical laptop tilt/slosh and tilt-pour on the actual M4 Pro MacBook, using a native sensor reader and a verified bridge to the browser.
- A complete install-free browser experience through pointer/touch/keyboard; the local helper is required only for physical laptop control.
- Visible progress, useful technique feedback, natural interaction sound, a mute control, restart, and exit.
- Responsive layout, reduced-motion handling, loading/error states, and a meaningful unsupported-device path.
- A reproducible live demo preset and focused cause-and-effect checks alongside automated, visual, physical-device, and production verification.

### Later extensions

Additional recipes, arbitrary ingredient libraries, competitive leaderboards, accounts, multiplayer bartending, and chemically calibrated taste or dilution simulation are outside this release. Amount choices among the three studio vessels and native M4 Pro laptop input are in scope. A paired-phone controller is optional: preserve useful existing work, but its absence does not block this release. Phone motion cannot substitute for evidence of the requested laptop-motion demo. If native access is blocked, complete the browser experience and report the specific hardware gate honestly.

## 4. Experience and state flow

Use one authoritative preparation state. Input adapters emit intents into that state; they do not independently advance progress. Derive visible controls and completion from the same state. Define legal transitions through physical prerequisites, not compulsory perfect scores.

### Two deliberate entry points

- **Remix this drink:** start from the selected drink or expanded view. Animate the liquid ingredient representations into their pourable vessels and the physical ice/garnish into the workspace, preserving names and semantic identity. The user recognizes the components they just inspected. Use an object-specific affordance such as `Tilt to pour` or `Drag to stir` and a visible alternative control.
- **Try stirring:** open a valid, prefilled, live preview using the same simulation and controls. One gesture immediately moves liquid and ice; no pairing or multi-step tutorial is required. Provide `Start my remix` to begin the full empty preparation. A preview is identified as prefilled and does not count as completing a user-made drink.

| Stage | User action | Required response | Exit condition |
| --- | --- | --- | --- |
| Entry | Select `Remix this drink` | Components become tools and ingredient vessels; retain canonical identity and studio label | Assets and controls ready |
| Prepare | Add mixing ice | Ice drops, collides, and settles with contact sound | At least the required studio ice portion is present |
| Mix | Select a vessel, tilt, stop, resume, or choose another | Continuous stream; source decreases and mixture increases; level and approximate composition respond | User chooses `Stir` with a valid nonempty mixture containing core blend |
| Stir | Change spoon direction and speed, pause, or move the glass | Liquid circulates around ice; ice responds; stopping and reversal have visible consequences | User chooses `Strain`; readiness advice is optional |
| Strain | Tilt, pause, resume, then finish pouring | Attach a strainer, retain mixing ice, and transfer liquid over serving ice | User chooses `Finish` after the receiving glass has a valid nonempty serving |
| Express | Select peel and express oil | Brief fine mist over the surface | Expression complete, or user explicitly skips |
| Garnish | Move and rotate the shishito, inspect, and place | Placement follows input and resolves contact while preserving the chosen position/orientation | User confirms a valid placement |
| Serve | Select `Serve` | Live hero view preserves the actual mixture, fill, and garnish; compare with the reference | User chooses another remix, compare, or exit |

The final reference drink does not gain a permanent orange wedge merely because peel is used during expression. Retain the pepper as the visible garnish unless the actual reference proves otherwise.

Provide a compact progress line: `Mix → Stir → Pour → Finish`. Reveal only the controls needed for the current step. Separate orbit gestures from object manipulation with clear modes or hit targets. No action should unexpectedly move both the camera and a vessel.

The suggested walkthrough includes all three liquids, stirring, oil, and garnish, but individual modifiers, perfect stirring, and oil expression are not compulsory game scores. Guard only invalid transitions: an empty mixture cannot be strained; an empty receiving glass cannot be served; a pepper cannot be placed inside solid glass. Document small rendering-validity thresholds as internal simulation limits, not recipe measurements. Skips and partial pours must be accurately reflected in the result.

At legal paused stages, `Back` can return to adjust the current preparation without undoing physical transfers. `Start over` restores the current mode's starting preset; `Try another mix` always opens `start-empty`. Both restore quantities, physics, camera, and progress, retain mute preference and a still-authorized controller connection, clear input, and require a new explicit arming action. Expired controller credentials never regain authority through reset. Exit disposes the scene and returns to the originating drink.

### Player choices and visible consequences

| Choice | Required consequence | Evidence |
| --- | --- | --- |
| Pour a little, release, and resume | Stream stops, quantities remain, and pouring resumes from the retained amount | Same-vessel pause/resume recording and quantity check |
| Change amount or omit a modifier | Mixture composition and resulting fill reflect the choice; color changes only where visually plausible | Two controlled preparations with different amounts |
| Stir slowly, then quickly | Circulation, ice movement, and contact sound change with actual state | Input/response recording |
| Reverse direction | Existing circulation resists and then reverses; no instantaneous velocity flip | Reversal and settling probe |
| Release the glass | Applied force stops while residual motion decays | Input release and stale-sample checks |
| Reposition/rotate the pepper | Final serving retains the valid chosen pose | Two distinct valid placements and result inspection |

Keep pours aimed into a receiving vessel and clamp available quantities/capacity. Free spills are not required. Stop a pour with a clear `Glass full` response rather than silently deleting excess liquid. At partial strain completion, liquid left in the mixing glass remains tracked and visible; it is not teleported into the serving. Contact assistance may correct garnish penetration but must not snap every placement to the same canonical pose.

### Completion and feedback

Use encouraging observations such as `Try changing direction`, `Let it settle`, and `Smooth circulation`. A readiness hint can depend on sustained effective stirring; document it as studio guidance. No input produces no readiness progress, and one large impulse does not earn the smooth-stirring hint. Choosing to strain early remains legal.

At service, label the result `Your studio remix` and summarize actual choices without judging real-world taste. Display the source reference separately as `Bar Somma's presentation`. Preserve the player's mixture quantities, fill, tint approximation, and garnish pose through camera changes, reference comparison, and return. Do not substitute a pristine canonical asset to manufacture a successful result.

Offer `Try another mix` and `Visit this bar`. Replaying is useful because different actions create visibly different results. There is no leaderboard or punitive numerical score in this release.

## 5. Controls and physical performance

### Pointer, touch, and keyboard

Pointer/touch users can add ice, select any studio vessel, control pouring, stir through circular movement, strain, express, and translate/rotate the pepper. Provide explicit alternatives: `Add ice`, ingredient selectors, a labeled tilt slider, press-and-hold clockwise/counterclockwise stirring with speed adjustment, and directional garnish placement/rotation with `Place`. These drive the same state and simulation. Do not require precision dragging, double-click, or sensors to finish.

Stirring follows the continuous angle around an on-screen ring; unwrap angle changes across the seam and derive bounded angular velocity from timestamps. A speed change affects force rather than switching between unrelated animations. The hold-to-stir alternative generates the same intent stream. Pointer release, lost capture, and touch cancellation release control.

For keyboard access, focus order follows the preparation. Announce discrete stage changes through an appropriate live region, not continuous physics frames. Support Escape to leave the active manipulation mode before exiting the experience. Maintain visible focus and useful instructions.

### Featured controller: the M4 Pro MacBook itself

The website alone cannot be assumed to receive motion events when this laptop is moved. Use a native macOS reader for the internal motion sensors, a minimal local bridge, and the same validated input intents used by pointer controls. Keep the liquid simulation and rendering in the browser; transmit sensor data, not rendered frames.

Investigate the MIT-licensed `olvvier/apple-silicon-accelerometer` project as a concrete starting point. It exposes an undocumented Apple SPU/IOKit path and includes a Python `macimu` API. Its README explicitly documents testing on an M3 Pro MacBook; an M4-family report in a downstream project describes readings and a subsequently resolved stall. Neither proves compatibility with this particular M4 Pro and macOS version. Inspect current source, license, dependencies, and a pinned revision before adopting it. An alternative native implementation is acceptable if verified; do not invent a browser accelerometer API or silently use synthetic input.

**Perform native preflight first on the actual demo machine:**

1. Record the Mac model/chip, macOS version, chosen browser/version, and WebGPU availability. Do not collect serial numbers or unrelated device information. Select a current browser that actually exposes a usable WebGPU adapter on that machine; keep the ordinary-browser fallback functional.
2. Check for a supported sensor device without elevated privilege where the reader allows it (`IMU.available()` is an upstream example). Device presence is not proof of a usable stream.
3. Start the reviewed native reader using only the OS privileges it actually requires. The referenced implementation requires root for its reader; this cannot be supplied by Vercel or a normal web page. Document the exact local launch command and its reason. If local authorization is needed, obtain it through the normal permission path; do not bypass it or claim success without readings.
4. Observe real samples while the laptop rests, tilts in each direction, moves briefly, and returns to rest. Check sample units, axes, timestamps, frequency, saturation, noise, and stream continuity through a complete rehearsal. Establish a calibrated neutral orientation. Test helper restart and confirm that reacquisition does not apply an impulse or start a pour.
5. Record measured results and sanitized evidence in `docs/behind-the-bar/MACBOOK-PREFLIGHT.md`. Distinguish `not checked`, `sensor absent`, `authorization needed`, `stream stalled`, and `live readings verified`. Record the helper revision and actual OS/browser combination. None of these statuses alone establishes end-to-end browser response.

If the agent is running on Linux or a remote machine, it can implement and exercise the browser and helper protocol but cannot clear this native check. Supply a reproducible diagnostic command/page for the owner to run on the M4 Pro, finish independent work, and keep the physical-device gate blocked until real evidence is returned. Discover the OS locally rather than requiring the owner to identify it before development can proceed.

### Native helper boundary and connection

Keep the privileged reader as small as practical. Only the sensor-access process receives necessary elevated privilege. Use bounded structured IPC or stdout to an unprivileged bridge; keep the browser, development server, build tools, and network bridge unprivileged. Do not run arbitrary commands received from the website. Retain dependency licenses, pin working versions, validate messages, and document start/stop behavior. No browser security or OS protection should need to be disabled.

Choose one transport and prove it early from the **actual Vercel HTTPS origin** in the intended Mac browser:

- Prefer an existing suitable realtime service: the unprivileged helper publishes outbound over TLS, and the paired browser subscribes using scoped credentials. Only motion/control data crosses the relay. Ordinary Vercel functions are not a persistent WebSocket server.
- A loopback bridge is acceptable if it works under the browser's normal TLS, mixed-content, and local-network permission rules. Bind it to loopback, authorize the intended origin/session, and document setup. Do not assume an HTTPS page can freely connect to `ws://localhost`, require security flags, or expose the helper on every network interface.

These are alternatives, not a requirement to build both. Record the chosen approach and required environment variable names. Reuse authenticated services where suitable; surface a genuinely unavailable service or certificate/setup dependency as a concrete blocker. A connection that works only on the development origin does not pass production acceptance.

Use short-lived, high-entropy pairing credentials, expiry, separate publisher/subscriber authority where supported, one active input owner, sequence checks, and validation of finite bounded values. Pair deliberately before the demo; do not put tokens in screenshots, Git, or public build variables. Measure freshness using the receiver's monotonic arrival clock. Sender timestamps help order samples but cannot establish one-way latency without clock synchronization. Send only inertial samples and necessary session/control metadata.

The public website stays playable without installation or helper connectivity. Offer `Enable laptop motion` as an opt-in feature with accurate connection, calibration, and armed/disarmed status. A sensor device, connected socket, or advancing synthetic counter alone must never produce a `Live motion` success state.

### Motion mappings and control ownership

Calibrate while the laptop is stationary in a comfortable neutral position. Use relative orientation for tilt and filtered linear acceleration for slosh. Normalize units explicitly: upstream raw acceleration is reported in g and gyroscope readings in degrees per second; convert to the simulation's declared units. If another implementation reports m/s² or supplies gravity-removed acceleration, handle that explicitly. Remove/account for gravity exactly once. Check axis signs against the displayed scene. Do not double-integrate noisy accelerometer readings into a free-space position, or treat accelerometer-only tilt as reliable during large translational motion.

| Input | Active mode | Scene response |
| --- | --- | --- |
| Tilt the armed MacBook | Move glass / stir stage | Bounded vessel pitch/roll relative to calibrated neutral |
| Briefly move the armed MacBook laterally | Move glass / stir stage | Bounded sloshing impulse; visible liquid/ice inertia after movement stops |
| Circular trackpad or mouse drag | Stir | Spoon angle, direction, and speed follow the path |
| Tilt the MacBook after selecting a source and `Arm pour` | Mix or strain | Tilt the selected source; transfer follows angle, available quantity, and receiving capacity |
| Disarm, Escape, blur/hide the experience, disconnect, or stale input | Any | Stop applied input and further pouring; residual liquid/ice motion decays |
| Recenter while disarmed | Any available motion mode | Establish neutral orientation without changing mixture quantities |

Provide an explicit click/tap arming toggle before the demonstrator lifts the laptop; do not require holding a keyboard key while holding the machine. Show the active vessel and armed mode prominently. Selecting another vessel, changing stage, resetting, and reconnecting disarm the controller. `Arm pour` must be deliberate; enabling motion does not automatically enable pouring. Calibrated neutral is below the pouring threshold. Treat this as expressive vessel motion: physically shaking a Negroni is not presented as its recommended preparation technique. Spoon stirring remains a distinct, controllable rotary input.

Clamp tilt, angular velocity, acceleration, and applied forces to ranges proven stable in the supported vessel. Gentle controlled movement should give an unmistakable response without requiring exaggerated motion. Filter stationary noise; a neutral, still laptop must not accumulate energy or start pouring. Continued deliberate tilted pouring is valid only while its pour mode remains armed.

A sample older than 250 ms is stale. Stop sustained forces and return a pouring vessel to a non-pouring pose; keep residual waves alive. Fresh data alone never rearms control. Require a fresh intentional arming action after a stale stream, permission loss, helper restart, expiry, or lost focus. Reset clears pending input and never revives expired authority. Local pointer/keyboard takeover releases native input immediately so two sources cannot fight over one vessel.

### Optional phone controller

If retained or implemented, pair a supported physical phone through HTTPS and an ephemeral session. Request motion permission from a user gesture when required and check actual samples. Use a hold-to-control clutch, calibrated tilt for vessel motion, bounded lateral acceleration for slosh, and a circular touch pad for spoon stirring. Handle screen orientation and units explicitly; apply the same validation, expiry, stale-input, and ownership rules. Provide useful denied/absent/disconnected states and a manual pairing alternative to QR.

Phone integration is optional for version 2.1. If shipped, verify its controls and failure states; do not advertise physical phone motion as tested without a real-device check. It is not needed to play the website or to demonstrate verified native MacBook motion.

## 6. Simulation and rendering contract

### Prove integration first

Inspect the current renderer before choosing a GPU architecture. TypeGPU is a WebGPU toolkit for writing and running GPU work; it is not an off-the-shelf cocktail physics engine. Review current TypeGPU documentation and relevant examples, retain applicable licenses, and pin the working dependency version.

The first implementation milestone is the `Try stirring` live preview inside the actual app renderer: one vessel, liquid, ice, direct pointer input, reversal, release, and settling. In parallel with this browser work where practical, run the native M4 Pro preflight; then connect verified laptop tilt/slosh through the production-compatible bridge. This preview is the product's first interaction and later becomes the demo preset, so the proof work contributes directly to the release.

If the existing catalogue uses WebGL, isolate a WebGPU preparation renderer behind the existing route/component boundary. Reuse compatible geometry, textures, and authored scene metadata. Do not assume WebGL and WebGPU share buffers, or that separately created WebGPU devices can exchange resources directly. Avoid an unrelated catalogue renderer migration. Dispose inactive scenes instead of keeping multiple heavy renderers alive.

### Required physical behavior

- **Live state:** liquid shape and velocity evolve from input and prior state, not a prerecorded clip or a parameter that merely scrubs one animation.
- **Containment:** liquid respects the vessel’s inner wall and bottom; model thickness matters visually. The free surface remains plausible as the vessel tilts.
- **Inertia:** motion lags input and decays after input stops. Reversing input produces a different transient response from continuing in one direction.
- **Stirring:** moving the spoon transfers momentum to nearby liquid. Ice responds to flow/contact and remains plausibly constrained.
- **Ice:** mixing ice moves, collides, and visibly displaces liquid. The serving ice block has the reference’s scale, softened edges, and clarity. Use separate simple collision geometry where appropriate.
- **Pouring:** transfer is continuous, governed by vessel orientation and available contents. A visible stream terminates at the receiving liquid surface rather than passing through it.
- **Straining:** mixing ice remains in the source vessel. The source empties as the receiving vessel fills; the serving ice is a separate object.
- **Settling:** after input stops, small waves subside. The finished drink remains live and orbitable.

### Preferred first simulation prototype

Start with a focused hybrid implementation:

1. **TypeGPU surface and circulation state:** evolve wave displacement and flow from vessel orientation, impulses, spoon input, and prior state. Use volume-aware vessel geometry and a free surface; a top plane rotating rigidly with the glass does not establish liquid behavior.
2. **Bounded ice dynamics:** move collision bodies under gravity, buoyancy/flow approximations, contact, and drag. Couple displacement to the visible surface sufficiently to avoid obvious overlap or volume errors.
3. **Quantity-driven streams:** generate a continuous, input-responsive pour stream from the source lip to the guided destination; update per-component quantities and visible fill throughout the transfer.
4. **Material response:** use live surface normals, absorption, reflections, ice detail, and contact cues. Approximate component mixing consistently without artificial neon colors or persistent unmixed strata.

This is a starting architecture, not an assertion that it will achieve the required look. Inspect shallow/deeper fill, tilt, ice contact, spoon reversal, and pouring in the actual vessels. A height-field or related surface approximation may fail at large tilt, contact, or transfer. If it does, refine the specific failing part or introduce a particle-based method with recorded evidence. Do not hide a failed behavior or call a decorative wobble a fluid simulation.

Choose the simplest live method that passes the observable contract. A general-purpose multi-container fluid engine is not an independent deliverable. Guided receiving glasses and bounded tilt are intentional interaction rules; free spilling across an entire bar is not required. All legal input must still cause responsive motion and accounted quantity changes.

Do not let decorative foam, visible separated ingredient strata, or excessive bubbles make this Negroni resemble a shaken Espresso Martini. Brief entrained bubbles may decay naturally. Slow melting and exact thermodynamics are not required; any chilling/dilution feedback must be explicitly modeled as a studio approximation and must not pretend to measure the real drink.

### Numerical requirements

Use a fixed simulation step or a documented stable equivalent, bounded catch-up after stalls, and a controlled random seed for reproducible checks. Handle resize, hidden tabs, route changes, and GPU device loss. Resuming a hidden tab must not inject a huge elapsed-time impulse.

Quantities remain finite and nonnegative. Track each component separately across its source, stream/in-transit state, mixing glass, and serving glass; source totals and vessel capacity constrain transfer. Account for less-than-full source pours and liquid left after partial straining. Transfers conserve each tracked component and the total liquid within 1% over a preparation, excluding only explicitly modeled and accounted losses. No unexplained loss or creation is acceptable.

Distinguish state-accounting checks from validation of visible fluid volume: inspect both. Closing a stage cannot silently erase remaining liquid, duplicate a modifier, normalize the result to the default mixture, or reset its color. Ice should not tunnel through the vessel during supported input.

Use actual GPU state for meaningful solver validation where supported. A CPU test of an approximation alone cannot establish that the deployed GPU solver is correct. Tolerances should account for floating-point variation; do not demand cross-device pixel equality.

### Material quality

Keep glass transmission, plausible refraction, liquid absorption, ice inclusions, rim/base thickness, contact shadows, and coherent reflections. Compare a fixed baseline studio preset against the accepted Somma scene for the reference-inspired appearance. Preserve the same glass/ice/pepper material identity in player variants; different fill, approximate tint, and valid garnish poses are legitimate consequences of user choices and must not be “corrected” to the baseline.

Compare live browser captures against the source and existing accepted render. Inspect multiple views and motion; a hero still alone does not prove quality. Avoid noise, bloom, depth of field, grain, or motion blur that conceals artifacts. Internal approximation is acceptable when it is disclosed in engineering evidence and preserves the required observable behavior.

## 7. Art direction and sound

Use the current SpiritAtlas brand kit: charcoal stage, orange active action, cream text, peach supporting artwork, Instrument Sans, and restrained IBM Plex Mono. Keep marbled gradients and square-dot dissolves around the scene or transition boundaries. Do not postprocess the glass or controls with dither.

The full visual sequence is deliberate: finished reference → recognizable components → playable workspace → personal serving. The direct preview gives an immediate live interaction before this sequence when desired. Give the glass ample room, keep the bar's identity visible, and use quiet screen-space labels. Reuse the current landing page and navigation rather than redesigning them as part of this feature.

Audio should respond to events: ice contact, liquid stream intensity, stirring, and a restrained garnish finish. Unlock audio after interaction and provide a persistent mute control. Avoid a looping sound that continues after motion or pouring stops. Sound assets must be project-owned, generated, or appropriately licensed. The experience must remain understandable when muted.

Reduced-motion mode removes ambient camera moves, automatic orbit, and decorative animation. Essential user-controlled liquid movement can remain; offer the guided controls and avoid surprise transitions. On mobile, keep controls outside the manipulation area, support the phone-as-player path without self-pairing, and prevent accidental page scrolling during active gestures only.

## 8. Architecture and data boundaries

Adapt these responsibilities to the existing framework; filenames are illustrative:

| Responsibility | Contract |
| --- | --- |
| Preparation definition | Canonical cocktail ID, separate authored formulation, identity/quantity provenance, ingredient vessels, allowed ranges, baseline and demo presets |
| Preparation state | Stage, per-component quantities/locations, input ownership, readiness advice, serving/garnish state, replay/reset; sole authority for progression |
| Simulation | Vessel/ice state, liquid compute, input forces, fixed-step update, snapshots and diagnostics |
| Input adapters | Pointer, touch, keyboard, native Mac motion, and optional phone; normalize to shared validated intents |
| Scene presentation | Assets, materials, camera, screen-space labels, decorative layers, event-driven sound |
| Native helper and transport | Minimal privileged sensor reader, unprivileged bridge, scoped pairing, ownership, calibration, disconnect and expiry |
| Evidence tooling | Deterministic input replays, numerical probes, browser captures, runtime diagnostics |

Suggested intents include `selectIngredient`, `addIce`, `setPourTilt`, `stir`, `moveVessel`, `releaseControl`, `finishTransfer`, `expressOil`, `setGarnishPose`, `placeGarnish`, and `loadPreset`. The exact API is an implementation choice. Keep ingredients and stages data-driven so another recipe can be added without copying the entire scene, while shipping only the selected Negroni now.

Store a result snapshot of actual component quantities, serving volume, performed actions, garnish transform, and session origin (`user` or `demo`). Reference comparison and camera changes read this snapshot/state without mutating it. Deterministic preview/demo presets go through the same initialization and validation path as normal sessions; they cannot grant hidden completion flags or skip quantity accounting.

Reuse existing routes where appropriate. A direct preparation URL and any shipped controller/diagnostic URL must survive refresh and deployment. Entering a deep link starts or restores a valid documented state, without requiring prior atlas navigation. Update existing product data intentionally; never reduce the catalogue back to three drinks.

No LLM or image-generation request is needed for each stir, motion sample, or normal page visit. Existing `OPENAI_API_KEY` may support development-time asset creation only where useful. Keep it in the local/server environment and out of logs, Git, downloaded evidence, and browser bundles. Record model/tool provenance accurately if assets are generated. Do not make unrelated texture regeneration a gate for this gameplay release.

## 9. Verification plan

Use the existing test framework and add targeted checks for the real risks below. Keep code checks, GPU checks, visual inspection, and physical-device checks separate in the report. A passing build, mocked motion event, or screenshot is not a substitute for the others.

### Automated behavioral checks

1. Complete the suggested three-vessel journey through shared intents and visible browser controls. Also finish a legal variant with a partially poured source, an omitted modifier, early straining, and partial transfer. Reject empty/invalid transitions while permitting these choices; retain canonical ID and separate studio state.
2. Verify component-level and total quantity conservation, source exhaustion, capacity stops, liquid in transit, remaining mixing liquid, retained mixing ice, and stable state for idle, stirring, reversal, and a bounded impulse. Compare visible fill against the ledger.
3. Verify that effective stirring advances the advisory hint, idle does not, and an isolated impulse does not earn it. The hint must not gate the `Strain` action for an otherwise valid preparation.
4. Complete, restart, switch presets, and re-enter repeatedly. Verify no duplicate objects, subscriptions, stale controller authority, stuck audio, or accumulated transforms. Reset retains a valid connection but clears input and disarms motion; it never revives expired authority. Check hidden-tab resume and disposal.
5. Exercise native-reader authorization failure, sensor absence, absent/stalled samples, delayed/out-of-order samples, disconnect, reconnect, expiry, wrong-session input, and local takeover. Verify source units, axes, neutral calibration, gravity treatment, arm/disarm, stage changes, blur, and helper restart. Test invalid values including NaN/infinity at the input boundary. Add phone-specific permission checks only if that optional path is shipped.
6. Exercise keyboard completion and touch-compatible controls, including garnish placement and reliable exit.
7. Run relevant existing build/type/lint/tests and regression checks across all 12 catalogue entries, category navigation, their existing expansion, and representative comparisons. Do not weaken unrelated checks to make this feature pass.
8. Compare results of two deterministic preparations with different pour quantities and valid garnish poses. Differences must survive service, reference comparison, camera orbit, and return; neither may silently become the canonical result.
9. Verify `stir-demo` is a legal prefilled initialization using the production simulation, not prerecorded output. It is identified as a preview and cannot claim the user completed a preparation. Reset and `Start my remix` produce their documented states.

### Browser, visual, and hardware checks

- Inspect desktop at 1440×1000 and mobile at 390×844, plus a tablet layout around 768×1024. Check initial load, active preparation, and final service.
- Record the browser, OS, GPU/adapter information when exposed, viewport, actual rendering resolution, and quality setting for measurements. Use the final scene at its release quality in a real supported browser. A stripped diagnostic scene cannot establish release performance. Label software-rendered or headless results accurately.
- On the designated Apple M4 Pro MacBook Pro, aim for 60 FPS. The release floor is an average of at least 30 FPS and p95 frame intervals at or below 33.4 ms over an active 30-second manipulation sequence after loading. Meeting this floor does not establish 60 FPS; report both the measured rate and whether the higher target was achieved. Investigate visible stalls, instability, and device loss. These are responsiveness checks, not limits on refinement or asset quality.
- Measure receipt-to-visible-response latency for local input where tooling permits; target below 100 ms. For native laptop motion, measure physical-movement-to-visible-response end to end using synchronized instrumentation or a filmed comparison; target below 150 ms on the tested bridge/network. Also report receiver-to-visible-response separately so relay delay is not hidden. Do not claim latency from unsynchronized device clocks.
- Inspect the same pour and stir at different input speeds and after release. Verify coherent refraction, stable liquid surfaces, plausible contact, no wall leakage, and no visible volume mismatch.
- Check the baseline studio preset against the selected source views and current accepted cocktail model, then check that player variants preserve material identity and their actual choices. Do not flag intentional user-created fill/pose differences as defects or remove them to improve a reference match.
- Verify muted audio, permission prompts, reduced motion, unsupported WebGPU, loading errors, and navigation recovery.

### Actual M4 Pro test is mandatory for the laptop-motion claim

On the owner's MacBook Pro with Apple M4 Pro, complete the native preflight, connect the helper to the deployed experience, obtain real readings, calibrate, arm, tilt/slosh, stop and settle, disarm, stir with the trackpad, and deliberately arm tilt-pouring. Test stale input, helper termination/restart, focus loss, and local takeover. Finish the drink through the complete local controls as well. Record the actual hardware, OS/browser/helper versions, deployed revision, quality settings, and a recording or device-test record. Distinguish sensor-driven vessel movement from trackpad-driven spoon movement.

Rehearse with the real display arrangement and browser window used on stage. Confirm that a still neutral laptop does not accumulate force, that deliberate tilted pouring is bounded, and that stale input immediately removes pouring authority within the specified timeout. Confirm that reconnecting never silently rearms the vessel.

If no access to this MacBook or necessary OS authorization is available to the agent, complete and deploy all independently verifiable work first. Provide the native setup/diagnostic command, exact production diagnostic URL, and short steps for the owner to supply missing evidence. Mark BTB-06 blocked until it is actually exercised. A physical phone test, simulated HID device, synthetic trace, successful build, or software-rendered screenshot cannot clear the M4 Pro gate. Distinguish a working browser release from a verified physical-laptop demo in the final report.

## 10. Acceptance matrix

All 14 rows are required for full completion. Record evidence paths and results in `docs/behind-the-bar/STATUS.md`. Establish the live interaction and player-choice gates first, then clear the remaining release requirements; treat the sequence as priority, not permission to omit later gates.

| ID | Requirement | Passing evidence |
| --- | --- | --- |
| BTB-01 | Canonical identity and authored studio remix | Source mapping, separate formula/provenance, illustrative-portion disclosure; no invented bar recipe |
| BTB-02 | Complete, flexible preparation | Suggested three-vessel walkthrough plus legal partial/omission variant; no invalid empty serving |
| BTB-03 | Live TypeGPU physics | Executed GPU path plus video of distinct input responses, inertia, and settling |
| BTB-04 | Containment and quantity | Per-component probes and visual source/stream/destination accounting, including partial pours and retained ice |
| BTB-05 | Complete non-sensor controls | Pointer/touch and keyboard completion; denial/unsupported path remains usable |
| BTB-06 | Physical M4 Pro laptop interaction | Actual native readings drive the deployed browser: tilt/slosh/tilt-pour, calibration, deliberate arming, release, restart and takeover; hardware/version evidence |
| BTB-07 | Material fidelity and player-result integrity | Baseline reference captures plus preserved fill/composition/garnish choices in distinct player results |
| BTB-08 | State and resource reliability | Restart/re-entry, hidden-tab recovery, expiry, disposal, and focused regression results |
| BTB-09 | Responsive and accessible presentation | Desktop/mobile/tablet evidence, visible focus, legible controls, reduced motion, mute |
| BTB-10 | Responsive runtime | Recorded frame/latency results on identified hardware, release floor passed, 60 FPS target reported separately |
| BTB-11 | Existing product preserved | All 12 records/routes retained, relevant expansion/comparison checks, landing-page integration |
| BTB-12 | Integrated production verified | One release owner, tested integrated revision/deployment ID, public routes/assets, full journey, and native-helper transport from the actual HTTPS production origin |
| BTB-13 | Immediate cause and effect and player agency | Fresh-session walkthrough: first gesture changes motion, changed gesture changes response, and choices persist |
| BTB-14 | Reproducible live demo | `stir-demo` initializes valid live state, responds to new input, visibly settles, resets, and opens the full remix |

Unsupported WebGPU can use a clearly identified simplified guided rendering with complete accessible controls. It is a fallback and cannot be the only implementation used to pass BTB-03 or BTB-07. A connected native helper without actual M4 Pro sensor data and visible deployed-scene response cannot pass BTB-06. Phone control is optional and cannot substitute for that evidence.

For BTB-13, start with a clean session and only the visible UI instructions. Inspect whether an obvious gesture can produce motion, then change direction or intensity and observe a different response. Follow with two amount/placement variants and inspect their results. Record any extra guidance required. An agent-run walkthrough is a usability inspection, not evidence of a human user study; do not fabricate participant feedback. No separate recruitment study is required for this release.

## 11. Implementation order and evidence

1. Inspect the app and references; record canonical identity, the three-vessel studio definition, renderer integration, catalogue baseline, and the release owner. Start the actual M4 Pro native sensor preflight immediately when machine access is available; otherwise prepare its reproducible diagnostic and continue independent browser work.
2. Build the live `Try stirring` prototype inside the app. Inspect the first-gesture response, reversal, containment, and settling; reuse it as `stir-demo`.
3. Establish native M4 Pro tilt/slosh through the minimal helper and a diagnostic page on the actual Vercel HTTPS origin. Prove arming, units, freshness, and recovery; then connect the shared vessel controls. Resolve actual-machine/browser and transport issues before presenting laptop motion as working. Phone control is optional.
4. Complete the flexible three-vessel preparation. Verify pause/resume, amount choices, partial transfers, garnish placement, and result preservation.
5. Refine optics, motion, sound, responsive composition, and accessible controls using browser captures and source images. Recheck BTB-13 after UI changes.
6. Clear focused checks, hand off or integrate with the current landing page, and have the single release owner deploy. Exercise the deployed paths on real hardware against the exact integrated revision.

After each material iteration, record the largest remaining mismatch or failure, the change made, and the observed result. Keep working on concrete gaps. Do not impose arbitrary iteration caps or finish because a first render is attractive. If a required external dependency is unavailable, finish all independent work and report the evidence and smallest needed user action.

Required engineering deliverables:

- Integrated source, static assets, dependency lockfile updates, and reproducible asset/export scripts where assets change.
- A minimal native sensor reader/bridge integration (for example `tools/mac-motion/`), pinned dependencies/licenses, and reproducible macOS start/stop instructions. Keep privileged and network responsibilities separate.
- `docs/behind-the-bar/MACBOOK-PREFLIGHT.md`: actual M4 Pro/macOS/browser/helper findings, diagnostic commands, calibration/units, chosen production transport, required permissions, and unresolved checks. Do not include serial numbers or credentials.
- `docs/behind-the-bar/STATUS.md`: BTB-01–BTB-14 states, evidence, actual limits, release owner, and next actions.
- `docs/behind-the-bar/IMPLEMENTATION.md`: architecture, solver approximations, control mappings, preparation assumptions, local setup, and deployment/realtime configuration.
- `docs/behind-the-bar/evidence/`: named screenshots, a preparation recording, GPU/input measurement results, and the physical-device record when available.
- Focused automated tests and deterministic input fixtures; documented commands that actually ran.
- An environment example containing variable names only, when new configuration is required.
- A committed `docs/behind-the-bar/RELEASE.md` recording release ownership, feature and landing revisions, integrated revision, verification status, and the production deployment ID/URL.

## 12. Vercel delivery and concurrent work

The landing page is being developed separately. Use an isolated feature branch/worktree where appropriate. Do not reset, overwrite, or silently discard another agent's work. Before anyone deploys, establish **one production release owner** in `docs/behind-the-bar/RELEASE.md` and acknowledge ownership across the active tasks. Separate branch-local declarations are not agreement.

If a landing-page release agent is active, that agent is the default production owner. The feature agent supplies a reviewable commit/PR, setup changes, and feature verification; a preview deployment is permitted. It does not independently update production while the owner is releasing. If no release owner exists and landing work has finished, the agent executing this goal may assume ownership and record that decision. Ownership transfer must be explicit and sequential.

The release owner integrates both feature and landing work, runs the relevant checks on that integrated revision, then deploys to the matching SpiritAtlas Vercel project. Record the feature revision, landing revision, integrated commit, Vercel deployment ID, and public URL. If integration or a fix changes the tested code, rerun affected checks and update evidence. A passing feature branch does not establish a passing combined release.

Reuse current deployment configuration and authenticated services. Creating a new project is appropriate only when no matching project exists; do not overwrite unrelated applications or purchase infrastructure. Surface unavailable realtime authentication as a concrete blocker.

Verify production without relying on the developer's logged-in browser: preparation and shipped diagnostic/controller deep links and refresh, the live preview, required assets, full local interaction, result comparison, and return to the bar. Separately connect the native helper from the actual M4 Pro to this production origin and exercise physical input and recovery. Optional phone routes need verification only if shipped. Only the release owner applies production fixes. Full goal completion still requires BTB-12 evidence; a feature handoff or preview alone is partial completion, with the release owner identified as the next responsible actor.

## 13. Live demo preset and presentation

Provide two documented initializations: `start-empty` for the full remix and `stir-demo` for a prefilled live interaction. A suitable direct route/query is an implementation choice. `stir-demo` contains a valid baseline mixture, settled mixing ice, and the same controls and solver used in the full experience. Its component quantities and remaining source portions are internally consistent. It starts with zero applied user force, accepts new input immediately, and is labeled as prefilled.

`Reset demo` reinitializes that preset, clears input/velocity, recenters the view, and retains a valid controller connection and mute preference. It always disarms motion and requires a new explicit arming action. `Start my remix` switches to `start-empty` and sets user origin. Presets initialize real state; they cannot play a recorded animation, bypass accounting, or mark a user preparation complete. If a visitor continues a demo through service, label its result `Demo serving`; it remains demo-origin and does not count as the full user-created journey.

Suggested 90-second presentation sequence, not an implementation deadline:

- **0–8s:** Start in the live prefilled scene on the M4 Pro with the native helper connected and calibrated. Click `Enable laptop motion`/arm the move-glass mode, gently tilt or briefly move the laptop, then stop. Let the audience see the liquid continue moving and settle. No phone is needed.
- **8–20s:** Explain that this is a Somma-inspired Negroni among twelve Singapore cocktails. Show the canonical reference and expanded components.
- **20–48s:** Choose `Remix this drink`; pour from the three vessels, intentionally pause one pour, and resume. Stir and reverse direction so the effect of input is unmistakable.
- **48–67s:** Strain, express orange oil, and place/rotate the pepper. Show that the personal serving retains the chosen fill and placement.
- **67–77s:** Compare `Your studio remix` with the bar's presentation and return to the atlas.
- **77–90s:** Show verified evidence of how Astra helped inspect, implement, or refine the work. Attribute runtime physics to the implemented TypeGPU system accurately.

Keep connection status visible for the demonstrator, provide instant local takeover, and rehearse the sequence with the actual deployed revision. Preserve time for the initial stop-and-settle moment; it is the clearest demonstration of live physical response. The separate full walkthrough remains required verification even when the presentation starts from a preset.

## 14. References

- Codex Goals: https://developers.openai.com/cookbook/examples/codex/using_goals_in_codex — outcome, verification, constraints, boundaries, iteration policy, and an evidenced blocked condition.
- TypeGPU source/documentation entry: https://github.com/software-mansion/TypeGPU
- Phone-motion jelly clip: https://x.com/iwoplaza/status/2096991656574623864
- Jelly-control clip: https://x.com/iwoplaza/status/2096623897718264233
- Native sensor starting point: https://github.com/olvvier/apple-silicon-accelerometer — undocumented macOS SPU/IOKit access; inspect current requirements and pin the adopted revision. Its documented M3 Pro test is not an M4 Pro guarantee.
- Native reader API/source: https://github.com/olvvier/apple-silicon-accelerometer/blob/main/macimu/__init__.py — inspect availability checks and required reader privilege.
- M4-family downstream report: https://github.com/taigrr/spank/issues/2 — reports readings followed by a stall; maintainer states it was solved in v1.1.2. This is community evidence for investigating the route, not a test of this owner's M4 Pro.
- Browser device motion, for the optional phone path: https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent
- Original cocktail reference post: https://www.instagram.com/p/DdLFBKQBUkU/ — prefer the repository’s supplied video and matching image for direct inspection.

The TypeGPU clips demonstrate an attractive motion-responsive jelly control. They do not establish a liquid solver, laptop accelerometer support, or compatibility with this repo’s current rendering stack. Verify each required capability through implementation evidence.
