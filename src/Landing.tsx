import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, RotateCcw, MoveUpRight} from 'lucide-react';
import {barById, drinkById} from './data/drinks';
import Marble from './components/Marble';
const Viewer = lazy(() => import('./scenes/Viewer').then(m => ({default: m.Viewer})));
const drinkIds = ['bbf-negroni', 'ichigo-negroni', 'negroni-express'];
const atlasUrl = '/?bar=bar-bon-funk';
const compareUrl = '/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=1';
const descriptions = ['Time, cold and orange aroma. An oak-aged take at New Bahru.', 'Strawberry meets milk clarification in the Ichigo Negroni.', 'A red-orange Negroni with a distinctive pickled shishito garnish.'];

function Poster(){return <div className="hero-poster"><img src="/posters/bbf-negroni-loading.png" alt="BBF Negroni, with dark red liquid and an orange garnish in a rocks glass" fetchPriority="high" /><span role="status">Preparing your drink…</span></div>}

export default function Landing(){
 const [live, setLive] = useState(false);
 const [supported, setSupported] = useState(true);
 const [expansion, setExpansion] = useState(0);
 const [selectedCategory, setSelectedCategory] = useState<string|null>(null);
 const [orbit, setOrbit] = useState({azimuth: -.08, elevation: .16, zoom: 1.04});
 const heroRef = useRef<HTMLDivElement>(null);
 useEffect(() => {
   const timer = window.setTimeout(() => setLive(true), 180);
   const observer = new IntersectionObserver(entries => entries.forEach(e => {if(e.isIntersecting){e.target.classList.add('is-revealed');observer.unobserve(e.target)}}),{threshold:.12});
   document.querySelectorAll('.sa-reveal').forEach(el=>observer.observe(el));
   return ()=>{clearTimeout(timer);observer.disconnect()};
 },[]);
 return <div className="sa-landing">
  <a className="sa-skip" href="#landing-content">Skip to content</a>
  <header className="sa-header"><a className="sa-wordmark" href="/" aria-label="SpiritAtlas home">SpiritAtlas<span className="sa-wordmark-dot">.</span></a><nav aria-label="Main navigation"><a href="#the-bars">The bars</a><a href="#inside">Inside the drink</a><a className="sa-nav-atlas" href={atlasUrl}>Open atlas <ArrowUpRight size={16}/></a></nav></header>
  <main id="landing-content">
   <section className="sa-hero" aria-labelledby="hero-title">
    <Marble/>
    <div className="sa-hero-copy"><h1 id="hero-title">Singapore’s<br/>cocktails.<br/><span>Inside out.</span></h1><p>Explore the bars. Unfold the ingredients.<br className="desktop-break"/> Discover a different side of every drink.</p><a className="sa-action" href={atlasUrl}>Explore the atlas <ArrowUpRight size={20}/></a></div>
    <div className={`sa-hero-stage ${expansion > .5 ? 'is-expanded' : ''}`} ref={heroRef}>
     <div className="sa-hero-coordinate">1.2922° N / 103.8393° E</div>
     <div className="sa-hero-viewer">{live ? <Suspense fallback={<Poster/>}><Viewer hero drinkId="bbf-negroni" expansion={expansion} onExpansionChange={setExpansion} orbit={orbit} onOrbitChange={setOrbit} selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} onSupportChange={setSupported}/></Suspense> : <Poster/>}</div>
     <div className="sa-drink-caption"><div><span className="sa-index">01 / BAR BON FUNK</span><a href="/?drink=bbf-negroni">BBF Negroni <ArrowUpRight size={17}/></a></div><button className="sa-look" onClick={()=>supported ? setExpansion(expansion>.5?0:1) : window.location.assign('/?drink=bbf-negroni&expand=1')} aria-expanded={expansion>.5}>{!supported ? 'Explore ingredients' : expansion>.5 ? 'Bring it together' : 'Look inside'}{expansion>.5 ? <RotateCcw size={16}/> : <MoveUpRight size={17}/>}</button></div>
     <div className="sa-hero-controls"><span>{!supported ? 'Ingredient stories are still available in the atlas' : expansion>.5 ? 'Ingredients shown separately · not measured amounts' : 'Drag to discover another angle'}</span><div><button disabled={!supported} aria-label="Rotate featured cocktail left" onClick={()=>setOrbit(o=>({...o,azimuth:o.azimuth-Math.PI/8}))}><ChevronLeft size={18}/></button><button disabled={!supported} aria-label="Rotate featured cocktail right" onClick={()=>setOrbit(o=>({...o,azimuth:o.azimuth+Math.PI/8}))}><ChevronRight size={18}/></button></div></div>
    </div>
    <div className="sa-hero-foot"><span className="sa-index">SINGAPORE, THROUGH A DIFFERENT GLASS</span><a href="#the-bars">Meet the three bars <ArrowRight size={15}/></a></div>
   </section>
   <section className="sa-bars sa-section" id="the-bars" aria-labelledby="bars-title">
    <div className="sa-section-heading sa-reveal"><h2 id="bars-title">Three bars.<br/><span>Distinctly their own.</span></h2><p>One city. Three interpretations of the Negroni.<br/>{' '}Start with a familiar drink. See where it takes you.</p></div>
    <div className="sa-bar-grid">{drinkIds.map((id,i)=>{const drink=drinkById[id],bar=barById[drink.barId];return <article className="sa-bar sa-reveal" key={id}><a className="sa-bar-link" href={`/?drink=${id}`} aria-label={`Explore ${bar.name}: ${drink.name}`}><div className="sa-bar-top"><span className="sa-index">0{i+1}</span><span className="sa-index">{bar.area}</span><ArrowUpRight size={20}/></div><div className="sa-bar-image"><img src={`/posters/${id}-hero.png`} alt={drink.appearance.join('. ')} loading="lazy" decoding="async"/></div><h3>{bar.name}</h3><span className="sa-bar-drink">{drink.name}</span></a><p>{descriptions[i]}</p><a className="sa-text-link" href={`/?drink=${id}`}>Explore the drink <ArrowRight size={16}/></a></article>})}</div>
   </section>
   <section className="sa-inside sa-section" id="inside" aria-labelledby="inside-title">
    <div className="sa-inside-copy sa-reveal"><h2 id="inside-title">There’s more<br/>in the glass.</h2><p>A garnish. A spirit. An unexpected detail.<br/>Open up a cocktail and explore the ingredients that make it its own.</p><a className="sa-action" href="/?drink=ichigo-negroni&expand=1">Explore ingredients <ArrowUpRight size={20}/></a><span className="sa-method-note">Ingredients shown separately to help you explore.<br/>Estimates are marked; shapes don’t indicate amounts.</span></div>
    <div className="sa-ingredient-story sa-reveal"><span className="sa-index">A CLOSER LOOK / ICHIGO NEGRONI</span><div className="sa-ingredient-row"><span>01</span><div><h3>The finishing touch</h3><p>A yellow flower, a red garnish. The first details you see.</p></div></div><div className="sa-ingredient-row"><span>02</span><div><h3>A different clarity</h3><p>Strawberry and milk clarification shape MOGA’s interpretation.</p></div></div><div className="sa-ingredient-row"><span>03</span><div><h3>The foundation</h3><p>Explore the spirit, bitter and vermouth categories behind the drink.</p></div></div><a href="/?drink=ichigo-negroni&expand=1" className="sa-text-link">Look inside the Ichigo Negroni <ArrowRight size={17}/></a></div>
   </section>
   <section className="sa-comparison sa-section" aria-labelledby="comparison-title"><div className="sa-comparison-inner sa-reveal"><span className="sa-index">BAR BON FUNK / MOGA / BAR SOMMA</span><h2 id="comparison-title">Same starting point.<br/>A different point of view.</h2><p>Put the three Negronis side by side.<br/>Rotate together. Open them up. Notice what changes.</p><a className="sa-action sa-action-dark" href={compareUrl}>Compare the three <ArrowUpRight size={20}/></a></div><div className="sa-comparison-mark" aria-hidden="true"><span/><span/><span/></div></section>
  </main>
  <footer className="sa-footer"><a className="sa-wordmark" href="/">SpiritAtlas.</a><p>Singapore’s cocktails. Inside out.</p><a href={atlasUrl}>Back to Singapore <ArrowUpRight size={17}/></a></footer>
 </div>
}
