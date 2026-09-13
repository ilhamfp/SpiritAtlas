# SpiritAtlas

Singapore’s cocktails. Inside out.

Public site: https://spiritatlas-one.vercel.app

An editorial landing page and interactive Singapore cocktail atlas. The original Bar Bon Funk, MOGA and Bar Somma Negronis retain their live Three.js rendering, ingredient exploration, reference photographs and synchronized comparison. The existing additional cocktail collections remain accessible in the atlas.

## Run

```sh
npm ci
npm run dev
npm run build
npm run preview
```

The build includes TypeScript checking. The focused browser suite expects the SpiritAtlas development server on port 4174:

```sh
npm run dev -- --port 4174
npx playwright test -c tests/brand.config.ts
```

For the deployed site:

```sh
ATLAS_BRAND_URL=https://spiritatlas-one.vercel.app ATLAS_BRAND_RUN=production npx playwright test -c tests/brand.config.ts
```

## Routes

- `/` — landing page
- `/?bar=bar-bon-funk` — atlas
- `/?drink=bbf-negroni` — Bar Bon Funk
- `/?drink=ichigo-negroni` — MOGA
- `/?drink=negroni-express` — Bar Somma
- `/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=1` — comparison

## Design and evidence

Brand authority: `SpiritAtlas-Brand-Kit/`. Implementation decisions and acceptance evidence: `docs/brand-implementation.md`. Screenshots and verification results: `docs/brand-evidence/`. Atlas engineering notes: `docs/atlas-engineering.md`.

The decorative textures were generated during development using verified `gpt-image-2.5-sunburst` access. Prompts and provenance are retained in `docs/brand-evidence/texture-provenance.md`. Visitors receive static WebP assets and a separate stable square-grid coverage mask; no image-generation API is called by the website.

The root `.env` is ignored by Git and Vercel. No secret is required by the deployed frontend. Instrument Sans and IBM Plex Mono are self-hosted; licenses are in `public/fonts/`.

## Deployment

The `.vercel` link targets this SpiritAtlas project. Production deployment is `vercel deploy --prod`. Verify the public alias in a fresh unauthenticated browser after any deployment.
