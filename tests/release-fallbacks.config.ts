import { defineConfig } from '@playwright/test';
const runName = process.env.ATLAS_FALLBACK_RUN || 'release-fallbacks';
export default defineConfig({
  testDir: '.', testMatch: 'fallbacks.spec.ts',
  grep: /loading state stays explicit|model error reports failure/,
  workers: 1, fullyParallel: false, timeout: 60_000,
  expect: { timeout: 15_000 }, retries: 0,
  outputDir: `../qa/interaction-artifacts/${runName}-output`,
  reporter: [['list'], ['json', { outputFile: `../qa/interaction-artifacts/${runName}-results.json` }]],
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 900 }, browserName: 'chromium', channel: 'chrome', trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off' },
});
