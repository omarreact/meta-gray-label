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
  const out=markup.replace(/<main\b/i,'<main data-layout="design2" data-mgl2-layout="'+variant+'"')
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
  return composeTheme2(out,variant);
}

function composeTheme2(out,variant){
  // Move the title and breadcrumb into the independent full-width title band.
  // All original content remains in its original order below the band.
  out=out.replace(/(<section\b[^>]*data-mgl2-block="banner"[^>]*>)([\s\S]*?)<\/section>/i,(whole,open,content)=>{
    const title=content.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)?.[0];
    if(!title)return whole;
    const crumb=content.match(/<p class="mgl-inner-breadcrumb">[\s\S]*?<\/p>/i)?.[0]||'';
    const rest=content.replace(title,'').replace(crumb,'');
    const context=rest.replace(/<[^>]+>/g,'').trim();
    return open+'<div class="mgl-inner-container mgl2-title-band">'+title+crumb+'</div></section>'+
      (context?'<div class="mgl2-hero-context '+(variant==='contact'?'mgl-contact-hero':'mgl-inner-hero-v2')+'">'+rest+'</div>':'');
  });
  const sections=[...out.matchAll(/<section\b[^>]*\bid="(inner-section-\d+)"[^>]*>[\s\S]*?<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)];
  const nav=(label,cls)=>'<nav class="'+cls+'" aria-label="'+label+'">'+
    sections.map((m,i)=>'<a href="#'+m[1]+'"><span aria-hidden="true">'+String(i+1).padStart(2,'0')+'</span> '+m[2].replace(/<[^>]*>/g,' ').trim()+'</a>').join('')+'</nav>';
  if((variant==='service'||variant==='technical')&&sections.length){
    // Use the original service-details pattern: one independent sidebar and one content column.
    const boundary=/<\/div>\s*<section\b[^>]*data-mgl2-block="related"/i;
    if(boundary.test(out)){
      out=out.replace(boundary,m=>'</div>'+m);
      out=out.replace('<div class="mgl-inner-body">','<div class="mgl-inner-body mgl2-service-flow"><aside class="mgl2-service-sidebar"><p class="mgl-inner-eyebrow">On this page</p>'+nav('Section navigation','mgl2-section-nav')+'<a class="mgl2-sidebar-cta" href="contact.html">Discuss your project →</a></aside><div class="mgl2-service-content">');
    }
  }
  if(variant==='company'){
    out=out.replace(/(<section\b[^>]*data-mgl2-block="intro"[^>]*>\s*<div class="mgl-inner-container">)([\s\S]*?)(<\/div>\s*<\/section>)/i,(_,a,b,c)=>a+'<figure class="mgl2-company-media"><img src="../assets/media/design2-resource-about-1.jpg" alt="" loading="lazy" decoding="async"></figure><div class="mgl2-company-copy">'+b+'</div>'+c);
  }
  if(variant==='process'&&sections.length){
    out=out.replace(/(<div class="mgl-inner-body">)/, '$1<div class="mgl2-process-index"><p class="mgl-inner-eyebrow">Explore the launch sequence</p>'+nav('Launch steps','mgl2-step-nav')+'</div>');
  }
  return out;
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
// Allow browser zoom on all Theme 2 pages, including the legacy homepage template.
html=html.replace(/<meta\b[^>]*\bname=["']viewport["'][^>]*>/gi,'<meta name="viewport" content="width=device-width, initial-scale=1">');
html=html.replace(/<html\b/i,'<html data-mgl-theme="'+theme+'"');
// Canonicalize valid alternate pages only; a missing route is not the homepage.
html=html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,'');
if(!errorMode&&p.slug){
 const canonical=new URL('../theme-1/',root);
 if(p.slug!=='home')canonical.searchParams.set('page',p.slug);
 html=html.replace(/<\/head>/i,'<link rel="canonical" href="'+escape(canonical.href)+'"></head>');
}
// Restore the FAQ fragment after asynchronous homepage rendering.
if(slug==='home'&&!errorMode&&location.hash==='#faq'){
 html=html.replace(/<\/body>/i,()=>'<script>window.addEventListener("load",function(){var target=document.getElementById("faq");if(!target)return;var header=document.querySelector(".mgl-site-header");var offset=(header?header.getBoundingClientRect().height:78)+40;window.scrollTo({top:Math.max(0,window.scrollY+target.getBoundingClientRect().top-offset),behavior:"auto"});},{once:true});<\/script></body>');
}
document.open();document.write(html);document.close();
}catch(e){console.error(e);const status=document.getElementById('mgl-loading');if(status)status.textContent='Unable to load this page. Refresh to try again.';}
})();