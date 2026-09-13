# M4 Pro native preflight

13 September 2026. Actual machine: MacBook Pro Mac16,8, Apple M4 Pro (12 CPU / 16 GPU cores), 24 GB; macOS 26.3 build 25D125; arm64. Chrome 153.0.8010.37 and Safari 26.3 installed. No identifiers retained in evidence.

## Sensor findings

- `IMU.available()` from upstream revision `203685640287449eaecf521c24d1f5e52486ecb7` returned true without elevation.
- Upstream macimu 0.2.0 is MIT, zero runtime dependencies. Its Python entry point explicitly rejects non-root callers. Source uses ctypes IOKit, global shared memory and optional orientation threads.
- Adopted a smaller C sensor reader based on that pinned report format, with upstream license retained. Only acceleration/gyro are opened. It has no network, stdin commands, installation service or persistence. Build is unprivileged.
- **Actual successful read without elevation:** both sensors opened and emitted 398 real reports over 2 seconds as uid 501. Therefore elevation is not required on this OS/machine. `sudo -n true` separately returned `a password is required`; no sudo authorization or bypass was used. The Python library's root guard is not evidence that this direct reader requires root here.
- Initial acceleration is approximately `[0.011, 0.013, -0.980] g`; gyro near `[0.025, 0.008, 0.112] deg/s`. Reader decimates by 8; measured rate approximately 100.6 Hz per sensor. The completed continuity capture is summarized below.
- Rest / deliberate tilt / translation / return-to-rest phase labels and axis verification are pending owner movement. Unlabelled samples cannot certify those actions.

## Reproduce

From the feature checkout: `./tools/mac-motion/build.sh`, then `./tools/mac-motion/.build/btb-motion-reader --seconds 30 > /tmp/btb-motion.ndjson`.

A default run lasts 30 seconds; max 7200 seconds. Ctrl-C stops and closes devices. `--presence` only enumerates inertial sensor presence. Errors distinguish unavailable/open failure/no reports. Build with Xcode command-line tools (`xcrun clang`). Root is not requested unless the target OS actually rejects opening; browser/build/bridge stay unprivileged.

## Implemented protocol and calibration

Raw 22-byte reports: signed little-endian int32 at offsets 6/10/14 divided by 65536. Acceleration includes gravity in g; gyro in deg/s. Hardware mach_absolute_time converted to seconds. Sequence increases per received decimated report. No synthetic mode in native reader. Browser receipt monotonic time governs 250 ms expiry. Normalization converts g to m/s² and deg/s to rad/s; gravity removed once using filtered orientation, neutral calibration and gyro bias.

## Outstanding checks

Named physical motion phases and axes, deliberate deployed tilt-pour/settle rehearsal, and physical movement-onset latency. Final-scene FPS and actual deployed stale/focus/helper-restart recovery have passed. WebGPU and initial authenticated transport are separately verified below. BTB-06 is not passed by the successful reader alone.

## 300-second continuity capture

30,189 samples per sensor over 300.016 seconds: **100.6213 Hz**, largest inter-sample gap **9.940 ms**, no stall. Compressed raw samples are `evidence/native-preflight-stream.ndjson.gz`; summary is `evidence/native-preflight-summary.json`. Acceleration varied across x −.173 to +.144 g, y −.120 to +.269 g, z −1.060 to −.905 g. These are real variations, but lack confirmed phase labels and are not claimed as a completed deliberate-tilt test.

## Browser/transport preflight

Ordinary headful installed Chrome 153, no custom security flags, no programmatic permission grant: authenticated fetch to 127.0.0.1:19876 from **https://spiritatlas-one.vercel.app** returned HTTP 200 with live reader samples. Bridge and reader ran as uid 501. Evidence: `production-loopback-probe.json`. `navigator.gpu` was present; the studio separately acquired an Apple / metal-3 adapter and executed TypeGPU dispatches/readbacks. This transport check preceded feature deployment, so it is not final BTB-12 evidence.

## Transport negative checks and timestamp alignment

