const {chromium}=require('playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
  const browser=await chromium.launch({headless:true});
  fs.mkdirSync('wordpress-qa',{recursive:true});
  const results=[];
  try{
    for(const [source,wordpress] of [['index.html',''],['index-2.html','index-2/'],['about-us/','about-us/'],['contact/','contact/']]){
      for(const width of [390,1440]){
        const measurements=[];
        for(const [kind,url] of [['static','http://127.0.0.1:4173/'+source],['wordpress','http://localhost:8888/'+wordpress]]){
          const page=await browser.newPage({viewport:{width,height:1000}});
          const errors=[];page.on('pageerror',e=>errors.push(e.message));
          const response=await page.goto(url+'?theme=dark',{waitUntil:'networkidle'});
          assert.equal(response.status(),200,url);
          const alternate=source==='index-2.html';
          await page.locator(alternate?'.main-header':'.mgl-site-header').waitFor();
          await page.locator(alternate?'.main-footer':'.footer').waitFor();
          await page.locator('body').evaluate(async()=>{await document.fonts.ready;document.querySelectorAll('img[loading="lazy"]').forEach(img=>img.loading='eager');});
          if(!alternate){
            await page.waitForFunction(()=>typeof window.updateThemeColor==='function');
            const toggle=page.locator('.mgl-site-header #btnSwitch');
            await toggle.click();
            await page.waitForFunction(()=>document.documentElement.getAttribute('data-bs-theme')==='light');
            await toggle.click();
            await page.waitForFunction(()=>document.documentElement.getAttribute('data-bs-theme')==='dark');
            if(width===390){
              const menu=page.locator('.mgl-menu-toggle');
              await menu.click();
              assert.equal(await menu.getAttribute('aria-expanded'),'true','Mobile menu did not open');
              await menu.click();
              assert.equal(await menu.getAttribute('aria-expanded'),'false','Mobile menu did not close');
            }
          } else if(width===390){
            const menu=page.locator('.main-header .header-lower .mobile-nav-toggler');
            await menu.click();
            await page.waitForFunction(()=>document.body.classList.contains('mobile-menu-visible'));
            await page.locator('.mobile-menu .close-btn').click();
            await page.waitForFunction(()=>!document.body.classList.contains('mobile-menu-visible'));
          }
          const data=await page.evaluate(()=>({
            width:innerWidth,scroll:document.documentElement.scrollWidth,
            h1:[...document.querySelectorAll('h1')].map(el=>el.textContent.replace(/\s+/g,' ').trim()),
            images:[...document.images].filter(img=>img.complete&&img.naturalWidth===0).map(img=>img.src),
            headerCount:document.querySelectorAll('.mgl-site-header').length,
            alternativeHeader:document.querySelectorAll('.main-header').length,
            footerCount:document.querySelectorAll('.footer').length,
            regions:[...document.querySelectorAll('.fxh-hero,.fxh-pillars,#services,.mgl-inner-hero')].map(el=>({class:el.className,id:el.id,x:el.getBoundingClientRect().x,y:el.getBoundingClientRect().y,width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),
            headline:document.querySelector('h1')?{family:getComputedStyle(document.querySelector('h1')).fontFamily,font:getComputedStyle(document.querySelector('h1')).fontSize,width:document.querySelector('h1').getBoundingClientRect().width}:null,
          }));
          await page.screenshot({path:'wordpress-qa/'+kind+'-'+source.replace(/\W/g,'_')+'-'+width+'.png',fullPage:true});
          assert(data.scroll<=width+2,kind+' horizontal overflow '+source+' '+width+': '+JSON.stringify(data));
          if(alternate){assert.equal(data.headerCount,0,'Primary header leaked onto Home 02');assert.equal(data.alternativeHeader,1);}
          else assert.equal(data.headerCount,1);
          assert.equal(data.images.length,0,kind+' broken images: '+JSON.stringify(data.images));
          assert.equal(errors.length,0,kind+' JS errors: '+errors.join(';'));
          measurements.push(data);
          await page.close();
        }
        assert.deepEqual(measurements[0].h1,measurements[1].h1,'Headings changed after import: '+source);
        if(measurements[0].headline&&measurements[1].headline){
          assert.equal(measurements[0].headline.font,measurements[1].headline.font,'Headline typography changed: '+source);
          assert.equal(measurements[0].headline.family,measurements[1].headline.family,'Headline font family changed: '+source);
          assert(Math.abs(measurements[0].headline.width-measurements[1].headline.width)<=8,'Headline container width changed: '+source);
        }
        results.push({source,width,static:measurements[0],wordpress:measurements[1]});
      }
    }
    fs.writeFileSync('wordpress-qa/results.json',JSON.stringify(results,null,2));
    console.log('PASS: 8 static/WordPress viewport comparisons, complete headers, images, typography and no browser errors.');
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
