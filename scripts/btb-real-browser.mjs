// Installed Chrome with normal security, sandbox, media and focus defaults.
import {chromium} from '@playwright/test';import {spawn,execFile} from 'node:child_process';import fs from 'node:fs/promises';import os from 'node:os';import path from 'node:path';import {promisify} from 'node:util';
export async function realBrowser(){
 const privateDir=path.resolve('.mac-motion');await fs.mkdir(privateDir,{recursive:true,mode:0o700});const pointer=path.join(privateDir,'browser-profile-path');let profile;
 try{profile=(await fs.readFile(pointer,'utf8')).trim();await fs.access(profile);}catch{profile=await fs.mkdtemp(path.join(os.tmpdir(),'spiritatlas-browser-'));await fs.writeFile(pointer,profile,{mode:0o600});}
 const port=9228,args=[`--user-data-dir=${profile}`,`--remote-debugging-port=${port}`,'--no-first-run','--no-default-browser-check','--window-size=1440,1080','about:blank'];
 const chromeProcess=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',args,{stdio:'ignore',detached:true});let endpoint;
 for(let i=0;i<100;i++){try{endpoint=await(await fetch(`http://127.0.0.1:${port}/json/version`)).json();break;}catch{await new Promise(r=>setTimeout(r,100));}}
 if(!endpoint){chromeProcess.kill();throw new Error('Normal Chrome debugging endpoint did not start');}
 const browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`,{noDefaults:true});const context=browser.contexts()[0],page=context.pages()[0]||await context.newPage();await page.bringToFront();
 return {browser,context,page,args:args.map(v=>v.startsWith('--user-data-dir=')?'--user-data-dir=<private-task-profile>':v),async detach(){await browser.close();chromeProcess.unref();},async close(){await browser.close();chromeProcess.kill();}};
}
export async function recordRealPage(page,output){
 const folder=await fs.mkdtemp(path.join(os.tmpdir(),'btb-recording-')),cdp=await page.context().newCDPSession(page);const frames=[],writes=[];
 cdp.on('Page.screencastFrame',event=>{const file=`${String(frames.length).padStart(6,'0')}.jpg`;frames.push({file,t:event.metadata.timestamp});writes.push(fs.writeFile(path.join(folder,file),Buffer.from(event.data,'base64')));void cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});});
 await cdp.send('Page.startScreencast',{format:'jpeg',quality:75,maxWidth:1440,maxHeight:1000,everyNthFrame:6});
 return async()=>{await cdp.send('Page.stopScreencast');await Promise.all(writes);await fs.mkdir(path.dirname(output),{recursive:true});if(frames.length>1){const list=frames.map((f,i)=>`file '${f.file}'\nduration ${Math.max(.001,(frames[i+1]?.t??f.t+.1)-f.t)}`).join('\n');await fs.writeFile(path.join(folder,'frames.txt'),list);await promisify(execFile)('/opt/homebrew/bin/ffmpeg',['-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',path.join(folder,'frames.txt'),'-fps_mode','vfr','-c:v','libvpx-vp9','-deadline','realtime','-cpu-used','6','-row-mt','1','-threads','4','-crf','36','-b:v','0',path.resolve(output)]);await fs.writeFile(output+'.json',JSON.stringify({frames:frames.length,duration:frames.at(-1).t-frames[0].t,capture:'Actual Chrome page screencast; original frame timestamps, no animation substitution.'},null,2));}await cdp.detach();await fs.rm(folder,{recursive:true,force:true});};
}
