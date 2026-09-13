# SpiritAtlas brand kit

Step 01 defines the visual foundation for SpiritAtlas, a Singapore bar and cocktail atlas with detailed 3D exploration and comparison.

## Add this kit to your project

Place these files at the repository root:

- `BRAND_GUIDELINES.md` — identity, palette, typography, landing-page direction, and interaction styling.
- `VISUAL_REFERENCE.md` — a detailed analysis of the supplied reference, dot-dissolve construction, and review criteria.
- `spiritatlas-tokens.css` — exact colors, type scales, spacing, and starter control styles. Move it into your existing styles directory when integrating.
- `TEXTURE_PROMPTS.md` — reusable image prompts, asset roles, model provenance, and integration guidance.

Keep the supplied reference at `docs/references/spiritatlas-style-reference.png`; the Markdown image link in `VISUAL_REFERENCE.md` expects this relative path. It is an unchanged copy of the supplied image. It is a design reference, not SpiritAtlas production artwork.

The first generated texture study is included at `public/textures/spiritatlas-marble-dissolve-study-v1.png`. It contains baked grain and dissolve dots, so use it as a static background or visual target. The adjustable dissolve described in `VISUAL_REFERENCE.md` is a separate implementation step.

Font binaries are not included. Font choices and official source links are documented in the guidelines. The Markdown and CSS are the source of truth for exact text, font families, and color values; a generated image is an art-direction study rather than a color-managed token specification.

## Kick off the next implementation step

Paste this into Codex from your project root:

> Read `BRAND_GUIDELINES.md` and `VISUAL_REFERENCE.md`, and inspect `docs/references/spiritatlas-style-reference.png`. Apply this visual direction to the existing SpiritAtlas landing page while preserving the working cocktail scenes and product interactions. Start with the hero: confident Instrument Sans typography, a charcoal stage, one accurately reconstructed cocktail, and a flowing orange-and-peach marbled decoration with partial dither and square-dot dissolve edges. Use `spiritatlas-tokens.css` as the token source, integrating it with the existing styling system. Keep the decorative effect separate from the cocktail and interface layers. Render and inspect the result on desktop and mobile; refine the largest visual mismatches against the reference and the acceptance criteria. Report what changed and any remaining gaps. If there is no landing page yet, implement the hero as the first page section using the project’s established framework.

If your repo already has an `AGENTS.md`, you can add a short pointer directing the agent to these two design documents. Keep the existing project instructions intact.
