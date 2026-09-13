import * as THREE from 'three';

export const CONTACT_RUNTIME_SHA256='229f4f1aaa58f18d85747b5dff568078e12b5b5cc79462fd033bf9bdbc28b7d0';
const MEDIUM_IOR=[1,1.36,1.51,1.31,1.03] as const;
const ORIENTATION='Geometric normal points from insideMedium to outsideMedium.';
const STANDARD_ROLE='Valid standalone preview fallback; explicit boundary extras are authoritative.';
const FIELDS=['schemaVersion','insideMedium','outsideMedium','relativeIOR','orientation','standardIORRole','omitFromOpticalTrace'];
export type ContactBoundary={schemaVersion:1;insideMedium:number;outsideMedium:number;relativeIOR:number;orientation:string;standardIORRole:string;omitFromOpticalTrace:boolean};

export function parseContactBoundary(value:unknown,part:string):ContactBoundary {
 if(!value||typeof value!=='object'||Array.isArray(value))throw Error(`Missing explicit contact boundary on ${part}.`);
 const boundary=value as Record<string,unknown>;
 if(Object.keys(boundary).length!==FIELDS.length||FIELDS.some(k=>!Object.hasOwn(boundary,k)))throw Error(`Unexpected contact boundary schema on ${part}.`);
 const {insideMedium:inside,outsideMedium:outside,relativeIOR:ior,omitFromOpticalTrace:omit}=boundary;
 if(boundary.schemaVersion!==1||boundary.orientation!==ORIENTATION||boundary.standardIORRole!==STANDARD_ROLE||typeof omit!=='boolean')throw Error(`Unsupported contact boundary semantics on ${part}.`);
 if(typeof inside!=='number'||typeof outside!=='number'||!Number.isInteger(inside)||!Number.isInteger(outside)||inside<1||inside>4||outside<0||outside>4)throw Error(`Invalid contact medium ID on ${part}.`);
 const validPart=part==='glass'?inside===2&&outside===0:part==='liquid'?inside===1&&[0,2,3].includes(outside):part==='ice'?inside===3&&[0,3].includes(outside):part==='ice_inclusions'?inside===4&&outside===3:false;
 if(!validPart||omit!==(inside===3&&outside===3))throw Error(`Invalid contact boundary region on ${part}.`);
 const expected=MEDIUM_IOR[inside]/MEDIUM_IOR[outside];
 if(typeof ior!=='number'||!Number.isFinite(ior)||ior<=0||Math.abs(ior-expected)>1e-12)throw Error(`Invalid explicit relative IOR on ${part}.`);
 return boundary as ContactBoundary;
}

export type ContactRuntimeRow={part:string;material:string;triangles:number;boundary:ContactBoundary|null;omitted:boolean};
// Separate from the historical loader: standard glTF material IOR is never
// consulted for contact optical ratios. The hash gate lives in the caller.
export function prepareContactGeometry(scene:THREE.Object3D){
 const geometries:THREE.BufferGeometry[]=[],rows:ContactRuntimeRow[]=[];
 scene.updateMatrixWorld(true);
 scene.traverse(o=>{
  if(!(o instanceof THREE.Mesh))return;
  let owner:THREE.Object3D|null=o;while(owner&&!owner.userData.scenePartId)owner=owner.parent;
  const data={...owner?.userData,...o.userData},part=String(data.scenePartId||o.name);
  if(data.role==='recipe'||part.startsWith('stage_'))return;
  if(Array.isArray(o.material))throw Error(`Contact mesh ${part} must expose separate material primitives.`);
  const m=o.material as THREE.MeshPhysicalMaterial;
  const optical=['glass','liquid','ice','ice_inclusions'].includes(part),raw=m.userData.atlasOpticalBoundary;
  if(!optical&&(raw!==undefined||m.transmission>.5))throw Error(`Unclassified contact optical part ${part}.`);
  const boundary=optical?parseContactBoundary(raw,part):null;
  const count=o.geometry.index?.count??o.geometry.getAttribute('position').count;
  if(count%3!==0)throw Error(`Contact primitive ${part} is not a triangle list.`);
  rows.push({part,material:m.name,triangles:count/3,boundary,omitted:boundary?.omitFromOpticalTrace??false});
  if(boundary?.omitFromOpticalTrace)return;
  const source=o.geometry.clone().applyMatrix4(o.matrixWorld),g=source.index?source.toNonIndexed():source;
  const position=g.getAttribute('position'),normal=g.getAttribute('normal'),vertexColor=g.getAttribute('color');
  if(!normal||normal.count!==position.count)throw Error(`Missing authored contact normals on ${part}.`);
  const opticalData=new Float32Array(position.count*4),albedo=new Float32Array(position.count*3);
  for(let i=0;i<position.count;i++){
   opticalData.set(boundary?[boundary.relativeIOR,1,boundary.insideMedium,boundary.outsideMedium]:[1.5,0,0,m.roughness||.04],i*4);
   albedo.set([m.color.r*(vertexColor?vertexColor.getX(i):1),m.color.g*(vertexColor?vertexColor.getY(i):1),m.color.b*(vertexColor?vertexColor.getZ(i):1)],i*3);
  }
  const prepared=new THREE.BufferGeometry();prepared.setAttribute('position',position);prepared.setAttribute('normal',normal);prepared.setAttribute('albedo',new THREE.BufferAttribute(albedo,3));prepared.setAttribute('opticalData',new THREE.BufferAttribute(opticalData,4));geometries.push(prepared);
 });
 const omittedTriangles=rows.filter(r=>r.omitted).reduce((n,r)=>n+r.triangles,0);
 const opticalTriangles=rows.filter(r=>r.boundary&&!r.omitted).reduce((n,r)=>n+r.triangles,0);
 if(omittedTriangles!==392||opticalTriangles!==76104)throw Error(`Contact region coverage differs from the audited candidate (${opticalTriangles} optical / ${omittedTriangles} omitted).`);
 return {geometries,rows,omittedTriangles,opticalTriangles};
}
