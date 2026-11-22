/** Run against the static build or real wp-env; capture before/after evidence. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const wp=process.env.MGL_INNER_TARGET==='wordpress';
const base=wp?(process.env.MGL_WP_BASE||'http://localhost:8888'):'http://127.0.0.1:4175';
const dir=wp?'tmp/inner-wordpress':'tmp/inner-static';mkdirSync(dir,{recursive:true});
const types={'.css':'text/css','.js':'application/javascript','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.html':'text/html'};
let server;
if(!wp){server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const file=resolve('dist/public','.'+path);if(!file.startsWith(resolve('dist/public')+'/'))throw Error();res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found')}});await new Promise(r=>server.listen(4175,'127.0.0.1',r))}
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const widths=[360,390,430,768,1024,1180,1440,1920];
const route='/forex-grey-label/mt5-grey-label/';
const report={target:wp?'real-wordpress':'static',cases:[],errors:[]};
try{
 for(const theme of ['light','dark'])for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(r.status()+' '+r.url())});
  const response=await page.goto(base+route+'?theme='+theme,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await page.waitForSelector('.mgl-design');
  await page.waitForTimeout(400);
  const metrics=await page.evaluate(()=>{
   const q=s=>document.querySelector(s);const box=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,bottom:r.bottom}};
   const contrast=(fg,bg)=>{const luminance=c=>{let rgb=c.match(/[\d.]+/g).slice(0,3).map(v=>Number(v)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722};let a=luminance(fg),b=luminance(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   const root=q('.mgl-design'),style=getComputedStyle(root),para=q('.mgl-inner-summary');
   return {width:innerWidth,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,h1Count:document.querySelectorAll('h1').length,h1:box(q('h1')),h1Font:getComputedStyle(q('h1')).fontSize,cta:box(q('.mgl-inner-hero-copy .mgl-inner-action a')),contrast:contrast(getComputedStyle(para).color,style.backgroundColor),theme:document.documentElement.getAttribute('data-bs-theme'),sectionCount:root.querySelectorAll('section').length,logo:box(q('header img')||q('header'))};
  });
  assert.equal(metrics.h1Count,1);assert.ok(metrics.overflow<=2,JSON.stringify(metrics));
  assert.equal(metrics.theme,theme);assert.ok(metrics.contrast>=4.5,'low hero contrast '+metrics.contrast);
  if(!wp)assert.ok(metrics.cta.bottom<800,'primary CTA pushed below first screen');
  assert.ok(metrics.cta.height>=44);
  const disclosure=page.locator('.mgl-inner-disclosure').first();
  await disclosure.locator('summary').press('Enter');assert.equal(await disclosure.getAttribute('open'),'');
  await disclosure.locator('summary').press('Enter');assert.equal(await disclosure.getAttribute('open'),null);
  await page.locator('.mgl-inner-hero-copy .mgl-inner-action a').first().focus();
  const outline=await page.locator('.mgl-inner-hero-copy .mgl-inner-action a').first().evaluate(e=>getComputedStyle(e).outlineStyle);assert.notEqual(outline,'none');
  await page.evaluate(()=>{document.activeElement.blur();window.scrollTo(0,0)});
  assert.deepEqual(errors,[],'browser errors');
  await page.screenshot({path:`${dir}/mt5-${theme}-${width}.png`,fullPage:true});
  if([390,1440].includes(width))await page.screenshot({path:`${dir}/mt5-${theme}-${width}-hero.png`});
  report.cases.push({theme,...metrics});
  await ctx.close();
 }
 if(!wp){
  // Confirm the approved home and shared chrome sources are byte-for-byte intact.
  for(const path of ['index.html','header.html','footer.html'])assert.equal(execFileSync('git',['show','7d5568d512e21e09cdd18e57749abe5e1eb7cf49:'+path],{encoding:'utf8'}).toString(),execFileSync('cat',[path]).toString(),path+' changed');
 }
 console.log('INNER BROWSER PASS: '+report.cases.length+' viewport/theme cases; contrast, overflow, native FAQ, focus, errors and screenshots.');
}finally{writeFileSync(dir+'/metrics.json',JSON.stringify(report,null,2));await browser.close();if(server)await new Promise(r=>server.close(r))}
