// CPU-only installed-source reproduction: no renderer or WebGL context created.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {WebGLRenderTarget} from 'three';
const recorded='qa/performance-results/demand-v0151-somma-passes/production-measurement.json';
const data=JSON.parse(fs.readFileSync(recorded));
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const phase=data.cases[0].phases.find(p=>p.name==='continuous-handler-orbit');
const frames=phase.gpuDraws['negroni-express'];
const fixed=['offscreen-2','offscreen-3','offscreen-4'];
const seen=new Set(),observations=[];
for(const frame of frames){
 const ids=[...new Set(frame.segments.map(s=>s.target).filter(id=>id!=='default'&&!fixed.includes(id)))];
 assert.equal(ids.length,2);assert(ids.every(id=>!seen.has(id)));
 ids.forEach(id=>seen.add(id));
 assert.equal(frame.segments.reduce((n,s)=>n+s.drawCalls,0),frame.drawCalls);
 assert.deepEqual(frame.segments.map(s=>s.drawCalls),[4,1,6,2,2,7,1,9]);
 observations.push({frame:frame.frame,newDrawFramebufferIds:ids});
}
function replay(cssWidth,cssHeight,dpr,aligned){
 const canvas=[Math.floor(cssWidth*dpr),Math.floor(cssHeight*dpr)];
 const custom=aligned?canvas:[Math.ceil(cssWidth*dpr),Math.ceil(cssHeight*dpr)];
 const target=new WebGLRenderTarget(...canvas);
 let disposals=0;target.addEventListener('dispose',()=>disposals++);
 const frames=[];
 for(let i=0;i<4;i++){
  const before=disposals;
  target.setSize(...custom);target.setSize(...canvas);
  frames.push(disposals-before);
 }
 return {cssWidth,cssHeight,dpr,canvas,custom,disposalsPerFrame:frames};
}
const examples=[];
for(const width of [635,635.25,635.5,635.75]){
 const old=replay(width,800,2,false),aligned=replay(width,800,2,true);
 assert(old.disposalsPerFrame.every(n=>n===(old.custom[0]===old.canvas[0]?0:2)));
 assert(aligned.disposalsPerFrame.every(n=>n===0));examples.push({old,aligned});
}
const files=['src/scenes/Viewer.tsx','node_modules/three/src/renderers/WebGLRenderer.js','node_modules/three/src/core/RenderTarget.js','node_modules/three/src/renderers/webgl/WebGLTextures.js','node_modules/three/src/renderers/webgl/WebGLRenderStates.js','node_modules/@react-three/drei/core/Fbo.js','node_modules/@react-three/drei/core/MeshTransmissionMaterial.js','node_modules/@react-three/fiber/dist/react-three-fiber.esm.js','node_modules/@react-three/fiber/dist/events-156d8d12.esm.js','node_modules/react-use-measure/dist/index.js'];
const report={scope:'CPU-only installed-source sizing reproduction; examples are synthetic and do not identify actual fractional CSS size',recorded,recordedSha256:sha(recorded),observedCanvas:data.cases[0].environment.canvases[0],continuousFrames:frames.length,drawFramebufferPattern:observations,examples,files:Object.fromEntries(files.map(p=>[p,sha(p)])),limits:'Recorded cssWidth is integer clientWidth. Fractional R3F size, actual per-pass viewport and allocation sizes require the planned browser probe. This confirms dispose semantics and the observed identity pattern, not GPU performance attribution or pixel parity.'};
fs.writeFileSync('qa/evidence/render-target-sizing-independent.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({continuousFrames:frames.length,newDrawFramebufferIds:seen.size,installedTargetReplays:examples,output:'qa/evidence/render-target-sizing-independent.json'}));
