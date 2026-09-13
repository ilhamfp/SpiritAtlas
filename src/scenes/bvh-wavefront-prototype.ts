// Isolated persistent-path experiment using actual Blender boundary triangles.
// Optical branches query geometry. Opaque lighting remains an explicit approximation.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {wavefrontTransportGLSL} from './bvh-wavefront-transport.glsl';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,MeshBVHUniformStruct,FloatVertexAttributeTexture,BVHShaderGLSL,SAH} from 'three-mesh-bvh';
import {createMediumBVHForest,mediumForestRayGLSL,TESTED_MEDIUM_BVH_SHA256} from './medium-bvh-forest';
import {precisionFullBVHGLSL,precisionTransportSource} from './precision-ray-diagnostic';
import {CONTACT_RUNTIME_SHA256,prepareContactGeometry} from './contact-runtime-schema';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(devicePixelRatio);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.05,250);camera.position.set(0,1.8+6.85*Math.cos(.16)*Math.tan(Math.asin(.307)),6.85*Math.cos(.16));
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.28,0);controls.update();
// This diagnostic initializes rays in air; keep its orbit outside the drink.
controls.enablePan=false;controls.minDistance=2.6;controls.maxPolarAngle=Math.PI/2-.01;
const query=new URLSearchParams(location.search);
const candidate=query.get('assetCandidate');
const contactCandidate=candidate==='v012-contact';
let contactSourceHash:string|null=null;
const traceEmitters=query.get('emitters')==='1';
const mediumMode=query.get('mediumBvh');
const mediumRequested=['1','full','verify','trap','history'].includes(mediumMode??'');
const precisionRequested=query.get('precisionRay')==='1';
let precisionRejection:string|null=precisionRequested&&candidate!=='v012'?'Requires the tested assembled assetCandidate=v012.':null;
let mediumSourceHash:string|null=null;
let mediumRejection:string|null=mediumRequested&&candidate!=='v012'?'Requires the tested assembled assetCandidate=v012.':null;
if(precisionRequested&&mediumRequested){precisionRejection='Precision repair and medium restriction cannot be combined.';mediumRejection=precisionRejection;}
const opticalModel=contactCandidate?'/models/candidates/v012-contact/negroni-express-interfaces.glb':candidate==='v012'?'/models/candidates/v012/negroni-express-interfaces-air-gap.glb':'/models/negroni-express-interfaces-air-gap.glb';
async function loadOpticalModel(){
 if(contactCandidate){
  try{
   const response=await fetch(opticalModel);if(!response.ok)throw Error(`Model request failed: ${response.status}`);
   const bytes=await response.arrayBuffer();contactSourceHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
   if(contactSourceHash!==CONTACT_RUNTIME_SHA256)throw Error('Contact model hash differs from the reviewed v2 export.');
   return await new GLTFLoader().parseAsync(bytes,THREE.LoaderUtils.extractUrlBase(opticalModel));
  }catch(error){document.getElementById('status')!.textContent=`Contact diagnostic unavailable: ${error instanceof Error?error.message:String(error)}`;throw error;}
 }
 if((!mediumRequested&&!precisionRequested)||candidate!=='v012')return new GLTFLoader().loadAsync(opticalModel);
 const response=await fetch(opticalModel);if(!response.ok)throw new Error(`Model request failed: ${response.status}`);
 const bytes=await response.arrayBuffer();
 try{mediumSourceHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(mediumSourceHash!==TESTED_MEDIUM_BVH_SHA256){mediumRejection='Asset hash differs from the tested assembled v012 geometry.';precisionRejection=mediumRejection;}
 }catch{mediumRejection='Could not verify the tested asset hash; using the full BVH.';precisionRejection=mediumRejection;}
 return new GLTFLoader().parseAsync(bytes,THREE.LoaderUtils.extractUrlBase(opticalModel));
}
const [gltf,environment,counter]=await Promise.all([loadOpticalModel(),new THREE.TextureLoader().loadAsync('/textures/somma-interior-panorama-v2.png'),new THREE.TextureLoader().loadAsync('/textures/somma-stone-tile-v1.png')]);
const precisionEnabled=precisionRequested&&!precisionRejection&&mediumSourceHash===TESTED_MEDIUM_BVH_SHA256;
environment.colorSpace=THREE.SRGBColorSpace;environment.mapping=THREE.EquirectangularReflectionMapping;counter.colorSpace=THREE.SRGBColorSpace;counter.wrapS=counter.wrapT=THREE.MirroredRepeatWrapping;
const geometries:THREE.BufferGeometry[]=[];
let contactGeometry:ReturnType<typeof prepareContactGeometry>|null=null;
if(contactCandidate){
 try{contactGeometry=prepareContactGeometry(gltf.scene);geometries.push(...contactGeometry.geometries);}
 catch(error){document.getElementById('status')!.textContent=`Contact diagnostic unavailable: ${error instanceof Error?error.message:String(error)}`;throw error;}
}else{
gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
 let owner:THREE.Object3D|null=o;while(owner&&!owner.userData.scenePartId)owner=owner.parent;
 const data={...owner?.userData,...o.userData};const part=String(data.scenePartId||o.name);
 if(data.role==='recipe'||part.startsWith('stage_'))return;
 const m=o.material as THREE.MeshPhysicalMaterial;const optical=['glass','liquid','ice'].includes(part)||m.transmission>.5;
 // Coincident unity-IOR faces duplicate a physical interface. The adjacent liquid/glass
 // surface already carries its relative IOR; omit the redundant surface from this trace.
 if(optical&&Math.abs(m.ior-1)<.0001)return;
 const inside=part==='liquid'?1:part==='glass'?2:part==='ice'?3:part==='ice_inclusions'?4:0;
 const outside=part==='liquid'&&m.ior<1.1?3:part==='glass'&&m.ior<1.3?1:part==='ice_inclusions'?3:0;
 const source=o.geometry.clone().applyMatrix4(o.matrixWorld);const g=source.index?source.toNonIndexed():source;
 const position=g.getAttribute('position'),normal=g.getAttribute('normal'),vertexColor=g.getAttribute('color');
 const opticalData=new Float32Array(position.count*4);const albedo=new Float32Array(position.count*3);
 for(let i=0;i<position.count;i++){
  opticalData.set([part==='ice_inclusions'?1.03/1.31:m.ior||1.5,optical?1:0,inside,optical?outside:m.roughness||.04],i*4);
  albedo.set([m.color.r*(vertexColor?vertexColor.getX(i):1),m.color.g*(vertexColor?vertexColor.getY(i):1),m.color.b*(vertexColor?vertexColor.getZ(i):1)],i*3);
 }
 const prepared=new THREE.BufferGeometry();prepared.setAttribute('position',position);prepared.setAttribute('normal',normal);prepared.setAttribute('albedo',new THREE.BufferAttribute(albedo,3));prepared.setAttribute('opticalData',new THREE.BufferAttribute(opticalData,4));geometries.push(prepared);
});
}
// Controlled lighting experiment: trace the product's actual rectangular emitters.
// Their front sides radiate; their backs are opaque. No new photographic evidence.
if(traceEmitters){
 for(const [color,intensity,width,height,position] of [
  ['#fff3df',5,.65,5,[-4,3,2]],['#e5edff',3,.45,4,[3,2.8,-1]],
 ] as [string,number,number,number,number[]][]){
  const light=new THREE.RectAreaLight(color,intensity,width,height);
  light.position.fromArray(position);light.lookAt(0,1.2,0);light.updateMatrixWorld();
  const g=new THREE.PlaneGeometry(width,height).rotateY(Math.PI).applyMatrix4(light.matrixWorld).toNonIndexed();
  const count=g.attributes.position.count,optics=new Float32Array(count*4),radiance=new Float32Array(count*3);
  for(let i=0;i<count;i++){optics.set([1,2,0,0],i*4);radiance.set(light.color.clone().multiplyScalar(intensity).toArray(),i*3);}
  g.deleteAttribute('uv');g.setAttribute('opticalData',new THREE.BufferAttribute(optics,4));g.setAttribute('albedo',new THREE.BufferAttribute(radiance,3));geometries.push(g);
 }
}
const geometry=mergeGeometries(geometries,false);const bvh=new MeshBVH(geometry,{strategy:SAH,targetLeafSize:4});
let forest:ReturnType<typeof createMediumBVHForest>|null=null;
if(mediumRequested&&!mediumRejection&&mediumSourceHash===TESTED_MEDIUM_BVH_SHA256){
 try{forest=createMediumBVHForest(geometry,bvh);
  if(forest.maxDimension>renderer.capabilities.maxTextureSize){forest.dispose();forest=null;mediumRejection='Packed forest exceeds the device texture-size limit.';}
 }catch(error){mediumRejection=`Packed forest unavailable: ${error instanceof Error?error.message:String(error)}`;}
}
const bvhUniform=forest?.uniform??new MeshBVHUniformStruct();if(bvhUniform instanceof MeshBVHUniformStruct)bvhUniform.updateFrom(bvh);
const normalTexture=new FloatVertexAttributeTexture();normalTexture.updateFrom(geometry.getAttribute('normal') as THREE.BufferAttribute);
const albedoTexture=new FloatVertexAttributeTexture();albedoTexture.updateFrom(geometry.getAttribute('albedo') as THREE.BufferAttribute);
const opticalTexture=new FloatVertexAttributeTexture();opticalTexture.updateFrom(geometry.getAttribute('opticalData') as THREE.BufferAttribute);

