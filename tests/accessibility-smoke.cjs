const {chromium}=require('playwright');
const {AxeBuilder}=require('@axe-core/playwright');

const routes=['home','about-us','mt5-grey-label','grey-label-pricing',
  'brokerage-launch-process','insights',
  'metatrader-grey-label-licensing-what-it-includes-and-why-it-matters','contact'];
const base='http://127.0.0.1:4173/';

(async()=>{
  const browser=await chromium.launch({headless:true});
  const failures=[];
  try{
    for(const layout of ['theme-1','theme-2'])for(const slug of routes)for(const width of [390,1440]){
      const context=await browser.newContext({viewport:{width,height:900}});
      const page=await context.newPage();
      const url=new URL(layout+'/',base);
      url.searchParams.set('theme','light');
      if(slug!=='home')url.searchParams.set('page',slug);
      try{
        await page.goto(url.href,{waitUntil:'domcontentloaded'});
        await page.locator('#main-content').waitFor({timeout:15000});
        const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
        const violations=result.violations.filter(v=>v.impact==='critical'||v.impact==='serious');
        for(const v of violations){
          failures.push(`${layout}/${slug}@${width}: ${v.id} (${v.impact}): ${v.nodes.slice(0,3).map(n=>n.target.join(' ')).join(', ')}`);
        }
      }finally{await context.close();}
    }
  }finally{await browser.close();}
  if(failures.length)throw Error('Accessibility violations:\n'+failures.join('\n'));
  console.log('PASS: representative page families in both themes at mobile and desktop widths meet automated critical/serious WCAG checks.');
})().catch(e=>{console.error(e);process.exitCode=1});
