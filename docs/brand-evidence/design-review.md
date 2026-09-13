# SpiritAtlas independent design review

Review date: 2026-09-13. Scope: supplied local hero screenshots and implemented landing/decoration styles. This is not a deployment or complete user-journey certification.

## Persistence

`DESIGN.md` and `PRODUCT.md` now describe SpiritAtlas and the pinned brand kit. The design sidecar was refreshed with the actual palette, font roles, controls, focus, and motion. Applicable map, viewer, ingredient-evidence, comparison, recovery, and route behavior from the previous documents is preserved. Old Bodoni/Manrope and vermilion rules are explicitly superseded; old QA measurements are not represented as fresh evidence.

Reviewed code: `src/Landing.tsx`, `src/brand.css`, `src/components/Marble.tsx`, shared brand overrides in `src/styles.css`, relevant active viewer styles and camera/optics implementation. Brand references and the BBF photographic crop at `public/references/bbf-negroni.png` were visually inspected.

Preserved evidence:

| Local capture | Size | Review state |
| --- | --- | --- |
| `design-review-desktop-local.png` | 1440×1000 | Latest supplied 12:30 capture after neutral lighting and transparent glass-shell changes |
| `design-review-mobile-local.png` | 390×844 | Latest supplied 12:30 capture after lighting, utility-size, and touch-target changes |
| `design-review-tablet-local.png` | 768×1024 | Earlier 12:22 composition capture; predates the final optical and utility changes |

The screenshots preserve the local evidence rather than relying on temporary files that can be overwritten.

## Fidelity

| Element | Finding | Evidence |
| --- | --- | --- |
| TYPE | Match to the pinned SpiritAtlas direction | Large, regular/medium Instrument Sans headline; controlled three-line break; brief mono indices; source imports real font files. Final production font-loading verification remains separate. |
| MATERIAL | Match for the decorative signature | Visible broad directional orange folds, peach pools, and dark channels; smooth interiors remain beside square-grid edge regions. Generated assets are present and legible in the actual frames. |
| Headline and primary action | Match | Exact “Singapore’s cocktails. Inside out.” promise, prominent orange CTA with dark text, substantial negative space. |
| Desktop hierarchy | Match | Left editorial promise and right real-time drink form an asymmetric composition; header and caption remain subordinate. |
| Mobile composition | Intentional adaptation | Headline, action, and drink stack as the objective requires. Side/lower portrait ribbons frame a complete glass without passing over headline copy. |
| Square dissolution | Match | Small axis-aligned squares show sparse and dense coverage. Code uses a fixed 5-CSS-pixel Bayer lattice with no changing seed or ambient animation. |
| Crisp interface layers | Match | Caption and controls sit on calm charcoal; typography remains unaffected by the decorative mask. |
| BBF identity | Preserved with revised optics | Rounded orange garnish, dark red/brown liquid, straight rocks glass, and substantial base remain. Recheck below records the specific optical corrections. |
| Required onward routes | Present in source; journey test pending | Primary CTA, three bar entries, explicit ingredient actions, all-three comparison, and home/atlas links exist. Source inspection is not a successful browser journey. |

## Review limits

The local frames show the first viewport. Continuation content was reviewed in source, not through a fresh full-page capture. This pass does not establish production behavior, post-fix tablet optics, expanded-label positioning, loaded secondary posters, screenshot stability during loading, focus behavior, or absence of runtime/network errors. Those remain in the coordinating agent's final verification scope.

No arbitrary visual score is used. The supplied direction already fixes typography, palette, original artwork, and composition intent; no new concept approval is needed for these review corrections.

## Findings and recheck

1. **Blue ice edge and opaque-looking base — resolved for the identified local defect.** Earlier frames rendered the ice with a cool blue cast and the base as a pale, flat band. The newer desktop/mobile frames remove that blue and visibly transmit the underlying orange art through the lower clear shell. The drink keeps its observed identity. This is a targeted visual finding, not a claim of pixel-identical optical reconstruction.
2. **Undersized touch controls — corrected in source and visibly enlarged.** The earlier mobile zoom buttons were 36×36px, with 40px-wide rotation buttons. Higher-specificity final brand rules give both 44×44px minimum targets. The latest mobile frame shows the larger zoom controls. Final touch journeys remain to be exercised.
3. **Undersized metadata — corrected in source and visible caption.** Earlier 9–10px index exceptions contradicted the kit's 11–12px utility scale. Final overrides use 11px for those indices and coordinates and 12px for hero ingredient labels. The latest mobile caption is larger. Expanded annotations still need a final expanded-view capture.
4. **Suspected font drift — not an active defect.** The old `.viewer button` Manrope selector does not identify the current `.cocktail-viewer` root; active labels inherit the Instrument Sans interface. No font mismatch was inferred from an unused selector.

No additional material composition defect was identified in the reviewed updated desktop/mobile first viewports. The earlier tablet frame establishes its responsive layout only; it is not post-fix evidence. The loading/poster work and all-three secondary images are coordinated changes, not newly discovered missing assets.

## Keep and final verification

Keep the large simple typography, dark labels on orange actions, generous dark space, bright directional marbling with partial square coverage, and separate live drink layer. Do not restore 9px labels, undersized touch controls, blue optical tint, or opaque-looking hero glass in later changes.

Before overall completion, capture the deployed site at all three required viewports; test CTA, three bar entries, expansion/collapse, orbit, comparison, return paths, keyboard, touch, reduced motion, WebGL fallback, loading, and direct navigation/refresh; confirm fonts and assets resolve publicly; then record actual build/check and production results in `docs/brand-implementation.md`. This review leaves that completion contract open.
