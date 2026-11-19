import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { once } from 'node:events';

const browser = spawn(process.env.CHROMIUM_PATH || new URL('../.verification/browser-tools/browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', import.meta.url).pathname, ['--headless','--no-sandbox','--disable-dev-shm-usage','--disable-gpu','--disable-background-networking','--disable-component-update','--no-first-run','--remote-debugging-port=9333','--user-data-dir=/tmp/afterglow-browser-check','about:blank'], {stdio:['ignore','ignore','pipe']});
let stderr = ''; browser.stderr.on('data', chunk => { stderr += chunk; });
let socket;
try {
  let targets;
  for (let attempt=0; attempt<100; attempt++) {
    try { targets = await (await fetch('http://127.0.0.1:9333/json/list')).json(); break; }
    catch { await new Promise(resolve=>setTimeout(resolve,100)); }
  }
  if (!targets) throw new Error(`Chromium unavailable: ${stderr}`);
  socket = new WebSocket(targets.find(target=>target.type==='page').webSocketDebuggerUrl);
  await once(socket,'open');
  let sequence=0; const pending=new Map(), events=[];
  socket.onmessage = message => { const data=JSON.parse(message.data); if(data.id){ const task=pending.get(data.id); pending.delete(data.id); data.error?task.reject(new Error(JSON.stringify(data.error))):task.resolve(data.result); } else events.push(data); };
  const cdp=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await cdp('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;};
  await cdp('Page.enable'); await cdp('Runtime.enable'); await cdp('Network.enable');
  await cdp('Emulation.setDeviceMetricsOverride',{width:1280,height:1000,deviceScaleFactor:1,mobile:false});
  await cdp('Page.navigate',{url:'http://127.0.0.1:8080/'});
  await evaluate(`new Promise(resolve=>{ const ready=()=>document.readyState==='complete'&&document.fonts.status==='loaded'&&[...document.images].every(image=>image.complete); const timer=setInterval(()=>{if(ready()){clearInterval(timer);resolve(true)}},50); })`);
  await mkdir('.verification/verification',{recursive:true});
  const baseline=await cdp('Page.captureScreenshot',{format:'jpeg',quality:75,captureBeyondViewport:false});
  await writeFile('.verification/verification/baseline.jpg',Buffer.from(baseline.data,'base64'));
  console.log(JSON.stringify({stage:'baseline',canvas:await evaluate(`({width:coverCanvas.width,height:coverCanvas.height})`),exceptions:events.filter(event=>event.method==='Runtime.exceptionThrown')},null,2));
} finally { socket?.close(); browser.kill('SIGTERM'); }
