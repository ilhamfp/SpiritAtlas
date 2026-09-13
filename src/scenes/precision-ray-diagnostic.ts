import {BVHShaderGLSL} from 'three-mesh-bvh';

// An opt-in numerical experiment, not a production intersector. The original
// full BVH shader remains compiled verbatim when this module is not selected.
// Shear-space intersection and error estimates follow PBRT 4e §§6.5.3/6.8.
// The exactly-zero edge fallback below uses integer products of float inputs:
// GLSL ES 3.00 has no double precision or required correctly-rounded FMA.
export const precisionTriangleGLSL = /* glsl */`
float atlasGamma(float n){return (n*5.960464477539063e-8)/(1.-n*5.960464477539063e-8);}
float atlasMaxAbs(vec3 a){return max(abs(a.x),max(abs(a.y),abs(a.z)));}
uvec2 atlasProduct24(uint a,uint b){
 uint low=(a&65535u)*(b&65535u);
 uint mid=(a>>16u)*(b&65535u)+(a&65535u)*(b>>16u);
 uint lo=low+(mid<<16u);
 return uvec2(lo,(a>>16u)*(b>>16u)+(mid>>16u)+(lo<low?1u:0u));
}
uvec2 atlasShift64(uvec2 a,uint n){return n==0u?a:uvec2(a.x<<n,(a.y<<n)|(a.x>>(32u-n)));}
bool atlasLess64(uvec2 a,uvec2 b){return a.y<b.y||(a.y==b.y&&a.x<b.x);}
// Only called when the ordinary difference rounded to zero. Normal float
// products which cancel have exponent separation <= 1. Wider separation or
// subnormal inputs are outside this diagnostic fallback's supported domain.
float atlasExactZeroEdge(float a,float b,float c,float d){
 uint ua=floatBitsToUint(a),ub=floatBitsToUint(b),uc=floatBitsToUint(c),ud=floatBitsToUint(d);
 uint aa=ua&0x7fffffffu,ab=ub&0x7fffffffu,ac=uc&0x7fffffffu,ad=ud&0x7fffffffu;
 if(aa==0u||ab==0u||ac==0u||ad==0u)return a*b-c*d;
 int ea=int(aa>>23u),eb=int(ab>>23u),ec=int(ac>>23u),ed=int(ad>>23u);
 if(min(min(ea,eb),min(ec,ed))==0)return a*b-c*d;
 int ep=ea+eb-300,eq=ec+ed-300;
 if(abs(ep-eq)>16)return a*b-c*d;
 if(((ua^ub)^(uc^ud))>>31u!=0u)return a*b-c*d;
 uvec2 p=atlasProduct24((aa&0x7fffffu)|0x800000u,(ab&0x7fffffu)|0x800000u);
 uvec2 q=atlasProduct24((ac&0x7fffffu)|0x800000u,(ad&0x7fffffu)|0x800000u);
 int exponent=min(ep,eq);p=atlasShift64(p,uint(ep-exponent));q=atlasShift64(q,uint(eq-exponent));
 bool negative=atlasLess64(p,q);uvec2 hi=negative?q:p,lo=negative?p:q;
 uvec2 difference=uvec2(hi.x-lo.x,hi.y-lo.y-(hi.x<lo.x?1u:0u));
 float result=(float(difference.y)+float(difference.x)*2.3283064365386963e-10)*exp2(float(exponent+32));
 return (negative? -1.:1.)*(((ua^ub)>>31u)!=0u?-1.:1.)*result;
}
float atlasEdge(float a,float b,float c,float d){float e=a*b-c*d;return e==0.?atlasExactZeroEdge(a,b,c,d):e;}
bool atlasPrecisionTriangle(vec3 o,vec3 d,vec3 a,vec3 b,vec3 c,out vec3 bary,out vec3 n,out float t,out float side){
 vec3 ng=cross(b-a,c-a);if(dot(ng,ng)==0.)return false;
 vec3 ad=abs(d);int kz=ad.x>ad.y?(ad.x>ad.z?0:2):(ad.y>ad.z?1:2),kx=(kz+1)%3,ky=(kx+1)%3;
 vec3 ar=a-o,br=b-o,cr=c-o;
 vec3 ap=vec3(ar[kx],ar[ky],ar[kz]),bp=vec3(br[kx],br[ky],br[kz]),cp=vec3(cr[kx],cr[ky],cr[kz]);
 float sx=-d[kx]/d[kz],sy=-d[ky]/d[kz],sz=1./d[kz];
 ap.xy+=vec2(sx,sy)*ap.z;bp.xy+=vec2(sx,sy)*bp.z;cp.xy+=vec2(sx,sy)*cp.z;
 vec3 e=vec3(atlasEdge(bp.x,cp.y,bp.y,cp.x),atlasEdge(cp.x,ap.y,cp.y,ap.x),atlasEdge(ap.x,bp.y,ap.y,bp.x));
 if(any(lessThan(e,vec3(0.)))&&any(greaterThan(e,vec3(0.))))return false;
 float det=(e.x+e.y)+e.z;if(det==0.)return false;
 ap.z*=sz;bp.z*=sz;cp.z*=sz;
 float scaledT=(e.x*ap.z+e.y*bp.z)+e.z*cp.z;
 if((det<0.&&scaledT>=0.)||(det>0.&&scaledT<=0.))return false;
 float invDet=1./det;bary=e*invDet;t=scaledT*invDet;
 float maxZ=atlasMaxAbs(vec3(ap.z,bp.z,cp.z)),maxX=atlasMaxAbs(vec3(ap.x,bp.x,cp.x)),maxY=atlasMaxAbs(vec3(ap.y,bp.y,cp.y));
 float dz=atlasGamma(3.)*maxZ,dx=atlasGamma(5.)*(maxX+maxZ),dy=atlasGamma(5.)*(maxY+maxZ);
 float de=2.*(atlasGamma(2.)*maxX*maxY+dy*maxX+dx*maxY),maxE=atlasMaxAbs(e);
 float dt=3.*(atlasGamma(3.)*maxE*maxZ+de*maxZ+dz*maxE)*abs(invDet);
 if(!(t>dt)||isinf(t)||isnan(t))return false;
 side=sign(-dot(d,ng));n=side*normalize(ng);return side!=0.;
}
float atlasNextFloat(float x,bool up){
 if(x==0.)return uintBitsToFloat(up?1u:0x80000001u);
 uint bits=floatBitsToUint(x);bits+=(x>0.)==up?1u:0xffffffffu;return uintBitsToFloat(bits);
}
vec3 atlasSurfacePoint(sampler2D positions,uvec3 ids,vec3 bary,out vec3 error){
 vec3 a=texelFetch1D(positions,ids.x).xyz,b=texelFetch1D(positions,ids.y).xyz,c=texelFetch1D(positions,ids.z).xyz;
 vec3 aw=a*bary.x,bw=b*bary.y,cw=c*bary.z;
 error=atlasGamma(7.)*(abs(aw)+abs(bw)+abs(cw));return (aw+bw)+cw;
}
vec3 atlasOffsetPoint(vec3 point,vec3 error,vec3 orientedNormal){
 float distance=dot(abs(orientedNormal),error);vec3 offset=orientedNormal*distance,p=point+offset;
 for(int axis=0;axis<3;axis++)if(offset[axis]!=0.)p[axis]=atlasNextFloat(p[axis],offset[axis]>0.);
 return p;
}
`;

