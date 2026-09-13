// Exhaustive CPU texture-structure review, independent of the packer's offsets.
// The same actual importer prepares global attributes; no renderer or browser runs.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {stripTypeScriptTypes} from 'node:module';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH,MeshBVHUniformStruct,SAH} from 'three-mesh-bvh';
import {createMediumBVHForest,TESTED_MEDIUM_BVH_SHA256} from '../src/scenes/medium-bvh-forest.ts';
const sha=p=>createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const source='public/models/candidates/v012/negroni-express-interfaces-air-gap.glb';assert.equal(sha(source),TESTED_MEDIUM_BVH_SHA256);
const raw=fs.readFileSync(source),gltf=await new GLTFLoader().parseAsync(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength),'');
const proto=fs.readFileSync('src/scenes/bvh-wavefront-prototype.ts','utf8');
const start=proto.indexOf('const geometries:THREE.BufferGeometry[]=[];'),end=proto.indexOf('const geometry=mergeGeometries(geometries,false);');
assert(start>=0&&end>start,'Actual diagnostic importer delimiters exist');
const setup=stripTypeScriptTypes('function importGeometry(){'+proto.slice(start,end)+'\nreturn mergeGeometries(geometries,false);}')+'\nreturn importGeometry();';
const prepare=new Function('THREE','gltf','mergeGeometries','traceEmitters',setup);
const reports=[];
for(const traceEmitters of [false,true]){
 const geometry=prepare(THREE,gltf,mergeGeometries,traceEmitters),bvh=new MeshBVH(geometry,{strategy:SAH,targetLeafSize:4});
 const original=new MeshBVHUniformStruct();original.updateFrom(bvh);
 const forest=createMediumBVHForest(geometry,bvh),{bvhContents,bvhBounds,index,position}=forest.uniform;
 const c=bvhContents.image.data,b=bvhBounds.image.data,ix=index.image.data,p=position.image.data;
 const pos=geometry.attributes.position,optics=geometry.attributes.opticalData;
 for(let v=0;v<pos.count;v++)for(let axis=0;axis<3;axis++)assert.equal(p[v*4+axis],pos.array[v*3+axis],`global position ${v}/${axis}`);
 const expected=[new Set(),new Set(),new Set(),new Set(),new Set()];
 for(let v=0;v<pos.count;v+=3){
  const triangle=v/3;expected[0].add(triangle);
  if(optics.getY(v)!==1)continue;
  const inside=optics.getZ(v),outside=optics.getW(v);
  if(inside===1)expected[1].add(triangle);
  if(inside===2)expected[2].add(triangle);
  if(inside===3||inside===4||(inside===1&&outside===3))expected[3].add(triangle);
  if(inside===4)expected[4].add(triangle);
 }
 const ranges=[];
 for(const range of forest.ranges){
  const stack=[{node:range.root,depth:0}],visited=new Set(),coverage=new Uint8Array(range.triangleCount),seenTriangles=new Set();let leaves=0,maxDepth=0,maxStack=1;
  while(stack.length){
   maxStack=Math.max(maxStack,stack.length);const {node,depth}=stack.pop();maxDepth=Math.max(maxDepth,depth);
   assert(node>=range.root&&node<range.root+range.nodeCount,'Child stays in its tree, excluding padding');assert(!visited.has(node),'No repeated node or cycle');visited.add(node);
   for(let axis=0;axis<3;axis++)assert(Number.isFinite(b[node*8+axis])&&Number.isFinite(b[node*8+4+axis])&&b[node*8+axis]<=b[node*8+4+axis]);
   const flags=c[node*2],value=c[node*2+1];
   if(flags>>>16){
    leaves++;const count=flags&65535;assert(count>0);assert(value>=range.triangleOffset&&value+count<=range.triangleOffset+range.triangleCount,'Leaf indexes only its own triangle segment');
    for(let t=value;t<value+count;t++){
     const local=t-range.triangleOffset;assert.equal(coverage[local]++,0,'Each index texel occurs once');
     const ids=[ix[t*4],ix[t*4+1],ix[t*4+2]];assert.equal(ids[0]%3,0);assert.equal(ids[1],ids[0]+1);assert.equal(ids[2],ids[0]+2);assert(ids[2]<pos.count);
     const originalTriangle=ids[0]/3;assert(!seenTriangles.has(originalTriangle));seenTriangles.add(originalTriangle);
     for(const v of ids)for(let axis=0;axis<3;axis++)assert(p[v*4+axis]>=b[node*8+axis]&&p[v*4+axis]<=b[node*8+4+axis],'Leaf bounds contain every actual triangle vertex');
    }
   }else{
    assert(flags<=2,'Internal split axis is valid');assert(value>1,'Relative right child follows left subtree');
    const children=[node+1,node+value];
    for(const child of children){
     assert(child>=range.root&&child<range.root+range.nodeCount);
     for(let axis=0;axis<3;axis++)assert(b[child*8+axis]>=b[node*8+axis]&&b[child*8+4+axis]<=b[node*8+4+axis],'Parent bounds contain child bounds');
     stack.push({node:child,depth:depth+1});
    }
   }
  }
  assert.equal(visited.size,range.nodeCount);assert(coverage.every(count=>count===1));assert.deepEqual(seenTriangles,expected[range.medium]);
  ranges.push({...range,visitedNodes:visited.size,leaves,uniqueTriangles:seenTriangles.size,maxDepth,maxStack});
 }
 // Full root is byte-for-byte the installed packer's valid prefix, independent
 // of changed aggregate texture dimensions and unrelated trailing forest nodes.
 const full=forest.ranges[0];for(let i=0;i<full.nodeCount*8;i++)assert.equal(b[i],original.bvhBounds.image.data[i]);
 for(let i=0;i<full.nodeCount*2;i++)assert.equal(c[i],original.bvhContents.image.data[i]);
 for(let i=0;i<full.triangleCount*4;i++)assert.equal(ix[i],original.index.image.data[i]);
 assert.deepEqual([...forest.roots],forest.ranges.slice(1).map(r=>r.root));
 reports.push({traceEmitters,vertexCount:pos.count,globalVerticesExactlyPreserved:true,completeMembershipVerified:true,fullRootPrefixExactlyMatchesInstalledUniformStruct:true,ranges,dimensions:forest.dimensions,byteLength:forest.byteLength});
 forest.dispose();original.dispose();geometry.dispose();
}
const output='qa/evidence/wavefront-packed-forest-independent-structure.json';
const report={kind:'Independent exhaustive CPU topology/index/bounds inspection; no GPU traversal or render',inputs:Object.fromEntries([source,'src/scenes/medium-bvh-forest.ts','src/scenes/bvh-wavefront-prototype.ts','src/scenes/bvh-wavefront-transport.glsl.ts',import.meta.filename].map(p=>[p,sha(p)])),reports,limitations:'Range metadata locates trees, but every pointer, reachable node, leaf index, original triangle, vertex and containment is independently checked. Medium membership matches the declared restriction; this does not establish geometric containment, correct current-medium state, all-ray hit parity or GPU float32 traversal behavior.'};
fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({output,reports},null,2));
