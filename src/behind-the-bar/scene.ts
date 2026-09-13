import * as T from 'three/webgpu';
import {texture,screenUV,normalView,normalWorld,positionViewDirection,positionWorldDirection,dot,pow,clamp as nodeClamp,vec2,vec3,uniform,equirectUV,reflect,mix} from 'three/tsl';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {createSolver} from './gpu';
import {Preparation,total,clamp,definition,COMPONENTS} from './model';
import type {Quantities} from './model';
import type {StudioSound} from './audio';
import {strainAngle,surfaceIntercept,LIQUID_BOTTOM,LIQUID_RIM} from './strain';
export type SceneDiagnostics={renderer:string;adapter:unknown;frames:number;frameTimes:number[];width:number;height:number;gpuDispatches:number;gpuReads:number;gpuState:number[];ice:number[][];responseAt:number;nativeLatency:{seq:number;sampleToFrame:number;receiptToFrame:number}[];resetId:number;errors:string[]};
export type StudioScene=Awaited<ReturnType<typeof createStudioScene>>;
function liquidGeometry(){
 const segments=80,rings=14;const positions:number[]=[],indices:number[]=[];
 for(let r=0;r<=rings;r++)for(let s=0;s<segments;s++){const a=s/segments*Math.PI*2,rad=.963*r/rings;positions.push(Math.cos(a)*rad,0,Math.sin(a)*rad);}
 for(let r=0;r<rings;r++)for(let s=0;s<segments;s++){let a=r*segments+s,b=r*segments+(s+1)%segments,c=a+segments,e=b+segments;indices.push(a,c,b,b,c,e);}
 const sideStart=positions.length/3;
 for(let s=0;s<segments;s++){const a=s/segments*Math.PI*2;positions.push(Math.cos(a)*.85,.14,Math.sin(a)*.85);const top=rings*segments+s,next=rings*segments+(s+1)%segments;indices.push(top,sideStart+s,next,next,sideStart+s,sideStart+(s+1)%segments);}
 const center=positions.length/3;positions.push(0,.14,0);for(let s=0;s<segments;s++)indices.push(center,sideStart+(s+1)%segments,sideStart+s);
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));for(let i=0;i<indices.length;i+=3){const a=indices[i+1];indices[i+1]=indices[i+2];indices[i+2]=a;}g.setIndex(indices);g.computeVertexNormals();return {g,topCount:sideStart};
}
export async function createStudioScene(canvas:HTMLCanvasElement,model:Preparation,onStatus:(s:string)=>void,audio?:StudioSound){
 let disposed=false;let announced=false;const errors:string[]=[];let device:GPUDevice|undefined;let adapter:GPUAdapter|null=null;let solver:Awaited<ReturnType<typeof createSolver>>|null=null;
 try{adapter=await navigator.gpu?.requestAdapter({powerPreference:'high-performance'});if(adapter){device=await adapter.requestDevice();solver=await createSolver(device);}}
 catch(e){errors.push(String(e));device?.destroy();device=undefined;}
 const renderer=new T.WebGPURenderer({canvas,antialias:true,alpha:false,...(device?{device}:{forceWebGL:true})});
 try{await renderer.init();}catch(error){renderer.dispose();solver?.dispose();device?.destroy();throw error;}renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
 const scene=new T.Scene();scene.background=new T.Color('#242125');
 const camera=new T.PerspectiveCamera(34,1,.05,80);let azimuth=0,elevation=.33,zoom=1;
 const textureLoader=new T.TextureLoader();
 const loaded=await Promise.allSettled([new GLTFLoader().loadAsync('/models/negroni-express.glb'),textureLoader.loadAsync('/textures/somma-interior-panorama-v2.png'),textureLoader.loadAsync('/textures/somma-stone-tile-v1.png')]);
 if(loaded.some(result=>result.status==='rejected')){for(const result of loaded)if(result.status==='fulfilled'){if(result.value instanceof T.Texture)result.value.dispose();else result.value.scene.traverse(o=>{if((o as T.Mesh).isMesh){const mesh=o as T.Mesh;mesh.geometry.dispose();for(const material of Array.isArray(mesh.material)?mesh.material:[mesh.material])material.dispose();}});}renderer.dispose();solver?.dispose();device?.destroy();throw new Error('The studio assets could not load. Check your connection and retry.');}
 const asset=(loaded[0] as PromiseFulfilledResult<Awaited<ReturnType<GLTFLoader['loadAsync']>>>).value,env=(loaded[1] as PromiseFulfilledResult<T.Texture>).value,stone=(loaded[2] as PromiseFulfilledResult<T.Texture>).value;
 env.mapping=T.EquirectangularReflectionMapping;env.colorSpace=T.SRGBColorSpace;scene.environment=env;scene.environmentIntensity=.8;
 stone.colorSpace=T.SRGBColorSpace;stone.wrapS=stone.wrapT=T.RepeatWrapping;stone.repeat.set(4,4);
 const floor=new T.Mesh(new T.PlaneGeometry(30,30),new T.MeshStandardMaterial({map:stone,color:'#3d3334',roughness:.55}));floor.rotation.x=-Math.PI/2;floor.position.y=-.045;scene.add(floor);
 const hemi=new T.HemisphereLight('#fff4df','#534138',2);scene.add(hemi);
 const light=new T.DirectionalLight('#fff0d5',3);light.position.set(-3,6,5);scene.add(light);
 const rim=new T.DirectionalLight('#ffffff',2);rim.position.set(3,4,-3);scene.add(rim);
 const meshes=new Map<string,T.Mesh>();asset.scene.updateMatrixWorld(true);asset.scene.traverse(o=>{if((o as T.Mesh).isMesh)meshes.set(o.name,o as T.Mesh);});
 function clone(name:string){const src=meshes.get(name)!;const m=src.clone();m.material=(src.material as T.Material).clone();return m;}
 const mixing=new T.Group(),receiving=new T.Group();scene.add(mixing,receiving);
 const glass=clone('glass');mixing.add(glass);const serveGlass=clone('glass');receiving.add(serveGlass);
 for(const m of [glass,serveGlass]){const mat=m.material as T.MeshPhysicalMaterial;mat.color.set('#ffffff');mat.ior=1.51;mat.transmission=1;mat.thickness=.06;mat.roughness=.025;}
 function makeLiquid(group:T.Group){const {g,topCount}=liquidGeometry();const mat=new T.MeshPhysicalMaterial({color:'#ffffff',attenuationColor:'#eb531e',attenuationDistance:1.4,transmission:1,roughness:.065,ior:1.36,thickness:1.1,side:T.FrontSide});const mesh:T.Mesh=new T.Mesh(g,mat);group.add(mesh);return {g,topCount,mat,mesh};}
 const mixLiquid=makeLiquid(mixing),serveLiquid=makeLiquid(receiving);
 const iceBodies=Array.from({length:3},(_,i)=>{const mesh=clone('ice');mesh.scale.setScalar(.42);mesh.position.set(Math.cos(i*2.094)*.38,.7,Math.sin(i*2.094)*.38);const mat=mesh.material as T.MeshPhysicalMaterial;mat.ior=1.31;mat.thickness=.7;mat.roughness=.065;mat.transmission=1;mixing.add(mesh);return {mesh,x:mesh.position.x,z:mesh.position.z,vx:0,vz:0,y:2+i*.2,vy:0};});
 const servingIce=clone('ice');receiving.add(servingIce);(servingIce.material as T.MeshPhysicalMaterial).thickness=1.1;
 const inclusions=clone('ice_inclusions');receiving.add(inclusions);
 const pepper=new T.Group();pepper.add(clone('garnish_shishito'),clone('garnish_stem'));receiving.add(pepper);
 const spoon=new T.Group();const handle=new T.Mesh(new T.CylinderGeometry(.019,.019,2.3,12),new T.MeshStandardMaterial({color:'#d1b19a',metalness:.95,roughness:.16}));handle.position.y=1.6;spoon.add(handle);const bowl=new T.Mesh(new T.SphereGeometry(.12,16,12),handle.material);bowl.scale.set(.65,1.6,.2);bowl.position.y=.52;spoon.add(bowl);mixing.add(spoon);
 // A single local assembly keeps the plate, spring and handle on the rim.
 const steel=new T.MeshStandardMaterial({color:'#bac3c8',metalness:.92,roughness:.25,side:T.DoubleSide});
 const strainer=new T.Group();strainer.position.y=1.795;mixing.add(strainer);
 const plateShape=new T.Shape();plateShape.absarc(0,0,.74,0,Math.PI*2,false);
 for(const [radius,count] of [[.18,8],[.39,16],[.61,24]])for(let i=0;i<count;i++){const a=i/count*Math.PI*2,hole=new T.Path();hole.absarc(Math.cos(a)*radius,Math.sin(a)*radius,.037,0,Math.PI*2,true);plateShape.holes.push(hole);}
 const plate=new T.Mesh(new T.ShapeGeometry(plateShape,10),steel);plate.rotation.x=-Math.PI/2;strainer.add(plate);
 const springPoints=Array.from({length:601},(_,i)=>{const a=.3+i/600*(Math.PI*2-.6),coil=i/600*Math.PI*2*52,r=.82+.037*Math.cos(coil);return new T.Vector3(Math.cos(a)*r,.015+.037*Math.sin(coil),Math.sin(a)*r);});
 strainer.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(springPoints),600,.009,5,false),steel));
 const strainerHandle=new T.Mesh(new T.BoxGeometry(.91,.032,.16),steel);strainerHandle.position.set(-1.05,.02,0);strainer.add(strainerHandle);
 const lipTab=new T.Mesh(new T.BoxGeometry(.22,.022,.22),steel);lipTab.position.set(.81,0,0);strainer.add(lipTab);
 const source=new T.Group();scene.add(source);
 const bottle:T.Mesh=new T.Mesh(new T.CylinderGeometry(.21,.34,1.12,40),new T.MeshPhysicalMaterial({color:'#fff1dc',transmission:.8,thickness:.035,roughness:.08}));source.add(bottle);
 const bottleFill=new T.Mesh(new T.CylinderGeometry(.2,.32,.98,40),new T.MeshPhysicalMaterial({color:'#b93d1f',roughness:.12}));source.add(bottleFill);
 const neck:T.Mesh=new T.Mesh(new T.CylinderGeometry(.12,.2,.32,24),bottle.material);neck.position.y=.68;source.add(neck);
 const streamSegments=28,streamSides=8,streamGeometry=new T.BufferGeometry();
 const streamPositions=new Float32Array((streamSegments+1)*streamSides*3),streamNormals=new Float32Array(streamPositions.length),streamIndices=[];
 for(let i=0;i<streamSegments;i++)for(let j=0;j<streamSides;j++){const a=i*streamSides+j,b=i*streamSides+(j+1)%streamSides;streamIndices.push(a,b,a+streamSides,b,b+streamSides,a+streamSides);}
 streamGeometry.setAttribute('position',new T.BufferAttribute(streamPositions,3).setUsage(T.DynamicDrawUsage));streamGeometry.setAttribute('normal',new T.BufferAttribute(streamNormals,3).setUsage(T.DynamicDrawUsage));streamGeometry.setIndex(streamIndices);
 const stream=new T.Mesh(streamGeometry,new T.MeshPhysicalMaterial({color:'#e95725',transparent:true,opacity:.85,depthWrite:false,roughness:.08,clearcoat:1}));stream.frustumCulled=false;scene.add(stream);
 const mistGeo=new T.BufferGeometry(),mistPos=new Float32Array(60*3);mistGeo.setAttribute('position',new T.BufferAttribute(mistPos,3));const mist=new T.Points(mistGeo,new T.PointsMaterial({color:'#ffe6a8',size:.025,transparent:true,opacity:.6}));receiving.add(mist);
 // Separate optical captures prevent transparent nested volumes disappearing.
 const captures=Array.from({length:3},()=>new T.RenderTarget(1024,768,{type:T.HalfFloatType,depthBuffer:true}));
 const tint=uniform(new T.Color('#ef531d'));
 function optical(buffer:T.Texture,kind:'glass'|'ice'|'liquid'){
  const mat=new T.MeshBasicNodeMaterial();
  const facing=nodeClamp(dot(normalView,positionViewDirection),0,1);
  const fresnel=pow(facing.oneMinus(),3);
  const shift=normalView.xy.mul(kind==='glass'?.018:kind==='ice'?.042:.027).mul(facing.oneMinus().add(.2));
  const refracted=texture(buffer,screenUV.add(vec2(shift.x,shift.y.negate())));
  const reflected=texture(env,equirectUV(reflect(positionWorldDirection,normalWorld)));
  const body=kind==='liquid'?refracted.rgb.mul(mix(vec3(1),tint,.85)).add(tint.mul(.035)):refracted.rgb;
  const reflectivity=kind==='glass'?.07:kind==='ice'?.12:.04;
  mat.colorNode=mix(body,reflected.rgb.mul(1.7),fresnel.mul(.7).add(reflectivity));
  return mat;
 }
 const opticIce=optical(captures[0].texture,'ice');for(const b of iceBodies){(b.mesh.material as T.Material).dispose();b.mesh.material=opticIce;}servingIce.material=opticIce;(inclusions.material as T.Material).dispose();inclusions.material=opticIce;
 const opticLiquid=optical(captures[1].texture,'liquid');mixLiquid.mesh.material=opticLiquid;serveLiquid.mesh.material=opticLiquid;
 // Use the same explicit optical passes for every glass/ice object. Mixing in
 // viewport-transmission copies leaves stale shared framebuffer textures on resize.
 const opticGlass=optical(captures[2].texture,'glass');glass.material=opticGlass;serveGlass.material=opticGlass;(bottle.material as T.Material).dispose();bottle.material=neck.material=opticGlass;
 const diagnostics:SceneDiagnostics={renderer:solver?'TypeGPU + Three WebGPU':'Simplified guided WebGL',adapter:adapter?.info?{vendor:adapter.info.vendor,architecture:adapter.info.architecture,device:adapter.info.device,description:adapter.info.description}:null,frames:0,frameTimes:[],width:0,height:0,gpuDispatches:0,gpuReads:0,gpuState:[],ice:[],responseAt:0,nativeLatency:[],resetId:model.resetId,errors};
 let lastNativeFrame=0;let last=0,accumulator=0,notifyTime=0,raf=0,resetId=-1,fallbackSwirl=0;let localValues=new Float32Array(16);const from=new T.Vector3(),to=new T.Vector3(),direction=new T.Vector3(),streamControl=new T.Vector3(),streamPoint=new T.Vector3(),streamNormal=new T.Vector3(),streamBinormal=new T.Vector3(),axisZ=new T.Vector3(0,0,1),localUp=new T.Vector3(),inverseRotation=new T.Quaternion(),lipOffset=new T.Vector3(),pourPosition=new T.Vector3(),iceBox=new T.Box3();let pourAngle=0,pourLift=0,cameraDistance=5.8,cameraTarget=1.08;let liquidPlane={height:0,slopeX:0,slopeZ:0};
 function level(q:Quantities,serving=false){return clamp(.15+total(q)/definition.capacity[serving?'serve':'mix']*1.03+(total(q)>.01?(serving?.22:.12):0),.15,1.52);}
 let nowTime=0,renderFailed=false;
 function failRender(info:unknown){
  if(disposed||renderFailed)return;renderFailed=true;
  const message=typeof info==='object'&&info!==null&&'message' in info?String(info.message):String(info);
  errors.push(message);model.disarm();model.notify();cancelAnimationFrame(raf);
  onStatus('Scene could not continue. Pouring is paused. Retry scene to recover.');
 }
 const reportRenderError=renderer.onError.bind(renderer);
 renderer.onError=info=>{reportRenderError(info);failRender(info);};
 function liquid(data:ReturnType<typeof makeLiquid>,q:Quantities,serving:boolean,values:Float32Array){
  const volume=total(q);data.mesh.visible=volume>.00001;const h=level(q,serving),p=data.g.getAttribute('position');
  const strained=!serving&&model.stage==='strain';
  const waveLimit=Math.min(.18,(h-.145)*.45,(1.76-h)*.6);const factor=serving?.28:1;
  let slopeX=0,slopeZ=0,intercept=h;
  if(strained){inverseRotation.copy(mixing.quaternion).invert();localUp.set(0,1,0).applyQuaternion(inverseRotation);slopeX=-localUp.x/Math.max(.07,localUp.y);slopeZ=-localUp.z/Math.max(.07,localUp.y);intercept=surfaceIntercept(h,slopeX,slopeZ);liquidPlane={height:intercept,slopeX,slopeZ};}
  for(let i=0;i<data.topCount;i++){const x=p.getX(i),z=p.getZ(i),r2=x*x+z*z;
   let wave=values[0]*x+values[2]*z+values[8]*Math.cos(Math.atan2(z,x)*2-values[5]*2)*r2;
   if(strained)wave=(values[0]-clamp(-model.vesselZ+pourAngle,-.7,.7))*x*.15+values[3]*z*.025;
   if(serving&&model.stage==='strain')wave=(model.transit.length?Math.sin(Math.sqrt(r2)*22-nowTime*.012)*.022:0)+values[1]*x*.015;
   const vortex=strained?0:Math.min(.045,values[4]*values[4]*.002)*(r2-.465);
   p.setY(i,clamp(intercept+slopeX*x+slopeZ*z+clamp(factor*(wave+vortex),-waveLimit,waveLimit),LIQUID_BOTTOM,LIQUID_RIM));}
  p.needsUpdate=true;data.g.computeVertexNormals();const fraction=volume>0?q.core/volume:1;data.mat.attenuationColor.setRGB(.95,.055+(1-fraction)*.20,.008+(1-fraction)*.055);data.mat.attenuationDistance=1.5;
 }
 function frame(now:number){if(disposed||renderFailed)return;nowTime=now;const rawElapsed=last?(now-last)/1000:0;const elapsed=Math.min(rawElapsed,.05);last=now;
  if(document.hidden){model.disarm();accumulator=0;raf=requestAnimationFrame(frame);return;}
  if(model.resetId!==resetId){resetId=model.resetId;solver?.reset();localValues.fill(0);fallbackSwirl=0;pourAngle=0;pourLift=0;cameraDistance=5.8;cameraTarget=1.08;azimuth=0;elevation=.33;zoom=1;iceBodies.forEach((b,i)=>{b.x=Math.cos(i*2.094)*.38;b.z=Math.sin(i*2.094)*.38;b.vx=b.vz=b.vy=0;b.y=model.preset==='stir-demo'?.7:2+i*.2;});diagnostics.resetId=resetId;}
  const straining=model.stage==='strain',follow=1-Math.exp(-elapsed/.075);pourAngle+=(strainAngle(straining?model.pourTilt:0,level(model.mix))-pourAngle)*follow;pourLift+=((straining?clamp(model.pourTilt/.2,0,1):0)-pourLift)*follow;
  accumulator+=elapsed;let steps=0;while(accumulator>=1/120&&steps++<6){model.tick(1/120);solver?.step(1/120,model.impulseX,model.impulseZ,model.stirInput,model.spoonAngle,clamp(-model.vesselZ+(straining?pourAngle:0),-.7,.7),model.vesselX);fallbackSwirl=(fallbackSwirl+model.stirInput*2.4/120)*Math.exp(-1.3/120);accumulator-=1/120;}
  solver?.read(model.latestNative);if(solver)localValues=solver.values;else localValues[4]=fallbackSwirl;
  const isFinish=['express','garnish','serve'].includes(model.stage);const two=model.stage==='strain';mixing.visible=!isFinish;receiving.visible=two||isFinish;
  receiving.position.set(two?1.2:0,0,0);mixing.rotation.set(model.vesselX,0,model.vesselZ-(two?pourAngle:0));
  mixing.position.set(two?-1.25:0,0,0);
  if(two){lipOffset.set(.963,1.80,0).applyQuaternion(mixing.quaternion);mixing.position.lerp(pourPosition.set(.77,2.85,.10).sub(lipOffset),pourLift);}
  receiving.rotation.set(isFinish?model.vesselX:0,0,isFinish?model.vesselZ:0);
  liquid(mixLiquid,model.mix,false,localValues);liquid(serveLiquid,model.serving,true,localValues);
  const iceY=Math.max(.42,level(model.mix)-.18);
  let contact=0;
  for(const b of iceBodies){b.mesh.visible=model.ice>0;const w=localValues[4];b.vx+=(-b.z*w*.7-b.vx*2-model.vesselZ*2+model.impulseX*.12)*elapsed;b.vz+=(b.x*w*.7-b.vz*2+model.vesselX*2+model.impulseZ*.12)*elapsed;b.x+=b.vx*elapsed;b.z+=b.vz*elapsed;
   const r=Math.hypot(b.x,b.z);if(r>.56){b.x*=.56/r;b.z*=.56/r;const dot=(b.vx*b.x+b.vz*b.z)/(.56*.56);if(dot>0){contact+=Math.abs(dot)*.1;b.vx-=1.3*dot*b.x;b.vz-=1.3*dot*b.z;}}
   const surfaceY=two?clamp(liquidPlane.height+liquidPlane.slopeX*b.x+liquidPlane.slopeZ*b.z-.13,.39,1.43):iceY;
   b.vy+=(surfaceY-b.y)*24*elapsed-b.vy*6*elapsed;b.y=Math.max(.39,b.y+b.vy*elapsed);
  }
  for(let i=0;i<3;i++)for(let j=i+1;j<3;j++){const a=iceBodies[i],b=iceBodies[j],dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz);if(dist<.49&&dist>.001){const correction=(.49-dist)*.5;a.x-=dx/dist*correction;a.z-=dz/dist*correction;b.x+=dx/dist*correction;b.z+=dz/dist*correction;}}
  for(const b of iceBodies){const r=Math.hypot(b.x,b.z);if(r>.56){b.x*=.56/r;b.z*=.56/r;}b.mesh.position.set(b.x,b.y,b.z);b.mesh.rotation.y+=localValues[4]*elapsed*.27;b.mesh.rotation.x=localValues[2]*.5;}
  servingIce.visible=inclusions.visible=model.servingIce;pepper.visible=['garnish','serve'].includes(model.stage);pepper.position.set(model.garnish.x,0,model.garnish.z);pepper.rotation.y=model.garnish.angle;
  spoon.visible=model.stage==='stir';spoon.position.set(Math.cos(model.spoonAngle)*.72,0,Math.sin(model.spoonAngle)*.72);spoon.rotation.z=-.1;
  strainer.visible=two;source.visible=model.stage==='mix';source.position.set(-1.32,2.18,.04);source.rotation.z=-model.pourTilt*1.1;
  const remaining=model.sources[model.selected]/definition.ingredients[model.selected].initial;bottleFill.scale.y=Math.max(.001,remaining);bottleFill.position.y=-.49*(1-remaining);(bottleFill.material as T.MeshPhysicalMaterial).color.set(definition.ingredients[model.selected].color);
  const flowing=model.transit.length>0;scene.updateMatrixWorld(true);
  if(flowing){if(two){from.set(.963,1.80,0).applyMatrix4(mixing.matrixWorld);iceBox.setFromObject(servingIce);to.set(receiving.position.x-.25,Math.max(level(model.serving,true),iceBox.max.y+.015),receiving.position.z+.1);}else{from.set(0,.84,0).applyMatrix4(source.matrixWorld);to.set(-.3,level(model.mix),0).applyMatrix4(mixing.matrixWorld);}streamControl.copy(from).lerp(to,.22);streamControl.y=from.y-.04;}
  stream.visible=flowing&&from.y>to.y+.04;
  if(stream.visible){const radius=.014+.014*model.pourTilt;
   for(let i=0;i<=streamSegments;i++){const t=i/streamSegments,u=1-t;streamPoint.copy(from).multiplyScalar(u*u).addScaledVector(streamControl,2*u*t).addScaledVector(to,t*t);direction.copy(streamControl).sub(from).multiplyScalar(u).addScaledVector(to,t).addScaledVector(streamControl,-t).normalize();streamNormal.crossVectors(direction,axisZ).normalize();streamBinormal.crossVectors(direction,streamNormal).normalize();
    const width=radius*(1-.23*t)*(1+.035*Math.sin(t*28-now*.025));
    for(let j=0;j<streamSides;j++){const angle=j/streamSides*Math.PI*2,nx=streamNormal.x*Math.cos(angle)+streamBinormal.x*Math.sin(angle),ny=streamNormal.y*Math.cos(angle)+streamBinormal.y*Math.sin(angle),nz=streamNormal.z*Math.cos(angle)+streamBinormal.z*Math.sin(angle),k=(i*streamSides+j)*3;streamPositions[k]=streamPoint.x+nx*width;streamPositions[k+1]=streamPoint.y+ny*width;streamPositions[k+2]=streamPoint.z+nz*width;streamNormals[k]=nx;streamNormals[k+1]=ny;streamNormals[k+2]=nz;}}
   streamGeometry.attributes.position.needsUpdate=true;streamGeometry.attributes.normal.needsUpdate=true;
  }
  mist.visible=model.oilTime>0;for(let i=0;i<60;i++){const t=1-model.oilTime,angle=i*2.399;mistPos[i*3]=Math.cos(angle)*t*(.2+i/100);mistPos[i*3+1]=2.3-t*.7+(i%5)*.02;mistPos[i*3+2]=Math.sin(angle)*t*(.2+i/100);}mistGeo.attributes.position.needsUpdate=true;
  const width=canvas.clientWidth,height=canvas.clientHeight;if(canvas.width!==Math.floor(width*renderer.getPixelRatio())||canvas.height!==Math.floor(height*renderer.getPixelRatio())){renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();}
  cameraDistance+=((two?10.2:5.8)-cameraDistance)*(1-Math.exp(-elapsed/.18));cameraTarget+=((two?1.8:1.08)-cameraTarget)*(1-Math.exp(-elapsed/.18));const distance=cameraDistance/zoom;camera.position.set(Math.sin(azimuth)*distance,1+Math.sin(elevation)*distance,Math.cos(azimuth)*distance);camera.lookAt(0,cameraTarget,0);
  tint.value.copy(mixLiquid.mat.attenuationColor);if(isFinish||two)tint.value.copy(serveLiquid.mat.attenuationColor);
  audio?.update(model,localValues[4],contact);
  const iceMeshes=[...iceBodies.map(b=>b.mesh),servingIce,inclusions];const fluidMeshes=[mixLiquid.mesh,serveLiquid.mesh];const glassMeshes=[glass,serveGlass,bottle,neck];
  const opticalMeshes=[...iceMeshes,...fluidMeshes,...glassMeshes];const visibility=opticalMeshes.map(m=>m.visible);opticalMeshes.forEach(m=>m.visible=false);
  // Match Three's actual drawing buffer, which floors fractional device pixels.
  // A one-pixel mismatch repeatedly resizes transmission textures between passes.
  const targetWidth=Math.max(1,canvas.width),targetHeight=Math.max(1,canvas.height);
  for(const capture of captures)if(capture.width!==targetWidth||capture.height!==targetHeight){capture.setSize(targetWidth,targetHeight);renderer.initRenderTarget(capture);}
  for(let layer=0;layer<3;layer++){renderer.setRenderTarget(captures[layer]);renderer.render(scene,camera);const group=layer===0?iceMeshes:layer===1?fluidMeshes:glassMeshes;group.forEach(m=>m.visible=visibility[opticalMeshes.indexOf(m)]);}
  renderer.setRenderTarget(null);renderer.render(scene,camera);
  const mark=solver?.inputMark;if(mark&&mark.seq!==lastNativeFrame){lastNativeFrame=mark.seq;requestAnimationFrame(frameTime=>{if(disposed)return;diagnostics.nativeLatency.push({seq:mark.seq,sampleToFrame:performance.timeOrigin+frameTime-mark.sampleEpoch,receiptToFrame:frameTime-mark.receivedAt});if(diagnostics.nativeLatency.length>2000)diagnostics.nativeLatency.shift();});}
  diagnostics.frames++;diagnostics.width=canvas.width;diagnostics.height=canvas.height;if(elapsed>0){diagnostics.frameTimes.push(rawElapsed*1000);if(diagnostics.frameTimes.length>3600)diagnostics.frameTimes.shift();}diagnostics.gpuDispatches=solver?.dispatches??0;diagnostics.gpuReads=solver?.reads??0;diagnostics.gpuState=Array.from(localValues);diagnostics.ice=iceBodies.map(b=>[b.x,b.y,b.z]);diagnostics.responseAt=now;
  if(!announced&&diagnostics.frames>3&&(!solver||solver.reads>1)){announced=true;onStatus(solver?'Live liquid ready':'Simplified rendering · full guided controls');}
  if(now-notifyTime>100){notifyTime=now;model.notify();}raf=requestAnimationFrame(frame);
 }
 function remainingSource(){return model.sources[model.selected]/definition.ingredients[model.selected].initial;}
 raf=requestAnimationFrame(frame);
 const visibility=()=>{model.disarm();last=0;accumulator=0;};document.addEventListener('visibilitychange',visibility);window.addEventListener('blur',visibility);
 device?.lost.then(info=>failRender(info));
 return {diagnostics,orbit(dx:number,dy=0){azimuth+=dx;elevation=clamp(elevation+dy,.12,.9);},zoom(n:number){zoom=clamp(zoom+n,.7,1.4);},probe:()=>solver?.probe(),inspect(){return {mixingTilt:mixing.rotation.toArray(),mixingPosition:mixing.position.toArray(),strainerWorld:new T.Vector3().setFromMatrixPosition(strainer.matrixWorld).toArray(),stream:{visible:stream.visible,from:from.toArray(),to:to.toArray()},liquidPlane,renderedPourAngle:pourAngle,servingTilt:receiving.rotation.toArray(),camera:camera.position.toArray(),mixHeight:level(model.mix),serveHeight:level(model.serving,true),liquid:[mixLiquid,serveLiquid].map(d=>{const p=d.g.getAttribute('position');let low=Infinity,high=-Infinity,worldLow=Infinity,worldHigh=-Infinity;const point=new T.Vector3();for(let i=0;i<d.topCount;i++){const y=p.getY(i);low=Math.min(low,y);high=Math.max(high,y);if(y>LIQUID_BOTTOM+.002&&y<LIQUID_RIM-.002){point.fromBufferAttribute(p,i).applyMatrix4(d.mesh.matrixWorld);worldLow=Math.min(worldLow,point.y);worldHigh=Math.max(worldHigh,point.y);}}return {visible:d.mesh.visible,min:low,max:high,worldSurfaceSpan:Number.isFinite(worldLow)?worldHigh-worldLow:0};}),sourceFill:remainingSource(),iceRetained:iceBodies.filter(b=>b.mesh.visible).length};},
 dispose(){disposed=true;cancelAnimationFrame(raf);document.removeEventListener('visibilitychange',visibility);window.removeEventListener('blur',visibility);model.disarm();scene.traverse(o=>{if((o as T.Mesh).isMesh){const m=o as T.Mesh;m.geometry.dispose();for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();}});captures.forEach(r=>r.dispose());env.dispose();stone.dispose();renderer.dispose();solver?.dispose();device?.destroy();}
 };
}
