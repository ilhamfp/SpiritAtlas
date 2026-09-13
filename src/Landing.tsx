import {useEffect} from 'react';
import {ArrowRight, ArrowUpRight} from 'lucide-react';
import {barById, drinkById} from './data/drinks';
import Marble from './components/Marble';
import ClassicNegroni from './negroni/ClassicNegroni';
const drinkIds = ['bbf-negroni', 'ichigo-negroni', 'negroni-express'];
const atlasUrl = '/?bar=bar-bon-funk';
const compareUrl = '/?compare=bbf-negroni,ichigo-negroni,negroni-express&expand=1';
const descriptions = ['Time, cold and orange aroma. An oak-aged take at New Bahru.', 'Strawberry meets milk clarification in the Ichigo Negroni.', 'A red-orange Negroni with a distinctive pickled shishito garnish.'];

export default function Landing(){
 useEffect(() => {
   const observer = new IntersectionObserver(entries => entries.forEach(e => {if(e.isIntersecting){e.target.classList.add('is-revealed');observer.unobserve(e.target)}}),{threshold:.12});
   document.querySelectorAll('.sa-reveal').forEach(el=>observer.observe(el));
   return ()=>observer.disconnect();
 },[]);
 return <div className="sa-landing">
  <a className="sa-skip" href="#landing-content">Skip to content</a>
  <header className="sa-header"><a className="sa-wordmark" href="/" aria-label="SpiritAtlas home">SpiritAtlas<span className="sa-wordmark-dot">.</span></a><nav aria-label="Main navigation"><a href="#the-bars">The bars</a><a href="#inside">Inside the drink</a><a className="sa-nav-atlas" href={atlasUrl}>Open atlas <ArrowUpRight size={16}/></a></nav></header>
  <main id="landing-content">
   <section className="sa-hero sa-hero-classic" aria-labelledby="hero-title">
    <Marble/>
    <div className="sa-hero-content">
    <div className="sa-hero-copy"><h1 id="hero-title">Singapore’s<br/>cocktails.<br/><span>Inside out.</span></h1><div className="sa-hero-actions"><a className="sa-action" href={atlasUrl}>Explore the atlas <ArrowUpRight size={20}/></a><a className="sa-action sa-action-secondary" href="/behind-the-bar">Behind the bar</a></div></div>
    <ClassicNegroni/>
    </div>
    <div className="sa-hero-foot"><a href="#the-bars">Meet the three bars <ArrowRight size={15}/></a></div>
   </section>
   <section className="sa-bars sa-section" id="the-bars" aria-labelledby="bars-title">
    <div className="sa-section-heading sa-reveal"><h2 id="bars-title">Three bars.<br/><span>Distinctly their own.</span></h2></div>
    <div className="sa-bar-grid">{drinkIds.map((id,i)=>{const drink=drinkById[id],bar=barById[drink.barId];return <article className="sa-bar sa-reveal" key={id}><a className="sa-bar-link" href={`/?drink=${id}`} aria-label={`Explore ${bar.name}: ${drink.name}`}><div className="sa-bar-top"><span className="sa-index">0{i+1}</span><span className="sa-index">{bar.area}</span><ArrowUpRight size={20}/></div><div className="sa-bar-image"><img src={`/posters/${id}-hero.png`} alt={drink.appearance.join('. ')} loading="lazy" decoding="async"/></div><h3>{bar.name}</h3><span className="sa-bar-drink">{drink.name}</span></a><p>{descriptions[i]}</p><a className="sa-text-link" href={`/?drink=${id}`}>Explore the drink <ArrowRight size={16}/></a></article>})}</div>
   </section>
   <section className="sa-inside sa-section" id="inside" aria-labelledby="inside-title">
    <div className="sa-inside-copy sa-reveal"><h2 id="inside-title">There’s more<br/>in the glass.</h2><a className="sa-action" href="/?drink=ichigo-negroni&expand=1">Explore ingredients <ArrowUpRight size={20}/></a><span className="sa-method-note">Estimates are marked; shapes don’t indicate amounts.</span></div>
    <div className="sa-ingredient-story sa-reveal"><span className="sa-index">A closer look / Ichigo Negroni</span><div className="sa-ingredient-row"><span>01</span><div><h3>The finishing touch</h3><p>A yellow flower and a red garnish.</p></div></div><div className="sa-ingredient-row"><span>02</span><div><h3>A different clarity</h3><p>Strawberry and milk clarification shape MOGA’s interpretation.</p></div></div><div className="sa-ingredient-row"><span>03</span><div><h3>The foundation</h3><p>Spirit, bitter and vermouth.</p></div></div><a href="/?drink=ichigo-negroni&expand=1" className="sa-text-link">Look inside the Ichigo Negroni <ArrowRight size={17}/></a></div>
   </section>
   <section className="sa-comparison sa-section" aria-labelledby="comparison-title"><div className="sa-comparison-inner sa-reveal"><span className="sa-index">Bar Bon Funk / MOGA / Bar Somma</span><h2 id="comparison-title">Same starting point.<br/>A different point of view.</h2><a className="sa-action sa-action-dark" href={compareUrl}>Compare the three <ArrowUpRight size={20}/></a></div><div className="sa-comparison-mark" aria-hidden="true"><span/><span/><span/></div></section>
  </main>
  <footer className="sa-footer"><a className="sa-wordmark" href="/">SpiritAtlas.</a><a href={atlasUrl}>Back to Singapore <ArrowUpRight size={17}/></a></footer>
 </div>
}
