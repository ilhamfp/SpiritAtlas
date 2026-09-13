"""Scientific direction plots; no reference photography is modified."""
import sys
sys.path.insert(0,'/tmp/bar-atlas-directional-plotting')
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
import json,math,hashlib,importlib.util
from pathlib import Path
P=Path(__file__).resolve().parents[1];sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
spec=importlib.util.spec_from_file_location('directional_world',P/'scripts/directional-world.py');module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
config_path=P/'assets/blender/experiments/somma-directional-world-v1.json';config=json.loads(config_path.read_text())
az=np.linspace(0,360,361);el=np.linspace(-15,90,106);field=np.array([[module.multiplier([math.cos(math.radians(e))*math.cos(math.radians(a)),math.cos(math.radians(e))*math.sin(math.radians(a)),math.sin(math.radians(e))],config) for a in az] for e in el])
fig,axs=plt.subplots(2,3,figsize=(16,8.3),sharex=True,sharey=True,layout='constrained');sources=[]
groups=[('lower_liquid','Lower body','#c84d25'),('glass_base','Glass base','#126846'),('exposed_ice','Exposed ice + internal band','#146d9f')]
for row,view in enumerate(['hero','photo']):
    path=P/f'qa/evidence/blender/v012-contact-{view}-directional-radiance.json';d=json.loads(path.read_text());sources.append({'path':str(path.relative_to(P)),'sha256':sha(path)})
    for col,(name,title,color) in enumerate(groups):
        ax=axs[row,col];im=ax.pcolormesh(az,el,field,cmap='Greys',vmin=1,vmax=4,shading='auto',alpha=.6,rasterized=True)
        cs=ax.contour(az,el,field,levels=[1.5,2,2.5,3,3.5],colors='#aaa28f',linewidths=.65);ax.clabel(cs,fmt='%g×',fontsize=7)
        names=[name] if col<2 else [name,'horizontal_band']
        labels=[]
        for index,key in enumerate(names):
            region=d['regions'][key];paths=np.array(region['environment']['rawEnvironmentPaths']);n=len(paths);total=region['sampleCount']
            if n:ax.scatter(paths[:,3]%360,paths[:,4],s=3,alpha=.22,c=color if index==0 else '#aa3d89',rasterized=True,label=f'{key.replace("_"," ")}: {n}/{total}')
            labels.append(f'{key.replace("_"," ")}: {n}/{total}')
        ax.set_title(view.title()+' · '+title,loc='left',fontsize=12,fontweight='semibold');ax.set_xlim(0,360);ax.set_ylim(-15,90);ax.set_xticks([0,90,150,205,270,360]);ax.set_yticks([0,15,30,45,60,90]);ax.grid(alpha=.12)
        ax.legend(loc='upper right',fontsize=7,framealpha=.92,markerscale=2)
        ax.axhline(0,color='#666666',lw=.7)
        if row==1:ax.set_xlabel('World azimuth (degrees)')
        if col==0:ax.set_ylabel('Environment elevation (degrees)')
fig.colorbar(im,ax=axs,label='Candidate environment radiance / baseline',shrink=.85,pad=.02)
fig.suptitle('One fixed broad source covers both camera direction families',fontsize=18,fontweight='semibold')
fig.supxlabel('Only valid environment-terminal geometric paths are shown; counts are not rendered radiance. All coaster-patch paths hit the coaster.\nThe same physical source applies to every ray type. Its unoccluded upward diffuse irradiance is 1.713× baseline, versus 4× for the uniform control.',fontsize=10)
out=P/'qa/evidence/pairs/somma-directional-world-cpu-directions.png';fig.savefig(out,dpi=160);plt.close(fig)
out.with_suffix('.json').write_text(json.dumps({'sources':sources,'configPath':str(config_path.relative_to(P)),'configSha256':sha(config_path),'outputSha256':sha(out),'scriptSha256':sha(Path(__file__)),'method':'Matplotlib scatter of all recorded valid environment-terminal directions plus analytic candidate contours. No source image manipulation. Plot range−15..90 degrees; raw full-sphere paths retained in JSON.'},indent=2));print(out)
