import {expect, test, type Page} from '@playwright/test';
import {readFileSync} from 'node:fs';
import {Box3, Matrix4, Mesh, PerspectiveCamera, Quaternion, Texture, Vector3, type Object3D} from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {categoriesForFamily, drinks as allDrinks} from '../src/data/drinks';
// Retained regression scope: the original six cocktails, before later collections.
const drinks = allDrinks.filter(drink => drink.family === 'negroni' || drink.family === 'espresso-martini');

type PartState = {id:string;category:string;role:string;visible:boolean;position:number[];rotation:number[];scale:number[]};
type State = {ready:boolean;e:number;parts:PartState[];camera:{position:number[];target:number[];fov:number}};
type AuthoredPart = {id:string;mesh:Mesh;data:Record<string,any>;bounds:Box3};
const cached = new Map<string, Promise<AuthoredPart[]>>();
const state = (page:Page,id:string):Promise<State> => page.evaluate(id => structuredClone((window as unknown as {__atlasViewers:Record<string,State>}).__atlasViewers[id]), id);

function authored(id:string) {
  if (!cached.has(id)) cached.set(id, (async () => {
    const drink = drinks.find(drink => drink.id === id)!;
    const binary = readFileSync(`public${drink.assets.model}`);
    const loader = new GLTFLoader();
    // These checks use real geometry; browser tests below cover actual rendering.
    loader.register(() => ({name:'VISIBILITY_CPU_GEOMETRY',loadTexture:() => Promise.resolve(new Texture())}));
    const gltf = await loader.parseAsync(binary.buffer.slice(binary.byteOffset,binary.byteOffset+binary.byteLength) as ArrayBuffer,'');
    gltf.scene.updateMatrixWorld(true);
    const parts:AuthoredPart[] = [];
    gltf.scene.traverse(object => {
      if (!(object instanceof Mesh)) return;
      let owner:Object3D|null = object;
      while (owner && !owner.userData.scenePartId) owner = owner.parent;
      const data = {...owner?.userData,...object.userData};
      if (String(data.scenePartId).startsWith('stage_')) return;
      object.geometry.computeBoundingBox();
      parts.push({id:object.name,mesh:object,data,bounds:object.geometry.boundingBox!.clone()});
    });
    return parts;
  })());
  return cached.get(id)!;
}

async function open(page:Page,id:string) {
  await page.goto(`/?drink=${id}`);
  const viewer = page.getByTestId(`viewer-${id}`);
  await expect(viewer).toHaveAttribute('data-live','true',{timeout:45000});
  await expect.poll(async () => (await state(page,id))?.ready).toBe(true);
  return viewer;
}

async function expand(page:Page,id:string,target:0|1) {
  await page.getByRole('button',{name:target ? 'Explore ingredients' : 'Reassemble drink',exact:true}).click();
  await expect.poll(async () => (await state(page,id)).e).toBe(target);
  return state(page,id);
}

function expectRestored(before:State,after:State) {
  expect(after.parts.map(part => part.id)).toEqual(before.parts.map(part => part.id));
  for (const part of after.parts) {
    const original = before.parts.find(item => item.id === part.id)!;
    for (const field of ['position','rotation','scale'] as const) expect(part[field],`${part.id}: restored ${field}`).toEqual(original[field]);
    expect(part.visible,`${part.id}: restored visibility`).toBe(original.visible);
  }
}

// A visible flag alone cannot catch a zero-sized or off-screen ingredient. Use
// the actual rendered pose/camera and authored bounds to check screen coverage.
function screenBounds(part:AuthoredPart,pose:PartState,view:State,width:number,height:number) {
  const camera = new PerspectiveCamera(view.camera.fov,width/height,.01,1000);
  camera.position.fromArray(view.camera.position);camera.lookAt(new Vector3().fromArray(view.camera.target));camera.updateMatrixWorld(true);
  const transform = new Matrix4().compose(new Vector3().fromArray(pose.position),new Quaternion().fromArray(pose.rotation),new Vector3().fromArray(pose.scale));
  const projected = new Box3();
  for (const x of [part.bounds.min.x,part.bounds.max.x]) for (const y of [part.bounds.min.y,part.bounds.max.y]) for (const z of [part.bounds.min.z,part.bounds.max.z]) projected.expandByPoint(new Vector3(x,y,z).applyMatrix4(transform).project(camera));
  return {width:Math.max(0,Math.min(1,projected.max.x)-Math.max(-1,projected.min.x))*width/2,height:Math.max(0,Math.min(1,projected.max.y)-Math.max(-1,projected.min.y))*height/2,inDepth:projected.max.z>-1&&projected.min.z<1};
}

