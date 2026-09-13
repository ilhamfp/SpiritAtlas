"""Measure normal atlas regeneration precision without modifying either image."""
from pathlib import Path
import hashlib,json
from PIL import Image,ImageChops,ImageStat
P=Path(__file__).resolve().parents[1]
rows=[]
for drink in ['bbf-negroni','ichigo-negroni','negroni-express']:
    paths=[P/'assets/blender/candidates'/tag/f'{drink}-garnish-normal.png' for tag in ['v0151-baked','wrapper-repro-v0151']]
    images=[Image.open(path).convert('RGB') for path in paths]
    difference=ImageChops.difference(*images)
    rows.append(dict(drink=drink,files=[dict(path=str(path.relative_to(P)),sha256=hashlib.sha256(path.read_bytes()).hexdigest()) for path in paths],size=images[0].size,identicalPixels=difference.getbbox() is None,changedPixelBoundingBox=difference.getbbox(),changedPixels=sum(any(pixel) for pixel in difference.getdata()),channelExtrema=difference.getextrema(),meanAbsoluteDifference8bit=ImageStat.Stat(difference).mean))
out=P/'qa/evidence/wrapper-repro-v0151-normal-texture-precision.json'
out.write_text(json.dumps(dict(method='Exact decoded 8-bit RGB normal atlas comparison, no resizing, filtering or retouching.',results=rows),indent=2))
print(out)
