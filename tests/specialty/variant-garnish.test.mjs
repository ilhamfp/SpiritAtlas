import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createCanvas} from '@napi-rs/canvas';
import * as THREE from 'three';
import {MeshBVH} from 'three-mesh-bvh';
import {createGarnish} from '../../src/animation/classic/core/garnish.js';
import {createVariantAccent,createVariantGarnish} from '../../src/animation/classic/variant-garnish.js';

function withCanvas(run){
  const previous=globalThis.document;globalThis.document={createElement:()=>createCanvas(1,1)};
  try{return run();}finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
}
function dispose(root){
  const resources=new Set();root.traverse(object=>{
    if(object.geometry)resources.add(object.geometry);
    if(object.isInstancedMesh)object.dispose();
    for(const material of [object.material].flat().filter(Boolean)){
      resources.add(material);for(const value of Object.values(material))if(value?.isTexture)resources.add(value);
    }
  });for(const resource of resources)resource.dispose();
}

test('BBF returns the unchanged classic garnish and its photographic texture API',()=>withCanvas(()=>{
  const original=createGarnish(THREE);
  try{assert.equal(createVariantGarnish(THREE,'bbf-negroni',()=>original),original);
    assert.equal(createVariantAccent(THREE,'bbf-negroni'),null);
  }finally{dispose(original.group);}
}));

test('variants retain classic transforms and ice while their label anchors follow the replacement accent',()=>withCanvas(()=>{
  for(const id of ['ichigo-negroni','negroni-express']){
    const original=createGarnish(THREE),reference=createGarnish(THREE);
    const animated=original.group.getObjectByName('Fresh orange half-wheel');
    const oldGeometry=animated.children[0].geometry;let released=0;oldGeometry.addEventListener('dispose',()=>released++);
    const variant=createVariantGarnish(THREE,id,()=>original);
    try{
      assert.equal(variant.group,original.group);
      assert.equal(variant.anchors,original.anchors);assert.equal(variant.colliders,original.colliders);
      assert.equal(animated,variant.group.getObjectByName('Fresh orange half-wheel'));
      assert.equal(animated.children.length,1);assert.equal(released,1);
      const unusedTexture=new THREE.Texture();variant.setCitrusTexture(unusedTexture);unusedTexture.dispose();
      assert.equal(animated.children.length,1);
      for(const progress of [0,.24,1,.24]){
        variant.update({progress});reference.update({progress});variant.group.updateMatrixWorld(true);reference.group.updateMatrixWorld(true);
        assert.deepEqual(variant.anchors.ice.toArray(),reference.anchors.ice.toArray());
        assert.ok(variant.anchors.orange.distanceTo(reference.anchors.orange)>.1,'Replacement label must leave the old orange anchor');
        assert.ok(new THREE.Box3().setFromObject(animated).containsPoint(variant.anchors.orange),
          'Label leader follows the replacement geometry, before the shared projection scale');
        assert.deepEqual(variant.colliders,reference.colliders);
        for(let i=0;i<variant.group.children.length;i++)assert.deepEqual(
          variant.group.children[i].matrixWorld.toArray(),reference.group.children[i].matrixWorld.toArray());
      }
    }finally{dispose(variant.group);dispose(reference.group);}
  }
}));

test('accent geometry and PBR textures are deterministic and export without a DOM',()=>{
  function digest(id){
    const accent=createVariantAccent(THREE,id),hash=createHash('sha256');let triangles=0;
    try{accent.traverse(object=>{if(!object.isMesh)return;
      const geometry=object.geometry;triangles+=(geometry.index?.count??geometry.attributes.position.count)/3;
      for(const attribute of Object.values(geometry.attributes)){
        assert.ok([...attribute.array].every(Number.isFinite));hash.update(Buffer.from(attribute.array.buffer));
      }
      for(const key of ['map','bumpMap','roughnessMap'])if(object.material[key]){
        const map=object.material[key];assert.ok(map.isDataTexture);assert.equal(map.image.data.length,map.image.width*map.image.height*4);
        hash.update(map.image.data);assert.equal(map.colorSpace,key==='map'?THREE.SRGBColorSpace:THREE.NoColorSpace);
      }
    });assert.ok(triangles<18000);return hash.digest('hex');}finally{dispose(accent);}
  }
  for(const id of ['ichigo-negroni','negroni-express'])assert.equal(digest(id),digest(id));
  assert.throws(()=>createVariantAccent(THREE,'unknown'),/Unknown/);
});

test('all accent vertices clear a conservative glass wall through 433 classic poses',()=>withCanvas(()=>{
  const point=new THREE.Vector3();
  for(const id of ['ichigo-negroni','negroni-express']){
    const garnish=createVariantGarnish(THREE,id,createGarnish),accent=garnish.group.getObjectByName('Fresh orange half-wheel');
    try{for(let frame=0;frame<=432;frame++){
      garnish.update({progress:frame/432});garnish.group.updateMatrixWorld(true);
      accent.traverse(object=>{if(!object.geometry)return;const positions=object.geometry.attributes.position;
        for(let i=0;i<positions.count;i++){
          point.fromBufferAttribute(positions,i).applyMatrix4(object.matrixWorld);
          // The classic rim is at2.335; use a taller, narrower cylinder for this
          // test, so clearing it also clears the actual rim and upper glass.
          if(point.y<2.35)assert.ok(Math.hypot(point.x,point.z)<.916,`${id} frame${frame}`);
        }
      });
    }}finally{dispose(garnish.group);}
  }
}));

test('accents rest on actual ice triangles and do not intersect any ice through the full path',()=>withCanvas(()=>{
  for(const id of ['ichigo-negroni','negroni-express']){
    const garnish=createVariantGarnish(THREE,id,createGarnish),accent=garnish.group.getObjectByName('Fresh orange half-wheel');
    const ice=garnish.group.children.filter(object=>object.name.startsWith('Hand-cut ice')).map(object=>object.children[0]);
    const pieces=[];accent.traverse(object=>{if(object.isMesh)pieces.push(object);});
    const transform=(base,object)=>new THREE.Matrix4().copy(base.matrixWorld).invert().multiply(object.matrixWorld);
    try{
      for(const object of [...ice,...pieces])object.geometry.boundsTree=new MeshBVH(object.geometry,{indirect:true});
      garnish.update({progress:0});garnish.group.updateMatrixWorld(true);
      const body=pieces.find(object=>object.name.includes(id==='ichigo-negroni'?'Round red':'shishito body'));
      const support=ice[1],onIce={},onBody={};
      support.geometry.boundsTree.closestPointToGeometry(body.geometry,transform(support,body),onIce,onBody);
      assert.ok(onIce.distance>0&&onIce.distance<.0003,`${id} must contact its supporting ice`);
      if(id==='negroni-express'){
        const face=onBody.faceIndex,index=body.geometry.index,uv=body.geometry.attributes.uv;
        const bodyLocation=[0,1,2].reduce((sum,n)=>sum+uv.getY(index?index.getX(face*3+n):face*3+n)/3,0);
        assert.ok(bodyLocation>.2&&bodyLocation<.75,'The pepper body, not its narrow tip or stem, bears on the ice');
      }
      for(let frame=0;frame<=432;frame++){
        garnish.update({progress:frame/432});garnish.group.updateMatrixWorld(true);
        for(const block of ice)for(const piece of pieces)assert.equal(
          block.geometry.boundsTree.intersectsGeometry(piece.geometry,transform(block,piece)),false,
          `${id} ${piece.name} intersects ${block.parent.name} at frame${frame}`);
      }
    }finally{dispose(garnish.group);}
  }
}));
