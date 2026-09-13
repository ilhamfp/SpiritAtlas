import {useMemo} from 'react';
import * as THREE from 'three';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';

/** Soft, off-camera bar lights give clear glass a readable reflected edge. */
export function BarLighting(){
 const lights=useMemo(()=>{
  // Matched diagnostic switch isolates the cost of the soft reflection lights.
  // Capture once so URL updates during interaction do not change the pipeline.
  if(new URLSearchParams(location.search).get('areaLights')==='off')return [];
  RectAreaLightUniformsLib.init();
  const key=new THREE.RectAreaLight('#fff3df',5,.65,5);
  key.position.set(-4,3,2);key.lookAt(0,1.2,0);
  const fill=new THREE.RectAreaLight('#e5edff',3,.45,4);
  fill.position.set(3,2.8,-1);fill.lookAt(0,1.2,0);
  return [key,fill];
 },[]);
 return <group name="bar-soft-edge-lighting">
  <ambientLight intensity={.15}/>
  <directionalLight position={[-3,5,3]} intensity={.7} color="#fff1dc"/>
  <directionalLight position={[3,4,-3]} intensity={.45} color="#d9e5fb"/>
  {lights.map(light=><primitive key={light.uuid} object={light}/>)}
 </group>;
}
