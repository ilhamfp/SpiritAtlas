"""Compose native and controlled renders at1:1 pixels, with no drink retouching."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json
P=Path(__file__).resolve().parents[1]
font='/System/Library/Fonts/Supplemental/Arial.ttf'
entries=[('Native Somma · 01:54.00','references/crops/somma-hero.png'),('Source light · density0.55¹','qa/evidence/blender/negroni-express-hero-v012-interfaces-red-d055.png'),('Neutral emission · density0','qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-zero.png'),('Neutral emission · density0.55','qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-d055.png')]
canvas=Image.new('RGB',(2560,850),'#181c1a');draw=ImageDraw.Draw(canvas);records=[]
draw.text((30,22),'Somma · incident-radiance isolation',font=ImageFont.truetype(font,35),fill='#f1e6d2')
for i,(title,path) in enumerate(entries):
    draw.text((22+i*640,88),title,font=ImageFont.truetype(font,24),fill='#c9b28b')
    image=Image.open(P/path).convert('RGB');x=i*640+(640-image.width)//2;y=134+(594-image.height)//2
    canvas.paste(image,(x,y));records.append(dict(path=path,sha256=hashlib.sha256((P/path).read_bytes()).hexdigest(),scale=1,placement=[x,y]))
draw.text((30,750),'Native pixels unchanged. White-world/floor controls deliberately replace source illumination; they do not establish fidelity.',font=ImageFont.truetype(font,24),fill='#b7bbae')
draw.text((30,796),'¹ Historical source-light control slightly whitened exposed ice via an unused shared material slot; neutral pair preserves original ice.',font=ImageFont.truetype(font,23),fill='#b7bbae')
out=P/'qa/evidence/pairs/somma-neutral-emission-board.jpg';canvas.save(out,quality=96,subsampling=0)
out.with_suffix('.json').write_text(json.dumps(dict(method='Unretouched1:1 native pixel placement only. No color correction, blur, warping or crop changes.',placements=records,verdict='Optical diagnostic only; photographic fidelity remains incomplete.'),indent=2));print(out)
