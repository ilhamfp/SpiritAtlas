export const COMPONENTS = ['core', 'ancho', 'rice'] as const;
export type Component = typeof COMPONENTS[number];
export type Quantities = Record<Component, number>;
export type Stage = 'prepare' | 'mix' | 'stir' | 'strain' | 'express' | 'garnish' | 'serve';
export type Preset = 'start-empty' | 'stir-demo';
export const definition = {
  id: 'somma-studio-1', canonicalId: 'negroni-express', label: 'Studio remix · inspired by Bar Somma',
  quantities: 'Authored illustrative portions; not Bar Somma’s unpublished recipe.',
  ingredients: {
    core: {name:'Core blend', color:'#c44018', initial:1, provenance:'Studio abstraction of the unresolved core; excludes separately offered modifiers.'},
    ancho: {name:'Ancho Verde', color:'#ae8a36', initial:.4, provenance:'Named in supplied film, 01:27–01:54. Quantity is studio-authored.'},
    rice: {name:'Rice syrup', color:'#f3d5aa', initial:.3, provenance:'Named in supplied film, 01:27–01:54. Quantity is studio-authored.'},
  },
  baseline: {core:.65,ancho:.18,rice:.1}, capacity: {mix:1.15,serve:1.0}, minimum: .015,
} as const;
export const total = (q: Quantities) => q.core+q.ancho+q.rice;
export const empty = (): Quantities => ({core:0,ancho:0,rice:0});
export const clamp = (n:number,lo:number,hi:number) => Number.isFinite(n)?Math.min(hi,Math.max(lo,n)):0;
export type Garnish = {x:number;z:number;angle:number;placed:boolean};
export type Serving = {components:Quantities;volume:number;garnish:Garnish;oil:boolean;origin:'demo'|'user';stirSeconds:number};
export type Parcel = {q:Quantities;remaining:number;destination:'mix'|'serve'};
export class Preparation {
  preset:Preset='start-empty';origin:'user'|'demo'='user'; stage:Stage='prepare';selected:Component='core';
  sources:Quantities=empty();mix:Quantities=empty();serving:Quantities=empty();transit:Parcel[]=[];
  ice=0;servingIce=false;oil=false;oilTime=0;garnish:Garnish={x:0,z:0,angle:0,placed:false};result:Serving|null=null;
  pourTilt=0;stirInput=0;stirPulse=0;spoonAngle=0;effectiveStir=0;vesselX=0;vesselZ=0;impulseX=0;impulseZ=0;motionPulse=0;
  armed:'move'|'stir'|'pour'|null=null;owner:'local'|'native'='local';lastLocal=0;revision=0;resetId=0;message='Add ice to begin.';
  latestNative:{seq:number;receivedAt:number;sampleEpoch:number}|null=null;
  listeners=new Set<()=>void>();onDisarm:()=>void=()=>{};
  constructor(preset:Preset='start-empty'){this.reset(preset);}
  subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>{this.listeners.delete(fn);}};
  notify=()=>{this.revision++;this.listeners.forEach(fn=>fn());};
  disarm(){this.latestNative=null;this.armed=null;this.pourTilt=0;this.stirInput=0;this.stirPulse=0;this.vesselX=0;this.vesselZ=0;this.impulseX=0;this.impulseZ=0;this.motionPulse=0;this.onDisarm();}
  takeover(){this.disarm();this.owner='local';this.lastLocal=performance.now();}
  reset(preset:Preset=this.preset){this.disarm();this.preset=preset;this.origin=preset==='stir-demo'?'demo':'user';this.stage=preset==='stir-demo'?'stir':'prepare';
    this.sources={core:1,ancho:.4,rice:.3};this.mix=empty();this.serving=empty();this.transit=[];this.ice=preset==='stir-demo'?3:0;this.servingIce=false;this.oil=false;this.oilTime=0;this.garnish={x:0,z:0,angle:0,placed:false};this.result=null;this.effectiveStir=0;this.spoonAngle=0;this.selected='core';this.owner='local';
    if(preset==='stir-demo')for(const c of COMPONENTS){this.mix[c]=definition.baseline[c];this.sources[c]-=this.mix[c];}
    this.message=preset==='stir-demo'?'Drag a circle around the glass.':'Add ice to begin.';this.resetId++;this.notify();
  }
  addIce(){if(this.stage!=='prepare')return;this.ice=3;this.stage='mix';this.message='Pick a vessel. Pour a little, or a little more.';this.notify();}
  select(c:Component){if(!COMPONENTS.includes(c))return;this.takeover();this.selected=c;this.notify();}
  pour(value:number){if(!['mix','strain'].includes(this.stage))return;this.pourTilt=clamp(value,0,1);}
  stir(speed:number,angle?:number){if(this.stage!=='stir')return;this.stirInput=clamp(speed,-9,9);this.stirPulse=angle===undefined?0:.10;if(angle!==undefined)this.spoonAngle=angle;}
  move(x:number,z:number,ax=0,az=0){this.vesselX=clamp(x,-.25,.25);this.vesselZ=clamp(z,-.25,.25);this.impulseX=clamp(ax,-3,3);this.impulseZ=clamp(az,-3,3);this.motionPulse=.10;}
  canAdvance(){if(this.transit.length||this.pourTilt>.01)return false;return this.stage==='mix'?this.mix.core>=definition.minimum:this.stage==='stir'?total(this.mix)>=definition.minimum:this.stage==='strain'?total(this.serving)>=definition.minimum:this.stage==='garnish'?this.garnish.placed:['express'].includes(this.stage);}
  advance(){if(!this.canAdvance())return false;this.disarm();const next:Partial<Record<Stage,Stage>>={mix:'stir',stir:'strain',strain:'express',express:'garnish',garnish:'serve'};this.stage=next[this.stage]??this.stage;if(this.stage==='strain')this.servingIce=true;if(this.stage==='serve')this.result={components:{...this.serving},volume:total(this.serving),garnish:{...this.garnish},oil:this.oil,origin:this.origin,stirSeconds:this.effectiveStir};this.message={prepare:'',mix:'Choose your amounts.',stir:'Drag a circle. Change direction. Let it settle.',strain:'Tilt to pour. Stop whenever you like.',express:'A little orange oil over the surface.',garnish:'Make the shishito your finishing touch.',serve:'Made your way.'}[this.stage];this.notify();return true;}
  back(){if(this.transit.length||this.pourTilt>.01)return;const previous:Partial<Record<Stage,Stage>>={stir:'mix',strain:'stir',express:'strain',garnish:'express'};if(previous[this.stage]){this.disarm();this.stage=previous[this.stage]!;this.notify();}}
  express(){if(this.stage!=='express')return;this.oil=true;this.oilTime=1;this.message='Orange oil expressed.';this.notify();}
  pose(p:Partial<Garnish>){if(this.stage!=='garnish')return;this.garnish={x:clamp(p.x??this.garnish.x,-.2,.2),z:clamp(p.z??this.garnish.z,-.22,.22),angle:clamp(p.angle??this.garnish.angle,-Math.PI,Math.PI),placed:p.placed??false};this.notify();}
  tick(dt:number){dt=clamp(dt,0,1/60);this.oilTime=Math.max(0,this.oilTime-dt);
    if(this.motionPulse>0){this.motionPulse=Math.max(0,this.motionPulse-dt);if(this.motionPulse===0)this.impulseX=this.impulseZ=0;}
    for(const p of this.transit)p.remaining-=dt;
    for(const p of this.transit.filter(p=>p.remaining<=0)){const dest=p.destination==='mix'?this.mix:this.serving;for(const c of COMPONENTS)dest[c]+=p.q[c];}
    this.transit=this.transit.filter(p=>p.remaining>0);
    if(this.stirPulse>0){this.stirPulse=Math.max(0,this.stirPulse-dt);if(this.stirPulse===0)this.stirInput=0;}
    if(this.stage==='stir'){if(Math.abs(this.stirInput)>.25&&Math.abs(this.stirInput)<8.5)this.effectiveStir+=dt;this.spoonAngle+=this.stirInput*dt;}
    if(this.pourTilt>.2&&['mix','strain'].includes(this.stage)){
      const dest=this.stage==='mix'?'mix':'serve';const source=this.stage==='mix'?this.sources:this.mix;
      const available=this.stage==='mix'?source[this.selected]:total(source);
      const inFlight=this.transit.filter(p=>p.destination===dest).reduce((n,p)=>n+total(p.q),0);
      const space=definition.capacity[dest]-total(dest==='mix'?this.mix:this.serving)-inFlight;
      const amount=Math.min(available,space,(this.pourTilt-.2)*.24*dt);
      if(amount>1e-8){const q=empty();for(const c of COMPONENTS){q[c]=this.stage==='mix'?(c===this.selected?amount:0):amount*source[c]/available;source[c]=Math.max(0,source[c]-q[c]);}this.transit.push({q,remaining:.1,destination:dest});}
      else {this.pourTilt=0;this.armed=null;this.message=space<1e-6?'Glass full. Pause here or move on.':'This vessel is empty.';this.notify();}
    }
  }
  conservation(){return Object.fromEntries(COMPONENTS.map(c=>[c,this.sources[c]+this.mix[c]+this.serving[c]+this.transit.reduce((n,p)=>n+p.q[c],0)-definition.ingredients[c].initial]));}
  snapshot(){return {stage:this.stage,preset:this.preset,origin:this.origin,sources:{...this.sources},mix:{...this.mix},serving:{...this.serving},transit:structuredClone(this.transit),ice:this.ice,servingIce:this.servingIce,garnish:{...this.garnish},oil:this.oil,result:structuredClone(this.result),effectiveStir:this.effectiveStir,armed:this.armed,owner:this.owner,pourTilt:this.pourTilt,conservation:this.conservation(),resetId:this.resetId};}
}
