// Experimental deterministic transport. Every reflected first-order ray queries
// actual scene triangles. Higher reflection orders remain a recorded approximation.
export const transportGLSL = `
const float RAY_OFFSET = 0.0001;
vec3 attenuationForMedium(int medium, float distance) {
 if(medium==1) return pow(max(absorption,vec3(.001)),vec3(distance/absorptionDistance));
 if(medium==2) return pow(vec3(.985,.992,.990),vec3(distance));
 if(medium==3) return pow(vec3(.996,.998,1.),vec3(distance));
 return vec3(1.);
}
float maxComponent(vec3 v){return max(v.x,max(v.y,v.z));}
float interfaceFresnel(vec3 d,vec3 n,float eta){
 float f0=pow((1.-eta)/(1.+eta),2.);
 return f0+(1.-f0)*pow(1.-clamp(dot(-d,n),0.,1.),5.);
}
vec3 shadeOpaque(vec3 point,vec3 d,vec3 n,uvec4 indices,vec3 bary,float roughness){
 vec3 base=textureSampleBarycoord(albedoTexture,bary,indices.xyz).rgb;
 vec3 ld=normalize(vec3(-3.,4.,2.)-point);
 float diffuse=max(dot(n,ld),0.);
 vec3 h=normalize(ld-d);
 float spec=pow(max(dot(n,h),0.),mix(128.,12.,roughness));
 return base*(.22+diffuse*.9)+vec3(spec*.12)+environmentLight(reflect(d,n))*.025;
}
// This secondary path resolves transmitted geometry and total internal
// reflections. Its later reflected branches use the environment approximation;
// their energy is recorded separately, rather than mistaken for exact transport.
vec3 traceSecondary(vec3 p,vec3 d,int medium,out float unresolved,out float approximation){
 vec3 radiance=vec3(0.),weight=vec3(1.);unresolved=0.;approximation=0.;
 for(int step=0;step<512;step++){
  uvec4 indices=uvec4(0);vec3 n=vec3(0.),bary=vec3(0.);float side=1.,dist=0.;
  bool hit=bvhIntersectFirstHit(bvh,p,d,indices,n,bary,side,dist);
  float floorDist=d.y<-.0001?(.035-p.y)/d.y:1e20;
  if(!hit||(floorDist>0.&&floorDist<dist))return radiance+weight*backgroundRay(p,d);
  weight*=attenuationForMedium(medium,dist);
  if(maxComponent(weight)<.00001)return radiance;
  vec3 point=p+d*dist;vec4 optic=texelFetch1D(opticalTexture,indices.x);
  if(optic.y<.5){
   vec3 ns=normalize(textureSampleBarycoord(normalTexture,bary,indices.xyz).xyz)*side;
   if(dot(ns,d)>0.)ns=-ns;
   return radiance+weight*shadeOpaque(point,d,ns,indices,bary,optic.w);
  }
  float eta=side>0.?1./optic.x:optic.x;
  vec3 transmitted=refract(d,n,eta);
  if(dot(transmitted,transmitted)<.01){d=reflect(d,n);p=point+n*RAY_OFFSET;continue;}
  float fresnel=interfaceFresnel(d,n,eta);
  approximation+=maxComponent(weight*fresnel);
  radiance+=weight*fresnel*backgroundRay(point+n*RAY_OFFSET,reflect(d,n));
  weight*=1.-fresnel;
  medium=int(side>0.?optic.z:optic.w);
  d=normalize(transmitted);p=point-n*RAY_OFFSET;
 }
 unresolved=maxComponent(weight);
 return radiance;
}
vec3 traceRay(vec3 p,vec3 d,out float unresolved,out float approximation){
 vec3 radiance=vec3(0.),weight=vec3(1.);int medium=0;unresolved=0.;approximation=0.;
 for(int step=0;step<1024;step++){
  uvec4 indices=uvec4(0);vec3 n=vec3(0.),bary=vec3(0.);float side=1.,dist=0.;
  bool hit=bvhIntersectFirstHit(bvh,p,d,indices,n,bary,side,dist);
  float floorDist=d.y<-.0001?(.035-p.y)/d.y:1e20;
  if(!hit||(floorDist>0.&&floorDist<dist))return radiance+weight*backgroundRay(p,d);
  weight*=attenuationForMedium(medium,dist);
  if(maxComponent(weight)<.00001)return radiance;
  vec3 point=p+d*dist;vec4 optic=texelFetch1D(opticalTexture,indices.x);
  if(optic.y<.5){
   vec3 ns=normalize(textureSampleBarycoord(normalTexture,bary,indices.xyz).xyz)*side;
   if(dot(ns,d)>0.)ns=-ns;
   return radiance+weight*shadeOpaque(point,d,ns,indices,bary,optic.w);
  }
  // Geometric normals and normal-directed offsets preserve the tested medium graph.
  float eta=side>0.?1./optic.x:optic.x;
  vec3 transmitted=refract(d,n,eta);
  if(dot(transmitted,transmitted)<.01){d=reflect(d,n);p=point+n*RAY_OFFSET;continue;}
  float fresnel=interfaceFresnel(d,n,eta);
  float secondaryUnresolved,secondaryApproximation;
  vec3 secondary=traceSecondary(point+n*RAY_OFFSET,reflect(d,n),medium,secondaryUnresolved,secondaryApproximation);
  radiance+=weight*fresnel*secondary;
  unresolved+=maxComponent(weight*fresnel)*secondaryUnresolved;
  approximation+=maxComponent(weight*fresnel)*secondaryApproximation;
  weight*=1.-fresnel;
  medium=int(side>0.?optic.z:optic.w);
  d=normalize(transmitted);p=point-n*RAY_OFFSET;
 }
 unresolved+=maxComponent(weight);
 return radiance;
}
`;
