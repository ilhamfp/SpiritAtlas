import { ICE_SPECS } from './choreography.js';
import { MarchingCubes } from './bounded-marching-cubes.js';

// Palette timing may change without touching the baked source RGB identity code.
export function appearanceUnmix(progress, timing = [.35, .8]) {
  if (!Array.isArray(timing) || timing.length !== 2 || !timing.every(Number.isFinite)
      || timing[0] < 0 || timing[0] >= timing[1] || timing[1] > 1) {
    throw new Error('appearanceUnmix requires two phase boundaries: 0 <= start < end <= 1');
  }
  if (!Number.isFinite(progress)) throw new Error('Appearance progress must be finite');
  const t = Math.max(0, Math.min(1, (progress - timing[0]) / (timing[1] - timing[0])));
  return t * t * (3 - 2 * t);
}

export function createParticleSurface(THREE, solver, options = {}) {
  const dropletMask = options.dropletMask;
  if (dropletMask && (dropletMask.count !== solver.count || dropletMask.duration !== solver.duration))
    throw new Error('Droplet mask does not match the classic fluid cache');
  const appearanceTiming = [...(options.appearanceUnmix ?? [.35, .8])];
  appearanceUnmix(0, appearanceTiming);
  const group=new THREE.Group();group.name='Particle fluid reconstruction';
  const material=new THREE.MeshPhysicalMaterial({color:'#ffffff',roughness:.035,transmission:.99,thickness:.48,ior:1.36,attenuationColor:'#f07642',attenuationDistance:1.1,specularIntensity:.5,envMapIntensity:.4,vertexColors:true});
  material.onBeforeCompile=shader=>{
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','');
    shader.fragmentShader=shader.fragmentShader.replace('#include <transmission_fragment>',THREE.ShaderChunk.transmission_fragment.replace('material.attenuationColor = attenuationColor;','material.attenuationColor = clamp(vColor.rgb, vec3(0.012), vec3(1.0));'));
  };
  const resolution=solver.count>2000?128:88;
  const mesh=new MarchingCubes(resolution,material,false,true,90000);
  mesh.activeBounds=new Int32Array(6);
  mesh.isolation=1.70;mesh.scale.setScalar(3.8);mesh.position.set(0,3,0);mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;
  group.add(mesh);
  const mixture=new THREE.Color(options.mixtureColor ?? '#f9a078');
  const colors=(options.liquidColors ?? ['#ffffff','#ee794f','#e8b77d']).map(color=>new THREE.Color(color));
  if(colors.length!==3)throw new Error('Classic liquid palette requires three colors');
  const currentColors=colors.map(c=>c.clone());
  const dropletGeometry=new THREE.SphereGeometry(1,10,7),dummy=new THREE.Object3D();
  const droplets=colors.map((color,i)=>{
    const mat=material.clone();mat.vertexColors=false;mat.onBeforeCompile=()=>{};mat.attenuationColor.copy(color);
    const instanced=new THREE.InstancedMesh(dropletGeometry,mat,solver.count);instanced.count=0;instanced.frustumCulled=false;group.add(instanced);return instanced;
  });
  // Unit density for a lattice with support radius of two particle spacings.
  const spacing=Math.cbrt(solver.particleMass/solver.restDensity)*1.03,support=spacing*1.8;
  const half=3.8,worldSize=half*2,gridScale=resolution/worldSize,reach=Math.ceil(support*gridScale);
  let frame=0,lastProgress=-1,lastSample=-1;
  function update(progress){
    const sample=solver.progress??progress;
    if(solver.baked&&Math.abs(progress-lastProgress)<1e-8&&Math.abs(sample-lastSample)<1e-8)return false;
    lastProgress=progress;lastSample=sample;
    const field=mesh.field,palette=mesh.palette,size=resolution,size2=size*size;
    mesh.reset();const unmix=appearanceUnmix(progress, appearanceTiming);
    for(let i=0;i<3;i++){currentColors[i].copy(mixture).lerp(colors[i],unmix);droplets[i].material.attenuationColor.copy(currentColors[i]);droplets[i].count=0;}
    const positions=solver.positions,ids=solver.ids;
    dropletMask?.sample(sample * solver.duration, progress);
    for(let particle=0;particle<solver.count;particle++){
      const n=particle*3,px=positions[n],py=positions[n+1],pz=positions[n+2];
      const gx=(px+half)*gridScale,gy=(py-3+half)*gridScale,gz=(pz+half)*gridScale;
      const color=currentColors[ids[particle]];
      for(let z=Math.max(1,Math.floor(gz-reach));z<Math.min(size-1,Math.ceil(gz+reach));z++){
        const dz=(z-gz)/gridScale;
        for(let y=Math.max(1,Math.floor(gy-reach));y<Math.min(size-1,Math.ceil(gy+reach));y++){
          const dy=(y-gy)/gridScale;
          for(let x=Math.max(1,Math.floor(gx-reach));x<Math.min(size-1,Math.ceil(gx+reach));x++){
            const dx=(x-gx)/gridScale,q=1-(dx*dx+dy*dy+dz*dz)/(support*support);if(q<=0)continue;
            const weight=q*q*q,index=z*size2+y*size+x;
            field[index]+=weight;palette[index*3]+=color.r*weight;palette[index*3+1]+=color.g*weight;palette[index*3+2]+=color.b*weight;
          }
        }
      }
    }
    // Resolve the equilibrium free surface and tiny wall meniscus analytically.
    // Blend to the particle density during the first impulse; particles remain
    // untouched. This avoids a lumpy surface caused by finite sampling at rest.
    const resting=1-THREE.MathUtils.smoothstep(progress,.008,.085);
    if(resting>0){
      const limit=(v,offset)=>Math.max(1,Math.min(size-1,Math.round((v+offset)*gridScale)));
      for(let iz=limit(-1.12,half);iz<limit(1.12,half);iz++)for(let iy=limit(-.10,half-3);iy<limit(1.88,half-3);iy++)for(let ix=limit(-1.12,half);ix<limit(1.12,half);ix++){
        const x=ix/gridScale-half,y=iy/gridScale+3-half,z=iz/gridScale-half;
        const radius=Math.hypot(x,z),wall=.88+.017*Math.max(0,y-.39);
        const top=1.62+.016*Math.exp(-Math.max(0,wall-radius)*45);
        let distance=Math.min(wall-radius,y-.273,top-y);
        for(const ice of ICE_SPECS)distance=Math.min(distance,Math.hypot(x-ice.origin[0],y-ice.origin[1],z-ice.origin[2])-.303);
        const equilibrium=Math.max(0,mesh.isolation+distance*30),index=iz*size2+iy*size+ix;
        field[index]=field[index]*(1-resting)+equilibrium*resting;
        palette[index*3]=palette[index*3]*(1-resting)+equilibrium*resting*mixture.r;
        palette[index*3+1]=palette[index*3+1]*(1-resting)+equilibrium*resting*mixture.g;
        palette[index*3+2]=palette[index*3+2]*(1-resting)+equilibrium*resting*mixture.b;
      }
    }
    // Collect the isosurface bounds during the existing palette pass. Empty
    // space never generates triangles, so the polygonizer can skip it without
    // reducing grid resolution or changing any position, normal, or color.
    const bounds=mesh.activeBounds;
    bounds[0]=bounds[1]=bounds[2]=size;bounds[3]=bounds[4]=bounds[5]=-1;
    for(let z=0,index=0;z<size;z++)for(let y=0;y<size;y++)for(let x=0;x<size;x++,index++){
      const density=field[index];
      if(density>.00001){
        const scale=1/density;palette[index*3]*=scale;palette[index*3+1]*=scale;palette[index*3+2]*=scale;
        if(density>=mesh.isolation){
          if(x<bounds[0])bounds[0]=x;if(y<bounds[1])bounds[1]=y;if(z<bounds[2])bounds[2]=z;
          if(x>bounds[3])bounds[3]=x;if(y>bounds[4])bounds[4]=y;if(z>bounds[5])bounds[5]=z;
        }
      }
    }
    for(let particle=0;particle<solver.count;particle++){
      const n=particle*3,x=positions[n],y=positions[n+1],z=positions[n+2];
      const ix=Math.round((x+half)*gridScale),iy=Math.round((y-3+half)*gridScale),iz=Math.round((z+half)*gridScale);
      if(ix<1||ix>=size-1||iy<1||iy>=size-1||iz<1||iz>=size-1)continue;
      if(resting>.99||field[iz*size2+iy*size+ix]>1.98)continue;
      const radiusScale=dropletMask?.radiusScale(particle)??1;
      if(radiusScale<=0)continue;
      const drop=droplets[ids[particle]];
      dummy.position.set(x,y,z);const velocity=solver.velocities;
      const vx=velocity?.[n]||0,vy=velocity?.[n+1]||0,vz=velocity?.[n+2]||0;
      const stretch=Math.min(1.9,1+Math.hypot(vx,vy,vz)*.13),r=spacing*.39*radiusScale;
      dummy.scale.set(r/Math.sqrt(stretch),r*stretch,r/Math.sqrt(stretch));
      dummy.updateMatrix();drop.setMatrixAt(drop.count++,dummy.matrix);
    }
    droplets.forEach(d=>{
      d.visible=d.count>0;d.instanceMatrix.clearUpdateRanges();
      if(d.count>0){d.instanceMatrix.addUpdateRange(0,d.count*16);d.instanceMatrix.needsUpdate=true;}
    });
    mesh.update();frame++;return true;
  }
  return {group,update,mesh,material};
}
