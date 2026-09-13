import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';

export function createStudio(renderer, scene) {
  RectAreaLightUniformsLib.init();
  const room = new THREE.Scene();
  room.background = new THREE.Color('#776956');
  function card(position, scale, color, intensity = 1) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({color, side:THREE.DoubleSide}));
    m.material.color.multiplyScalar(intensity); m.position.set(...position); m.scale.set(...scale); m.lookAt(0,2,0); room.add(m);
  }
  card([-4,4,4],[1.7,7,1],'#fff8e5',4);
  card([4,3,2],[.65,5,1],'#fff5df',3);
  card([0,6,-2],[5,2,1],'#f6dcc0',4);
  card([2,2,-4],[2.5,5,1],'#c07032',1.7);
  card([0,1,6],[2,5,1],'#151616',.3);
  card([-6,1,0],[3,7,1],'#181717',.3);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .035);
  scene.environment = environment.texture;
  scene.environmentIntensity = .72;
  const cubeTarget = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
  const cubeCamera = new THREE.CubeCamera(.1,100,cubeTarget);
  cubeCamera.position.set(0,2,0); cubeCamera.update(renderer,room);
  pmrem.dispose();
  // The cards have been baked into both environment targets. Release their
  // temporary geometry and materials as soon as their captures are complete.
  room.traverse(object=>{object.geometry?.dispose();object.material?.dispose();});
  room.clear();

  scene.add(new THREE.HemisphereLight('#ece1ce','#3c3022',1.15));
  const key = new THREE.DirectionalLight('#fff1d8',2.2);
  key.position.set(-3,7,4);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-5,right:5,top:7,bottom:-4,near:.1,far:20});
  key.shadow.bias=-.0003;key.shadow.normalBias=.03;key.shadow.radius=6;
  scene.add(key);
  const edge = new THREE.RectAreaLight('#fff0d0',9,2.5,5);
  edge.position.set(4,4,-2);edge.lookAt(0,2,0);scene.add(edge);
  const fill = new THREE.RectAreaLight('#f9e9d7',5,3,5);
  fill.position.set(-4,3,3);fill.lookAt(0,2,0);scene.add(fill);
  const rear = new THREE.PointLight('#dd6a23',4,10,2);rear.position.set(0,2,-2);scene.add(rear);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(80,50), new THREE.ShaderMaterial({
    uniforms:{uDark:{value:new THREE.Color('#1a1916')},uLight:{value:new THREE.Color('#8d7960')}},vertexShader:`varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 uDark;uniform vec3 uLight;varying vec3 vWorld;void main(){vec2 p=(vWorld.xy-vec2(.6,2.5))*vec2(.20,.15);float glow=exp(-dot(p,p)*1.8);vec3 c=mix(uDark,uLight,glow*.74);gl_FragColor=vec4(c,1.);
    #include <colorspace_fragment>
    }`,depthWrite:false,toneMapped:false,
  }));backdrop.position.set(0,10,-9);scene.add(backdrop);
  const floorCanvas=document.createElement('canvas');floorCanvas.width=floorCanvas.height=256;
  const ctx=floorCanvas.getContext('2d');const data=ctx.createImageData(256,256);
  let seed=77;for(let i=0;i<data.data.length;i+=4){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const n=125+(seed/4294967296)*12;data.data[i]=data.data[i+1]=data.data[i+2]=n;data.data[i+3]=255;}ctx.putImageData(data,0,0);
  const stone=new THREE.CanvasTexture(floorCanvas);stone.wrapS=stone.wrapT=THREE.RepeatWrapping;stone.repeat.set(12,12);
  const floor=new THREE.Mesh(new THREE.PlaneGeometry(200,200),new THREE.ShadowMaterial({opacity:.13}));
  floor.rotation.x=-Math.PI/2;floor.position.y=-.045;floor.receiveShadow=true;scene.add(floor);
  const coaster=new THREE.Mesh(new THREE.CylinderGeometry(1.18,1.20,.026,128),new THREE.MeshStandardMaterial({color:'#28261f',roughness:.61,metalness:.14,bumpMap:stone,bumpScale:.005}));coaster.position.y=-.027;coaster.receiveShadow=true;scene.add(coaster);
  // A soft contact shadow anchors transparent surfaces that do not cast opacity shadows.
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const sc=shadowCanvas.getContext('2d');const grad=sc.createRadialGradient(64,64,9,64,64,64);grad.addColorStop(0,'rgba(0,0,0,.7)');grad.addColorStop(.5,'rgba(0,0,0,.3)');grad.addColorStop(1,'rgba(0,0,0,0)');sc.fillStyle=grad;sc.fillRect(0,0,128,128);
  const shadow=new THREE.Mesh(new THREE.PlaneGeometry(3.7,3.7),new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(shadowCanvas),transparent:true,depthWrite:false}));
  shadow.rotation.x=-Math.PI/2;shadow.position.y=-.031;scene.add(shadow);
  return {cubeMap:cubeTarget.texture,environment,dispose(){environment.dispose();cubeTarget.dispose();}};
}

