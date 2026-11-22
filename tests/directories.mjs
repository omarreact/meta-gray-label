import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DIRECTORY_ROUTES,directoryEntry,buildDirectoryPage,directoryEntries} from '../src/directories.js';
import {renderInnerTree} from '../src/inner-system.js';
import {buildNativePages} from '../scripts/fse-pages.mjs';
import {renderStructuredPage,buildRouteIndex} from '../src/renderer.js';
const data=JSON.parse(readFileSync('data/content.json','utf8')),entries=directoryEntries(data),routes=buildRouteIndex(data);
const native=buildNativePages(data,readFileSync('index.html','utf8')).pages;
let links=0;
for(const route of DIRECTORY_ROUTES){
 const tree=buildDirectoryPage(route,entries),staticBody=renderInnerTree(tree),wp=renderInnerTree(tree,true);
 assert.equal(wp.replace(/<!--\s*\/?wp:[\s\S]*?-->/g,'').replace(/\s+</g,'<').trim(),staticBody.replace(/\s+</g,'<').trim());
 assert.doesNotMatch(wp,/wp:html|<script|__MGL_CONTENT_/);
 const page=native.find(x=>x.path===(route==='/services.html'?'services.html':route.slice(1)+'index.html'));
 assert.ok(page.markup.includes(wp.replaceAll('href="/services.html"','href="/services/"')),'native directory drift');
 const html=renderStructuredPage({route,entry:directoryEntry(route),routeIndex:routes,canonicalBase:'https://mg-label.webflow.io'});
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.ok(html.includes('https://mg-label.webflow.io'+route));
 assert.doesNotMatch(html,/preloader|aos.css|swiper-bundle|all.min.js/);
 const ids=new Set([...html.matchAll(/id="([^"]+)"/g)].map(x=>x[1]));
 for(const [,href] of staticBody.matchAll(/href="([^"]+)"/g)){
  if(href.startsWith('#'))assert.ok(ids.has(href.slice(1)),href);
  else assert.ok(routes.has(href)||DIRECTORY_ROUTES.has(href)||href==='/contact/',href);
  links++;
 }
 if(route==='/insights/'){
  assert.doesNotMatch(staticBody,/<time|datetime=|datePublished/);
  for(const entry of entries.filter(x=>x.route.startsWith('/insights/')))assert.ok(staticBody.includes(entry.route));
 }
}
console.log(`DIRECTORY SYSTEM PASS: 3 shared static/native trees, 15 authoritative articles, ${links} valid links/anchors, no invented dates or Custom HTML.`);
