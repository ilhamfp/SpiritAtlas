// CPU-only deterministic audit of the diagnostic boundary graph and shader ray rules.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshBVH, SAH } from 'three-mesh-bvh';
const source = process.env.ATLAS_AUDIT_MODEL || 'public/models/negroni-express-interfaces.glb';
const normalOffset=process.env.ATLAS_AUDIT_OFFSET==='normal';
const maxSteps=Number(process.env.ATLAS_AUDIT_STEPS||24);
const correctedInclusion=process.env.ATLAS_AUDIT_INCLUSION==='relative';
const geometricNormals = process.env.ATLAS_AUDIT_NORMALS === 'geometric';
const bytes = fs.readFileSync(source);
const gltf = await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '');
const rows = [], geometries = [];
gltf.scene.updateMatrixWorld(true);
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  let owner = o; while (owner && !owner.userData.scenePartId) owner = owner.parent;
  const data = { ...owner?.userData, ...o.userData }; const part = data.scenePartId || o.name; const m = o.material;
  if (data.role === 'recipe' || part.startsWith('stage_')) return;
  const optical = ['glass', 'liquid', 'ice'].includes(part) || m.transmission > .5;
  const row = { part, material: m.name, ior: part==='ice_inclusions'&&correctedInclusion?1.03/1.31:m.ior || 1.5, optical, omitted: optical && Math.abs(m.ior - 1) < .0001, determinant: o.matrixWorld.determinant(), vertices: o.geometry.attributes.position.count };
  if (part === 'glass') row.media = m.ior < 1.3 ? ['liquid', 'glass'] : ['air', 'glass'];
  if (part === 'liquid') row.media = m.ior < 1.1 ? ['ice', 'liquid'] : ['air', 'liquid'];
  if (part === 'ice') row.media = ['air', 'ice'];
  if (part === 'ice_inclusions') row.media = ['ice', 'inclusion'];
  rows.push(row); if (row.omitted) return;
  const clone = o.geometry.clone().applyMatrix4(o.matrixWorld); const sourceGeometry = clone.index ? clone.toNonIndexed() : clone;
  const g = new THREE.BufferGeometry(); g.setAttribute('position', sourceGeometry.getAttribute('position')); g.setAttribute('normal', sourceGeometry.getAttribute('normal'));
  g.setAttribute('boundary', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count).fill(rows.length - 1), 1)); geometries.push(g);
});
const geometry = mergeGeometries(geometries); const bvh = new MeshBVH(geometry, { strategy: SAH, maxLeafSize: 4 });
const pos = geometry.attributes.position, norm = geometry.attributes.normal, kind = geometry.attributes.boundary;
const camera = new THREE.PerspectiveCamera(35, 3 / 4, .05, 250); camera.position.set(0, 1.28 + 6.85 * Math.sin(.34), 6.85 * Math.cos(.34)); camera.lookAt(0, 1.28, 0); camera.updateMatrixWorld(true);
const stats = { rays: 0, opticalCrossings: 0, wrongIncomingMedium: 0, transmittedWrongGeometricHemisphere: 0, totalInternalReflections: 0, exhaustedPathSteps: 0, exhausted24: 0, absorptionStateDisagreements: 0, reflectedObjectHits: 0, reflectedRays: 0 };
const examples = { medium: [], wrongHemisphere: [], termination: [], absorption: [] };
const transitions = {};
const vector = (a, i) => new THREE.Vector3().fromBufferAttribute(a, i);
for (let y = 0; y < 80; y++) for (let x = 0; x < 60; x++) {
  stats.rays++; const p = camera.position.clone(); let d = new THREE.Vector3((x + .5) / 60 * 2 - 1, 1 - (y + .5) / 80 * 2, .5).unproject(camera).sub(p).normalize(); let medium = 'air', inLiquid = false, ended = false; const sequence = [];
  for (let step = 0; step < maxSteps; step++) {
    const hit = bvh.raycastFirst(new THREE.Ray(p, d), THREE.DoubleSide); const floor = d.y < -.0001 ? (-.006 - p.y) / d.y : Infinity;
    if (!hit || (floor > 0 && floor < hit.distance)) { ended = true; break; }
    const { a, b, c } = hit.face; const row = rows[kind.getX(a)];
    if (!row.optical) { ended = true; break; }
    stats.opticalCrossings++;
    const va = vector(pos, a), vb = vector(pos, b), vc = vector(pos, c);
    const outward = vb.clone().sub(va).cross(vc.clone().sub(va)).normalize(); const side = -d.dot(outward) > 0 ? 1 : -1;
    const bary = THREE.Triangle.getBarycoord(hit.point, va, vb, vc, new THREE.Vector3());
    let n = vector(norm, a).multiplyScalar(bary.x).addScaledVector(vector(norm, b), bary.y).addScaledVector(vector(norm, c), bary.z).normalize().multiplyScalar(side); if (n.dot(d) > 0) n.negate();
    if (geometricNormals) n.copy(outward).multiplyScalar(side);
    const incoming = row.media?.[side > 0 ? 0 : 1], outgoing = row.media?.[side > 0 ? 1 : 0];
    const event = { material: row.material, side, distance: hit.distance, point: hit.point.toArray(), currentMedium: medium, expectedIncoming: incoming, outgoing };
    sequence.push(event);
    if (incoming && medium !== incoming) { stats.wrongIncomingMedium++; if (examples.medium.length < 12) examples.medium.push({ pixel: [x, y], sequence: sequence.slice() }); }
    transitions[`${medium} -> ${incoming}|${outgoing} via ${row.material}`] = (transitions[`${medium} -> ${incoming}|${outgoing} via ${row.material}`] || 0) + 1;
    const eta = side > 0 ? 1 / row.ior : row.ior; const cosine = n.dot(d); const k = 1 - eta * eta * (1 - cosine * cosine);
    if (k < 0) { stats.totalInternalReflections++; d.reflect(n); p.copy(hit.point).addScaledVector(normalOffset?outward.clone().multiplyScalar(side):d, normalOffset?.0001:.00025); continue; }
    const transmitted = d.clone().multiplyScalar(eta).addScaledVector(n, -(eta * cosine + Math.sqrt(k))).normalize();
    if (transmitted.dot(outward.clone().multiplyScalar(side)) > 0) { stats.transmittedWrongGeometricHemisphere++; if (examples.wrongHemisphere.length < 8) examples.wrongHemisphere.push({ pixel: [x, y], event }); }
    const reflected = d.clone().reflect(n); const reflectOrigin = hit.point.clone().addScaledVector(n, .00025); const reflectedHit = bvh.raycastFirst(new THREE.Ray(reflectOrigin, reflected), THREE.DoubleSide); const reflectedFloor = reflected.y < -.0001 ? (-.006 - reflectOrigin.y) / reflected.y : Infinity;
    stats.reflectedRays++; if (reflectedHit && !(reflectedFloor > 0 && reflectedFloor < reflectedHit.distance)) stats.reflectedObjectHits++;
    if (row.part === 'liquid') inLiquid = side > 0; else if (row.part === 'glass' && row.ior < 1.3) inLiquid = side < 0;
    if (outgoing) medium = outgoing;
    if (inLiquid !== (medium === 'liquid')) { stats.absorptionStateDisagreements++; if (examples.absorption.length < 8) examples.absorption.push({ pixel: [x, y], event, inLiquid }); }
    d = transmitted; p.copy(hit.point).addScaledVector(normalOffset?outward.clone().multiplyScalar(-side):d, normalOffset?.0001:.00025);
  }
  if (!ended) { stats.exhaustedPathSteps++; stats.exhausted24++; if (examples.termination.length < 4) examples.termination.push({ pixel: [x, y], sequence }); }
}
const report = { source, geometricNormals, normalOffset, maxSteps, correctedInclusion, sha256: createHash('sha256').update(bytes).digest('hex'), caveats: `CPU DoubleSide intersection audit, original shader smooth-normal rules unless geometricNormals is true. Transmitted/total-internal-reflection origins use ${normalOffset ? 'geometric normal offsets of 0.0001 scene units to the outgoing/retained side' : 'ray-direction offsets of 0.00025 scene units, matching the original prototype'}. Reflected-branch diagnostic origins use the selected shading/geometry normal at 0.00025 scene units. exhaustedPathSteps counts paths reaching maxSteps=${maxSteps}; exhausted24 is retained only as a compatibility alias with the same value, not a fixed 24-step measurement. Diagnostic 60x80 portrait ray grid. Material media graph is explicit analytic expectation inferred from interface names; it does not infer inclusion composition. Radiance/Fresnel not rendered. Shader uses float32; CPU uses JS doubles, so edge counts are diagnostic not pixel-exact screenshots.`, boundaries: rows, stats, transitions, examples };
fs.writeFileSync(process.env.ATLAS_AUDIT_OUTPUT || `qa/evidence/bvh-cpu-boundary-audit${geometricNormals ? '-geometric' : ''}.json`, JSON.stringify(report, null, 2) + '\n'); console.log(JSON.stringify(stats, null, 2)); console.log(JSON.stringify(transitions, null, 2));