export function createGlass(sceneTexture, cubeMap, resolution) {
  const group=new THREE.Group();group.name='Hand-blown rocks glass';
  const profile=[
    [0,.035],[.73,.035],[.84,.04],[.89,.065],[.924,.115],[.934,.2],
    [.942,.45],[.953,.85],[.962,1.3],[.971,1.8],[.98,2.24],
    [.982,2.30],[.98,2.325],[.967,2.343],[.944,2.349],[.926,2.337],
    [.917,2.316],[.916,2.28],[.91,1.8],[.90,1.3],[.89,.8],[.88,.39],
    [.868,.31],[.836,.272],[.76,.259],[0,.259],
  ];
  const geometry=new THREE.LatheGeometry(profile.map(([x,y])=>new THREE.Vector2(x,y)),192);
  const material=new THREE.ShaderMaterial({
    uniforms:{tScene:{value:sceneTexture},tEnvironment:{value:cubeMap},resolution:{value:resolution},uTint:{value:new THREE.Color('#f6f7eb')}},
    vertexShader:`varying vec3 vWorld;varying vec3 vNormal;varying vec3 vLocal;void main(){vLocal=position;vWorld=(modelMatrix*vec4(position,1.)).xyz;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tScene;uniform samplerCube tEnvironment;uniform vec2 resolution;uniform vec3 uTint;varying vec3 vWorld;varying vec3 vNormal;varying vec3 vLocal;
    void main(){vec3 N=normalize(vNormal);vec3 I=normalize(vWorld-cameraPosition);float ndv=abs(dot(N,-I));float fresnel=.042+.958*pow(1.-ndv,5.);vec3 viewN=mat3(viewMatrix)*N;vec2 uv=gl_FragCoord.xy/resolution;float base=1.-smoothstep(.08,.35,vLocal.y);float thickness=mix(.011,.027,base);vec2 bend=viewN.xy*thickness*(1.-ndv*.6);vec3 transmitted;
    transmitted.r=texture2D(tScene,clamp(uv+bend*1.015,vec2(.001),vec2(.999))).r;
    transmitted.g=texture2D(tScene,clamp(uv+bend,vec2(.001),vec2(.999))).g;
    transmitted.b=texture2D(tScene,clamp(uv+bend*.985,vec2(.001),vec2(.999))).b;
    vec3 reflection=textureCube(tEnvironment,reflect(I,N)).rgb;
    vec3 color=transmitted*uTint*(1.-.035*base);color=color*(1.-fresnel*.24)+reflection*fresnel*.43;
    gl_FragColor=vec4(color,1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
    side:THREE.FrontSide,
  });
  const body=new THREE.Mesh(geometry,material);body.renderOrder=20;group.add(body);
  // Fine concentric foot and lip catch specular light without a bulky opaque rim.
  const rimMat=new THREE.MeshPhysicalMaterial({color:'#eee7d8',roughness:.05,metalness:.1,transparent:true,opacity:.24,depthWrite:false,envMapIntensity:1.1});
  for(const [r,y,tube] of [[.948,2.335,.012],[.896,.092,.014],[.838,.251,.009]]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(r,tube,10,160),rimMat);ring.rotation.x=Math.PI/2;ring.position.y=y;ring.renderOrder=22;group.add(ring);
  }
  // Tiny chilled condensation beads, concentrated below the fill line.
  const dropMat=new THREE.MeshPhysicalMaterial({color:'#dfded5',roughness:.02,metalness:.15,transparent:true,opacity:.25,depthWrite:false,envMapIntensity:1.15});
  const beads=new THREE.InstancedMesh(new THREE.SphereGeometry(1,8,6),dropMat,64);const dummy=new THREE.Object3D();
  let seed=11;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  dropMat.opacity=.13;
  for(let i=0;i<64;i++){const a=rand()*Math.PI*2,y=.27+rand()*1.58,r=.94+.022*y,s=.004+rand()**3*.010;dummy.position.set(Math.sin(a)*r,y,Math.cos(a)*r);dummy.scale.set(s,s*(1.2+rand()),s*.45);dummy.rotation.set(0,a,0);dummy.updateMatrix();beads.setMatrixAt(i,dummy.matrix);}beads.renderOrder=23;group.add(beads);
  return {group,material};
}
