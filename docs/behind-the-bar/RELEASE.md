# SpiritAtlas production release ownership

## Acknowledged owner

**Behind the Bar task `01a09932-8b72-79f2-a6f9-2322aaaa28a5` is the single production release owner.** Landing task `01a098ee-7e22-79e2-b78c-772904e83ecb` explicitly transferred ownership after pushing `bc4f0173d494a8b2a97c01664ad69576aa524dc0`; this task acknowledged the transfer. Landing task performs read-only production checks and sends any fixes for integration. No independent competing production deployment is planned.

## Revisions

- Initial landing / Classic integration baseline: `bc4f0173d494a8b2a97c01664ad69576aa524dc0`, preserving Classic source `6e6effd` plus final landing fixes.
- Initial reviewable feature revision: `05901c1` on `codex/behind-the-bar-v21`.
- First combined merge: `0bd20d2` (feature + identified landing baseline), in `/Users/ilhamfirdausiputra/dev/SpiritAtlas-btb`.
- Latest colleague fix: `2807652c4a82f93851a280ab9191ce1c68ef85a7`, cinematic frame visibility, preserved.
- Combined feature code revision: `ba857f10e68e334e076faa57ee8d419c2d027868` (merge of feature `33abbcd` with `2807652`).
- Landing-only release applied by owner: `5c9bcbe`, `dpl_4b6vTZvnn2JMtSN37yrnxvdSqyAE`. A later colleague push of `2807652` produced current baseline `dpl_9fenqtE46JZBHSUm3pCTxz47haEp` at https://spiritatlas-one.vercel.app. The owner is preserving that fix and holding further changes until its fresh public audit finishes.
- Reviewable feature preview: `33abbcd`, `dpl_He24REpzpE1TjRr6CcdBH3ZgT8v3`, https://spiritatlas-hp6k7tzlr-ilham-firdausi-putras-projects.vercel.app. Vercel login protection is active; this is not public-production proof.
- Combined production deployment: pending current landing audit completion and final release.

## Verification

Sixteen studio checks passed against built preview. Thirty-nine existing catalogue checks passed. The final colleague change built successfully and all four current Classic integration regressions plus eleven asset/playback unit checks passed. The 30-second headful M4 Pro preview measured 119.4 FPS average and 9.2 ms p95, passing the 30 FPS floor and 60 FPS target separately. Actual native sensor access, initial production HTTPS-origin status and bridge authorization rejection were verified. Final public journey and deployed native movement remain outstanding; STATUS.md retains that distinction.

The release owner will fast-forward shared main without staging or altering the landing task's documentation edits. Changes to the public alias are paused until that task acknowledges the current baseline audit is complete. The mandatory final physical M4 Pro rehearsal remains separate from browser fixture and model checks.

## Clean-history integration

Main history was recreated by the separately authorized cleanup task and force-pushed as `e13da8e8b3c91fa257a2f25f68356668a2bb28ff`. The feature was ported as a content-only binary diff into a new worktree `/Users/ilhamfirdausiputra/dev/SpiritAtlas-btb-release`, branch `codex/behind-the-bar-release`, based on that exact clean main. No old ancestor was merged. Historical hashes above describe earlier evidence/deployments, not release ancestry. The source port matched the tested studio code; the final held-key blur fix and incoming landing refinement will receive focused checks before release.

## Ready to publish

The clean integration includes feature `74882a6`, the authorized PRD, autoplay refinement `84a6f93`, and final landing evidence `37a1759`. The landing task explicitly released its final audit hold; this task again owns the production window. A later unified-player request is being developed separately in shared main; its uncommitted edits are preserved and are not overwritten by this release. Production will be pushed from `codex/behind-the-bar-release` to remote main without mutating that shared working tree. The final feature test glob is scoped to filenames, avoiding accidental discovery caused by the worktree name.
