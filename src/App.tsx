import { Fragment, lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowLeft, ArrowLeftRight, ArrowRight, ArrowUp, ArrowUpRight, Check, ChevronDown, ChevronLeft, ChevronRight, Columns3, ExternalLink, Link2, MapPin, Minus, Plus, RotateCcw, SlidersHorizontal, X } from 'lucide-react';
import { AtlasMap } from './components/AtlasMap';
import { ReferenceViewer } from './components/ReferenceViewer';
import { barById, barsForFamily, categoriesForFamily, cocktailFamilies, drinkById, drinks, drinksForFamily, type CocktailFamilyId, type CategoryId, type Drink } from './data/drinks';
import { getRecipeResearch } from './data/recipeResearch';
import { ingredientDisplayName, ingredientEvidenceLabel } from './data/ingredientEvidence';
import {parseRoute, routeUrl, validIds, type Route} from './routes';
export {parseRoute, routeUrl} from './routes';
import './styles.css';
const Viewer = lazy(() => import('./scenes/Viewer').then((module) => ({ default: module.Viewer })));

type Orbit = { azimuth: number; elevation: number; zoom: number };
const defaultOrbit: Orbit = { azimuth: 0, elevation: 0.16, zoom: 1 };
const recipeExplanation = 'Estimated matches are marked. Shapes and sizes do not indicate measured amounts.';
function LoadingViewer() { return <div className="viewer-module-loading" role="status"><span className="loading-dot" />Preparing the 3D viewer…</div>; }
function ExpansionControl({value, onChange, id}: {value: number; onChange: (value: number) => void; id: string}) {
  return <div className="expansion-control"><div className="expansion-caption"><label htmlFor={id}>Expansion</label><span>{Math.round(value * 100)}%</span></div><input id={id} type="range" min="0" max="1" step="0.01" value={value} onChange={(event) => onChange(Number(event.target.value))} aria-valuetext={`${Math.round(value * 100)} percent expanded`} /><div className="range-extents"><span>Assembled</span><span>Recipe view</span></div></div>;
}
function OrbitControls({orbit, onChange, onReset}: {orbit: Orbit; onChange: (orbit: Orbit) => void; onReset: () => void}) {
  return <div className="orbit-controls" aria-label="3D inspection controls"><div className="rotation-buttons"><button className="icon-button" aria-label="Rotate left" title="Rotate left" onClick={() => onChange({...orbit, azimuth: orbit.azimuth - Math.PI / 8})}><ChevronLeft size={18} /></button><button className="icon-button" aria-label="Rotate right" title="Rotate right" onClick={() => onChange({...orbit, azimuth: orbit.azimuth + Math.PI / 8})}><ChevronRight size={18} /></button><button className="icon-button" aria-label="View from higher angle" title="View from above" onClick={() => onChange({...orbit, elevation: Math.min(0.85, orbit.elevation + 0.12)})}><ArrowUp size={16} /></button><button className="icon-button" aria-label="View from lower angle" title="Lower view" onClick={() => onChange({...orbit, elevation: Math.max(-0.15, orbit.elevation - 0.12)})}><ArrowDown size={16} /></button><button className="icon-button" aria-label="Zoom in" onClick={() => onChange({...orbit, zoom: Math.min(1.4, orbit.zoom + 0.1)})}><Plus size={16} /></button><button className="icon-button" aria-label="Zoom out" onClick={() => onChange({...orbit, zoom: Math.max(0.75, orbit.zoom - 0.1)})}><Minus size={16} /></button></div><button className="text-button reset-button" onClick={onReset}><RotateCcw size={14} />Reset view</button></div>;
}
function SourceDetails({drink}: {drink: Drink}) {
  const bar = barById[drink.barId];
  const research = getRecipeResearch(drink.id);
  const menu = drink.source.kind === 'menu';
  const inferredIngredients = drink.ingredients.filter(ingredient => ingredient.evidence === 'inferred');
  const sourceLinks = drink.source.links?.length ? drink.source.links : [{label: 'Official menu source', url: drink.source.originalUrl}];
  return <details className="source-details">
    <summary>{menu ? 'About this menu version' : 'About this filmed version'} <ChevronDown size={14} /></summary>
    <div className="source-details-body">
      {menu ? <><p>{drink.source.version}{drink.source.verifiedAt ? ` Sources checked ${drink.source.verifiedAt}.` : ''} The 3D serving illustrates documented ingredients{inferredIngredients.length > 0 ? ' and clearly marked recipe estimates' : ''}.</p><p className="menu-source-links">{sourceLinks.map(source => <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">{source.label} <ExternalLink size={11} /></a>)}</p></> : <p>Based on the user-supplied film, <a href={drink.source.originalUrl} target="_blank" rel="noreferrer">originally shared on Instagram <ExternalLink size={11} /></a>. Reference windows: {drink.source.timecodes.join(', ')}.</p>}
      {drink.ingredients.some(ingredient => ingredient.evidence === 'user-confirmed') && <p>Campari’s presence is confirmed by the atlas editor. This confirmation is separate from the film and menu evidence cited here; its quantity remains unknown.</p>}
      <p>Recipe measurements are not shown. {recipeExplanation}</p>
      {inferredIngredients.length > 0 && <section className="recipe-research" aria-labelledby={`ingredient-estimates-${drink.id}`}>
        <h3 id={`ingredient-estimates-${drink.id}`}>Estimated recipe matches</h3>
        <p>Closest published matches guide these estimates; the bar’s recipe specifications remain unverified.</p>
        {inferredIngredients.map(ingredient => <div className="recipe-research-finding" key={ingredient.id}>
          <strong>{ingredientDisplayName(ingredient)}</strong>
          <p>{ingredient.description}</p>
          {ingredient.sources?.map(source => <a className="recipe-research-link" key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`${source.label} (opens in a new tab)`}>{source.label}<ExternalLink size={11} aria-hidden="true" /></a>)}
        </div>)}
      </section>}
      <strong>Not established in the source</strong>
      <ul>{drink.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul>
      <p>Venue details checked {bar.verifiedAt} using <a href={bar.verificationSources[0]} target="_blank" rel="noreferrer">official venue information</a>{bar.verificationSources.some(url => url.includes('onemap.gov.sg')) && <> and <a href={bar.verificationSources.find(url => url.includes('onemap.gov.sg'))} target="_blank" rel="noreferrer">Singapore OneMap</a></>}. {menu ? 'Menus and availability can change; check with the venue before visiting.' : 'This is a record of the filmed drink, not a current availability or menu claim.'}</p>
      {research && <section className="recipe-research" aria-labelledby={`recipe-research-${drink.id}`}>
        <h3 id={`recipe-research-${drink.id}`}>Menu &amp; recipe research</h3>
        {research.findings.map((finding) => <div className="recipe-research-finding" key={finding.text}>
          <p>{finding.text}</p>
          {finding.sources.map((source) => <a className="recipe-research-link" key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`${source.label} (opens in a new tab)`}>{source.label}<ExternalLink size={11} aria-hidden="true" /></a>)}
        </div>)}
      </section>}
    </div>
  </details>;
}
function IngredientPanel({drink, selected, onSelect}: {drink: Drink; selected: string | null; onSelect: (id: CategoryId) => void}) {
  const [expandedCategory, setExpandedCategory] = useState<CategoryId | null>(null);
  return <div className="ingredient-panel"><h2>Inside the drink</h2><p className="recipe-note">Recipe view · ingredients shown separately. {recipeExplanation}</p><div className="ingredient-list">{categoriesForFamily(drink.family).map((category, index) => {
    const ingredient = drink.ingredients.find((entry) => entry.category === category.id)!;
    const active = selected === category.id;
    const expanded = expandedCategory === category.id;
    return <div className={`ingredient-item ${active ? 'is-active' : ''}`} key={category.id}><button aria-expanded={expanded} aria-controls={`ingredient-${drink.id}-${category.id}`} onClick={() => { onSelect(category.id); setExpandedCategory((current) => current === category.id ? null : category.id); }} onFocus={() => onSelect(category.id)} onMouseEnter={() => onSelect(category.id)}><span className="ingredient-number">{index + 1}</span><span><small>{category.label}</small><strong>{ingredientDisplayName(ingredient)}</strong></span><Plus size={14} className={expanded ? 'ingredient-open-icon' : ''} /></button><p id={`ingredient-${drink.id}-${category.id}`} hidden={!expanded}>{ingredient.description}</p></div>;
  })}</div>{drink.techniques.length > 0 && <div className="technique-strip"><h3>How it’s made</h3>{drink.techniques.map((technique) => <details key={technique.id}><summary>{technique.title}<Plus size={12} /></summary><p>{technique.description}</p></details>)}</div>}<SourceDetails drink={drink} /></div>;
}
export default function App() {
  const [route, setRoute] = useState<Route>(() => parseRoute(window.location.search));
  const [selection, setSelection] = useState<string[]>(() => parseRoute(window.location.search).compareIds);
  const [orbit, setOrbit] = useState<Orbit>(defaultOrbit);
  const [individualOrbits, setIndividualOrbits] = useState<Record<string, Orbit>>({});
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [referenceIds, setReferenceIds] = useState<string[]>([]);
  const showReference = (id: string, show: boolean) => setReferenceIds(current => show ? [...new Set([...current, id])] : current.filter(value => value !== id));
  const [shareMessage, setShareMessage] = useState('');
  const [copyFallback, setCopyFallback] = useState(false);
  const shareButtonRef = useRef<HTMLButtonElement>(null);
  const [coarsePointer, setCoarsePointer] = useState(false);
  const [focusedCompareId, setFocusedCompareId] = useState(() => parseRoute(window.location.search).compareIds[0] ?? drinks[0].id);
  const comparisonScrollRef = useRef<HTMLDivElement>(null);
  const collectionNavRef = useRef<HTMLElement>(null);
  const explicitComparisonFocus = useRef(false);
  const routeRef = useRef(route); routeRef.current = route;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const firstRoute = useRef(true);
  const revealCollection = (button: HTMLElement) => {
    const nav = collectionNavRef.current;
    if (!nav) return;
    const bounds = nav.getBoundingClientRect(), item = button.getBoundingClientRect();
    const styles = getComputedStyle(nav), left = bounds.left + parseFloat(styles.paddingLeft), right = bounds.right - parseFloat(styles.paddingRight);
    const delta = item.left < left ? item.left - left : item.right > right ? item.right - right : 0;
    if (delta) nav.scrollTo({left: nav.scrollLeft + delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  useEffect(() => {
    const selected = collectionNavRef.current?.querySelector<HTMLElement>('button[aria-pressed="true"]');
    if (selected) revealCollection(selected);
  }, [route.collection]);
  const navigate = useCallback((next: Route, replace = false) => {
    setReferenceIds([]);
    window.history[replace ? 'replaceState' : 'pushState']({}, '', routeUrl(next));
    setRoute(next);
  }, []);
  useEffect(() => {
    const pop = () => { setReferenceIds([]); const next = parseRoute(window.location.search); if (next.collection !== routeRef.current.collection) { setSelection([]); setOrbit(defaultOrbit); setIndividualOrbits({}); } setRoute(next); if (next.page === 'compare') setSelection(next.compareIds); setSelectedCategory(null); };
    window.addEventListener('popstate', pop);
    const pointer = window.matchMedia('(pointer: coarse)');
    const updatePointer = () => setCoarsePointer(pointer.matches); updatePointer(); pointer.addEventListener('change', updatePointer);
    return () => { window.removeEventListener('popstate', pop); pointer.removeEventListener('change', updatePointer); };
  }, []);
  useEffect(() => {
    document.title = route.page === 'drink' ? `${drinkById[route.drinkId].name} — SpiritAtlas` : `${route.page === 'compare' ? 'Compare ' : ''}${cocktailFamilies.find(family => family.id === route.collection)?.name} — SpiritAtlas`;
    if (!firstRoute.current) { window.scrollTo({top: 0, behavior: 'instant'}); titleRef.current?.focus({preventScroll: true}); }
    firstRoute.current = false;
  }, [route.page, route.drinkId, route.collection]);
  const updateExpansion = useCallback((value: number) => {
    setReferenceIds([]);
    setRoute((current) => { const next = {...current, expansion: Math.max(0, Math.min(1, value))}; window.history.replaceState({}, '', routeUrl(next)); return next; });
  }, []);
  const openDrink = (id: string) => { const drink = drinkById[id]; if (!drink) return; if (drink.family !== routeRef.current.collection) setSelection([]); setOrbit(defaultOrbit); setSelectedCategory(null); navigate({...routeRef.current, collection: drink.family, page: 'drink', drinkId: id, barId: drink.barId, expansion: 0}); };
  const openAtlas = () => navigate({...routeRef.current, page: 'atlas'});
  const changeCollection = (collection: CocktailFamilyId) => { if (collection === route.collection) return; const first = drinksForFamily(collection)[0]; setSelection([]); setSelectedCategory(null); setOrbit(defaultOrbit); setIndividualOrbits({}); navigate({...routeRef.current, page: 'atlas', collection, drinkId: first?.id ?? drinks[0].id, barId: first?.barId ?? drinks[0].barId, compareIds: [], expansion: 0, sync: true}); };
  const compare = (ids: string[]) => { const valid = validIds(ids, routeRef.current.collection); if (valid.length < 2) return; setSelection(valid); setFocusedCompareId(valid[0]); setSelectedCategory(null); setOrbit(defaultOrbit); setIndividualOrbits({}); navigate({...routeRef.current, page: 'compare', compareIds: valid, expansion: 1, sync: true}); };
  const toggleSelection = (id: string) => setSelection((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 && drinkById[id]?.family === routeRef.current.collection ? [...current, id] : current);
  const removeCompare = (id: string) => {
    const next = route.compareIds.filter((item) => item !== id); setSelection(next);
    if (next.length < 2) openDrink(next[0] ?? drinks[0].id);
    else navigate({...route, compareIds: next});
  };
  const resetOrbit = () => { setOrbit(defaultOrbit); setIndividualOrbits({}); };
  const selectCategory = (id: string) => setSelectedCategory(id);
  const shareUrl = new URL(routeUrl(route), window.location.href).href;
  const closeShareFallback = () => { setCopyFallback(false); shareButtonRef.current?.focus(); };
  const share = async () => {
    try { await navigator.clipboard.writeText(shareUrl); setCopyFallback(false); setShareMessage('Link copied'); setTimeout(() => setShareMessage(''), 2500); }
    catch { setCopyFallback(true); }
  };
  const family = cocktailFamilies.find(family => family.id === route.collection)!;
  const collectionDrinks = drinksForFamily(route.collection);
  const collectionBars = barsForFamily(route.collection);
  const sharedLocation = collectionBars.find(bar => collectionBars.filter(other => other.buildingId === bar.buildingId).length > 1);
  const atlasVenueCount = new Set(drinks.map(drink => drink.barId)).size;
  const currentDrink = drinkById[route.drinkId];
  const currentBar = barById[currentDrink.barId];
  const remaining = collectionDrinks.filter((drink) => !route.compareIds.includes(drink.id));
  const activeCompareId = route.compareIds.includes(focusedCompareId) ? focusedCompareId : route.compareIds[0] ?? drinks[0].id;
  const activeCompareDrink = drinkById[activeCompareId];
  const toggleSync = () => {
    if (route.sync) setIndividualOrbits(Object.fromEntries(route.compareIds.map((id) => [id, {...orbit}])));
    navigate({...route, sync: !route.sync}, true);
  };
  const focusComparedDrink = (id: string) => {
    explicitComparisonFocus.current = true;
    setFocusedCompareId(id);
    const scroller = comparisonScrollRef.current;
    const column = scroller?.querySelector<HTMLElement>(`[data-drink-id="${id}"]`);
    if (!scroller || !column) return;
    const left = column.getBoundingClientRect().left - scroller.getBoundingClientRect().left + scroller.scrollLeft - parseFloat(getComputedStyle(scroller).paddingLeft);
    scroller.scrollTo({left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  };
  const updateFocusedCompareDrink = () => {
    if (explicitComparisonFocus.current) return;
    const scroller = comparisonScrollRef.current;
    if (!scroller) return;
    const edge = scroller.getBoundingClientRect().left + parseFloat(getComputedStyle(scroller).paddingLeft);
    const columns = Array.from(scroller.querySelectorAll<HTMLElement>('[data-drink-id]'));
    const nearest = columns.reduce<HTMLElement | null>((best, column) => !best || Math.abs(column.getBoundingClientRect().left - edge) < Math.abs(best.getBoundingClientRect().left - edge) ? column : best, null);
    if (nearest?.dataset.drinkId) setFocusedCompareId(nearest.dataset.drinkId);
  };
  return <>
    <a className="skip-link" href="#main-content">Skip to the atlas</a>
    <header className="site-header"><button className="wordmark" onClick={openAtlas} aria-label="SpiritAtlas home"><span>Singapore</span><strong>SpiritAtlas<span className="brand-stop">.</span></strong></button><nav aria-label="Main navigation"><button className={route.page === 'atlas' ? 'nav-button active' : 'nav-button'} onClick={openAtlas} aria-current={route.page === 'atlas' ? 'page' : undefined}><MapPin size={14} />The atlas</button><button className={route.page === 'compare' ? 'nav-button active' : 'nav-button'} onClick={() => compare(selection.length >= 2 ? selection : collectionDrinks.map((drink) => drink.id))} aria-current={route.page === 'compare' ? 'page' : undefined}><Columns3 size={15} />Compare<span className="desktop-label"> the drinks</span></button></nav><button ref={shareButtonRef} className="share-button icon-button" onClick={share} aria-label="Copy a link to this view" title="Copy link"><Link2 size={18} /><span className="desktop-label">Share</span></button></header>
    <nav ref={collectionNavRef} className="collection-selector" aria-label="Cocktail collections" onFocusCapture={(event) => { const button = (event.target as HTMLElement).closest("button"); if (button) revealCollection(button); }}>{cocktailFamilies.map(item => <button key={item.id} className={item.id === route.collection ? 'active' : ''} aria-pressed={item.id === route.collection} onClick={() => changeCollection(item.id)}>{item.name}</button>)}</nav>
    <div className="share-status" role="status">{shareMessage}</div>
    {copyFallback ? <div className="share-fallback" onKeyDown={(event) => { if (event.key === 'Escape') { event.preventDefault(); closeShareFallback(); } }}><label htmlFor="share-url">Copy this link to share the current view</label><div><input id="share-url" value={shareUrl} readOnly autoFocus onFocus={(event) => event.target.select()} /><button className="icon-button" aria-label="Close share link" onClick={closeShareFallback}><X size={18} /></button></div></div> : null}
    <main id="main-content" className={selection.length > 0 && route.page !== 'compare' ? 'has-comparison-selection' : undefined}>
      <div className="atlas-layout" hidden={route.page !== 'atlas'}>
        <div className="atlas-intro"><h1 ref={route.page === 'atlas' ? titleRef : undefined} tabIndex={-1}>{family.headline.split('\n').map((line, index, lines) => <Fragment key={index}>{index > 0 && <br />}{index === lines.length - 1 && lines.length > 1 ? <em>{line}</em> : line}</Fragment>)}</h1><p>{family.description} Explore the bars and unfold their drinks.</p></div>
        <AtlasMap key={route.collection} family={route.collection} selectedBar={route.barId} onSelectBar={(id) => navigate({...route, barId: id}, true)} onExplore={openDrink} visible={route.page === 'atlas'} />
        <section className="venue-list" aria-label="Featured bars"><div className="venue-list-heading"><h2>The three stops</h2><span>Singapore</span></div>{collectionBars.map((bar) => { const drink = collectionDrinks.find(drink => drink.barId === bar.id)!; const active = route.barId === bar.id; const added = selection.includes(drink.id); return <article className={`venue-row ${active ? 'is-active' : ''}`} key={bar.id}><button className="venue-select" onClick={() => navigate({...route, barId: bar.id}, true)} aria-pressed={active}><span className="venue-row-top"><strong>{bar.name}</strong><ArrowUpRight size={17} /></span><span className="venue-cocktail">{drink.name}</span><span className="venue-location">{bar.buildingName}{bar.floor !== bar.buildingName && <> <span>·</span> {bar.floor}</>}</span></button><div className="venue-row-actions"><button className="text-button" onClick={() => openDrink(drink.id)}>Explore drink <ArrowRight size={13} /></button><button className={`text-button venue-add ${added ? 'added' : ''}`} onClick={() => toggleSelection(drink.id)} disabled={selection.length >= 3 && !added} aria-label={`${added ? 'Remove' : 'Add'} ${drink.name} ${added ? 'from' : 'to'} comparison`} aria-pressed={added}>{added ? <Check size={14} /> : <Plus size={14} />}<span>{added ? 'Added' : 'Compare'}</span></button></div></article>; })}<button className="compare-all-link" disabled={collectionDrinks.length < 2} onClick={() => compare(collectionDrinks.map((drink) => drink.id))}><Columns3 size={16} />Compare all three <ArrowRight size={16} /></button><p className="atlas-footnote">{sharedLocation && <>{collectionBars.filter(bar => bar.buildingId === sharedLocation.buildingId).length === 2 ? 'Two' : collectionBars.filter(bar => bar.buildingId === sharedLocation.buildingId).length} of these bars share {sharedLocation.buildingName}.<br />Same building, different stories.<br /></>}{drinks.length} drinks · {atlasVenueCount} Singapore bars in the atlas.</p></section>
      </div>
      {route.page === 'drink' ? <div className="drink-page" key={currentDrink.id}>
        <div className="drink-topline"><button className="text-button" onClick={openAtlas}><ArrowLeft size={15} />Back to the atlas</button><div className="drink-switcher" aria-label="Choose cocktail">{collectionDrinks.map((drink) => <button className={drink.id === currentDrink.id ? 'active' : ''} key={drink.id} onClick={() => openDrink(drink.id)} aria-label={`View ${drink.name}`} aria-pressed={drink.id === currentDrink.id}>{barById[drink.barId].name}</button>)}</div></div>
        <section className="drink-stage" aria-label={`${currentDrink.name} showcase`}>
          <div className="drink-information"><a className="bar-location" href={currentBar.directions} target="_blank" rel="noreferrer"><MapPin size={13} />{currentBar.name} <span>· {currentBar.area}</span><ArrowUpRight size={12} /></a><h1 ref={titleRef} tabIndex={-1}>{currentDrink.name}</h1><p className="drink-twist">{currentDrink.twist}</p><p className="drink-introduction">{currentDrink.introduction}</p>{family.sourceCaption && <p className="appearance-reference">{family.sourceCaption}</p>}<div className="drink-primary-actions"><button className="button button-primary" onClick={() => updateExpansion(route.expansion > 0.5 ? 0 : 1)}>{route.expansion > 0.5 ? <RotateCcw size={16} /> : <SlidersHorizontal size={16} />}{route.expansion > 0.5 ? 'Reassemble drink' : 'Explore ingredients'}</button><button className="button button-secondary" onClick={() => toggleSelection(currentDrink.id)} disabled={selection.length >= 3 && !selection.includes(currentDrink.id)} aria-pressed={selection.includes(currentDrink.id)}>{selection.includes(currentDrink.id) ? <Check size={16} /> : <Plus size={16} />}{selection.includes(currentDrink.id) ? 'Added to comparison' : 'Add to comparison'}</button></div><ExpansionControl value={route.expansion} onChange={updateExpansion} id="drink-expansion" /><OrbitControls orbit={orbit} onChange={value => {showReference(currentDrink.id, false); setOrbit(value);}} onReset={() => {showReference(currentDrink.id, false); resetOrbit();}} /><p className="interaction-help">{coarsePointer ? 'Drag sideways to rotate. Use the controls to tilt and zoom.' : 'Drag to rotate · + / − to zoom · Double-click to expand'}</p></div>
          <div className="drink-viewer"><ReferenceViewer key={currentDrink.id} drink={currentDrink} showReference={referenceIds.includes(currentDrink.id)} onReferenceChange={show => showReference(currentDrink.id, show)} stateLabel={route.expansion > 0.05 ? 'Recipe view · shapes do not show amounts' : 'The finished drink'}><Suspense fallback={<LoadingViewer />}><Viewer drinkId={currentDrink.id} active={!referenceIds.includes(currentDrink.id)} expansion={route.expansion} onExpansionChange={updateExpansion} orbit={orbit} onOrbitChange={setOrbit} selectedCategory={selectedCategory} onSelectCategory={selectCategory} /></Suspense></ReferenceViewer></div>
          <IngredientPanel drink={currentDrink} selected={selectedCategory} onSelect={selectCategory} />
        </section>
        <section className="venue-details"><div><h2>Find {currentBar.name}</h2><p>{currentBar.description}</p></div><div><span>{currentBar.buildingName}{currentBar.floor !== currentBar.buildingName ? ` · ${currentBar.floor}` : ''}</span><address>{currentBar.address}</address><div className="venue-links"><a href={currentBar.directions} target="_blank" rel="noreferrer">Get directions <ArrowUpRight size={14} /></a><a href={currentBar.url} target="_blank" rel="noreferrer">Visit the bar’s website <ArrowUpRight size={14} /></a></div></div></section>
        <div className="next-drink"><span>Another interpretation</span><button onClick={() => openDrink(collectionDrinks[(collectionDrinks.findIndex((drink) => drink.id === currentDrink.id) + 1) % collectionDrinks.length].id)}>{collectionDrinks[(collectionDrinks.findIndex((drink) => drink.id === currentDrink.id) + 1) % collectionDrinks.length].name}<ArrowRight size={28} /></button></div>
      </div> : null}
      {route.page === 'compare' ? <div className="comparison-page">
        <div className="comparison-heading"><div><button className="text-button" onClick={openAtlas}><ArrowLeft size={15} />Back to the atlas</button><h1 ref={titleRef} tabIndex={-1}>A study in <em>difference.</em></h1><p>Recipe view · ingredients shown separately. {recipeExplanation}</p>{family.sourceCaption && <p className="appearance-reference">{family.sourceCaption}</p>}</div><div className="comparison-add">{route.compareIds.length < 3 && remaining.length ? <button className="button button-secondary" onClick={() => { const ids = validIds([...route.compareIds, remaining[0].id], route.collection); setSelection(ids); navigate({...route, compareIds: ids}); }}><Plus size={15} />Add {barById[remaining[0].barId].name}</button> : <span>All three interpretations</span>}</div></div>
        <div className="comparison-toolbar"><button className="button button-primary" onClick={() => updateExpansion(route.expansion > 0.5 ? 0 : 1)}>{route.expansion > 0.5 ? <RotateCcw size={15} /> : <SlidersHorizontal size={15} />}{route.expansion > 0.5 ? 'Reassemble all' : 'Expand all'}</button><ExpansionControl value={route.expansion} onChange={updateExpansion} id="compare-expansion" /><button className="sync-control" role="switch" aria-checked={route.sync} aria-label={route.sync ? 'Rotation synchronized' : 'Rotate independently'} onClick={toggleSync}><span className={`switch-track ${route.sync ? 'on' : ''}`}><span /></span><span className="sync-wide-label">{route.sync ? 'Rotation synchronized' : 'Rotate independently'}</span><span className="sync-short-label" aria-hidden="true">{route.sync ? 'Sync rotation' : 'Independent'}</span></button><button className="text-button" onClick={resetOrbit}><RotateCcw size={14} />Reset alignment</button><div className="compare-identity-strip" aria-label="Current comparison drink"><div><label htmlFor="compare-focus">Drink in view · {route.compareIds.indexOf(activeCompareId) + 1} of {route.compareIds.length}</label><select id="compare-focus" value={activeCompareId} onChange={(event) => focusComparedDrink(event.target.value)} aria-label="Drink in view">{route.compareIds.map((id) => <option value={id} key={id}>{drinkById[id].name}</option>)}</select><p>{activeCompareDrink.shortTwist}</p></div><button className="icon-button" aria-label={`Remove current drink, ${activeCompareDrink.name}`} onClick={() => removeCompare(activeCompareId)}><X size={16} /></button></div><span className="compare-scroll-hint"><ArrowLeftRight size={16} />Swipe to see the other drinks</span></div>
        <div className="comparison-scroll" ref={comparisonScrollRef} onScroll={updateFocusedCompareDrink} onPointerDownCapture={(event) => { explicitComparisonFocus.current = false; const column = (event.target as HTMLElement).closest<HTMLElement>('[data-drink-id]'); if (column?.dataset.drinkId) setFocusedCompareId(column.dataset.drinkId); }} onWheel={() => { explicitComparisonFocus.current = false; }} onKeyDown={() => { explicitComparisonFocus.current = false; }}><div className="comparison-columns" style={{'--column-count': route.compareIds.length} as React.CSSProperties}>{route.compareIds.map((id) => { const drink = drinkById[id]; const bar = barById[drink.barId]; const columnOrbit = route.sync ? orbit : individualOrbits[id] ?? defaultOrbit; const changeOrbit = (value: Orbit) => route.sync ? setOrbit(value) : setIndividualOrbits((previous) => ({...previous, [id]: value})); return <section className="comparison-column" key={id} data-drink-id={id} onFocusCapture={() => setFocusedCompareId(id)} aria-label={`Compare ${drink.name}`}><div className="comparison-drink-heading"><div><span>{bar.name}</span><h2><button onClick={() => openDrink(id)}>{drink.name}</button></h2><p>{drink.shortTwist}</p></div><button className="icon-button" aria-label={`Remove ${drink.name} from comparison`} onClick={() => removeCompare(id)}><X size={16} /></button></div><div className="comparison-viewer"><ReferenceViewer drink={drink} showReference={referenceIds.includes(id)} onReferenceChange={show => showReference(id, show)}><Suspense fallback={<LoadingViewer />}><Viewer drinkId={id} active={!referenceIds.includes(id)} expansion={route.expansion} onExpansionChange={updateExpansion} orbit={columnOrbit} onOrbitChange={changeOrbit} selectedCategory={selectedCategory} onSelectCategory={selectCategory} comparison /></Suspense></ReferenceViewer></div><OrbitControls orbit={columnOrbit} onChange={value => {showReference(id, false); changeOrbit(value);}} onReset={() => {showReference(id, false); route.sync ? setOrbit(defaultOrbit) : setIndividualOrbits((previous) => ({...previous, [id]: {...defaultOrbit}}));}} /><div className="comparison-ingredients">{categoriesForFamily(drink.family).map((category) => { const ingredient = drink.ingredients.find((entry) => entry.category === category.id)!; return <button className={`comparison-ingredient ${selectedCategory === category.id ? 'active' : ''} ${ingredient.evidence === 'unverified' ? 'unverified' : ''}`} key={category.id} onClick={() => setSelectedCategory(category.id)} onFocus={() => setSelectedCategory(category.id)} onMouseEnter={() => setSelectedCategory(category.id)} aria-pressed={selectedCategory === category.id}><small>{category.label}</small><strong>{ingredientDisplayName(ingredient)}</strong><span>{selectedCategory === category.id ? ingredient.description : ingredientEvidenceLabel(ingredient, drink.source.kind)}</span></button>; })}</div>{drink.techniques.length > 0 && <div className="comparison-techniques"><h3>Preparation</h3>{drink.techniques.map((technique) => <p key={technique.id}>{technique.title}</p>)}</div>}<SourceDetails drink={drink} /></section>; })}</div></div>
      </div> : null}
    </main>
    {selection.length > 0 && route.page !== 'compare' ? <aside className="comparison-tray" aria-label="Comparison selection"><div><Columns3 size={18} /><span><strong>{selection.length} of 3 drinks</strong><small>{selection.length < 2 ? 'Choose one more to compare' : 'Ready to compare'}</small></span></div><div className="selection-names">{selection.map((id) => <button key={id} onClick={() => toggleSelection(id)} aria-label={`Remove ${drinkById[id].name} from selection`}>{drinkById[id].name}<X size={12} /></button>)}</div><button className="button button-primary" disabled={selection.length < 2} onClick={() => compare(selection)}>Compare <ArrowRight size={15} /></button><button className="icon-button" aria-label="Clear comparison selection" onClick={() => setSelection([])}><X size={17} /></button></aside> : null}
    {route.page !== 'atlas' ? <footer className="site-footer"><span>SpiritAtlas</span><span>Three interpretations. An invitation to look closer.</span><button className="text-button" onClick={openAtlas}>Return to the atlas <ArrowUpRight size={13} /></button></footer> : null}
  </>;
}
