import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshTransmissionMaterial, useEnvironment, useFBO, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { Plus, Minus, RotateCcw } from 'lucide-react';
import { drinkById, categoriesForFamily } from '../data/drinks';
import type { CategoryId } from '../data/drinks';
import {recipePresentation} from '../data/recipePresentation';
import {ingredientDisplayName} from '../data/ingredientEvidence';
import {useViewerVisibility} from './useViewerVisibility';
import {BarEnvironment, BarCountertop, useBarEnvironment, BAR_ROTATION} from './BarEnvironment';
import {BarLighting} from './BarLighting';
import {ClassicVariantViewer} from './ClassicVariantViewer';
import {classicVariant} from '../animation/classic-variants.js';
import bbfAsset from '../../assets/blender/bbf-negroni.json';
import ichigoAsset from '../../assets/blender/ichigo-negroni.json';
import sommaAsset from '../../assets/blender/negroni-express.json';
import './viewer.css';

export type Orbit = { azimuth: number; elevation: number; zoom: number };
export type ViewerProps = { drinkId:string; expansion:number; onExpansionChange:(n:number)=>void; orbit:Orbit; onOrbitChange:(o:Orbit)=>void; selectedCategory?:string|null; onSelectCategory?:(s:CategoryId)=>void; comparison?:boolean; active?:boolean; hero?:boolean; onSupportChange?:(supported:boolean)=>void };
type Part = {mesh:THREE.Mesh; base:THREE.Vector3; baseRotation:THREE.Quaternion; baseScale:THREE.Vector3; lift:number; role:string; category:string; center:THREE.Vector3;optic:string|null;ior:number};
type Snapshot={e:number;parts:{id:string;position:number[];rotation:number[];scale:number[];visible:boolean;role:string;category:string;representation?:string;evidence?:string;normalMap:{width:number;height:number}|null;emissive:string|null;emissiveIntensity:number|null}[];camera:Orbit & {target:number[];position:number[];fov:number};frameTimes:number[];renderedFrames:number;renderedAt:number;ready:boolean;stage:{backgroundBlurriness:number;backgroundIntensity:number;environmentIntensity:number;stoneStrength:number|null;stoneMipBias:number|null}};
declare global {interface Window {__atlasViewers:Record<string,Snapshot>}}
const clamp=(n:number,min:number,max:number)=>Math.min(max,Math.max(min,n));
const smooth=(n:number)=>{const x=clamp(n,0,1);return x*x*(3-2*x)};
export const expansionPose=(base:number[],lift:number,e:number)=>[base[0],base[1]+lift*smooth((e-.08)/.86),base[2]];
const COLORS:Record<string,string>={'bbf-negroni':'#953415','ichigo-negroni':'#efbc5a','negroni-express':'#ed4e16'};
// Measured rim ellipse ratios in references/reference-config.json. A reference
// elevation is measured at the rim, not at the camera's lower framing target.
const HERO_RIMS:Record<string,{height:number;ratio:number}>={'bbf-negroni':{height:1.94,ratio:.094},'ichigo-negroni':{height:2.26,ratio:.061},'negroni-express':{height:1.8,ratio:.307}};
const GARNISH_TILT_AXIS=new THREE.Vector3(1,0,0);
const ESPRESSO_RECIPE_SCALE=new THREE.Vector3(1.25,1.6,1.25);
// Versioned source candidates can be inspected in the real viewer before promotion.
// Only explicitly authored versions are accepted; regular product routes are unchanged.
// Capture the diagnostic selection once so expansion URL updates cannot swap assets mid-motion.
const modelQuery=new URLSearchParams(location.search);
const ASSET_REVISIONS:Record<string,string>={'bbf-negroni':bbfAsset.version,'ichigo-negroni':ichigoAsset.version,'negroni-express':sommaAsset.version};
function modelPath(drinkId:string){
 const candidate=modelQuery.get('assetCandidate');
 if(candidate==='v012'||candidate==='v014'||candidate==='v014-baked'||candidate==='v0151'||candidate==='v0151-baked')return `/models/candidates/${candidate}/${drinkId}.glb`;
 const variant=drinkId==='negroni-express'&&modelQuery.has('interfaces')?'-interfaces':'';
 const asset=drinkById[drinkId].assets;
 return variant?`/models/${drinkId}${variant}.glb`:`${asset.model}?revision=${asset.revision||ASSET_REVISIONS[drinkId]||'1'}`;
}

