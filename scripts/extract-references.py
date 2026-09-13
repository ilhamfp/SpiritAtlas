#!/usr/bin/env python3
"""Reproduce lossless reference frames and annotated browse sheets; originals stay untouched.

Requires ffmpeg, ffprobe and Pillow. Run from any working directory:
  python3 scripts/extract-references.py
Exact selections are frame-index based at the verified native 25 fps.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import subprocess, json, hashlib, math

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'references'
VIDEO = ROOT / 'negroni-bar-crawl.mp4'
PHOTO = ROOT / 'bar-somma-negroni-reference.jpg'
FPS = 25

def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()

def run(args):
    subprocess.run(args, check=True, stdout=subprocess.DEVNULL)

def sheets(paths, prefix, columns=5, rows=5, thumb=(180,320)):
    for start in range(0,len(paths),columns*rows):
        page=Image.new('RGB',(columns*thumb[0],rows*(thumb[1]+28)), '#141516')
        draw=ImageDraw.Draw(page)
        for k,path in enumerate(paths[start:start+columns*rows]):
            tile=Image.open(path).convert('RGB'); tile.thumbnail(thumb)
            x=(k%columns)*thumb[0]; y=(k//columns)*(thumb[1]+28)
            page.paste(tile,(x,y))
            draw.text((x+5,y+thumb[1]+6),path.stem,fill='white')
        page.save(OUT/'contact-sheets'/f'{prefix}-{start//(columns*rows)+1:02d}.jpg',quality=93)

for folder in ['frames/overview','frames/selection','contact-sheets','crops']:
    (OUT/folder).mkdir(parents=True,exist_ok=True)

probe=json.loads(subprocess.check_output(['ffprobe','-v','quiet','-show_format','-show_streams','-of','json',str(VIDEO)]))
(OUT/'video-metadata.json').write_text(json.dumps(probe,indent=2)+'\n')
run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(VIDEO),'-vf',r'select=not(mod(n\,25))','-vsync','0',str(OUT/'frames/overview/frame-%03d.png')])
for p in sorted((OUT/'frames/overview').glob('frame-*.png')):
    second=int(p.stem.split('-')[1])-1
    p.rename(p.with_name(f't{second:03d}.00.png'))
sheets(sorted((OUT/'frames/overview').glob('t*.png')),'complete-video')

# Dense 0.2 s windows around informative preparation/hero shots. Native frames remain lossless.
windows=[(37,40),(46,50),(72,77),(109,115),(134,141)]
for lo,hi in windows:
    paths=[]
    for idx in range(lo*FPS,hi*FPS+1,5):
        t=idx/FPS
        p=OUT/'frames/selection'/f't{t:06.2f}.png'
        if not p.exists():
            run(['ffmpeg','-hide_banner','-loglevel','error','-y','-ss',f'{t:.2f}','-i',str(VIDEO),'-frames:v','1',str(p)])
        paths.append(p)
    sheets(paths,f'detail-{lo:03d}-{hi:03d}')

# Fixed full-resolution crops selected through visual inspection; box is x0,y0,x1,y1.
crops={
    'somma-photo-foreground':(PHOTO,(229,152,358,326)),
    'somma-photo-background':(PHOTO,(68,135,191,271)),
    'somma-photo-pepper':(PHOTO,(252,158,349,241)),
}
for name,(source,box) in crops.items():
    Image.open(source).crop(box).save(OUT/'crops'/f'{name}.png')

metadata={'video':{'path':'./negroni-bar-crawl.mp4','sha256':sha(VIDEO),'bytes':VIDEO.stat().st_size},
          'photo':{'path':'./bar-somma-negroni-reference.jpg','sha256':sha(PHOTO),'bytes':PHOTO.stat().st_size,'format':Image.open(PHOTO).format,'size':list(Image.open(PHOTO).size)},
          'extractor':{'path':'scripts/extract-references.py','overview_interval_seconds':1,'selection_interval_seconds':.2,'selection_windows_seconds':windows,'source_frame_rate':25,'transforms':'Decode native-resolution RGB PNG; no resize, denoise, exposure, or sharpening. Browse contact sheets alone are downsampled.'}}
(OUT/'ingestion-metadata.json').write_text(json.dumps(metadata,indent=2)+'\n')
print(json.dumps(metadata,indent=2))
