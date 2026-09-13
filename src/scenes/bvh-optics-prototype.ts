// Deterministic multi-interface diagnostic: ray queries against actual Blender GLB triangles.
// First-order reflected rays now query real geometry; higher orders and opaque lighting remain approximate.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {transportGLSL} from './bvh-transport.glsl';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,MeshBVHUniformStruct,FloatVertexAttributeTexture,BVHShaderGLSL,SAH} from 'three-mesh-bvh';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(devicePixelRatio);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;document.body.append(renderer.domElement);
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.05,250);camera.position.set(0,1.8+6.85*Math.cos(.16)*Math.tan(Math.asin(.307)),6.85*Math.cos(.16));
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.28,0);controls.update();
const [gltf,environment,counter]=await Promise.all([new GLTFLoader().loadAsync('/models/negroni-express-interfaces-air-gap.glb'),new THREE.TextureLoader().loadAsync('/textures/somma-interior-panorama-v2.png'),new THREE.TextureLoader().loadAsync('/textures/somma-stone-tile-v1.png')]);
environment.colorSpace=THREE.SRGBColorSpace;environment.mapping=THREE.EquirectangularReflectionMapping;counter.colorSpace=THREE.SRGBColorSpace;counter.wrapS=counter.wrapT=THREE.MirroredRepeatWrapping;
const geometries:THREE.BufferGeometry[]=[];
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
const geometry=mergeGeometries(geometries,false);const bvh=new MeshBVH(geometry,{strategy:SAH,targetLeafSize:4});
const bvhUniform=new MeshBVHUniformStruct();bvhUniform.updateFrom(bvh);
const normalTexture=new FloatVertexAttributeTexture();normalTexture.updateFrom(geometry.getAttribute('normal') as THREE.BufferAttribute);
const albedoTexture=new FloatVertexAttributeTexture();albedoTexture.updateFrom(geometry.getAttribute('albedo') as THREE.BufferAttribute);
const opticalTexture=new FloatVertexAttributeTexture();opticalTexture.updateFrom(geometry.getAttribute('opticalData') as THREE.BufferAttribute);
const uniforms={bvh:{value:bvhUniform},normalTexture:{value:normalTexture},albedoTexture:{value:albedoTexture},opticalTexture:{value:opticalTexture},environment:{value:environment},counter:{value:counter},cameraWorld:{value:camera.matrixWorld},inverseProjection:{value:camera.projectionMatrixInverse},absorption:{value:new THREE.Color('#ed4e16')},absorptionDistance:{value:1.7},counterBase:{value:new THREE.Color('#837c70')},diagnosticMode:{value:Number(new URLSearchParams(location.search).get('diagnostic')||0)}};
const material=new THREE.ShaderMaterial({glslVersion:THREE.GLSL3,uniforms,depthTest:false,depthWrite:false,vertexShader:`out vec2 screenUV;void main(){screenUV=uv;gl_Position=vec4(position.xy,0.,1.);}`,fragmentShader:`
precision highp usampler2D;
in vec2 screenUV;
out vec4 fragmentColor;
#define gl_FragColor fragmentColor
${BVHShaderGLSL.common_functions}
${BVHShaderGLSL.bvh_struct_definitions}
${BVHShaderGLSL.bvh_ray_functions}
uniform BVH bvh;
uniform sampler2D normalTexture,albedoTexture,opticalTexture,environment,counter;
uniform mat4 cameraWorld,inverseProjection;
uniform vec3 absorption,counterBase;
uniform float absorptionDistance,diagnosticMode;
vec3 environmentLight(vec3 d){d=vec3(-d.z,d.y,d.x);vec2 uv=vec2(atan(d.z,d.x)*.15915494+.5,asin(clamp(d.y,-1.,1.))*.318309886+.5);return texture(environment,uv,2.).rgb*.6;}
vec3 floorLight(vec3 p){vec2 uv=p.xz/vec2(15.,7.5);return mix(counterBase,texture(counter,uv,2.).rgb,.16)*.8;}
vec3 backgroundRay(vec3 p,vec3 d){if(d.y<-.0001){float t=(.035-p.y)/d.y;if(t>0.)return floorLight(p+d*t);}return environmentLight(d);}
${transportGLSL}
void main(){vec3 p,d;ndcToCameraRay(screenUV*2.-1.,cameraWorld,inverseProjection,p,d);float unresolved,approximation;vec3 color=traceRay(p,normalize(d),unresolved,approximation);
if(diagnosticMode>.5&&diagnosticMode<1.5)color=vec3(unresolved*50.,0.,unresolved*50.);
else if(diagnosticMode>1.5)color=vec3(approximation*10.,approximation*3.,0.);
else if(unresolved>.001)color=mix(color,vec3(1.,0.,1.),.75);
gl_FragColor=vec4(color,1.);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`});
const scene=new THREE.Scene();scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2,2),material));const screenCamera=new THREE.Camera();
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()});
const times:number[]=[];let prior=performance.now();const diagnostics={frameTimes:times,camera:camera.position.toArray(),triangles:geometry.index!.count/3,ready:true,setDiagnosticMode:(n:number)=>uniforms.diagnosticMode.value=n,model:'negroni-express-interfaces-air-gap.glb',transport:'v011 primary1024/secondary512 with explicit residual mask; higher-order reflection approximation'};
(window as unknown as {bvhQA:typeof diagnostics}).bvhQA=diagnostics;
function frame(){requestAnimationFrame(frame);controls.update();renderer.render(scene,screenCamera);const now=performance.now();times.push(now-prior);prior=now;if(times.length>300)times.shift();diagnostics.camera=camera.position.toArray();document.getElementById('status')!.textContent='Live nested-ray diagnostic · magenta marks unresolved transport · drag to orbit';}frame();
