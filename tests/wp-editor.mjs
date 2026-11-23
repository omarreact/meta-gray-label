/**
 * Real Gutenberg + Site Editor smoke test on disposable wp-env.
 * It logs in using wp-env's documented local-only credentials.
 * No posts or templates are saved, edited, or published by this test.
 */
import assert from "node:assert/strict";
import { chromium } from "playwright";

const base=process.env.MGL_WP_BASE||"http://localhost:8888";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
try {
  const ctx=await browser.newContext({viewport:{width:1440,height:900}});
  const page=await ctx.newPage();
  await page.goto(base+"/wp-login.php",{waitUntil:"domcontentloaded"});
  await page.locator("#user_login").fill("admin");
  await page.locator("#user_pass").fill("password");
  await Promise.all([
    page.waitForURL(/\/wp-admin(?:\/|$)/,{timeout:30000}),
    page.locator("#wp-submit").click()
  ]);
  const api=await ctx.request.get(base+"/wp-json/wp/v2/pages?slug=home");
  assert.equal(api.status(),200);
  const list=await api.json();
  assert.ok(list.length>0,"Native homepage missing from WordPress REST");
  const homeId=list[0].id;
  const pages=[
    {id:homeId,name:"homepage"},
    ...await Promise.all(["services","solutions","insights","contact","about-us","forex-grey-label","mt5-grey-label","pricing","vs-grey-label","how-it-works","mt5-admin","metatrader-grey-label-vs-white-label-which-is-best-for-your-forex-brokerage"].map(async slug=>{
      const r=await ctx.request.get(base+"/wp-json/wp/v2/pages?slug="+slug);
      assert.equal(r.status(),200);
      const j=await r.json();
      assert.ok(j.length,slug+" missing from WordPress REST");
      return {id:j[0].id,name:slug};
    }))
  ];
  for(const entry of pages){
    await page.goto(base+"/wp-admin/post.php?post="+entry.id+"&action=edit",{
      waitUntil:"domcontentloaded",timeout:45000
    });
    await page.waitForFunction(()=>{
      const editor=window.wp?.data?.select?.("core/block-editor");
      return editor&&typeof editor.getBlocks==="function"&&editor.getBlocks().length>0;
    },{timeout:45000});
    const state=await page.evaluate(()=>{
      const blocks=window.wp.data.select("core/block-editor").getBlocks();
      let total=0,invalid=0;
      function walk(items){
        for(const block of items){
          total++;
          if(block.isValid===false)invalid++;
          walk(block.innerBlocks||[]);
        }
      }
      walk(blocks);
      return {total,invalid};
    });
    assert.ok(state.total>=10,entry.name+" Gutenberg editor did not load enough blocks");
    assert.equal(state.invalid,0,entry.name+" has invalid serialized Gutenberg blocks");
    const text=(await page.locator("body").innerText()).slice(0,1000);
    assert.doesNotMatch(text,/critical error|unexpected or invalid content/i,
      entry.name+" editor error");
    console.log("GUTENBERG EDITOR PASS "+entry.name+": "+state.total+" blocks, 0 invalid");
  }
  const parts=await page.evaluate(async()=>{
    const records=await wp.apiFetch({path:'/wp/v2/template-parts?context=edit'});
    return records.filter(x=>x.theme==='meta-grey-label'&&['header','footer'].includes(x.slug)).map(record=>{
      let total=0,invalid=0;
      function walk(items){for(const block of items){total++;if(block.isValid===false)invalid++;walk(block.innerBlocks||[]);}}
      walk(wp.blocks.parse(record.content.raw));return{slug:record.slug,total,invalid};
    });
  });
  assert.equal(parts.length,2,'both native template parts must be editable');
  for(const part of parts){assert.ok(part.total>10);assert.equal(part.invalid,0,part.slug+' invalid native blocks');console.log('TEMPLATE PART PASS '+part.slug+': '+part.total+' blocks, 0 invalid');}
  await page.goto(base+"/wp-admin/themes.php?page=mgl-setup",{waitUntil:"domcontentloaded",timeout:45000});
  await page.locator("h1").filter({hasText:"Meta Grey Label Setup"}).waitFor({state:"visible"});
  await page.locator("form[action$='admin-post.php'] input[name='action'][value='mgl_import_pages']").waitFor({state:"attached"});
  const setupText=await page.locator("body").innerText();
  assert.match(setupText,/Missing pages:\s*0/i,"Admin setup should detect the already imported staging content");
  assert.doesNotMatch(setupText,/critical error|fatal error/i,"Admin setup critical error");
  await Promise.all([
    page.waitForURL(/themes\.php\?page=mgl-setup.*mgl_status=imported/,{timeout:30000}),
    page.locator("form[action$='admin-post.php'] input[type='submit']").click()
  ]);
  const setupResult=await page.locator("body").innerText();
  assert.match(setupResult,/Setup complete\. 0 missing page\(s\) were created/i,
    "Admin setup submit did not confirm its safe no-op result");
  console.log("WORDPRESS ADMIN SETUP PASS: screen loads, detects installed pages and submits safely without overwriting.");

  await page.goto(base+"/wp-admin/site-editor.php",{waitUntil:"domcontentloaded",timeout:45000});
  await page.waitForFunction(()=>!!window.wp?.data,{timeout:30000});
  const siteEditorText=(await page.locator("body").innerText()).slice(0,1500);
  assert.doesNotMatch(siteEditorText,/critical error|fatal error/i,"Site Editor critical error");
  console.log("WORDPRESS SITE EDITOR PASS: dashboard opened, no fatal errors.");
  await ctx.close();
} finally { await browser.close(); }
