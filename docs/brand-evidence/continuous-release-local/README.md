# Combined release checks

The isolated release preserves production 058149b and acceptance evidence
72ad1bb. The animation change e8eed19 is applied as 59e46a8, and the native
setup fix e8bee8f is applied as 5fa5544. Shared main and its untracked files
were not reset or merged.

The five affected landing checks pass against the combined application at
http://127.0.0.1:4177: mobile composition, a complete forward/reverse/forward
cycle, lazy rotation with live turnarounds, failed reverse preload recovery,
and delayed automatic reversal recovery. See results.json. This supplements
the source change's 24 Chromium checks, 12 unit/asset checks and four WebKit sizes.

After the companion setup fix, the final combined build passes and three
studio checks pass: the complete preparation/serving/comparison flow, retained
pairing when opening setup or pressing Escape, and desktop/mobile unpaired
setup. See studio-results.json and studio/. Protocol fixture checks are not
physical-laptop movement acceptance. Existing physical acceptance limits stay
attributed to their recorded revision in the Behind the Bar release ledger.
