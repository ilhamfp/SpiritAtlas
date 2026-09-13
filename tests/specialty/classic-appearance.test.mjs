import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { appearanceUnmix, createParticleSurface } from '../../src/animation/classic/core/particle-surface.js';

const palette = {
  mixtureColor: '#da855c',
  liquidColors: ['#f7faf5', '#ae512c', '#c38958'],
  appearanceUnmix: [.60, .85],
};

test('visible unmix starts and ends smoothly while the default classic curve stays available', () => {
  assert.equal(appearanceUnmix(.60, palette.appearanceUnmix), 0);
  assert.equal(appearanceUnmix(.85, palette.appearanceUnmix), 1);
  assert.ok(appearanceUnmix(.600001, palette.appearanceUnmix) < 1e-9);
  assert.ok(1 - appearanceUnmix(.849999, palette.appearanceUnmix) < 1e-9);
  assert.ok(Math.abs(appearanceUnmix(.575) - .5) < 1e-12);
  assert.equal(appearanceUnmix(.575, palette.appearanceUnmix), 0);
  for (const invalid of [[.8, .6], [.5, .5], [0, Infinity], [-.1, .8]]) {
    assert.throws(() => appearanceUnmix(.5, invalid));
  }
});

test('actual live liquid and droplet colors stay mixed at the former optical pop', () => {
  const solver = { count: 3, particleMass: 1, restDensity: 1000, baked: true,
    positions: new Float32Array([-1, 3, 0, 0, 4, 0, 1, 3, 0]),
    ids: new Uint8Array([0, 1, 2]), velocities: new Float32Array(9), progress: 0 };
  const surface = createParticleSurface(THREE, solver, palette);
  const mixture = new THREE.Color(palette.mixtureColor);
  try {
    for (const phase of [.5450710720486112, .548583984375, .60]) {
      solver.progress = phase;
      surface.update(phase);
      for (const drop of surface.group.children.filter(child => child.isInstancedMesh)) {
        assert.deepEqual(drop.material.attenuationColor.toArray(), mixture.toArray());
      }
      const field = surface.mesh.field, colors = surface.mesh.palette;
      for (let index = 0; index < field.length; index++) {
        if (field[index] <= .00001) continue;
        for (let channel = 0; channel < 3; channel++) {
          assert.ok(Math.abs(colors[index * 3 + channel] - mixture.toArray()[channel]) < 2e-6);
        }
      }
    }
    solver.progress = .85;
    surface.update(.85);
    surface.group.children.filter(child => child.isInstancedMesh).forEach((drop, i) => {
      drop.material.attenuationColor.toArray().forEach((v, channel) => {
        assert.ok(Math.abs(v - new THREE.Color(palette.liquidColors[i]).toArray()[channel]) < 1e-12);
      });
    });
  } finally {
    const geometries = new Set(), materials = new Set();
    surface.group.traverse(object => {
      if (object.geometry) geometries.add(object.geometry);
      if (object.material) materials.add(object.material);
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
  }
});
