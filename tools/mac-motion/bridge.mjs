// Unprivileged, loopback-only, finite lifetime transport. No commands from browsers.
import http from 'node:http';
import {spawn} from 'node:child_process';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {createInterface} from 'node:readline';
import {mkdir,writeFile,chmod} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
if(process.getuid?.()===0)throw new Error('The network bridge must run unprivileged.');
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const port=19876,origin=process.env.BTB_ORIGIN||'https://spiritatlas-one.vercel.app';
const allowed=new Set([origin,...(process.env.BTB_DEV_ORIGIN?[process.env.BTB_DEV_ORIGIN]:[])]);
const token=randomBytes(32).toString('base64url'),session=randomBytes(16).toString('hex'),expires=Date.now()+20*60_000;
const privateDir=path.join(root,'.mac-motion');await mkdir(privateDir,{recursive:true,mode:0o700});await chmod(privateDir,0o700);
await writeFile(path.join(privateDir,'pair.json'),JSON.stringify({token,session,expires,origin,port}),{mode:0o600});
let subscriber=null,lastSeq=0,lastArrival=0,lastSensorT={accel:-1,gyro:-1},accel=null,gyro=null,samples=0,rejected=0;
const valid=(v)=>v?.v===1&&Number.isSafeInteger(v.seq)&&v.seq>lastSeq&&['accel','gyro'].includes(v.kind)&&v.unit===(v.kind==='accel'?'g':'deg/s')&&Number.isFinite(v.t)&&v.t>lastSensorT[v.kind]&&Array.isArray(v.xyz)&&v.xyz.length===3&&v.xyz.every(n=>Number.isFinite(n)&&Math.abs(n)<(v.kind==='accel'?8:2000));
const reader=spawn(path.join(root,'tools/mac-motion/.build/btb-motion-reader'),['--seconds','1200'],{stdio:['ignore','pipe','pipe']});
reader.stderr.on('data',()=>{}); // Never emit a token or incidental reader output to network logs.
reader.on('error',e=>console.error('Native reader unavailable:',e.code));
const lines=createInterface({input:reader.stdout});lines.on('line',line=>{if(line.length>1024){rejected++;return;}try{const v=JSON.parse(line);if(!valid(v)){rejected++;return;}lastSeq=v.seq;lastSensorT[v.kind]=v.t;lastArrival=performance.now();samples++;if(v.kind==='accel')accel={...v,arrival:lastArrival};else gyro={...v,arrival:lastArrival};}catch{rejected++;}});
function authorized(req){const candidate=req.headers.authorization?.replace(/^Bearer /,'')||'';return candidate.length===token.length&&timingSafeEqual(Buffer.from(candidate),Buffer.from(token))&&Date.now()<expires;}
const server=http.createServer((req,res)=>{
 if(req.headers.host!==`127.0.0.1:${port}`&&req.headers.host!==`localhost:${port}`){res.writeHead(403).end();return;}
 const caller=req.headers.origin;
 if(caller&&!allowed.has(caller)){res.writeHead(403).end();return;}
 const headers={'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...(caller?{'Access-Control-Allow-Origin':caller,'Vary':'Origin','Access-Control-Allow-Headers':'Authorization','Access-Control-Allow-Methods':'GET, OPTIONS','Access-Control-Allow-Private-Network':'true'}:{})};
 if(req.method==='OPTIONS'){res.writeHead(204,headers).end();return;}
 if(req.method!=='GET'){res.writeHead(405,headers).end();return;}
 if(req.url==='/pair'&&!caller){res.writeHead(200,{...headers,'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'"});res.end(`<!doctype html><meta name="referrer" content="no-referrer"><title>Pair SpiritAtlas motion</title><style>body{font:18px system-ui;background:#2c2a2d;color:#ffffe3;max-width:560px;margin:12vh auto;padding:24px}a{color:#ffbbb0}</style><h1>Connect your MacBook</h1><p>This temporary session sends only inertial motion to SpiritAtlas. Your browser may ask for local network access. Allow it to connect to this loopback helper.</p><a href="${origin}/behind-the-bar/diagnostics?preset=stir-demo#motion=${token}">Pair with SpiritAtlas</a><p>Expires in 20 minutes. Keep this page private. Close the helper with Ctrl-C.</p>`);return;}
 if(!caller||!authorized(req)){res.writeHead(401,headers).end();return;}
 if(req.url==='/status'){res.writeHead(200,{...headers,'Content-Type':'application/json'}).end(JSON.stringify({session,expires,samples,rejected,readerAlive:reader.exitCode===null,age:performance.now()-lastArrival,uid:process.getuid()}));return;}
 if(req.url!=='/motion'){res.writeHead(404,headers).end();return;}
 if(subscriber){res.writeHead(409,headers).end();return;}
 res.writeHead(200,{...headers,'Content-Type':'application/x-ndjson','Connection':'keep-alive'});res.flushHeaders();subscriber=res;res.on('close',()=>{if(subscriber===res)subscriber=null;});
});
// HID timestamps and Node hrtime share this Mac's monotonic timebase.
const clockAnchor={mono:Number(process.hrtime.bigint())/1e9,epoch:Date.now()};
let sentSeq=0;
const timer=setInterval(()=>{if(Date.now()>=expires){shutdown();return;}if(!subscriber||!accel||!gyro||lastSeq<=sentSeq)return;const now=performance.now();if(now-accel.arrival>150||now-gyro.arrival>150)return;sentSeq=lastSeq;const packet={v:1,session,seq:lastSeq,expires,accel:accel.xyz,gyro:gyro.xyz,t:accel.t,sampleEpoch:clockAnchor.epoch+(accel.t-clockAnchor.mono)*1000,unit:'g-deg/s',kind:'native-spu'};if(subscriber.writableLength>8192){subscriber.destroy();subscriber=null;return;}subscriber.write(JSON.stringify(packet)+'\n');},16);
function shutdown(){clearInterval(timer);subscriber?.end();reader.kill('SIGTERM');server.close();setTimeout(()=>process.exit(0),250).unref();}
process.on('SIGINT',shutdown);process.on('SIGTERM',shutdown);
server.listen(port,'127.0.0.1',()=>console.log(`Motion bridge ready (unprivileged). Pair locally at http://127.0.0.1:${port}/pair ; temporary credentials are private, not logged.`));
