# SpiritAtlas — Texture Generation

## Role in the product

Use image generation for original marbled color fields and art-directed decorative backgrounds. Use the website renderer for adjustable square-dot coverage, responsive composition, and restrained motion. Use Blender and the actual drink references for the cocktail objects and their physical materials.

An image texture provides rich detail, but it does not automatically provide a clean alpha mask, seamless tiling, correct material maps, or independently controllable grain. Inspect each output and record how it is intended to be used.

## Model and key handling

The requested model is **GPT-Image-2.5**. This kit does not establish its exact API model identifier, current API availability, or account access. Verify those in the current official documentation or organizer-provided access instructions before configuring an API workflow. Do not silently substitute another model or attribute an unverified generation to it.

The included first study was generated using the built-in image-generation tool. That interface does not expose a model selector, so its exact model version is unverified. No user API key was needed for this study.

For a future API workflow, configure `OPENAI_API_KEY` in the local generation process or server-side secret environment. Keep it out of chat, version control, client code, and public build variables. A non-secret variable such as `OPENAI_IMAGE_MODEL` can hold the verified model identifier. Generate and review assets during development, then serve the resulting static files; visitors do not need to trigger an image-generation request on every page load.

## Included first study

File: `public/textures/spiritatlas-marble-dissolve-study-v1.png`

- Original artwork using the supplied image as a style reference.
- Wide composition with orange and peach marbling, dark negative space, fine grain, and partial square-dot dissolution.
- Baked, opaque decorative image; not a transparent overlay or seamless tile.
- Intended as a static hero-background candidate and an art-direction target.
- The irregularities in its generated dot grid are part of the raster study; implement a stable ordered grid separately when precise density and animation are required.
- Keep it behind the cocktail and DOM interface. Avoid scaling or cropping it so aggressively that the dots become large blocks or intrude on text.

The exact first-generation prompt is saved in `docs/prompts/texture-study-v1.txt`.

## Prompt A — smooth hero marbling for a procedural dissolve

Use the supplied reference image for palette and fluid form only. Request a new original image:

> Create a wide landscape decorative texture for SpiritAtlas, an elevated Singapore cocktail atlas. A few broad saturated-orange ribbons bend and fold around pale-peach pools and warm-charcoal channels. The marbling has directional flow, soft interior gradients, and subtle luminous ridges. Use charcoal #2C2A2D as the dominant field, orange #FF682F, peach #FFBBB0, and very restrained pale-cream highlights. Keep the left third calm and dark for future typography. Concentrate the flowing artwork toward the right and lower perimeter, with deliberate open areas for a separate cocktail image. The central forms are smooth and continuous-tone. No dots, no dithering, no grain, no text, no logos, no glass, no cocktails, no objects, no rainbow colors, no lens flares. This is an original abstract color field; the website will add grain and square-dot dissolution as separate layers.

Suggested filename after review: `spiritatlas-marble-base-desktop-v1.png`.

This prompt deliberately omits the signature edge treatment so the renderer can apply it predictably. Author or derive a coverage field and art-directed edge mask; color information alone is not an alpha mask. Do not apply another dither layer to the included baked study and expect equivalent control.

## Prompt B — finished partial-dither background

> Create an original abstract editorial background for SpiritAtlas, using the supplied reference for style only. Flowing orange-and-peach marbled bands pass through a spacious warm-charcoal field. Keep substantial interiors smooth. At selected organic edges, let the color break into a regular grid of tiny axis-aligned square dots. Move from dense checker-like coverage near the solid form to scattered but orderly square dots in the dark field. Preserve readable transitions between smooth color, dense dot coverage, and sparse dot coverage. Use #2C2A2D, #FF682F, #FFBBB0, with small #FFFFE3 highlights. Add very fine static print grain. The composition is asymmetrical, fluid, rich, and restrained, with a quiet area for future copy. No text, logo, UI, cocktail, circular particle cloud, neon purple, uniform full-image pixelation, or copied reference-company emblem.

Suggested filename after review: `spiritatlas-marble-dissolve-desktop-v2.png`.

Use this as a finished static background. The grain and dots are baked in. A gentle whole-layer fade is possible, but the dots cannot be individually controlled without a separate reconstruction.

## Prompt C — mobile composition

> Adapt the approved SpiritAtlas texture into an original tall portrait composition. Preserve the warm-charcoal, saturated-orange, peach, and pale-cream color relationships, the fluid marbled bands, and selective square-dot dissolve. Reserve the top 40% as quiet charcoal for a large headline and primary action. Let warm ribbons enter from the lower and side edges, framing an open central area where a separate cocktail will appear. Keep the dots delicate and concentrated at selected boundaries. No text, no logos, no drink, no UI, no objects. Preserve the approved texture character while recomposing the artwork for a narrow screen.

Suggested filename after review: `spiritatlas-marble-dissolve-mobile-v1.png`.

Use the approved generated desktop artwork as the edit reference for this step. Recomposition should be intentional; a center crop of the desktop image may remove the quiet area needed by the mobile layout.

## Refinement instructions

Evaluate the image in the actual landing-page composition, alongside the intended headline and cocktail. Refine one visible issue per edit while preserving the successful composition:

- Too much noise: “Reduce the fine grain substantially; preserve the marbling and all dot boundaries.”
- Missing partial treatment: “Keep the central color fields smooth; concentrate square-dot dissolution along the outer contours.”
- Weak marbling: “Introduce broader directional folds, peach pools, and dark channels; preserve the quiet copy area.”
- Oversized pixels: “Make the square dots finer and maintain density changes across each dissolve edge.”
- Busy headline area: “Clear the headline region to quiet charcoal; move the decorative detail toward the image perimeter.”
- Incorrect warmth: “Return the artwork to orange, warm peach, and charcoal; remove purple and cold blue casts.”

For procedural motion, keep the pixel grid and random seed stable and deform the coverage field slowly. Avoid animating the baked texture in a way that causes visible pixel crawling. Respect reduced motion.

## Cocktail-material boundary

The brand texture is a decorative image. Do not use it as the liquid, glass, or garnish material merely because the palette is attractive. Glass needs appropriate geometry, transmission, roughness, and lighting; garnish and ice must match their actual visual references.

Generated close-up surface textures can support a Blender material when grounded in the drink reference. Review them for invented details and baked lighting before use. A generated color map is not automatically a valid normal, roughness, displacement, or physically calibrated material set.

## Asset record

For each accepted output, retain its prompt, input-reference filenames, actual model identifier if exposed, generation date, dimensions, and intended role. Record whether the image includes baked lighting, grain, dots, or transparency. This makes later refinement reproducible and supports an accurate account of model use in the hackathon demo.
