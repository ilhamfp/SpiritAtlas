"""Measure the saved camera's actual projected rim; do not save camera edits."""
import bpy,json,math,hashlib,numpy as np
from pathlib import Path
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view
P=Path(__file__).resolve().parents[1];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
source=P/'assets/blender/experiments/negroni-express-v012-true-contact-neutral-base.blend';source_sha=sha(source);bpy.ops.wm.open_mainfile(filepath=str(source));scene=bpy.context.scene;camera=scene.objects['Camera_photo'];original_matrix=camera.matrix_world.copy()
def rim_fit():
    points=[]
    for i in range(720):
        angle=i*math.tau/720;p=world_to_camera_view(scene,camera,Vector((math.cos(angle),math.sin(angle),1.8)));points.append((p.x*720,(1-p.y)*900))
    pts=np.array(points);origin=pts.mean(axis=0);normalized=(pts-origin)/100;x,y=normalized.T
    coefficients=np.linalg.lstsq(np.column_stack([x*x,x*y,y*y,x,y]),np.ones(len(x)),rcond=None)[0];a,b,c,d,e=coefficients;A=np.array([[a,b/2],[b/2,c]]);center=-.5*np.linalg.solve(A,np.array([d,e]));k=1+center@A@center;values,vectors=np.linalg.eigh(A);radii=np.sqrt(k/values)*100
    ratio=float(min(radii)/max(radii));residual=np.max(np.abs(np.column_stack([x*x,x*y,y*y,x,y])@coefficients-1))
    return {'majorDiameterPixels':float(2*max(radii)),'minorDiameterPixels':float(2*min(radii)),'minorOverMajor':ratio,'ellipseCenterPixels':list(center*100+origin),'normalizedConicResidualMax':float(residual),'orthographicRimAngleDegrees':math.degrees(math.asin(ratio))}
saved=rim_fit();horizontal=math.hypot(camera.location.x,camera.location.y);physical_angle=math.degrees(math.atan2(camera.location.z-1.8,horizontal))
native={'rimLeft':[246,231],'rimRight':[350,228],'rimBack':[297,197],'rimFront':[297,260]};major=math.dist(native['rimLeft'],native['rimRight']);minor=63;target=minor/major
intervals={str(error):{'ratioMin':max(0,(minor-2*error)/(major+2*error)),'ratioMax':min(1,(minor+2*error)/(major-2*error))} for error in [1,2,3,6]}
lo,hi=8.5,11
for _ in range(32):
    z=(lo+hi)/2;camera.location.z=z;camera.rotation_euler=(Vector((0,0,1))-camera.location).to_track_quat('-Z','Y').to_euler();bpy.context.view_layer.update();ratio=rim_fit()['minorOverMajor']
    if ratio<target:lo=z
    else:hi=z
proposal={'cameraPosition':list(camera.location),'target':[0,0,1],'lensUnchanged':camera.data.lens,'projectedRim':rim_fit(),'notSaved':True}
camera.matrix_world=original_matrix;bpy.context.view_layer.update();assert sha(source)==source_sha
report={'source':str(source.relative_to(P)),'sourceSha256':source_sha,'scriptSha256':sha(Path(__file__)),'savedCameraMatrix':[list(row) for row in original_matrix],'savedProjectedRim':saved,'savedPhysicalRimViewElevationDegrees':physical_angle,'orthographicMinorMajorAtSavedAngle':math.sin(math.radians(physical_angle)),'nativeLandmarks':native,'nativeMajorLength':major,'nativeMinorLength':minor,'nativeRatio':target,'nativeRatioOrthographicAngleDegrees':math.degrees(math.asin(target)),'projectedRatioGap':target-saved['minorOverMajor'],'equivalentNativeMinorPixelGap':(target-saved['minorOverMajor'])*major,'conservativeCoordinateErrorIntervalsPixels':intervals,'separateCameraOnlyProposal':proposal,'verdict':'The saved camera does not exactly match the fixed native rim ratio. Exact perspective projection is measured rather than assumed; cylinder azimuth/roll cannot freely correct axis ratio. Several-pixel landmark uncertainty could encompass the gap, but is not evidence that the current preset is matched. Lens distortion, serving identity and source uncertainties remain unmeasured. Camera edits were restored and never saved; geometry-control rendering must retain the current camera until a separate camera-only comparison is authorized.'}
out=P/'qa/evidence/blender/somma-photo-camera-projection-audit.json';out.write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
