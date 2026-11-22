import assert from 'node:assert/strict';
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve,extname } from 'node:path';
import { chromium } from 'playwright';
import { INNER_ROLLOUT,pageFamily } from '../src/inner-system.js';
const wp=process.env.MGL_INNER_TARGET==='wordpress';
const base=wp?(process.env.MGL_WP_BASE||'http://localhost:8888'):'http://127.0.0.1:4177';
const dir=wp?'tmp/inner-wordpress/families':'tmp/inner-static/families';mkdirSync(dir,{recursive:true});
const types={'.css':'text/css','.js':'application/javascript','.json':'application/json','.html':'text/html','.svg':'image/svg+xml','.png':'image/png'};
let server;
if(!wp){server=createServer(async(req,res)=>{try{let path=new URL(req.url,'http://localhost').pathname;if(path.endsWith('/'))path+='index.html';const file=resolve('dist/public','.'+path);if(!file.startsWith(resolve('dist/public')+'/'))throw Error();res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file))}catch{res.statusCode=404;res.end('Not found')}});await new Promise(r=>server.listen(4177,'127.0.0.1',r))}
const representatives=new Map();for(const route of INNER_ROLLOUT)if(!representatives.has(pageFamily(route)))representatives.set(pageFamily(route),route);
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const results=[];
try{
 for(const theme of ['light','dark'])for(const width of [360,390,430,768,1024,1180,1440,1920]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();
  let errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const route of INNER_ROLLOUT){
   errors=[];const response=await page.goto(base+route+'?theme='+theme,{waitUntil:'load'});assert.equal(response.status(),200,route);
   const metrics=await page.evaluate(()=>{
    const q=s=>document.querySelector(s),root=document.documentElement;
    return {overflow:root.scrollWidth-root.clientWidth,h1:document.querySelectorAll('h1').length,theme:root.getAttribute('data-bs-theme'),design:!!q('.mgl-design'),css:[...document.styleSheets].some(x=>x.href?.includes('inner-pages.css')),text:q('.mgl-design')?.innerText.length};
   });
   assert.ok(metrics.design&&metrics.css,'missing layout/assets '+route);assert.equal(metrics.h1,1,route);assert.equal(metrics.theme,theme,route);
   assert.ok(metrics.overflow<=2,`${route} ${theme} ${width} overflow ${metrics.overflow}`);assert.ok(metrics.text>500,route+' content missing');assert.deepEqual(errors,[],route+' browser error');
   await page.locator('.mgl-design h1').waitFor({state:'visible'});
   assert.equal(await page.locator('.preloader').count(),0,'new inner routes must not delay content behind a loader');
   if([390,1440].includes(width)&&representatives.get(pageFamily(route))===route){
    await page.screenshot({path:`${dir}/${pageFamily(route)}-${theme}-${width}.png`,fullPage:true});
   }
   results.push({route,theme,width,...metrics});
  }
  await ctx.close();
 }
 console.log(`INNER ROUTES BROWSER PASS: ${results.length} cases across ${INNER_ROLLOUT.size} routes, 8 widths, 2 themes; ${representatives.size} family screenshot sets.`);
}finally{writeFileSync(dir+'/metrics.json',JSON.stringify(results,null,2));await browser.close();if(server)await new Promise(r=>server.close(r))}
