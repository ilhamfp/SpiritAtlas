// Small exact-ray and continuing-path correctness checks. No GPU speed claim.
import fs from 'node:fs';import {createHash} from 'node:crypto';import {chromium} from '@playwright/test';
const out='qa/evidence/precision-ray-diagnostic';fs.mkdirSync(out,{recursive:true});
const sha=b=>createHash('sha256').update(b).digest('hex');
const report={date:new Date().toISOString(),sources:Object.fromEntries(['src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts','src/scenes/precision-ray-diagnostic.ts',import.meta.filename].map(p=>[p,sha(fs.readFileSync(p))])),controls:[],direct:[],paths:[],rejections:[],limits:'192×240 DPR1 bounded correctness workload; test-only first-wrong-medium traps are not radiance. Direct probes replay captured float32 inputs; continuing paths resample through the changed predicate. No GPU speed or all-ray correctness claim.'};
const hook=`
window.__precisionTest={
 reset(){resetState=true;},step(){frame();},orbit(angle){camera.position.applyAxisAngle(new THREE.Vector3(0,1,0),angle);controls.update();resetState=true;},
 sample(){
  const arrays=[],raw=[],gl=renderer.getContext();for(let a=0;a<4;a++){const v=new Float32Array(size.x*size.y*4);renderer.readRenderTargetPixels(stateTargets[sourceIndex],0,0,size.x,size.y,v,undefined,a);arrays.push(Array.from(v));const b=new Uint8Array(v.buffer);let s='';for(let n=0;n<b.length;n+=16384)s+=String.fromCharCode(...b.subarray(n,n+16384));raw.push(btoa(s));}
  const events=[];let trapped=0,nonFinite=0,completed=0;
  for(let i=0;i<arrays[0].length;i+=4){for(const a of arrays)for(let k=0;k<4;k++)if(!Number.isFinite(a[i+k]))nonFinite++;if(arrays[1][i+3]<0){trapped++;if(events.length<256)events.push({pixel:{x:(i/4)%size.x,yFromBottom:Math.floor(i/4/size.x)},origin:arrays[0].slice(i,i+3),medium:arrays[0][i+3],direction:arrays[1].slice(i,i+3),triangle:(arrays[2][i]-1)/3,distance:arrays[2][i+1],expectedIncoming:arrays[2][i+2],depth:arrays[2][i+3],normal:arrays[3].slice(i,i+3),sample:arrays[3][i+3]});}else completed+=arrays[3][i+3];}
  const programs=renderer.info.programs.map(p=>{const samplerTypes=[gl.SAMPLER_2D,gl.UNSIGNED_INT_SAMPLER_2D,gl.INT_SAMPLER_2D,gl.SAMPLER_CUBE],samplers=[];for(let i=0;i<gl.getProgramParameter(p.program,gl.ACTIVE_UNIFORMS);i++){const u=gl.getActiveUniform(p.program,i);if(samplerTypes.includes(u.type))samplers.push({name:u.name,size:u.size});}return {linked:gl.getProgramParameter(p.program,gl.LINK_STATUS),samplers,samplerCount:samplers.reduce((n,u)=>n+u.size,0)};});
  return {raw,image:renderer.domElement.toDataURL('image/png').split(',')[1],trapped,events,nonFinite,completed,passes:diagnostics.passes,camera:camera.position.toArray(),programs,glError:gl.getError(),contextLost:gl.isContextLost(),timerQuery:!!gl.getExtension('EXT_disjoint_timer_query_webgl2'),precision:diagnostics.precisionRepair,medium:diagnostics.mediumBvh};
 },
 probe(q){
  const prefix=transportMaterial.fragmentShader.slice(0,transportMaterial.fragmentShader.indexOf('void main()'));
  const probeMain=\`uniform vec3 probeOrigin,probeDirection,probeOutgoing;uniform float probeBranch;
  void main(){uvec4 ids=uvec4(0);vec3 n=vec3(0.),bary=vec3(0.);float side=0.,dist=0.;bool hit=atlasPrecisionFirstHit(bvh,probeOrigin,probeDirection,ids,n,bary,side,dist);
  if(!hit){nextOrigin=vec4(0.);nextDirection=vec4(0.);nextThroughput=vec4(0.);nextSum=vec4(0.);return;}
  vec3 error;vec3 point=atlasSurfacePoint(bvh.position,ids.xyz,bary,error),oriented=n*probeBranch,spawn=atlasOffsetPoint(point,error,oriented);
  uvec4 ids2=uvec4(0);vec3 n2=vec3(0.),bary2=vec3(0.);float side2=0.,dist2=0.;bool hit2=atlasPrecisionFirstHit(bvh,spawn,probeOutgoing,ids2,n2,bary2,side2,dist2);
  nextOrigin=vec4(spawn,dot(abs(oriented),error));nextDirection=vec4(n,side);nextThroughput=vec4(float(ids.x+1u),dist,hit2?float(ids2.x+1u):0.,dist2);nextSum=vec4(point,side2);}\`;
  const mat=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,vertexShader,fragmentShader:prefix+probeMain,uniforms:{...commonUniforms,probeOrigin:{value:new THREE.Vector3().fromArray(q.origin)},probeDirection:{value:new THREE.Vector3().fromArray(q.direction)},probeOutgoing:{value:new THREE.Vector3().fromArray(q.outgoing||q.direction)},probeBranch:{value:q.branch==='reflection'?1:-1}},depthTest:false,depthWrite:false});
  const target=new THREE.WebGLRenderTarget(1,1,{count:4,type:THREE.FloatType,format:THREE.RGBAFormat,depthBuffer:false,stencilBuffer:false}),scene=new THREE.Scene();scene.add(new THREE.Mesh(quadGeometry,mat));renderer.setRenderTarget(target);renderer.render(scene,screenCamera);const values=[];for(let a=0;a<4;a++){const v=new Float32Array(4);renderer.readRenderTargetPixels(target,0,0,1,1,v,undefined,a);values.push(Array.from(v));}renderer.setRenderTarget(null);target.dispose();mat.dispose();return {values,glError:renderer.getContext().getError()};
 }
};`;
const browser=await chromium.launch({channel:'chrome',headless:true}),context=await browser.newContext({viewport:{width:192,height:240},deviceScaleFactor:1});
await context.addInitScript(()=>{window.__nativeRAF=requestAnimationFrame.bind(window);window.requestAnimationFrame=()=>1;window.cancelAnimationFrame=()=>{};});
let audit=false;
await context.route(/bvh-wavefront-transport\.glsl\.ts(?:\?.*)?$/,async route=>{
 const response=await route.fetch();let body=await response.text();
 if(audit){
  body=body.replace('for(int work=0;work<2;work++) {','if(direction.w<0.){nextOrigin=origin;nextDirection=direction;nextThroughput=throughput;nextSum=sum;return;}\n for(int work=0;work<2;work++) {');
  body=body.replace('throughput.rgb*=attenuationForMedium(int(origin.a),dist);','if(optic.y>.5&&optic.y<1.5&&int(origin.a)!=int(side>0.?optic.w:optic.z)){nextOrigin=origin;nextDirection=vec4(d,-1.);nextThroughput=vec4(float(indices.x+1u),dist,side>0.?optic.w:optic.z,throughput.a);nextSum=vec4(n,sum.a);return;}\n throughput.rgb*=attenuationForMedium(int(origin.a),dist);');
 }
 await route.fulfill({response,body});
});
await context.route(/bvh-wavefront-prototype\.ts(?:\?.*)?$/,async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text())+'\n'+hook});});
async function open(flags){const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});await page.goto('http://127.0.0.1:5173/bvh-wavefront-prototype.html'+flags);await page.waitForFunction(()=>window.__precisionTest&&window.wavefrontQA?.ready,{timeout:120000});return {page,errors};}
async function capture(page,name,count,errors){const start=Date.now();await page.evaluate(async n=>{window.__precisionTest.reset();for(let i=0;i<n;i++){await new Promise(r=>window.__nativeRAF(r));window.__precisionTest.step();}},count);const {raw,image,...data}=await page.evaluate(()=>window.__precisionTest.sample());const buffers=raw.map(v=>Buffer.from(v,'base64'));buffers.forEach((b,i)=>fs.writeFileSync(`${out}/${name}-${i}.bin`,b));fs.writeFileSync(`${out}/${name}.png`,Buffer.from(image,'base64'));return {name,count,wallMs:Date.now()-start,...data,stateHashes:buffers.map(sha),errors,buffers};}
const persist=()=>fs.writeFileSync(`${out}/gpu.json`,JSON.stringify(report,null,2)+'\n');
try{
 const control=await open('?assetCandidate=v012'),{buffers:cb,...c}=await capture(control.page,'default-control',64,control.errors);
 c.baselineDiff=cb.map((b,i)=>{const old=fs.readFileSync(`qa/evidence/medium-bvh-gpu/baseline-state-${i}.bin`);let changed=0,maxDelta=0;for(let j=0;j<b.length;j+=4)if(b.readUInt32LE(j)!==old.readUInt32LE(j)){changed++;maxDelta=Math.max(maxDelta,Math.abs(b.readFloatLE(j)-old.readFloatLE(j)));}return {attachment:i,changed,maxDelta};});report.controls.push(c);persist();await control.page.close();
 const direct=await open('?assetCandidate=v012&precisionRay=1');
 const predecessor=JSON.parse(fs.readFileSync('qa/evidence/medium-rim-predecessor/report.json'));
 for(const row of predecessor.captures)for(const e of row.events){const probe=await direct.page.evaluate(q=>window.__precisionTest.probe(q),{origin:e.incomingOrigin,direction:e.incomingDirection,outgoing:e.target.direction,branch:e.branch});report.direct.push({kind:'rim',case:row.name,pixel:e.target.pixel,expectedPrevious:e.triangle,input:e,...probe});}
 for(const name of ['hero','left','right','emitters'])for(const e of JSON.parse(fs.readFileSync(`qa/evidence/medium-bvh-traps/${name}.json`)).traps.events){const probe=await direct.page.evaluate(q=>window.__precisionTest.probe(q),{origin:e.origin,direction:e.direction});report.direct.push({kind:'old-trap',case:name,pixel:e.pixel,input:e,...probe});}
 const {buffers:db,...dc}=await capture(direct.page,'precision-hero',64,direct.errors);report.controls.push(dc);persist();console.log(JSON.stringify({name:dc.name,errors:dc.errors,nonFinite:dc.nonFinite,programs:dc.programs}));await direct.page.close();
 audit=true;
 for(const [name,angle,flag]of [['hero',0,''],['left',-.6,''],['right',.6,''],['fresh-angle',.31,''],['emitters',0,'&emitters=1']]){
  const {page,errors}=await open('?assetCandidate=v012&precisionRay=1'+flag);if(angle)await page.evaluate(a=>window.__precisionTest.orbit(a),angle);
  const {buffers,...data}=await capture(page,'audit-'+name,name==='hero'?64:32,errors);report.paths.push(data);persist();console.log(JSON.stringify({name,trapped:data.trapped,nonFinite:data.nonFinite,errors}));await page.close();
 }
 audit=false;
 for(const [name,flags]of [['combined','?assetCandidate=v012&precisionRay=1&mediumBvh=1'],['wrong-candidate','?precisionRay=1']]){const {page,errors}=await open(flags);report.rejections.push({name,metadata:await page.evaluate(()=>window.wavefrontQA.precisionRepair),errors});await page.close();}
}catch(error){report.failure=String(error);throw error;}finally{persist();await browser.close();}
