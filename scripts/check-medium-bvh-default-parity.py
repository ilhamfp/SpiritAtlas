"""CPU source check for the unselected diagnostic path; no GPU behavior claim."""
import hashlib
import json
from pathlib import Path
import re

before_path = Path('qa/baselines/medium-bvh-before/bvh-wavefront-transport.glsl.ts')
current_path = Path('src/scenes/bvh-wavefront-transport.glsl.ts')
before, current = before_path.read_text(), current_path.read_text()
out, enabled, guarded = [], True, False
for line in current.splitlines():
    directive = line.strip()
    if directive == '#ifdef ATLAS_MEDIUM_BVH':
        assert not guarded, 'Unexpected nested conditional'
        enabled, guarded = False, True
    elif directive == '#else':
        assert guarded, 'Unexpected conditional'
        enabled = not enabled
    elif directive == '#endif':
        assert guarded, 'Unexpected conditional'
        enabled, guarded = True, False
    elif enabled:
        out.append(line)
assert not guarded, 'Unclosed conditional'
normalize = lambda text: re.sub(r'\s+', '', text)
assert normalize(before) == normalize('\n'.join(out)), 'Default source changed'
result = {
    'defaultTransportTokenParity': True,
    'beforeSource': str(before_path),
    'source': str(current_path),
    'beforeSha256': hashlib.sha256(before.encode()).hexdigest(),
    'currentSha256': hashlib.sha256(current.encode()).hexdigest(),
    'command': 'python3 scripts/check-medium-bvh-default-parity.py',
    'method': 'Remove only ATLAS_MEDIUM_BVH guarded branches with the flag undefined, then compare whitespace-free source to the archived pre-change copy. Exact transport token stream unchanged.',
}
Path('qa/evidence/medium-bvh-default-source-parity.json').write_text(json.dumps(result, indent=2)+'\n')
print(json.dumps(result, indent=2))
