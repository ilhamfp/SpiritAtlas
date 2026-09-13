// Follow saved finite optical path examples through the installed Cycles key rule.
// This is a source-level diagnostic, not a reimplementation of Cycles radiance.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const source='qa/evidence/blender/v012-hero-optical-path-lengths.json';
const report=JSON.parse(fs.readFileSync(source,'utf8'));
const cases={};
for(const [region,row] of Object.entries(report.regions)){
  const active=new Set();
  let physicalLength=0,shaderKeyedLength=0;
  const steps=[];
  for(const event of row.example.sequence){
    const activeBefore=[...active];
    if(event.incoming===1)physicalLength+=event.distance;
    shaderKeyedLength+=active.size*event.distance;
    let unmatchedExit=false;
    if(event.part==='liquid'&&!event.reflection){
      if(event.outgoing===1)active.add(event.material);
      else if(event.incoming===1){unmatchedExit=!active.has(event.material);active.delete(event.material);}
    }
    steps.push({...event,activeVolumeShadersBefore:activeBefore,activeVolumeShadersAfter:[...active],unmatchedExit,
      absorbingOutsidePhysicalLiquid:activeBefore.length>0&&event.incoming!==1});
  }
  cases[region]={physicalLengthAcrossRecordedSegments:physicalLength,
    shaderKeyedLengthAcrossRecordedSegments:shaderKeyedLength,
    activeShadersAfterRecordedSegments:[...active],
    unmatchedExitCount:steps.filter(s=>s.unmatchedExit).length,
    nonLiquidAbsorbingSegmentCount:steps.filter(s=>s.absorbingOutsidePhysicalLiquid).length,
    steps};
}
const result={source,sourceSha256:createHash('sha256').update(fs.readFileSync(source)).digest('hex'),
  scriptSha256:createHash('sha256').update(fs.readFileSync(import.meta.filename)).digest('hex'),
  installedBlenderCommit:'9e2066aef7ef',
  cyclesSource:'https://github.com/blender/blender/blob/9e2066aef7ef/intern/cycles/kernel/integrator/volume_stack.h',
  cyclesSourceSha256:'88bf8f1cd5391869bd5079f8ba69bfa0053784108a3516717c03ad1133dc5371',
  rule:'Volume entries match both object and shader. The one liquid object has distinct base and cavity materials; their shader identities differ.',
  limitations:'Four sampled finite path examples only, geometric normals and the prior explicit medium model. Saved sequences contain at most24 boundaries. The final segment to floor/environment is unavailable and excluded. Actual Cycles offsets, shadow traversal, stack cleanup, roughness, compiled shader execution and radiance are not reproduced. This establishes a concrete mismatch in the represented volume-key transitions, not exact excess optical depth for an image.',cases};
const output='qa/evidence/blender/v012-cycles-volume-key-diagnosis.json';
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify(Object.fromEntries(Object.entries(cases).map(([key,row])=>[key,Object.fromEntries(Object.entries(row).filter(([key])=>key!=='steps'))])),null,2));
