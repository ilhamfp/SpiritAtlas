import {test,expect} from '@playwright/test';
import {Preparation,total,definition,COMPONENTS} from '../src/behind-the-bar/model';
function tick(p:Preparation,seconds:number){for(let i=0;i<seconds*120;i++)p.tick(1/120);}
function pour(p:Preparation,seconds:number){p.pour(.85);tick(p,seconds);p.pour(0);tick(p,.2);}
function conserved(p:Preparation){for(const c of COMPONENTS)expect(Math.abs(p.conservation()[c])).toBeLessThan(1e-9);for(const q of [p.sources,p.mix,p.serving])for(const c of COMPONENTS)expect(q[c]).toBeGreaterThanOrEqual(0);}
test('three sources, pause/resume, partial strain, omitted modifier and saved result',()=>{const p=new Preparation();expect(p.advance()).toBe(false);p.addIce();pour(p,1);const partial=p.sources.core;tick(p,1);expect(p.sources.core).toBe(partial);pour(p,1);expect(p.sources.core).toBeLessThan(partial);p.select('ancho');pour(p,.4);expect(p.mix.rice).toBe(0);expect(p.advance()).toBe(true);expect(p.effectiveStir).toBe(0);expect(p.advance()).toBe(true);pour(p,.9);const remains=total(p.mix);expect(remains).toBeGreaterThan(0);expect(p.advance()).toBe(true);expect(p.advance()).toBe(true);p.pose({x:.12,z:-.1,angle:1.1,placed:true});expect(p.advance()).toBe(true);expect(p.result?.garnish).toEqual(p.garnish);expect(p.result?.components).toEqual(p.serving);expect(p.result?.origin).toBe('user');expect(total(p.mix)).toBe(remains);conserved(p);});
test('exhaustion, capacity and transit never lose or create components',()=>{const p=new Preparation();p.addIce();for(const c of COMPONENTS){p.select(c);pour(p,15);conserved(p);}expect(total(p.mix)).toBeCloseTo(definition.capacity.mix,7);p.advance();p.advance();pour(p,20);expect(total(p.serving)).toBeCloseTo(definition.capacity.serve,7);expect(total(p.mix)).toBeCloseTo(.15,7);expect(p.ice).toBe(3);conserved(p);});
test('demo uses legal accounting, reset clears input without normalizing user results',()=>{const p=new Preparation('stir-demo');expect(p.mix).toEqual(definition.baseline);conserved(p);p.armed='pour';p.stir(5);tick(p,2);p.reset();expect(p.armed).toBeNull();expect(p.stirInput).toBe(0);expect(p.effectiveStir).toBe(0);expect(p.origin).toBe('demo');p.reset('start-empty');expect(total(p.mix)).toBe(0);expect(p.origin).toBe('user');conserved(p);});
test('idle or impulse does not earn readiness; early straining is legal',()=>{const p=new Preparation('stir-demo');tick(p,10);expect(p.effectiveStir).toBe(0);p.move(.2,.1,3,2);tick(p,1);expect(p.effectiveStir).toBe(0);expect(p.canAdvance()).toBe(true);p.stir(3);tick(p,6);expect(p.effectiveStir).toBeGreaterThan(5);p.disarm();tick(p,1);expect(p.effectiveStir).toBeLessThan(6.01);});
test('invalid values and invalid stage intents do not contaminate state',()=>{const p=new Preparation();p.pour(Infinity);p.stir(NaN);p.pose({x:NaN,angle:Infinity});p.move(NaN,Infinity,NaN,-Infinity);tick(p,1);conserved(p);expect(p.vesselX).toBe(0);expect(p.result).toBeNull();});

test('equal-parts guide measures three exact thirds, waits for arrival, then preserves them through stirring and straining',()=>{
 const p=new Preparation();expect(p.equalParts).toBe(false);expect(p.setEqualParts(true)).toBe(true);p.addIce();
 for(const c of COMPONENTS){
  p.select(c);p.owner='native';p.armed='pour';p.pour(1);
  for(let frame=0;frame<1000&&p.armed;frame++)p.tick(1/120);
  expect(p.partComplete(c)).toBe(true);expect(p.partProgress(c)).toBeCloseTo(definition.equalPart,12);
  expect(p.armed).toBeNull();expect(p.pourTilt).toBe(0);expect(p.transit.length).toBeGreaterThan(0);
  expect(p.canAdvance()).toBe(false);conserved(p);tick(p,.2);
  expect(p.mix[c]).toBeCloseTo(.3,12);expect(p.canAdvance()).toBe(c==='rice');conserved(p);
 }
 expect(p.equalPartsReady).toBe(true);expect(total(p.mix)).toBeCloseTo(.9,12);
 expect(p.message).toBe('Three equal parts are ready. Stir, then pour into the serving glass.');
 expect(p.advance()).toBe(true);expect(p.stage).toBe('stir');p.stir(3);tick(p,2);p.disarm();
 expect(p.advance()).toBe(true);expect(p.stage).toBe('strain');pour(p,8);
 for(const c of COMPONENTS)expect(p.serving[c]).toBeCloseTo(.3,12);
 expect(total(p.mix)).toBeCloseTo(0,12);conserved(p);
});

