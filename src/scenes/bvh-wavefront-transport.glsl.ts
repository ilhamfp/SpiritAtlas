// Diagnostic path scheduler: two interfaces per pass, with persistent ray state.
// Reflection/refraction choices are Monte Carlo samples of exact dielectric Fresnel.
// A long path continues on the next pass instead of being discarded at a bounce limit.
export const wavefrontTransportGLSL = `
const float RAY_OFFSET = .0001;
float randomValue(inout uint state) {
 state = state * 747796405u + 2891336453u;
 uint word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
 return float(((word >> 22u) ^ word) >> 8u) / 16777216.;
}
float maxComponent(vec3 v) { return max(v.x,max(v.y,v.z)); }
vec3 attenuationForMedium(int medium,float distance) {
 if(medium==1) return pow(max(absorption,vec3(.001)),vec3(distance/absorptionDistance));
 if(medium==2) return pow(vec3(.985,.992,.990),vec3(distance));
 if(medium==3) return pow(vec3(.996,.998,1.),vec3(distance));
 return vec3(1.);
}
float dielectricFresnel(float cosI,float eta,float cosT) {
 float rs=(eta*cosI-cosT)/(eta*cosI+cosT);
 float rp=(cosI-eta*cosT)/(cosI+eta*cosT);
 return clamp((rs*rs+rp*rp)*.5,0.,1.);
}
vec3 shadeOpaque(vec3 point,vec3 d,vec3 n,uvec4 indices,vec3 bary,float roughness) {
 vec3 base=textureSampleBarycoord(albedoTexture,bary,indices.xyz).rgb;
 vec3 ld=normalize(vec3(-3.,4.,2.)-point);
 float diffuse=max(dot(n,ld),0.);
 vec3 h=normalize(ld-d);
 float spec=pow(max(dot(n,h),0.),mix(128.,12.,roughness));
 return base*(.22+diffuse*.9)+vec3(spec*.12)+environmentLight(reflect(d,n))*.025;
}
void main() {
 ivec2 pixel=ivec2(gl_FragCoord.xy);
 vec4 origin=resetState?vec4(0.,0.,0.,-1.):texelFetch(originState,pixel,0);
 vec4 direction=resetState?vec4(0.):texelFetch(directionState,pixel,0);
 vec4 throughput=resetState?vec4(1.):texelFetch(throughputState,pixel,0);
 vec4 sum=resetState?vec4(0.):texelFetch(sumState,pixel,0);
 #ifdef ATLAS_MEDIUM_BVH
 if(trapMediumBvh&&direction.w<0.){
  nextOrigin=origin;nextDirection=direction;nextThroughput=throughput;nextSum=sum;return;
 }
 float previousBoundary=historyTrapMediumBvh?direction.w:0.;
 float mediumMismatches=historyTrapMediumBvh?0.:direction.w;
 #endif
 for(int work=0;work<2;work++) {
  uint seed=uint(pixel.x)*1973u+uint(pixel.y)*9277u+uint(sum.a)*26699u+(origin.a<0.?0u:uint(throughput.a))*31847u+89173u;
  if(origin.a<0.) {
   vec2 jitter=vec2(randomValue(seed),randomValue(seed))-.5;
   vec3 p,d;ndcToCameraRay((gl_FragCoord.xy+jitter)/resolution*2.-1.,cameraWorld,inverseProjection,p,d);
   origin=vec4(p,0.);direction=vec4(normalize(d),0.);throughput=vec4(1.,1.,1.,0.);
   #ifdef ATLAS_MEDIUM_BVH
   if(historyTrapMediumBvh)previousBoundary=0.;
   #endif
  }
  vec3 p=origin.xyz,d=direction.xyz;
  // Apply the glass exit first at its coincident floor contact. A normal offset
  // can then place the air-side origin just below stone; resolve that local contact.
  if(int(origin.a)==0&&d.y<-.0001&&p.y<=.035+RAY_OFFSET&&p.y>=.035-2.*RAY_OFFSET&&abs(p.x)<=12.&&abs(p.z)<=12.) {
   sum.rgb+=throughput.rgb*floorLight(vec3(p.x,.035,p.z));sum.a+=1.;origin.a=-1.;continue;
  }
  uvec4 indices=uvec4(0);vec3 n=vec3(0.),bary=vec3(0.);float side=1.,dist=0.;
  #ifdef ATLAS_MEDIUM_BVH
  bool hit=atlasIntersectFirstHit(p,d,int(origin.a),indices,n,bary,side,dist,mediumMismatches);
  if(atlasTrapHit){
   // Trap data is diagnostic state, not radiance. Frozen pixels keep the
   // original query and both hits until accumulation is explicitly reset.
   nextOrigin=vec4(p,origin.a+(historyTrapMediumBvh?8.*throughput.a:0.));
   nextDirection=vec4(d,-1.-atlasTrapReason-(historyTrapMediumBvh?64.*sum.a:0.));
   nextThroughput=atlasTrapHits;
   if(historyTrapMediumBvh){
    vec3 previousNormal=vec3(0.);
    if(previousBoundary>0.){
     uint marker=uint(previousBoundary),first=(marker/4u-1u)*3u;
     vec3 a=texelFetch1D(bvh.position,first).xyz,b=texelFetch1D(bvh.position,first+1u).xyz,c=texelFetch1D(bvh.position,first+2u).xyz;
     previousNormal=((marker&1u)==1u?1.:-1.)*normalize(cross(b-a,c-a));
    }
    nextSum=vec4(previousNormal,previousBoundary);
   }else nextSum=atlasTrapBary;
   return;
  }
  #else
  bool hit=bvhIntersectFirstHit(bvh,p,d,indices,n,bary,side,dist);
  #endif
  float floorDist=floorDistance(p,d);
  vec4 optic=hit?texelFetch1D(opticalTexture,indices.x):vec4(0.);
  bool glassTie=hit&&int(optic.z)==2&&abs(floorDist-dist)<=RAY_OFFSET;
  if(!hit||(floorDist>0.&&floorDist<dist&&!glassTie)) {
   sum.rgb+=throughput.rgb*backgroundRay(p,d);sum.a+=1.;origin.a=-1.;continue;
  }
  throughput.rgb*=attenuationForMedium(int(origin.a),dist);
  vec3 point=p+d*dist;
  if(optic.y>1.5) {
   if(side>0.)sum.rgb+=throughput.rgb*textureSampleBarycoord(albedoTexture,bary,indices.xyz).rgb;
   sum.a+=1.;origin.a=-1.;continue;
  }
  if(optic.y<.5) {
   vec3 ns=normalize(textureSampleBarycoord(normalTexture,bary,indices.xyz).xyz)*side;
   if(dot(ns,d)>0.)ns=-ns;
   sum.rgb+=throughput.rgb*shadeOpaque(point,d,ns,indices,bary,optic.w);
   sum.a+=1.;origin.a=-1.;continue;
  }
  float eta=side>0.?1./optic.x:optic.x;
  vec3 transmitted=refract(d,n,eta);
  float cosI=clamp(dot(-d,n),0.,1.);
  float fresnel=dot(transmitted,transmitted)<.01?1.:dielectricFresnel(cosI,eta,abs(dot(transmitted,n)));
  if(randomValue(seed)<fresnel) {
   #ifdef ATLAS_MEDIUM_BVH
   if(historyTrapMediumBvh)previousBoundary=float((indices.x/3u+1u)*4u)+(side>0.?1.:0.)+2.;
   #endif
   origin.xyz=point+n*RAY_OFFSET;direction.xyz=reflect(d,n);
  } else {
   #ifdef ATLAS_MEDIUM_BVH
   if(historyTrapMediumBvh)previousBoundary=float((indices.x/3u+1u)*4u)+(side>0.?1.:0.);
   #endif
   origin.xyz=point-n*RAY_OFFSET;direction.xyz=normalize(transmitted);
   origin.a=side>0.?optic.z:optic.w;throughput.rgb*=eta*eta;
  }
  throughput.a+=1.;
  // Unbiased Russian roulette terminates a sample, not the continuous scheduler.
  // An inverse survival weight compensates for discarded paths.
  if(throughput.a>24.) {
   float survival=clamp(maxComponent(throughput.rgb),.05,.98);
   if(randomValue(seed)>survival) {sum.a+=1.;origin.a=-1.;continue;}
   throughput.rgb/=survival;
  }
 }
 #ifdef ATLAS_MEDIUM_BVH
 direction.w=historyTrapMediumBvh?previousBoundary:mediumMismatches;
 #endif
 nextOrigin=origin;nextDirection=direction;nextThroughput=throughput;nextSum=sum;
}
`;
