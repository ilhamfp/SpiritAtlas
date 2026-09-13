// Scalar float32 mirror for the opt-in shader experiment. It deliberately does
// not emulate GPU contraction/reassociation. BigInt is used only to reproduce
// the shader's integer edge fallback, not to improve the ordinary float path.
const f=Math.fround, bits=new DataView(new ArrayBuffer(4));
const add=(a,b)=>f(a+b),mul=(a,b)=>f(a*b),sub=(a,b)=>f(a-b),div=(a,b)=>f(a/b);
export const dot=(a,b)=>add(add(mul(a[0],b[0]),mul(a[1],b[1])),mul(a[2],b[2]));
export const cross=(a,b)=>[sub(mul(a[1],b[2]),mul(a[2],b[1])),sub(mul(a[2],b[0]),mul(a[0],b[2])),sub(mul(a[0],b[1]),mul(a[1],b[0]))];
export const normalize=a=>{const length=f(Math.sqrt(dot(a,a)));return a.map(x=>div(x,length));};
const subtract=(a,b)=>a.map((x,i)=>sub(x,b[i]));
export const gamma=n=>div(mul(n,2**-24),sub(1,mul(n,2**-24)));
const floatBits=x=>{bits.setFloat32(0,x);return bits.getUint32(0);};
const fromBits=x=>{bits.setUint32(0,x);return bits.getFloat32(0);};
export function nextFloat(x,up){x=f(x);if(x===0)return fromBits(up?1:0x80000001);return fromBits(floatBits(x)+((x>0)===up?1:-1));}
export function exactZeroEdge(a,b,c,d){
 const u=[a,b,c,d].map(floatBits),abs=u.map(x=>x&0x7fffffff),exponents=abs.map(x=>x>>>23);
 if(abs.includes(0)||exponents.includes(0))return sub(mul(a,b),mul(c,d));
 const ep=exponents[0]+exponents[1]-300,eq=exponents[2]+exponents[3]-300;
 if(Math.abs(ep-eq)>16||(((u[0]^u[1])^(u[2]^u[3]))>>>31)!==0)return sub(mul(a,b),mul(c,d));
 const sig=abs.map(x=>BigInt((x&0x7fffff)|0x800000)),exponent=Math.min(ep,eq);
 const p=(sig[0]*sig[1])<<BigInt(ep-exponent),q=(sig[2]*sig[3])<<BigInt(eq-exponent),difference=p>q?p-q:q-p;
 const high=Number(difference>>32n),low=Number(difference&0xffffffffn);
 const magnitude=mul(add(f(high),mul(f(low),2**-32)),f(2**(exponent+32)));
 return mul(mul(p<q?-1:1,((u[0]^u[1])>>>31)?-1:1),magnitude);
}
export function precisionTriangle(origin,direction,vertices){
 const o=origin.map(f),d=direction.map(f),[a,b,c]=vertices.map(v=>v.map(f)),ng=cross(subtract(b,a),subtract(c,a));
 if(dot(ng,ng)===0)return {accepted:false,reason:'degenerate'};
 const ad=d.map(Math.abs),kz=ad[0]>ad[1]?(ad[0]>ad[2]?0:2):(ad[1]>ad[2]?1:2),kx=(kz+1)%3,ky=(kx+1)%3;
 const p=[a,b,c].map(v=>{const r=subtract(v,o);return [r[kx],r[ky],r[kz]];});
 const sx=div(-d[kx],d[kz]),sy=div(-d[ky],d[kz]),sz=div(1,d[kz]);
 for(const v of p){v[0]=add(v[0],mul(sx,v[2]));v[1]=add(v[1],mul(sy,v[2]));}
 let edgeFallbacks=0;
 const edge=(a,b,c,d)=>{const e=sub(mul(a,b),mul(c,d));if(e!==0)return e;edgeFallbacks++;return exactZeroEdge(a,b,c,d);};
 const [ap,bp,cp]=p,e=[edge(bp[0],cp[1],bp[1],cp[0]),edge(cp[0],ap[1],cp[1],ap[0]),edge(ap[0],bp[1],ap[1],bp[0])];
 if(e.some(x=>x<0)&&e.some(x=>x>0))return {accepted:false,reason:'edge',edgeFallbacks};
 const det=add(add(e[0],e[1]),e[2]);if(det===0)return {accepted:false,reason:'determinant',edgeFallbacks};
 for(const v of p)v[2]=mul(v[2],sz);
 const scaledT=add(add(mul(e[0],ap[2]),mul(e[1],bp[2])),mul(e[2],cp[2]));
 if((det<0&&scaledT>=0)||(det>0&&scaledT<=0))return {accepted:false,reason:'distance-sign',edgeFallbacks};
 const invDet=div(1,det),bary=e.map(x=>mul(x,invDet)),distance=mul(scaledT,invDet);
 const maxZ=Math.max(...p.map(v=>Math.abs(v[2]))),maxX=Math.max(...p.map(v=>Math.abs(v[0]))),maxY=Math.max(...p.map(v=>Math.abs(v[1])));
 const dz=mul(gamma(3),maxZ),dx=mul(gamma(5),add(maxX,maxZ)),dy=mul(gamma(5),add(maxY,maxZ));
 const de=mul(2,add(add(mul(mul(gamma(2),maxX),maxY),mul(dy,maxX)),mul(dx,maxY))),maxE=Math.max(...e.map(Math.abs));
 const deltaT=mul(mul(3,add(add(mul(mul(gamma(3),maxE),maxZ),mul(de,maxZ)),mul(dz,maxE))),Math.abs(invDet));
 if(!(distance>deltaT)||!Number.isFinite(distance))return {accepted:false,reason:'uncertain-positive-distance',distance,deltaT,edgeFallbacks};
 const side=Math.sign(-dot(d,ng)),normal=normalize(ng).map(x=>mul(side,x));
 return {accepted:side!==0,side,normal,bary,distance,deltaT,edgeFallbacks};
}
export function surfacePoint(vertices,bary){
 const weighted=vertices.map((v,i)=>v.map(x=>mul(x,bary[i])));
 const position=[0,1,2].map(i=>add(add(weighted[0][i],weighted[1][i]),weighted[2][i]));
 const error=[0,1,2].map(i=>mul(gamma(7),add(add(Math.abs(weighted[0][i]),Math.abs(weighted[1][i])),Math.abs(weighted[2][i]))));
 return {position,error};
}
export function offsetPoint(point,error,normal){
 const distance=dot(normal.map(Math.abs),error),offset=normal.map(n=>mul(n,distance));
 return {distance,origin:point.map((v,i)=>offset[i]===0?f(v):nextFloat(add(v,offset[i]),offset[i]>0))};
}
export function reflection(d,n){const scale=mul(2,dot(n,d));return d.map((x,i)=>sub(x,mul(scale,n[i])));}
export function refraction(d,n,eta){const dp=dot(n,d),k=sub(1,mul(mul(eta,eta),sub(1,mul(dp,dp))));if(k<0)return null;const scale=add(mul(eta,dp),f(Math.sqrt(k)));return normalize(d.map((x,i)=>sub(mul(eta,x),mul(scale,n[i]))));}

