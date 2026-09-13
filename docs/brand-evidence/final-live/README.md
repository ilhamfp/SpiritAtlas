# Final mobile live-scene probe

The accepted public application passed one fresh 390×844 touch/reduced-motion case after the final compositor fix. `results.json` retains focus styling, control bounds, loading-state bounds, canvas hashes proving actual keyboard/touch camera changes and expansion/reassembly, settled frame counters, and zero browser/request errors. The four screenshots show focus, loading, assembled and expanded states.

`probe.mjs` is the executed probe with portable import/output paths. Run it from the project with installed dependencies; it writes a new `verify-live/` directory unless `ATLAS_LIVE_EVIDENCE` selects another path. The recorded application is `b52c971` (formerly `2807652`), served by the public alias with identical checked resource hashes.
