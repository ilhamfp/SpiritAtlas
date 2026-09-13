# SpiritAtlas production release ownership

## Ownership transfer

The landing-page task `01a098ee-7e22-79e2-b78c-772904e83ecb` is finishing the user-requested history cleanup and main-branch push. After it confirms the final main revision to task `01a09932-8b72-79f2-a6f9-2322aaaa28a5`, **Behind the Bar becomes the single production release owner**. The landing task will perform no further production deployments after that confirmation.

## Integration state

- Public application URL: https://spiritatlas-one.vercel.app.
- Remote Classic Negroni revision `6e6effd36ced519a16e647f8feb0435dff1eff88` is preserved alongside the pending landing spacing and link fixes. The merge commit containing this ledger identifies their integrated revision.
- The previous BBF landing deployment `dpl_AwYcJx4BAHWSHZ1WBMBaMtqGQ9kf` was built from `87c9eca`; production changed to the Classic Negroni feature during its last browser run. Its evidence is historical and does not certify the integrated Classic homepage.
- Current integration checks and their scope are recorded in `docs/brand-implementation.md` and `docs/brand-evidence/integration-local/`.
- Behind the Bar remains isolated in `codex/behind-the-bar-v21`; no feature revision has been supplied for integration and no combined feature release has been verified.

The receiving owner must integrate its feature against the confirmed final main revision, preserve the Classic homepage and existing atlas behavior, and verify the combined production release under its PRD. Transfer of ownership does not claim that its feature is ready for production.
