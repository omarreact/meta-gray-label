import fs from 'node:fs';
const esc=s=>String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
const expand=(s,copy)=>s.replace(/\{\{COPY:([a-z0-9]+)\}\}/g,(_,id)=>{if(!(id in copy))throw Error("Missing homepage copy "+id);return copy[id]});
const publicUrl=new URL(JSON.parse(fs.readFileSync('site-manifest.json','utf8')).site.publicUrl);
if(publicUrl.protocol!=='https:'||!publicUrl.pathname.endsWith('/'))throw Error('Public URL must be an HTTPS directory URL.');
const siteUrl=slug=>{const url=new URL('theme-1/',publicUrl);if(slug!=='home')url.searchParams.set('page',slug);return url.href;};
const sitemapOf=pages=>'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+pages.map(p=>'  <url><loc>'+esc(siteUrl(p.slug))+'</loc></url>').join('\n')+'\n</urlset>\n';
const robots='User-agent: *\nAllow: /\nSitemap: '+new URL('sitemap.xml',publicUrl).href+'\n';
function xmlOf(data){
return '<?xml version="1.0" encoding="UTF-8"?>\n<website schemaVersion="'+data.schemaVersion+'" repository="'+esc(data.repository)+'" sourceCommit="'+esc(data.sourceCommit)+'" pageCount="'+data.pageCount+'" partCount="'+data.partCount+'">\n'+data.pages.map(p=>'  <page path="'+esc(p.path)+'" file="'+esc(p.file)+'" route="'+esc(p.route)+'" slug="'+esc(p.slug)+'"><title>'+esc(p.title)+'</title><description>'+esc(p.description)+'</description><html>'+esc(p.html)+'</html></page>').join("\n")+'\n'+data.parts.map(p=>'  <part path="'+esc(p.path)+'" type="'+esc(p.type)+'"/>').join("\n")+'\n  <homeCopy>'+Object.entries(data.homeCopy).map(([k,v])=>'<text id="'+esc(k)+'">'+esc(v)+'</text>').join("")+'</homeCopy>\n'+Object.entries(data.homeLayouts).map(([k,v])=>'  <layout id="'+esc(k)+'" name="'+esc(data.themeNames[k])+'">'+esc(v)+'</layout>').join("\n")+'\n  <alternatePageTemplate>'+esc(data.alternatePageTemplate)+'</alternatePageTemplate>\n</website>\n';
}
const data=JSON.parse(fs.readFileSync('site-content.json','utf8'));
data.pages.find(p=>p.slug==='home').html=expand(data.homeLayouts['theme-1'],data.homeCopy);
data.pageCount=data.pages.length;data.partCount=data.parts.length;
const json=JSON.stringify(data,null,2)+'\n',xml=xmlOf(data),sitemap=sitemapOf(data.pages);
if(process.argv.includes('--check')){
  for(const [path,expected] of [['site-content.json',json],['pages.xml',xml],['sitemap.xml',sitemap],['robots.txt',robots]]){
    if(fs.readFileSync(path,'utf8')!==expected)throw Error(path+' is stale. Run node scripts/sync-content.mjs');
  }
  console.log('JSON/XML content and search index match.');
}else{
  for(const [path,content] of [['site-content.json',json],['pages.xml',xml],['sitemap.xml',sitemap],['robots.txt',robots]])fs.writeFileSync(path,content);
  console.log('Content mirror and search index updated.');
}