The running native bridge returned 401 for missing/wrong authorization, 403 for an untrusted Origin, 200 for the intended authenticated origin, and 409 for a second simultaneous motion subscriber (`evidence/bridge-protocol.json`). No permission changes or security flags were used. The new packet timestamp mapping compares HID hardware monotonic time with Node `hrtime`; on this actual Mac the first read arrived 2.20 ms after its hardware timestamp on the same timebase. This enables a separately labelled sample-to-render estimate. It does not prove deliberate physical movement or undocumented sensor-internal latency.

## Normal-browser verification correction

Early automated probes used Playwright launch defaults; those results alone were insufficient to establish ordinary focus/permission behavior. The final transport probe now launches installed Chrome with only a temporary profile, local debugging and window-size arguments, then attaches with `noDefaults: true`. No sandbox, HTTPS, certificate, permission, focus or background-throttling override is set. The normal Chrome HTTPS-origin status check returned 200 with live uid 501 reader samples. Its exact sanitized launch arguments are recorded in `production-loopback-probe.json`. A short first attempt timed out while the request was pending; the 60-second retry completed normally.

Actual-reader pause/resume, real tab focus loss, neutral no-pour, source takeover and helper restart all passed in that same normal-browser setup against the local preview (`preview-native-recovery.json`). The first focus test failed because Playwright's default focus emulation kept the original page active; switching to a normal browser resolved the test without changing or weakening application behavior. Final deployed native recovery passed on 772c3e2. Physical rehearsal remains outstanding. A longer native recording exposed coalesced-chunk framing; corrected real-sensor recovery then passed all six checks against the final public 058149b deployment, including coalesced-report recovery.

## Production measurements and remaining owner action

Verified production 058149b / dpl_4uKgScSzwN8PVnwb92GWZWqPufND: normal installed Chrome, actual 1263×855 CSS-pixel scene, device DPR 2 capped to 1.5 rendering. Thirty-second active stirring averaged 119.63 FPS, p95 9.30 ms; 30 FPS release floor and 60 FPS target both pass. No GPU errors.

The earlier 772c3e2 real 120-second sensor session captured 4595 accepted reports and 364 native→GPU→next-frame timing observations before disarming. Sample-timestamp→frame estimate: p50 26.56 ms, p95 32.36 ms, max 218.06 ms. Browser-receipt→frame: p50 20.60 ms, p95 23.70 ms, max 211.80 ms. Receiver processing p95 0.10 ms. These are distributions with outliers, not an all-samples <100 ms claim. Native applied tilt stayed under 0.002 rad while armed; this is not a physical-onset measurement. Later local pouring does not establish native tilt-pour. See production-native-summary.json and the actual screen recording.

The stream disconnected at 69.7 seconds after browser delivery coalesced complete records into a large chunk. The parser correction bounds unfinished records, retains 250 ms freshness, and aborts malformed streams. Its actual-reader preview and final public tests deliberately stalled the page 2.5 seconds, then observed fresh-report recovery with motion disarmed. This stress interval is excluded from latency/performance claims.

Run locally as the ordinary owner, using the reviewed release checkout:

```sh
cd /Users/ilhamfirdausiputra/dev/SpiritAtlas-btb-release
./tools/mac-motion/build.sh
node tools/mac-motion/bridge.mjs
```

Open http://127.0.0.1:19876/pair and choose **Pair with SpiritAtlas**. Production diagnostic URL: https://spiritatlas-one.vercel.app/behind-the-bar/diagnostics?preset=stir-demo . Use normal Chrome local-network permission if prompted. Never paste the temporary credential into a message, command log or evidence file.

For a recorded owner-driven session, keep the helper running and use another terminal:

```sh
cd /Users/ilhamfirdausiputra/dev/SpiritAtlas-btb-release
BTB_URL=https://spiritatlas-one.vercel.app BTB_MANUAL_ARM=1 BTB_ARM_WAIT_SECONDS=120 BTB_EVIDENCE=owner-physical BTB_SECONDS=60 node scripts/btb-native-session.mjs
```

