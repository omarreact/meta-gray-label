/** Fresh Phase 2 representative review and directory interaction evidence. */
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {readFile,mkdir} from 'node:fs/promises';
import {writeFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {resolve,extname} from 'node:path';
import {execFileSync} from 'node:child_process';
const wp=process.env.MGL_INNER_TARGET==='wordpress';
const base=wp?'http://localhost:8888':'http://127.0.0.1:4180';
const dir=wp?'tmp/inner-wordpress/phase2':'tmp/inner-static/phase2';await mkdir(dir,{recursive:true});
const types={'.html':'text/html','.css':'text/css','.js':'application/javascript','.svg':'image/svg+xml','.json':'application/json','.png':'image/png'};
let server;
if(!wp){server=createServer(async(req,res)=>{try{let path=new URL(req.url,base).pathname;if(path.endsWith('/'))path+='index.html';const file=resolve('dist/public','.'+path);if(!file.startsWith(resolve('dist/public')+'/'))throw Error();res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end('Not found');}});await new Promise(r=>server.listen(4180,'127.0.0.1',r));}
const pages=[
 ['services',wp?'/services/':'/services.html'],['solutions','/solutions/'],['insights','/insights/'],
 ['mt5-grey','/forex-grey-label/mt5-grey-label/'],['mt5-white','/forex-white-label/mt5-white-label/'],['kyc','/forex-crm/kyc/'],
 ['grey-hub','/forex-grey-label/'],['crm-hub','/forex-crm/'],['platform-hub','/trading-platforms/'],
 ['grey-pricing','/forex-grey-label/pricing/'],['white-pricing','/forex-white-label/pricing/'],
 ['comparison','/forex-white-label/vs-grey-label/'],['book-model','/forex-liquidity/a-book-b-book/'],
 ['process','/forex-broker-turnkey/how-it-works/'],['admin','/mt-admin-license/mt5-admin/'],['bridge','/forex-liquidity/liquidity-bridge/'],['back-office','/forex-crm/back-office/'],
 ['about','/about-us/'],['why','/about-us/why-choose-us/'],
 ['article-models','/insights/white-label-grey-label-or-turnkey-choosing-the-right-model/'],
 ['article-kyc','/insights/compliance-and-kyc-basics-for-metatrader-grey-label-brokerages/'],
 ['article-crm','/insights/metatrader-grey-label-crm-integration-boosting-client-onboarding-and-retention/']
];
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});const report=[];
try{
 for(const theme of ['dark','light'])for(const width of [360,390,430,768,1024,1180,1440,1920])for(const [name,route]of pages){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(base))errors.push(r.status()+' '+r.url());});
  await page.goto(base+route+'?theme='+theme,{waitUntil:'networkidle'});
  const metrics=await page.evaluate(()=>{
   const q=s=>document.querySelector(s),box=e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,width:r.width,height:r.height}};
   return{overflow:document.documentElement.scrollWidth-innerWidth,h1:document.querySelectorAll('h1').length,theme:document.documentElement.dataset.bsTheme,header:box(q('.mgl-native-site-header,.mgl-header-shell')),logo:box([...document.querySelectorAll('.mgl-native-brand img,.mgl-header-brand img')].find(e=>e.getBoundingClientRect().width>0)||q('header img')),footer:box(q('.mgl-native-site-footer,.footer')),preloader:!!q('.preloader'),text:q('.mgl-design').innerText.length};
  });
  assert.ok(metrics.overflow<=2,`${name} ${theme} ${width} overflow ${metrics.overflow}`);assert.equal(metrics.h1,1);assert.equal(metrics.theme,theme);assert.equal(metrics.preloader,false);assert.deepEqual(errors,[],name);
  if(['services','solutions','insights'].includes(name)){
   const filters=page.locator('.mgl-directory-filter a');const groups=page.locator('.mgl-directory-group');const count=await groups.count();assert.ok(count>=4);
   await filters.nth(1).click();assert.equal(await groups.filter({visible:true}).count(),1);assert.equal(await filters.nth(1).getAttribute('aria-pressed'),'true');
   await filters.first().focus();await filters.first().press('Space');assert.equal(await groups.filter({visible:true}).count(),count);
   assert.ok(await page.locator('.mgl-directory-status').innerText());
   await page.goto(base+route+'?theme='+theme+'#'+await groups.nth(1).getAttribute('id'),{waitUntil:'networkidle'});assert.equal(await groups.filter({visible:true}).count(),1);
   await page.goto(base+route+'?theme='+theme,{waitUntil:'networkidle'});
  }
  if([390,1440].includes(width)){
   await page.screenshot({path:`${dir}/${name}-${theme}-${width}.png`,fullPage:true});
   await page.screenshot({path:`${dir}/${name}-${theme}-${width}-hero.png`});
   if(['services','solutions','insights'].includes(name)){
    await page.locator('.mgl-native-site-footer,.footer').scrollIntoViewIfNeeded();await page.screenshot({path:`${dir}/${name}-${theme}-${width}-footer.png`});
   }
  }
  // The visible control must switch theme and remain keyboard operable.
  const toggle=page.locator(wp?'.mgl-native-theme-toggle a':'#btnSwitch');await toggle.click();assert.equal(await page.locator('html').getAttribute('data-bs-theme'),theme==='dark'?'light':'dark');
  if(wp&&['services','solutions','insights'].includes(name)){
   if(width<1200){const open=page.locator('.wp-block-navigation__responsive-container-open');await open.click();await page.locator('.wp-block-navigation__responsive-container.is-menu-open').waitFor();await page.locator('.wp-block-navigation__responsive-container-close').click();}
   else{await page.locator('.mgl-native-navigation .wp-block-navigation-submenu').first().hover();await page.locator('.mgl-native-navigation .wp-block-navigation__submenu-container').first().waitFor({state:'visible'});}
  }
  report.push({name,route,theme,width,...metrics});await ctx.close();
 }
 if(!wp){
  for(const theme of ['dark','light'])for(const width of [390,1440])for(const [name,route]of pages.slice(0,3)){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'}),page=await ctx.newPage();
   const path=route==='/services.html'?'services.html':route.slice(1)+'index.html';
   const baseline=execFileSync('git',['show','ba882fa14430eaa9cd12665ae012eccd87c326fe:'+path],{encoding:'utf8'}).replaceAll('data-aos=','data-before-aos=');
   await page.route(base+route+'?theme='+theme,r=>r.fulfill({body:baseline,contentType:'text/html'}));
   await page.goto(base+route+'?theme='+theme,{waitUntil:'networkidle'});await page.waitForTimeout(1700);
   await page.screenshot({path:`${dir}/before-${name}-${theme}-${width}.png`,fullPage:true});await page.screenshot({path:`${dir}/before-${name}-${theme}-${width}-hero.png`});await ctx.close();
  }
 }
 console.log(`PHASE 2 BROWSER PASS: ${report.length} fresh cases; 22 representative routes, 8 widths, 2 themes; directory filters/hash/keyboard, theme controls, navigation and screenshots.`);
}finally{writeFileSync(dir+'/metrics.json',JSON.stringify(report,null,2));await browser.close();if(server)await new Promise(r=>server.close(r));}
