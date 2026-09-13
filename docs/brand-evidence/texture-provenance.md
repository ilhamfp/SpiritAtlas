# SpiritAtlas texture provenance

Generation date: 2026-09-13.

## Model and access verification

- Requested product: GPT-Image-2.5.
- Exact API identifier verified in current official documentation: `gpt-image-2.5-sunburst`. Documentation: https://developers.openai.com/api/docs/models/gpt-image-2.5-sunburst .
- Authenticated read-only access check: `client.models.retrieve("gpt-image-2.5-sunburst")` returned `id: "gpt-image-2.5-sunburst"`, `object: "model"`. No alternative model was selected.
- Generation workflow: bundled imagegen skill CLI, `edit` command using `POST /v1/images/edits`, with explicit `--model gpt-image-2.5-sunburst`.
- Root `.env` loaded only into the local CLI process using `uv run --env-file .env`. Its value was not printed, placed in assets, or used by the browser. `.env` is excluded by `.gitignore`.

## References and method

The supplied kit's `docs/references/spiritatlas-style-reference.png` and `public/textures/spiritatlas-marble-dissolve-study-v1.png` were both visually inspected. The first image supplies palette and fluid form only. Source-company typography, emblems, and layouts are excluded. The kit's original baked study remains unmodified and was not double-dithered.

The approved outputs are smooth color fields intended for a separate art-directed square-grid coverage mask. They are opaque decorative WebP files, not transparent overlays, seamless tiles, or material/PBR maps. No runtime generation is required.

## Assets

| Asset | Dimensions | File size | Input | Prompt | API completion |
| --- | --- | --- | --- | --- | --- |
| `public/textures/spiritatlas-marble-base-desktop-v1.webp` | 1536 × 1024 | 98,316 bytes | Kit style reference | `docs/brand-evidence/prompts/marble-base-desktop-v1.txt` | Succeeded in 46.0 s |
| `public/textures/spiritatlas-marble-base-mobile-v1.webp` | 1024 × 1536 | 99,782 bytes | Approved desktop output | `docs/brand-evidence/prompts/marble-base-mobile-v1.txt` | Succeeded in 28.8 s |

Both requests used quality `high`, WebP output, compression `92`, and `n=1`. Both saved files were reopened and visually inspected. Exact SHA-256 checksums and machine-readable metadata are in `texture-assets.json`. The bundled CLI does not retain an image-response model field; the explicit request model and independent authenticated model lookup establish which identifier was used.

### Review decisions

- Desktop accepted as a smooth base: a broad S-shaped orange ribbon connects the lower perimeter with peach pools at the right; dark channels separate the folds. The left third and much of the center remain calm for typography and a separate cocktail.
- Mobile accepted as an intentional portrait recomposition: the top and central field remain charcoal, with side ribbons and broad peach pools concentrated in the lower half. It is a separately generated composition, not a center crop.
- Neither file contains lettering, logos, cocktails, circular particles, or baked square dots. A small amount of tonal texture is visible on close inspection, but there is no uniform noise overlay or full-image pixelation.
- Soft luminous ridges are baked decorative shading. Do not use either output as a physically calibrated material.
- Palette and form meet the smooth-base requirements; final dissolve density, actual responsive placement, and relationship to the drink must still be assessed in the rendered page.

## Reproduction

Run from the repository root after configuring the local `.env`. The output paths are intentionally non-destructive; generate a new versioned file when refining.

```sh
uv run --env-file .env --with openai --with pillow python /Users/ilhamfirdausiputra/.codex/skills/.system/imagegen/scripts/image_gen.py edit \
  --model gpt-image-2.5-sunburst \
  --image SpiritAtlas-Brand-Kit/docs/references/spiritatlas-style-reference.png \
  --prompt-file docs/brand-evidence/prompts/marble-base-desktop-v1.txt \
  --no-augment --size 1536x1024 --quality high \
  --output-format webp --output-compression 92 \
  --out public/textures/spiritatlas-marble-base-desktop-v1.webp
```

For the portrait version, use the desktop output as `--image`, the mobile prompt, size `1024x1536`, and the mobile output filename. The skill CLI was used unchanged. No custom SDK generation runner or runtime image-generation endpoint was added.