1. Set the laptop flat; the script waits for real samples and recenters. Click **Arm movement** last and keep that Chrome window focused.
2. Gently tilt left/right, then forward/back; briefly move and set flat. Confirm the displayed axes and let the residual waves settle.
3. Choose **Strain**, click **Arm pour**, tilt briefly, then set flat and disarm. Verify a partial serving remains while mixing ice is retained.
4. Record/confirm the physical action phases. For physical-onset latency, use synchronized instrumentation or a camera showing both device movement and display; screen recording alone does not show when external movement started.
5. Ctrl-C stops the helper. A restart requires fresh pairing and calibration; no silent rearm. The full automated actual-reader recovery script is `BTB_URL=https://spiritatlas-one.vercel.app node scripts/btb-native-recovery.mjs`.

The owner did not arm the latest 120-second manual prompt. This is an outstanding physical action, not a missing sensor or elevated-permission requirement.

## Final corrected production native record

Against 058149b / dpl_4uKgScSzwN8PVnwb92GWZWqPufND, a 10-second normal-Chrome session recorded 601 timestamped sample→GPU→frame observations. All 709 accepted reports at capture end were valid, with zero rejections and no GPU errors; connection and calibration remained live. Sample→frame estimate: p50 27.73 ms, p95 34.25 ms, max 40.87 ms. Browser receipt→frame: p50 21.20 ms, p95 23.80 ms, max 30.20 ms. Receiver processing p95 0.10 ms. See corrected-production-native-session.json, corrected-production-native-summary.json and native-video/corrected-production-native.webm.

This was an at-rest stream, explicitly armed by the diagnostic script. Maximum applied angle was 0.001253 rad; no deliberate physical tilt-pour or physical movement onset is claimed. The initial 120-second recording and its outliers/disconnection remain preserved rather than overwritten.


## Owner-operated native stirring and pouring — 13 September 2026

The owner confirmed the earlier glass-movement mode worked on ebc0579 but requested stirring instead. The corrective native-stir source daef85b is now in public 9c0666c / dpl_7hZdxewXrX9aVWpZH9NWEGsKygKw. Ordinary Chrome with its original security and focus behavior was freshly paired and calibrated against the actual unprivileged HID bridge. The pairing attempt that only changed a URL fragment retained the old document; a full navigation fixed the diagnostic setup, and the repeated-rehearsal script now forces a fresh document using a unique query.

Passive video and 896 state observations captured the owner arming Stir for 17.093 seconds: real laptop angular motion moved the spoon and GPU liquid, reversed direction, then stopped. Glass tilt remained zero in this mode. The owner then changed to Strain and deliberately armed pour for 9.601 seconds. Neutral pauses stopped input; final serving retained 0.65 Core, 0.18 Ancho and 0.10 Rice, within floating-point tolerance. There were no GPU errors. Ten native reports were rejected during the complete capture; individual rejection reasons were not logged. Connection and calibration were live at capture end without silent arming. This supersedes the earlier lack of deliberate physical-pour evidence. See native-stir-owner-summary.json, native-stir-owner.json and native-video/native-stir-owner.webm.

The session yielded 1,601 applied native timing observations: sample→frame estimate p95 35.04 ms / max 104.02 ms, receipt→frame p95 23.70 ms / max 97.20 ms. Separate normal-Chrome 30-second pointer-stirring runtime on this exact public build measured 119.07 FPS and 9.30 ms p95; both the 30 FPS release floor and 60 FPS target pass. Physical movement-onset → displayed photons remains unmeasured and is not interchangeable with either timestamp estimate.

## Session duration follow-up — 13 September 2026

The user requested longer pairing sessions after the temporary helper stopped at 20 minutes. Revision f059d18 changes the default bridge and reader lifetime to 8 hours, configurable by BTB_SESSION_HOURS from 1 to 24 whole hours. The reader is rebuilt on the actual M4 Pro and reports two sensors; the source-format provenance and unprivileged sensor access are unchanged. The browser accepts the same bounded expiry while preserving 250 ms freshness and explicit arming. Exact public deployment, browser-fixture checks and sanitized real-helper health are under evidence/long-session/. Current session expiry is 14 September 2026 at 00:14:51 Singapore; /pair and authenticated /status return 200 with live reports. This is real helper health evidence, not new physical movement-onset timing.
