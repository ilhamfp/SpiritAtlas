#!/usr/bin/env python3
"""Compose reviewed reference crops without retouching their source content."""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'qa/evidence'; OUT.mkdir(parents=True,exist_ok=True)
F=Path('/System/Library/Fonts/Supplemental')
def font(name,size):
    try: return ImageFont.truetype(str(F/name),size)
    except OSError: return ImageFont.load_default(size=size)
serif=font('Georgia.ttf',54); sub=font('Georgia.ttf',35); sans=font('Arial.ttf',24); small=font('Arial.ttf',21); label=font('Arial Bold.ttf',22)
W,H=2280,1690
im=Image.new('RGB',(W,H),'#171b1a'); d=ImageDraw.Draw(im)
cream='#f2e8d6'; muted='#a6aaa0'; gold='#c4a77a'; line='#444943'
d.text((58,40),'THE FILMED DRINKS',font=label,fill=gold)
d.text((58,85),'SpiritAtlas',font=serif,fill=cream)
d.text((1440,100),'Fixed visual north stars · supplied video',font=sans,fill=muted)
d.line((58,174,W-58,174),fill=line,width=2)
cols=[
('01','BAR BON FUNK','BBF Negroni','bbf-hero','00:48.60 · finished serving','bbf-close','02:20.80 · glass, orange & heavy base','Dark garnet · bowed orange rind · substantial base'),
('02','MOGA','Ichigo Negroni','ichigo-hero','01:16.80 · finished serving','ichigo-flower','01:14.20 · layered flower & red garnish','Clear amber · dense yellow petals · red round garnish'),
('03','BAR SOMMA','Negroni Express','somma-hero','01:54.00 · finished serving','somma-side','01:49.00 · alternate angle & exposed ice','Red-orange · wrinkled shishito · long retained stem')]
for col,(num,venue,drink,hero,ht,support,st,note) in enumerate(cols):
    x=58+col*744
    if col: d.line((x-26,205,x-26,1570),fill=line,width=1)
    d.text((x,206),num+' / '+venue,font=label,fill=gold)
    d.text((x,245),drink,font=sub,fill=cream)
    for key,y,t in [(hero,310,ht),(support,970,st)]:
        source=Image.open(ROOT/'references/crops'/f'{key}.png').convert('RGB')
        box=(686,565)
        scale=min(box[0]/source.width,box[1]/source.height)
        shown=source.resize((round(source.width*scale),round(source.height*scale)),Image.Resampling.LANCZOS)
        px=x+(box[0]-shown.width)//2; py=y+(box[1]-shown.height)//2
        im.paste(shown,(px,py))
        d.text((x,y+580),t,font=sans,fill=cream)
        d.text((x,y+616),f'Native source: 720 × 1280  /  {key}',font=small,fill=muted)
d.line((58,1620,W-58,1620),fill=line,width=1)
d.text((58,1643),'Unretouched source crops. Layout resizing only. Full source frames, landmarks and separate Somma photo match: references/north-star.html',font=small,fill=muted)
im.save(OUT/'north-star-reference-board.jpg',quality=96,subsampling=0)
print(OUT/'north-star-reference-board.jpg')
