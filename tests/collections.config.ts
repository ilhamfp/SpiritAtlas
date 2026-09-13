import {defineConfig} from '@playwright/test';
const run=process.env.ATLAS_COLLECTION_RUN||'collections';
const webkit=process.env.ATLAS_COLLECTION_BROWSER==='webkit';
export default defineConfig({
  testDir:'.',testMatch:['espresso-collection.spec.ts','collection-routes.spec.ts','content-contract.spec.ts','ingredient-visibility.spec.ts','recipe-completion.spec.ts','atlas-expansion-routes.spec.ts','new-collection-viewers.spec.ts','new-collection-content.spec.ts','reference-photos.spec.ts'],workers:1,fullyParallel:false,
  timeout:60000,expect:{timeout:20000},retries:0,
  outputDir:`../qa/interaction-artifacts/${run}-output`,
  reporter:[['list'],['json',{outputFile:`../qa/interaction-artifacts/${run}-results.json`}]],
  use:{baseURL:'http://127.0.0.1:4173',viewport:{width:1440,height:1000},deviceScaleFactor:2,browserName:webkit?'webkit':'chromium',...(webkit?{}:{channel:'chrome'}),screenshot:'only-on-failure',trace:'retain-on-failure',video:'off'},
});
