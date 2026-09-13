import { expect, test } from '@playwright/test';
import { readFileSync, statSync } from 'node:fs';
import { Box3, Mesh, Texture, Vector3, type Object3D } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { bars, categories, drinksForFamily } from '../src/data/drinks';
import {recipePresentation} from '../src/data/recipePresentation';
// This source-specific contract protects the three filmed Negronis.
const drinks = drinksForFamily('negroni');

test('filmed drinks preserve unpublished measures and distinguish researched estimates', () => {
  expect(drinks.map((drink) => drink.name)).toEqual(['BBF Negroni', 'Ichigo Negroni', 'Negroni Express']);
  for (const drink of drinks) {
    expect(drink.ratios, `${drink.name}: no invented equal-parts recipe`).toBeNull();
    expect(new Set(drink.ingredients.map((ingredient) => ingredient.id)).size).toBe(drink.ingredients.length);
    for (const ingredient of drink.ingredients) {
      expect(ingredient.quantity, `${ingredient.id}: no fabricated measurement`).toBeNull();
      expect(ingredient.unit).toBeNull();
      expect(ingredient.title).not.toMatch(/^unknown$/i);
      expect(ingredient.evidence).not.toBe('unverified');
      if (ingredient.evidence === 'inferred') {
        expect(ingredient.role).toBe('representative');
        expect(ingredient.sources?.length).toBeGreaterThan(0);
        expect(ingredient.sources?.every(source => source.url.startsWith('https://'))).toBe(true);
      }
    }
    for (const category of categories) {
      expect(drink.ingredients.some((ingredient) => ingredient.category === category.id), `${drink.name}: aligned ${category.id} row`).toBe(true);
    }
  }
  for (const drink of drinks) {
    const bitter = drink.ingredients.find(item => item.category === 'bitter')!;
    expect(bitter.title).toContain('Campari');
    expect(bitter.evidence).toBe('user-confirmed');
    expect(bitter.role).toBe('representative');
  }
  const ichigo = drinks.find((drink) => drink.id === 'ichigo-negroni')!;
  expect(ichigo.ingredients.filter((ingredient) => ingredient.role === 'representative').map((ingredient) => ingredient.title)).toEqual(['Strawberry', 'Sweet vermouth', 'Campari', 'Tanqueray gin']);
  expect(ichigo.unknowns.join(' ')).toMatch(/Flower species and red garnish composition/);
  expect(ichigo.techniques.find((technique) => technique.id === 'ichigo-clarification')?.visibleFinishedComponent).toBe(false);
  const somma = drinks.find((drink) => drink.id === 'negroni-express')!;
  expect(somma.ingredients.filter((ingredient) => ingredient.title.includes('Ancho Verde'))).toHaveLength(1);
  expect(somma.techniques.find((technique) => technique.id === 'somma-orange-oil')?.visibleFinishedComponent).toBe(false);
});

