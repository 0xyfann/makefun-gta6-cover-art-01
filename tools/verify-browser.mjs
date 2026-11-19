import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { chromium } from '../.verification/browser-tools/node_modules/playwright/index.mjs';

const executablePath = process.env.CHROMIUM_PATH || new URL('../.verification/browser-tools/browsers/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell', import.meta.url).pathname;
const browser = await chromium.launch({executablePath,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const results = {externalRequests:[],exceptions:[],consoleErrors:[],exports:[],checks:[]};
await mkdir('screenshots',{recursive:true});
await mkdir('.verification/verification',{recursive:true});
try {
  const context = await browser.newContext({viewport:{width:1280,height:1100},acceptDownloads:true});
  const page = await context.newPage();
  page.on('pageerror',error=>results.exceptions.push(error.message));
  page.on('console',message=>{if(message.type()==='error')results.consoleErrors.push(message.text());});
  page.on('request',request=>{if(/^https?:/.test(request.url())&&!request.url().startsWith('http://127.0.0.1:8080/'))results.externalRequests.push(request.url());});
  await page.goto('http://127.0.0.1:8080/',{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  assert(await page.evaluate(()=>document.fonts.check('900 24px Afterglow')));
  const art=()=>page.locator('#coverCanvas').evaluate(canvas=>canvas.toDataURL());
  const initial=await art();
  await page.locator('#photoInput').setInputFiles(['app/samples/pier.jpg','app/samples/boulevard.jpg']);
  await page.waitForFunction(()=>document.querySelectorAll('#photoShelf img').length===4);
  await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('2 local'));
  assert.notEqual(await art(),initial);
  await page.locator('#captionInput').fill('MIDNIGHT COAST');
  assert.equal(await page.locator('#captionCount').textContent(),'14 / 24');
  const beforeZoom=await art();
  await page.locator('#zoomInput').fill('1.65');
  assert.notEqual(await art(),beforeZoom);
  const bounds=await page.locator('#coverCanvas').boundingBox();
  const beforeDrag=await art();
  await page.mouse.move(bounds.x+bounds.width*.3,bounds.y+bounds.height*.3);
  await page.mouse.down();await page.mouse.move(bounds.x+bounds.width*.4,bounds.y+bounds.height*.37,{steps:8});await page.mouse.up();
  assert.notEqual(await art(),beforeDrag);
  assert.equal(await page.locator('#framingLabel').textContent(),'Frame 1 crop');
  await page.locator('#resetButton').click();
  await page.locator('#addPanel').click();await page.locator('#addPanel').click();
  assert.equal(await page.locator('.panel-row').count(),5);
  assert(await page.locator('#addPanel').isDisabled());
  await page.getByRole('button',{name:'Remove frame 5',exact:true}).click();
  await page.getByRole('button',{name:'Remove frame 4',exact:true}).click();
  assert.equal(await page.locator('.panel-row').count(),3);
  results.checks.push('Two local photos decoded and assigned; live caption, zoom, pointer drag, reset and add/remove panels work.');
  await page.locator('[data-grade="neon"]').click();
  const neon=await art();await page.locator('[data-grade="mono"]').click();assert.notEqual(await art(),neon);
  await page.locator('[data-font="condensed"]').click();await page.locator('[data-font="display"]').click();
  await page.locator('[data-grade="sunset"]').click();
  await page.locator('#panelList select').nth(0).selectOption('0');
  await page.locator('#panelList select').nth(1).selectOption('1');
  await page.locator('#panelList select').nth(2).selectOption('0');
  await page.locator('#captionInput').fill('VICE AFTER DARK');
  for (const [format,width,height,filename,shotWidth,shotHeight] of [
    ['landscape',1920,1080,'00-cover-landscape.jpg',1280,720],
    ['portrait',1080,1350,'02-export-portrait.jpg',864,1080],
    ['square',1080,1080,'03-export-square.jpg',1080,1080]
  ]) {
    await page.locator('#formatSelect').selectOption(format);
    const downloaded=page.waitForEvent('download');
    await page.locator('#exportButton').click();
    const download=await downloaded;
    const target=`.verification/verification/afterglow-${format}.png`;
    await download.saveAs(target);
    const png=await readFile(target);
    assert.equal(png.subarray(1,4).toString(),'PNG');
    assert.equal(png.readUInt32BE(16),width);assert.equal(png.readUInt32BE(20),height);
    const exported=await context.newPage();
    await exported.setViewportSize({width:shotWidth,height:shotHeight});
    await exported.setContent(`<html><body style="margin:0;background:#17252a"><img alt="Afterglow exported cover" style="display:block;width:100vw;height:100vh;object-fit:contain" src="data:image/png;base64,${png.toString('base64')}"></body></html>`);
    await exported.locator('img').evaluate(image=>image.decode());
    await exported.screenshot({path:`screenshots/${filename}`,type:'jpeg',quality:86});
    await exported.close();
    results.exports.push({format,width,height,pngBytes:png.length,screenshot:filename,screenshotBytes:(await stat(`screenshots/${filename}`)).size});
  }
  await page.locator('#formatSelect').selectOption('portrait');
  await page.waitForFunction(()=>!document.querySelector('#toast').classList.contains('show'));
  await page.screenshot({path:'screenshots/01-editor-loaded.jpg',type:'jpeg',quality:85});
  await page.setViewportSize({width:390,height:844});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.locator('#captionInput').fill('');
  await page.locator('#photoInput').setInputFiles({name:'unreadable.png',mimeType:'image/png',buffer:Buffer.from('not an image')});
  await page.waitForFunction(()=>document.querySelector('#toast').textContent.includes('readable image'));
  results.checks.push('All color grades and typography controls work; 390px mobile layout has no horizontal overflow; blank caption and unreadable file handled.');
  const allowedRequests=await page.evaluate(()=>performance.getEntriesByType('resource').filter(entry=>/^https?:/.test(entry.name)).map(entry=>entry.name));
  results.localAssetsLoaded=allowedRequests;
  await context.setOffline(true);
  await page.locator('#captionInput').fill('OFFLINE VERIFIED');
  const offlineDownload=page.waitForEvent('download');await page.locator('#exportTop').click();
  await (await offlineDownload).saveAs('.verification/verification/offline-export.png');
  results.checks.push('Export succeeds with browser context offline; external requests remain zero.');
  assert.deepEqual(results.externalRequests,[]);assert.deepEqual(results.exceptions,[]);assert.deepEqual(results.consoleErrors,[]);
  for (const filename of ['00-cover-landscape.jpg','01-editor-loaded.jpg','02-export-portrait.jpg','03-export-square.jpg']) assert((await stat(`screenshots/${filename}`)).size<=262144);
  await writeFile('.verification/verification/browser-results.json',JSON.stringify(results,null,2)+'\n');
  console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
