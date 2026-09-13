import { defineConfig } from '@playwright/test';

const run = process.env.ATLAS_BRAND_RUN || 'local';
const baseURL = process.env.ATLAS_BRAND_URL || 'http://127.0.0.1:4174';
if (new URL(baseURL).port === '4173') throw new Error('Port 4173 is excluded from this suite; use the configured SpiritAtlas server (default port 4174).');

export default defineConfig({
  testDir: '.',
  testMatch: process.env.ATLAS_BRAND_EXISTING === '1'
    ? ['collection-routes.spec.ts', 'espresso-collection.spec.ts', 'ingredient-visibility.spec.ts', 'recipe-completion.spec.ts', 'atlas-expansion-routes.spec.ts', 'reference-photos.spec.ts', 'content-contract.spec.ts', 'new-collection-content.spec.ts']
    : ['brand-journeys.spec.ts', 'classic-negroni-integration.spec.ts'],
  workers: 1,
  fullyParallel: false,
  timeout: 100_000,
  expect: { timeout: 25_000 },
  retries: 0,
  outputDir: `../docs/brand-evidence/${run}/test-output`,
  reporter: [['list'], ['json', { outputFile: `../docs/brand-evidence/${run}/results.json` }]],
  use: {
    baseURL,
    browserName: 'chromium',
    channel: 'chrome',
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
