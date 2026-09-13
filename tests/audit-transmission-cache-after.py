"""CPU audit of the recorded post-fix run and nominal native-target storage."""
from pathlib import Path
import json,hashlib,math,statistics
root=Path(__file__).resolve().parents[1]
base=root/'qa/performance-results/transmission-cache-after'
raw=base/'production-measurement.json';data=json.loads(raw.read_text())
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
manifest=json.loads((base/'instrumentation-archive.json').read_text())
for entry in manifest:
 p=root/entry['archived'];assert sha(p)==entry['sha256'] and p.stat().st_size==entry['bytes']
assert data['instrumentation']['splitFramebuffers'] is False
assert not data['cases'][0]['errors']
phases=[];total=0
for phase in data['cases'][0]['phases']:
 row={'name':phase['name'],'durationMs':phase['durationMs'],'viewers':{}}
 for id,view in phase['viewerRendering'].items():
  events=view['postDrawEvents'];queries=(phase.get('gpuDraws') or {}).get(id,[])
  assert len(events)==view['end']-view['start']==view['completedFrames']==len(queries)
  assert all(b['frame']==a['frame']+1 and b['at']>=a['at'] for a,b in zip(events,events[1:]))
  assert [q['frame'] for q in queries]==[e['frame'] for e in events]
  assert all(q['status']=='available' and math.isfinite(q['gpuElapsedMs']) and q['gpuElapsedMs']>=0 for q in queries)
  rate=len(events)*1000/phase['durationMs'];assert math.isclose(rate,view['completedFramesPerSecond'],abs_tol=1e-12)
  total+=len(queries)
  row['viewers'][id]={'draws':len(events),'drawsPerSecond':rate,'queryCount':len(queries),'gpuMedianMs':statistics.median(q['gpuElapsedMs'] for q in queries) if queries else None,'cpuSubmissionMedianMs':statistics.median(q['cpuSubmissionSpanMs'] for q in queries) if queries else None}
 timing=phase['gpuTiming'];assert not timing['failures'] and timing['pending']==0 and all(not s['disjointEvents'] and not s['contextLost'] for s in timing['contexts'])
 if phase['name']=='continuous-handler-orbit':
  input_=phase['inputs'][0];endpoint=input_['endpointObservedBeforePhaseEnd'];subject='bbf-negroni';view=phase['viewerRendering'][subject]
  assert endpoint['azimuth']==input_['cameraStart']+input_['requestedRadians']==input_['cameraEnd']
  assert endpoint['renderedFrame']==view['end']==view['postDrawEvents'][-1]['frame']
  assert view['postDrawEvents'][-1]['at']<=endpoint['observedAt']
  row['endpoint']=endpoint;row['endpointQueryFrameObserved']=True
 phases.append(row)
assert total==726 and data['sourcesUnchanged']
for entry in data['sources']:assert sha(root/entry['path'])==entry['sha256']
old=json.loads((root/'qa/performance-results/demand-v0151-gpu-timing/production-measurement.json').read_text())
prior={x['path']:x for x in old['sources']}
sourceDiff=[x['path'] for x in data['sources'] if x['sha256']!=prior[x['path']]['sha256']]
assert sourceDiff==['src/scenes/Viewer.tsx']
def capacity(w,h,depthBytes):
 levels=[];x,y=w,h
 while True:
  levels.append([x,y])
  if x==y==1:break
  x,y=max(1,x//2),max(1,y//2)
 colorMipBytes=sum(x*y*8 for x,y in levels)
 components={'rgba16fMipChain':colorMipBytes,'rgba16fMsaa4':w*h*8*4,'depthMsaa4':w*h*depthBytes*4,'depthSingleSample':w*h*depthBytes}
 n=sum(components.values());return {'width':w,'height':h,'nominalDepthBytesPerSample':depthBytes,'components':components,'bytes':n,'MiB':n/1048576,'mipLevels':levels}
single=[capacity(1271,1600,d) for d in [3,4]]
comparison=[]
for c in data['cases'][0]['environment']['canvases']:
 # Explicit custom buffers use ceil versus recorded floor; fractional CSS is not serialized here.
 comparison.append({'recordedDisplay':[c['bufferWidth'],c['bufferHeight']],'customWidthPossible':[c['bufferWidth'],c['bufferWidth']+1],'nominalLower':capacity(c['bufferWidth'],c['bufferHeight'],3),'nominalUpper':capacity(c['bufferWidth']+1,c['bufferHeight'],4)})
memSources=['node_modules/three/src/core/RenderTarget.js','node_modules/three/src/renderers/WebGLRenderer.js','node_modules/three/src/renderers/webgl/WebGLTextures.js']
out={'rawSha256':sha(raw),'instrumentationVerified':manifest,'phases':phases,'availableQueries':total,'sourceDiffFromPrior':sourceDiff,'allCurrentHashesMatch':True,'memory':{'assumptions':'HalfFloat native color target(RGBA16F),4MSAA as recorded by allocation probe, DEPTH_COMPONENT24 with logical3bytes or common4bytepacking; full mip chain. No stencil. Single-sample depth is allocated despite resolveDepthBuffer=false. Actual driver storage can differ. Comparison widths bracket ceil because only floor drawing-buffer size is recorded; its600px CSS height produces1200 exact pixels.','singleExtraCapture':single,'comparisonExtraCaptures':comparison,'comparisonTotalMiBRange':[sum(x['nominalLower']['MiB'] for x in comparison),sum(x['nominalUpper']['MiB'] for x in comparison)],'sourceHashes':{p:sha(root/p) for p in memSources}},'limits':'GPU intervals from3contexts can overlap/interleave. Endpoint-before-phase-end is established by archived harness sequencing plus endpoint query frame, not physical presentation. Memory is stable logical resource capacity, not peak/process GPU memory or net actual saving.'}
(root/'qa/evidence/transmission-cache-after-independent.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'queryCount':total,'phases':phases,'singleExtraMiB':[x['MiB'] for x in single],'comparisonExtraMiB':[ [x['nominalLower']['MiB'],x['nominalUpper']['MiB']] for x in comparison],'comparisonTotalMiBRange':out['memory']['comparisonTotalMiBRange']},indent=2))
