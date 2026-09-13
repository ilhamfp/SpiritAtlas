#!/usr/bin/env python3
"""Build traceable reference manifest/crops from the reviewed source-selection config."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, hashlib
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'references'
def sha(p): return hashlib.sha256(p.read_bytes()).hexdigest()
config=json.loads((OUT/'reference-config.json').read_text())
ingest=json.loads((OUT/'ingestion-metadata.json').read_text())
videoHash=ingest['video']['sha256']; photoHash=ingest['photo']['sha256']
frames=[]
for row in config['selections']:
    p=ROOT/row['path']; im=Image.open(p)
    sourceId=row.get('sourceId','video-original')
    item={**row,'sourceId':sourceId,'sourceSha256':videoHash if sourceId=='video-original' else photoHash,'frameSha256':sha(p),'nativeSize':list(im.size),'cropPath':f"references/crops/{row['id']}.png",'transform':'native resolution crop only; no color, exposure, sharpening or denoising changes'}
    item['frameIndex']=round(row['timeSeconds']*25) if row['timeSeconds'] is not None else None
    item['normalizedLandmarks']={k:[round(v[0]/im.width,6),round(v[1]/im.height,6)] for k,v in row.get('landmarks',{}).items()}
    im.crop(row['crop']).save(ROOT/item['cropPath'])
    item['cropSha256']=sha(ROOT/item['cropPath'])
    if row.get('landmarks'):
        annotated=im.convert('RGB'); draw=ImageDraw.Draw(annotated)
        for i,(key,(x,y)) in enumerate(row['landmarks'].items()):
            draw.ellipse([x-4,y-4,x+4,y+4],outline='#00ffc8',width=2)
            draw.text((x+7,y+4),key,fill='#00ffc8',stroke_width=1,stroke_fill='black')
        annotated.save(OUT/'crops'/f"{row['id']}-landmarks.png")
        item['landmarkOverlayPath']=f"references/crops/{row['id']}-landmarks.png"
    frames.append(item)
extra=[]
for row in config['extraCrops']:
    p=ROOT/row['source']; dest=OUT/'crops'/f"{row['id']}.png"
    Image.open(p).crop(row['crop']).save(dest)
    extra.append({**row,'path':str(dest.relative_to(ROOT)),'sourceFrameSha256':sha(p),'sha256':sha(dest),'transform':'native resolution crop only'})
inventory=[]
for folder in ['overview','selection']:
    for p in sorted((OUT/'frames'/folder).glob('t*.png')):
        t=float(p.stem[1:]); inventory.append({'path':str(p.relative_to(ROOT)),'timeSeconds':t,'frameIndex':round(t*25),'sourceSha256':videoHash,'sha256':sha(p),'crop':[0,0,720,1280],'role':'complete-duration-browse' if folder=='overview' else 'adaptive-selection-candidate','visibleComponents':'See contact sheet and curated selections for reviewed components.','occlusions':'Contains full native image including scene, people and subtitles where present.'})
manifest={'schemaVersion':1,'reviewDate':'2026-09-12','sources':[{'id':'video-original',**ingest['video'],'durationSeconds':149.324671,'videoDurationSeconds':149.24,'resolution':[720,1280],'fps':25,'videoCodec':'H.264 High','audioCodec':'HE-AAC stereo 44100Hz','originalPost':'https://www.instagram.com/p/DdLFBKQBUkU/'},{'id':'somma-photo-original',**ingest['photo'],'identity':'Visually matching Negroni Express serving type; see dossier for limits.'}], 'coverage':{'overviewSeconds':[0,149],'overviewIntervalSeconds':1,'denseIntervalSeconds':.2,'denseWindowsSeconds':ingest['extractor']['selection_windows_seconds'],'inspection':'All six complete-video contact sheets and eight dense contact sheets visually inspected; selected full-resolution stills and full-native photo/crops inspected. Audio transcription unavailable; timestamped on-screen caption evidence retained separately.'},'measurementMethod':config['measurementMethod'],'tools':{'ffmpeg':'7.1.1','ffprobe':'7.1.1','Pillow':'12.3.0'},'sourceConfig':{'path':'references/reference-config.json','sha256':sha(OUT/'reference-config.json')},'scripts':[{'path':str((ROOT/'scripts'/name).relative_to(ROOT)),'sha256':sha(ROOT/'scripts'/name)} for name in ['extract-references.py','build-reference-manifest.py']],'fixedValidationViews':frames,'detailCrops':extra,'contactSheets':[str(p.relative_to(ROOT)) for p in sorted((OUT/'contact-sheets').glob('*.jpg'))],'frameInventory':inventory}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f"Manifest written: {len(frames)} fixed views; {len(extra)} additional detail crops; {len(inventory)} lossless extracted frames")
