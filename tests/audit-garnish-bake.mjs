// Independent export check: normals survive glTF and baking preserves triangles/poses.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {Matrix3, Texture, Vector3} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const hash = value => createHash('sha256').update(value).digest('hex');
const sourceTag = process.env.ATLAS_BAKE_SOURCE || 'v014';
const candidateTag = process.env.ATLAS_BAKE_CANDIDATE || 'v014-baked';
const drinks = process.env.ATLAS_BAKE_DRINKS?.split(',') || ['bbf-negroni','ichigo-negroni','negroni-express'];
const output = process.env.ATLAS_BAKE_AUDIT_OUTPUT || `qa/evidence/garnish-${candidateTag}-export-audit.json`;
function read(path) {
 const buffer=fs.readFileSync(path);const length=buffer.readUInt32LE(12);
 return {buffer, json:JSON.parse(buffer.toString('utf8',20,20+length)), bin:buffer.subarray(20+length+8)};
}
async function geometry(data) {
 const loader=new GLTFLoader();
 // This CPU comparison inspects geometry only. Image bytes are independently checked
 // below; a dummy texture avoids requiring an HTML image decoder in Node.
 loader.register(()=>({name:'ATLAS_CPU_GEOMETRY_ONLY',loadTexture:()=>Promise.resolve(new Texture())}));
 const scene=(await loader.parseAsync(data.buffer.buffer.slice(data.buffer.byteOffset,data.buffer.byteOffset+data.buffer.byteLength),'')).scene;
 scene.updateMatrixWorld(true);const parts={};const point=new Vector3();
 scene.traverse(object=>{
  if(!object.isMesh)return;
  let owner=object;while(owner&&!owner.userData.scenePartId)owner=owner.parent;
  assert(owner,'Every mesh retains its component owner');
  const id=owner.userData.scenePartId;const row=parts[id]??={triangles:[],shadingTriangles:[],extras:owner.userData};
  const p=object.geometry.attributes.position;const index=object.geometry.index;
  const normals=object.geometry.attributes.normal,normalMatrix=new Matrix3().getNormalMatrix(object.matrixWorld);
  for(let i=0;i<(index?.count??p.count);i+=3){
   const triangle=[],shading=[];
   for(let j=0;j<3;j++){
    const vertex=index?index.getX(i+j):i+j;
    const position=point.fromBufferAttribute(p,vertex).applyMatrix4(object.matrixWorld).toArray().map(n=>n.toFixed(7)).join(',');
    const normal=point.fromBufferAttribute(normals,vertex).applyNormalMatrix(normalMatrix).toArray().map(n=>n.toFixed(7)).join(',');
    triangle.push(position);shading.push(position+'/'+normal);
   }
   row.triangles.push(triangle.sort().join(';'));
   row.shadingTriangles.push(shading.sort().join(';'));
  }
 });
 for(const row of Object.values(parts)){row.triangleCount=row.triangles.length;row.geometryHash=hash(row.triangles.sort().join('\n'));row.vertexNormalHash=hash(row.shadingTriangles.sort().join('\n'));delete row.triangles;delete row.shadingTriangles;}
 return parts;
}
const rows=[];
for(const drink of drinks){
 const sourcePath=`public/models/candidates/${sourceTag}/${drink}.glb`;
 const candidatePath=`public/models/candidates/${candidateTag}/${drink}.glb`;
 const source=read(sourcePath),candidate=read(candidatePath);
 const [a,b]=await Promise.all([geometry(source),geometry(candidate)]);
 assert.deepEqual(Object.keys(a).sort(),Object.keys(b).sort());
 for(const id of Object.keys(a)){
  assert.equal(b[id].geometryHash,a[id].geometryHash,`${drink}/${id}: triangle positions preserved to1e-7`);
  assert.equal(b[id].vertexNormalHash,a[id].vertexNormalHash,`${drink}/${id}: vertex shading normals preserved to1e-7`);
  assert.deepEqual(b[id].extras,a[id].extras,`${drink}/${id}: semantic IDs and assembled/expanded poses unchanged`);
 }
 const normalMaterials=[];
 for(const material of candidate.json.materials){
  if(!material.normalTexture)continue;
  const texture=candidate.json.textures[material.normalTexture.index];
  const image=candidate.json.images[texture.source];
  assert.equal(image.mimeType,'image/png');assert(Number.isInteger(image.bufferView));
  const view=candidate.json.bufferViews[image.bufferView];
  const bytes=candidate.bin.subarray(view.byteOffset||0,(view.byteOffset||0)+view.byteLength);
  assert.equal(bytes.subarray(1,4).toString(),'PNG');
  normalMaterials.push({name:material.name,textureSha256:hash(bytes),width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20),bytes:bytes.length});
 }
 assert(normalMaterials.length>0,'A real embedded normal map must be assigned to garnish materials');
 for(const node of candidate.json.nodes){
  if(node.mesh===undefined||node.extras?.ingredientId!=='garnish')continue;
  for(const primitive of candidate.json.meshes[node.mesh].primitives){
   if(candidate.json.materials[primitive.material].normalTexture)assert(Number.isInteger(primitive.attributes.TEXCOORD_0),'Normal maps have actual UV coordinates');
  }
 }
 rows.push({drink,sourcePath,candidatePath,sourceSha256:hash(source.buffer),candidateSha256:hash(candidate.buffer),sourceBytes:source.buffer.length,candidateBytes:candidate.buffer.length,parts:b,normalMaterials});
}
fs.writeFileSync(output,JSON.stringify({date:new Date().toISOString(),method:'CPU triangle-position and vertex shading normal comparison (world coordinates rounded to1e-7), exact component extras, actual embedded PNG headers/bytes and assigned UVs. No GPU or visual claim.',rows},null,2)+'\n');
console.log(JSON.stringify({output,results:rows.map(r=>({drink:r.drink,parts:Object.keys(r.parts).length,normalMaterials:r.normalMaterials.length,candidateBytes:r.candidateBytes}))},null,2));
