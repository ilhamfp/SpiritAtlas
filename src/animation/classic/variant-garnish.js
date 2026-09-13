// Small deterministic accents for the existing classic garnish rig. These are
// illustrative ingredient forms; they do not reconstruct the older drink GLBs.
const ids=new Set(['bbf-negroni','ichigo-negroni','negroni-express']);
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const noise=(x,y,seed=0)=>{
  let n=Math.imul(x+seed*17,374761393)+Math.imul(y+seed*31,668265263);
  n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;
};

function texture(THREE,name,size,paint,color=false){
  const pixels=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const value=paint(x/size,y/size,x,y),k=(y*size+x)*4;
    for(let c=0;c<3;c++)pixels[k+c]=Math.round(clamp(Array.isArray(value)?value[c]:value,0,255));
    pixels[k+3]=255;
  }
  const map=new THREE.DataTexture(pixels,size,size,THREE.RGBAFormat);
  map.name=name;map.colorSpace=color?THREE.SRGBColorSpace:THREE.NoColorSpace;
  map.wrapS=map.wrapT=THREE.RepeatWrapping;map.magFilter=THREE.LinearFilter;
  map.minFilter=THREE.LinearMipmapLinearFilter;map.generateMipmaps=true;map.needsUpdate=true;
  map.anisotropy=4;return map;
}

function mesh(THREE,name,geometry,material){
  const object=new THREE.Mesh(geometry,material);object.name=name;
  object.castShadow=object.receiveShadow=true;return object;
}