test('a completed equal part disarms held laptop tilt and cannot overshoot if pour input repeats',()=>{
 const p=new Preparation();p.setEqualParts(true);p.addIce();p.owner='native';p.armed='pour';p.latestNative={seq:1,receivedAt:0,sampleEpoch:Date.now()};
 for(let frame=0;frame<1000;frame++){if(p.armed==='pour')p.pour(1);p.tick(1/120);expect(p.partProgress('core')).toBeLessThanOrEqual(.3+1e-12);}
 expect(p.armed).toBeNull();expect(p.latestNative).toBeNull();expect(p.pourTilt).toBe(0);expect(p.mix.core).toBeCloseTo(.3,12);
 expect(p.selected).toBe('core');expect(p.message).toContain('Next: Ancho Verde');
 const sources={...p.sources};for(let frame=0;frame<500;frame++){p.pour(1);p.tick(1/120);}
 expect(p.sources).toEqual(sources);expect(p.pourTilt).toBe(0);expect(p.canAdvance()).toBe(false);conserved(p);
});

test('enabling the guide preserves a partial pour and in-flight drops through pause and resume',()=>{
 const p=new Preparation();p.addIce();p.armed='pour';p.pour(.85);tick(p,1);
 expect(p.transit.length).toBeGreaterThan(0);const before=structuredClone({sources:p.sources,mix:p.mix,transit:p.transit});
 expect(p.setEqualParts(true)).toBe(true);expect(p.armed).toBeNull();expect(p.pourTilt).toBe(0);
 expect({sources:p.sources,mix:p.mix,transit:p.transit}).toEqual(before);
 const committed=p.partProgress('core');tick(p,.3);expect(p.mix.core).toBeCloseTo(committed,12);expect(p.canAdvance()).toBe(false);conserved(p);
 p.pour(.85);tick(p,.3);p.pour(0);const paused=p.partProgress('core');tick(p,.3);expect(p.partProgress('core')).toBeCloseTo(paused,12);
 p.armed='pour';p.pour(.85);tick(p,3);expect(p.mix.core).toBeCloseTo(.3,12);expect(p.armed).toBeNull();conserved(p);
});

test('guide refuses an over-target mix including in-flight drops without discarding any amount',()=>{
 const p=new Preparation();p.addIce();p.armed='pour';p.pour(1);tick(p,1.6);
 expect(p.mix.core).toBeLessThan(.3);expect(p.partProgress('core')).toBeGreaterThan(.3);
 const before=structuredClone({sources:p.sources,mix:p.mix,transit:p.transit});
 expect(p.setEqualParts(true)).toBe(false);expect(p.equalParts).toBe(false);expect(p.armed).toBeNull();expect(p.pourTilt).toBe(0);
 expect({sources:p.sources,mix:p.mix,transit:p.transit}).toEqual(before);expect(p.message).toContain('Keep mixing freely');tick(p,.2);conserved(p);
 expect(p.canAdvance()).toBe(true);
});

test('a tiny final remainder reaches the equal-part cap instead of looking like an empty source',()=>{
 const p=new Preparation();p.setEqualParts(true);p.addIce();p.mix.core=.3-8e-9;p.sources.core=definition.ingredients.core.initial-p.mix.core;
 p.armed='pour';p.pour(1);p.tick(1/120);expect(p.armed).toBeNull();expect(p.partProgress('core')).toBeCloseTo(.3,12);
 tick(p,.2);expect(p.mix.core).toBeCloseTo(.3,12);expect(p.message).toContain('Next: Ancho Verde');conserved(p);
});

test('leaving the guide allows custom proportions and reset keeps the model default and demo unchanged',()=>{
 const p=new Preparation();p.setEqualParts(true);p.addIce();pour(p,1);const existing={...p.mix};
 expect(p.setEqualParts(false)).toBe(true);expect(p.mix).toEqual(existing);pour(p,2);
 expect(p.mix.core).toBeGreaterThan(.3);expect(p.mix.ancho).toBe(0);expect(p.mix.rice).toBe(0);expect(p.canAdvance()).toBe(true);conserved(p);
 p.reset();expect(p.equalParts).toBe(false);expect(total(p.mix)).toBe(0);p.setEqualParts(true);p.reset('stir-demo');
 expect(p.equalParts).toBe(false);expect(p.mix).toEqual(definition.baseline);expect(p.setEqualParts(true)).toBe(false);expect(p.mix).toEqual(definition.baseline);conserved(p);
});
