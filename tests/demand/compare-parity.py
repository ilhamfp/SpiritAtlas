"""Compare native viewer pixels and authored state; no resampling in metrics."""
import json
from pathlib import Path
from PIL import Image, ImageChops

root = Path('qa/demand-rendering')
before = json.loads((root / 'parity-before/captures.json').read_text())
after = json.loads((root / 'parity-after/captures.json').read_text())
old = Path('qa/interaction-artifacts/evidence-v0151-baked')
rows = []

def pose(state):
    return {key: state[key] for key in ('e', 'camera', 'stage')} | {'parts': [
        {key: part.get(key) for key in ('id', 'position', 'scale', 'visible', 'role', 'category', 'normalMap')}
        for part in state['parts']
    ]}

def compare(name, id, a_path, b_path, a_state, b_state):
    a, b = [Image.open(path).convert('RGB') for path in (a_path, b_path)]
    if a.size != b.size:
        raise ValueError(f'Native size mismatch {a_path}: {a.size} != {b.size}')
    diff = ImageChops.difference(a, b)
    hist = diff.histogram()
    counts = [sum(hist[value::256]) for value in range(256)]
    values = list(diff.get_flattened_data())
    pixels = a.width * a.height
    rows.append({'name': name, 'drinkId': id, 'before': str(a_path), 'after': str(b_path),
        'nativeSize': a.size, 'stateEqual': pose(a_state) == pose(b_state),
        'partsEqual': pose(a_state)['parts'] == pose(b_state)['parts'],
        'cameraEqual': a_state['camera'] == b_state['camera'], 'stageEqual': a_state['stage'] == b_state['stage'],
        'stageDeltas': {key: value - a_state['stage'][key] for key, value in b_state['stage'].items()},
        'maxChannelDifference': max(v for v, n in enumerate(counts) if n),
        'meanAbsoluteChannelDifference': sum(v * n for v, n in enumerate(counts)) / (pixels * 3),
        'changedPixels': sum(max(value) > 0 for value in values),
        'over1Pixels': sum(max(value) > 1 for value in values),
        'over5Pixels': sum(max(value) > 5 for value in values), 'totalPixels': pixels})
    if rows[-1]['over1Pixels']:
        diff.point(lambda value: min(255, value * 12)).save(root / f'parity-diff-{name}-{id}.png')

for entry in after['cases']:
    id = entry['id']
    if entry['name'].endswith('-assembled'):
        folder = old / f'stage-{id}-quiet-bar-preserves-assembled-six-recipe-categories-and-reassembly'
        a_path = folder / f'stage-assembled-{id}-native-viewer.png'
        a_state = json.loads((folder / 'stage-assembled-rendered-state.json').read_text())[id]
    else:
        match = next(c for c in before['cases'] if c['name'] == entry['name'] and c['id'] == id)
        a_path = root / 'parity-before' / match['filename']
        a_state = match['state']
    compare(entry['name'], id, a_path, root / 'parity-after' / entry['filename'], a_state, entry['state'])
(root / 'pixel-parity.json').write_text(json.dumps(rows, indent=2) + '\n')
print(json.dumps(rows, indent=2))
