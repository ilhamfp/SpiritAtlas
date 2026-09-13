import type * as Three from 'three';
export type GarnishVariantId='bbf-negroni'|'ichigo-negroni'|'negroni-express';
export interface ClassicGarnish {
  group:Three.Group;
  update(state?:{progress?:number;time?:number;dt?:number}):void;
  anchors:{ice:Three.Vector3;orange:Three.Vector3};
  colliders?:Array<{center:number[];radius:number}>;
  setCitrusTexture?(texture:Three.Texture|null,heightTexture?:Three.Texture|null):void;
}
export function createVariantAccent(THREE:typeof Three,id:string):Three.Group|null;
export function createVariantGarnish(THREE:typeof Three,id:string,
  createClassicGarnish:(THREE:typeof Three)=>ClassicGarnish):ClassicGarnish;
