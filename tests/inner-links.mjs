import assert from 'node:assert/strict';
import { readFileSync,existsSync } from 'node:fs';
import { buildRouteIndex,renderStructuredPage } from '../src/renderer.js';
import { applyBasePathToHtml,applyRelativeRootToHtml } from '../scripts/static-site-lib.mjs';
import { INNER_ROLLOUT } from '../src/inner-system.js';
const d=JSON.parse(readFileSync('data/content.json','utf8')),routes=buildRouteIndex(d);
const special=new Set(['/','/contact/','/services.html','/services/','/solutions/','/insights/']);
let count=0;
for(const route of INNER_ROLLOUT){
 const html=renderStructuredPage({route,entry:routes.get(route),routeIndex:routes,canonicalBase:'https://mg-label.webflow.io'});
 const body=html.match(/<main[\s\S]*?<\/main>/)[0];
 const ids=new Set([...body.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
 for(const [,href] of body.matchAll(/\bhref="([^"]+)"/g)){
  if(href.startsWith('#'))assert.ok(ids.has(href.slice(1)),route+' broken anchor '+href);
  else if(href.startsWith('/'))assert.ok(special.has(href)||routes.has(href),route+' unknown internal target '+href);
  count++;
 }
 const mirror=applyBasePathToHtml(html,'/meta-gray-label');assert.ok(mirror.includes('/meta-gray-label/assets/css/inner-pages.css'));
 const relative=applyRelativeRootToHtml(html,route.slice(1)+'index.html');assert.ok(!relative.includes('href="/assets/'));
}
console.log('INNER LINKS PASS: '+count+' links/anchors across '+INNER_ROLLOUT.size+' pages; root and mirror asset paths.');
