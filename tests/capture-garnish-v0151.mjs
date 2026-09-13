import {chromium} from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
const root=process.cwd(),out=path.join(root,'qa/evidence',process.env.ATLAS_CAPTURE_NAME||'v0151-live-validation');
const drinks=process.env.ATLAS_CAPTURE_DRINKS?.split(',')||['bbf-negroni','ichigo-negroni','negroni-express'];
fs.mkdirSync(out,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1100},deviceScaleFactor:1,
 recordVideo:{dir:out,size:{width:1440,height:1100}}});
const page=await context.newPage(),video=page.video();
page.setDefaultTimeout(15000);
const report={date:new Date().toISOString(),browser:browser.version(),viewport:[1440,1100],dpr:1,
 candidate:'v0151-baked',errors:[],rows:[],complete:false};
page.on('pageerror',e=>report.errors.push(e.message));
const write=()=>fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2)+'\n');
try{
 for(const drink of drinks){
  await page.goto(`http://127.0.0.1:5173/?drink=${drink}&assetCandidate=v0151-baked`);
  await page.waitForFunction(id=>window.__atlasViewers?.[id]?.ready,drink);
  const snapshot=()=>page.evaluate(id=>{const q=window.__atlasViewers[id];return {e:q.e,parts:q.parts,camera:q.camera,stage:q.stage}},drink);
  const row={drink,before:await snapshot()};report.rows.push(row);write();
  assert(row.before.parts.some(p=>p.category==='garnish'&&p.normalMap?.width===2048),'Actual rendered garnish has its normal map');
  await page.locator('.cocktail-viewer').screenshot({path:path.join(out,`${drink}-assembled.png`)});
  const box=await page.locator('.cocktail-viewer').boundingBox();
  for(let arc=0;arc<4;arc++){
   await page.mouse.move(box.x+220,box.y+300);await page.mouse.down();
   for(let step=1;step<=24;step++){
    await page.mouse.move(box.x+220-Math.PI/(2*.009)*step/24,box.y+300);
    await page.waitForTimeout(17);
   }
   await page.mouse.up();
  }
  // Complete a short extra arc so subpixel input quantization cannot leave a
  // few degrees unvisited after four nominal quarter turns.
  await page.mouse.move(box.x+220,box.y+300);await page.mouse.down();
  for(let step=1;step<=12;step++){
   await page.mouse.move(box.x+220-step*3,box.y+300);await page.waitForTimeout(17);
  }
  await page.mouse.up();
  await page.waitForFunction(id=>window.__atlasViewers[id].camera.azimuth>=Math.PI*2,drink);
  row.orbit=await snapshot();
  await page.getByRole('button',{name:'Reset view',exact:true}).click();
  await page.getByRole('button',{name:'Explore ingredients',exact:true}).click();
  await page.waitForFunction(id=>window.__atlasViewers[id].e>.995,drink);
  row.expanded=await snapshot();
  const garnish=row.before.parts.filter(p=>p.category==='garnish');
  const delta=garnish.map(p=>row.expanded.parts.find(q=>q.id===p.id).position.map((n,i)=>n-p.position[i]));
  row.maxGarnishRelativeDrift=Math.max(...delta.flatMap(d=>d.map((n,i)=>Math.abs(n-delta[0][i]))));
  assert(row.maxGarnishRelativeDrift<.00001,'Attached garnish retains its arrangement during expansion');
  await page.locator('.cocktail-viewer').screenshot({path:path.join(out,`${drink}-expanded.png`)});
  await page.getByRole('button',{name:'Reassemble drink',exact:true}).click();
  await page.waitForFunction(id=>window.__atlasViewers[id].e<.005,drink);
  row.reassembled=await snapshot();
  row.maxReassemblyPositionError=Math.max(...row.before.parts.flatMap(p=>row.reassembled.parts.find(q=>q.id===p.id).position.map((n,i)=>Math.abs(n-p.position[i]))));
  assert(row.maxReassemblyPositionError<.00001);
  row.modelResources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(x=>x.name.includes('.glb')).map(x=>x.name));
  assert(row.modelResources.every(u=>u.includes('/candidates/v0151-baked/')),'Route changes retain the selected candidate');
  write();console.log(JSON.stringify({drink,normalMaps:row.before.parts.filter(p=>p.normalMap).length,orbit:row.orbit.camera.azimuth,drift:row.maxGarnishRelativeDrift,reassembly:row.maxReassemblyPositionError}));
 }
 assert.equal(report.errors.length,0);
 report.complete=true;
}catch(error){report.failure=String(error);throw error;}
finally{
 write();await page.goto('about:blank');await page.close();await context.close();
 if(video)await video.saveAs(path.join(out,'orbit-expansion.webm'));
 await browser.close();
 report.hashes=Object.fromEntries(['src/scenes/Viewer.tsx','src/styles.css','src/scenes/viewer.css',
  ...['bbf-negroni','ichigo-negroni','negroni-express'].map(id=>`public/models/candidates/v0151-baked/${id}.glb`)
 ].map(name=>[name,createHash('sha256').update(fs.readFileSync(path.join(root,name))).digest('hex')]));write();
}
