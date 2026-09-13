# Public continuous-player release

Production revision: `ebc0579a680bb07a84fc0248ac8ea62b268d7541`.
Deployment: `dpl_bgDMz7FxWa4NeMizZzvrkDeqn35v`, READY on 13 September 2026.
Public site: https://spiritatlas-one.vercel.app .
Immutable URL: https://spiritatlas-3gi4aba6y-ilham-firdausi-putras-projects.vercel.app .

Remote main was fast-forwarded from 058149b, preserving acceptance evidence 72ad1bb,
the continuous animation/copy refinement 59e46a8, and the companion native setup
correction 5fa5544. Release ownership was explicitly handed to animation task
01a09941-8825-7fd1-8d44-58f92994d715. The shared checkout's later uncommitted
work was not staged, reset or included in this deployment.

## Public verification

- All five affected landing checks pass: 1440px and 390px composition, full
  forward/reverse/forward playback, lazy rotation with live turnarounds, and
  blocked-autoplay recovery. See results.json.
- All three studio checks pass: full preparation/serving/comparison, keeping
  native pairing when reopening setup or pressing Escape, and desktop/mobile
  unpaired guidance. See studio-results.json. These protocol fixture checks
  do not represent physical laptop movement or clear older physical gates.
- Public mobile WebKit 390×844 passes actual composed-frame changes, full
  reversal/restart, pause and reduced motion. The requested extra player text
  is absent, there is no horizontal overflow, padding is 20px and buttons are
  44px. See webkit-verification.json and webkit-player-390.png.
- The public entry and studio JavaScript have matching local-build SHA-256
  hashes. The entry is /assets/index-CFuTJmu9.js. See deployment.json for the
  alias, immutable deployment, hashes and exact source revision.
- All browser sessions were closed after verification. Native hardware
  observations remain the responsibility of their separate task and must
  identify the loaded application revision.

The pre-deployment and READY coordination notices were requested through the
app connector, but acknowledgments timed out. This record provides the exact
revision and entry asset for ongoing native-motion work. No further production
push is part of this acceptance-evidence commit; evidence is saved on the
release branch while main remains at the verified application revision.
