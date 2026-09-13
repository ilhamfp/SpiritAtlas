import {useEffect, useRef} from 'react';
// The generated image is continuous tone. This separate coverage mask uses a
// fixed 5-CSS-pixel lattice: resizing recomposes it, time never changes its seed.
const BAYER = [0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
export default function Marble(){
 const ref=useRef<HTMLCanvasElement>(null);
 useEffect(()=>{
  const canvas=ref.current!; let disposed=false;
  let loadedSrc='';let texture:HTMLImageElement|null=null;
  function draw(){
   const {width:w,height:h}=canvas.getBoundingClientRect();if(!w||!h||!texture)return;
   const dpr=Math.min(devicePixelRatio,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
   const ctx=canvas.getContext('2d')!;ctx.scale(dpr,dpr);
   const mobile=w<650;
   const scale=Math.max(w/texture.width,h/texture.height);
   ctx.drawImage(texture,(w-texture.width*scale)/2,(h-texture.height*scale)/2,texture.width*scale,texture.height*scale);
   ctx.globalCompositeOperation='destination-in';ctx.beginPath();
   const pitch=5;
   for(let y=0,row=0;y<h;y+=pitch,row++)for(let x=0,col=0;x<w;x+=pitch,col++){
    const u=x/w,v=y/h;
    const boundary=mobile ? .46+.065*Math.sin(v*12) : .68-.20*v+.08*Math.sin(v*7);
    const edge=mobile ? Math.max((v-.41)/.22,(Math.abs(u-.5)-.34)/.1) : (u-boundary)/.19;
    const coverage=Math.max(0,Math.min(1,edge));
    if(coverage>=.985)ctx.rect(x,y,pitch,pitch);
    else if(coverage>(BAYER[(row%4)*4+col%4]+.5)/16){const size=2.4+coverage*1.7;ctx.rect(x+(pitch-size)/2,y+(pitch-size)/2,size,size)}
   }
   ctx.fill();ctx.globalCompositeOperation='source-over';
  }
  const observer=new ResizeObserver(()=>{
   if (!canvas.clientWidth || !canvas.clientHeight) return;
   const src=canvas.clientWidth<650?'/textures/spiritatlas-marble-base-mobile-v1.webp':'/textures/spiritatlas-marble-base-desktop-v1.webp';
   if(src!==loadedSrc){loadedSrc=src;const img=new Image();img.onload=()=>{if(!disposed){texture=img;draw()}};img.src=src}else draw();
  });observer.observe(canvas);
  return ()=>{disposed=true;observer.disconnect()};
 },[]);
 return <canvas ref={ref} className="sa-marble" aria-hidden="true"/>;
}
