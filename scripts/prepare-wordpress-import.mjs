#!/usr/bin/env node
// Prepare reproducible HTML import sources. Theme generation stays in WpBlockThemeFSE.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const check=process.argv.includes('--check');
const outputs=new Map();
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const manifest=JSON.parse(read('site-manifest.json'));
const includes=read('assets/js/includes.js');
const match=includes.match(/const sharedParts = \{header:("(?:\\.|[^"\\])*"),footer:("(?:\\.|[^"\\])*")\};/);
if(!match) throw Error('Shared header/footer contract changed; update the source extractor.');
const shared={header:JSON.parse(match[1]),footer:JSON.parse(match[2])};

function localUrl(value,source){
  const decoded=value.replace(/&amp;/g,'&');
  if(!decoded||/^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test(decoded))return value;
  const suffix=decoded.match(/[?#].*$/)?.[0]||'';
  const raw=decoded.slice(0,decoded.length-suffix.length);
  const local=raw.startsWith('/')?path.posix.normalize(raw):path.posix.resolve('/',path.posix.dirname(source),raw);
  const trailing=raw.endsWith('/')&&!local.endsWith('/')?'/':'';
  return local+trailing+suffix;
}
function tagEnd(source,start){
  let quote='';
  for(let i=start+1;i<source.length;i++){
    const char=source[i];
    if(quote){if(char===quote)quote='';}else if(char==='"'||char==="'")quote=char;else if(char==='>')return i+1;
  }
  throw Error('Unterminated HTML tag');
}
function transform(source,file,{snapshot=false,standalone=false}={}){
  let out='',cursor=0;
  while(cursor<source.length){
    const start=source.indexOf('<',cursor);
    if(start<0){out+=source.slice(cursor);break;}
    out+=source.slice(cursor,start);
    if(source.startsWith('<!--',start)){
      const end=source.indexOf('-->',start+4);if(end<0)throw Error('Unterminated HTML comment');
      out+=source.slice(start,end+3);cursor=end+3;continue;
    }
    const end=tagEnd(source,start);
    let tag=source.slice(start,end);
    const name=tag.match(/^<\s*([\w:-]+)/)?.[1]?.toLowerCase();
    tag=tag.replace(/\b(href|src|poster|action)\s*=\s*(["'])(.*?)\2/gis,(whole,key,quote,value)=>{
      let url=localUrl(value,file);
      if(snapshot&&name==='script'&&url==='/assets/js/includes.js')url='/assets/js/wordpress.js';
      return key+'='+quote+url+quote;
    });
    tag=tag.replace(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi,(whole,quote,value)=>'url('+quote+localUrl(value,file)+quote+')');
    if(snapshot&&name==='body'){
      const cls=standalone?'mgl-wordpress-import mgl-wordpress-standalone':'mgl-wordpress-import';
      tag=/\bclass\s*=/.test(tag)?tag.replace(/\bclass\s*=\s*(["'])(.*?)\1/s,(whole,q,v)=>'class='+q+v+' '+cls+q):tag.replace(/>$/,' class="'+cls+'">');
    }
    if(snapshot&&/^<\/head\s*>$/i.test(tag))out+='<link rel="stylesheet" href="/assets/css/wordpress-import.css">\n';
    out+=tag;cursor=end;
    if(name==='script'||name==='style'){
      const close=source.toLowerCase().indexOf('</'+name,cursor);
      if(close<0)throw Error('Unterminated '+name+' in '+file);
      const raw=source.slice(cursor,close);
      out+=name==='style'?raw.replace(/url\(\s*(["']?)([^)'"\s]+)\1\s*\)/gi,(whole,q,v)=>'url('+q+localUrl(v,file)+q+')'):raw;
      cursor=close;
    }
  }
  return out;
}
for(const part of ['header','footer'])outputs.set('pin-import/'+part+'.html',transform(shared[part],'index.html'));
const pages=manifest.pages.map(page=>({...page}));
if(!pages.some(p=>p.sourceFile==='index-2.html'||p.file==='index-2.html'))pages.push({path:'/index-2/',file:'index-2.html',title:'Home 02 — Brokerage Technology',status:'publish',order:52,template:'standalone',seo:{title:'Meta Grey Label | Home 02 — Brokerage Technology'}});
for(const page of pages){
  const source=page.sourceFile||page.file.replace(/^pin-import\/pages\//,'');
  if(!fs.existsSync(path.join(root,source)))throw Error('Missing canonical source '+source);
  page.sourceFile=source;
  page.file='pin-import/pages/'+source;
  outputs.set(page.file,transform(read(source),source,{snapshot:true,standalone:page.template==='standalone'}));
}
manifest.pages=pages;
manifest.wordpress={profile:'full-width-static-v1',pages:pages.length,home:'/',independentHome:'/index-2/',notes:'Generated import HTML preserves the canonical standalone website. Build the theme/WXR with WpBlockThemeFSE.'};
outputs.set('site-manifest.json',JSON.stringify(manifest,null,2)+'\n');
const inventory={version:1,pages:pages.map(p=>({path:p.path,source:p.sourceFile,import:p.file,template:p.template||'default'})),externalHosts:[...new Set(pages.flatMap(p=>[...read(p.sourceFile).matchAll(/https?:\/\/([^/\s"'<>]+)/g)].map(m=>m[1])))].sort()};
outputs.set('pin-import/inventory.json',JSON.stringify(inventory,null,2)+'\n');
let stale=[];
for(const [file,rawContents] of outputs){
  const contents=rawContents.replace(/\r\n/g,'\n').replace(/[ \t]+$/gm,'');
  if(check){if(!fs.existsSync(path.join(root,file))||read(file)!==contents)stale.push(file);}
  else{fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),contents);}
}
if(stale.length)throw Error('WordPress import snapshots are stale: '+stale.join(', '));
console.log((check?'Verified':'Prepared')+' '+pages.length+' pages, full shared parts, independent Home 02 and import inventory.');