function normalMapSize(material:THREE.MeshStandardMaterial){
 const image=material.normalMap?.image as {width?:number;height?:number}|undefined;
 return typeof image?.width==='number'&&typeof image.height==='number'?{width:image.width,height:image.height}:null;
}

class ModelBoundary extends Component<{children:ReactNode;onRetry:()=>void},{error:boolean}>{
 state={error:false};static getDerivedStateFromError(){return {error:true}}
 render(){return this.state.error?<div className="viewer-fallback" role="alert"><p>3D model could not load.</p><span>The drink’s ingredients and story are still available below.</span><button onClick={this.props.onRetry}><RotateCcw size={16}/>Retry 3D</button></div>:this.props.children}
}
function Loading(){return <div className="viewer-loading" role="status"><span className="loading-orbit"/>Preparing live 3D<span>Glass, ingredients & garnish</span></div>}

function Model({props,labelRail,lines,onReady,reduced,buffers,environment,renderedFrames}:{environment:THREE.Texture;props:ViewerProps;buffers:THREE.WebGLRenderTarget[];labelRail:RefObject<HTMLDivElement|null>;lines:RefObject<SVGSVGElement|null>;onReady:()=>void;reduced:boolean;renderedFrames:RefObject<number>}){
 const drink=drinkById[props.drinkId];const profile=drink.renderProfile;
 const espresso=drink.family==='espresso-martini';const glassOnly=(profile?.optics??(espresso?'glass':'layered'))==='glass';
 const {scene:source}=useGLTF(modelPath(props.drinkId));
 const {camera,size,gl,invalidate,scene}=useThree();
 const expansion=useRef(props.expansion);const moving=useRef(false);const latest=useRef(props);latest.current=props;
 const target=useRef(new THREE.Vector3());const local=useRef(new THREE.Vector3());const projected=useRef(new THREE.Vector3());
 const garnishTilt=useRef(new THREE.Quaternion());const garnishPivot=useRef(new THREE.Vector3());
 const parts=useMemo(()=>{
  const out:Part[]=[];const cloned=source.clone(true);
  cloned.updateMatrixWorld(true);
  cloned.traverse(o=>{if(o instanceof THREE.Mesh){
   let owner:THREE.Object3D|null=o;while(owner&&!owner.userData.scenePartId)owner=owner.parent;
   const data={...owner?.userData,...o.userData};const id=String(data.scenePartId||o.name);
   if(id.startsWith('stage_'))return;
   if(data.role==='recipe')Object.assign(data,recipePresentation(drinkById[props.drinkId],String(data.ingredientId)));
   o.userData=data;o.material=(o.material as THREE.Material).clone();o.geometry.computeBoundingBox();
   if(data.role==='recipe'&&data.illustrationColor&&!data.preserveIllustrationColor)(o.material as THREE.MeshStandardMaterial).color.set(data.illustrationColor);
   const center=o.geometry.boundingBox!.getCenter(new THREE.Vector3());
   const optic=(glassOnly?['glass']:['glass','ice','liquid']).includes(id)?id:null;o.userData.runtimeOptic=optic;
   const ior=(o.material as THREE.MeshPhysicalMaterial).ior||1.5;
   o.matrixWorld.decompose(o.position,o.quaternion,o.scale);
   out.push({mesh:o,base:o.position.clone(),baseRotation:o.quaternion.clone(),baseScale:o.scale.clone(),lift:Number(data.lift||0),role:data.role||'physical',category:data.ingredientId||'structure',center,optic,ior});
  }});
  out.forEach(p=>p.mesh.removeFromParent());
  // Inner optical objects capture before the outer shell. Garnish remains opaque PBR geometry.
  return out.sort((a,b)=>rank(a.optic||'')-rank(b.optic||''));
 },[source,glassOnly,props.drinkId]);
 function rank(n:string){return n==='ice'?1:n==='liquid'?2:n==='glass'?3:0}
 useEffect(()=>()=>{delete window.__atlasViewers?.[props.drinkId];parts.forEach(p=>(p.mesh.material as THREE.Material).dispose())},[parts,props.drinkId]);
 // Controlled inputs mutate Three objects imperatively below, so each change
 // explicitly wakes this Canvas instead of relying on incidental React updates.
 useLayoutEffect(()=>{invalidate()},[invalidate,parts,environment,props.drinkId,props.expansion,props.orbit.azimuth,props.orbit.elevation,props.orbit.zoom,props.selectedCategory,props.comparison,props.active,reduced,size.width,size.height]);
 useEffect(()=>{
  // Wrapped labels can resize after fonts load without a camera or canvas resize.
  const observer=new ResizeObserver(()=>invalidate());
  for(const label of Array.from(labelRail.current?.children||[]))observer.observe(label);
  return ()=>observer.disconnect();
 },[invalidate,labelRail,props.drinkId]);
 const firstDraw=useRef(true);const frameTimes=useRef<number[]>([]);
 useFrame((_,dt)=>{
  const p=latest.current;
  // A demand clock includes the idle interval. Start a new transition at its
  // current pose, then retain the existing damping and delta cap while moving.
  const next=reduced?p.expansion:THREE.MathUtils.damp(expansion.current,p.expansion,7,moving.current?Math.min(dt,.05):0);
  moving.current=Math.abs(next-p.expansion)>.00005;
  const e=expansion.current=moving.current?next:p.expansion;
  for(const part of parts){const {mesh,base,baseRotation,baseScale,lift,role,category}=part;
   const liftProgress=smooth((e-.08)/.86);
   mesh.position.copy(base);mesh.position.y+=lift*liftProgress;
   mesh.quaternion.copy(baseRotation);mesh.scale.copy(baseScale);
   // Thin garnish groups tilt together around their moving center for inspection.
   // The authored pose is restored every frame, so reversals cannot accumulate rotation.
   if(mesh.userData.expandedRotationX&&mesh.userData.expandedPivot){
    garnishTilt.current.setFromAxisAngle(GARNISH_TILT_AXIS,mesh.userData.expandedRotationX*liftProgress);
    garnishPivot.current.fromArray(mesh.userData.expandedPivot);garnishPivot.current.y-=lift*(1-liftProgress);
    mesh.position.sub(garnishPivot.current).applyQuaternion(garnishTilt.current).add(garnishPivot.current);
    mesh.quaternion.premultiply(garnishTilt.current);
   }
   const amount=role==='recipe'?smooth((e-.22)/.5):mesh.userData.assembledOnly?1-smooth((e-.22)/.5):role==='mixture'?1-smooth(e/.54):1;
   mesh.visible=amount>.002;
   if(role==='recipe'){
    mesh.scale.multiplyScalar(Math.max(.001,amount));
    if((espresso||profile)&&!mesh.userData.recipeSolid)mesh.scale.multiply(ESPRESSO_RECIPE_SCALE);
   }
   if(role==='mixture'||mesh.userData.assembledOnly){const material=mesh.material as THREE.MeshPhysicalMaterial;material.opacity=amount;material.transparent=amount<.999;material.depthWrite=amount>.99;}
   if(part.optic==='glass'){
    const material=mesh.material as THREE.MeshPhysicalMaterial & {_transmission?:number};
    // Drei's custom buffer uses _transmission; keep native transmission disabled.
    if(material._transmission!==undefined)material._transmission=THREE.MathUtils.lerp(1,.84,smooth(e));
    material.roughness=THREE.MathUtils.lerp(.018,.085,smooth(e));
    // A transparent hero canvas needs coverage alpha on its outer clear shell;
    // otherwise the offscreen countertop reads as an opaque band over the art.
    if(p.hero){material.transparent=true;material.opacity=.58;material.depthWrite=false;}
   }
   const m=mesh.material as THREE.MeshStandardMaterial;
   if(m.emissive){m.emissive.set(category===p.selectedCategory?'#7b401b':'#000000');m.emissiveIntensity=category===p.selectedCategory?.28:0}
  }
  const assembledTarget=profile?profile.glassHeight/2:p.hero?(HERO_RIMS[p.drinkId]?.height??2.2)/2+.1:1.28;
  target.current.set(0,THREE.MathUtils.lerp(assembledTarget,profile?.expandedTarget??4.65,smooth(e)),0);
  const distance=THREE.MathUtils.lerp(profile?.cameraDistance??(espresso?7.1:6.85),profile?.expandedDistance??17.4,smooth(e))/clamp(p.orbit.zoom,.65,1.8);
  const elevation=clamp(p.orbit.elevation,-.03,1.15);const horizontal=distance*Math.cos(elevation);
  const rim=profile?{height:profile.glassHeight,ratio:profile.rimRatio}:espresso?{height:2.42,ratio:.23}:p.comparison?{height:2.26,ratio:.18}:HERO_RIMS[p.drinkId];
  const heroY=rim.height+horizontal*Math.tan(clamp(Math.asin(rim.ratio)+elevation-.16,-.25,1.2));
  const expandedY=target.current.y+distance*Math.sin(elevation);
  camera.position.set(horizontal*Math.sin(p.orbit.azimuth),THREE.MathUtils.lerp(heroY,expandedY,smooth(e)),horizontal*Math.cos(p.orbit.azimuth));
  camera.lookAt(target.current);camera.updateMatrixWorld();
  // Keep label text in screen space; project actual mesh centers, then resolve rail collisions.
  if(labelRail.current){
   const candidates:Array<{el:HTMLElement;x:number;y:number;height:number;right:number;top:number;category:string;visible:boolean}>=[];
   for(const el of Array.from(labelRail.current.children) as HTMLElement[]){
    const cat=el.dataset.category!;const matches=parts.filter(q=>q.category===cat && q.mesh.visible && !q.mesh.name.startsWith('ice_inclusion'));
    if(!matches.length){el.style.opacity='0';el.style.pointerEvents='none';continue}
    local.current.set(0,0,0);let count=0;
    for(const q of matches){q.mesh.updateWorldMatrix(true,false);projected.current.copy(q.center);q.mesh.localToWorld(projected.current);local.current.add(projected.current);count++}
    local.current.divideScalar(count);projected.current.copy(local.current).project(camera);
    candidates.push({el,x:(projected.current.x*.5+.5)*size.width,y:(-.5*projected.current.y+.5)*size.height,height:el.offsetHeight,right:el.offsetLeft+el.offsetWidth,top:0,category:cat,visible:projected.current.z>-1&&projected.current.z<1&&Math.abs(projected.current.x)<1.1});
   }
   candidates.sort((a,b)=>a.y-b.y);let edge=48;
   // Fit actual label boxes, then pull any overflow up from the bottom edge.
   // Center spacing alone lets three-line ingredient names cover their neighbors.
   for(const c of candidates){c.top=Math.max(c.y-c.height/2,edge);edge=c.top+c.height+8}
   edge=size.height-44;
   for(let i=candidates.length-1;i>=0;i--){const c=candidates[i];c.top=Math.min(c.top,edge-c.height);edge=c.top-8}
   for(const c of candidates){const y=c.top+c.height/2;c.el.style.transform=`translate3d(0,${c.top}px,0)`;c.el.style.opacity=c.visible?String(smooth((e-.48)/.32)):'0';c.el.style.pointerEvents=e>.65?'auto':'none';
    const line=lines.current?.querySelector(`[data-category="${c.category}"]`);if(line){line.setAttribute('d',`M ${c.right} ${y} L ${c.right+12} ${y} L ${c.x.toFixed(1)} ${c.y.toFixed(1)}`);line.setAttribute('opacity',c.visible?String(smooth((e-.5)/.35)*.6):'0')}
   }
  }
  if(dt<.5&&dt>0){frameTimes.current.push(dt*1000);if(frameTimes.current.length>1200)frameTimes.current.shift()}
  if(moving.current)invalidate();
 });
 // Priority 2 runs after OpticalPipeline's successful priority-1 draw. Count
 // completed viewer frames, including one-off wakeups, without requesting any.
 useFrame(()=>{
  const p=latest.current;const frame=++renderedFrames.current;const renderedAt=performance.now();
  window.__atlasViewers??={};const previous=window.__atlasViewers[p.drinkId];
  if(firstDraw.current||!previous||!moving.current||frame%5===0){
   const stageUniforms=scene.getObjectByName('somma-inspired-stone-surface')?.userData.stageUniforms;
   window.__atlasViewers[p.drinkId]={e:expansion.current,parts:parts.map(q=>{const material=q.mesh.material as THREE.MeshStandardMaterial;return {id:q.mesh.name,position:q.mesh.position.toArray(),rotation:q.mesh.quaternion.toArray(),scale:q.mesh.scale.toArray(),visible:q.mesh.visible,role:q.role,category:q.category,representation:q.mesh.userData.representation,evidence:q.mesh.userData.evidence,normalMap:normalMapSize(material),emissive:material.emissive?.getHexString()??null,emissiveIntensity:material.emissiveIntensity??null}}),camera:{...p.orbit,target:target.current.toArray(),position:camera.position.toArray(),fov:(camera as THREE.PerspectiveCamera).fov},frameTimes:frameTimes.current,renderedFrames:frame,renderedAt,ready:true,stage:{backgroundBlurriness:scene.backgroundBlurriness,backgroundIntensity:scene.backgroundIntensity,environmentIntensity:scene.environmentIntensity,stoneStrength:stageUniforms?.stoneTextureStrength?.value??null,stoneMipBias:stageUniforms?.stoneMipBias?.value??null}};
  }else{previous.renderedFrames=frame;previous.renderedAt=renderedAt}
  if(firstDraw.current){firstDraw.current=false;onReady()}
 },2);
 return <group>{parts.map(({mesh,role,optic,ior,category})=>{
  const name=optic||mesh.name;const optics=!!optic;
  return <primitive key={mesh.uuid} object={mesh} onClick={(ev:{stopPropagation:()=>void;delta:number})=>{if(ev.delta<4){ev.stopPropagation();latest.current.onSelectCategory?.(mesh.userData.ingredientId)}}}>
   {optics?<MeshTransmissionMaterial envMap={environment} envMapRotation={BAR_ROTATION} envMapIntensity={props.hero?.3:1} samples={4} resolution={Math.min(1400,Math.ceil(Math.max(size.width,size.height)*gl.getPixelRatio()))} buffer={buffers[name==='ice'?0:name==='liquid'?1:2].texture} thickness={name==='glass'?.055:name==='ice'?1.35:1.65} roughness={name==='glass'?.018:.035} ior={ior} color="#ffffff" attenuationColor={name==='liquid'?(profile?.liquidColor??COLORS[props.drinkId]??drink.color):'#ffffff'} attenuationDistance={name==='liquid'?1.7:Infinity} transmission={1} chromaticAberration={.001} distortion={0} temporalDistortion={0} anisotropicBlur={0} side={THREE.FrontSide}/>:null}
   {role==='recipe'&&!mesh.userData.recipeSolid?<meshPhysicalMaterial color={(mesh.material as THREE.MeshStandardMaterial).color} roughness={mesh.userData.representation==='unknown-placeholder'?.38:.22} transmission={mesh.userData.representation==='unknown-placeholder'?.12:category==='spirit'?.38:category==='coffee'?.02:.22} thickness={.6} ior={1.36}/>:null}
  </primitive>
 })}</group>
}
function OpticalPipeline({buffers,hero=false}:{buffers:THREE.WebGLRenderTarget[];hero?:boolean}){
 const baseline=useMemo(()=>new URLSearchParams(location.search).get('pipeline')==='baseline',[]);
 const sourceCamera=useThree(state=>state.camera);
 // Three caches native transmission targets by camera identity. Fractional
 // layout sizes give our capture a ceil-sized viewport and the canvas a
 // floor-sized viewport. Separate persistent identities preserve both exact
 // raster sizes without resizing/reallocating that native target twice/frame.
 const captureCamera=useMemo(()=>sourceCamera.clone() as THREE.Camera,[sourceCamera]);
 const copy=useMemo(()=>{
  const material=new THREE.ShaderMaterial({
   uniforms:{colorBuffer:{value:null},depthBuffer:{value:null}},
   depthTest:true,depthFunc:THREE.AlwaysDepth,depthWrite:true,
   vertexShader:'varying vec2 vUV;void main(){vUV=uv;gl_Position=vec4(position.xy,0.,1.);}',
   fragmentShader:`uniform sampler2D colorBuffer;uniform sampler2D depthBuffer;varying vec2 vUV;
    void main(){gl_FragColor=texture2D(colorBuffer,vUV);gl_FragDepth=texture2D(depthBuffer,vUV).r;
    if(gl_FragDepth<.9999999){
    #include <tonemapping_fragment>
    }
    #include <colorspace_fragment>
    }`
  });
  const geometry=new THREE.PlaneGeometry(2,2);const scene=new THREE.Scene();scene.add(new THREE.Mesh(geometry,material));
  return {scene,material,geometry,camera:new THREE.Camera()};
 },[]);
 useEffect(()=>()=>{copy.geometry.dispose();copy.material.dispose()},[copy]);
 useFrame(({gl,scene,camera})=>{
  const names=['ice','liquid','glass'];const groups=names.map(()=>[] as THREE.Mesh[]);const meshes:THREE.Mesh[]=[];
  scene.traverse(o=>{if(o instanceof THREE.Mesh){meshes.push(o);if(o.userData.runtimeOptic){const i=names.indexOf(o.userData.runtimeOptic);if(i>=0)groups[i].push(o)}}});
  if(!groups[2].length){gl.render(scene,camera);return}
  const visible=new Map(meshes.map(m=>[m,m.visible]));const tone=gl.toneMapping;const rt=gl.getRenderTarget();const autoClear=gl.autoClear;const background=scene.background;
  try{
   // Opaque coffee and foam need only a glass capture. Stemmed drinks have no
   // ice family: populate the shell buffer before sampling it on the display.
   if(!groups[0].length&&!groups[1].length){
    captureCamera.copy(camera,false);
    groups[2].forEach(m=>m.visible=false);gl.toneMapping=THREE.NoToneMapping;gl.autoClear=true;
    gl.setRenderTarget(buffers[2]);gl.render(scene,captureCamera);
    groups[2].forEach(m=>m.visible=visible.get(m)!);
    gl.setRenderTarget(rt);gl.toneMapping=tone;gl.render(scene,camera);return;
   }
   if(baseline){
    groups.flat().forEach(m=>m.visible=false);gl.toneMapping=THREE.NoToneMapping;gl.autoClear=true;
    for(let i=0;i<3;i++){gl.setRenderTarget(buffers[i]);gl.render(scene,camera);groups[i].forEach(m=>m.visible=visible.get(m)!)}
    gl.setRenderTarget(rt);gl.toneMapping=tone;gl.render(scene,camera);return;
   }
   // Shade opaque geometry once. Subsequent passes preserve its exact color and
   // depth, adding one optical family instead of redrawing all earlier families.
   captureCamera.copy(camera,false);
   (captureCamera as THREE.Camera & {viewport?:THREE.Vector4}).viewport=(camera as THREE.Camera & {viewport?:THREE.Vector4}).viewport;
   groups.flat().forEach(m=>m.visible=false);gl.toneMapping=THREE.NoToneMapping;gl.autoClear=true;
   gl.setRenderTarget(buffers[0]);gl.render(scene,captureCamera);
   meshes.forEach(m=>m.visible=false);scene.background=null;gl.autoClear=false;
   for(let i=0;i<2;i++){
    gl.setRenderTarget(buffers[i+1]);gl.clear(true,true,false);
    copy.material.uniforms.colorBuffer.value=buffers[i].texture;copy.material.uniforms.depthBuffer.value=buffers[i].depthTexture;
    gl.render(copy.scene,copy.camera);
    groups[i].forEach(m=>m.visible=visible.get(m)!);gl.render(scene,camera);groups[i].forEach(m=>m.visible=false);
   }
   // The final scene retains Three's normal fog/output-color ordering and MSAA.
   // Intermediate targets stay linear; copying a fogged target to the display
   // would move fog before tone mapping and visibly change the background.
   meshes.forEach(m=>m.visible=visible.get(m)!);scene.background=hero?null:background;gl.autoClear=true;
   // Keep the original setting inside the optical captures and reflections.
   // Only the final outer stage is transparent for the landing artwork.
   if(hero){const counter=scene.getObjectByName('somma-inspired-stone-surface');if(counter)counter.visible=false;}
   gl.setRenderTarget(rt);gl.toneMapping=tone;gl.render(scene,camera);
  }finally{meshes.forEach(m=>m.visible=visible.get(m)!);scene.background=background;gl.toneMapping=tone;gl.autoClear=autoClear;gl.setRenderTarget(rt)}
 },1);
 return null;
}
type SceneProps={viewer:ViewerProps;rail:RefObject<HTMLDivElement|null>;lines:RefObject<SVGSVGElement|null>;onReady:()=>void;reduced:boolean;renderedFrames:RefObject<number>};
function Scene(props:SceneProps){
 const environment=useBarEnvironment();
 return <SceneContents {...props} environment={environment}/>;
}
function HeroScene(props:SceneProps){
 const environment=useEnvironment({files:'/textures/studio_small_09_2k.hdr'});
 return <SceneContents {...props} environment={environment}/>;
}
function SceneContents(props:SceneProps & {environment:THREE.Texture}){
 const {environment}=props;
 const {size,gl}=useThree();const width=Math.ceil(size.width*gl.getPixelRatio()),height=Math.ceil(size.height*gl.getPixelRatio());
 const drink=drinkById[props.viewer.drinkId];const glassOnly=(drink.renderProfile?.optics??(drink.family==='espresso-martini'?'glass':'layered'))==='glass';
 const iceBuffer=useFBO(glassOnly?1:width,glassOnly?1:height,{type:THREE.HalfFloatType,depthBuffer:true});const liquidBuffer=useFBO(glassOnly?1:width,glassOnly?1:height,{type:THREE.HalfFloatType,depthBuffer:true});const glassBuffer=useFBO(width,height,{type:THREE.HalfFloatType,depthBuffer:true});const buffers=[iceBuffer,liquidBuffer,glassBuffer];
 return <>
  <BarLighting/>
  <BarEnvironment map={environment} expansion={props.viewer.expansion} reduced={props.reduced} backgroundIntensity={props.viewer.hero?.14:undefined} environmentIntensity={props.viewer.hero?.5:1}/>
  <BarCountertop expansion={props.viewer.expansion} reduced={props.reduced} color={props.viewer.hero?'#6d686e':undefined} textureStrength={props.viewer.hero?.035:undefined}/>
  
  <Model props={props.viewer} labelRail={props.rail} lines={props.lines} onReady={props.onReady} reduced={props.reduced} buffers={buffers} environment={environment} renderedFrames={props.renderedFrames}/>
  <OpticalPipeline buffers={buffers} hero={props.viewer.hero}/>
 </>
}
function LegacyViewer(props:ViewerProps){
 const {drinkId}=props;const drink=drinkById[drinkId];const rail=useRef<HTMLDivElement>(null);const lines=useRef<SVGSVGElement>(null);const host=useRef<HTMLDivElement>(null);const [attempt,setAttempt]=useState(0);const [ready,setReady]=useState(false);
 const visible=useViewerVisibility(host);
 // Retain a monotonic count across model retries within this mounted viewer.
 const renderedFrames=useRef(0);
 const [supported]=useState(()=>{if(new URLSearchParams(location.search).get('webgl')==='off')return false;try{const c=document.createElement('canvas');const g=c.getContext('webgl2');if(!g)return false;g.getExtension('WEBGL_lose_context')?.loseContext();return true}catch{return false}});
 useEffect(()=>{props.onSupportChange?.(supported)},[props.onSupportChange,supported]);
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);useEffect(()=>{const mq=matchMedia('(prefers-reduced-motion: reduce)');const change=()=>setReduced(mq.matches);mq.addEventListener('change',change);return()=>mq.removeEventListener('change',change)},[]);
 const latest=useRef(props);latest.current=props;const down=useRef<{x:number;y:number;orbit:Orbit;travel:number;id:number}|null>(null);const lastTravel=useRef(0);
 const onReady=useMemo(()=>()=>setReady(true),[]);
 const labels=drink.ingredients;const categories=categoriesForFamily(drink.family);
 function orbitBy(az=0,el=0,zoom=0){const p=latest.current;p.onOrbitChange({...p.orbit,azimuth:p.orbit.azimuth+az,elevation:clamp(p.orbit.elevation+el,-.03,1.15),zoom:clamp(p.orbit.zoom+zoom,.65,1.8)})}
 return <div ref={host} className={`cocktail-viewer ${props.comparison?'is-comparison':''} ${props.hero?'is-hero':''} ${ready?'is-live':''}`} data-testid={`viewer-${drinkId}`} data-live={ready?'true':'false'} data-render-active={visible&&props.active!==false?'true':'false'} tabIndex={0} role="group" aria-label={`${drink.name} interactive 3D viewer`}
  onPointerDown={ev=>{if((ev.target as HTMLElement).closest('button'))return;down.current={x:ev.clientX,y:ev.clientY,orbit:{...props.orbit},travel:0,id:ev.pointerId};}}
  onPointerMove={ev=>{const d=down.current;if(!d)return;const dx=ev.clientX-d.x,dy=ev.clientY-d.y;d.travel=Math.hypot(dx,dy);if(d.travel>5){ev.currentTarget.setPointerCapture(ev.pointerId);props.onOrbitChange({...d.orbit,azimuth:d.orbit.azimuth-dx*.009,elevation:clamp(d.orbit.elevation+(ev.pointerType==='touch'?0:dy*.005),-.03,1.15)})}}}
  onPointerUp={()=>{lastTravel.current=down.current?.travel||0;down.current=null}}
  onPointerCancel={()=>{down.current=null}}
  onDoubleClick={ev=>{if(!(ev.target as HTMLElement).closest('button')&&lastTravel.current<5)props.onExpansionChange(props.expansion>.5?0:1)}}
  onKeyDown={ev=>{if(ev.target!==ev.currentTarget)return;const f:Record<string,()=>void>={ArrowLeft:()=>orbitBy(-.2),ArrowRight:()=>orbitBy(.2),ArrowUp:()=>orbitBy(0,.1),ArrowDown:()=>orbitBy(0,-.1),'+':()=>orbitBy(0,0,.1),'-':()=>orbitBy(0,0,-.1),' ':()=>props.onExpansionChange(props.expansion>.5?0:1)};if(f[ev.key]){ev.preventDefault();f[ev.key]()}}}>
  {!ready&&drink.family==='negroni'?<img className="viewer-poster" src={props.hero?`/posters/${drinkId}${drinkId==='bbf-negroni'?'-loading':'-hero'}.png`:drink.assets.poster} alt="" aria-hidden="true"/>:null}
  {supported&&!ready?<Loading/>:null}
  {supported?<ModelBoundary key={`${drinkId}-${attempt}`} onRetry={()=>{useGLTF.clear(modelPath(drinkId));setReady(false);setAttempt(n=>n+1)}}>
   <Canvas frameloop={visible && props.active !== false?'demand':'never'} camera={{fov:35,near:.08,far:250}} dpr={[1,props.comparison?1:1.5]} gl={{antialias:true,alpha:!!props.hero,preserveDrawingBuffer:modelQuery.get('posterCapture')==='1',powerPreference:'high-performance',toneMapping:THREE.ACESFilmicToneMapping}} onCreated={({gl})=>{gl.toneMappingExposure=1.1;gl.setClearColor('#2C2A2D',props.hero?0:1);gl.domElement.setAttribute('aria-hidden','true')}}>
    <Suspense fallback={null}>{props.hero?<HeroScene viewer={props} rail={rail} lines={lines} onReady={onReady} reduced={reduced} renderedFrames={renderedFrames}/>:<Scene viewer={props} rail={rail} lines={lines} onReady={onReady} reduced={reduced} renderedFrames={renderedFrames}/>}</Suspense>
   </Canvas>
  </ModelBoundary>:<div className="viewer-fallback" role="status"><p>Interactive 3D is unavailable in this browser.</p><span>You can still explore every ingredient, compare the recipes, and find the bars.</span></div>}
  <svg ref={lines} className="ingredient-leaders" aria-hidden="true">{labels.map(i=><path key={i.category} data-category={i.category} fill="none" stroke="currentColor" strokeWidth=".75" opacity="0"/>)}</svg>
  <div ref={rail} className="ingredient-labels" aria-hidden={props.expansion<=.65}>{labels.map((i)=><button key={i.category} data-category={i.category} data-evidence={i.evidence} style={{opacity:0}} aria-pressed={props.selectedCategory===i.category} tabIndex={props.expansion>.65?0:-1} onClick={()=>props.onSelectCategory?.(i.category)} onFocus={()=>props.onSelectCategory?.(i.category)} onMouseEnter={()=>props.onSelectCategory?.(i.category)}><span>{categories.findIndex(c=>c.id===i.category)+1}</span>{ingredientDisplayName(i)}</button>)}</div>
  {supported?<><div className="viewer-zoom"><button aria-label="Zoom in" onClick={()=>orbitBy(0,0,.15)}><Plus size={17}/></button><button aria-label="Zoom out" onClick={()=>orbitBy(0,0,-.15)}><Minus size={17}/></button></div><span className="viewer-input-hint">Drag to rotate · <span className="desktop-hint">double-click to {props.expansion>.5?'reassemble':'expand'}</span><span className="touch-hint">swipe horizontally</span></span></>:null}
 </div>
}
export function Viewer(props:ViewerProps){
 const variant=useMemo(()=>{
  const base=classicVariant(props.drinkId);if(!base)return null;
  const drink=drinkById[props.drinkId];
  // Keep the current Atlas ingredient evidence while reusing the source scene.
  const liquidLabels=base.liquidLabels.map((fallback,index)=>{
   const ingredient=drink.ingredients.find(item=>item.category===['spirit','bitter','vermouth'][index]);
   return ingredient?ingredientDisplayName(ingredient):fallback;
  }) as typeof base.liquidLabels;
  return {...base,liquidLabels};
 },[props.drinkId]);
 // Keep the existing diagnostic model routes and explicit no-WebGL fallback.
 const legacyRequested=modelQuery.get('webgl')==='off'||modelQuery.has('assetCandidate')||modelQuery.has('interfaces');
 return variant&&!legacyRequested?<ClassicVariantViewer key={props.drinkId} {...props} variant={variant}/>:<LegacyViewer {...props}/>;
}
export default Viewer;
