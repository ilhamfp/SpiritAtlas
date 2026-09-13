#!/usr/bin/env python3
"""Inspect recorded interaction sequences; sheets are temporal aids, not fidelity crops."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import hashlib, io, json, subprocess

P = Path(__file__).resolve().parents[1]
OUT = P / 'qa/evidence/motion-review'
OUT.mkdir(parents=True, exist_ok=True)
font = ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf', 21)
for drink in ('bbf-negroni', 'ichigo-negroni', 'negroni-express'):
    video = P / 'qa/interaction-artifacts/evidence' / (drink + '-expansion-moves-real-components-and-restores-their-original-positions') / 'interaction-recording.webm'
    metadata = json.loads(subprocess.check_output(['/opt/homebrew/bin/ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'json', str(video)]))
    duration = float(metadata['format']['duration'])
    times = [round(duration * (i + .3) / 12, 3) for i in range(12)]
    board = Image.new('RGB', (1600, 3552), '#191b18')
    d = ImageDraw.Draw(board)
    for i, timestamp in enumerate(times):
        png = subprocess.check_output(['/opt/homebrew/bin/ffmpeg', '-v', 'error', '-ss', str(timestamp), '-i', str(video), '-frames:v', '1', '-f', 'image2pipe', '-vcodec', 'png', '-'])
        im = Image.open(io.BytesIO(png)).convert('RGB')
        native = OUT / f'{drink}-t{timestamp:06.3f}.png'
        im.save(native)
        x, y = (i % 2) * 800, (i // 2) * 592
        d.text((x + 12, y + 6), f'{drink}  {timestamp:.3f}s', fill='#eadcc4', font=font)
        board.paste(im, (x, y + 32))
    dest = OUT / (drink + '-recorded-motion-sheet.jpg')
    board.save(dest, quality=95, subsampling=0)
    dest.with_suffix('.json').write_text(json.dumps({'source': str(video.relative_to(P)), 'sourceSha256': hashlib.sha256(video.read_bytes()).hexdigest(), 'durationSeconds': duration, 'timesSeconds': times, 'transform': '12 uniformly spaced exact decoded frames at native recorded resolution, labels outside content. No image resizing or retouching.', 'purpose': 'Temporal inspection only. Recording is 800px wide; separate full-resolution browser PNGs and source comparisons govern fidelity.'}, indent=2))
    print(dest)