test('all six drinks have named nonempty ingredient geometry and cinnamon is a closed enlarged solid',async () => {
  for (const drink of drinks) {
    const parts = await authored(drink.id), categories = categoriesForFamily(drink.family).map(category => category.id);
    expect(new Set(parts.map(part => part.id)).size,`${drink.id}: unique runtime mesh names`).toBe(parts.length);
    expect([...new Set(parts.map(part => part.data.ingredientId))].sort()).toEqual([...categories].sort());
    for (const part of parts) {
      expect(part.id,`${drink.id}: unnamed mesh`).toBeTruthy();
      expect(part.data.scenePartId,`${drink.id}/${part.id}: missing animation identity`).toBeTruthy();
      expect(categories).toContain(part.data.ingredientId);
      const geometry = part.mesh.geometry, position = geometry.getAttribute('position');
      expect(position.count,`${drink.id}/${part.id}: empty geometry`).toBeGreaterThanOrEqual(3);
      expect(geometry.index?.count ?? position.count).toBeGreaterThanOrEqual(3);
      expect(part.bounds.isEmpty()).toBe(false);
      expect(part.bounds.getSize(new Vector3()).toArray().filter(value => value>1e-6).length).toBeGreaterThanOrEqual(2);
    }
  }
  const atlas = await authored('atlas-espresso-martini');
  const cinnamon = atlas.find(part => part.data.scenePartId === 'recipe_cinnamon')!;
  expect(cinnamon).toBeDefined();expect(cinnamon.data.role).toBe('recipe');expect(cinnamon.data.recipeSolid).toBe(true);
  expect(cinnamon.bounds.clone().applyMatrix4(cinnamon.mesh.matrixWorld).getSize(new Vector3()).y).toBeGreaterThanOrEqual(.2);
  expect(atlas.find(part => part.data.scenePartId === 'garnish_cinnamon')?.data.assembledOnly).toBe(true);
  const geometry = cinnamon.mesh.geometry, positions = geometry.getAttribute('position'), indices = geometry.index;
  const edges = new Map<string,{count:number;balance:number}>();let volume6 = 0;
  // glTF splits vertices at normal/UV seams: weld exact exported positions,
  // then require paired, oppositely oriented edges on every closed shell.
  const vertex = (index:number) => new Vector3().fromBufferAttribute(positions,index);
  const key = (point:Vector3) => point.toArray().join(',');
  for (let offset=0;offset<(indices?.count ?? positions.count);offset+=3) {
    const triangle = [0,1,2].map(axis => vertex(indices ? indices.getX(offset+axis) : offset+axis));
    expect(new Vector3().subVectors(triangle[1],triangle[0]).cross(new Vector3().subVectors(triangle[2],triangle[0])).lengthSq()).toBeGreaterThan(1e-20);
    volume6 += triangle[0].dot(new Vector3().crossVectors(triangle[1],triangle[2]));
    for (let side=0;side<3;side++) {
      const a=key(triangle[side]),b=key(triangle[(side+1)%3]),edge=a<b?`${a}|${b}`:`${b}|${a}`;
      const value=edges.get(edge)??{count:0,balance:0};value.count++;value.balance+=a<b?1:-1;edges.set(edge,value);
    }
  }
  expect([...edges.values()].filter(edge => edge.count!==2||edge.balance!==0),'Cinnamon has no open or nonmanifold boundary after seam welding').toEqual([]);
  expect(Math.abs(volume6)/6).toBeGreaterThan(.001);
  const night = await authored('nighthawks');
  for (const id of ['recipe_chocolate','recipe_msg','recipe_rum','recipe_vodka']) expect(night.find(part => part.data.scenePartId===id)?.data.role,id).toBe('recipe');
});

