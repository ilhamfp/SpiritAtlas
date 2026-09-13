# GitHub push verification

Verified on 13 September 2026 against the production build served locally on port 4184.

- `npm run build`: passed, including TypeScript checking. The existing large Three.js bundle advisory remains.
- Brand browser journeys: 10/10 passed, covering desktop/tablet/phone layouts, navigation, model loading, orbit, ingredient expansion, comparison, touch, reduced motion and WebGL fallback.
- Content and authored geometry checks: 8/8 passed. The previously absent Blender sources are included in this commit.

The initial production-preview browser run exposed a missing favicon, which caused a 404 in the runtime-error checks. Added `public/favicon.svg` and an explicit icon link in `index.html`; all ten journeys passed after rebuilding. No functional assertions were weakened.

Verification used `tests/brand.config.ts` with `ATLAS_BRAND_URL=http://127.0.0.1:4184`. Content checks selected `content-contract.spec.ts` and `new-collection-content.spec.ts` with `ATLAS_BRAND_EXISTING=1`. Raw results remain locally under ignored `qa/interaction-artifacts/prepush-fixed/` and `qa/interaction-artifacts/prepush-content/`.

The local pre-push run artifacts are ignored; committed project evidence includes screenshots, results and diagnostic browser traces. This verification did not deploy the site.
