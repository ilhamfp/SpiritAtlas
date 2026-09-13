import { Suspense, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BarCountertop, BarEnvironment, useBarEnvironment } from '../../src/scenes/BarEnvironment';

declare global { interface Window { __stageDemandProbe?: { renderedFrames:number; renderedAt:number; blur:number; intensity:number; environment:number; strength:number|null; mipBias:number|null }; } }
function Stage({blur,intensity,strength,reduced}:{blur:number;intensity:number;strength:number;reduced:boolean}) {
  const map=useBarEnvironment(),frames=useRef(0);
  // There is deliberately no Model or parent animation invalidator in this fixture.
  useFrame(({gl,scene,camera})=>{
    gl.render(scene,camera);
    const uniforms=scene.getObjectByName('somma-inspired-stone-surface')?.userData.stageUniforms;
    window.__stageDemandProbe={renderedFrames:++frames.current,renderedAt:performance.now(),blur:scene.backgroundBlurriness,intensity:scene.backgroundIntensity,environment:scene.environmentIntensity,strength:uniforms?.stoneTextureStrength.value??null,mipBias:uniforms?.stoneMipBias.value??null};
  },1);
  return <><BarEnvironment map={map} expansion={0} backgroundBlurriness={blur} backgroundIntensity={intensity} reduced={reduced}/><BarCountertop expansion={0} textureStrength={strength} reduced={reduced}/><ambientLight intensity={1}/></>;
}
function Harness(){
  const [blur,setBlur]=useState(.05),[intensity,setIntensity]=useState(.6),[strength,setStrength]=useState(.16),[reduced,setReduced]=useState(false);
  return <><div style={{display:'flex',gap:12,padding:12}}><button onClick={()=>{setBlur(.13);setIntensity(.28);}}>Change background only</button><button onClick={()=>setStrength(.07)}>Change stone only</button><button onClick={()=>{setReduced(true);setBlur(.08);setIntensity(.5);setStrength(.11);}}>Reduced stage change</button></div><div style={{width:700,height:480}}><Canvas frameloop="demand" dpr={1} camera={{position:[0,3,6],fov:35}} gl={{toneMapping:THREE.ACESFilmicToneMapping}}><Suspense fallback={null}><Stage blur={blur} intensity={intensity} strength={strength} reduced={reduced}/></Suspense></Canvas></div></>;
}
createRoot(document.getElementById('root')!).render(<Harness/>);
