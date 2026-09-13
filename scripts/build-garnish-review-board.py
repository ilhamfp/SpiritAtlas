"""Compose preserved source and successive native macro renders for qualitative review."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
import hashlib,json,argparse
p=argparse.ArgumentParser();p.add_argument("--revision",type=int,default=13);a=p.parse_args();rev=f"v{a.revision:03d}"
P=Path(__file__).resolve().parents[1];out=P/f'qa/evidence/pairs/garnish-v012-{rev}-board.jpg'
font='/System/Library/Fonts/Supplemental/Arial.ttf'
def f(s):return ImageFont.truetype(font,s)
canvas=Image.new('RGB',(2100,2360),'#181c1a');d=ImageDraw.Draw(canvas);rows=[]
d.text((30,22),f'Garnish detail · fixed source / prior geometry / v0.{a.revision} candidate',font=f(35),fill='#f1e6d2')
for column,title in enumerate(['Native source · supporting viewpoint','v0.12 garnish · v0.11 macro unchanged',f'v0.{a.revision} · unaccepted candidate']):d.text((30+700*column,82),title,font=f(24),fill='#c9b28b')
for index,(drink,title,source,notes) in enumerate([
    ('negroni-express','Somma — shishito','references/crops/somma-pepper-detail.png','Ribs clearer; too smooth globally. Fine irregular folds still missing.'),
    ('ichigo-negroni','MOGA — flower','references/crops/ichigo-petal-detail.png','Pointed leaves and exposed red gaps differ from dense blunt ribbons.'),
    ('bbf-negroni','Bon Funk — orange','references/crops/bbf-orange-detail.png','Radial highlight persists; physical ice intersection remains unresolved.')]):
    
    if a.revision==14:notes={'negroni-express':'Localized creases appear corrugated; terminal body still tapers too far.','ichigo-negroni':'Density improves; tips still read as leaves, with ordered overlapping tiers.','bbf-negroni':'Radial artifact removed; cap too regular and ice intersection still open.'}[drink]
    if a.revision==15:notes={'negroni-express':'Terminal width improves; body remains too smooth and slightly detached.','ichigo-negroni':'Rounded tips improve; organized spoon-like petals remain synthetic.','bbf-negroni':'Upper ice now clears rind; regular cap/highlights remain a mismatch.'}[drink]
    top=135+index*730;d.text((30,top),title,font=f(28),fill='#eee3cd')
    for column,path in enumerate([source,f'qa/evidence/blender/{drink}-hero-v011-garnish.png',f'qa/evidence/blender/{drink}-hero-{rev}-garnish.png']):
        im=Image.open(P/path).convert('RGB');scale=1 if column else min(2,640/im.width)
        if scale!=1:im=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
        x=column*700+(700-im.width)//2;y=top+48+(594-im.height)//2;canvas.paste(im,(x,y))
        rows.append(dict(drink=drink,path=path,sha256=hashlib.sha256((P/path).read_bytes()).hexdigest(),scale=scale,placement=[x,y],role='source' if column==0 else 'prior' if column==1 else 'candidate'))
    d.text((30,top+656),notes,font=f(24),fill='#c5c9bd');d.line((30,top+702,2070,top+702),fill='#465047')
d.text((30,2326),'No source pixels retouched. Source detail cameras differ; candidate/prior macros share camera. No fidelity pass.',font=f(22),fill='#b7bbae')
canvas.save(out,quality=96,subsampling=0);out.with_suffix('.json').write_text(json.dumps(dict(method='Native macro PNGs composed at 1:1 pixels; native source crops uniformly upscaled at most2x, never downsampled. No warping, blur, color changes or retouching.',placements=rows,verdict=f'v0.{a.revision} remains incomplete; no fidelity pass'),indent=2));print(out)
