# Behind the Bar v2.1 acceptance ledger

In progress, 13 September 2026. Isolated branch `codex/behind-the-bar-v21`. This task is the acknowledged sole production release owner after explicit transfer from the landing task. Main landing revision `5c9bcbe` is integrated in the feature branch. No physical-motion gate is claimed from synthetic fixtures.

| Gate | State | Evidence / remaining verification |
|---|---|---|
| BTB-01 identity | Preview verified | Separate authored definition and provenance; canonical data unchanged; content contract passed |
| BTB-02 flexible preparation | Preview verified | Three-vessel full journey, two keyboard omission/amount variants, partial strain, empty serving guard |
| BTB-03 TypeGPU | Preview verified | Real M4 Pro GPU buffers, reversal/release/settle video and probes; repeat on production |
| BTB-04 conservation | Preview verified | Per-component cap/exhaustion/transit tests and retained mixture/ice; final containment capture pending |
| BTB-05 controls | Preview verified | Complete pointer, keyboard and emulated-touch journeys; unsupported WebGPU fallback passed |
| BTB-06 actual M4 Pro | In progress | Actual unprivileged sensor stream and HTTPS transport established; labelled physical deployed movement/rehearsal still required |
| BTB-07 fidelity/result | Preview verified | Baseline full-serving/reference inspected; improved red-orange tint, canonical glass/ice/pepper retained; distinct player results preserved |
| BTB-08 reliability | Preview verified | Reset, stale data, source/stage takeover, reconnect disarming, asset retry and bounded tilt passed; final public native recovery remains |
| BTB-09 responsive/a11y | Preview verified | Desktop/tablet/phone captures, keyboard completion, reduced-motion touch and mute controls |
| BTB-10 performance | Pending | Final headful 30-second scene and native latency measurements |
| BTB-11 preservation | Preview verified | All 39 existing tests pass; Classic 5c9bcbe integrated, affected checks to repeat |
| BTB-12 production | Pending | Acknowledged owner; landing fix deployed separately, integrated feature not yet public |
| BTB-13 cause/effect | Preview verified | Pointer first gesture/reversal; stationary pointer fix; two amount/garnish variants. Agent inspection, not a human study |
| BTB-14 live preset | Preview verified | Valid same-solver demo, actual response/reset, demo-origin service, start-empty conversion |

## Iteration record

1. Read PRD/app/brand/reference source and asset metadata. Largest initial risk: native M4 Pro sensor support. Inspected pinned macimu, created minimal C reader. Two sensors return real readings without root. Long capture begun; owner invited to perform labelled gentle movement. Next largest gap: visible live preview and measured GPU response.

2. TypeGPU's 0.12 API rejected direct JS access to layout values; corrected to build-transformed `use gpu` compute with pinned unplugin-typegpu 0.12.3. Actual Chrome/M4 Pro execution now returns GPU state. First capture exposed disappearing nested transmission; implemented separate ice, liquid and outer-glass render captures on the same WebGPU device. Corrected inverted dynamic-fluid face winding. No GPU errors in the latest capture.
3. Five state tests passed: partial/omission serving, retained mixture, per-component source/capacity accounting, legal demo initialization/reset, readiness, invalid intents. Actual pointer GPU probe: circulation 0 → +7.73 → −7.80; release −5.57, settled −0.030 after 4 seconds. GPU energy declined 60.8 → 0.000925. Source recording saved in evidence/video/. Visual/UI journey tests in progress.
4. Loopback status successfully fetched from https://spiritatlas-one.vercel.app in ordinary headful Chrome 153 on this M4 Pro, no security flags or permission override. Unprivileged bridge uid 501, authenticated CORS, 20-minute token lifetime, loopback bind, bounded stream, one subscriber. Evidence: production-loopback-probe.json. This is transport proof, not completed feature deployment or physical-motion rehearsal.

5. Full browser journey exposed a rotation-slider step mismatch (±π bounds with .01 steps); changed bounds to ±3.14 so keyboard/range values have a valid step base. GPU readiness was announced before its first optical pipelines finished compiling; now only announces after actual rendered frames and successful GPU readback. Concurrent headful browser use can intentionally trigger blur disarming, so behavioral repeats use headless Chrome while landing audit uses the foreground; release performance and physical demonstrations remain headful-only measurements.

Release ownership transferred explicitly from landing task and acknowledged, against main `bc4f0173d494a8b2a97c01664ad69576aa524dc0`. Classic homepage retained for upcoming merge. Git integration deployed that main revision as `dpl_2wmqnZPCcrmew1UUL8tN3jKFXhHk`; it is not a Behind the Bar deployment.

6. All 39 existing catalogue checks passed against the integrated preview. Concurrent landing audit found that unanchored `.vercelignore` excluded public reference photos in production; accepted fix `520d446`, alongside Classic refinements `5c9bcbe`. Sole owner pushed that landing-only release first, deployment `dpl_4b6vTZvnn2JMtSN37yrnxvdSqyAE`, to close the independent public regression.
7. Thirteen studio checks passed, including two complete keyboard amount/garnish variants, a reduced-motion touch journey, fallback rendering, and a stationary held pointer. Largest remaining behavior defect was stale pointer torque; fixed with a short movement-refreshed pulse. Added visible native arm/disarm toolbar above the live glass. Added resource cleanup/retry and keyboard tilt, and began final bounded-tilt/baseline tests.

8. Sixteen integrated studio checks passed (`preview-full-suite.json`): bounded sustained tilt and return-to-rest, camera reset, failed-asset retry without ledger loss, baseline demo transfer and explicit demo-origin serving. Baseline/reference side-by-side inspection found amber liquid insufficiently red; strengthened the absorption tint, preserving component-dependent color. Rebuilt and repeated baseline transfer successfully. Current screen-space optics approximate thick glass and clear ice; no offline rendering or canonical-result substitution is used.

9. Actual headful M4 Pro preview (1440×1000 viewport, DPR 2 capped to 1.5 rendering, 1263×855 canvas): 30-second active stirring averaged 119.42 FPS, p95 9.20 ms, no GPU errors. Both release floor and target passed (`preview-performance.json`). New upstream colleague fix `2807652` arrived independently during the landing audit; merged as `ba857f1`, rebuilt, all four updated Classic regressions and eleven unit checks passed. Production is held for the independent landing audit to complete.
10. Actual native stream connected and calibrated in the final local preview for an eight-second diagnostic: 485 timestamped native → GPU → frame samples, p95 sample-to-frame estimate 33.20 ms, receiver-to-frame 23.70 ms, no rejected reports or GPU errors. This was mostly at rest, not a substitute for physical axis/tilt-pour rehearsal. Raw real sensor values and sanitized state are `preview-native-session.json`.

11. Corrected verification harness: Playwright's defaults emulate tab focus and apply browser startup flags. Replaced final native/performance launch with a private installed-Chrome session using normal browser defaults and CDP `noDefaults: true`. Real reader pause/resume, actual hidden-tab disarm, neutral no-pour, source disarm and real helper restart all passed. The corrected normal-browser production HTTPS status probe returned 200. Earlier automated results remain labelled; no security/permission bypass was used to obtain the corrected result.
