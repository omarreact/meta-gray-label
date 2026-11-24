import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root=process.cwd();
const innerDirectory=path.join(root,'inner-pages');
const innerEntries=fs.readdirSync(innerDirectory,{withFileTypes:true});
const innerPages=innerEntries.filter(entry=>entry.isFile()&&entry.name.endsWith('.html')).map(entry=>'inner-pages/'+entry.name).sort();

assert.equal(innerPages.length,51,'Expected 51 flat inner-page HTML files');
assert.equal(innerEntries.filter(entry=>entry.isDirectory()).length,0,'inner-pages must not contain nested folders');

const required=[
  'index.html','home-2/index.html','home-2/style.css','home-2/script.js','404.html','assets/js/includes.js','assets/js/custom.js',
  'assets/js/site-settings.json','assets/css/style.css','assets/media/branding/favicon.svg',
  'design-tokens.json','sitemap.xml'
];
for(const file of required)assert(fs.existsSync(file),'Missing '+file);

const tokens=JSON.parse(fs.readFileSync('design-tokens.json','utf8'));
assert(tokens.colors&&tokens.typography&&tokens.layout,'Incomplete design tokens');

const pages=['index.html','home-2/index.html','404.html',...innerPages];
let checked=0;
for(const file of pages){
  const html=fs.readFileSync(file,'utf8');
  assert(/<title>/i.test(html),'Missing title: '+file);
  if(file!=='404.html')assert(/<main\b/i.test(html),'Missing main: '+file);

  for(const match of html.matchAll(/\b(?:href|src|poster)=(["'])(.*?)\1/gi)){
    const value=match[2].trim().replace(/&amp;/g,'&');
    if(!value||/^(?:#|data:|mailto:|tel:|javascript:|\/\/)/i.test(value))continue;
    let url;
    try{url=new URL(value,'https://local.test/'+file);}catch{continue;}
    if(url.origin!=='https://local.test')continue;
    const local=decodeURIComponent(url.pathname).replace(/^\//,'');
    if(!local)continue;
    const target=local.endsWith('/')?local+'index.html':local;
    assert(fs.existsSync(target)&&fs.statSync(target).isFile(),`Broken ${file}: ${value} -> ${target}`);
    checked++;
  }

  if(file.startsWith('inner-pages/')){
    const slug=path.basename(file,'.html');
    const canonical='https://mg-label.webflow.io/inner-pages/'+slug+'.html';
    assert(html.includes('rel="canonical" href="'+canonical+'"'),'Wrong standalone canonical: '+file);
  }
}

const home2Styles='home-2/style.css';
const css=fs.readFileSync(home2Styles,'utf8');
for(const match of css.matchAll(/url\(\s*(["']?)(.*?)\1\s*\)/gi)){
  const value=match[2].trim();
  if(!value||/^(?:data:|https?:|\/\/|#|var\()/i.test(value))continue;
  const local=value.split(/[?#]/)[0];
  const target=path.normalize(path.join(path.dirname(home2Styles),local));
  assert(fs.existsSync(target)&&fs.statSync(target).isFile(),`Broken ${home2Styles}: ${value} -> ${target}`);
  checked++;
}

for(const file of ['index.html','home-2/index.html',...innerPages]){
  const html=fs.readFileSync(file,'utf8');
  if(file==='home-2/index.html'){
    assert.deepEqual(fs.readdirSync('home-2').sort(),['index.html','script.js','style.css'],'Home 02 must contain only three files');
    assert.deepEqual([...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]),['script.js'],'Home 02 script isolation');
    assert.deepEqual([...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css)["'][^>]*>/gi)].map(m=>m[1]),['style.css'],'Home 02 CSS isolation');
    const local=fs.readFileSync('home-2/script.js','utf8');
    assert(local.includes('function loadHome2Layout()')&&local.includes('mgl-home2-dev-typography-v2'),'Missing local navigation or typography runtime');
    assert(!/assets\/(?:js|css)\//.test(local.slice(local.indexOf('/* ===== Home 02 independent navigation'))),'Home 02 must not load global JS/CSS');
    continue;
  }
  const hasLoader=html.includes('assets/js/includes.js')||html.includes('../assets/js/includes.js');
  const hasBehavior=html.includes('assets/js/custom.js')||html.includes('../assets/js/custom.js');
  assert(hasLoader||hasBehavior,'Missing JavaScript behavior: '+file);
  if(html.includes('data-shared-part='))assert(hasLoader,'Shared UI template is missing its JavaScript loader: '+file);
}

console.log(`PASS: ${innerPages.length} flat inner pages and ${checked} local links/assets.`);