test('expanded views expose all six categories as real in-frame forms across all six drinks',async ({page},info) => {
  test.setTimeout(150000);
  await page.emulateMedia({reducedMotion:'reduce'});
  const errors:string[]=[];page.on('pageerror',error => errors.push(error.message));
  const evidence:Record<string,unknown> = {};
  for (const drink of drinks) {
    const viewer=await open(page,drink.id);const expanded=await expand(page,drink.id,1);
    const parts=await authored(drink.id), dimensions=await viewer.locator('canvas').boundingBox();
    expect(dimensions).not.toBeNull();
    expect(expanded.parts.map(part => part.id).sort()).toEqual(parts.map(part => part.id).sort());
    const coverage=expanded.parts.filter(part => part.visible).map(pose => ({id:pose.id,category:pose.category,role:pose.role,...screenBounds(parts.find(part => part.id===pose.id)!,pose,expanded,dimensions!.width,dimensions!.height)}));
    for (const category of categoriesForFamily(drink.family)) {
      expect(coverage.some(part => part.category===category.id&&part.inDepth&&part.width>=2&&part.height>=2),`${drink.id}/${category.id}: nonzero visible form inside the actual camera`).toBe(true);
      const label=viewer.locator(`.ingredient-labels button[data-category="${category.id}"]`);
      await expect(label).toHaveCount(1);await expect(label).toHaveCSS('opacity','1');
      await expect(label).toHaveCSS('pointer-events','auto');
    }
    for (const part of expanded.parts.filter(part => part.role==='recipe')) {
      expect(part.visible,`${drink.id}/${part.id}: every recipe form appears`).toBe(true);
      const bounds=coverage.find(item => item.id===part.id)!;
      expect(bounds.inDepth&&bounds.width>=2&&bounds.height>=2,`${drink.id}/${part.id}: recipe form must not be empty or off-screen`).toBe(true);
    }
    evidence[drink.id]=coverage;
  }
  expect(errors).toEqual([]);
  await info.attach('actual-expanded-form-coverage',{body:JSON.stringify(evidence,null,2),contentType:'application/json'});
});

test('ATLAS swaps its surface dust for visible solid cinnamon and restores every authored transform',async ({page},info) => {
  await page.emulateMedia({reducedMotion:'reduce'});await open(page,'atlas-espresso-martini');
  const before=await state(page,'atlas-espresso-martini');
  const find=(view:State,id:string) => view.parts.find(part => part.id===id)!;
  expect(find(before,'recipe_cinnamon').visible).toBe(false);expect(find(before,'garnish_cinnamon').visible).toBe(true);
  const expanded=await expand(page,'atlas-espresso-martini',1);
  expect(find(expanded,'recipe_cinnamon').visible).toBe(true);expect(find(expanded,'garnish_cinnamon').visible).toBe(false);
  expect(find(expanded,'recipe_cinnamon').position[1]).toBeGreaterThan(find(before,'recipe_cinnamon').position[1]+1);
  const after=await expand(page,'atlas-espresso-martini',0);expectRestored(before,after);
  await info.attach('cinnamon-swap-and-restoration',{body:JSON.stringify({before,expanded,after}),contentType:'application/json'});
});

test('Jigger and Nighthawks tilt their flat garnish only during exploration and restore position quaternion and scale',async ({page},info) => {
  await page.emulateMedia({reducedMotion:'reduce'});
  for (const id of ['jigger-espresso-martini','nighthawks']) {
    await open(page,id);const before=await state(page,id),expanded=await expand(page,id,1);
    const tilted=(await authored(id)).filter(part => part.data.expandedRotationX!==undefined);
    expect(tilted).toHaveLength(id==='nighthawks'?4:2);
    for (const part of tilted) {
      expect(part.data.expandedRotationX).toBeCloseTo(.45,6);
      const initial=before.parts.find(item => item.id===part.id)!,final=expanded.parts.find(item => item.id===part.id)!;
      expect(initial.rotation).toHaveLength(4);expect(final.rotation).toHaveLength(4);
      expect(new Quaternion().fromArray(initial.rotation).angleTo(new Quaternion().fromArray(final.rotation)),`${id}/${part.id}: actual rendered garnish tilt`).toBeCloseTo(.45,5);
      expect(final.scale).toEqual(initial.scale);expect(final.visible).toBe(true);
    }
    const after=await expand(page,id,0);expectRestored(before,after);
    await info.attach(`${id}-garnish-and-restoration`,{body:JSON.stringify({before,expanded,after}),contentType:'application/json'});
  }
});
