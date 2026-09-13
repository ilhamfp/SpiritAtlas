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

Named physical motion phases and axes; final deployed arming/tilt-pour/settle/recovery rehearsal; actual physical input latency and final-scene FPS. WebGPU and initial authenticated transport are separately verified below. BTB-06 is not passed by the successful reader alone.

## 300-second continuity capture

30,189 samples per sensor over 300.016 seconds: **100.6213 Hz**, largest inter-sample gap **9.940 ms**, no stall. Compressed raw samples are `evidence/native-preflight-stream.ndjson.gz`; summary is `evidence/native-preflight-summary.json`. Acceleration varied across x −.173 to +.144 g, y −.120 to +.269 g, z −1.060 to −.905 g. These are real variations, but lack confirmed phase labels and are not claimed as a completed deliberate-tilt test.

## Browser/transport preflight

Ordinary headful installed Chrome 153, no custom security flags, no programmatic permission grant: authenticated fetch to 127.0.0.1:19876 from **https://spiritatlas-one.vercel.app** returned HTTP 200 with live reader samples. Bridge and reader ran as uid 501. Evidence: `production-loopback-probe.json`. `navigator.gpu` was present; the studio separately acquired an Apple / metal-3 adapter and executed TypeGPU dispatches/readbacks. This transport check preceded feature deployment, so it is not final BTB-12 evidence.

## Transport negative checks and timestamp alignment

The running native bridge returned 401 for missing/wrong authorization, 403 for an untrusted Origin, 200 for the intended authenticated origin, and 409 for a second simultaneous motion subscriber (`evidence/bridge-protocol.json`). No permission changes or security flags were used. The new packet timestamp mapping compares HID hardware monotonic time with Node `hrtime`; on this actual Mac the first read arrived 2.20 ms after its hardware timestamp on the same timebase. This enables a separately labelled sample-to-render estimate. It does not prove deliberate physical movement or undocumented sensor-internal latency.

## Normal-browser verification correction

Early automated probes used Playwright launch defaults; those results alone were insufficient to establish ordinary focus/permission behavior. The final transport probe now launches installed Chrome with only a temporary profile, local debugging and window-size arguments, then attaches with `noDefaults: true`. No sandbox, HTTPS, certificate, permission, focus or background-throttling override is set. The normal Chrome HTTPS-origin status check returned 200 with live uid 501 reader samples. Its exact sanitized launch arguments are recorded in `production-loopback-probe.json`. A short first attempt timed out while the request was pending; the 60-second retry completed normally.

Actual-reader pause/resume, real tab focus loss, neutral no-pour, source takeover and helper restart all passed in that same normal-browser setup against the local preview (`preview-native-recovery.json`). The first focus test failed because Playwright's default focus emulation kept the original page active; switching to a normal browser resolved the test without changing or weakening application behavior. Final deployed native recovery and physical rehearsal remain outstanding.
