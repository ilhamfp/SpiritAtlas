"""Lay out unchanged native pixels for the controlled contact comparison."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json
P=Path(__file__).resolve().parents[1]
FONT='/System/Library/Fonts/Supplemental/Arial.ttf'
font=lambda size:ImageFont.truetype(FONT,size)
boards=[
 ('somma-contact-neutral-board','Somma · true-contact neutral illumination',[
  ('Air gap · zero absorption','qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-unified-zero.png'),
  ('Air gap · density 0.55','qa/evidence/blender/negroni-express-hero-v012-interfaces-neutral-unified-d055.png'),
  ('True contact · zero absorption','qa/evidence/blender/negroni-express-hero-v012-contact-neutral-d0.png'),
  ('True contact · density 0.55','qa/evidence/blender/negroni-express-hero-v012-contact-neutral-d0p55.png')],
  'All controls use one liquid volume shader. Camera, illumination and density pair are fixed; contact changes physical interfaces.'),
 ('somma-contact-source-hero-board','Somma · fixed source lighting, density 3.5',[
  ('Native video · 01:54.00','references/crops/somma-hero.png'),
  ('Unified shader · authored air gap','qa/evidence/blender/negroni-express-hero-v012-interfaces-source-unified-d35.png'),
  ('Unified shader · true contact','qa/evidence/blender/negroni-express-hero-v012-contact-source-d3p5.png')],
  'The base and side dark band decreases. Hard ice edges, horizontal bands and source-stage/garnish mismatches remain.'),
 ('somma-contact-white-coaster-hero-board','Somma · passive-white coaster isolation',[
  ('True contact · original coaster','qa/evidence/blender/negroni-express-hero-v012-contact-source-d3p5.png'),
  ('True contact · passive white','qa/evidence/blender/negroni-express-hero-v012-contact-source-d3p5-white-coaster.png')],
  'Only coaster Base Color changes. Internal band brightens; most of the lower body does not.'),
 ('somma-contact-stage-photo-board','Somma · photo controls, density and optical geometry fixed',[
  ('Native supplied photo','bar-somma-negroni-reference.jpg'),
  ('Contact · original coaster','qa/evidence/blender/negroni-express-photo-v012-contact-source-d3p5.png'),
  ('Contact · passive-white coaster','qa/evidence/blender/negroni-express-photo-v012-contact-source-d3p5-white-coaster.png'),
  ('White coaster · world strength ×4','qa/evidence/blender/negroni-express-photo-v012-contact-source-d3p5-white-coaster-world4.png')],
  'White coaster changes specific internal bands; broader world illumination brightens the lower body but makes the counter too pale.'),
 ('somma-directional-world-photo-board','Somma · one physically shared directional environment',[
  ('White coaster · original world','qa/evidence/blender/negroni-express-photo-v012-contact-source-d3p5-white-coaster.png'),
  ('White coaster · uniform world ×4','qa/evidence/blender/negroni-express-photo-v012-contact-source-d3p5-white-coaster-world4.png'),
  ('White coaster · directional region','qa/evidence/blender/negroni-express-photo-v012-contact-source-d3p5-white-coaster-directional-world-v1.png')],
  'Fixed geometry, density 3.5, camera, direct lights and materials. One inferred world region affects every ray type; source fidelity still fails.')]
for name,title,entries,note in boards:
    sizes=[Image.open(P/path).size for _,path in entries];panel=max(640,((max(x[0] for x in sizes)+63)//64)*64);height=max(594,max(x[1] for x in sizes))
    w=panel*len(entries);canvas=Image.new('RGB',(w,height+236),'#181c1a');draw=ImageDraw.Draw(canvas);records=[]
    draw.text((24,22),title,font=font(34),fill='#f1e6d2')
    for i,(label,path) in enumerate(entries):
        draw.text((22+panel*i,89),label,font=font(24),fill='#c9b28b')
        source=P/path;image=Image.open(source).convert('RGB');x=panel*i+(panel-image.width)//2;y=130+(height-image.height)//2
        assert image.width<=panel and image.height<=height
        canvas.paste(image,(x,y));records.append(dict(path=path,sha256=hashlib.sha256(source.read_bytes()).hexdigest(),nativeSize=list(image.size),scale=1,placement=[x,y]))
    draw.text((24,height+152),note,font=font(21),fill='#bbc0b5')
    draw.text((24,height+193),'Native 1:1 pixel placement; no retouching or registration. Optical experiment only; photographic fidelity remains incomplete.',font=font(21),fill='#bbc0b5')
    out=P/f'qa/evidence/pairs/{name}.jpg';canvas.save(out,quality=96,subsampling=0)
    out.with_suffix('.json').write_text(json.dumps(dict(method='Unchanged source pixel placement at scale1. JPEG composition only; originals preserved. No warp, color adjustment, sharpening or synthesis.',placements=records,sha256=hashlib.sha256(out.read_bytes()).hexdigest(),scriptSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest()),indent=2));print(out)
