"""CPU-only checks of immutable recorded performance evidence; no browser work."""
import hashlib
import json
import math
from pathlib import Path
from statistics import median

ROOT = Path(__file__).resolve().parents[1]
BASE = ROOT / 'qa/performance-results'
output = {'scope': 'Independent CPU consistency review; no new timing samples', 'runs': []}
for label in ['demand-v0151-continuous', 'demand-v0151-gpu-timing']:
    path = BASE / label / 'production-measurement.json'
    data = json.loads(path.read_text())
    run = {'file': str(path.relative_to(ROOT)), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(), 'phases': []}
    for case in data['cases']:
        for phase in case['phases']:
            checked = {'name': phase['name'], 'durationMs': phase['durationMs'], 'viewers': {}}
            for drink, view in phase['viewerRendering'].items():
                events = view['postDrawEvents']
                assert view['end'] - view['start'] == view['completedFrames'] == len(events)
                assert all(b['frame'] == a['frame'] + 1 and b['at'] >= a['at'] for a, b in zip(events, events[1:]))
                assert math.isclose(view['completedFramesPerSecond'], len(events) * 1000 / phase['durationMs'], abs_tol=1e-12)
                result = {'draws': len(events), 'drawsPerSecond': view['completedFramesPerSecond'], 'counterAndEventSequenceAgree': True}
                queries = (phase.get('gpuDraws') or {}).get(drink, [])
                if queries:
                    assert [q['frame'] for q in queries] == [e['frame'] for e in events]
                    assert all(q['status'] == 'available' and math.isfinite(q['gpuElapsedMs']) and q['gpuElapsedMs'] >= 0 for q in queries)
                    result.update(queryCount=len(queries), gpuElapsedMedianMs=median(q['gpuElapsedMs'] for q in queries), cpuSpanMedianMs=median(q['cpuSubmissionSpanMs'] for q in queries), drawCalls=sorted(set(q['drawCalls'] for q in queries)))
                checked['viewers'][drink] = result
            if phase['name'] == 'continuous-handler-orbit':
                input_ = phase['inputs'][0]
                checked['input'] = input_
                checked['serializedSnapshotAngleMinusPostWaitEndpoint'] = {drink: value['camera']['azimuth'] - input_['cameraEnd'] for drink, value in phase['app'].items()}
            timing = phase.get('gpuTiming')
            if timing:
                assert not timing['failures'] and timing['pending'] == 0
                assert all(not c['disjointEvents'] and not c['contextLost'] for c in timing['contexts'])
            run['phases'].append(checked)
    assert data['sourcesUnchanged']
    output['runs'].append(run)
manifest = json.loads((BASE / 'demand-v0151-gpu-timing/instrumentation-archive.json').read_text())
for entry in manifest:
    raw = (ROOT / entry['archived']).read_bytes()
    assert len(raw) == entry['bytes'] and hashlib.sha256(raw).hexdigest() == entry['sha256']
output['timerInstrumentationHashesVerified'] = manifest
out = ROOT / 'qa/evidence/performance-independent-consistency.json'
out.write_text(json.dumps(output, indent=2) + '\n')
print(f'PASS: counters, contiguous events, rates, query frame identities, statuses and archived timer hashes; wrote {out.relative_to(ROOT)}')
