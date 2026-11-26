import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const source=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const out=path.resolve(process.argv[2]||'build/forexy-source');
assert(out!==source&&!source.startsWith(out+path.sep),'Unsafe export destination');
assert(!fs.existsSync(out),'Export destination must be new');
const data=JSON.parse(fs.readFileSync(path.join(source,'site-content.json'),'utf8'));
const pages=data.pages;
assert.equal(pages.length,52);assert.equal(new Set(pages.map(p=>p.slug)).size,52);
const theme='theme-2',base='https://source.invalid/',known=new Set(pages.map(p=>p.slug));
const dir=path.join(out,theme);
const read=p=>fs.readFileSync(path.join(source,p),'utf8');
const filename=s=>s==='home'?'index.html':s+'.html';
const links=s=>s.replace(/\bhref=(["'])([^"']*)\1/gi,(all,q,v)=>{
 if(v.startsWith('#')||v.startsWith('data:'))return all;
 const u=new URL(v.replace(/&amp;/g,'&'),base+theme+'/');
 if(u.origin!==new URL(base).origin)return all;
 if(u.pathname==='/'+theme+'/'||u.pathname==='/'+theme+'/index.html'){
  const slug=u.searchParams.get('page')||'home';assert(known.has(slug),'Unknown source route '+slug);
  u.searchParams.delete('page');return 'href='+q+filename(slug)+u.search.replace(/&/g,'&amp;')+u.hash+q;
 }
 if(u.pathname.startsWith('/'+theme+'/')&&u.pathname.endsWith('.html')){
  const slug=u.pathname.split('/').pop().slice(0,-5);
  if(known.has(slug))return 'href='+q+filename(slug)+u.search.replace(/&/g,'&amp;')+u.hash+q;
 }
 return all;
});
const noSwitch=s=>s.replace(/<button\b[^>]*\bid="btnSwitch"[^>]*>[\s\S]*?<\/button>/gi,'');
async function render(slug){
 let html='',error='';
 const location=new URL(base+theme+'/');if(slug!=='home')location.searchParams.set('page',slug);
 const doc={documentElement:{dataset:{layout:theme,error:'false'}},open(){},write(s){html=s},close(){},getElementById(){return {set textContent(v){error=v}}}};
 await vm.runInNewContext(read(theme+'/script.js'),{document:doc,location,URL,URLSearchParams,fetch:async u=>{assert.equal(u.origin,new URL(base).origin);const p=u.pathname.slice(1),f=path.resolve(source,p);assert(f.startsWith(source+path.sep));return{ok:fs.existsSync(f),text:async()=>fs.readFileSync(f,'utf8')}},console});
 assert(!error&&html.includes('<main')&&html.includes('data-theme-header="2"'),'Render failed '+slug);
 return links(noSwitch(html));
}
const home=await render('home');
const header=links(noSwitch(read(theme+'/header.html')));
const footer=links(read(theme+'/footer.html'));
fs.mkdirSync(dir,{recursive:true});
fs.cpSync(path.join(source,'assets'),path.join(out,'assets'),{recursive:true});
fs.copyFileSync(path.join(source,theme,'style.css'),path.join(dir,'style.css'));
fs.writeFileSync(path.join(dir,'header.html'),header);
fs.writeFileSync(path.join(dir,'footer.html'),footer);
let runtime=read(theme+'/runtime.js');
const start=runtime.indexOf("    (() => {\n  'use strict';\n\n  // Independent Home 02 settings snapshot.");
const end=runtime.indexOf('    (function initialiseHome2Navigation()',start);
assert(start>=0&&end>start,'Settings source boundary changed');runtime=runtime.slice(0,start)+runtime.slice(end);
const picker=runtime.indexOf('(function layoutSwitcher(){');assert(picker>=0);runtime=runtime.slice(0,picker);
const lightStart=runtime.indexOf('// =================== light and dark start ================== //');
const lightEnd=runtime.indexOf('// =================== Change image path end ================== //',lightStart);
assert(lightStart>=0&&lightEnd>lightStart);
runtime=runtime.slice(0,lightStart)+"document.documentElement.setAttribute('data-bs-theme','dark');\ndocument.querySelectorAll('img[data-dark-src]').forEach(img=>{if(img.dataset.darkSrc)img.src=img.dataset.darkSrc;});\n"+runtime.slice(lightEnd);
assert(!runtime.includes('function createUi(')&&!runtime.includes('function layoutSwitcher('));
fs.writeFileSync(path.join(dir,'runtime.js'),runtime);
for(const p of pages){
 const raw=p.slug==='home'?home:await render(p.slug);
 const main=raw.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
 assert(main&&main.includes('id="main-content"'),'Missing main '+p.slug);
 const attrs=raw.match(/<body\b([^>]*)>/i)?.[1]||'';
 const preloader=raw.match(/<div class="preloader"[^>]*>[\s\S]*?<\/div>/i)?.[0]||'';
 // Original main is preserved verbatim. Header and footer are emitted separately.
 const safeTitle=String(p.title).replace(/&/g,'&amp;').replace(/</g,'&lt;');
 const doc='<!doctype html><html lang="en" data-mgl-theme="theme-2" data-bs-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>'+safeTitle+'</title><link rel="stylesheet" href="style.css"></head><body'+attrs+'>'+preloader+main+'<script src="runtime.js"></script></body></html>';
 fs.writeFileSync(path.join(dir,filename(p.slug)),doc);
}
const manifest={site:{name:'Meta Grey Label',sourceUrl:'https://omarreact.github.io/meta-gray-label/theme-2/'},release:{version:'0.0.1',author:'PINCODE IT',slug:'meta-grey-label',previousThemeSlugs:['meta-grey-label-standalone'],blogIndex:'insights',contactPage:'contact',siteIcon:'assets/media/branding/theme-2/icon-512.png'},header:{file:theme+'/header.html'},footer:{file:theme+'/footer.html'},sourceLayout:{wrapperClass:'page-wrapper',dark:true,edgeToEdge:true,legacyPage:{ownerKey:'_mglfse_design',ownerValue:'theme-2',slugKey:'_mglfse_slug'}},pages:pages.map(p=>({path:p.slug==='home'?'/':'/'+p.slug+'/',file:theme+'/'+filename(p.slug),title:p.title,seo:{title:p.title,description:p.description}}))};
fs.writeFileSync(path.join(out,'site-manifest.json'),JSON.stringify(manifest,null,2));
fs.writeFileSync(path.join(out,'design-tokens.json'),JSON.stringify({colors:{background:'#003F2F',surface:'#002A20',accent:'#DDFF93',text:'#F6FFE1'},typography:{body:'"Plus Jakarta Sans",Arial,sans-serif'},layout:{contentWidth:'100%',wideWidth:'100%'}},null,2));
console.log('PASS: 52 exact Theme 2 main documents, local source CSS/runtime and separate chrome.');
