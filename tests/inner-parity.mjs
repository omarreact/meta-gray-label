/** Compare only the redesigned content; static and native site chrome are independent. */
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdirSync,writeFileSync } from 'node:fs';
const dir='tmp/design-parity';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const report=[];
const route='/forex-grey-label/mt5-grey-label/';
try{
 for(const theme of ['light','dark'])for(const width of [360,390,430,768,1024,1180,1440,1920]){
  const pages=[];
  for(const base of [process.env.MGL_SOURCE_BASE||'http://127.0.0.1:4173',process.env.MGL_WP_BASE||'http://localhost:8888']){
   const ctx=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
   const p=await ctx.newPage();await p.goto(base+route+'?theme='+theme,{waitUntil:'networkidle'});
   pages.push(await p.evaluate(()=>{
    const root=document.querySelector('.mgl-design'),origin=root.getBoundingClientRect();
    return {text:root.innerText.replace(/\s+/g,' ').trim(),width:origin.width,elements:[...root.querySelectorAll('h1,h2,h3,.mgl-inner-summary,.mgl-inner-disclosure,.mgl-inner-card')].map(e=>{
     const r=e.getBoundingClientRect(),s=getComputedStyle(e);return {text:e.textContent.trim(),x:r.x-origin.x,y:r.y-origin.y,width:r.width,height:r.height,fontSize:s.fontSize,lineHeight:s.lineHeight,color:s.color};
    })};
   }));await ctx.close();
  }
  const [a,b]=pages;assert.equal(a.text,b.text,'content drift');assert.equal(a.elements.length,b.elements.length);
  let worst=0;
  for(let i=0;i<a.elements.length;i++){
   const x=a.elements[i],y=b.elements[i];assert.equal(x.text,y.text);assert.equal(x.fontSize,y.fontSize);assert.equal(x.lineHeight,y.lineHeight);assert.equal(x.color,y.color);
   for(const key of ['x','y','width','height']){const delta=Math.abs(x[key]-y[key]);worst=Math.max(worst,delta);assert.ok(delta<4,`${theme} ${width} ${x.text.slice(0,35)} ${key}: ${x[key]} vs ${y[key]}`)}
  }
  report.push({theme,width,maxGeometryDifference:worst,elements:a.elements.length});
 }
 console.log('INNER PARITY PASS: identical text, type, colors and content geometry across 16 native/static cases.');
}finally{writeFileSync(dir+'/inner-parity.json',JSON.stringify(report,null,2));await browser.close()}