export function precisionFullBVHGLSL():string {
 const original=BVHShaderGLSL.bvh_ray_functions;
 const start=original.indexOf('bool intersectsTriangle('),end=original.indexOf('bool intersectTriangles(',start);
 if(start<0||end<0)throw Error('Installed BVH shader layout changed');
 let shader=original.slice(0,start)+precisionTriangleGLSL+'\n'+original.slice(end);
 shader=shader.replaceAll('intersectsTriangle(', 'atlasPrecisionTriangle(')
  .replaceAll('intersectTriangles(', 'atlasPrecisionTriangles(')
  .replaceAll('intersectsBVHNodeBounds(', 'atlasPrecisionNodeBounds(')
  .replaceAll('intersectsBounds(', 'atlasPrecisionBounds(')
  .replaceAll('bvhIntersectFirstHit(', 'atlasPrecisionFirstHit(')
  .replaceAll('_bvhIntersectFirstHit(', '_atlasPrecisionFirstHit(');
 // Same-distance edge ownership is independent of BVH visitation order.
 shader=shader.replace('&& localDist < minDistance','&& (localDist < minDistance || (localDist == minDistance && indices.x < faceIndices.x))');
 return shader;
}

export function precisionTransportSource(control:string):string {
 const replacements:[string,string][]=[
  ['bool hit=bvhIntersectFirstHit(bvh,p,d,indices,n,bary,side,dist);','bool hit=atlasPrecisionFirstHit(bvh,p,d,indices,n,bary,side,dist);'],
  ['vec3 point=p+d*dist;','vec3 pointError;vec3 point=atlasSurfacePoint(bvh.position,indices.xyz,bary,pointError);'],
  ['origin.xyz=point+n*RAY_OFFSET;direction.xyz=reflect(d,n);','origin.xyz=atlasOffsetPoint(point,pointError,n);direction.xyz=reflect(d,n);'],
  ['origin.xyz=point-n*RAY_OFFSET;direction.xyz=normalize(transmitted);','origin.xyz=atlasOffsetPoint(point,pointError,-n);direction.xyz=normalize(transmitted);'],
 ];
 for(const [before,after]of replacements){if(control.split(before).length!==2)throw Error('Transport control layout changed');control=control.replace(before,after);}
 return control;
}
