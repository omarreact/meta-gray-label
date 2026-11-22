/**
 * Playwright browser QA for isolated staging WordPress. Not pixel-parity
 * validation with the original design; checks real responsive usability.
 */
import assert from "node:assert/strict";
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
const base=process.env.MGL_WP_BASE||"http://localhost:8888";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const cases=[
  {route:"/",slug:"home"},
  {route:"/about-us/",slug:"about"},
  {route:"/forex-grey-label/",slug:"grey"},
  {route:"/forex-white-label/",slug:"white"},
  {route:"/forex-crm/",slug:"crm"},
  {route:"/forex-liquidity/",slug:"liquidity"},
  {route:"/insights/",slug:"insights"},
  {route:"/services/",slug:"services"}
];
const sizes=[{name:"desktop",width:1440,height:900},{name:"mobile",width:390,height:844}];
const dir="tmp/wp-browser-screens";
mkdirSync(dir,{recursive:true});
let verified=0;
try {
  for(const size of sizes){
    const context=await browser.newContext({viewport:{width:size.width,height:size.height},deviceScaleFactor:1});
    for(const entry of cases){
      const page=await context.newPage();
      const errors=[];
      page.on("pageerror",error=>errors.push(error.message));
      const response=await page.goto(base+entry.route,{waitUntil:"networkidle",timeout:30000});
      assert.equal(response.status(),200,entry.slug+" HTTP on "+size.name);
      const metrics=await page.evaluate(()=>({
        scrollWidth:document.documentElement.scrollWidth,
        clientWidth:document.documentElement.clientWidth,
        h1s:document.querySelectorAll("h1").length,
        h1Visible:[...document.querySelectorAll("h1")].some(x=>x.getBoundingClientRect().height>0),
        navLinks:document.querySelectorAll(".mgl-native-site-header a").length,
        cards:document.querySelectorAll(".mgl-native-section").length,
        cssLoaded:[...document.styleSheets].some(s=>(s.href||"").includes("/assets/css/fse.css"))
      }));
      assert.equal(metrics.h1s,1,entry.slug+" H1 count "+size.name);
      assert.ok(metrics.h1Visible,entry.slug+" H1 not visible "+size.name);
      assert.ok(metrics.navLinks>=7,entry.slug+" has no rendered site navigation");
      assert.ok(metrics.cards>0,entry.slug+" has no page sections");
      assert.ok(metrics.cssLoaded,entry.slug+" FSE CSS not loaded");
      assert.ok(metrics.scrollWidth<=metrics.clientWidth+3,
        entry.slug+" horizontal overflow at "+size.name+
        ": "+metrics.scrollWidth+" > "+metrics.clientWidth);
      assert.deepEqual(errors,[],entry.slug+" browser exceptions "+size.name);
      if(["home","grey","insights"].includes(entry.slug)){
        await page.screenshot({path:dir+"/"+entry.slug+"-"+size.name+".png",fullPage:false});
      }
      if(size.name==="mobile"&&entry.slug==="home"){
        const open=page.locator(".wp-block-navigation__responsive-container-open").first();
        assert.ok(await open.count(),"WordPress mobile navigation toggle absent");
        await open.click();
        await page.locator(".wp-block-navigation__responsive-container.is-menu-open").waitFor({state:"visible",timeout:5000});
        await page.locator(".wp-block-navigation__responsive-container-close").first().click();
      }
      await page.close();
      verified++;
    }
    await context.close();
  }
} finally { await browser.close(); }
console.log("REAL BROWSER QA PASS: "+verified+" desktop/mobile routes, FSE nav overlay, 6 screenshots.");
