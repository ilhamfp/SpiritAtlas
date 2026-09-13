import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Viewer} from '../src/scenes/Viewer';

// Development-only capture entry. Vite's production entry does not include it.
function Capture(){
  const query=new URLSearchParams(location.search);
  const [orbit,setOrbit]=useState({azimuth:Number(query.get('azimuth')||0),elevation:Number(query.get('elevation')||.16),zoom:Number(query.get('zoom')||1.2)});
  const [expansion,setExpansion]=useState(0);
  return <div style={{width:'100vw',height:'100vh'}}><Viewer drinkId={query.get('drink')||'bbf-negroni'} expansion={expansion} onExpansionChange={setExpansion} orbit={orbit} onOrbitChange={setOrbit} hero={query.get('mode')!=='standard'}/></div>;
}
createRoot(document.getElementById('root')!).render(<React.StrictMode><Capture/></React.StrictMode>);
