import { CITRUS_MATERIAL } from './citrus-material.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { ICE_SPECS, sampleIcePosition } from './choreography.js';

// Everything is built locally: the peel pores, ice marks and individual juice
// vesicles keep the garnish detailed without fetching image assets.
export function createGarnish(THREE) {
  const group = new THREE.Group();
  group.name = 'Ice and fresh orange';
  const anchors = { ice: new THREE.Vector3(), orange: new THREE.Vector3() };
  let seed = 14719;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const smooth = (v) => { const t = clamp(v); return t * t * t * (t * (t * 6 - 15) + 10); };

  function surfaceTexture(kind) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const data = ctx.createImageData(256, 256);
    for (let i = 0; i < data.data.length; i += 4) {
      const n = kind === 'ice' ? 195 + random() * 38 : 112 + random() * 95;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = n;
      data.data[i + 3] = 255;
    }
    ctx.putImageData(data, 0, 0);
    if (kind === 'peel') {
      for (let i = 0; i < 1800; i++) {
        const x = random() * 256, y = random() * 256, r = 0.35 + random() * 1.5;
        ctx.fillStyle = `rgba(30,30,30,${0.08 + random() * 0.22})`;
        ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.17)';
        ctx.beginPath(); ctx.ellipse(x + 0.45, y + 0.4, r * 0.45, r * 0.3, 0, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      for (let i = 0; i < 65; i++) {
        const x = random() * 256, y = random() * 256;
        ctx.strokeStyle = `rgba(255,255,255,${0.1 + random() * 0.25})`;
        ctx.lineWidth = 0.25 + random() * 0.6;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 27, y + random() * 7 - 3); ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(kind === 'ice' ? 1.3 : 2, kind === 'ice' ? 1.3 : 2);
    texture.anisotropy = 4;
    return texture;
  }

  const iceTexture = surfaceTexture('ice');
  const peelTexture = surfaceTexture('peel');
  const iceMaterial = new THREE.MeshPhysicalMaterial({
    color: '#f5ffff', metalness: 0, roughness: 0.085,
    transmission: 0.975, thickness: 0.54, ior: 1.31,
    attenuationColor: new THREE.Color('#d0eee8'), attenuationDistance: 7,
    clearcoat: 0.72, clearcoatRoughness: 0.038,
    bumpMap: iceTexture, bumpScale: 0.003,
    envMapIntensity: 1.05,
  });
  const cloudMaterial = new THREE.MeshStandardMaterial({
    color: '#dbece7', roughness: 0.8, transparent: true,
    opacity: 0.085, depthWrite: false,
  });
  const bubbleMaterial = new THREE.MeshPhysicalMaterial({
    color: '#e9fbf7', roughness: 0.02, metalness: 0.05,
    transparent: true, opacity: 0.19, depthWrite: false,
    clearcoat: 1, envMapIntensity: 0.85,
  });
  const bubbleGeometry = new THREE.SphereGeometry(1, 8, 6);
  const frostMaterial = new THREE.MeshStandardMaterial({
    color: '#e3f1ed', transparent: true, opacity: 0.22,
    roughness: 0.60, depthWrite: false,
  });
  frostMaterial.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 vFrostLocal;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\nvFrostLocal = position;');
    shader.fragmentShader = 'varying vec3 vFrostLocal;\n' + shader.fragmentShader;
    shader.fragmentShader = shader.fragmentShader.replace('#include <alphamap_fragment>', `
      #include <alphamap_fragment>
      vec3 frostP = abs(vFrostLocal) / vec3(0.305, 0.305, 0.30);
      float frostEdge = max(min(frostP.x, frostP.y), max(min(frostP.y, frostP.z), min(frostP.z, frostP.x)));
      float frostPatch = sin(vFrostLocal.x * 36.0 + vFrostLocal.y * 29.0) * cos(vFrostLocal.z * 33.0 - vFrostLocal.x * 17.0);
      diffuseColor.a *= smoothstep(0.79, 0.98, frostEdge) * smoothstep(-0.10, 0.7, frostPatch);
    `);
  };
  const dummy = new THREE.Object3D();
  const cubes = [];
  const cubeSpecifications = ICE_SPECS;
  cubeSpecifications.forEach((spec, cubeIndex) => {
    const cube = new THREE.Group();
    cube.name = `Hand-cut ice ${cubeIndex + 1}`;
    const geometry = new RoundedBoxGeometry(...spec.size, 5, 0.117);
    const positions = geometry.attributes.position;
    // Low-frequency distortion creates cut, slightly melted ice while keeping
    // shared vertices coincident and the refracting surface watertight.
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i), z = positions.getZ(i);
      const n = Math.sin(x * 8.3 + z * 6.1 + cubeIndex) * Math.cos(y * 7.4 - z * 4.2);
      positions.setXYZ(i, x * (1 + n * 0.055), y * (1 + n * 0.04), z * (1 + n * 0.049));
    }
    geometry.computeVertexNormals();
    const solid = new THREE.Mesh(geometry, iceMaterial);
    solid.castShadow = true;
    solid.receiveShadow = true;
    cube.add(solid);

    const frost = new THREE.Mesh(geometry, frostMaterial);
    frost.scale.setScalar(1.0015);
    cube.add(frost);

    const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.205, 2), cloudMaterial);
    core.position.set(0.025, -0.07, -0.018);
    core.scale.set(0.8, 0.44, 0.76);
    cube.add(core);
    // Narrow opaque inclusions enter the transmission capture, so these
    // tiny frozen fissures remain visible through the surrounding clear ice.
    const fissureMaterial = new THREE.MeshStandardMaterial({
      color: '#72867b', roughness: 0.48, side: THREE.DoubleSide,
    });
    for (let j = 0; j < 2; j++) {
      const fissureGeometry = new THREE.BufferGeometry();
      fissureGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
        -0.008, -0.11, 0, 0.009, -0.055, 0.005, -0.003, 0.016, -0.002,
        -0.003, 0.016, -0.002, 0.009, -0.055, 0.005, 0.012, 0.072, 0.004,
        -0.003, 0.016, -0.002, 0.012, 0.072, 0.004, -0.005, 0.119, 0,
      ], 3));
      fissureGeometry.computeVertexNormals();
      const fissure = new THREE.Mesh(fissureGeometry, fissureMaterial);
      fissure.position.set(j ? 0.083 : -0.078, j ? 0.029 : -0.027, j ? -0.028 : 0.087);
      fissure.rotation.set(0.4 + j * 0.2, -0.25 + j * 0.8, 0.48 - j * 1.15);
      cube.add(fissure);
    }
    const bubbles = new THREE.InstancedMesh(bubbleGeometry, bubbleMaterial, 24);
    for (let i = 0; i < 24; i++) {
      dummy.position.set((random() - 0.5) * 0.41, (random() - 0.5) * 0.35, (random() - 0.5) * 0.41);
      const radius = 0.006 + random() * 0.009;
      dummy.scale.set(radius, radius * (1.0 + random() * 1.6), radius);
      dummy.rotation.set(0, 0, (random() - 0.5) * 0.45);
      dummy.updateMatrix(); bubbles.setMatrixAt(i, dummy.matrix);
    }
    cube.add(bubbles);
    const crackPoints = [];
    for (let j = 0; j < 5; j++) {
      const x = (random() - 0.5) * 0.4;
      const y = (random() - 0.5) * 0.4;
      const z = (random() - 0.5) * 0.4;
      const dx = 0.045 + random() * 0.075;
      crackPoints.push(x, y, z, x + dx, y + 0.04, z - 0.017,
        x + dx * 0.55, y + 0.022, z - 0.009, x + dx * 0.65, y + 0.078, z + 0.025);
    }
    const crackGeometry = new THREE.BufferGeometry();
    crackGeometry.setAttribute('position', new THREE.Float32BufferAttribute(crackPoints, 3));
    cube.add(new THREE.LineSegments(crackGeometry, new THREE.LineBasicMaterial({
      color: '#768981',
    })));
    const start = new THREE.Vector3(...spec.origin);
    const end = new THREE.Vector3(...spec.destination);
    const q0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(...spec.rotation));
    const q1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(...spec.turn));
    cube.position.copy(start); cube.quaternion.copy(q0);
    group.add(cube);
    cubes.push({ mesh: cube, start, end, q0, q1 });
  });

  const orange = new THREE.Group();
  orange.name = 'Fresh orange half-wheel';
  const rindMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ed790f', roughness: 0.46, metalness: 0,
    bumpMap: peelTexture, bumpScale: 0.012,
    clearcoat: 0.20, clearcoatRoughness: 0.37,
  });
  const pithMaterial = new THREE.MeshStandardMaterial({
    color: '#e8be72', roughness: 0.76, bumpMap: peelTexture, bumpScale: 0.0015,
  });
  const pulpMaterial = new THREE.MeshPhysicalMaterial({
    color: '#e87615', roughness: 0.33, metalness: 0,
    clearcoat: 0.43, clearcoatRoughness: 0.16,
    transmission: 0.035, thickness: 0.10,
    attenuationColor: new THREE.Color('#ffae39'), attenuationDistance: 0.16,
    ior: 1.36,
  });
  function halfDisc(radius, depth, material, bevel) {
    const shape = new THREE.Shape();
    shape.moveTo(-radius, 0);
    shape.lineTo(radius, 0);
    shape.absarc(0, 0, radius, 0, Math.PI, false);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, steps: 1, curveSegments: 56,
      bevelEnabled: !!bevel, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2,
    });
    geometry.translate(0, 0, -depth / 2);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = mesh.receiveShadow = true;
    return mesh;
  }
  orange.add(halfDisc(0.62, 0.105, rindMaterial, 0.004));
  orange.add(halfDisc(0.587, 0.113, pithMaterial, 0.002));
  const segmentCount = 6;
  const segments = [];
  for (let i = 0; i < segmentCount; i++) {
    const a = i * Math.PI / segmentCount + 0.012;
    const b = (i + 1) * Math.PI / segmentCount - 0.012;
    const shape = new THREE.Shape();
    shape.moveTo(Math.cos(a) * 0.024, Math.sin(a) * 0.024 + 0.009);
    shape.lineTo(Math.cos(a) * 0.562, Math.sin(a) * 0.562 + 0.009);
    shape.absarc(0, 0.009, 0.562, a, b, false);
    shape.lineTo(Math.cos(b) * 0.024, Math.sin(b) * 0.024 + 0.009);
    shape.closePath();
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.121, steps: 1, curveSegments: 14,
      bevelEnabled: true, bevelThickness: 0.0016, bevelSize: 0.0015, bevelSegments: 1,
    });
    geometry.translate(0, 0, -0.0605);
    const mat = pulpMaterial.clone();
    mat.color.setHSL(0.069 + random() * 0.017, 0.92, 0.44 + random() * 0.045, THREE.SRGBColorSpace);
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = mesh.receiveShadow = true;
    orange.add(mesh);
    segments.push({ a, b });
  }

  // Individually lit juice sacs follow the radial structure of each segment.
  // Instancing keeps both detailed cut faces in two draw calls.
  const juiceMaterial = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', vertexColors: false, roughness: 0.33,
    clearcoat: 0.55, clearcoatRoughness: 0.13,
    transmission: 0.025, thickness: 0.025, ior: 1.35,
  });
  const vesicleGeometry = new THREE.SphereGeometry(1, 6, 4);
  const vesicleCount = 540;
  const juiceSurfaces = [];
  [-1, 1].forEach((side) => {
    const vesicles = new THREE.InstancedMesh(vesicleGeometry, juiceMaterial, vesicleCount);
    const color = new THREE.Color();
    for (let i = 0; i < vesicleCount; i++) {
      const { a, b } = segments[i % segmentCount];
      const r = 0.075 + Math.sqrt(random()) * 0.47;
      const angle = a + 0.020 + random() * (b - a - 0.040);
      const length = Math.min(0.012 + random() * 0.021, (0.568 - r) * 0.8);
      const width = 0.0032 + random() * 0.0038;
      dummy.position.set(Math.cos(angle) * r, Math.sin(angle) * r + 0.009, side * (0.063 + random() * 0.002));
      dummy.rotation.set(0, 0, angle + (random() - 0.5) * 0.28);
      dummy.scale.set(length, width, 0.002 + random() * 0.0025);
      dummy.updateMatrix(); vesicles.setMatrixAt(i, dummy.matrix);
      color.setHSL(0.071 + random() * 0.022, 0.87 + random() * 0.10, 0.39 + random() * 0.19, THREE.SRGBColorSpace);
      vesicles.setColorAt(i, color);
    }
    orange.add(vesicles);
    juiceSurfaces.push(vesicles);
  });

  // A few thin white fibres interrupt the perfect sector outlines.
  const fibreVertices = [];
  for (let i = 0; i < 28; i++) {
    const angle = random() * Math.PI;
    const r = 0.49 + random() * 0.055;
    const l = 0.012 + random() * 0.025;
    fibreVertices.push(Math.cos(angle) * r, Math.sin(angle) * r + 0.009, 0.066,
      Math.cos(angle + 0.013) * (r - l), Math.sin(angle + 0.013) * (r - l) + 0.009, 0.066);
  }
  const fibreGeometry = new THREE.BufferGeometry();
  fibreGeometry.setAttribute('position', new THREE.Float32BufferAttribute(fibreVertices, 3));
  const fibres = new THREE.LineSegments(fibreGeometry, new THREE.LineBasicMaterial({
    color: '#fff1c4', transparent: true, opacity: 0.26,
  }));
  orange.add(fibres);

  // The photographed cut surface is continuous across the uneven natural
  // segments. Thin caps cover the procedural sector faces while the existing
  // extruded rind, pith and flesh still give the slice real side thickness.
  const faceShape = new THREE.Shape();
  faceShape.moveTo(-0.619, 0);
  faceShape.lineTo(0.619, 0);
  faceShape.absarc(0, 0, 0.619, 0, Math.PI, false);
  faceShape.closePath();
  const faceGeometry = new THREE.ShapeGeometry(faceShape, 96);
  const facePositions = faceGeometry.getAttribute('position');
  const faceUV = faceGeometry.getAttribute('uv');
  for (let i = 0; i < facePositions.count; i++) {
    faceUV.setXY(i,
      0.5 + facePositions.getX(i) / 0.62 * CITRUS_MATERIAL.uvRadius,
      0.5 + facePositions.getY(i) / 0.62 * CITRUS_MATERIAL.uvRadius);
  }
  faceUV.needsUpdate = true;
  const faceMaterial = new THREE.MeshPhysicalMaterial({
    name: 'Photographic fresh orange cut face', color: '#ffffff',
    roughness: 0.34, metalness: 0, clearcoat: 0.28,
    clearcoatRoughness: 0.20, ior: 1.36,
    bumpScale: CITRUS_MATERIAL.bumpScale,
  });
  const photographicFaces = [-1, 1].map(side => {
    const face = new THREE.Mesh(faceGeometry, faceMaterial);
    face.name = `Photographic orange face ${side < 0 ? 'back' : 'front'}`;
    face.position.z = side * 0.0645;
    if (side < 0) face.rotation.y = Math.PI;
    face.visible = false;
    face.castShadow = face.receiveShadow = true;
    orange.add(face);
    return face;
  });
  let citrusBump = null;
  function setCitrusTexture(texture, heightTexture = null) {
    citrusBump?.dispose();
    citrusBump = null;
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping;
      texture.repeat.set(1, 1); texture.offset.set(0, 0);
      texture.anisotropy = 8;
      texture.needsUpdate = true;
      // The dedicated height map describes relief independently of fruit color.
      // Retain the albedo fallback for older callers that supply one texture.
      citrusBump = (heightTexture || texture).clone();
      citrusBump.wrapS = citrusBump.wrapT = THREE.ClampToEdgeWrapping;
      citrusBump.repeat.set(1, 1); citrusBump.offset.set(0, 0);
      citrusBump.anisotropy = 8;
      citrusBump.colorSpace = THREE.NoColorSpace;
      citrusBump.needsUpdate = true;
    }
    faceMaterial.map = texture || null;
    faceMaterial.bumpMap = citrusBump;
    faceMaterial.needsUpdate = true;
    for (const face of photographicFaces) face.visible = !!texture;
    for (const vesicles of juiceSurfaces) vesicles.visible = !texture;
    fibres.visible = !texture;
  }
  group.add(orange);

  const orangeStart = new THREE.Vector3(0.50, 2.05, -0.16);
  const orangeEnd = new THREE.Vector3(1.65, 5.45, 0);
  const orangeQ0 = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.08, -0.21, -0.30));
  const orangeQ1 = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.12, -0.43, -0.18));
  const additionalRotation = new THREE.Quaternion();
  const rotationAxis = new THREE.Vector3(0.32, 0.9, 0.12).normalize();

  function update({ progress = 0, time = 0, dt = 0 } = {}) {
    const p = clamp(Number.isFinite(progress) ? progress : 0);
    anchors.ice.set(0, 0, 0);
    cubes.forEach((cube, i) => {
      // Rear, front-right, then front-left leave through the open mouth.
      // Translation stays vertical until the entire rounded cube clears the
      // rim; the external leg then provides room to lower it beside the glass.
      const liftEnd = [0.63, 0.44, 0.23][i];
      const finish = [1.0, 0.92, 0.79][i];
      cube.mesh.position.fromArray(sampleIcePosition(i,p));
      const turn = smooth((p - liftEnd) / (finish - liftEnd));
      const arc = Math.sin(Math.PI * turn);
      cube.mesh.quaternion.slerpQuaternions(cube.q0, cube.q1, turn);
      additionalRotation.setFromAxisAngle(rotationAxis, arc * (0.16 + i * 0.11));
      cube.mesh.quaternion.multiply(additionalRotation);
      anchors.ice.add(cube.mesh.position);
    });
    anchors.ice.multiplyScalar(1 / cubes.length);
    const rawOrange = clamp((p - 0.035) / 0.89);
    const t = smooth(rawOrange);
    const arc = Math.sin(Math.PI * t);
    orange.position.lerpVectors(orangeStart, orangeEnd, t);
    orange.position.x += arc * 0.32;
    orange.position.y += arc * 0.38;
    orange.position.z += arc * 0.27;
    orange.quaternion.slerpQuaternions(orangeQ0, orangeQ1, t);
    additionalRotation.setFromAxisAngle(rotationAxis, arc * 0.65);
    orange.quaternion.multiply(additionalRotation);
    anchors.orange.copy(orange.position);
    anchors.orange.y += 0.25;
  }
  const colliders=cubes.map(cube=>({center:[cube.mesh.position.x,cube.mesh.position.y,cube.mesh.position.z],radius:.30}));
  const updateWithColliders=(state)=>{update(state);cubes.forEach((cube,i)=>{colliders[i].center[0]=cube.mesh.position.x;colliders[i].center[1]=cube.mesh.position.y;colliders[i].center[2]=cube.mesh.position.z;});};
  updateWithColliders({ progress: 0 });
  return { group, update:updateWithColliders, anchors,colliders,setCitrusTexture };
}
