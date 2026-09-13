"""Render an existing editable source through a complete horizontal orbit."""
import argparse,bpy,hashlib,json,math,sys,time
from pathlib import Path
from mathutils import Vector
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--drink',required=True);p.add_argument('--samples',type=int,default=512);p.add_argument('--frames',type=int,default=72);p.add_argument('--denoise',action='store_true');a=p.parse_args(sys.argv[sys.argv.index('--')+1:])
if a.frames<2 or a.samples<1:p.error('Use at least2 frames and positive samples.')
sc=bpy.context.scene;sc.cycles.samples=a.samples;sc.cycles.use_denoising=a.denoise
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='METAL';prefs.get_devices()
 for device in prefs.devices:device.use=device.type=='METAL'
 if any(device.type=='METAL' for device in prefs.devices):sc.cycles.device='GPU'
except Exception:pass
sc.render.resolution_x=720;sc.render.resolution_y=900;sc.render.resolution_percentage=100;sc.render.use_border=False;sc.render.use_crop_to_border=False
cam=sc.camera;center=Vector((0,0,1.0));distance=math.hypot(cam.location.x,cam.location.y);height=cam.location.z;phase=math.atan2(cam.location.x,-cam.location.y)
roll=(center-cam.location).to_track_quat('-Z','Y').inverted()@cam.rotation_euler.to_quaternion()
record={'sourceBlend':bpy.data.filepath,'sourceBlendSha256':hashlib.sha256(Path(bpy.data.filepath).read_bytes()).hexdigest(),'scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'samples':a.samples,'denoise':a.denoise,'frameCount':a.frames,'resolution':[720,900],'frames':[]}
for frame in range(a.frames):
 theta=phase+math.tau*frame/a.frames;cam.location=(distance*math.sin(theta),-distance*math.cos(theta),height);cam.rotation_euler=((center-cam.location).to_track_quat('-Z','Y')@roll).to_euler()
 out=P/'qa/evidence/blender'/f'{a.drink}-orbit-{frame:03d}.png';sc.render.filepath=str(out);started=time.monotonic();bpy.ops.render.render(write_still=True)
 record['frames'].append({'frame':frame,'camera':list(cam.location),'elapsedSeconds':time.monotonic()-started,'output':str(out.relative_to(P)),'sha256':hashlib.sha256(out.read_bytes()).hexdigest()})
 (P/'qa/evidence/blender'/f'{a.drink}-turntable.render.json').write_text(json.dumps(record,indent=2))
