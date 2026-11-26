import {chromium} from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const [manifest,out]=process.argv.slice(2);
const routes=JSON.parse(fs.readFileSync(manifest,'utf8')).pages.map(p=>p.path);
const browser=await chromium.launch({headless:true});
const origin='http://localhost:8888';
const findings=[];
fs.mkdirSync(out,{recursive:true});
try{
 for(const width of [360,390,768,1024,1180,1440,1920]){
   const checks=width===390||width===1440?[...routes,'/production-blog-fixture/','/category/technology-fixture/','/?s=Production','/not-a-real-page/']:['/','/contact/','/insights/','/production-blog-fixture/'];
   // Limit parallel tabs to avoid host resource pressure.
   for(let i=0;i<checks.length;i+=4)await Promise.all(checks.slice(i,i+4).map(async route=>{
     const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
     const errors=[];page.on('pageerror',e=>errors.push(e.message));
     const response=await page.goto(origin+route,{waitUntil:'domcontentloaded',timeout:30000});
     await page.locator('header.mgl2-header').waitFor({timeout:15000});
     const data=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,main:!!document.querySelector('#main-content'),footer:!!document.querySelector('footer'),title:document.title}));
     findings.push({route,width,status:response?.status(),errors,...data});
     assert(data.main&&data.footer,'Missing page structure '+route);
     assert(data.overflow<=2,'Horizontal overflow '+route+' '+width);
     assert.equal(response?.status(),route==='/not-a-real-page/'?404:200);
     assert(!errors.length,errors.join('; '));
     if(route==='/production-blog-fixture/')assert(await page.getByText('Native post body verification.').count());
     if(route==='/insights/')assert(await page.getByText('Production blog fixture',{exact:true}).count(),'New native post missing from Insights');
     await page.close();
   }));
 }
 const shot=await browser.newPage({viewport:{width:1200,height:900},reducedMotion:'reduce'});
 await shot.goto(origin+'/',{waitUntil:'networkidle'});
 await shot.evaluate(()=>document.fonts.ready);
 await shot.screenshot({path:path.join(out,'screenshot.png'),animations:'disabled'});
 await shot.close();
 const admin=await browser.newPage({viewport:{width:1440,height:1000}});
 await admin.goto(origin+'/wp-login.php');await admin.locator('#user_login').fill('admin');await admin.locator('#user_pass').fill('password');await Promise.all([admin.waitForURL('**/wp-admin/**'),admin.locator('#wp-submit').click()]);
 await admin.goto(origin+'/wp-admin/admin.php?page=pin-local-setup');
 await admin.getByRole('heading',{name:'Website ready'}).waitFor();
 await admin.screenshot({path:path.join(out,'setup.png'),fullPage:true});
 await admin.close();
 console.log('PASS: '+findings.length+' frontend routes/viewports, native blog and setup.');
}finally{fs.writeFileSync(path.join(out,'route-report.json'),JSON.stringify(findings,null,2));await browser.close();}
