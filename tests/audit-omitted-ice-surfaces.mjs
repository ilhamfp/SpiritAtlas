// CPU geometric contract: no original ice air surface above the actual liquid may be omitted.
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {MeshBVH} from 'three-mesh-bvh';
const source=process.env.ATLAS_ICE_SOURCE||'public/models/candidates/v012/negroni-express.glb';
const candidate=process.env.ATLAS_AUDIT_MODEL||'public/models/candidates/v012/negroni-express-interfaces-air-gap.glb';
const output=process.env.ATLAS_AUDIT_OUTPUT||'qa/evidence/bvh-wavefront-v012-omitted-ice-surfaces.json';
const hashes=Object.fromEntries([source,candidate].map(p=>[p,createHash('sha256').update(fs.readFileSync(p)).digest('hex')]));
const load=async p=>{const b=fs.readFileSync(p);const g=await new GLTFLoader().parseAsync(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength),'');g.scene.updateMatrixWorld(true);return g.scene;};
const owner=o=>{let p=o;while(p&&!p.userData.scenePartId)p=p.parent;return p?.userData.scenePartId;};
const src=await load(source),scene=await load(candidate),gs=[];let liquidMaxY=-Infinity;
src.traverse(o=>{if(!o.isMesh)return;if(owner(o)==='liquid')liquidMaxY=Math.max(liquidMaxY,new T.Box3().setFromObject(o).max.y);if(owner(o)==='ice'){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);gs.push(g.index?g.toNonIndexed():g);}});
if(!Number.isFinite(liquidMaxY)||!gs.length)throw Error('Required physical liquid/ice missing');
const merged=mergeGeometries(gs),bvh=new MeshBVH(merged),rows=[];
scene.traverse(o=>{if(!o.isMesh||owner(o)!=='ice')return;const g=o.geometry.clone().applyMatrix4(o.matrixWorld),s=g.index?g.toNonIndexed():g,p=s.attributes.position;const row={material:o.material.name,ior:o.material.ior,triangles:p.count/3,aboveMeniscusTriangles:0,aboveMeniscusArea:0,allArea:0,minY:Infinity,maxY:-Infinity,nearestDistances:[],examples:[]};
for(let i=0;i<p.count;i+=3){const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1),c=new T.Vector3().fromBufferAttribute(p,i+2),tri=new T.Triangle(a,b,c),center=tri.getMidpoint(new T.Vector3());row.allArea+=tri.getArea();row.minY=Math.min(row.minY,a.y,b.y,c.y);row.maxY=Math.max(row.maxY,a.y,b.y,c.y);if(Math.min(a.y,b.y,c.y)>liquidMaxY+.0001){row.aboveMeniscusTriangles++;row.aboveMeniscusArea+=tri.getArea();if(Math.abs(o.material.ior-1)<.0001){const nearest=bvh.closestPointToPoint(center);row.nearestDistances.push(nearest.distance);if(row.examples.length<5)row.examples.push({center:center.toArray(),nearestOriginalDistance:nearest.distance,area:tri.getArea()});}}}
if(row.nearestDistances.length){row.maxNearestOriginalDistance=Math.max(...row.nearestDistances);row.meanNearestOriginalDistance=row.nearestDistances.reduce((a,b)=>a+b,0)/row.nearestDistances.length;}delete row.nearestDistances;rows.push(row);});
fs.writeFileSync(output,JSON.stringify({date:new Date().toISOString(),source,candidate,hashes,liquidMaxY,threshold:'Every triangle vertex exceeds actual source liquid maximum Y by .0001 scene units; nearest original ice distance checked independently.',rows},null,2)+'\n');
console.log(JSON.stringify({output,liquidMaxY,omittedAboveLiquid:rows.filter(r=>Math.abs(r.ior-1)<.0001).map(r=>({count:r.aboveMeniscusTriangles,area:r.aboveMeniscusArea,maxNearestOriginalDistance:r.maxNearestOriginalDistance}))},null,2));
