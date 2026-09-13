import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';
import { createStudio, createGlass } from './core/studio.js';
import { createGarnish } from './core/garnish.js';
import { CITRUS_MATERIAL } from './core/citrus-material.js';
import { createParticleSurface } from './core/particle-surface.js';
import { loadCachedFluid } from './core/cached-fluid.js';

const MODEL_HEIGHT = 0.90;
const clamp = value => THREE.MathUtils.clamp(Number.isFinite(value) ? value : 0, 0, 1);

/**
 * The original Negroni studio, owned by one component instance. Playback is
 * supplied by the caller, so paused/offscreen instances do not run a RAF loop.
 */
export async function createNegroniRenderer(container, options = {}) {
  const abortController = new AbortController();
  const cleanup = [];
  const ownedTextures = new Set();
  const disposedTextures = new Set();
  let disposed = false;
  let visible = true;
  let reducedMotion = Boolean(options.reducedMotion);
  let frame = null;
  let renderer;
  let dirty = true;
  let poseDirty = true;
  let previousTime = 0;
  let sampleProgress = 0;
  let requestedRig;
  let cameraMix = 0;
  let desiredCameraMix = 0;
  let hasOrbited = false;
  let lastCameraDistance = 0;

  function disposeTexture(texture) {
    if (texture?.isTexture && !disposedTextures.has(texture)) {
      disposedTextures.add(texture);
      texture.dispose();
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    abortController.abort();
    options.signal?.removeEventListener('abort', dispose);
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    // Dispose in reverse construction order, including partly built scenes.
    for (const release of cleanup.reverse()) release();
    cleanup.length = 0;
    for (const texture of ownedTextures) disposeTexture(texture);
    ownedTextures.clear();
    particleSurface = particleSolver = garnish = glass = undefined;
    scene = camera = controls = buffer = liquidBackground = resolution = renderer = undefined;
  }

  function checkActive() {
    if (disposed || abortController.signal.aborted) {
      throw new DOMException('Negroni loading was cancelled.', 'AbortError');
    }
  }

  async function fetchAsset(url) {
    const response = await fetch(url, { signal: abortController.signal });
    if (!response.ok) throw new Error(`Negroni asset unavailable: ${url}`);
    return response;
  }

  async function loadTexture(url) {
    const response = await fetchAsset(url);
    const blob = await response.blob();
    checkActive();
    const objectURL = URL.createObjectURL(blob);
    try {
      const texture = await new THREE.TextureLoader().loadAsync(objectURL);
      if (disposed) disposeTexture(texture);
      checkActive();
      ownedTextures.add(texture);
      return texture;
    } finally {
      URL.revokeObjectURL(objectURL);
    }
  }

  async function loadHDR() {
    const response = await fetchAsset('/classic-negroni/studio_small_09_1k.hdr');
    const data = await response.arrayBuffer();
    checkActive();
    const texture = new HDRLoader().createDataTexture(data);
    ownedTextures.add(texture);
    return texture;
  }

  function invalidate() {
    if (disposed) return;
    dirty = true;
    if (visible && frame === null) frame = requestAnimationFrame(drawFrame);
  }

  let scene;
  let camera;
  let controls;
  let glass;
  let garnish;
  let particleSurface;
  let particleSolver;
  let buffer;
  let liquidBackground;
  let resolution;

  options.signal?.addEventListener('abort', dispose, { once: true });
  if (options.signal?.aborted) dispose();

  function cameraPose(reset = false) {
    // The original framing responds to the host rather than the whole page.
    const mobile = container.clientWidth <= 800;
    const center = THREE.MathUtils.lerp(1.24, 3.10, cameraMix) * MODEL_HEIGHT;
    const distance = THREE.MathUtils.lerp(mobile ? 8.2 : 7.9, mobile ? 14.4 : 13.3, cameraMix);
    const target = new THREE.Vector3(0, center, 0);
    if (reset || !hasOrbited) {
      camera.position.set(0, center + distance * .38, distance);
      controls.target.copy(target);
    } else {
      const offset = camera.position.clone().sub(controls.target);
      if (lastCameraDistance) offset.multiplyScalar(distance / lastCameraDistance);
      controls.target.copy(target);
      camera.position.copy(target).add(offset);
    }
    lastCameraDistance = distance;
    controls.minDistance = distance * .77;
    controls.maxDistance = distance * 1.35;
  }

  function drawFrame(now) {
    frame = null;
    if (disposed || !visible) return;
    try {
      const delta = previousTime ? Math.min((now - previousTime) / 1000, .15) : 1 / 60;
      previousTime = now;
      let renderNeeded = dirty;
      dirty = false;
      if (poseDirty) {
        particleSolver.update(sampleProgress);
        const rigProgress = requestedRig ?? particleSolver.rigProgress;
        desiredCameraMix = THREE.MathUtils.smoothstep(rigProgress, 0, .55);
        garnish.update({ progress: rigProgress });
        particleSurface.update(rigProgress);
        renderer.domElement.dataset.progress = String(sampleProgress);
        renderer.domElement.dataset.rigProgress = String(rigProgress);
        poseDirty = false;
        renderNeeded = true;
      }
      const cameraMoving = Math.abs(cameraMix - desiredCameraMix) > .0001;
      if (cameraMoving) {
        cameraMix = reducedMotion ? desiredCameraMix : THREE.MathUtils.lerp(cameraMix, desiredCameraMix, 1 - Math.exp(-delta * 12));
        if (Math.abs(cameraMix - desiredCameraMix) <= .0001) cameraMix = desiredCameraMix;
        cameraPose();
        renderNeeded = true;
      }
      const orbitMoving = controls.update();
      if (renderNeeded || orbitMoving) {
        // Preserve ice behind liquid, then liquid behind glass. Standard
        // transmission alone drops these nested transparent surfaces.
        glass.group.visible = false;
        particleSurface.group.visible = false;
        renderer.setRenderTarget(liquidBackground);
        renderer.render(scene, camera);
        particleSurface.group.visible = true;
        renderer.setRenderTarget(buffer);
        renderer.render(scene, camera);
        glass.group.visible = true;
        renderer.setRenderTarget(null);
        renderer.render(scene, camera);
        renderer.domElement.dataset.renderedFrames = String(
          Number(renderer.domElement.dataset.renderedFrames ?? 0) + 1,
        );
      }
      if (cameraMoving || orbitMoving || dirty) invalidate();
    } catch (error) {
      dispose();
      options.onError?.(error);
    }
  }

  try {
    checkActive();
    // Load before creating a WebGL context; an aborted React mount never
    // leaves a partly loaded context or unattached texture behind.
    const assets = await Promise.allSettled([
      loadCachedFluid({ signal: abortController.signal }),
      loadHDR(),
      loadTexture(CITRUS_MATERIAL.baseColor),
      loadTexture(CITRUS_MATERIAL.microHeight),
    ]);
    const failure = assets.find(asset => asset.status === 'rejected');
    if (failure) throw failure.reason;
    checkActive();
    const [solver, hdr, citrusColor, citrusHeight] = assets.map(asset => asset.value);
    particleSolver = solver;

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    cleanup.push(() => {
      renderer.setRenderTarget(null);
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.7));
    renderer.setClearColor('#1a1916');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = .92;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.setAttribute('aria-label', 'Interactive classic Negroni');
    canvas.setAttribute('role', 'img');
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.dataset.particles = String(solver.count);
    canvas.dataset.fluidResolution = '128';
    container.append(canvas);

    scene = new THREE.Scene();
    cleanup.push(() => {
      const geometries = new Set();
      const materials = new Set();
      scene.traverse(object => {
        if (object.geometry) geometries.add(object.geometry);
        const objectMaterials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of objectMaterials) if (material) materials.add(material);
        object.shadow?.dispose();
        if (object.isInstancedMesh) object.dispose();
      });
      for (const material of materials) {
        for (const value of Object.values(material)) if (value?.isTexture) disposeTexture(value);
        material.dispose();
      }
      for (const geometry of geometries) geometry.dispose();
      scene.environment = null;
      scene.clear();
    });
    camera = new THREE.PerspectiveCamera(34, 1, .05, 90);
    controls = new OrbitControls(camera, canvas);
    cleanup.push(() => controls.dispose());
    // OrbitControls sets an inline `none`; let vertical swipes scroll the page.
    canvas.style.touchAction = 'pan-y';
    controls.enableDamping = !reducedMotion;
    controls.dampingFactor = .055;
    controls.enablePan = false;
    controls.minPolarAngle = .98;
    controls.maxPolarAngle = 1.49;
    controls.minAzimuthAngle = -.7;
    controls.maxAzimuthAngle = .7;
    controls.enableZoom = true;
    controls.rotateSpeed = .55;

    const studio = createStudio(renderer, scene);
    cleanup.push(() => studio.dispose());
    resolution = new THREE.Vector2(1, 1);
    buffer = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: Math.min(4, renderer.capabilities.maxSamples),
    });
    cleanup.push(() => buffer.dispose());
    liquidBackground = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
    cleanup.push(() => liquidBackground.dispose());
    glass = createGlass(buffer.texture, studio.cubeMap, resolution);
    scene.add(glass.group);

    hdr.mapping = THREE.EquirectangularReflectionMapping;
    const generator = new THREE.PMREMGenerator(renderer);
    try {
      const photographedEnvironment = generator.fromEquirectangular(hdr);
      cleanup.push(() => photographedEnvironment.dispose());
      scene.environment = photographedEnvironment.texture;
      scene.environmentIntensity = .85;
    } finally {
      generator.dispose();
    }
    const reflectionCube = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
    cleanup.push(() => reflectionCube.dispose());
    reflectionCube.fromEquirectangularTexture(renderer, hdr);
    glass.material.uniforms.tEnvironment.value = reflectionCube.texture;

    particleSurface = createParticleSurface(THREE, particleSolver);
    scene.add(particleSurface.group);
    garnish = createGarnish(THREE);
    scene.add(garnish.group);
    garnish.setCitrusTexture(citrusColor, citrusHeight);
    glass.group.scale.y = garnish.group.scale.y = particleSurface.group.scale.y = MODEL_HEIGHT;

    const liquidMaterials = new Set();
    particleSurface.group.traverse(object => {
      if (object.material?.isMeshPhysicalMaterial) liquidMaterials.add(object.material);
    });
    for (const material of liquidMaterials) {
      const previousCompile = material.onBeforeCompile;
      material.onBeforeCompile = shader => {
        previousCompile.call(material, shader, renderer);
        shader.uniforms.uLiquidBackground = { value: liquidBackground.texture };
        shader.uniforms.uLiquidResolution = { value: resolution };
        let transmission = THREE.ShaderChunk.transmission_pars_fragment
          .replaceAll('transmissionSamplerMap', 'uLiquidBackground')
          .replaceAll('transmissionSamplerSize', 'uLiquidResolution');
        transmission = transmission.replace(
          'return textureBicubic( uLiquidBackground, fragCoord.xy, lod );',
          'return texture2D( uLiquidBackground, fragCoord.xy );',
        );
        shader.fragmentShader = shader.fragmentShader.replace('#include <transmission_pars_fragment>', transmission);
      };
      material.customProgramCacheKey = () => 'negroni-layered-refraction-v1';
    }

    function resize() {
      if (disposed) return;
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      renderer.setSize(width, height, false);
      renderer.getDrawingBufferSize(resolution);
      buffer.setSize(resolution.x, resolution.y);
      liquidBackground.setSize(resolution.x, resolution.y);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      cameraPose(!hasOrbited);
      invalidate();
    }

    const onOrbitStart = () => { hasOrbited = true; options.onOrbit?.(); invalidate(); };
    controls.addEventListener('start', onOrbitStart);
    controls.addEventListener('change', invalidate);
    cleanup.push(() => {
      controls.removeEventListener('start', onOrbitStart);
      controls.removeEventListener('change', invalidate);
    });
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    cleanup.push(() => resizeObserver.disconnect());
    cameraPose(true);
    resize();
    // Make readiness mean the real three-pass scene has drawn successfully.
    if (frame !== null) cancelAnimationFrame(frame);
    frame = null;
    drawFrame(performance.now());
    checkActive();
    options.onReady?.();

    return {
      setPose(progress, rigProgress) {
        if (disposed) return;
        const nextSample = clamp(progress);
        const nextRig = rigProgress === undefined ? undefined : clamp(rigProgress);
        if (sampleProgress === nextSample && requestedRig === nextRig) return;
        sampleProgress = nextSample;
        requestedRig = nextRig;
        poseDirty = true;
        invalidate();
      },
      rotate(delta) {
        if (disposed || !Number.isFinite(delta)) return;
        hasOrbited = true;
        const offset = camera.position.clone().sub(controls.target);
        const spherical = new THREE.Spherical().setFromVector3(offset);
        spherical.theta = THREE.MathUtils.clamp(spherical.theta + delta, controls.minAzimuthAngle, controls.maxAzimuthAngle);
        camera.position.copy(controls.target).add(offset.setFromSpherical(spherical));
        controls.update();
        options.onOrbit?.();
        invalidate();
      },
      resetCamera() {
        if (disposed) return;
        hasOrbited = false;
        cameraMix = desiredCameraMix;
        cameraPose(true);
        controls.update();
        invalidate();
      },
      setVisible(nextVisible) {
        if (disposed) return;
        visible = Boolean(nextVisible);
        controls.enabled = visible;
        previousTime = 0;
        if (visible) invalidate();
        else if (frame !== null) { cancelAnimationFrame(frame); frame = null; }
      },
      setReducedMotion(nextReducedMotion) {
        if (disposed || reducedMotion === Boolean(nextReducedMotion)) return;
        reducedMotion = Boolean(nextReducedMotion);
        controls.enableDamping = !reducedMotion;
        invalidate();
      },
      dispose,
    };
  } catch (error) {
    dispose();
    if (error?.name !== 'AbortError') options.onError?.(error);
    throw error;
  }
}
