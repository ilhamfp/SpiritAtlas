import {useState, type ReactNode} from 'react';
import {Box, ExternalLink, Image, RotateCcw} from 'lucide-react';
import {drinkReferences, missingReferenceNotes, type DrinkReference} from '../data/drinkReferences';
import type {Drink} from '../data/drinks';

function ReferencePhoto({reference, drinkId}: {reference: DrinkReference; drinkId: string}) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  return <figure className="reference-photo" data-testid={`reference-photo-${drinkId}`} data-status={status}>
    <div className="reference-image" aria-busy={status === 'loading'}>
      {status !== 'error' ? <img key={attempt} src={reference.src} alt={reference.alt} decoding="async" onLoad={() => setStatus('ready')} onError={() => setStatus('error')} className={status === 'ready' ? 'is-ready' : ''} /> : null}
      {status === 'loading' ? <p className="reference-image-status" role="status">Loading reference photo…</p> : null}
      {status === 'error' ? <div className="reference-image-status" role="alert"><p>The reference photo couldn’t load.</p><button className="text-button" onClick={() => {setStatus('loading'); setAttempt(value => value + 1);}}><RotateCcw size={14} aria-hidden="true" />Retry reference photo</button></div> : null}
    </div>
    <figcaption>
      <p>{reference.caption}</p>
      <div className="reference-credit"><span>{reference.credit}</span>{reference.sourceUrl ? <a href={reference.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${reference.sourceLabel ?? 'View source'} (opens in a new tab)`}>{reference.sourceLabel ?? 'View source'}<ExternalLink size={12} aria-hidden="true" /></a> : null}</div>
    </figcaption>
  </figure>;
}

/** Keep the live scene mounted and its framing stable while inspecting the source. */
export function ReferenceViewer({drink, showReference, onReferenceChange, stateLabel, children}: {
  drink: Drink;
  showReference: boolean;
  onReferenceChange: (show: boolean) => void;
  stateLabel?: string;
  children: ReactNode;
}) {
  const reference = drinkReferences[drink.id];
  const photo = showReference && !!reference;
  const panelId = `reference-stage-${drink.id}`;
  const noteId = `reference-note-${drink.id}`;
  return <div className="reference-viewer" data-testid={`reference-viewer-${drink.id}`} data-mode={photo ? 'photo' : 'model'}>
    <div className="reference-toolbar" role="group" aria-label={`${drink.name} image view`}>
      <button aria-pressed={!photo} aria-controls={panelId} onClick={() => onReferenceChange(false)}><Box size={15} aria-hidden="true" />3D model</button>
      <button aria-pressed={photo} aria-controls={panelId} aria-describedby={!reference ? noteId : undefined} disabled={!reference} onClick={() => onReferenceChange(true)}><Image size={15} aria-hidden="true" />Reference photo</button>
    </div>
    <div className="reference-stage" id={panelId}>
      <div className="reference-live" aria-hidden={photo ? true : undefined} inert={photo}>
        {children}
        {!reference ? <p className="reference-unavailable" id={noteId}>{missingReferenceNotes[drink.id] ?? 'No verified serving photo available.'}</p> : stateLabel ? <div className="viewer-state-label">{stateLabel}</div> : null}
      </div>
      {photo ? <ReferencePhoto key={drink.id} reference={reference} drinkId={drink.id} /> : null}
    </div>
  </div>;
}
