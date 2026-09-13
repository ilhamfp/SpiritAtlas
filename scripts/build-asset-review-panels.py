#!/usr/bin/env python3
"""Native-scale source/render diagnostic pairs; no retouching or geometric warping."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import json,hashlib
P=Path(__file__).resolve().parents[1];out=P/'qa/evidence/pairs';out.mkdir(parents=True,exist_ok=True)
fonts=Path('/System/Library/Fonts/Supplemental')
def f(name,size):
 try:return ImageFont.truetype(str(fonts/name),size)
 except OSError:return ImageFont.load_default(size=size)
rows=[
 dict(drink='bbf-negroni',title='BBF Negroni',source='references/frames/selection/t048.60.png',crop=[175,505,520,842],sourceRim=[347,543],sourceDiameter=278,time='00:48.60',render='qa/evidence/blender/bbf-negroni-hero-v004.png',renderCrop=[112,137,488,514],renderRim=[303,171],renderDiameter=301,version='v0.4',anchorY=285),
 dict(drink='ichigo-negroni',title='Ichigo Negroni',source='references/frames/selection/t076.80.png',crop=[153,486,579,972],sourceRim=[367,529],sourceDiameter=343,time='01:16.80',render='qa/evidence/blender/ichigo-negroni-hero-v004.png',renderCrop=[115,80,490,506],renderRim=[303,118],renderDiameter=301,version='v0.4',anchorY=260),
 dict(drink='negroni-express',title='Negroni Express',source='references/frames/selection/t114.00.png',crop=[135,460,585,954],sourceRim=[370,586],sourceDiameter=300,time='01:54.00',render='qa/evidence/blender/negroni-express-hero-preview.png',renderCrop=[60,30,530,548],renderRim=[303,198],renderDiameter=290,version='v0.3',anchorY=340)]
base_rows=list(rows)
for revision in [7,8,10,11,12,14,15]:
 projection_path=P/f'qa/evidence/blender/v{revision:03d}-projected-landmarks.json'
 if not projection_path.exists():continue
 projections=json.loads(projection_path.read_text())
 for base in base_rows:
  path=f"qa/evidence/blender/{base['drink']}-hero-v{revision:03d}.png"
  if not (P/path).exists():continue
  bounds=projections[base['drink']]['rimBounds']
  rows.append({**base,'render':path,'renderCrop':([40,60,535,560] if base['drink']=='negroni-express' else [105,80,500,530]),'renderRim':[(bounds[0]+bounds[2])/2,(bounds[1]+bounds[3])/2],'renderDiameter':bounds[2]-bounds[0],'version':f'v0.{revision}','projectedLandmarks':str(projection_path.relative_to(P))})
for revision,rim,diam in [(7,[360,365],270),(8,[361,369],266),(10,[361,369],266),(11,[361,369],266),(12,[361,369],266)]:
 path=f'qa/evidence/blender/negroni-express-photo-v{revision:03d}.png'
 if (P/path).exists():rows.append(dict(drink='negroni-express',title='Negroni Express · separate photo',source='bar-somma-negroni-reference.jpg',crop=[232,150,359,326],sourceRim=[295,225],sourceDiameter=101,time='native photo · foreground glass',render=path,renderCrop=[150,190,551,690],renderRim=rim,renderDiameter=diam,version=f'v0.{revision}-photo',anchorY=450,canvasHeight=1020))
for row in rows:
 height=row.get('canvasHeight',900)
 canvas=Image.new('RGB',(1400,height),'#181c1a');d=ImageDraw.Draw(canvas)
 d.text((40,30),row['title']+' · reference / Blender comparison',font=f('Georgia.ttf',35),fill='#f2e8d6')
 d.text((40,85),'SOURCE '+row['time']+('' if 'photo' in row['version'] else ' — fixed native video crop'),font=f('Arial.ttf',20),fill='#c5ac83')
 d.text((740,85),'CANDIDATE '+row['version']+' — diagnostic, not accepted',font=f('Arial.ttf',20),fill='#c5ac83')
 d.line((700,120,700,height-105),fill='#465047',width=1)
 placements=[];layers=[]
 for side,(path,box,rim,diam) in enumerate([(row['source'],row['crop'],row['sourceRim'],row['sourceDiameter']),(row['render'],row['renderCrop'],row['renderRim'],row['renderDiameter'])]):
  original=Image.open(P/path).convert('RGB');im=original.crop(box);scale=350/diam
  im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
  x=350+700*side-round((rim[0]-box[0])*scale);y=row['anchorY']-round((rim[1]-box[1])*scale)
  canvas.paste(im,(x,y));placements.append(dict(path=path,sha256=hashlib.sha256((P/path).read_bytes()).hexdigest(),crop=box,scale=scale,placement=[x,y],manualRimAnchor=rim,measuredRimDiameter=diam))
  layer=Image.new('RGB',(650,height-250),'#181c1a');layer.paste(im,(x-700*side-25,y-120));layers.append(layer)
 d.line((40,height-88,1360,height-88),fill='#465047',width=1)
 d.text((40,height-68),'Rim diameter aligned to 350 px. Uniform scaling only; source never evaluated below native scale.',font=f('Arial.ttf',20),fill='#b2b6ac')
 d.text((40,height-38),'Camera and lighting are approximate. Source subtitles remain. Optical and garnish mismatches are unresolved.',font=f('Arial.ttf',19),fill='#b2b6ac')
 dest=out/f"{row['drink']}-{row['version'].replace('.','')}-reference-pair.jpg";canvas.save(dest,quality=96,subsampling=0)
 Image.blend(layers[0],layers[1],.5).save(out/f"{row['drink']}-{row['version'].replace('.','')}-overlay.png")
 dest.with_suffix('.json').write_text(json.dumps({**row,'output':str(dest.relative_to(P)),'placements':placements,'transforms':'Native source crop; uniform image scaling; translation aligns manually selected rim centers. No warping, blur, retouching or exposure modification.','verdict':'incomplete'},indent=2))
 print(dest)
