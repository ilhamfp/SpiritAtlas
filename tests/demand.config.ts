import { defineConfig } from '@playwright/test';
const name = process.env.ATLAS_DEMAND_RUN || 'demand-v0151-baked';
export default defineConfig({
  testDir: './demand', testMatch: 'demand-checks.ts', workers: 1, fullyParallel: false,
  timeout: 100_000, expect: { timeout: 15_000 }, retries: 0,
  outputDir: `../qa/demand-rendering/${name}-output`,
  reporter: [['list'], ['json', { outputFile: `../qa/demand-rendering/${name}-results.json` }]],
  use: { baseURL: 'http://127.0.0.1:4173', viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off' },
  projects: [
    { name: 'demand-chrome', grepInvert: /WebKit/, use: { browserName: 'chromium', channel: 'chrome' } },
    { name: 'demand-webkit', grep: /WebKit/, use: { browserName: 'webkit' } },
  ],
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5173', url: 'http://127.0.0.1:5173', reuseExistingServer: true, timeout: 30_000 },
});
