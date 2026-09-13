import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const root='qa/demand-rendering',out=path.join(root,'evidence');fs.mkdirSync(out,{recursive:true});
const results=[],idle=[],sources=[];
for(const run of ['initial','retry']){
 const data=JSON.parse(fs.readFileSync(`${root}/demand-v0151-baked-${run}-results.json`,'utf8'));
 for(const suite of data.suites)for(const spec of suite.specs)for(const test of spec.tests)for(const result of test.results){
  const prefix=`${run}-${test.projectName}-${spec.title.replaceAll(/[^a-z0-9]+/gi,'-').replace(/-$/,'')}`;
  const folder=path.join(out,prefix);fs.mkdirSync(folder,{recursive:true});
  const row={run,title:spec.title,project:test.projectName,status:result.status,durationMs:result.duration,startTime:result.startTime,artifacts:[]};
  for(const attachment of result.attachments){
   if(attachment.body===undefined)continue;
   const bytes=Buffer.from(attachment.body,'base64');
   const ext=attachment.contentType==='application/json'?'.json':attachment.contentType==='image/png'?'.png':'.bin';
   const file=path.join(folder,attachment.name+ext);fs.writeFileSync(file,bytes);row.artifacts.push(file);
   if(ext!=='.json')continue;
   const value=JSON.parse(bytes);
   if(attachment.name==='demand-provenance')sources.push(value.sources);
   if(value?.before&&value?.after){
    for(const [id,before]of Object.entries(value.before))idle.push({run,test:spec.title,project:test.projectName,name:attachment.name,id,beforeFrames:before.renderedFrames,afterFrames:value.after[id].renderedFrames,frameDelta:value.after[id].renderedFrames-before.renderedFrames,beforeRenderedAt:before.renderedAt,afterRenderedAt:value.after[id].renderedAt,observedRestMs:1100,e:value.after[id].e,evidence:file});
   }
  }
  results.push(row);
 }
}
const provenance=sources[0].map(file=>({...file,currentSha256:createHash('sha256').update(fs.readFileSync(file.path)).digest('hex')}));
if(sources.some(list=>JSON.stringify(list)!==JSON.stringify(sources[0])))throw Error('Sources changed between behavior cases');
if(provenance.some(p=>p.sha256!==p.currentSha256))throw Error('Sources changed after the tested draw');
const currentSources=path.join(root,'source-after');fs.mkdirSync(currentSources,{recursive:true});
for(const file of provenance.filter(p=>p.path.startsWith('src/')))fs.copyFileSync(file.path,path.join(currentSources,path.basename(file.path)));
const effectiveIdle=idle.filter(v=>!(v.run==='initial'&&v.test.startsWith('model retry')));
const summary={generatedAt:new Date().toISOString(),results,idle,acceptedIdle:{windows:effectiveIdle.length,maximumFrameDelta:Math.max(...effectiveIdle.map(v=>v.frameDelta)),maximumRenderedAtDelta:Math.max(...effectiveIdle.map(v=>v.afterRenderedAt-v.beforeRenderedAt)),observationMsEach:1100},sources:provenance};
fs.writeFileSync(path.join(root,'behavior-summary.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({results:results.map(({title,status,run})=>({title,status,run})),acceptedIdle:summary.acceptedIdle,sourcesUnchanged:true}));
