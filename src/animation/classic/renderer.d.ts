import type * as THREE from 'three';
export interface OrbitState {azimuth:number;elevation:number;zoom:number}
export interface Garnish {group:THREE.Group;update(state?:{progress?:number;time?:number;dt?:number}):void;anchors:{ice:THREE.Vector3;orange:THREE.Vector3};setCitrusTexture?:(color:THREE.Texture|null,height?:THREE.Texture|null)=>void}
export interface ProjectedAnchor {x:number;y:number;visible:boolean}
export interface RenderFrame {progress:number;rigProgress:number;renderedFrames:number;renderedAt:number;fps:number|null;anchors:Record<string,ProjectedAnchor>}
export interface NegroniRendererOptions {
 id?:string;label?:string;palette?:{mixtureColor?:string;liquidColors?:readonly string[]};
 garnishFactory?:(three:typeof THREE,createClassic:(three:typeof THREE)=>Garnish)=>Garnish;
 maxPixelRatio?:number;reducedMotion?:boolean;onReady?:()=>void;onError?:(error:unknown)=>void;
 onOrbit?:()=>void;onOrbitChange?:(orbit:OrbitState)=>void;onFrame?:(frame:RenderFrame)=>void;signal?:AbortSignal;
}
export interface NegroniRenderer {
 readonly state:{progress:number;rigProgress:number;renderedFrames:number;fps:number|null;visible:boolean;disposed:boolean};
 setPose(progress:number,rigProgress?:number):void;rotate(delta:number):void;resetCamera():void;
 setOrbit(orbit:OrbitState):void;getOrbit():OrbitState;getAnchors():Record<string,ProjectedAnchor>;
 setVisible(visible:boolean):void;setReducedMotion(reducedMotion:boolean):void;dispose():void;
}
export function createNegroniRenderer(container:HTMLElement,options?:NegroniRendererOptions):Promise<NegroniRenderer>;
