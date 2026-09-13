export const ICE_SPECS=[
  {size:[.60,.60,.59],origin:[-.345,1.39,.23],rotation:[.035,.12,-.035],destination:[-1.82,1.64,.35],turn:[.25,-.55,-.24]},
  {size:[.61,.60,.59],origin:[.345,1.42,.22],rotation:[-.04,-.10,.045],destination:[-1.48,2.25,.04],turn:[-.17,.48,.24]},
  {size:[.60,.62,.60],origin:[0,1.43,-.43],rotation:[.035,.025,-.03],destination:[-1.98,2.88,.24],turn:[.35,-.2,-.33]},
];
const clamp=v=>Math.min(1,Math.max(0,v));
const smooth=v=>{const t=clamp(v);return t*t*t*(t*(t*6-15)+10);};
const lerp=(a,b,t)=>a+(b-a)*t;
export function sampleIcePosition(index,p,out=[0,0,0]){
  const spec=ICE_SPECS[index],start=spec.origin,end=spec.destination;
  const departure=[.40,.21,.035][index],liftEnd=[.63,.44,.23][index];
  const traverseEnd=[.83,.66,.45][index],finish=[1,.92,.79][index];
  const clear=2.95,depth=index===2?.12:1.00;
  out[0]=start[0];out[1]=start[1];out[2]=start[2];
  if(p<=liftEnd)out[1]=lerp(start[1],clear,smooth((p-departure)/(liftEnd-departure)));
  else if(p<=traverseEnd){const t=smooth((p-liftEnd)/(traverseEnd-liftEnd));out[0]=lerp(start[0],end[0],t);out[1]=clear+Math.sin(Math.PI*t)*(index===2?.20:.44);out[2]=lerp(start[2],end[2]+depth,t);}
  else{const t=clamp((p-traverseEnd)/(finish-traverseEnd));out[0]=end[0];out[1]=lerp(clear,end[1],smooth(t/.67));out[2]=end[2]+depth*(1-smooth((t-.55)/.45));}
  return out;
}
