import { defineConfig } from '@playwright/test';

const runName = process.env.ATLAS_STAGE_RUN || 'stage';

export default defineConfig({
  testDir: './stage',
  testMatch: 'stage-checks.ts',
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  retries: 0,
  outputDir: `../qa/interaction-artifacts/${runName}-output`,
  reporter: [['list'], ['json', { outputFile: `../qa/interaction-artifacts/${runName}-results.json` }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off',
  },
  projects: [
    { name: 'stage-chrome', grepInvert: /WebKit/, use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'stage-webkit', grep: /WebKit/, use: { browserName: 'webkit' } },
  ],
});
