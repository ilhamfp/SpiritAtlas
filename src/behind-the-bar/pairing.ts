// Keep an explicitly validated pairing in this tab, only until the helper's original expiry.
const STORAGE_KEY = 'spiritatlas.motion-pairing.v1';
type Pairing = {v:1;token:string;expires:number};

export function clearPairing(token?:string){
 if(token&&readPairing()?.token!==token)return;
 try{sessionStorage.removeItem(STORAGE_KEY);}catch{/* Motion remains usable without storage. */}
}

export function readPairing():Pairing|null{
 try{
  const saved=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||'null') as Pairing|null;
  if(saved?.v===1&&/^[A-Za-z0-9_-]{43}$/.test(saved.token)&&Number.isFinite(saved.expires)&&saved.expires>Date.now()&&saved.expires<=Date.now()+21*60_000)return saved;
 }catch{/* Missing or unavailable storage is an unpaired session. */}
 clearPairing();return null;
}

export function savePairing(token:string,expires:number){
 if(!/^[A-Za-z0-9_-]{43}$/.test(token)||!Number.isFinite(expires)||expires<=Date.now()||expires>Date.now()+21*60_000)return;
 try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify({v:1,token,expires}));}catch{/* Pairing still works for this page. */}
}

export function takePairingFromURL(){
 const params=new URLSearchParams(location.hash.slice(1)),token=params.get('motion');
 if(token!==null){params.delete('motion');const rest=params.toString();history.replaceState(history.state,'',location.pathname+location.search+(rest?`#${rest}`:''));}
 return token;
}
