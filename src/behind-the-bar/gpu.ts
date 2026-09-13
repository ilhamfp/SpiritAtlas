/// <reference types="@webgpu/types" />
import {tgpu,d,std} from 'typegpu';
// Fixed-step reduced free-surface solver. GPU stores damped slosh modes,
// angular circulation and its response to spoon torque. No scripted timeline.
export const SolverState=d.arrayOf(d.vec4f,4);
const Input=d.struct({force:d.vec4f,control:d.vec4f});
const layout=tgpu.bindGroupLayout({prior:{storage:SolverState,access:'readonly'},next:{storage:SolverState,access:'mutable'},input:{uniform:Input}});
const evolve=tgpu.computeFn({workgroupSize:[1]})(()=>{
 'use gpu';
 const dt=layout.$.input.control.x;
 const force=layout.$.input.force; const control=layout.$.input.control;
 const a=layout.$.prior[0]; const b=layout.$.prior[1]; const c=layout.$.prior[2];
 const vx=(a.y+(force.x+control.z*19-19*a.x)*dt)*std.exp(-1.65*dt);
 const vz=(a.w+(force.y+control.w*19-19*a.z)*dt)*std.exp(-1.65*dt);
 const swirl=(b.x+force.z*2.4*dt)*std.exp(-1.3*dt);
 const rippleV=(c.y+(std.abs(force.z)*.045-45*c.x)*dt)*std.exp(-2.2*dt);
 layout.$.next[0]=d.vec4f(std.clamp(a.x+vx*dt,-.7,.7),std.clamp(vx,-1,1),std.clamp(a.z+vz*dt,-.7,.7),std.clamp(vz,-1,1));
 layout.$.next[1]=d.vec4f(std.clamp(swirl,-8,8),b.y+swirl*dt,force.z,b.w+dt);
 layout.$.next[2]=d.vec4f(std.clamp(c.x+rippleV*dt,-.04,.04),rippleV,force.w,c.w+1);
 layout.$.next[3]=d.vec4f(vx*vx+vz*vz+19*(a.x*a.x+a.z*a.z)+swirl*swirl,0,0,0);
});
export async function createSolver(device:GPUDevice){
 const root=tgpu.initFromDevice({device});
 const zero=()=>Array.from({length:4},()=>d.vec4f(0));
 const a=root.createBuffer(SolverState,zero()).$usage('storage');const b=root.createBuffer(SolverState,zero()).$usage('storage');
 const input=root.createBuffer(Input,{force:d.vec4f(0),control:d.vec4f(0)}).$usage('uniform');
 const ab=root.createBindGroup(layout,{prior:a,next:b,input});const ba=root.createBindGroup(layout,{prior:b,next:a,input});
 const pipeline=root.createComputePipeline({compute:evolve});await pipeline.initAsync();
 let flip=false,reading=false,disposed=false,epoch=0;let values=new Float32Array(16);let dispatches=0,reads=0;let inputMark:{seq:number;receivedAt:number;sampleEpoch:number}|null=null;
 return {root,get values(){return values;},get inputMark(){return inputMark;},get dispatches(){return dispatches;},get reads(){return reads;},
 step(dt:number,fx:number,fz:number,stir:number,angle:number,tiltX:number,tiltZ:number){
   input.write({force:d.vec4f(fx,fz,stir,angle),control:d.vec4f(dt,0,tiltX,tiltZ)});
   pipeline.with(flip?ba:ab).dispatchWorkgroups(1);flip=!flip;dispatches++;
 },
 read(mark:typeof inputMark=null){if(reading||disposed)return;reading=true;const generation=epoch;(flip?b:a).read().then(v=>{if(!disposed&&generation===epoch){values=new Float32Array(v.flatMap(q=>[q.x,q.y,q.z,q.w]));inputMark=mark;reads++;}}).catch(()=>{}).finally(()=>{reading=false;});},
 reset(){inputMark=null;epoch++;a.write(zero());b.write(zero());values.fill(0);flip=false;},
 async probe(){const v=await(flip?b:a).read();return v.map(q=>[q.x,q.y,q.z,q.w]);},
 dispose(){disposed=true;root.destroy();}
 };
}
