import {sha256Bytes} from './droplet-mask.js';

export async function loadCachedFluid({signal,fetchImpl=globalThis.fetch}={}){
  const [metadataBytes,data]=await Promise.all([
    fetchImpl('/classic-negroni/simulation/negroni.json',{signal}).then(r=>{if(!r.ok)throw new Error('Fluid manifest unavailable');return r.arrayBuffer();}),
    fetchImpl('/classic-negroni/simulation/negroni.bin',{signal}).then(r=>{if(!r.ok)throw new Error('Fluid cache unavailable');return r.arrayBuffer();}),
  ]);
  const meta=JSON.parse(new TextDecoder().decode(metadataBytes));
  const [sourceCacheSha256,sourceCacheMetadataSha256]=await Promise.all([sha256Bytes(data),sha256Bytes(metadataBytes)]);
  signal?.throwIfAborted();
  const frames=new Int16Array(data),stride=meta.count*3;
  if(frames.length!==meta.frameCount*stride)throw new Error('Fluid cache size mismatch');
  const positions=new Float32Array(stride),velocities=new Float32Array(stride),ids=new Uint8Array(meta.ids);
  const cache={...meta,sourceCacheSha256,sourceCacheMetadataSha256,positions,velocities,ids,progress:0,rigProgress:0,baked:true,
    update(progress){
      const p=Math.max(0,Math.min(1,progress)),f=p*(meta.frameCount-1),a=Math.floor(f),b=Math.min(meta.frameCount-1,a+1),t=f-a;
      const velocityA=a===meta.frameCount-1?a-1:a;
      for(let i=0;i<stride;i++){const x=frames[a*stride+i]/meta.quantization,y=frames[b*stride+i]/meta.quantization;positions[i]=x+(y-x)*t;velocities[i]=(y-frames[velocityA*stride+i]/meta.quantization)*meta.fps;}
      cache.progress=p;cache.rigProgress=meta.phases[a]+(meta.phases[b]-meta.phases[a])*t;return cache;
    },reset(){return cache.update(0);},get state(){return {method:'Cached Position Based Fluids',...meta.simulation,particles:meta.count,progress:cache.progress};},
  };
  cache.reset();return cache;
}
