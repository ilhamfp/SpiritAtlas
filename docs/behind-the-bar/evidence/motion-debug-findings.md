# Owner motion debugging, 13 September 2026

The owner reported laptop movement had no effect during Mix/Stir at the public diagnostic URL. Production 058149b was already deployed. The local helper was not listening because it had been stopped after the previous acceptance run. Restarting it as uid 501 returned two live sensors with no rejected native reports. The bare production URL has no pairing credential and does not auto-pair.

A separate UI defect was confirmed in source and reproduced by regression: the footer always said Enable laptop motion but toggled setup off when already open. The diagnostic route opens setup automatically, so the label could cause an unintended disconnection. Escape also unmounted setup and discarded pairing/calibration. The exact owner action was not recorded, so this is not asserted as the sole cause of the original attempt.

Fix e8bee8f makes opening setup idempotent, labels the open state Motion setup, keeps pairing when Escape disarms, and exposes a disconnected Pair laptop state and calibration action beside the glass. The instructions distinguish physical tilt/slosh, pointer spoon stirring and separately armed pouring. Four focused browser checks and the build pass. Desktop/mobile captures were inspected. Core native freshness, arming and solver behavior are unchanged.

The temporary diagnostic instruction strip intercepted a footer recovery click. It now ignores pointer events. BTB_KEEP_BROWSER=1 leaves the diagnostic window open after recording/timeout. The initial 180-second prompt was not armed; it does not establish physical movement. The helper remains running for the owner's retry instead of being stopped during handoff.

Source fix was integrated by the release owner as 5fa5544 in combined revision ebc0579. Current deployment and final public verification will be recorded separately. Evidence: motion-setup-regression.json, motion-setup-1440.png, motion-setup-390.png, owner-debug-attempt.json.

The release owner published combined ebc0579 as dpl_bgDMz7FxWa4NeMizZzvrkDeqn35v. Both public setup regression cases pass. In normal Chrome, actual native pairing/calibration survived repeated Motion setup clicks and Escape; the fresh public entry asset is index-CFuTJmu9.js. Startup buffered samples were rejected during initial loading, while fresh reports established the calibrated connection. The paired window is intentionally left available, and a passive real-sensor recording is collecting the owner's attempt without injecting force or arming.

The keep-window diagnostic now starts its own Chrome process group before detaching. Its process was observed still listening after the launcher exited. This is a local harness lifecycle change, not a browser-security override or application deployment requirement.