test('exported geometry preserves component IDs and poses while current recipe data resolves editorial labels', () => {
  type Extras = { scenePartId: string; ingredientId: string; role: string; lift: number; assembledPosition: number[]; expandedPosition: number[]; sourcePartIds?: string[]; representation?: string; evidence?: string; label?: string; quantity?: null; unit?: null };
  type Asset = { asset: { version: string }; nodes: { name?: string; mesh?: number; extras?: Extras }[]; meshes: { primitives: { attributes: { POSITION: number } }[] }[]; accessors: { min?: number[]; max?: number[] }[] };
  for (const drink of drinks) {
    const binary = readFileSync(new URL(`../public/models/${drink.id}.glb`, import.meta.url));
    expect(binary.toString('ascii', 0, 4), `${drink.name}: real GLB header`).toBe('glTF');
    expect(binary.readUInt32LE(4)).toBe(2);
    expect(binary.readUInt32LE(8), 'Complete exported file, not a truncated download').toBe(binary.length);
    expect(binary.readUInt32LE(16)).toBe(0x4e4f534a);
    const asset = JSON.parse(binary.toString('utf8', 20, 20 + binary.readUInt32LE(12)).trim()) as Asset;
    const nodes = asset.nodes.filter((node) => node.mesh !== undefined).map(node => ({...node, extras: node.extras?.role === 'recipe' ? {...node.extras, ...recipePresentation(drink, node.extras.ingredientId)} : node.extras}));
    const manifest = JSON.parse(readFileSync(new URL(`../assets/blender/${drink.id}.json`, import.meta.url), 'utf8')) as { parts: ({ id: string } & Partial<Extras>)[] };
    expect(statSync(new URL(`../assets/blender/${drink.id}.blend`, import.meta.url)).size).toBeGreaterThan(1024);
    const ids = nodes.map((node) => node.extras?.scenePartId);
    expect(ids.slice().sort(), 'GLB IDs match the current source manifest after mesh merging').toEqual(manifest.parts.map((part) => part.id).sort());
    expect(new Set(ids).size, 'Every animated group has a unique stable ID').toBe(ids.length);
    for (const required of ['glass', 'ice', 'liquid']) expect(ids).toContain(required);
    expect(nodes.some((node) => node.extras?.ingredientId === 'garnish')).toBe(true);
    const garnishLifts = nodes.filter((node) => node.extras?.ingredientId === 'garnish').map((node) => node.extras!.lift);
    expect(Math.max(...garnishLifts) - Math.min(...garnishLifts), `${drink.name}: attached garnish parts preserve their arrangement throughout expansion`).toBeLessThan(0.000001);
    expect([...new Set(nodes.map((node) => node.extras!.ingredientId))].sort(), 'Each of the six recipe categories has actual authored geometry').toEqual(categories.map((category) => category.id).sort());
    for (const node of nodes) {
      const extras = node.extras!;
      expect(categories.map((category) => category.id)).toContain(extras.ingredientId);
      expect(['physical', 'mixture', 'recipe']).toContain(extras.role);
      expect(Number.isFinite(extras.lift)).toBe(true);
      for (const pose of [extras.assembledPosition, extras.expandedPosition]) {
        expect(pose).toHaveLength(3);
        expect(pose.every(Number.isFinite)).toBe(true);
      }
      expect(extras.expandedPosition[0]).toBeCloseTo(extras.assembledPosition[0], 6);
      expect(extras.expandedPosition[1]).toBeCloseTo(extras.assembledPosition[1], 6);
      expect(extras.expandedPosition[2] - extras.assembledPosition[2]).toBeCloseTo(extras.lift, 6);
      if (extras.sourcePartIds) expect(new Set(extras.sourcePartIds).size, 'Merged source-part provenance has no duplicate identities').toBe(extras.sourcePartIds.length);
    }
    const renderedRecipeCategories = nodes.filter((node) => node.extras?.role === 'recipe').map((node) => node.extras!.ingredientId).sort();
    const expectedRecipeCategories = drink.ingredients.filter((ingredient) => ingredient.role === 'representative').map((ingredient) => ingredient.category).sort();
    expect(renderedRecipeCategories, 'Exactly one explanatory form for each known or estimated mixed ingredient category').toEqual(expectedRecipeCategories);
    expect(nodes.filter(node => node.extras?.representation === 'unknown-placeholder')).toHaveLength(0);
    const represented = drink.ingredients.filter(ingredient => ingredient.role === 'representative');
    for (const ingredient of represented) {
      const matches = nodes.filter(node => node.extras?.role === 'recipe' && node.extras.ingredientId === ingredient.category);
      expect(matches, `${drink.name}: one form for ${ingredient.category}`).toHaveLength(1);
      const node = matches[0]; const extras = node.extras!;
      expect(extras.role).toBe('recipe');
      expect(extras.evidence).toBe(ingredient.evidence);
      expect(extras.label).toBe(ingredient.title);
      expect(extras.representation).toBe('representative-ingredient');
      expect(extras).toHaveProperty('quantity', null);
      expect(extras).toHaveProperty('unit', null);
      expect(extras.lift, 'Illustrative form participates in vertical expansion').toBeGreaterThan(0);
      const authoredPart = manifest.parts.find(part => part.id === extras.scenePartId)!;
      const sourcePart = {...authoredPart, ...recipePresentation(drink, extras.ingredientId)};
      expect(sourcePart.representation).toBe('representative-ingredient');
      expect(sourcePart.label).toBe(ingredient.title);
      expect(sourcePart.evidence).toBe(ingredient.evidence);
      expect(sourcePart).toHaveProperty('quantity', null);
      expect(sourcePart).toHaveProperty('unit', null);
      const primitives = asset.meshes[node.mesh!].primitives;
      expect(primitives.length, 'Ingredient is a real mesh, not an empty anchor').toBeGreaterThan(0);
      for (const primitive of primitives) {
        const bounds = asset.accessors[primitive.attributes.POSITION];
        expect(bounds.min).toHaveLength(3); expect(bounds.max).toHaveLength(3);
        for (let axis = 0; axis < 3; axis++) expect(bounds.max![axis] - bounds.min![axis], 'Ingredient form has extent in all three dimensions').toBeGreaterThan(0.001);
      }
    }
  }
});

