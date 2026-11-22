import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {mkdirSync} from 'node:fs';
const base=process.env.MGL_WP_BASE||'http://localhost:8888';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
mkdirSync('tmp/inner-wordpress/contact',{recursive:true});
try{
 for(const theme of ['light','dark'])for(const width of [360,390,430,768,1024,1180,1440,1920]){
  const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const p=await ctx.newPage();const errors=[];const external=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(!r.url().startsWith(base)&&r.method()==='POST')external.push(r.url())});
  const response=await p.goto(base+'/contact/?theme='+theme,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  await p.getByRole('button',{name:'Prepare enquiry'}).click();assert.match(await p.locator('#mgl-enquiry-status').innerText(),/required fields/);
  await p.locator('[name="name"]').fill('QA Example');await p.locator('[name="contact"]').fill('qa@example.test');
  await p.locator('[name="model"]').selectOption({label:'Grey Label'});await p.locator('[name="platform"]').selectOption({label:'MT5'});
  await p.getByRole('button',{name:'Prepare enquiry'}).click();await p.locator('#mgl-enquiry-output').waitFor({state:'visible'});
  assert.match(await p.locator('#mgl-enquiry-summary').innerText(),/QA Example/);assert.match(await p.locator('#mgl-share-enquiry').getAttribute('href'),/^https:\/\/wa.me\/447988028424\?text=/);
  assert.match(await p.locator('#mgl-enquiry-status').innerText(),/No data has been transmitted/);
  const overflow=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);assert.ok(overflow<=2,theme+' '+width+' overflow '+overflow);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  if([390,1440].includes(width))await p.screenshot({path:`tmp/inner-wordpress/contact/${theme}-${width}.png`,fullPage:true});
  await ctx.close();
 }
 console.log('WORDPRESS CONTACT PASS: 16 viewport/theme cases; required fields, prepared brief, WhatsApp destination, no automatic send, zero overflow/errors.');
}finally{await browser.close()}
