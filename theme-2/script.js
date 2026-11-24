(async function(){
'use strict';
const theme=document.documentElement.dataset.layout;
const root=new URL('.',location.href);
const errorMode=document.documentElement.dataset.error==='true';
const read=async path=>{const r=await fetch(new URL(path,root));if(!r.ok)throw Error('Unable to load '+path);return r.text()};
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getMain=s=>s.match(/<main\b[\s\S]*?<\/main>/i)?.[0];
// Theme 2 presentation adapter: decorate, never duplicate or rewrite shared business content.
function applyTheme2Layout(markup) {
  const variant = markup.match(/\bmgl-design--(company|pricing|comparison|process|technical|article|directory|hub|service)\b/)?.[1] || (markup.includes('mgl-contact-page') ? 'contact' : 'service');
  return markup.replace(/<main\b/i,'<main data-layout="design2" data-mgl2-layout="'+variant+'"')
    .replace(/<section\b([^>]*\bclass="([^"]*)"[^>]*)>/gi,(tag,attrs,classes)=>{
      const list=classes.split(/\s+/);
      let block=list.includes('mgl-inner-hero-v2')||list.includes('mgl-contact-hero')?'banner':
        list.includes('mgl-inner-intro')?'intro':
        list.includes('mgl-inner-final')||list.includes('mgl-contact-next')?'cta':
        list.includes('mgl-inner-faq')?'faq':
        list.includes('mgl-inner-related')?'related':
        list.find(c=>c.startsWith('mgl-inner-pattern--'))?.slice('mgl-inner-pattern--'.length);
      if(!block && list.some(c=>c.startsWith('mgl-directory-'))) block='directory';
      if(!block && list.includes('mgl-inner-comparison-matrix'))block='matrix';
      return block ? '<section data-mgl2-block="'+block+'"'+attrs+'>' : tag;
    });
}

try{
const [raw,header,footer]=await Promise.all([read('../site-content.json'),read('header.html'),read('footer.html')]);
const d=JSON.parse(raw),slug=new URLSearchParams(location.search).get('page')||'home';
const known=new Set(d.pages.map(p=>p.slug));
let p=d.pages.find(x=>x.slug===slug),html;
if(errorMode||!p){
 p={title:'Page not found | Meta Grey Label',description:'Page not found.'};
 const m='<main id="main-content" class="mgl-inner-page"><section class="mgl-inner-hero-v2"><div class="mgl-inner-container"><h1>Page not found</h1><p>The requested page is unavailable.</p><a href="index.html">Return home</a></div></section></main>';
 if(theme==='theme-1'){const example=d.pages.find(x=>x.slug==='about-us').html;html=example.replace(getMain(example),()=>m).replace(/<title>[\s\S]*?<\/title>/i,'<title>'+p.title+'</title>');}
 else html=d.alternatePageTemplate.replace('{{PAGE_MAIN}}',()=>applyTheme2Layout(m)).replace('{{PAGE_TITLE}}',()=>p.title).replace('{{PAGE_DESCRIPTION}}',()=>p.description);
 html=html.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/gi,'').replace(/<\/head>/i,'<meta name="robots" content="noindex"></head>');
}
else if(slug==='home')html=d.homeLayouts[theme].replace(/\{\{COPY:([a-z0-9]+)\}\}/g,(_,id)=>{if(!(id in d.homeCopy))throw Error('Missing homepage copy '+id);return d.homeCopy[id]});
else if(theme==='theme-1')html=p.html;
else{let m=getMain(p.html);if(!m)throw Error('Missing page content');m=applyTheme2Layout(m);html=d.alternatePageTemplate.replace('{{PAGE_MAIN}}',()=>m).replace('{{PAGE_TITLE}}',()=>p.title).replace('{{PAGE_DESCRIPTION}}',()=>escape(p.description));}
html=html.replace(/<template\s+data-shared-part="header"\s*><\/template>/gi,()=>header).replace(/<template\s+data-shared-part="footer"\s*><\/template>/gi,()=>footer);
html=html.replace(/\bhref=(["'])([a-z0-9-]+)\.html([^"']*)\1/gi,(m,q,id,tail)=>known.has(id)&&id!=='home'?'href='+q+'./?page='+encodeURIComponent(id)+tail.replace(/^\?/,'&amp;')+q:id==='index'?'href='+q+'./'+tail+q:m);
html=html.replace(/<html\b/i,'<html data-mgl-theme="'+theme+'"');
const canonical=new URL('../theme-1/',root);
if(p.slug&&p.slug!=='home')canonical.searchParams.set('page',p.slug);
html=html.replace(/<\/head>/i,'<link rel="canonical" href="'+escape(canonical.href)+'"></head>');
document.open();document.write(html);document.close();
}catch(e){console.error(e);const status=document.getElementById('mgl-loading');if(status)status.textContent='Unable to load this page. Refresh to try again.';}
})();