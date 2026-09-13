import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Environment, useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export const BAR_PANORAMA_URL = '/textures/somma-interior-panorama-v2.png';
export const SOMMA_STONE_URL = '/textures/somma-stone-tile-v1.png';
export const BAR_ROTATION: [number, number, number] = [0, Math.PI / 2, 0];

/**
 * Shared product setting: the panorama is generated from a Somma interior
 * reference, not a photograph of the actual space. The generated stone is
 * inspired by the supplied countertop crop; detail and scale are not measured.
 * Full prompts and limitations live beside each texture in *.provenance.json.
 * Neither texture contains a drink or replaces the interactive cocktail.
 */
export function useBarEnvironment(): THREE.Texture {
  const panorama = useTexture(BAR_PANORAMA_URL);
  return useMemo(() => {
    // All consumers of this cached asset use the same color space and mapping.
    // useTexture owns the source cache; do not dispose it on a viewer unmount.
    if (panorama.colorSpace !== THREE.SRGBColorSpace || panorama.mapping !== THREE.EquirectangularReflectionMapping) {
      panorama.colorSpace = THREE.SRGBColorSpace;
      panorama.mapping = THREE.EquirectangularReflectionMapping;
      panorama.needsUpdate = true;
    }
    return panorama;
  }, [panorama]);
}

type BarEnvironmentProps = {
  map: THREE.Texture;
  expansion?: number;
  reduced?: boolean;
  rotation?: [number, number, number];
  backgroundBlurriness?: number;
  backgroundIntensity?: number;
  environmentIntensity?: number;
};

/** Explicit material envMaps must also receive envMapRotation={BAR_ROTATION}. */
export function BarEnvironment({
  map,
  expansion = 0,
  reduced = false,
  rotation = BAR_ROTATION,
  backgroundBlurriness,
  backgroundIntensity,
  environmentIntensity = 1,
}: BarEnvironmentProps) {
  const amount = THREE.MathUtils.clamp(expansion, 0, 1);
  const targetBlur = backgroundBlurriness ?? THREE.MathUtils.lerp(0.05, 0.1, amount);
  const targetIntensity = backgroundIntensity ?? THREE.MathUtils.lerp(0.6, 0.34, amount);
  const motion = useRef({ blur: targetBlur, intensity: targetIntensity, moving: false });
  const scene = useThree(state => state.scene);
  const invalidate = useThree(state => state.invalidate);
  useLayoutEffect(() => {
    if (reduced) {
      motion.current.blur = scene.backgroundBlurriness = targetBlur;
      motion.current.intensity = scene.backgroundIntensity = targetIntensity;
      motion.current.moving = false;
    }
    invalidate();
  }, [scene, invalidate, reduced, targetBlur, targetIntensity, map, environmentIntensity, rotation[0], rotation[1], rotation[2]]);
  useFrame((_, dt) => {
    const current = motion.current;
    // Ignore an idle clock gap on the first frame of a new transition. Stage
    // overrides animate independently of the model and request their own frames.
    const step = current.moving ? Math.min(dt, 0.05) : 0;
    const blur = reduced ? targetBlur : THREE.MathUtils.damp(current.blur, targetBlur, 7, step);
    const intensity = reduced ? targetIntensity : THREE.MathUtils.damp(current.intensity, targetIntensity, 7, step);
    current.blur = Math.abs(blur - targetBlur) > 0.00001 ? blur : targetBlur;
    current.intensity = Math.abs(intensity - targetIntensity) > 0.00001 ? intensity : targetIntensity;
    current.moving = current.blur !== targetBlur || current.intensity !== targetIntensity;
    scene.backgroundBlurriness = current.blur;
    scene.backgroundIntensity = current.intensity;
    if (current.moving) invalidate();
  });
  return <Environment
    map={map}
    background
    backgroundBlurriness={reduced ? targetBlur : motion.current.blur}
    backgroundIntensity={reduced ? targetIntensity : motion.current.intensity}
    // Background treatment changes independently of the light on the objects.
    environmentIntensity={environmentIntensity}
    backgroundRotation={rotation}
    environmentRotation={rotation}
  />;
}

type BarCountertopProps = {
  expansion?: number;
  reduced?: boolean;
  size?: [number, number];
  tileSize?: [number, number];
  height?: number;
  roughness?: number;
  color?: THREE.ColorRepresentation;
  textureStrength?: number;
  textureMipBias?: number;
  contactShadow?: boolean;
  contactShadowOpacity?: number;
  contactShadowRadius?: [number, number];
};

