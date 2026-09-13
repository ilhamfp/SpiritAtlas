import React, {lazy, Suspense} from 'react';
import ReactDOM from 'react-dom/client';
import Landing from './Landing';
import './brand.css';
import './negroni/classic-negroni.css';

const Studio = lazy(() => import('./behind-the-bar/Studio'));
const Atlas = lazy(() => import('./App'));
const params = new URLSearchParams(window.location.search);
const isStudio = window.location.pathname.startsWith('/behind-the-bar');
const isAtlas = ['bar', 'drink', 'compare', 'collection'].some(key => params.has(key)) || window.location.pathname === '/atlas';
ReactDOM.createRoot(document.getElementById('root')!).render(<>{isStudio ? <Suspense fallback={<div className="atlas-loading"><p role="status">Opening the studio…</p></div>}><Studio /></Suspense> : <React.StrictMode>{isAtlas ? <Suspense fallback={<div className="atlas-loading"><a href="/" className="sa-wordmark">SpiritAtlas</a><p role="status">Opening the atlas…</p></div>}><Atlas /></Suspense> : <Landing />}</React.StrictMode>}</>);
