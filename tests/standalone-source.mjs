import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const d=JSON.parse(fs.readFileSync('site-content.json','utf8'));
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
 assert(output.includes('<script src="runtime.js"></script>'),'Missing runtime');
 if(error)assert(output.includes('Page not found'));
 for(const m of output.matchAll(/\b(?:href|src|poster|action)=["']([^"']+)["']/gi))checkTarget(m[1],url);
 for(const m of output.matchAll(/\bstyle=["']([^"']+)["']/gi))for(const u of m[1].matchAll(/url\(\s*([^)"']+)\s*\)/gi))checkTarget(u[1],url);
 return output;
}
for(const theme of ['theme-1','theme-2']){
 for(const p of d.pages)await render(theme,p.slug);
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
