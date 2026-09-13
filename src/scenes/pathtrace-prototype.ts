// Local optical investigation only: genuine progressive ray tracing, never a poster.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {HDRLoader} from 'three/addons/loaders/HDRLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {WebGLPathTracer} from 'three-gpu-pathtracer';
const query=new URLSearchParams(location.search);
const drink=['bbf-negroni','ichigo-negroni','negroni-express'].includes(query.get('drink')||'')?query.get('drink')!:'negroni-express';
const interfaces=query.has('interfaces')&&drink==='negroni-express';const photo=query.get('view')==='photo';
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setPixelRatio(devicePixelRatio);renderer.setSize(innerWidth,innerHeight);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.85;document.body.append(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#29231c');
const camera=new THREE.PerspectiveCamera(35,innerWidth/innerHeight,.05,250);
const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,1.28,0);controls.minPolarAngle=.2;controls.maxPolarAngle=1.7;controls.minDistance=3;controls.maxDistance=16;
const elevation=photo?.6:drink==='negroni-express'?.34:drink==='ichigo-negroni'?.09:.13;const azimuth=photo?.518:0;const distance=6.85;
camera.position.set(distance*Math.cos(elevation)*Math.sin(azimuth),1.28+distance*Math.sin(elevation),distance*Math.cos(elevation)*Math.cos(azimuth));controls.update();
const [gltf,hdr,counter]=await Promise.all([
 new GLTFLoader().loadAsync(`/models/${drink}${interfaces?'-interfaces':''}.glb`),new HDRLoader().loadAsync('/textures/studio_small_09_2k.hdr'),new THREE.TextureLoader().loadAsync(`/textures/somma-counter-${photo?'photo':'video'}.png`)
]);
hdr.mapping=THREE.EquirectangularReflectionMapping;scene.environment=hdr;scene.environmentIntensity=.7;
counter.colorSpace=THREE.SRGBColorSpace;counter.wrapS=counter.wrapT=THREE.RepeatWrapping;counter.repeat.set(12,12);counter.anisotropy=renderer.capabilities.getMaxAnisotropy();
const toRemove:THREE.Object3D[]=[];const colors:Record<string,string>={'negroni-express':'#ed5a22','ichigo-negroni':'#f2c474','bbf-negroni':'#9c331a'};
gltf.scene.traverse(o=>{if(!(o instanceof THREE.Mesh))return;
 let owner:THREE.Object3D|null=o;while(owner&&!owner.userData.scenePartId)owner=owner.parent;
 const data={...owner?.userData,...o.userData};const part=String(data.scenePartId||o.name);
 if(data.role==='recipe'||part==='stage_counter'){toRemove.push(o);return}
 for(const material of Array.isArray(o.material)?o.material:[o.material]){const m=material as THREE.MeshPhysicalMaterial;
  if(['glass','liquid','ice'].includes(part)){
   m.color.set('white');m.transmission=1;m.transparent=false;m.opacity=1;m.thickness=part==='glass'?.035:1;m.roughness=part==='glass'?.018:part==='liquid'?.01:.025;
   if(!interfaces)m.ior=part==='glass'?1.51:part==='liquid'?1.36:1.31;
   if(part==='liquid'){m.attenuationColor.set(colors[drink]);m.attenuationDistance=1.4;}
  }
 }
 // Explicit alpha fixes path-tracer color-attribute texture padding, preserving authored RGB.
 if(o.geometry.attributes.color?.itemSize===3){const c=o.geometry.attributes.color;const rgba=new Float32Array(c.count*4);for(let i=0;i<c.count;i++){rgba[i*4]=c.getX(i);rgba[i*4+1]=c.getY(i);rgba[i*4+2]=c.getZ(i);rgba[i*4+3]=1;}o.geometry.setAttribute('color',new THREE.BufferAttribute(rgba,4));}
});toRemove.forEach(o=>o.removeFromParent());scene.add(gltf.scene);
const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.MeshStandardMaterial({color:'white',map:counter,roughness:.42}));ground.rotation.x=-Math.PI/2;ground.position.y=-.006;scene.add(ground);
const light=new THREE.RectAreaLight('#fff0d4',3,3,4);light.position.set(-3,4,1);light.lookAt(0,1,0);scene.add(light);
const tracer=new WebGLPathTracer(renderer);tracer.bounces=16;tracer.filterGlossyFactor=.08;tracer.renderDelay=0;tracer.fadeDuration=0;tracer.rasterizeScene=false;tracer.dynamicLowRes=false;tracer.minSamples=1;tracer.setScene(scene,camera);
controls.addEventListener('change',()=>tracer.updateCamera());
window.addEventListener('resize',()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();tracer.updateCamera()});
let frames=0;const times:number[]=[];let previous=performance.now();let paused=false;
const diagnostics={drink,interfaces,view:photo?'photo':'hero',samples:0,frameTimes:times,camera:camera.position.toArray(),pause:()=>{paused=true},resume:()=>{paused=false},setCamera:(position:number[],target:number[])=>{camera.position.fromArray(position);controls.target.fromArray(target);controls.update();tracer.updateCamera()},setExposure:(value:number)=>{renderer.toneMappingExposure=value;tracer.reset()}};
(window as unknown as {pathtraceQA:typeof diagnostics}).pathtraceQA=diagnostics;
function frame(){requestAnimationFrame(frame);if(paused)return;tracer.renderSample();const now=performance.now();times.push(now-previous);previous=now;if(times.length>200)times.shift();if(++frames%5===0){document.getElementById('status')!.textContent=`True path-traced GLB · ${drink} · ${tracer.samples.toFixed(0)} samples · drag to orbit · no poster`;diagnostics.samples=tracer.samples;diagnostics.camera=camera.position.toArray()}}
frame();