test('geography retains both New Bahru venues at the exact verified building point', () => {
  const bonFunk = bars.find((bar) => bar.id === 'bar-bon-funk')!;
  const somma = bars.find((bar) => bar.id === 'bar-somma')!;
  const moga = bars.find((bar) => bar.id === 'moga')!;
  expect(bonFunk.coordinates).toEqual([103.8392883617146, 1.292187061924288]);
  expect(somma.coordinates).toEqual(bonFunk.coordinates);
  expect(bonFunk.buildingId).toBe(somma.buildingId);
  expect(bonFunk.address).toContain('#02-01');
  expect(somma.address).toContain('#04-02A');
  expect(moga.coordinates).toEqual([103.850660822625, 1.293706168743367]);
  expect(moga.buildingId).not.toBe(somma.buildingId);
  for (const bar of bars) {
    expect(bar.verificationSources.some((source) => source.startsWith('https://www.onemap.gov.sg/'))).toBe(true);
  }
});

test('expanded recipe forms stay separated from physical ice and glass using authored transforms', async ({}, testInfo) => {
  const evidence: Record<string, unknown> = {};
  for (const drink of drinks) {
    const binary = readFileSync(new URL(`../public/models/${drink.id}.glb`, import.meta.url));
    // This Node test measures authored geometry/poses. Embedded normal maps are
    // verified separately in the export audit and actual browser; no DOM decoder here.
    const loader = new GLTFLoader();
    loader.register(() => ({ name: 'ATLAS_CPU_GEOMETRY_ONLY', loadTexture: () => Promise.resolve(new Texture()) }));
    const gltf = await loader.parseAsync(binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength) as ArrayBuffer, '');
    gltf.scene.updateMatrixWorld(true);
    const parts: { id: string; representation?: string; bounds: Box3 }[] = [];
    gltf.scene.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      let owner: Object3D | null = object;
      while (owner && !owner.userData.scenePartId) owner = owner.parent;
      const data = { ...owner?.userData, ...object.userData };
      if (data.role === 'recipe') Object.assign(data, recipePresentation(drink, String(data.ingredientId)));
      object.geometry.computeBoundingBox();
      const bounds = object.geometry.boundingBox!.clone().applyMatrix4(object.matrixWorld);
      // The public asset/runtime contract converts Blender's vertical Z offset
      // to GLB Y-up, with e=1 restoring the authored full lift and unit recipe scale.
      bounds.translate(new Vector3(0, Number(data.lift ?? 0), 0));
      parts.push({ id: String(data.scenePartId || object.name), representation: data.representation, bounds });
    });
    const recipeForms = parts.filter((part) => part.representation === 'representative-ingredient');
    const structure = parts.filter((part) => part.id === 'ice' || part.id === 'glass');
    expect(recipeForms).toHaveLength(drink.ingredients.filter((ingredient) => ingredient.role === 'representative').length);
    expect(new Set(structure.map((part) => part.id))).toEqual(new Set(['ice', 'glass']));
    for (const placeholder of recipeForms) for (const physical of structure) {
      expect(placeholder.bounds.intersectsBox(physical.bounds), `${drink.name}: ${placeholder.id} intersects expanded ${physical.id}; recipe=${JSON.stringify(placeholder.bounds)} physical=${JSON.stringify(physical.bounds)}`).toBe(false);
    }
    evidence[drink.id] = [...recipeForms, ...structure].map((part) => ({ id: part.id, representation: part.representation, min: part.bounds.min.toArray(), max: part.bounds.max.toArray() }));
  }
  await testInfo.attach('expanded-recipe-structure-world-bounds', { body: JSON.stringify(evidence, null, 2), contentType: 'application/json' });
});
