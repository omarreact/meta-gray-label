/* mglsa-v21: clean routes and authenticated settings. */
const mglsaConfig=window.__mglStandalone||null;
const mglsaRoot=mglsaConfig?new URL(mglsaConfig.home):new URL('../../../../../',root);
const mglsaSession=mglsaConfig?mglsaConfig.session:new URL('wp-admin/admin-ajax.php?action=mglsa_session',mglsaRoot).href;
const mglsaJson=v=>JSON.stringify(v).replace(/</g,'\\u003c');
const mglsaPath=(t,id)=>new URL((t==='theme-2'?'theme-2/':'')+(id&&id!=='home'?encodeURIComponent(id)+'/':''),mglsaRoot);
const mglsaCurrent=mglsaPath(theme,p.slug||'home');
if(mglsaConfig){
  html=html.replace(/\bhref=(["'])([^"']*)\1/gi,(all,q,value)=>{
    if(!value)return all;
    let u;try{u=new URL(value.replace(/&amp;/g,'&'),root)}catch(e){return all}
    if(value.startsWith('#'))return 'href='+q+escape(mglsaCurrent.href+value)+q;
    if(u.origin!==root.origin)return all;
    const website=new URL('../',root);
    let rel=u.pathname.startsWith(website.pathname)?u.pathname.slice(website.pathname.length):'';
    let m=/^(theme-[12])\/(?:index\.html)?$/.exec(rel);
    if(m){const id=u.searchParams.get('page')||'home';if(!known.has(id))return all;const dest=mglsaPath(m[1],id);u.searchParams.delete('page');dest.search=u.search;dest.hash=u.hash;return 'href='+q+escape(dest.href)+q;}
    if(u.pathname===website.pathname||rel==='index.html'){const dest=mglsaPath('theme-1','home');dest.search=u.search;dest.hash=u.hash;return 'href='+q+escape(dest.href)+q;}
    return all;
  });
  html=html.replace(/<link\b[^>]*\brel=["']canonical["'][^>]*>/gi,'');
  if(p.slug)html=html.replace(/<\/head>/i,'<link rel="canonical" href="'+escape(mglsaPath('theme-1',p.slug).href)+'"></head>');
  html=html.replace(/<head\b[^>]*>/i,tag=>tag+'<base href="'+escape(root.href)+'">');
}
const mglsaGate='<style>html:not([data-mglps-allowed="1"]) .mgl-dev-settings-toggle,html:not([data-mglps-allowed="1"]) .mgl-dev-settings-panel,html:not([data-mglps-allowed="1"]) #mgl-dev-settings-toggle,html:not([data-mglps-allowed="1"]) #mgl-dev-settings-panel{display:none!important;visibility:hidden!important;pointer-events:none!important}</style><script>(function(){window.__mglStandalone='+mglsaJson(mglsaConfig)+';var h=document.documentElement;function check(){h.removeAttribute("data-mglps-allowed");h.classList.remove("mgl-settings-open");return fetch('+mglsaJson(mglsaSession)+',{credentials:"same-origin",cache:"no-store"}).then(function(r){return r.ok?r.json():null}).then(function(j){var ok=!!(j&&j.success&&j.data&&j.data.allowed===true);if(ok)h.setAttribute("data-mglps-allowed","1");return ok}).catch(function(){return false})}window.__mglpsAccess=check();window.addEventListener("pageshow",function(e){if(e.persisted)window.__mglpsAccess=check()});document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")window.__mglpsAccess=check()})})();<\/script>';
html=html.replace(/<head\b[^>]*>/i,tag=>tag+mglsaGate);
html=html.replace(/(\bsrc=["']runtime\.js)([^"']*)(["'])/gi,(_,a,b,c)=>a+b+(b.includes('?')?'&':'?')+'mglsa=21'+c);
