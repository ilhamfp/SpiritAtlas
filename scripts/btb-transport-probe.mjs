import {realBrowser} from './btb-real-browser.mjs';import fs from 'node:fs/promises';
const {token}=JSON.parse(await fs.readFile('.mac-motion/pair.json','utf8'));
const real=await realBrowser();const {page}=real;
await page.goto('https://spiritatlas-one.vercel.app');
const result=await page.evaluate(async token=>{try{const controller=new AbortController();setTimeout(()=>controller.abort(),60000);const r=await fetch('http://127.0.0.1:19876/status',{headers:{Authorization:`Bearer ${token}`},signal:controller.signal});return {origin:location.origin,status:r.status,body:await r.json(),userAgent:navigator.userAgent,gpu:!!navigator.gpu};}catch(e){return {origin:location.origin,error:String(e)};}},token);
await fs.writeFile('docs/behind-the-bar/evidence/production-loopback-probe.json',JSON.stringify({...result,launchArguments:real.args,focusEmulation:false},null,2));console.log(result);await real.close();
