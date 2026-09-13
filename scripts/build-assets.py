"""Stable production reproduction: v0.15.1 geometry plus portable normal baking.

Blender --background --python scripts/build-assets.py -- --drink all
Append --output-tag NAME to reproduce in isolated candidate directories instead.
Current experiments belong in build-assets-candidate.py, never this entry point.
"""
import hashlib,json,runpy,shutil,sys,time
from pathlib import Path
P=Path(__file__).resolve().parents[1]
arguments=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else sys.argv[1:]
isolated=any(arg=='--output-tag' or arg.startswith('--output-tag=') for arg in arguments)
if not isolated:arguments=arguments+['--output-tag','build-v0151']
sys.argv=[str(P/'scripts/reproduce-assets-v0151.py'),'--']+arguments
result=runpy.run_path(str(P/'scripts/reproduce-assets-v0151.py'),run_name='__main__')
if not isolated:
 args=result['a'];drinks=result['drinks'];tag=args.output_tag;files=[]
 for drink in drinks:
  source=P/'assets/blender/candidates'/tag
  files.extend([(source/f'{drink}.{ext}',P/'assets/blender'/f'{drink}.{ext}') for ext in ['blend','json']])
  files.extend([(source/f'{drink}-garnish-normal.png',P/'assets/blender'/f'{drink}-garnish-normal.png'),(P/'public/models/candidates'/tag/f'{drink}.glb',P/'public/models'/f'{drink}.glb')])
 sha=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
 # Every requested final baked output is present before any production replacement.
 for source,_ in files:
  if not source.is_file() or not source.stat().st_size:raise RuntimeError(f'Missing baked output: {source}')
 stamp=time.strftime('%Y%m%d-%H%M%S')+'-'+str(time.time_ns()%1000000000);archive=P/'qa/evidence/blender/production-rebuilds'/stamp;archive.mkdir(parents=True,exist_ok=True)
 record={'version':'0.15.1-baked','wrapperSha256':sha(Path(__file__)),'reproductionReport':f'qa/evidence/blender/{tag}/reproduction.json','files':[]}
 for source,target in files:
  before=sha(target) if target.exists() else None
  if target.exists():shutil.copy2(target,archive/target.name)
  shutil.copy2(source,target)
  record['files'].append({'source':str(source.relative_to(P)),'target':str(target.relative_to(P)),'previousSha256':before,'newSha256':sha(target)})
 (archive/'rebuild.json').write_text(json.dumps(record,indent=2))
 print('BAKED_PRODUCTION_REBUILD_COMPLETE',json.dumps(record))