const size=new THREE.Vector2();renderer.getDrawingBufferSize(size);
const stateTargets=[0,1].map(()=>new THREE.WebGLRenderTarget(size.x,size.y,{
 count:4,type:THREE.FloatType,format:THREE.RGBAFormat,
 minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,
 depthBuffer:false,stencilBuffer:false,
}));
for(const target of stateTargets)for(const texture of target.textures)texture.colorSpace=THREE.NoColorSpace;
let sourceIndex=0,resetState=true,paused=false;
const commonUniforms={
 bvh:{value:bvhUniform},normalTexture:{value:normalTexture},albedoTexture:{value:albedoTexture},opticalTexture:{value:opticalTexture},
 mediumBvhRoots:{value:forest?.roots??new Uint32Array(4)},useMediumBvh:{value:!!forest&&mediumMode!=='full'},auditMediumBvh:{value:!!forest&&['verify','trap','history'].includes(mediumMode??'')},trapMediumBvh:{value:!!forest&&['trap','history'].includes(mediumMode??'')},historyTrapMediumBvh:{value:!!forest&&mediumMode==='history'},
 environment:{value:environment},counter:{value:counter},cameraWorld:{value:camera.matrixWorld},inverseProjection:{value:camera.projectionMatrixInverse},
 absorption:{value:new THREE.Color('#ed4e16')},absorptionDistance:{value:1.7},counterBase:{value:new THREE.Color('#837c70')},
 resolution:{value:size},resetState:{value:true},
 originState:{value:stateTargets[0].textures[0]},directionState:{value:stateTargets[0].textures[1]},
 throughputState:{value:stateTargets[0].textures[2]},sumState:{value:stateTargets[0].textures[3]},
};
const vertexShader=`out vec2 screenUV;void main(){screenUV=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const transportMaterial=new THREE.ShaderMaterial({
 defines:forest?{ATLAS_MEDIUM_BVH:1}:{},
 glslVersion:THREE.GLSL3,uniforms:commonUniforms,depthTest:false,depthWrite:false,vertexShader,
 fragmentShader:`
 precision highp usampler2D;
 in vec2 screenUV;
 layout(location=0)out vec4 nextOrigin;
 layout(location=1)out vec4 nextDirection;
 layout(location=2)out vec4 nextThroughput;
 layout(location=3)out vec4 nextSum;
 ${BVHShaderGLSL.common_functions}
 ${BVHShaderGLSL.bvh_struct_definitions}
 ${precisionEnabled?precisionFullBVHGLSL():BVHShaderGLSL.bvh_ray_functions}
 uniform BVH bvh;
 ${forest?mediumForestRayGLSL():''}
 uniform sampler2D normalTexture,albedoTexture,opticalTexture,environment,counter;
 uniform sampler2D originState,directionState,throughputState,sumState;
 uniform mat4 cameraWorld,inverseProjection;
 uniform vec3 absorption,counterBase;
 uniform float absorptionDistance;
 uniform vec2 resolution;
 uniform bool resetState;
 vec3 environmentLight(vec3 d){d=vec3(-d.z,d.y,d.x);vec2 uv=vec2(atan(d.z,d.x)*.15915494+.5,asin(clamp(d.y,-1.,1.))*.318309886+.5);return textureLod(environment,uv,2.).rgb*.6;}
 vec3 floorLight(vec3 p){vec2 uv=p.xz/vec2(15.,7.5);return mix(counterBase,textureLod(counter,uv,2.).rgb,.16)*.8;}
 float floorDistance(vec3 p,vec3 d){if(d.y>=-.0001)return 1e20;float t=(.035-p.y)/d.y;vec3 point=p+d*t;return t>0.&&abs(point.x)<=12.&&abs(point.z)<=12.?t:1e20;}
 vec3 backgroundRay(vec3 p,vec3 d){float t=floorDistance(p,d);return t<1e19?floorLight(p+d*t):environmentLight(d);}
 ${precisionEnabled?precisionTransportSource(wavefrontTransportGLSL):wavefrontTransportGLSL}
 `,
});
const displayMaterial=new THREE.ShaderMaterial({
 glslVersion:THREE.GLSL3,uniforms:{sumState:{value:stateTargets[0].textures[3]},diagnosticMode:{value:0}},
 depthTest:false,depthWrite:false,vertexShader,fragmentShader:`
 in vec2 screenUV;
 out vec4 fragmentColor;
 #define gl_FragColor fragmentColor
 uniform sampler2D sumState;
 uniform float diagnosticMode;
 void main(){
  vec4 accumulated=texture(sumState,screenUV);
  vec3 color=accumulated.rgb/max(accumulated.a,1.);
  if(diagnosticMode>.5)color=vec3(log2(1.+accumulated.a)/12.);
  gl_FragColor=vec4(color,1.);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
 }
 `,
});
const quadGeometry=new THREE.PlaneGeometry(2,2);
const transportScene=new THREE.Scene();transportScene.add(new THREE.Mesh(quadGeometry,transportMaterial));
const displayScene=new THREE.Scene();displayScene.add(new THREE.Mesh(quadGeometry,displayMaterial));
const screenCamera=new THREE.Camera();
const frameTimes:number[]=[];
const diagnostics={
 ready:false,contextLost:false,passes:0,resets:0,frameTimes,camera:camera.position.toArray(),
 triangles:geometry.index!.count/3,model:opticalModel,traceEmitters,
 contactGeometry:{enabled:contactCandidate,sourceSha256:contactSourceHash,requiredSourceSha256:CONTACT_RUNTIME_SHA256,rows:contactGeometry?.rows??null,opticalTriangles:contactGeometry?.opticalTriangles??null,omittedTriangles:contactGeometry?.omittedTriangles??null,
  scope:'Separate assembled contact-boundary candidate with explicit material media and relative IOR. Historical transport and product stage/absorption remain unchanged; numerical and visual acceptance are incomplete.'},
 precisionRepair:{requested:precisionRequested,enabled:precisionEnabled,reason:precisionRejection,sourceSha256:mediumSourceHash,
  scope:'Opt-in assembled v012 full-BVH numerical diagnostic; not production or a watertightness guarantee.',
  method:'Shear-space nonnegative edges, integer zero-edge fallback, conservative positive-distance estimate, equal-distance global triangle tie, barycentric point reconstruction and projected gamma(7) outward next-float offset. No medium restriction.'},
 mediumBvh:{requested:mediumRequested,enabled:!!forest,mode:forest?(mediumMode==='full'?'packed-full':mediumMode==='verify'?'verify-reference':mediumMode==='trap'?'verify-trap':mediumMode==='history'?'verify-history':'packed-medium'):'default-full',reason:mediumRejection,sourceSha256:mediumSourceHash,requiredSourceSha256:TESTED_MEDIUM_BVH_SHA256,
  ranges:forest?.ranges??null,dimensions:forest?.dimensions??null,byteLength:forest?.byteLength??null,transportSamplers:13,deviceFragmentSamplers:renderer.capabilities.maxTextures,
  scope:'Opt-in assembled v012 diagnostic only; medium containment and GPU parity remain under investigation.'},
 transport:'Two interfaces per pass; persistent full geometry paths; exact Fresnel; unbiased Russian roulette after 24 interfaces; approximate opaque lighting',
 setDiagnosticMode:(mode:number)=>displayMaterial.uniforms.diagnosticMode.value=mode,
 setPaused:(value:boolean)=>paused=value,
 setBvhMode:(mode:'full'|'medium'|'verify'|'trap'|'history'):boolean=>{
  if(!forest||!['full','medium','verify','trap','history'].includes(mode))return false;
  commonUniforms.useMediumBvh.value=mode!=='full';commonUniforms.auditMediumBvh.value=['verify','trap','history'].includes(mode);commonUniforms.trapMediumBvh.value=mode==='trap'||mode==='history';commonUniforms.historyTrapMediumBvh.value=mode==='history';
  diagnostics.mediumBvh.mode=mode==='full'?'packed-full':mode==='verify'?'verify-reference':mode==='trap'?'verify-trap':mode==='history'?'verify-history':'packed-medium';resetState=true;diagnostics.resets+=1;return true;
 },
 sampleTraversalAudit:()=>{
  if(!forest||!commonUniforms.auditMediumBvh.value||commonUniforms.trapMediumBvh.value)return {enabled:false,mismatchedPixels:0,totalMismatches:0,maxMismatches:0};
  const values=new Float32Array(size.x*size.y*4);renderer.readRenderTargetPixels(stateTargets[sourceIndex],0,0,size.x,size.y,values,undefined,1);
  let mismatchedPixels=0,totalMismatches=0,maxMismatches=0;
  for(let i=3;i<values.length;i+=4)if(values[i]>0){mismatchedPixels++;totalMismatches+=values[i];maxMismatches=Math.max(maxMismatches,values[i]);}
  return {enabled:true,mismatchedPixels,totalMismatches,maxMismatches};
 },
 sampleMismatchTraps:(limit=64)=>{
  if(!forest||!commonUniforms.trapMediumBvh.value)return {enabled:false,trappedPixels:0,events:[]};
  const target=stateTargets[sourceIndex],directions=new Float32Array(size.x*size.y*4),events=[];
  renderer.readRenderTargetPixels(target,0,0,size.x,size.y,directions,undefined,1);
  const cap=Number.isFinite(limit)?Math.max(0,Math.min(4096,Math.floor(limit))):64;let trappedPixels=0;
  const history=commonUniforms.historyTrapMediumBvh.value;
  const decode=(id:number,distance:number,u:number,v:number)=>id===0?{hit:false}:{hit:true,firstVertex:Math.abs(id)-1,triangle:(Math.abs(id)-1)/3,side:Math.sign(id),distance,barycentric:history?null:[u,v,1-u-v]};
  for(let i=3;i<directions.length;i+=4)if(directions[i]<0.){
   trappedPixels++;if(events.length>=cap)continue;
   const pixel=(i-3)/4,x=pixel%size.x,y=Math.floor(pixel/size.x),origin=new Float32Array(4),hits=new Float32Array(4),bary=new Float32Array(4);
   renderer.readRenderTargetPixels(target,x,y,1,1,origin,undefined,0);
   renderer.readRenderTargetPixels(target,x,y,1,1,hits,undefined,2);
   renderer.readRenderTargetPixels(target,x,y,1,1,bary,undefined,3);
   const reasonBits=history?(-directions[i]-1)%64:-directions[i]-1,previousMarker=bary[3];
   events.push({pixel:{x,yFromBottom:y},origin:Array.from(origin.subarray(0,3)),medium:history?origin[3]%8:origin[3],direction:Array.from(directions.subarray(i-3,i)),reasonBits,
    ...(history?{boundaryDepth:Math.floor(origin[3]/8),samplesCompleted:Math.floor((-directions[i]-1)/64),previous:previousMarker>0?{triangle:Math.floor(previousMarker/4)-1,firstVertex:(Math.floor(previousMarker/4)-1)*3,side:(previousMarker&1)?1:-1,branch:(previousMarker&2)?'reflection':'transmission',normal:Array.from(bary.subarray(0,3))}:null}:{}),
    differences:{hit:!!(reasonBits&1),indices:!!(reasonBits&2),distance:!!(reasonBits&4),side:!!(reasonBits&8),normal:!!(reasonBits&16),barycentric:!!(reasonBits&32)},
    restricted:decode(hits[0],hits[1],bary[0],bary[1]),full:decode(hits[2],hits[3],bary[2],bary[3])});
  }
  return {enabled:true,trappedPixels,truncated:trappedPixels>events.length,events,size:size.toArray(),encoding:history?'First mismatch plus exact previous triangle/side/branch and path ordinal; previous geometric normal recomputed on GPU from the same vertex data. Barycentrics omitted; trap attachments are not radiance.':'First mismatched ray; global consecutive triangle IDs recover original mesh/material. Third barycentric coordinate reconstructed as 1-u-v. Trap attachments are not radiance.'};
 },
 sampleState:()=>{
  const target=stateTargets[sourceIndex];
  const countSamples:number[]=[],depthSamples:number[]=[],mediumSamples:number[]=[];
  for(const [u,v] of [[.5,.5],[.45,.35],[.55,.35],[.5,.25],[.2,.8]]){
   const data=new Float32Array(4);
   renderer.readRenderTargetPixels(target,Math.floor(size.x*u),Math.floor(size.y*v),1,1,data,undefined,3);
   countSamples.push(data[3]);
   renderer.readRenderTargetPixels(target,Math.floor(size.x*u),Math.floor(size.y*v),1,1,data,undefined,2);
   depthSamples.push(data[3]);
   renderer.readRenderTargetPixels(target,Math.floor(size.x*u),Math.floor(size.y*v),1,1,data,undefined,0);
   mediumSamples.push(data[3]);
  }
  return {countSamples,depthSamples,mediumSamples,size:size.toArray()};
 },
};
(window as unknown as {wavefrontQA:typeof diagnostics}).wavefrontQA=diagnostics;
controls.addEventListener('change',()=>{resetState=true;diagnostics.resets+=1;});
window.addEventListener('resize',()=>{
 renderer.setSize(innerWidth,innerHeight);renderer.getDrawingBufferSize(size);
 for(const target of stateTargets)target.setSize(size.x,size.y);
 camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();resetState=true;
});
renderer.domElement.addEventListener('webglcontextlost',()=>{diagnostics.contextLost=true;paused=true;document.getElementById('status')!.textContent='Diagnostic stopped: WebGL context lost. This is not valid fidelity evidence.';});
let prior=performance.now();
function frame(){
 requestAnimationFrame(frame);controls.update();
 if(paused||document.hidden)return;
 const current=stateTargets[sourceIndex],destination=stateTargets[1-sourceIndex];
 commonUniforms.originState.value=current.textures[0];commonUniforms.directionState.value=current.textures[1];
 commonUniforms.throughputState.value=current.textures[2];commonUniforms.sumState.value=current.textures[3];
 commonUniforms.resetState.value=resetState;
 renderer.setRenderTarget(destination);renderer.render(transportScene,screenCamera);
 renderer.setRenderTarget(null);displayMaterial.uniforms.sumState.value=destination.textures[3];renderer.render(displayScene,screenCamera);
 sourceIndex=1-sourceIndex;resetState=false;diagnostics.passes+=1;diagnostics.ready=true;
 const now=performance.now();frameTimes.push(now-prior);prior=now;if(frameTimes.length>300)frameTimes.shift();
 diagnostics.camera=camera.position.toArray();
 document.getElementById('status')!.textContent=`Persistent optical paths · ${diagnostics.passes} passes · drag resets accumulation · diagnostic lighting${mediumRequested?` · ${diagnostics.mediumBvh.mode}${mediumRejection?' (request rejected)':''}`:''}`;
}
frame();
