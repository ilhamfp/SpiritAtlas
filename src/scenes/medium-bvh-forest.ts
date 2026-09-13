// Diagnostic-only medium forest for the fixed assembled v0.12 Somma asset.
// The global vertices/attributes are shared; only indices and nodes are repeated.
import * as THREE from 'three';
import {MeshBVH,SAH,FloatVertexAttributeTexture,UIntVertexAttributeTexture,BVHShaderGLSL} from 'three-mesh-bvh';

export const TESTED_MEDIUM_BVH_SHA256='dbe09749baef002d22421f61f0010c7c67386235c256223738879bd7b34c90f2';
export type ForestRange={medium:number;root:number;nodeCount:number;triangleOffset:number;triangleCount:number};
type RawBVH=MeshBVH & {_roots:ArrayBuffer[]};

function dataTexture(data:Float32Array|Uint32Array,dimension:number,integer:boolean){
 const texture=new THREE.DataTexture(data,dimension,dimension,integer?THREE.RGIntegerFormat:THREE.RGBAFormat,integer?THREE.UnsignedIntType:THREE.FloatType);
 texture.internalFormat=integer?'RG32UI':'RGBA32F';texture.minFilter=texture.magFilter=THREE.NearestFilter;
 texture.generateMipmaps=false;texture.needsUpdate=true;return texture;
}

export function createMediumBVHForest(geometry:THREE.BufferGeometry,fullBVH:MeshBVH){
 const position=geometry.getAttribute('position') as THREE.BufferAttribute;
 const optics=geometry.getAttribute('opticalData') as THREE.BufferAttribute;
 if(fullBVH.geometry!==geometry||!geometry.index||!optics||position.count%3!==0||geometry.index.count!==position.count)throw new Error('Medium forest requires the diagnostic nonindexed vertex layout and its full BVH.');
 const fullIndex=geometry.index;
 for(let i=0;i<fullIndex.count;i+=3){const a=fullIndex.getX(i);if(a%3!==0||fullIndex.getX(i+1)!==a+1||fullIndex.getX(i+2)!==a+2)throw new Error('Global triangle triplets changed; medium forest is not applicable.');}
 // The full BVH may reorder its index, but the diagnostic's original vertices
 // remain in consecutive triangle triplets. Subsets retain those global IDs.
 const members:number[][]=[[],[],[],[],[]];
 for(let first=0;first<position.count;first+=3){
  if(optics.getY(first)!==1)continue;
  const inside=optics.getZ(first),outside=optics.getW(first);
  const selected=[inside===1,inside===2,inside===3||inside===4||(inside===1&&outside===3),inside===4];
  for(let m=1;m<=4;m++)if(selected[m-1])members[m].push(first,first+1,first+2);
 }
 const trees:RawBVH[]=[fullBVH as RawBVH];const subsetGeometry:THREE.BufferGeometry[]=[];
 for(let medium=1;medium<=4;medium++){
  if(!members[medium].length)throw new Error(`Missing medium ${medium} boundary`);
  const subset=new THREE.BufferGeometry();subset.setAttribute('position',position);subset.setIndex(new THREE.BufferAttribute(new Uint32Array(members[medium]),1));
  subsetGeometry.push(subset);trees.push(new MeshBVH(subset,{strategy:SAH,targetLeafSize:4}) as RawBVH);
 }
 const ranges:ForestRange[]=[];let nodeCount=0,triangleCount=0;
 for(let medium=0;medium<trees.length;medium++){
  const tree=trees[medium];if(tree._roots.length!==1)throw new Error('Medium forest expects one root per tree.');
  const count=tree._roots[0].byteLength/32,triangles=tree.geometry.index!.count/3;
  ranges.push({medium,root:nodeCount,nodeCount:count,triangleOffset:triangleCount,triangleCount:triangles});
  nodeCount+=count;triangleCount+=triangles;
 }
 const boundsDimension=2*Math.ceil(Math.sqrt(nodeCount/2)),contentsDimension=Math.ceil(Math.sqrt(nodeCount));
 const boundsArray=new Float32Array(4*boundsDimension*boundsDimension),contentsArray=new Uint32Array(2*contentsDimension*contentsDimension),indexArray=new Uint32Array(triangleCount*3);
 for(const range of ranges){
  const tree=trees[range.medium],raw=tree._roots[0],floats=new Float32Array(raw),uints=new Uint32Array(raw),shorts=new Uint16Array(raw),index=tree.geometry.index!;
  for(let i=0;i<index.count;i++)indexArray[range.triangleOffset*3+i]=index.getX(i);
  for(let node=0;node<range.nodeCount;node++){
   const source=node*8,destination=range.root+node;
   for(let axis=0;axis<3;axis++){boundsArray[destination*8+axis]=floats[source+axis];boundsArray[destination*8+4+axis]=floats[source+3+axis];}
   if(shorts[source*2+15]===0xffff){
    contentsArray[destination*2]=(0xffff0000|shorts[source*2+14])>>>0;
    // Leaf offsets address the concatenated triangle-index texture globally.
    contentsArray[destination*2+1]=range.triangleOffset+uints[source+6];
   }else{
    contentsArray[destination*2]=uints[source+7];
    // Internal right-child offsets are relative to the current node, unchanged.
    contentsArray[destination*2+1]=uints[source+6];
   }
  }
 }
 const indexTexture=new UIntVertexAttributeTexture();indexTexture.overrideItemSize=3;indexTexture.updateFrom(new THREE.BufferAttribute(indexArray,1));
 const positionTexture=new FloatVertexAttributeTexture();positionTexture.updateFrom(position);
 const uniform={index:indexTexture,position:positionTexture,bvhBounds:dataTexture(boundsArray,boundsDimension,false),bvhContents:dataTexture(contentsArray,contentsDimension,true)};
 for(const subset of subsetGeometry)subset.dispose();
 const roots=new Uint32Array(ranges.slice(1).map(range=>range.root));
 const dimensions=Object.fromEntries(Object.entries(uniform).map(([name,texture])=>[name,[texture.image.width,texture.image.height]]));
 const byteLength=Object.values(uniform).reduce((sum,texture)=>sum+((texture.image.data as ArrayBufferView).byteLength),0);
 return {uniform,roots,ranges,nodeCount,triangleCount,vertexCount:position.count,dimensions,byteLength,
  maxDimension:Math.max(...Object.values(dimensions).flat()),
  dispose(){for(const texture of Object.values(uniform))texture.dispose();},
 };
}