export function createPrecisionTracer(uniform){
 const pos=uniform.position.image.data,index=uniform.index.image.data,bounds=uniform.bvhBounds.image.data,contents=uniform.bvhContents.image.data;
 const vertices=first=>[0,1,2].map(v=>Array.from(pos.subarray((first+v)*4,(first+v)*4+3)));
 return {vertices,trace(origin,direction){
  const o=origin.map(f),d=direction.map(f),stack=[0];let best=null,nodes=0,triangles=0,edgeFallbacks=0;
  while(stack.length){
   const node=stack.pop();nodes++;let lo=0,hi=Infinity;
   for(let axis=0;axis<3;axis++){
    if(d[axis]===0){if(o[axis]<bounds[node*8+axis]||o[axis]>bounds[node*8+4+axis]){hi=-Infinity;break;}continue;}
    const inv=div(1,d[axis]),p=mul(inv,sub(bounds[node*8+axis],o[axis])),q=mul(inv,sub(bounds[node*8+4+axis],o[axis]));
    lo=Math.max(lo,Math.min(p,q));hi=Math.min(hi,Math.max(p,q));
   }
   if(hi<lo||lo>(best?.distance??Infinity))continue;
   const bits=contents[node*2],offset=contents[node*2+1];
   if(bits&0xffff0000){for(let i=offset;i<offset+(bits&0xffff);i++){
    triangles++;const first=index[i*4],hit=precisionTriangle(o,d,vertices(first));edgeFallbacks+=hit.edgeFallbacks??0;
    if(hit.accepted&&(!best||hit.distance<best.distance||(hit.distance===best.distance&&first<best.firstVertex)))best={...hit,firstVertex:first,triangle:first/3};
   }}else{const left=node+1,right=node+offset,leftFirst=d[bits]>=0;stack.push(leftFirst?right:left,leftFirst?left:right);}
  }
  return {hit:best,work:{nodes,triangles,edgeFallbacks}};
 }};
}
