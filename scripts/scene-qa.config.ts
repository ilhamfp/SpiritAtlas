import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'../tests',testMatch:'fallbacks.spec.ts',grep:/loading state stays explicit|model error reports failure|unavailable WebGL|reduced motion/,
  workers:1,fullyParallel:false,timeout:60000,expect:{timeout:15000},retries:0,
  outputDir:'../docs/brand-evidence/scene-qa',
  reporter:[['list'],['json',{outputFile:new URL('../docs/brand-evidence/scene-qa-results.json',import.meta.url).pathname}]],
  use:{baseURL:'http://127.0.0.1:5176',viewport:{width:1440,height:1000},browserName:'chromium',channel:'chrome',trace:'retain-on-failure',screenshot:'only-on-failure'},
  webServer:{command:'node scripts/scene-qa-server.mjs',cwd:new URL('..',import.meta.url).pathname,url:'http://127.0.0.1:5176',reuseExistingServer:false,timeout:30000},
});