function flower(THREE){
  const group=new THREE.Group();group.name='Yellow flower and red garnish';
  group.userData.description='Illustrative yellow flower and smooth red garnish; species and red-garnish composition are unspecified.';
  const petalBump=texture(THREE,'Fine longitudinal petal veins',128,(u,v,x,y)=>
    125+22*Math.sin(u*84+Math.sin(v*13)*.6)+7*Math.sin(u*213-v*5)+noise(x,y,4)*12);
  const petals=new THREE.MeshPhysicalMaterial({name:'Warm yellow translucent petals',color:'#ffffff',
    vertexColors:true,roughness:.48,metalness:0,transmission:.13,thickness:.018,ior:1.38,
    sheen:.42,sheenColor:'#fff1a4',sheenRoughness:.8,side:THREE.DoubleSide,
    bumpMap:petalBump,bumpScale:.0011});
  const positions=[],uvs=[],colors=[],indices=[];
  const gold=new THREE.Color('#d7a30b'),yellow=new THREE.Color('#ffdd39'),tip=new THREE.Color('#ffe989');
  const rows=9,columns=6;
  // Overlapping whorls produce a cupped, densely petalled flower. Each narrow
  // petal has a lifted central vein, asymmetry and a rolled tip, not a flat disk.
  for(let ring=0;ring<5;ring++){
    const count=[26,25,23,20,17][ring],length=[.285,.239,.187,.137,.082][ring];
    for(let petal=0;petal<count;petal++){
      const jitter=noise(petal,ring,21),angle=(petal+jitter*.19)*Math.PI*2/count+ring*.271;
      const width=(.046-ring*.004)*( .88+noise(petal,ring,6)*.25);
      const len=length*(.91+jitter*.17),start=positions.length/3;
      const base=.018+ring*.005;
      for(let row=0;row<=rows;row++)for(let column=0;column<=columns;column++){
        const v=row/rows,u=column/columns*2-1;
        const shape=Math.pow(Math.sin(Math.PI*(v*.96+.025)),.62);
        const across=u*width*shape;
        const along=base+v*len;
        const curl=Math.pow(v,4)*(.017+.019*jitter);
        const cup=.013*u*u*Math.sin(Math.PI*v);
        const y=.395+ring*.018+.034*Math.sin(v*Math.PI*.7)+curl+cup-.006*(1-u*u)*Math.sin(Math.PI*v);
        positions.push(-.105+Math.cos(angle)*along-Math.sin(angle)*across,y,
          -.005+Math.sin(angle)*along*.77+Math.cos(angle)*across*.77);
        uvs.push((u+1)/2,v);
        const color=gold.clone().lerp(yellow,clamp(.4+v*.5-ring*.025)).lerp(tip,Math.pow(v,5)*.24);
        color.multiplyScalar(.9+noise(petal,ring,12)*.13);colors.push(color.r,color.g,color.b);
        if(row<rows&&column<columns){const a=start+row*(columns+1)+column,b=a+columns+1;
          indices.push(a,a+1,b,a+1,b+1,b);}
      }
    }
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();
  group.add(mesh(THREE,'Layered golden flower petals',geometry,petals));
  const green=new THREE.MeshPhysicalMaterial({name:'Soft green flower receptacle',color:'#576b25',roughness:.54});
  const receptacle=mesh(THREE,'Flower receptacle',new THREE.SphereGeometry(1,20,12),green);
  receptacle.position.set(-.105,.385,-.005);receptacle.scale.set(.106,.036,.087);group.add(receptacle);
  const redMap=texture(THREE,'Natural red garnish color',128,(u,v,x,y)=>{
    const cloud=Math.sin(u*16+Math.sin(v*9))*Math.sin(v*18-u*4),n=noise(x,y,8);
    return [142+23*cloud+10*n,19+4*cloud+5*n,15+3*cloud+4*n];
  },true);
  const redBump=texture(THREE,'Fine red garnish skin',128,(u,v,x,y)=>128+noise(x,y,7)*29+6*Math.sin(u*100)*Math.sin(v*88));
  const redRoughness=texture(THREE,'Red garnish wax variation',128,(u,v)=>70+15*Math.sin(u*14)*Math.sin(v*10));
  const red=new THREE.MeshPhysicalMaterial({name:'Glossy red garnish skin',color:'#ffffff',map:redMap,
    bumpMap:redBump,bumpScale:.00085,roughness:1,roughnessMap:redRoughness,clearcoat:.42,
    clearcoatRoughness:.23,ior:1.43,transmission:.035,thickness:.1});
  const redGeometry=new THREE.SphereGeometry(1,48,32),points=redGeometry.attributes.position;
  for(let i=0;i<points.count;i++){
    const x=points.getX(i),y=points.getY(i),z=points.getZ(i);
    const shape=1+.018*Math.sin(x*9+z*7)*Math.sin(y*7)-.075*Math.exp(-(((1-y)*13)**2));
    points.setXYZ(i,x*shape,y*shape,z*shape);
  }
  redGeometry.computeVertexNormals();
  const fruit=mesh(THREE,'Round red garnish (composition unspecified)',redGeometry,red);
  fruit.position.set(-.06,.238,.007);fruit.scale.set(.152,.155,.139);group.add(fruit);
  return group;
}

function pepper(THREE){
  const group=new THREE.Group();group.name='Curved green pepper with stem';
  group.userData.description='Illustrative pickled shishito with lobed wrinkled skin and a curved stem.';
  const skin=texture(THREE,'Olive green pepper skin',256,(u,v,x,y)=>{
    const stripe=Math.cos(u*Math.PI*8+.42*Math.sin(v*21));
    const mottling=Math.sin(u*31+v*19)*Math.sin(v*37-u*13),n=noise(x,y,17);
    return [62+10*stripe+12*mottling+7*n,88+14*stripe+15*mottling+8*n,24+3*stripe+5*mottling+4*n];
  },true);
  const relief=texture(THREE,'Shishito fine folds and pores',256,(u,v,x,y)=>
    125+23*Math.cos(u*Math.PI*8+.42*Math.sin(v*21))+14*Math.sin(v*81+Math.sin(u*20)*2)+noise(x,y,14)*14);
  const roughness=texture(THREE,'Pickled pepper wet-skin variation',128,(u,v)=>
    77+15*Math.sin(u*25+v*12)*Math.sin(v*19));
  const material=new THREE.MeshPhysicalMaterial({name:'Textured pickled green pepper',color:'#ffffff',map:skin,
    bumpMap:relief,bumpScale:.0016,roughness:1,roughnessMap:roughness,clearcoat:.31,
    clearcoatRoughness:.23,transmission:.025,thickness:.08,ior:1.42});
  const curve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.365,.406,-.008),new THREE.Vector3(-.22,.32,-.012),
    new THREE.Vector3(-.035,.288,.011),new THREE.Vector3(.125,.32,.025),new THREE.Vector3(.257,.409,.019)]);
  const segments=72,sides=36,frames=curve.computeFrenetFrames(segments,false),positions=[],uvs=[],indices=[];
  for(let row=0;row<=segments;row++){
    const t=row/segments,point=curve.getPointAt(t),normal=frames.normals[row],binormal=frames.binormals[row];
    const width=.087*Math.pow(Math.sin(Math.PI*(.16+t*.84)),.64)+.003;
    for(let side=0;side<=sides;side++){
      const u=side/sides,angle=u*Math.PI*2;
      const lobes=1+.105*Math.cos(angle*4+.35*Math.sin(t*7))+.025*Math.sin(angle*7+t*19);
      const wrinkle=1+.026*Math.sin(t*69+Math.sin(angle*3)*1.7)+.015*Math.sin(t*127-angle*5);
      const a=Math.cos(angle)*width*lobes*wrinkle,b=Math.sin(angle)*width*.77*lobes*wrinkle;
      positions.push(point.x+normal.x*a+binormal.x*b,point.y+normal.y*a+binormal.y*b,point.z+normal.z*a+binormal.z*b);
      uvs.push(u,t);
      if(row<segments&&side<sides){const k=row*(sides+1)+side,j=k+sides+1;indices.push(k,k+1,j,k+1,j+1,j);}
    }
  }
  // Closed ends prevent an open dark tube at the calyx or pointed tip.
  for(const end of [0,1]){
    const point=curve.getPointAt(end),center=positions.length/3;positions.push(point.x,point.y,point.z);uvs.push(.5,end);
    const row=end*segments*(sides+1);
    for(let side=0;side<sides;side++)indices.push(center,row+side+(end?0:1),row+side+(end?1:0));
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
  group.add(mesh(THREE,'Wrinkled shishito body',geometry,material));
  const stemBump=texture(THREE,'Pepper stem grain',64,(u,v)=>128+35*Math.sin(u*52+Math.sin(v*14)));
  const stemMaterial=new THREE.MeshPhysicalMaterial({name:'Matte green pepper stem',color:'#637131',
    roughness:.59,bumpMap:stemBump,bumpScale:.0011});
  const stemCurve=new THREE.CatmullRomCurve3([new THREE.Vector3(-.355,.408,-.008),
    new THREE.Vector3(-.405,.406,-.012),new THREE.Vector3(-.46,.453,-.005),new THREE.Vector3(-.50,.457,.009)]);
  group.add(mesh(THREE,'Bent pepper stem',new THREE.TubeGeometry(stemCurve,28,.012,10,false),stemMaterial));
  const calyx=mesh(THREE,'Lobed pepper calyx',new THREE.SphereGeometry(1,28,16),stemMaterial);
  calyx.position.copy(curve.getPointAt(0));calyx.scale.set(.04,.052,.045);calyx.rotation.z=-.5;group.add(calyx);
  return group;
}

