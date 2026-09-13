import { defineConfig } from '@playwright/test';
import base from './demand.config';
export default defineConfig({
  ...base,
  grep: /partial expansion, mid-animation reversal|comparison visibility reentry and resize|WebKit demand viewer stops/,
  outputDir: '../qa/performance-results/transmission-camera-behavior/output',
  reporter: [['list'], ['json', { outputFile: '../qa/performance-results/transmission-camera-behavior/results.json' }]],
  use: { ...base.use, deviceScaleFactor: 2 },
  webServer: undefined,
});
