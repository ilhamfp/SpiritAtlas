#!/usr/bin/env python3
"""Sequential full-quality source review jobs; no concurrent GPU contention."""
from pathlib import Path
import subprocess, time, json
P=Path(__file__).resolve().parents[1]
out=P/'qa/evidence/blender'
version=json.loads((P/'assets/blender/negroni-express.json').read_text())['version'].split('.')[1]
blender='/Applications/Blender.app/Contents/MacOS/Blender'
jobs=[(d,'hero',False,True) for d in ('negroni-express','bbf-negroni','ichigo-negroni')]
jobs+=[('negroni-express','photo',False,False)]
jobs+=[(d,'hero',True,True) for d in ('ichigo-negroni','negroni-express','bbf-negroni')]
for drink,view,isolate,crop in jobs:
    suffix=f'-v{int(version):03d}'+('-garnish' if isolate else '')
    cmd=[blender,'--background',str(P/f'assets/blender/{drink}.blend'),'--python',str(P/'scripts/render-reference-views.py'),'--','--drink',drink,'--view',view,'--samples','256','--denoise',f'--suffix={suffix}']
    if crop:cmd+=['--crop']
    if isolate:cmd+=['--isolate-garnish']
    log=out/f'{drink}-{view}{suffix}.log';start=time.time()
    print(json.dumps({'status':'start','drink':drink,'view':view,'isolate':isolate,'log':str(log)}),flush=True)
    with log.open('w') as f:result=subprocess.run(cmd,stdout=f,stderr=subprocess.STDOUT)
    expected=out/f'{drink}-{view}{suffix}.png'
    success=result.returncode==0 and expected.exists() and expected.stat().st_mtime>=start
    print(json.dumps({'status':'finished','drink':drink,'view':view,'isolate':isolate,'exitCode':result.returncode,'imageWritten':success,'elapsedSeconds':round(time.time()-start,1)}),flush=True)
    if not success:raise SystemExit('Render failed; inspect '+str(log))
