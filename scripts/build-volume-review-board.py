"""Compose unretouched controlled material comparison at native render scale."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json
P=Path(__file__).resolve().parents[1];font='/System/Library/Fonts/Supplemental/Arial.ttf'
def f(s):return ImageFont.truetype(font,s)
entries=[('Native Somma · 01:54.00','references/crops/somma-hero.png'),('v0.12 · tinted surface','qa/evidence/blender/negroni-express-hero-v012.png'),('White surface · old volume','qa/evidence/blender/negroni-express-hero-v012-volume-only.png'),('White + red volume · density3.5','qa/evidence/blender/negroni-express-hero-v012-absorption-red-d35.png'),('White + red volume · density6','qa/evidence/blender/negroni-express-hero-v012-absorption-red-d6.png')]
canvas=Image.new('RGB',(3200,790),'#181c1a');d=ImageDraw.Draw(canvas);records=[]
d.text((30,22),'Somma · controlled absorption study',font=f(35),fill='#f1e6d2')
for i,(title,path) in enumerate(entries):
 d.text((22+i*640,88),title,font=f(24),fill='#c9b28b');im=Image.open(P/path).convert('RGB');x=i*640+(640-im.width)//2;y=134+(594-im.height)//2;canvas.paste(im,(x,y));records.append(dict(path=path,sha256=hashlib.sha256((P/path).read_bytes()).hexdigest(),scale=1,placement=[x,y]))
d.text((30,751),'Native image pixels composed without retouching. Same hero camera/light for four renders. All remain visually incomplete.',font=f(24),fill='#b7bbae')
out=P/'qa/evidence/pairs/somma-volume-absorption-board.jpg';canvas.save(out,quality=96,subsampling=0);out.with_suffix('.json').write_text(json.dumps(dict(method='1:1 pixel placement only; no source or render color adjustment, warping, blur or retouch.',placements=records,verdict='Incomplete. Red preservation improves; sharply patterned/dark nested ice remains.'),indent=2));print(out)
