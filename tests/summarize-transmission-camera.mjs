import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='qa/performance-results/transmission-camera-behavior';
const cases=[],idle=[],sources=[];
for(const [run,file] of [['initial','results.json'],['retry','retry-results.json']]){
 const data=JSON.parse(fs.readFileSync(path.join(root,file)));
 for(const suite of data.suites)for(const spec of suite.specs)for(const test of spec.tests)for(const result of test.results){
  const row={run,title:spec.title,project:test.projectName,status:result.status,durationMs:result.duration,startTime:result.startTime,errors:result.errors.map(e=>e.message),artifacts:[]};
  const folder=path.join(root,'evidence',`${run}-${test.projectName}-${spec.line}`);fs.mkdirSync(folder,{recursive:true});
  for(const a of result.attachments){
   if(a.contentType!=='application/json'||a.body===undefined)continue;
   const bytes=Buffer.from(a.body,'base64'),value=JSON.parse(bytes),out=path.join(folder,a.name+'.json');fs.writeFileSync(out,bytes);row.artifacts.push(out);
   if(a.name==='demand-provenance'){sources.push(value.sources);row.browser=value.browser;}
   if(a.name==='demand-runtime-errors')row.runtimeErrors=value;
   if(value?.before&&value?.after)for(const [id,before]of Object.entries(value.before))idle.push({run,title:spec.title,project:test.projectName,name:a.name,id,frameDelta:value.after[id].renderedFrames-before.renderedFrames,renderedAtDelta:value.after[id].renderedAt-before.renderedAt,e:value.after[id].e,evidence:out});
  }
  cases.push(row);
 }
}
if(sources.some(x=>JSON.stringify(x)!==JSON.stringify(sources[0])))throw Error('Source changed between cases');
const sourceHashes=sources[0].map(x=>({...x,currentSha256:createHash('sha256').update(fs.readFileSync(x.path)).digest('hex')}));
if(sourceHashes.some(x=>x.sha256!==x.currentSha256))throw Error('Current source changed after checks');
const accepted=cases.filter(c=>c.status==='passed');
const acceptedIdle=idle.filter(x=>accepted.some(c=>c.run===x.run&&c.title===x.title&&c.project===x.project));
const summary={generatedAt:new Date().toISOString(),cases,initialFailure:'Comparison and WebKit assertions/afterEach finished, then Playwright trace teardown failed ENOSPC; original failed status retained. Only those2cases rerun with trace off.',acceptedTitles:[...new Set(accepted.map(c=>c.title))],acceptedIdle:{windows:acceptedIdle.length,observationMsEach:1100,maximumFrameDelta:Math.max(...acceptedIdle.map(x=>x.frameDelta)),maximumRenderedAtDelta:Math.max(...acceptedIdle.map(x=>x.renderedAtDelta))},idle,sourceHashes,settings:{baseURL:'http://127.0.0.1:4173',initialViewport:{width:1440,height:900},resizeViewport:{width:390,height:844},dpr:2,workers:1},limits:'Clean pass evidence only uses successful case runs; no active-motion FPS or physical mobile claim.'};
fs.writeFileSync(path.join(root,'summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({cases:cases.map(c=>({run:c.run,status:c.status,title:c.title})),acceptedIdle:summary.acceptedIdle,sourcesUnchanged:true}));
