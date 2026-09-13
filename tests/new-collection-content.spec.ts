import {expect, test} from '@playwright/test';
import {readFileSync, statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {Box3, Mesh, Texture, Vector3, type Object3D} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {bars, barById, categoriesForFamily, cocktailFamilies, drinks, drinksForFamily} from '../src/data/drinks';
import {newCollectionDrinks} from '../src/data/newCollections';

// Independent source expectations: the 2026 official menus and the dated
// serving references in references/new-collections/*-research.md.
const sourceContracts:Record<string,{menu:string;coverage:Record<string,RegExp[]>}> = {
  'atlas-martini': {menu:'https://www.atlasbar.sg/storage/app/uploads/public/69d/332/f55/69d332f5526c7253694601.pdf', coverage:{
    spirit:[/ATLAS.*gin/i], vermouth:[/ambrato/i], modifiers:[/champagne vinegar/i,/orange bitters/i], garnish:[/lemon oils/i,/lemon twist/i],
  }},
  'moga-dirty-sake-tini': {menu:'https://www.moga.com.sg/wp-content/uploads/sites/57/2024/08/MOGA_BarMenu_Digital_2026.pdf', coverage:{
    spirit:[/sake/i,/Saiten shochu/i], vermouth:[/dry vermouth/i], modifiers:[/pickling brine/i],
  }},
  'somma-mirkos-martini': {menu:'https://static1.squarespace.com/static/669a6a47bf163d18d7dd87d2/t/6a069dc8579b20077ea890a9/1778818505352/BAR+COCKTAIL+MENU_MAY+2026.pdf', coverage:{
    spirit:[/Cygnet 22/i], vermouth:[/Dolin dry vermouth/i], modifiers:[/Italicus/i,/olive brine/i], garnish:[/olive/i,/cheese/i,/2025/],
  }},
  'moga-salted-yuzu-highball': {menu:'https://www.moga.com.sg/wp-content/uploads/sites/57/2024/08/MOGA_BarMenu_Digital_2026.pdf', coverage:{
    spirit:[/Johnnie Walker Gold/i,/genmaicha/i], modifiers:[/buckwheat tea syrup/i,/acid blend/i,/shio koji/i,/yuzu saline/i,/Angostura/i], fizz:[/fizz/i],
  }},
  'somma-pine-highball': {menu:'https://static1.squarespace.com/static/669a6a47bf163d18d7dd87d2/t/6a069dc8579b20077ea890a9/1778818505352/BAR+COCKTAIL+MENU_MAY+2026.pdf', coverage:{
    spirit:[/lapsang souchong/i,/Monkey 47/i], modifiers:[/plum/i,/orange bitters/i], fizz:[/pine soda/i],
  }},
  'jigger-wasabi-highball': {menu:'https://jiggerandpony.aflip.in/bloom-menu-2026', coverage:{
    spirit:[/Toki Suntory Whisky/i], modifiers:[/wasabi/i], fizz:[/apricot soda/i],
  }},
};

test('twelve drinks form four three-venue collections with exact catalog membership', () => {
  expect(drinks).toHaveLength(12);
  expect(new Set(drinks.map(drink => drink.id)).size).toBe(12);
  expect(cocktailFamilies.map(family => family.id).sort()).toEqual(['espresso-martini','highball','martini','negroni']);
  for (const family of cocktailFamilies) {
    const collection=drinksForFamily(family.id);
    expect(collection, family.id).toHaveLength(3);
    expect(new Set(collection.map(drink => drink.barId)).size, family.id).toBe(3);
  }
  expect(newCollectionDrinks.map(drink => drink.id).sort()).toEqual(Object.keys(sourceContracts).sort());
  const originalVenueIds=new Set(drinks.filter(drink => !newCollectionDrinks.includes(drink)).map(drink => drink.barId));
  for (const drink of newCollectionDrinks) expect(originalVenueIds.has(drink.barId), drink.id).toBe(true);
  for (const bar of bars) {
    expect(bar.drinkIds.slice().sort(),bar.id).toEqual(drinks.filter(drink => drink.barId===bar.id).map(drink => drink.id).sort());
  }
});

test('every new recipe retains all named menu components, source links and five/four rows', () => {
  for (const drink of newCollectionDrinks) {
    const contract=sourceContracts[drink.id];
    expect(drink.source.kind).toBe('menu');
    expect(drink.source.originalUrl,drink.id).toBe(contract.menu);
    expect(drink.source.verifiedAt).toBe('2026-09-13');
    expect(drink.source.links?.some(link => link.url===contract.menu)).toBe(true);
    expect(statSync(drink.source.path).size,drink.id).toBeGreaterThan(1000);
    expect(barById[drink.barId].drinkIds).toContain(drink.id);
    expect(drink.ingredients.map(ingredient => ingredient.category)).toEqual(categoriesForFamily(drink.family).map(category => category.id));
    expect(drink.ingredients).toHaveLength(drink.family==='martini'?5:4);
    expect(drink.ratios).toBeNull();
    for (const ingredient of drink.ingredients) {
      expect(ingredient.title).not.toMatch(/\bunknown\b/i);
      expect(ingredient.title.trim()).not.toBe('');
      expect(ingredient.evidence).not.toBe('unverified');expect(ingredient.role).not.toBe('unverified');
      expect(ingredient.quantity).toBeNull();expect(ingredient.unit).toBeNull();
    }
    for (const [category,components] of Object.entries(contract.coverage)) {
      const ingredient=drink.ingredients.find(item => item.category===category)!;
      expect(ingredient,`${drink.id}/${category}`).toBeTruthy();
      const text=ingredient.title+' '+ingredient.description;
      for (const component of components) expect(text,`${drink.id}/${category} loses ${component}`).toMatch(component);
    }
  }
});

test('physical estimates and historical appearances remain disclosed without invented ingredients', () => {
  const inferred=newCollectionDrinks.flatMap(drink => drink.ingredients.filter(ingredient => ingredient.evidence==='inferred'));
  expect(inferred.map(ingredient => ingredient.id).sort()).toEqual(['moga-dirty-ribbon','somma-pine-glass']);
  for (const ingredient of inferred) {
    expect(ingredient.role).toBe('physical');
    expect(ingredient.description).toMatch(/estimat|illustrat/i);
    expect(ingredient.sources?.length).toBeGreaterThan(0);
    for (const source of ingredient.sources!) {expect(new URL(source.url).protocol).toBe('https:');expect(source.label.trim()).not.toBe('')}
  }
  const byId=Object.fromEntries(newCollectionDrinks.map(drink => [drink.id,drink]));
  expect(byId['moga-dirty-sake-tini'].source.version).toMatch(/2024/);
  expect(byId['moga-salted-yuzu-highball'].source.version).toMatch(/2024/);
  expect(byId['somma-mirkos-martini'].source.version).toMatch(/2025/);
  expect(byId['atlas-martini'].source.version).toMatch(/undated/i);
  expect(byId['atlas-martini'].source.links?.some(link => link.url==='https://atlasbar.sg/storage/app/media/ATLASMartini_Recipe.pdf')).toBe(true);
  expect(byId['somma-mirkos-martini'].source.links?.some(link => link.url==='https://www.timeout.com/singapore/restaurants/somma')).toBe(true);
  expect(byId['somma-pine-highball'].source.version).toMatch(/no individually identified serving photo/i);
  expect(byId['somma-pine-highball'].appearance.join(' ')).toMatch(/illustrative/i);
  expect(byId['jigger-wasabi-highball'].source.version).toMatch(/does not identify/i);
  for (const drink of drinksForFamily('highball')) expect(drink.ingredients.some(ingredient => ingredient.category==='garnish')).toBe(false);
  const dirty=byId['moga-dirty-sake-tini'];
  const dirtyText=[dirty.twist,dirty.introduction,...dirty.ingredients.map(ingredient => ingredient.description)].join(' ');
  expect(dirtyText).not.toMatch(/rice-spirit|two base spirits|house pickling brine/i);
});

test('six new editable assets contain finite real geometry matching source parts and bounds', async () => {
  const generatorHash=createHash('sha256').update(readFileSync('scripts/build-new-collections.py')).digest('hex');
  for (const drink of newCollectionDrinks) {
    const binary=readFileSync(`public${drink.assets.model}`);
    expect(binary.toString('ascii',0,4)).toBe('glTF');expect(binary.readUInt32LE(8)).toBe(binary.length);
    const manifest=JSON.parse(readFileSync(`assets/blender/${drink.id}.json`,'utf8'));
    expect(manifest.drink).toBe(drink.id);expect(manifest.version).toBe(drink.assets.revision);
    expect(manifest.scriptSha256).toBe(generatorHash);
    expect(statSync(`assets/blender/${drink.id}.blend`).size).toBeGreaterThan(1024);
    const loader=new GLTFLoader();
    loader.register(() => ({name:'COLLECTION_CONTENT_CPU_GEOMETRY',loadTexture:() => Promise.resolve(new Texture())}));
    const gltf=await loader.parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength) as ArrayBuffer,'');
    gltf.scene.updateMatrixWorld(true);
    const parts=new Map<string,{data:Record<string,any>;bounds:Box3;triangles:number}>();
    gltf.scene.traverse(object => {
      if (!(object instanceof Mesh)) return;
      let owner:Object3D|null=object;
      while (owner&&!owner.userData.scenePartId) owner=owner.parent;
      const data={...owner?.userData,...object.userData},id=data.scenePartId;
      expect(typeof id).toBe('string');expect(id).not.toMatch(/^stage_/);
      expect(['physical','recipe','mixture']).toContain(data.role);
      expect(data.quantity).toBeNull();expect(data.unit).toBeNull();
      const position=object.geometry.getAttribute('position'),normal=object.geometry.getAttribute('normal'),index=object.geometry.index;
      expect(position.count,id).toBeGreaterThanOrEqual(3);
      expect(normal.count,id).toBe(position.count);
      const count=index?.count??position.count;
      expect(count%3,id).toBe(0);expect(count,id).toBeGreaterThanOrEqual(3);
      const bounds=new Box3(),point=new Vector3();
      let finite=true;
      for (let vertex=0;vertex<position.count;vertex++) {
        point.fromBufferAttribute(position,vertex).applyMatrix4(object.matrixWorld);
        finite &&= [point.x,point.y,point.z,normal.getX(vertex),normal.getY(vertex),normal.getZ(vertex)].every(Number.isFinite);
        bounds.expandByPoint(point);
      }
      expect(finite,`${drink.id}/${id}: finite geometry`).toBe(true);
      let positiveArea=false,validIndices=true;
      const a=new Vector3(),b=new Vector3(),c=new Vector3();
      for (let triangle=0;triangle<count;triangle+=3) {
        const ids=[0,1,2].map(offset => index?index.getX(triangle+offset):triangle+offset);
        validIndices &&= ids.every(vertex => Number.isInteger(vertex)&&vertex>=0&&vertex<position.count);
        a.fromBufferAttribute(position,ids[0]);b.fromBufferAttribute(position,ids[1]);c.fromBufferAttribute(position,ids[2]);
        if (b.sub(a).cross(c.sub(a)).lengthSq()>1e-18) positiveArea=true;
      }
      expect(validIndices,`${drink.id}/${id}: triangle indices`).toBe(true);
      expect(positiveArea,`${drink.id}/${id}: no real triangle area`).toBe(true);
      const existing=parts.get(id);
      if (existing) {existing.bounds.union(bounds);existing.triangles+=count/3}
      else parts.set(id,{data,bounds,triangles:count/3});
    });
    expect([...parts.keys()].sort()).toEqual(manifest.parts.map((part:any) => part.id).sort());
    const categories=categoriesForFamily(drink.family).map(category => category.id).sort();
    expect([...new Set([...parts.values()].map(part => part.data.ingredientId))].sort()).toEqual(categories);
    expect([...new Set([...parts.values()].filter(part => part.data.role!=='mixture'&&!part.data.assembledOnly).map(part => part.data.ingredientId))].sort()).toEqual(categories);
    expect(parts.has('glass')).toBe(true);expect(parts.has('ice')).toBe(drink.family==='highball');
    expect([...parts.values()].some(part => part.data.role==='mixture')).toBe(true);
    const glass=parts.get('glass')!;
    expect(manifest.parameters.height,`${drink.id}: camera uses authored nominal rim height`).toBe(drink.renderProfile!.glassHeight);
    // The authored rounded lip rises .004 units above its nominal rim plane.
    expect(Math.abs(glass.bounds.max.y-manifest.parameters.height),`${drink.id}: actual rim bounds`).toBeLessThan(.005);
    for (const sourcePart of manifest.parts) {
      const runtime=parts.get(sourcePart.id)!;
      expect(runtime.data.ingredientId).toBe(sourcePart.category);expect(runtime.data.role).toBe(sourcePart.role);
      expect(sourcePart.quantity).toBeNull();expect(sourcePart.unit).toBeNull();
      const sourceBounds=sourcePart.worldBounds;
      expect(sourceBounds,`${drink.id}/${sourcePart.id}: source bounds`).toBeTruthy();
      const [sourceMin,sourceMax]=sourceBounds as [number[],number[]];
      const min=[sourceMin[0],sourceMin[2],-sourceMax[1]],max=[sourceMax[0],sourceMax[2],-sourceMin[1]];
      runtime.bounds.min.toArray().forEach((value,axis) => expect(Math.abs(value-min[axis]),`${drink.id}/${sourcePart.id}: min ${axis}`).toBeLessThan(1e-5));
      runtime.bounds.max.toArray().forEach((value,axis) => expect(Math.abs(value-max[axis]),`${drink.id}/${sourcePart.id}: max ${axis}`).toBeLessThan(1e-5));
    }
  }
});
