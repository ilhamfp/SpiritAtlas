import { defineConfig } from '@playwright/test';
import base from './transmission-camera.config';
// Assertions completed before ENOSPC during trace teardown; preserve the first run.
export default defineConfig({
  ...base,
  grep: /comparison visibility reentry and resize|WebKit demand viewer stops/,
  outputDir: '../qa/performance-results/transmission-camera-behavior/retry-output',
  reporter: [['list'], ['json', { outputFile: '../qa/performance-results/transmission-camera-behavior/retry-results.json' }]],
  use: { ...base.use, trace: 'off' },
});
