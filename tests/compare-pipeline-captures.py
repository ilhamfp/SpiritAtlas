"""Compare state-matched live viewer captures, without resizing measurement pixels."""
import json
from pathlib import Path
import sys
from PIL import Image, ImageChops, ImageDraw

root = Path(sys.argv[1] if len(sys.argv) > 1 else 'qa/performance-results/pipeline-v0091')
report = json.loads((root / 'production-measurement.json').read_text())
rows = []
for baseline in report['cases']:
    if baseline['pipeline'] != 'baseline':
        continue
    optimized = next(case for case in report['cases'] if case['pipeline'] == 'optimized' and case['mode'] == baseline['mode'] and case['environment']['dpr'] == baseline['environment']['dpr'])
    for before in baseline['captures']:
        after = next(capture for capture in optimized['captures'] if capture['expansion'] == before['expansion'] and capture['drinkId'] == before['drinkId'])
        a = Image.open(root / before['filename']).convert('RGB')
        b = Image.open(root / after['filename']).convert('RGB')
        assert a.size == b.size, (a.size, b.size)
        difference = ImageChops.difference(a, b)
        histogram = difference.histogram()
        counts = [sum(histogram[value::256]) for value in range(256)]
        pixel_values = list(difference.get_flattened_data())
        pixels = a.width * a.height
        rows.append({
            'mode': baseline['mode'], 'drinkId': before['drinkId'], 'e': before['expansion'], 'size': a.size,
            'maxChannelDifference': max(value for value, count in enumerate(counts) if count),
            'meanAbsoluteChannelDifference': sum(value * count for value, count in enumerate(counts)) / (pixels * 3),
            'changedPixels': sum(max(value) > 0 for value in pixel_values),
            'over1Pixels': sum(max(value) > 1 for value in pixel_values),
            'over5Pixels': sum(max(value) > 5 for value in pixel_values), 'totalPixels': pixels,
            'cameraEqual': before['state']['camera'] == after['state']['camera'],
            'partsEqual': before['state']['parts'] == after['state']['parts'],
            'eEqual': before['state']['e'] == after['state']['e'],
        })
        width = 420
        height = round(a.height * width / a.width)
        panel = Image.new('RGB', (width * 3, height + 38), '#20201d')
        draw = ImageDraw.Draw(panel)
        for index, (image, label) in enumerate([(a, 'Baseline'), (b, 'Optimized'), (difference.point(lambda value: min(255, value * 12)), 'Difference x12')]):
            panel.paste(image.resize((width, height)), (index * width, 38))
            draw.text((index * width + 8, 12), f'{label} · {before["drinkId"]} · e={before["expansion"]}', fill='white')
        panel.save(root / f'paired-{baseline["mode"]}-e{before["expansion"]}-{before["drinkId"]}.jpg', quality=92)
(root / 'pixel-comparison.json').write_text(json.dumps(rows, indent=2) + '\n')
print(json.dumps(rows, indent=2))
