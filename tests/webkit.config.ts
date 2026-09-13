import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './webkit',
  testMatch: 'webkit-checks.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  retries: 0,
  outputDir: '../qa/interaction-artifacts/webkit-output',
  reporter: [
    ['list'],
    ['json', { outputFile: '../qa/interaction-artifacts/webkit-results.json' }],
    ['html', { outputFolder: '../qa/interaction-artifacts/webkit-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.ATLAS_WEBKIT_URL ?? 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    browserName: 'webkit',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
  },
});
