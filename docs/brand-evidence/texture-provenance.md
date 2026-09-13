# SpiritAtlas texture provenance

Generation date: 2026-09-13.

## Model and access verification

- Requested product: GPT-Image-2.5.
- Exact API identifier verified in current official documentation by the coordinating agent: `gpt-image-2.5-sunburst`. Documentation: https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst .
- Authenticated read-only access check: `client.models.retrieve("gpt-image-2.5-sunburst")` returned `id: "gpt-image-2.5-sunburst"`, `object: "model"`. No alternative model was selected.
- Generation workflow: bundled imagegen skill CLI, `edit` command using `POST /v1/images/edits`, with explicit `--model gpt-image-2.5-sunburst`.
- Root `.env` loaded only into the local CLI process using `uv run --env-file .env`. Its value was not printed, placed in assets, or used by the browser. `.env` is excluded by `.gitignore`.

## References and method

The supplied kit's `docs/references/spiritatlas-style-reference.png` and `public/textures/spiritatlas-marble-dissolve-study-v1.png` were both visually inspected. The first image supplies palette and fluid form only. Source-company typography, emblems, and layouts are excluded. The kit's original baked study remains unmodified and was not double-dithered.

The approved outputs are smooth color fields intended for a separate art-directed square-grid coverage mask. They are opaque decorative WebP files, not transparent overlays, seamless tiles, or material/PBR maps. No runtime generation is required.

## Assets

Desktop generation in progress.
