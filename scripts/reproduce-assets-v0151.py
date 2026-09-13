"""Reproduce isolated v0.15.1 authored geometry and baked normal assets.

Run with Python or Blender --background --python this_file -- --drink all.
The default isolated output never overwrites the current production assets.
"""
import argparse,hashlib,json,subprocess,sys,time,shutil
try:
 import bpy
 DEFAULT_BLENDER=bpy.app.binary_path
except ImportError:DEFAULT_BLENDER=shutil.which("blender") or "/Applications/Blender.app/Contents/MacOS/Blender"
from pathlib import Path
P=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument('--drink',default='all',choices=['all','bbf-negroni','ichigo-negroni','negroni-express'])
p.add_argument('--output-tag',default='reproduce-v0151')
p.add_argument('--blender',default=DEFAULT_BLENDER)
p.add_argument('--render',action='store_true')
p.add_argument('--view',default='hero',choices=['hero','side','photo','product'])
p.add_argument('--samples',type=int,default=512)
p.add_argument('--denoise',action='store_true')
p.add_argument('--turntable',action='store_true')
p.add_argument('--frames',type=int,default=72)
a=p.parse_args(sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:])
if not a.output_tag or '/' in a.output_tag or '\\' in a.output_tag or a.output_tag in ['.','..']:
 p.error('Use one nonempty candidate directory name.')
drinks=['bbf-negroni','ichigo-negroni','negroni-express'] if a.drink=='all' else [a.drink]
raw_tag=a.output_tag+'-raw';log_dir=P/'qa/evidence/blender'/a.output_tag;log_dir.mkdir(parents=True,exist_ok=True)
sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
primary=[P/'assets/blender'/f'{d}.{ext}' for d in drinks for ext in ['blend','json']]+[P/'public/models'/f'{d}.glb' for d in drinks]
primary_before={str(path.relative_to(P)):sha(path) for path in primary if path.exists()}
record={'version':'0.15.1-baked','outputTag':a.output_tag,'primaryBefore':primary_before,'jobs':[],'outputs':{}}
def run(name,args):
 command=[a.blender,'--background','--python-exit-code','1']+args;start=time.time()
 with (log_dir/f'{name}.log').open('w') as log:
  result=subprocess.run(command,cwd=P,stdout=log,stderr=subprocess.STDOUT)
 record['jobs'].append({'name':name,'command':command,'exitCode':result.returncode,'elapsedSeconds':time.time()-start})
 (log_dir/'reproduction.json').write_text(json.dumps(record,indent=2))
 if result.returncode:raise RuntimeError(f'{name} failed; inspect {log_dir/name}.log')
run('author',['--python',str(P/'scripts/build-assets-v0151.py'),'--','--drink',a.drink,'--output-tag',raw_tag])
for drink in drinks:
 run(drink+'-bake',['--python',str(P/'scripts/bake-garnish-v0151.py'),'--','--drink',drink,'--source-tag',raw_tag,'--output-tag',a.output_tag,'--size','2048'])
 out=P/'assets/blender/candidates'/a.output_tag
 for path in [out/f'{drink}.blend',out/f'{drink}.json',out/f'{drink}-garnish-normal.png',P/'public/models/candidates'/a.output_tag/f'{drink}.glb']:
  if not path.is_file() or not path.stat().st_size:raise RuntimeError(f'Missing output: {path}')
  record['outputs'][str(path.relative_to(P))]={'sha256':sha(path),'bytes':path.stat().st_size}
 if a.render:
  run(drink+'-render',[str(out/f'{drink}.blend'),'--python',str(P/'scripts/render-reference-views.py'),'--','--drink',drink,'--view',a.view,'--samples',str(a.samples),'--suffix=-'+a.output_tag]+(['--denoise'] if a.denoise else []))
 if a.turntable:
  run(drink+'-turntable',[str(out/f'{drink}.blend'),'--python',str(P/'scripts/render-asset-turntable.py'),'--','--drink',drink,'--samples',str(a.samples),'--frames',str(a.frames)]+(['--denoise'] if a.denoise else []))
record['primaryAfter']={str(path.relative_to(P)):sha(path) for path in primary if path.exists()}
record['primaryUnchanged']=record['primaryAfter']==record['primaryBefore']
if not record['primaryUnchanged']:raise RuntimeError('Unexpected change to production assets.')
(log_dir/'reproduction.json').write_text(json.dumps(record,indent=2))
print(json.dumps(record,indent=2))
