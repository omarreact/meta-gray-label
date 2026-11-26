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
  let html=markup.replace(/<main\b/i,'<main data-layout="design2" data-mgl2-layout="'+variant+'"')
    .replace(/<section\b([^>]*\bclass="([^"]*)"[^>]*)>/gi,(tag,attrs,classes)=>{
      const list=classes.split(/\s+/);
      let block=list.includes('mgl-inner-hero-v2')||list.includes('mgl-contact-hero')?'banner':
        list.includes('mgl-inner-intro')?'intro':
        list.includes('mgl-inner-final')||list.includes('mgl-contact-next')?'cta':
        list.includes('mgl-inner-faq')?'faq':
        list.includes('mgl-inner-related')?'related':
        list.find(c=>c.startsWith('mgl-inner-pattern--'))?.slice('mgl-inner-pattern--'.length);
      if(!block&&list.some(c=>c.startsWith('mgl-directory-')))block='directory';
      if(!block&&list.includes('mgl-inner-comparison-matrix'))block='matrix';
      return block ? '<section data-mgl2-block="'+block+'"'+attrs+'>' : tag;
    });
  // Each banner contains only divs and paragraphs. Find an entire div by
  // balancing its tags so nested architecture panels remain intact.
  function takeDiv(source,name){
    const opening=new RegExp('<div\\b[^>]*\\bclass="[^"]*\\b'+name+'\\b[^"]*"[^>]*>','i');
    const match=opening.exec(source);
    if(!match)return {source,element:''};
    const token=/<\/?div\b[^>]*>/gi;
    token.lastIndex=match.index;
    let depth=0,part;
    while((part=token.exec(source))){
      depth+=/^<\/div/i.test(part[0])?-1:1;
      if(depth===0){
        const element=source.slice(match.index,token.lastIndex);
        return {source:source.slice(0,match.index)+source.slice(token.lastIndex),element};
      }
    }
    return {source,element:''};
  }
  const heroMatch=/<section\b[^>]*\bmgl-inner-hero-v2\b[^>]*>[\s\S]*?<\/section>/i.exec(html);
  const introMatch=/<section\b[^>]*\bmgl-inner-intro\b[^>]*>[\s\S]*?<\/section>/i.exec(html);
  if(heroMatch&&introMatch){
    let hero=heroMatch[0],intro=introMatch[0],m;
    const summary=/<p class="mgl-inner-summary">[\s\S]*?<\/p>/i.exec(hero);
    if(summary){hero=hero.replace(summary[0],'');intro=intro.replace(/(<div class="mgl-inner-container">)/i,'$1'+summary[0]);}
    m=takeDiv(hero,'mgl-inner-actions');hero=m.source;
    if(m.element)intro=intro.replace(/<\/div>\s*<\/section>$/i,m.element+'</div></section>');
    const note=/<p class="mgl-inner-device-note">[\s\S]*?<\/p>/i.exec(hero);
    if(note){hero=hero.replace(note[0],'');intro=intro.replace(/<\/div>\s*<\/section>$/i,note[0]+'</div></section>');}
    for(const name of ['mgl-inner-architecture','mgl-inner-decision']){
      m=takeDiv(hero,name);hero=m.source;
      if(m.element)intro=intro.replace(/<\/div>\s*<\/section>$/i,m.element+'</div></section>');
    }
    if(variant==='service'||variant==='technical'){
      const headings=[...html.matchAll(/<section\b[^>]*\bid="(inner-section-[^"]+)"[^>]*>[\s\S]*?<h2>([\s\S]*?)<\/h2>/gi)].slice(0,6);
      const nav=headings.map(([,id,label])=>'<a href="#'+id+'">'+label.replace(/<[^>]*>/g,' ').trim()+'</a>').join('');
      const aside='<aside class="mgl2-detail-sidebar"><nav aria-label="On this page"><p class="mgl-inner-eyebrow">Explore this solution</p>'+nav+'</nav></aside>';
      intro=intro.replace('class="mgl-inner-section mgl-inner-intro"','class="mgl-inner-section mgl-inner-intro mgl2-detail-intro"')
        .replace(/(<div class="mgl-inner-container">)/i,'$1'+aside+'<div class="mgl2-detail-content">')
        .replace(/<\/div>\s*<\/section>$/i,'</div></div></section>');
    }
    html=html.replace(heroMatch[0],hero).replace(introMatch[0],intro);
  }
  if(variant==='process'){
    const steps=[...html.matchAll(/<section\b[^>]*\bid="(inner-section-\d+)"[^>]*>[\s\S]*?<h2\b[^>]*>([\s\S]*?)<\/h2>/gi)].slice(0,6);
    if(steps.length){
      const links=steps.map(([,id,title],index)=>'<a href="#'+id+'"><span aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span>'+title.replace(/<[^>]*>/g,' ').trim().replace(/^\d+\s*\/?\s*/, '')+'</a>').join('');
      html=html.replace('<div class="mgl-inner-body">','<div class="mgl-inner-body"><nav class="mgl2-process-index" aria-label="Launch steps"><p class="mgl-inner-eyebrow">Explore the launch sequence</p><div class="mgl2-process-steps">'+links+'</div></nav>');
    }
  }
  if(variant==='article'){
    html=html.replace('<article class="mgl-inner-editorial-copy">','<article class="mgl-inner-editorial-copy"><figure class="mgl2-editorial-media"><img src="../assets/media/design2-resource-forex.jpg" alt="" loading="lazy" decoding="async"></figure>');
  }
  if(variant==='directory'||variant==='hub'){
    const images=['design2-resource-forex.jpg','design2-resource-about-1.jpg','design2-resource-about-2.jpg'];
    let index=0;
    html=html.replace(/(<article\b[^>]*class="[^"]*\bmgl-directory-article\b[^"]*"[^>]*>)/gi,tag=>tag+'<figure class="mgl2-list-media"><img src="../assets/media/'+images[index++%images.length]+'" alt="" loading="lazy" decoding="async"></figure>');
  }
  return html;
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
// Change this version when the independently styled Theme 2 CSS changes.
html=html.replace(/href="style\.css"/g,'href="style.css?v=inner-layout-20261125e"');
html=html.replace(/src="runtime\.js"/g,'src="runtime.js?v=theme2-brand-20261126"');
// Theme 2 owns its branding assets; shared content is unchanged.
html=html.replace(/assets\/media\/branding\/((?:logo-(?:dark|light|symbol)\.svg|favicon(?:-dark|-light)?\.svg|favicon-32\.png|icon-(?:192|512)\.png|apple-touch-icon\.png))/g,(match,name)=>'assets/media/branding/theme-2/'+name);
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
