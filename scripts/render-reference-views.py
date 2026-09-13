"""Render existing editable scenes without regenerating/exporting the runtime asset.
Blender --background assets/blender/<drink>.blend --python scripts/render-reference-views.py -- --drink <drink> --view hero --samples 256 --denoise
"""
import bpy,sys,argparse,json,hashlib,math
from pathlib import Path
from mathutils import Vector,Quaternion
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--drink',required=True);p.add_argument('--view',default='hero',choices=['hero','side','photo','product']);p.add_argument('--samples',type=int,default=512);p.add_argument('--denoise',action='store_true');p.add_argument('--crop',action='store_true');p.add_argument('--suffix',default='');p.add_argument('--isolate-garnish',action='store_true')
a=p.parse_args(sys.argv[sys.argv.index('--')+1:]);sc=bpy.context.scene;sc.cycles.samples=a.samples;sc.cycles.use_denoising=a.denoise
prefs=bpy.context.preferences.addons['cycles'].preferences
try:
 prefs.compute_device_type='METAL';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='METAL'
 if any(d.type=='METAL' for d in prefs.devices):sc.cycles.device='GPU'
except Exception:pass
cam=sc.objects.get('Camera_'+a.view) or sc.camera;sc.camera=cam;target=Vector((0,0,1.0))
if a.view=='photo':cam.location=(9,5,8.5);cam.data.lens=66
elif a.view=='side':cam.location=(-7.5,-7.5,1.8+math.hypot(7.5,7.5)*math.tan(math.radians(8.5)) if a.drink=='negroni-express' else 2.55);cam.data.lens=63
elif a.view=='product':cam.location=(3.2,-8.4,4.4);cam.data.lens=56
else:
 ratio={'bbf-negroni':.094,'ichigo-negroni':.061,'negroni-express':.307}[a.drink]
 height={'bbf-negroni':1.94,'ichigo-negroni':2.26,'negroni-express':1.8}[a.drink]
 cam.location=(.15,-10.5,height+math.hypot(.15,10.5)*math.tan(math.asin(ratio)));cam.data.lens=63
roll=math.atan2(17,300) if a.view=='hero' and a.drink=='negroni-express' else 0
cam.rotation_euler=((target-cam.location).to_track_quat('-Z','Y')@Quaternion((0,0,1),roll)).to_euler();cam.name='Camera_'+a.view
if a.isolate_garnish:
 for ob in sc.objects:
  if ob.type=='MESH' and ob.get('scenePartId') and ob.get('ingredientId')!='garnish':ob.hide_render=True
 if a.drink=='ichigo-negroni':cam.location=(1.75,-3.44,4.4);target=Vector((.25,.06,2.05));cam.data.lens=92
 elif a.drink=='bbf-negroni':cam.location=(1.40,-3.58,3.93);target=Vector((-.10,-.08,1.58));cam.data.lens=92
 else:cam.location=(.20,-4.8,3.8);target=Vector((-.25,-.20,2.08));cam.data.lens=42
 cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler()
if a.view=='photo':
 # Photograph's higher, cooler ambient exposure is separate from the video hero.
 sc.world.node_tree.nodes.get('Background').inputs[1].default_value=.75
 for light in [o for o in sc.objects if o.type=='LIGHT']:
  light.data.color=tuple(.7+.3*c for c in light.data.color)
 if a.drink=='negroni-express':
  material=bpy.data.materials.get('Counter warm veined stone')
  if material:
   tex=material.node_tree.nodes.get('ReferenceCounterTexture')
   if tex:tex.image=bpy.data.images.load(str(P/'assets/source-textures/somma-counter-photo-crop.png'),check_existing=True)
sc.render.resolution_x=720;sc.render.resolution_y=900;sc.render.resolution_percentage=100
if a.crop:
 sc.render.use_border=True;sc.render.use_crop_to_border=True;sc.render.border_min_x=.08;sc.render.border_max_x=.90;sc.render.border_min_y=.18;sc.render.border_max_y=.84
out=P/'qa/evidence/blender'/f'{a.drink}-{a.view}{a.suffix}.png';sc.render.filepath=str(out)
metadata={'sourceBlend':bpy.data.filepath,'sourceBlendSha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'camera':{'position':list(cam.location),'target':list(target),'lens':cam.data.lens,'rotationEuler':list(cam.rotation_euler)},'render':{'samples':a.samples,'denoise':a.denoise,'crop':a.crop,'isolateGarnishDiagnostic':a.isolate_garnish,'baseResolution':[720,900]},'view':a.view,'output':str(out.relative_to(P))}
out.with_suffix('.render.json').write_text(json.dumps(metadata,indent=2))
bpy.ops.render.render(write_still=True)