/** A local-space accent, reusable by browser or offline scene export. */
export function createVariantAccent(THREE,id){
  if(!ids.has(id))throw new Error(`Unknown classic garnish variant: ${id}`);
  if(id==='bbf-negroni')return null;
  const accent=id==='ichigo-negroni'?flower(THREE):pepper(THREE);
  // Seat each accent on an actual classic ice surface at rest.
  // These local offsets retain the original animated orange parent unchanged;
  // triangle-contact and complete-path wall/ice checks bind the placement.
  accent.position.fromArray(id==='ichigo-negroni'
    ?[-.11179691883131555,-.45531876751555,.35280663112215]
    :[-.1340327944330911,-.5744819784014936,.3953237664285921]);
  // The pepper bears across the front-right cube. Turning its body toward the
  // open side also keeps it clear of the separated liquid on the classic path.
  if(id==='negroni-express')accent.rotation.y=1.05;
  accent.userData.restSupport='Classic hand-cut ice 2';
  accent.userData.variantId=id;accent.userData.ingredientRole='garnish';return accent;
}

function releaseReplacedChildren(root,animatedGroup){
  const retained=new Set(),removed=new Set();
  const collect=(object,resources)=>{
    if(object.geometry)resources.add(object.geometry);
    for(const material of [object.material].flat().filter(Boolean)){
      resources.add(material);for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
    }
  };
  const children=[...animatedGroup.children];
  for(const child of children){child.traverse(object=>collect(object,removed));animatedGroup.remove(child);}
  root.traverse(object=>collect(object,retained));
  for(const resource of removed)if(!retained.has(resource))resource.dispose();
  for(const child of children)child.traverse(object=>{if(object.isInstancedMesh)object.dispose();});
}

/** Preserve all three classic ice pieces, anchors and animation functions. */
export function createVariantGarnish(THREE,id,createClassicGarnish){
  if(!ids.has(id))throw new Error(`Unknown classic garnish variant: ${id}`);
  const classic=createClassicGarnish(THREE);
  if(id==='bbf-negroni')return classic;
  const animatedGroup=classic.group.getObjectByName('Fresh orange half-wheel');
  if(!animatedGroup)throw new Error('Classic garnish animation group is missing');
  const accent=createVariantAccent(THREE,id);
  // Cache the geometric center before parenting. Anchor projection applies the
  // shared model scale, so this point stays in the classic rig's local space.
  accent.updateMatrixWorld(true);
  const anchorCenter=new THREE.Box3().setFromObject(accent).getCenter(new THREE.Vector3());
  releaseReplacedChildren(classic.group,animatedGroup);animatedGroup.add(accent);
  animatedGroup.userData.variantId=id;
  const update=state=>{
    classic.update(state);animatedGroup.updateMatrix();
    classic.anchors.orange.copy(anchorCenter).applyMatrix4(animatedGroup.matrix);
  };
  update({progress:0});
  // The classic closure continues driving this group. Prevent later orange-map
  // loads from reactivating the replaced photographic faces.
  return {...classic,update,setCitrusTexture(){}};
}
