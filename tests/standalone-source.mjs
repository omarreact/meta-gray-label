import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const d=JSON.parse(fs.readFileSync('site-content.json','utf8'));
const manifest=JSON.parse(fs.readFileSync('site-manifest.json','utf8'));
assert(manifest.site.publicUrl.startsWith('https://')&&manifest.site.publicUrl.endsWith('/'),'Canonical site URL must be an HTTPS directory');
assert(fs.readFileSync('robots.txt','utf8').includes('Sitemap: '+manifest.site.publicUrl+'sitemap.xml'));
assert.equal((fs.readFileSync('sitemap.xml','utf8').match(/<url>/g)||[]).length,52);
for(const theme of manifest.themes){
 assert(fs.existsSync(theme.header)&&fs.existsSync(theme.footer),'Missing independent theme chrome '+theme.id);
 assert(theme.header.startsWith(theme.id+'/')&&theme.footer.startsWith(theme.id+'/'),'Theme chrome points outside its directory '+theme.id);
}
const ids=new Set(d.pages.map(x=>x.slug));
assert.equal(d.pages.length,52);assert.equal(ids.size,52);
assert.equal(d.pages.filter(x=>x.slug!=='home').length,51);
assert.equal(d.themeNames['theme-1'],'Meta Grey Label');
assert.equal(d.themeNames['theme-2'],'Meta Grey Label');
assert.deepEqual(fs.readdirSync('theme-1').sort(),fs.readdirSync('theme-2').sort());
assert(!fs.existsSync('inner-pages'));assert(!fs.existsSync('home-2'));
assert.deepEqual(fs.readdirSync('theme-1').sort(),['404.html','footer.html','header.html','index.html','runtime.js','script.js','style.css']);
const host='https://example.test',prefix='/meta-gray-label/';
function checkTarget(raw,here){const v=raw.replace(/&amp;/g,'&');if(!v||v.startsWith('#')||v.startsWith('data:'))return;
const u=new URL(v,here);assert.equal(u.origin,host,'External resource '+v);assert(u.pathname.startsWith(prefix),'Outside site '+v);
let p=decodeURIComponent(u.pathname.slice(prefix.length));if(p.endsWith('/'))p+='index.html';
assert(fs.existsSync(p),'Missing target '+p+' from '+here);
if(u.searchParams.has('page'))assert(ids.has(u.searchParams.get('page')),'Unknown route '+u.href);}
async function render(theme,slug,error=false){
 const url=new URL(prefix+theme+'/',host);if(slug!=='home')url.searchParams.set('page',slug);
 let output='',failed=false;
 const doc={documentElement:{dataset:{layout:theme,error:String(error)}},open(){},write(s){output=s},close(){},getElementById(){return {set textContent(v){failed=true}}}};
 await vm.runInNewContext(fs.readFileSync(theme+'/script.js','utf8'),{document:doc,location:url,URL,URLSearchParams,fetch:async u=>{let p=u.pathname.slice(prefix.length);return{ok:fs.existsSync(p),text:async()=>fs.readFileSync(p,'utf8')}},console});
 assert(!failed&&output.includes('<main'),'Renderer failed '+theme+'/'+slug);
 assert(output.includes('data-mgl-theme="'+theme+'"'));
 assert(output.includes('data-site-header')&&/<footer\b/i.test(output),'Missing chrome');
 assert(!/\{\{(?:COPY:|PAGE_)/.test(output),'Unresolved template token');
 assert(!/<template\s+data-shared-part=/.test(output),'Unresolved chrome');
 assert(output.includes('<script src="runtime.js'+(theme==='theme-2'?'?v=inner-layout-20261125e':'')+'"></script>'),'Missing runtime');
 if(error)assert(output.includes('Page not found'));
 if(theme==='theme-2'){
   assert(output.includes('data-theme-header="2"'),'Independent Theme 2 header missing');
   assert(output.includes('mgl2-topbar'),'Theme 2 utility header missing');
   const viewport=output.match(/<meta\b[^>]*\bname=["']viewport["'][^>]*>/i)?.[0]||'';
   assert(viewport.includes('width=device-width')&&!/user-scalable\s*=\s*(?:0|no)|maximum-scale\s*=/i.test(viewport),'Theme 2 must allow browser zoom');
   assert(output.includes('href="./#faq">FAQs'),'Theme 2 footer FAQ must link to home');
   assert(/class="footer-logo"[^>]*>[\s\S]*?<img[^>]*alt="Meta Grey Label"/i.test(output),'Theme 2 footer logo must have an accessible name');
   if(error)assert(!/<link\b[^>]*rel=["']canonical["']/i.test(output),'Error page must not canonicalize to homepage');
   else assert.equal((output.match(/<link\b[^>]*rel=["']canonical["']/gi)||[]).length,1,'Expected one canonical');
   if(slug!=='home'){
     assert(/<main\b[^>]*data-mgl2-layout="[^"]+"/.test(output),'Theme 2 layout adapter missing');
     assert(output.includes('data-mgl2-block="banner"'),'Theme 2 banner missing');
   }
 }else{assert(!output.includes('data-theme-header="2"'),'Theme 2 header leaked into Theme 1');}

 for(const m of output.matchAll(/\b(?:href|src|poster|action)=["']([^"']+)["']/gi))checkTarget(m[1],url);
 for(const m of output.matchAll(/\bstyle=["']([^"']+)["']/gi))for(const u of m[1].matchAll(/url\(\s*([^)"']+)\s*\)/gi))checkTarget(u[1],url);
 return output;
}
for(const theme of ['theme-1','theme-2']){
 for(const p of d.pages){
   const output=await render(theme,p.slug);
   if(theme==='theme-2'&&['about-us','mt5-grey-label','grey-label-pricing','white-label-vs-grey-label'].includes(p.slug)){
     const banner=output.match(/<section\b[^>]*data-mgl2-block="banner"[\s\S]*?<\/section>/i)?.[0]||'';
     const intro=output.match(/<section\b[^>]*data-mgl2-block="intro"[\s\S]*?<\/section>/i)?.[0]||'';
     assert(banner.includes('<h1>')&&!banner.includes('mgl-inner-summary')&&!banner.includes('mgl-inner-architecture'),'Title banner must be independent '+p.slug);
     assert(intro.includes('mgl-inner-summary')&&intro.includes('mgl-inner-actions'),'Page copy or actions lost '+p.slug);
     if(p.slug==='mt5-grey-label')assert(intro.includes('mgl2-detail-sidebar')&&intro.includes('mgl-inner-architecture')&&/href="#inner-section-1"/.test(intro),'Service detail composition incomplete');
   }
   if(theme==='theme-2'&&p.slug==='brokerage-launch-process'){
     assert(output.includes('class="mgl2-process-index"')&&output.includes('aria-label="Launch steps"'),'Launch sequence navigation missing');
     assert(/href="#inner-section-1"/.test(output),'Launch step target missing');
     assert.equal((output.match(/class="mgl2-process-steps"[\s\S]*?<\/div>/)?.[0].match(/href="#inner-section-/g)||[]).length,6,'Launch index should list six stages');
   }
   if(theme==='theme-2'&&p.slug==='insights')assert(output.includes('class="mgl2-list-media"'),'Directory media missing');
   if(theme==='theme-2'&&p.slug==='metatrader-grey-label-licensing-what-it-includes-and-why-it-matters')assert(output.includes('class="mgl2-editorial-media"'),'Article media missing');
 }
 await render(theme,'not-a-route',true);
 const css=fs.readFileSync(theme+'/style.css','utf8');
 for(const m of css.matchAll(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi))checkTarget(m[2].trim(),new URL(prefix+theme+'/style.css',host));
}
const old404=fs.readFileSync('404.html','utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
for(const [old,expected] of [['inner-pages/about-us.html','theme-1/'],['home-2/inner-pages/contact.html','theme-2/'],['home-2/index.html','theme-2/']]){
 let redirect;const u=new URL(prefix+old,host);const location={pathname:u.pathname,origin:u.origin,search:u.search,hash:u.hash,replace(v){redirect=new URL(v)}};
 vm.runInNewContext(old404,{location,URL});
 assert.equal(redirect.pathname,prefix+expected);
 if(old.includes('inner-pages/'))assert(ids.has(redirect.searchParams.get('page')));
}
console.log('PASS: 104 page renderings, 2 error pages, local links, assets, and legacy redirects.');
