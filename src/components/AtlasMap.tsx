import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUpRight, LocateFixed, MapPin, RefreshCw, X } from 'lucide-react';
import type { Map as LibreMap, Marker } from 'maplibre-gl';
import { barsForFamily, drinksForFamily, type CocktailFamilyId } from '../data/drinks';
import 'maplibre-gl/dist/maplibre-gl.css';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

type Props = { family: CocktailFamilyId; selectedBar: string; onSelectBar: (id: string) => void; onExplore: (id: string) => void; visible: boolean };
export function AtlasMap({ family, selectedBar, onSelectBar, onExplore, visible }: Props) {
  const bars = useMemo(() => barsForFamily(family), [family]);
  const locations = useMemo(() => Array.from(new Set(bars.map(bar => bar.buildingId))).map(buildingId => {
    const venues = bars.filter(bar => bar.buildingId === buildingId), first = venues[0];
    return {buildingId, coordinates: first.coordinates, label: venues.length > 1 ? first.buildingName : first.name, detail: venues.length > 1 ? `${venues.length} bars` : first.area, ids: venues.map(bar => bar.id)};
  }), [bars]);
  const bounds = useMemo(() => bars.length ? [[Math.min(...bars.map(bar => bar.coordinates[0])) - .006, Math.min(...bars.map(bar => bar.coordinates[1])) - .005], [Math.max(...bars.map(bar => bar.coordinates[0])) + .006, Math.max(...bars.map(bar => bar.coordinates[1])) + .005]] as [[number,number],[number,number]] : [[103.833,1.287],[103.857,1.300]] as [[number,number],[number,number]], [bars]);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<LibreMap | null>(null);
  const markers = useRef<Marker[]>([]);
  const select = useRef(onSelectBar);
  select.current = onSelectBar;
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [retry, setRetry] = useState(0);
  const [buildingOpen, setBuildingOpen] = useState<string | null>(null);
  const selected = bars.find(bar => bar.id === selectedBar) ?? bars[0];
  const drink = drinksForFamily(family).find(drink => drink.barId === selected?.id);
  useEffect(() => {
    let disposed = false;
    let instance: LibreMap | undefined;
    let timer: ReturnType<typeof setTimeout>;
    let resize: ResizeObserver | undefined;
    let tileError = false;
    setState('loading');
    async function setup() {
      try {
        const maplibregl = await import('maplibre-gl');
        if (disposed || !container.current) return;
        maplibregl.setWorkerUrl(mapWorkerUrl);
        instance = new maplibregl.Map({
          container: container.current,
          center: [103.845, 1.297], zoom: 13.25, minZoom: 10, maxZoom: 18,
          maxBounds: [[103.5, 1.08], [104.15, 1.52]],
          attributionControl: false,
          style: 'https://tiles.openfreemap.org/styles/dark',
        });
        map.current = instance;
        instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        instance.addControl(new maplibregl.AttributionControl({ compact: false }), 'bottom-right');
        instance.scrollZoom.disable();
        instance.getCanvas().setAttribute('aria-label', `Navigable Singapore map showing ${locations.map(location => location.label).join(', ')}. Equivalent venue choices are in the bar list.`);
        instance.on('load', () => { if (!disposed) { if (!tileError) setState('ready'); clearTimeout(timer); instance?.fitBounds(bounds, {padding: {top: 90, bottom: 170, left: 60, right: 60}, duration: 0}); } });
        instance.on('error', () => { tileError = true; if (!disposed) setState('error'); });
        instance.on('idle', () => { if (!disposed && !tileError && instance?.areTilesLoaded()) setState('ready'); });
        timer = setTimeout(() => { if (!disposed && !instance?.loaded()) setState('error'); }, 15000);
        markers.current = locations.map((location) => {
          const element = document.createElement('button');
          element.className = 'venue-marker';
          element.dataset.building = location.buildingId;
          element.type = 'button';
          element.setAttribute('aria-label', location.ids.length > 1 ? `${location.label}, ${location.ids.length === 2 ? 'two' : location.ids.length} bars: ${bars.filter(bar => location.ids.includes(bar.id)).map(bar => bar.name).join(' and ')}` : `Select ${location.label}${location.ids[0] === 'moga' ? ' on Hill Street' : ''}`);
          const pin = document.createElement('span');
          pin.className = 'marker-pin';
          pin.textContent = location.ids.length > 1 ? String(location.ids.length) : location.label[0];
          const label = document.createElement('span');
          label.className = 'marker-label';
          const name = document.createElement('strong'); name.textContent = location.label;
          const detail = document.createElement('small'); detail.textContent = location.detail;
          label.append(name, detail); element.append(pin, label);
          element.addEventListener('click', () => {
            if (location.ids.length > 1) setBuildingOpen(location.buildingId);
            else { select.current(location.ids[0]); setBuildingOpen(null); }
          });
          return new maplibregl.Marker({ element, anchor: 'bottom-left' }).setLngLat(location.coordinates).addTo(instance!);
        });
        resize = new ResizeObserver(() => instance?.resize());
        resize.observe(container.current);
      } catch { if (!disposed) setState('error'); }
    }
    void setup();
    return () => { disposed = true; clearTimeout(timer); resize?.disconnect(); markers.current.forEach((marker) => marker.remove()); markers.current = []; instance?.remove(); map.current = null; };
  }, [retry, locations, bounds, bars]);
  useEffect(() => {
    markers.current.forEach((marker) => {
      const element = marker.getElement();
      const active = element.dataset.building === selected?.buildingId;
      element.classList.toggle('is-selected', active);
      element.setAttribute('aria-pressed', String(active));
    });
  }, [selected?.buildingId, state]);
  useEffect(() => { if (visible) requestAnimationFrame(() => map.current?.resize()); }, [visible]);
  return <section className="atlas-map" aria-label="Singapore venue map">
    <div ref={container} className="map-canvas" />
    <div className="map-heading"><MapPin size={14} /><span>Singapore</span><span className="map-coordinate">1°17′ N · 103°50′ E</span></div>
    {state === 'loading' ? <div className="map-loading" role="status"><span className="loading-dot" /> Loading the Singapore map</div> : null}
    {state === 'error' ? <div className="map-error" role="status"><MapPin size={26} /><h3>The map is unavailable.</h3><p>You can still explore every venue in the bar list and open verified directions.</p><button className="button button-secondary" onClick={() => setRetry((n) => n + 1)}><RefreshCw size={15} />Retry map</button></div> : null}
    {buildingOpen && state !== 'error' ? <div className="building-picker" aria-label={`Venues at ${locations.find(location => location.buildingId === buildingOpen)?.label}`}><div className="building-picker-title"><span>{locations.find(location => location.buildingId === buildingOpen)?.label} · choose a bar</span><button className="icon-button" aria-label={`Close ${locations.find(location => location.buildingId === buildingOpen)?.label} venue selector`} onClick={() => setBuildingOpen(null)}><X size={16} /></button></div>{bars.filter((bar) => bar.buildingId === buildingOpen).map((bar) => <button className={`building-choice ${selectedBar === bar.id ? 'active' : ''}`} key={bar.id} onClick={() => { onSelectBar(bar.id); setBuildingOpen(null); }}><strong>{bar.name}</strong><span>{bar.floor}</span></button>)}</div> : null}
    {state !== 'error' ? <button className="map-recenter icon-button" aria-label="Show all featured venues" title="Show all venues" onClick={() => { setBuildingOpen(null); map.current?.fitBounds(bounds, {padding: {top: 90, bottom: 170, left: 60, right: 60}, duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 700}); }}><LocateFixed size={19} /></button> : null}
    {selected && drink ? <div className="map-preview" key={selected.id}>
      <div><span className="preview-place">{selected.buildingName}{selected.floor !== selected.buildingName ? ` · ${selected.floor}` : ''}</span><h3>{selected.name}</h3><p>{drink.name}</p></div>
      <button className="button button-primary" onClick={() => onExplore(drink.id)}>Explore drink <ArrowUpRight size={16} /></button>
    </div> : null}
  </section>;
}
