# SpiritAtlas MacBook motion

The public game needs no installation. This helper adds physical laptop movement on compatible Macs. Tested sensor access on the owner's Mac16,8 / Apple M4 Pro / macOS 26.3 is unprivileged; other OS/device combinations must be checked, not assumed.

```sh
./tools/mac-motion/build.sh
node tools/mac-motion/bridge.mjs
```

Open [local pairing](http://127.0.0.1:19876/pair) on the same machine, then choose **Pair with SpiritAtlas**. It opens the production diagnostic preview with a temporary credential in the URL fragment; the app immediately removes the fragment. After receiving a valid sensor sample, it remembers this pairing in session storage for the same tab until the helper’s original expiry. A refresh reconnects disarmed and needs calibration again; Disconnect forgets the pairing. Keep the local pairing page private. If the normal browser asks for local network access, allow the SpiritAtlas site. No TLS certificate or browser security override is needed on the verified Chrome 153 connection.

1. Set the laptop down. Wait for real samples, choose **Recenter at rest**.
2. During Stir, choose **Arm stirring**. Gently rock or turn the laptop: the spoon stirs and the glass stays upright. Reverse the gesture to reverse the stirring; hold still to let the liquid settle. Choose **Arm movement** separately to tilt the glass and slosh the liquid.
3. Choose **Disarm motion** or **Use local controls**. For ingredient or strain stages select **Arm pour** deliberately; neutral does not pour. Stage/source changes disarm.
4. Stop the helper with Ctrl-C. After 250 ms without new samples motion disarms. Restart and pair again; fresh data never silently rearms.

The helper automatically expires after 20 minutes. Only one browser may subscribe. If another browser owns the session, use that paired window or choose Disconnect there before pairing this one. No connection silently takes over another window. All networking binds to 127.0.0.1:19876; browser authorization uses a 256-bit token, exact allowed Origin and Host checks. Requests never execute commands. The native reader's stdout is bounded, validated and forwarded by an unprivileged Node process. Only new real inertial reports refresh the stream. Credentials live in ignored `.mac-motion/pair.json` with owner-only directory/file permissions. Do not copy that file into evidence.

For local development only:

```sh
BTB_DEV_ORIGIN=http://127.0.0.1:4190 node tools/mac-motion/bridge.mjs
```

`BTB_ORIGIN` optionally sets the one intended deployed HTTPS origin. Both are server-process values, never public bundle secrets. The checked production origin is https://spiritatlas-one.vercel.app. Run builds, browsers and bridge as your ordinary user.

## Diagnostics and code provenance

`./tools/mac-motion/.build/btb-motion-reader --presence` performs read-only sensor discovery. `--seconds 30` records real accel/gyro NDJSON to stdout. There is no native mock mode. Redirect samples to a private file if desired. Reader has no network, stdin commands, shared-memory publisher or daemon installation.

The 22-byte report format and SPU property setup are adapted from olvvier/apple-silicon-accelerometer revision `203685640287449eaecf521c24d1f5e52486ecb7`, MIT; full license in LICENSE.macimu. Upstream Python macimu 0.2.0 has a root guard, but this C reader demonstrably opens and reads sensors as uid 501 on the target machine. It requests no elevation. If sensor opening fails on another machine, preserve the error and determine actual OS requirements through normal authorization; do not disable protections.

Hardware timestamps order samples. Units are g (including gravity) and deg/s. Browser converts to m/s² and rad/s, removes estimated gravity once, calibrates neutral and gyro bias at rest, clamps inputs, and uses receiver monotonic arrival time for freshness. Axis/sign validation during deliberate physical movement and end-to-end production rehearsal remain separate required evidence; see MACBOOK-PREFLIGHT.md.
