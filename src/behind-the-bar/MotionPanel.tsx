import {useEffect,useRef,useState} from 'react';
import {NativeMotion} from './native';
import {Preparation,definition} from './model';
import {clearPairing,readPairing,savePairing,takePairingFromURL} from './pairing';
export default function MotionPanel({model,onReady}:{model:Preparation;onReady:(native:NativeMotion|null)=>void}){
 const ref=useRef<NativeMotion|null>(null),pairingKey=useRef('');const [token,setToken]=useState('');
 function connect(pair:string){pairingKey.current=pair;void ref.current?.connect(pair);}
 useEffect(()=>{
  const native=new NativeMotion(model,expires=>savePairing(pairingKey.current,expires),()=>clearPairing(pairingKey.current));ref.current=native;onReady(native);window.__btbNative=native;
  function connectKey(pair:string){pairingKey.current=pair;void native.connect(pair);}
  const pair=takePairingFromURL()??readPairing()?.token;if(pair)connectKey(pair);
  function pairFromLink(){const pair=takePairingFromURL();if(pair!==null)connectKey(pair);}
  window.addEventListener('hashchange',pairFromLink);
  return()=>{window.removeEventListener('hashchange',pairFromLink);native.dispose();ref.current=null;onReady(null);delete window.__btbNative;};
 },[model,onReady]);
 const native=ref.current;
 return <section className="btb-motion" id="btb-motion-panel"><h2>A little movement. A little stir.</h2><p>Connect the native helper once in this tab to use laptop motion throughout mixing, stirring and pouring.</p><p role="status">{native?.status??'Not connected'}{model.armed&&` · ARMED: ${model.armed==='pour'?model.stage==='mix'?definition.ingredients[model.selected].name:'Mixing glass pour':model.armed==='stir'?'Stirring':'Move glass'}`}</p>
  {!native?.connected&&<><a href="http://127.0.0.1:19876/pair" target="_blank" rel="noreferrer">Open local pairing page</a><details><summary>Pair manually</summary><label>Temporary pairing key<input type="password" value={token} autoComplete="off" onChange={e=>setToken(e.target.value)}/></label><button onClick={()=>{connect(token);setToken('');}}>Connect helper</button></details><p className="btb-hint">Start the helper, then choose Pair with SpiritAtlas on its local page. If that page cannot open, the helper is not running. <a href="https://github.com/ilhamfp/SpiritAtlas/blob/main/tools/mac-motion/README.md" target="_blank" rel="noreferrer">Helper setup instructions</a>. Allow local network access if your browser asks. Pair one browser window at a time. Sessions last 20 minutes; refreshing this tab keeps a valid pairing, but motion must be calibrated and armed again.</p></>}
  {native?.connected&&<><div className="btb-native-actions"><button disabled={!native.fresh} onClick={()=>native.calibrate()}>Recenter at rest</button>{model.stage==='stir'&&!model.armed&&<button disabled={!native.ready} onClick={()=>native.arm('stir')}>Arm spoon stirring</button>}<button disabled={!native.ready&&!model.armed} onClick={()=>model.armed?model.disarm():native.arm('move')}>{model.armed?'Disarm motion':'Arm glass movement'}</button>{['mix','strain'].includes(model.stage)&&<button disabled={!native.ready} onClick={()=>native.arm('pour')}>Arm pour</button>}<button onClick={()=>model.takeover()}>Use local controls</button><button onClick={()=>{clearPairing();pairingKey.current='';native.disconnect();}}>Disconnect</button></div><p className="btb-hint">Set the laptop flat and recenter. During Stir, choose Arm stirring, then gently rock or turn the laptop to move the spoon through the liquid. The glass stays upright; hold still to let the drink settle. Arm glass movement tilts the glass instead. During Mix or Strain, choose Arm pour to transfer liquid.</p><p className="btb-hint">Keep this browser window focused after arming. Escape, switching windows, changing stages, or 250 ms without samples disarms motion. Reconnection never rearms it; Escape keeps your pairing available.</p><details><summary>Motion diagnostics</summary><p>{native.received} real samples · {native.rejected} rejected · {Math.round(performance.now()-native.lastArrival)} ms since receipt</p><p>Relative pitch {(native.pitch-native.neutral[0]).toFixed(3)} rad · roll {(native.roll-native.neutral[1]).toFixed(3)} rad</p><p>Filtered linear acceleration {native.linear.map(n=>n.toFixed(2)).join(', ')} m/s²</p></details></>}
 </section>;
}
declare global {interface Window {__btbNative?:NativeMotion}}
