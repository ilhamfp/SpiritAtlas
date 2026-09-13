import {clamp} from './model';

export const LIQUID_BOTTOM=.14, LIQUID_RIM=1.775, LIQUID_RADIUS=.963;
// Equal-area samples integrate a clipped free surface without changing authored quantities.
const disk=Array.from({length:96},(_,i)=>{const r=LIQUID_RADIUS*Math.sqrt((i+.5)/96),a=i*2.399963229728653;return [r*Math.cos(a),r*Math.sin(a)];});
export function surfaceIntercept(level:number,slopeX:number,slopeZ=0){
 const spread=LIQUID_RADIUS*Math.hypot(slopeX,slopeZ);let low=LIQUID_BOTTOM-spread,high=LIQUID_RIM+spread;
 for(let j=0;j<16;j++){const h=(low+high)/2;let sum=0;for(const [x,z] of disk)sum+=clamp(h+slopeX*x+slopeZ*z,LIQUID_BOTTOM,LIQUID_RIM);if(sum/disk.length<level)low=h;else high=h;}
 return (low+high)/2;
}
export function strainAngle(input:number,level:number){
 if(input<=0)return 0;
 // As the drink empties, rotate farther so the remaining liquid can reach the lip.
 let low=0,high=1.48;
 for(let j=0;j<12;j++){const a=(low+high)/2,slope=Math.tan(a);let sum=0;for(const [x] of disk)sum+=clamp(LIQUID_RIM+slope*(x-LIQUID_RADIUS),LIQUID_BOTTOM,LIQUID_RIM);if(sum/disk.length>level)low=a;else high=a;}
 return Math.min(1.48,(low+high)/2+.018+clamp((input-.2)/.8,0,1)*.12)*clamp(input/.2,0,1);
}