/** A finite textured 3D surface leaves the distant bar visible above its edge. */
export function BarCountertop({
  expansion = 0,
  reduced = false,
  size = [24, 24],
  tileSize = [15, 7.5],
  height = 0.035,
  roughness = 0.66,
  color = '#837c70',
  textureStrength,
  textureMipBias = 2,
  contactShadow = true,
  contactShadowOpacity = 0.17,
  contactShadowRadius = [1.25, 1.1],
}: BarCountertopProps) {
  const source = useTexture(SOMMA_STONE_URL);
  const gl = useThree(state => state.gl);
  const invalidate = useThree(state => state.invalidate);
  const [width, depth] = size;
  const [tileWidth, tileDepth] = tileSize;
  const map = useMemo(() => {
    // This instance owns its sampler/repeat settings; the cached source survives
    // route changes and can be shared safely by the other comparison canvases.
    const texture = source.clone();
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = THREE.MirroredRepeatWrapping;
    texture.wrapT = THREE.MirroredRepeatWrapping;
    texture.repeat.set(width / tileWidth, depth / tileDepth);
    texture.anisotropy = Math.min(16, gl.capabilities.getMaxAnisotropy());
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.needsUpdate = true;
    return texture;
  }, [source, gl, width, depth, tileWidth, tileDepth]);
  useEffect(() => () => map.dispose(), [map]);

  // Preserve continuous stone detail without letting veins dominate the
  // transmitted image in the ice. Blend in linear color against a calm base;
  // the positive mip bias softens the sampled detail before that blend.
  const strength = THREE.MathUtils.clamp(textureStrength ?? THREE.MathUtils.lerp(0.16, 0.12, THREE.MathUtils.clamp(expansion, 0, 1)), 0, 1);
  const uniforms = useMemo(() => ({
    stoneTextureStrength: { value: strength },
    stoneMipBias: { value: textureMipBias },
  }), []);
  const moving = useRef(false);
  useLayoutEffect(() => {
    if (reduced) {
      uniforms.stoneTextureStrength.value = strength;
      moving.current = false;
    }
    uniforms.stoneMipBias.value = textureMipBias;
    invalidate();
  }, [uniforms, strength, textureMipBias, reduced, invalidate, map]);
  useFrame((_, dt) => {
    const current = uniforms.stoneTextureStrength;
    const next = reduced ? strength : THREE.MathUtils.damp(current.value, strength, 7, moving.current ? Math.min(dt, 0.05) : 0);
    moving.current = Math.abs(next - strength) > 0.00001;
    current.value = moving.current ? next : strength;
    if (moving.current) invalidate();
  });
  const softenStone = useMemo(() => (shader: THREE.WebGLProgramParametersWithUniforms) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <map_pars_fragment>', `
        #include <map_pars_fragment>
        uniform float stoneTextureStrength;
        uniform float stoneMipBias;
      `)
      .replace('#include <map_fragment>', `
        #ifdef USE_MAP
          vec4 stoneSample = texture2D(map, vMapUv, stoneMipBias);
          diffuseColor.rgb = mix(diffuseColor.rgb, stoneSample.rgb, stoneTextureStrength);
          diffuseColor.a *= stoneSample.a;
        #endif
      `);
  }, [uniforms]);

  return <group name="shared-bar-countertop">
    <mesh name="somma-inspired-stone-surface" userData={{stageUniforms:uniforms}} rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]} receiveShadow>
      <planeGeometry args={[width, depth]} />
      <meshStandardMaterial
        map={map}
        color={color}
        roughness={roughness}
        metalness={0}
        onBeforeCompile={softenStone}
        customProgramCacheKey={() => 'quiet-stone-linear-blend-v1'}
      />
    </mesh>
    {contactShadow && <AnalyticContactShadow
      height={height + 0.002}
      opacity={contactShadowOpacity}
      radius={contactShadowRadius}
    />}
  </group>;
}

/**
 * A restrained radial attenuation beneath the glass supplies a contact cue.
 * This is an analytic approximation, not a light-traced shadow or a caustic.
 * It has no render target or frame callback. Disable it when using a resolved
 * physical contact shadow so the two treatments do not double-darken the stone.
 */
function AnalyticContactShadow({ height, opacity, radius }: { height: number; opacity: number; radius: [number, number] }) {
  const uniforms = useMemo(() => ({ opacity: { value: opacity } }), [opacity]);
  return <mesh name="analytic-glass-contact-shadow" rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]} renderOrder={-1}>
    <planeGeometry args={[radius[0] * 2, radius[1] * 2]} />
    <shaderMaterial
      uniforms={uniforms}
      transparent
      depthWrite={false}
      toneMapped={false}
      vertexShader="varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
      fragmentShader={`
        uniform float opacity;
        varying vec2 vUv;
        void main() {
          float radius = length(vUv * 2.0 - 1.0);
          float contact = 1.0 - smoothstep(0.12, 1.0, radius);
          gl_FragColor = vec4(0.0, 0.0, 0.0, opacity * contact * contact);
        }
      `}
    />
  </mesh>;
}
