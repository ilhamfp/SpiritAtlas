import {Preparation,clamp} from './model';
export type NativePacket={v:1;session:string;seq:number;expires:number;accel:number[];gyro:number[];t:number;sampleEpoch?:number;unit:'g-deg/s';kind:'native-spu'};
export class NativeMotion {
 status='Not connected';connected=false;calibrated=false;received=0;rejected=0;lastArrival=-Infinity;lastSeq=-1;lastT=-1;expires=0;session='';
 pitch=0;roll=0;neutral=[0,0];gravity=[0,0,-1];gyroBias=[0,0,0];linear=[0,0,0];sample:NativePacket|null=null;history:NativePacket[]=[];
 controller:AbortController|null=null;timer:ReturnType<typeof setInterval>;hidden:()=>void;receiptToApply:number[]=[];connectionRevision=0;clockOffset=Infinity;
 constructor(public model:Preparation){this.timer=setInterval(()=>{if(this.connected&&(performance.now()-this.lastArrival>250||Date.now()>=this.expires)){this.calibrated=Date.now()<this.expires&&this.calibrated;this.model.disarm();this.status=Date.now()>=this.expires?'Session expired. Pair again.':'Sensor stream stale. Motion disarmed.';if(Date.now()>=this.expires){this.connected=false;this.controller?.abort();}this.model.notify();}},50);this.hidden=()=>{this.model.disarm();this.model.notify();};window.addEventListener('blur',this.hidden);document.addEventListener('visibilitychange',this.hidden);}
 validate(p:unknown):p is NativePacket{const v=p as NativePacket;return !!v&&v.v===1&&v.kind==='native-spu'&&v.unit==='g-deg/s'&&typeof v.session==='string'&&/^[a-f0-9]{32}$/.test(v.session)&&Number.isSafeInteger(v.seq)&&v.seq>this.lastSeq&&Number.isFinite(v.t)&&v.t>this.lastT&&Number.isFinite(v.expires)&&v.expires>Date.now()&&v.expires-Date.now()<=21*60_000&&(v.sampleEpoch===undefined||(Number.isFinite(v.sampleEpoch)&&Math.abs(Date.now()-v.sampleEpoch)<1000))&&Array.isArray(v.accel)&&Array.isArray(v.gyro)&&v.accel.length===3&&v.gyro.length===3&&v.accel.every(n=>Number.isFinite(n)&&Math.abs(n)<8)&&v.gyro.every(n=>Number.isFinite(n)&&Math.abs(n)<2000)&&(!this.session||v.session===this.session);}
 accept(p:unknown,now=performance.now()){
  if(!this.validate(p)){this.rejected++;return false;}const offset=now-p.t*1000;this.clockOffset=Math.min(this.clockOffset,offset);if(offset-this.clockOffset>250){this.rejected++;this.model.disarm();this.status='Delayed sensor data. Motion disarmed.';return false;}const wasStale=now-this.lastArrival>250;const dt=clamp(p.t-this.lastT,0,.05);this.lastSeq=p.seq;this.lastT=p.t;this.session=p.session;this.expires=p.expires;this.lastArrival=now;this.received++;this.sample=p;this.connected=true;this.history.push(p);if(this.history.length>120)this.history.shift();
  const [ax,ay,az]=p.accel;const accelPitch=Math.atan2(ay,-az),accelRoll=-Math.atan2(ax,Math.hypot(ay,az));
  if(wasStale){this.model.disarm();this.pitch=accelPitch;this.roll=accelRoll;this.gravity=[...p.accel];}
  const norm=Math.hypot(...p.accel),gravityNorm=Math.hypot(...this.gravity);const trust=Math.abs(norm-gravityNorm)<.1?.035:0;
  this.pitch=(this.pitch+(p.gyro[0]-this.gyroBias[0])*Math.PI/180*dt)*(1-trust)+accelPitch*trust;
  this.roll=(this.roll-(p.gyro[1]-this.gyroBias[1])*Math.PI/180*dt)*(1-trust)+accelRoll*trust;
  // Gravity estimate in sensor axes. Raw acceleration includes gravity; subtract once.
  const g=gravityNorm||1;const expected=[-Math.sin(this.roll)*g,Math.sin(this.pitch)*Math.cos(this.roll)*g,-Math.cos(this.pitch)*Math.cos(this.roll)*g];
  this.linear=p.accel.map((v,i)=>{const a=(v-expected[i])*9.80665;return this.linear[i]*.7+(Math.abs(a)<.075?0:clamp(a,-3,3))*.3;});
  this.status=this.calibrated?'Live native samples · calibrated':'Live native samples · recenter to calibrate';
  if(this.model.armed&&this.calibrated&&!document.hidden&&document.hasFocus()){
   const x=clamp(this.pitch-this.neutral[0],-.25,.25),z=clamp(this.roll-this.neutral[1],-.25,.25);
   if(this.model.armed==='move')this.model.move(x,z,this.linear[0],this.linear[1]);
   else if(['mix','strain'].includes(this.model.stage)){this.model.pour(clamp((Math.max(Math.abs(x),Math.abs(z))-.04)*4.8,0,1));}
   if(p.sampleEpoch!==undefined)this.model.latestNative={seq:p.seq,receivedAt:now,sampleEpoch:p.sampleEpoch};
   this.receiptToApply.push(performance.now()-now);if(this.receiptToApply.length>1000)this.receiptToApply.shift();
  }return true;
 }
 calibrate(){this.model.disarm();const values=this.history.slice(-60);if(values.length<40||performance.now()-this.lastArrival>250){this.status='Wait for a continuous live stream, then recenter.';return false;}
  const mean=[0,1,2].map(i=>values.reduce((n,p)=>n+p.accel[i],0)/values.length);const variance=values.reduce((n,p)=>n+p.accel.reduce((a,x,i)=>a+(x-mean[i])**2,0),0)/values.length;
  if(variance>.0025){this.status='Set the laptop down and let it settle before recentering.';return false;}
  this.gravity=mean;this.gyroBias=[0,1,2].map(i=>values.reduce((n,p)=>n+p.gyro[i],0)/values.length);this.pitch=Math.atan2(mean[1],-mean[2]);this.roll=-Math.atan2(mean[0],Math.hypot(mean[1],mean[2]));this.neutral=[this.pitch,this.roll];this.linear=[0,0,0];this.calibrated=true;this.status='Calibrated at rest · motion disarmed';this.model.notify();return true;
 }
 arm(mode:'move'|'pour'){if(!this.calibrated||!this.connected||Date.now()>=this.expires||performance.now()-this.lastArrival>250)return false;if(mode==='pour'&&!['mix','strain'].includes(this.model.stage))return false;this.model.disarm();this.model.armed=mode;this.model.owner='native';this.model.notify();return true;}
 async connect(token:string){this.disconnect();if(!/^[A-Za-z0-9_-]{43}$/.test(token)){this.status='Use the temporary pairing link from the local helper.';this.model.notify();return;}
  const revision=++this.connectionRevision;this.controller=new AbortController();this.status='Connecting to the local helper…';this.lastSeq=-1;this.lastT=-1;this.session='';this.history=[];this.received=0;this.clockOffset=Infinity;this.model.notify();
  try{const response=await fetch('http://127.0.0.1:19876/motion',{headers:{Authorization:`Bearer ${token}`},signal:this.controller.signal});if(!response.ok||!response.body)throw new Error(response.status===409?'Another browser owns this session. Disconnect it first.':response.status===401?'Pairing expired or not authorized. Open the helper’s pairing page.':`Connection failed (${response.status}).`);
   const stream=response.body.getReader(),decoder=new TextDecoder();let partial='';while(true){const {value,done}=await stream.read();if(done)break;if(revision!==this.connectionRevision){void stream.cancel();return;}partial+=decoder.decode(value,{stream:true});let newline;while((newline=partial.indexOf('\n'))>=0){const line=partial.slice(0,newline);partial=partial.slice(newline+1);if(line.length>2048){this.rejected++;continue;}try{this.accept(JSON.parse(line));}catch{this.rejected++;}}
    // Fetch may coalesce many valid reports while a tab is busy or hidden.
    // Bound the unfinished record, not the transport chunk; stale reports still fail accept().
    if(partial.length>2048)throw new Error('Invalid motion stream.');
   }
   if(revision===this.connectionRevision){this.connected=false;this.calibrated=false;this.model.disarm();this.status='Helper disconnected. Pair again to reconnect.';this.model.notify();}
  }catch(e){if(revision!==this.connectionRevision)return;this.controller?.abort();this.connected=false;this.calibrated=false;this.model.disarm();this.status=e instanceof Error&&e.name==='AbortError'?'Disconnected':e instanceof Error?e.message:'Connection unavailable. Check the helper and browser local network permission.';this.model.notify();}
 }
 disconnect(){this.connectionRevision++;this.controller?.abort();this.controller=null;this.model.disarm();this.connected=false;this.calibrated=false;this.session='';this.status='Disconnected';this.model.notify();}
 dispose(){this.disconnect();clearInterval(this.timer);window.removeEventListener('blur',this.hidden);document.removeEventListener('visibilitychange',this.hidden);}
 snapshot(){return {status:this.status,connected:this.connected,calibrated:this.calibrated,received:this.received,rejected:this.rejected,age:performance.now()-this.lastArrival,pitch:this.pitch,roll:this.roll,neutral:this.neutral,linear:this.linear,gravity:this.gravity,gyroBias:this.gyroBias,armed:this.model.armed,receiptToApply:this.receiptToApply};}
}
