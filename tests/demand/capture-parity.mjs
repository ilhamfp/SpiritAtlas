import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {chromium} from '@playwright/test';
const mode=process.env.ATLAS_DEMAND_CAPTURE_MODE||'before';
const origin=process.env.ATLAS_DEMAND_BASEURL||(mode==='before'?'http://127.0.0.1:4176':'http://127.0.0.1:4173');
const out=process.env.ATLAS_DEMAND_CAPTURE_OUTPUT||('qa/demand-rendering/parity-'+mode);fs.mkdirSync(out,{recursive:true});
const ids=['bbf-negroni','ichigo-negroni','negroni-express'];
const cases=[
 {name:'somma-half',url:'/?drink=negroni-express&expand=0.5',ids:[ids[2]],e:.5},
 {name:'somma-expanded',url:'/?drink=negroni-express&expand=1',ids:[ids[2]],e:1},
 {name:'comparison-half',url:'/?compare='+ids.join(',')+'&expand=0.5',ids,e:.5},
 {name:'comparison-expanded',url:'/?compare='+ids.join(',')+'&expand=1',ids,e:1},
];
if(mode==='after')for(const id of ids)cases.push({name:id+'-assembled',url:'/?drink='+id+'&expand=0',ids:[id],e:0});
const browser=await chromium.launch({channel:'chrome'}),context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error'&&/shader|WebGL|texture|framebuffer/i.test(m.text()))errors.push(m.text());});
const report={mode,origin,browser:browser.version(),startedAt:new Date().toISOString(),viewport:{width:1440,height:900},dpr:1,cases:[],errors};
try{
 for(const c of cases){
  await page.goto(origin+c.url);await page.mouse.move(0,0);await page.evaluate(()=>document.fonts.ready);
  for(const id of c.ids){
   const host=page.getByTestId('viewer-'+id);await host.scrollIntoViewIfNeeded();
   await page.waitForFunction(({id,e})=>{const s=window.__atlasViewers?.[id];return s?.ready&&Math.abs(s.e-e)<1e-9;},{id,e:c.e},{timeout:45000});
   // Give decoded images, initial layout and the initial/final demand draw time to complete.
   await page.waitForTimeout(250);
   const state=await page.evaluate(id=>JSON.parse(JSON.stringify(window.__atlasViewers[id])),id);
   const filename=c.name+'-'+id+'.png';const png=await host.screenshot();fs.writeFileSync(path.join(out,filename),png);
   report.cases.push({name:c.name,id,url:c.url,e:c.e,filename,sha256:createHash('sha256').update(png).digest('hex'),state});
  }
 }
 report.completedAt=new Date().toISOString();
}finally{await context.close();await browser.close();fs.writeFileSync(path.join(out,'captures.json'),JSON.stringify(report,null,2)+'\n');}
if(errors.length)throw new Error(errors.join('\n'));console.log(JSON.stringify({out,captures:report.cases.length,errors,completedAt:report.completedAt}));