/** Reuse the installed traversal verbatim, changing only its entry root. */
export function mediumForestRayGLSL(){
 const source=BVHShaderGLSL.bvh_ray_functions;
 const start=source.indexOf('bool _bvhIntersectFirstHit(');
 if(start<0||!source.includes('stack[ 0 ] = 0u;'))throw new Error('Installed BVH traversal format changed.');
 const traversal=source.slice(start)
  .replace('bool _bvhIntersectFirstHit(', 'bool _atlasIntersectFirstHitFromRoot(')
  .replace('sampler2D bvh_position,', 'uint rootIndex, sampler2D bvh_position,')
  .replace('stack[ 0 ] = 0u;', 'stack[ 0 ] = rootIndex;');
 return `
 uniform uvec4 mediumBvhRoots;
 uniform bool useMediumBvh, auditMediumBvh, trapMediumBvh, historyTrapMediumBvh;
 bool atlasTrapHit=false;
 float atlasTrapReason=0.;
 vec4 atlasTrapHits=vec4(0.),atlasTrapBary=vec4(0.);
 ${traversal}
 bool atlasIntersectFirstHit(vec3 p,vec3 d,int medium,inout uvec4 indices,inout vec3 normal,inout vec3 bary,inout float side,inout float distance,inout float mismatches){
  uint root=0u;
  if(useMediumBvh){
   if(medium==1)root=mediumBvhRoots.x;
   else if(medium==2)root=mediumBvhRoots.y;
   else if(medium==3)root=mediumBvhRoots.z;
   else if(medium==4)root=mediumBvhRoots.w;
  }
  bool hit=_atlasIntersectFirstHitFromRoot(root,bvh.position,bvh.index,bvh.bvhBounds,bvh.bvhContents,p,d,indices,normal,bary,side,distance);
  if(auditMediumBvh){
   uvec4 referenceIndices=uvec4(0);vec3 referenceNormal=vec3(0.),referenceBary=vec3(0.);float referenceSide=1.,referenceDistance=0.;
   bool referenceHit=_atlasIntersectFirstHitFromRoot(0u,bvh.position,bvh.index,bvh.bvhBounds,bvh.bvhContents,p,d,referenceIndices,referenceNormal,referenceBary,referenceSide,referenceDistance);
   int reason=hit!=referenceHit?1:0;
   if(hit){
    if(any(notEqual(indices.xyz,referenceIndices.xyz)))reason+=2;
    if(distance!=referenceDistance)reason+=4;
    if(side!=referenceSide)reason+=8;
    if(any(notEqual(normal,referenceNormal)))reason+=16;
    if(any(notEqual(bary,referenceBary)))reason+=32;
   }
   bool differs=reason!=0;
   if(differs){
    mismatches+=1.;
    if(trapMediumBvh){
     atlasTrapHit=true;
     atlasTrapReason=float(reason);
     // Global first vertex IDs fit exactly in float32. Zero means miss;
     // otherwise the sign encodes side and abs(value)-1 is the vertex ID.
     atlasTrapHits=vec4(hit?side*float(indices.x+1u):0.,hit?distance:0.,referenceHit?referenceSide*float(referenceIndices.x+1u):0.,referenceHit?referenceDistance:0.);
     atlasTrapBary=vec4(bary.xy,referenceBary.xy);
    }
   }
   // Verification follows the full-tree result even on a mismatch, preserving
   // the reference path sequence while accumulating a visible QA counter.
   indices=referenceIndices;normal=referenceNormal;bary=referenceBary;side=referenceSide;distance=referenceDistance;return referenceHit;
  }
  return hit;
 }
 `;
}
