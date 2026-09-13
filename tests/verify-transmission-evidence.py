"""Independent CPU decoding and event accounting; no GPU used."""
from pathlib import Path
import json,hashlib,collections
from PIL import Image,ImageChops
root=Path(__file__).resolve().parents[1]
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
base=root/'qa/performance-results/transmission-parity'
before=json.loads((base/'before/captures.json').read_text());after=json.loads((base/'after/captures.json').read_text())
assert before['dpr']==after['dpr']==2 and before['viewport']==after['viewport']
assert not before['errors'] and not after['errors']
old={(c['name'],c['id']):c for c in before['cases']};pairs=[]
for c in after['cases']:
 a=old[(c['name'],c['id'])];p=base/'before'/a['filename'];q=base/'after'/c['filename']
 assert sha(p)==a['sha256'] and sha(q)==c['sha256']
 im=Image.open(p).convert('RGBA');jm=Image.open(q).convert('RGBA');assert im.size==jm.size
 # Compare bytes directly; RGBA getbbox alone can miss RGB differences when alpha difference is zero.
 assert im.tobytes()==jm.tobytes()
 assert all(a['state'][key]==c['state'][key] for key in ['e','camera','parts','stage'])
 pairs.append({'name':c['name'],'id':c['id'],'size':im.size,'rgbaBytesExact':True,'pngBytesExact':p.read_bytes()==q.read_bytes(),'stateExact':True,'beforeSha256':sha(p),'afterSha256':sha(q)})
assert len(pairs)==14
probes={}
for name,expected in [('transmission-allocation-probe',4),('transmission-allocation-after',0)]:
 path=root/'qa/performance-results'/name/'report.json';j=json.loads(path.read_text());assert not j['errors'] and j['sourcesUnchanged']
 frames={}
 for sample in j['samples']:
  for event in sample['events']:frames.setdefault(event['afterFrame'],[]).append(event)
 rows=[]
 for frame,events in sorted(frames.items()):
  counts=collections.Counter(e['name'] for e in events)
  assert counts['createFramebuffer']==counts['deleteFramebuffer']==expected
  assert counts['drawElements']==32
  viewports=sorted({tuple(e['viewport']) for e in events if e['name']=='drawElements'})
  assert viewports==[(0,0,1270,1600),(0,0,1271,1600)]
  rows.append({'frameFollowing':frame,'counts':dict(counts),'drawViewports':viewports})
 probes[name]={'sha256':sha(path),'layout':j['layout'],'frames':rows,'sources':j['sources']}
assert probes['transmission-allocation-probe']['layout']==probes['transmission-allocation-after']['layout']
current=root/'src/scenes/Viewer.tsx';expected=next(x['sha256'] for x in probes['transmission-allocation-after']['sources'] if x['path']=='src/scenes/Viewer.tsx')
assert sha(current)==expected
archive=root/'qa/baselines/transmission-before'
manifest=json.loads((archive/'manifest.json').read_text())
for entry in manifest['files']:
    path=archive/entry['path'];assert path.stat().st_size==entry['bytes'] and sha(path)==entry['sha256']
assert sha(archive/'source/Viewer.tsx')==next(x['sha256'] for x in probes['transmission-allocation-probe']['sources'] if x['path']=='src/scenes/Viewer.tsx')
report={'baselineManifestVerifiedFiles':len(manifest['files']),'baselineViewerHashMatchesProbe':True,'scope':'Independent CPU verification of recorded pixels and actual GL events; no new browser run','pairs':pairs,'probes':probes,'currentViewerMatchesAfterProbe':True,'currentViewerSha256':sha(current),'limits':'Host screenshots may include border/CSS rounding pixels; their dimensions are not drawing-buffer dimensions. Initial probe sampling window contains2frames, accounted separately. No timing or fidelity acceptance is inferred.'}
out=root/'qa/evidence/transmission-camera-independent-evidence.json';out.write_text(json.dumps(report,indent=2)+'\n');print('PASS:14 RGBA/PNG byte-identical pairs; all state fields exact;4 old versus0 new creates/deletes per measured frame; viewports unchanged; current Viewer hash matches.')
