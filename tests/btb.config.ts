import path from 'node:path';
import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'.',testMatch:/btb-.*\.spec\.ts/,workers:1,timeout:60000,reporter:[['list'],['json',{outputFile:path.resolve('docs/behind-the-bar/evidence/test-results.json')}]],use:{baseURL:process.env.BTB_URL||'http://127.0.0.1:4190',channel:'chrome',headless:process.env.BTB_HEADLESS==='1',video:process.env.BTB_RECORD==='1'?'on':'off',viewport:{width:1440,height:1000}},outputDir:path.resolve('docs/behind-the-bar/evidence/test-artifacts')});
