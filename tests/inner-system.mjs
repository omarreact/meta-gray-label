import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRouteIndex, renderStructuredPage } from '../src/renderer.js';
import { buildNativePages } from '../scripts/fse-pages.mjs';
import { INNER_ROLLOUT, REFERENCE_ROUTE, buildInnerPage, renderInnerTree, esc, pageFamily } from '../src/inner-system.js';
const data=JSON.parse(readFileSync('data/content.json','utf8'));
const routes=buildRouteIndex(data);
const native=buildNativePages(data,readFileSync('index.html','utf8')).pages;
for(const route of INNER_ROLLOUT){
 const entry=routes.get(route);assert.ok(entry,'unknown rollout route');
 for(const block of entry.document.blocks)assert.doesNotMatch(block.text,/FAQs?:H[1-6]:/,'draft heading marker in public copy');
 const html=renderStructuredPage({route,entry,routeIndex:routes,canonicalBase:'https://mg-label.webflow.io'});
 const wp=native.find(x=>x.route===route).markup;
 const tree=buildInnerPage(entry,[...routes.values()]);
 const staticBody=renderInnerTree(tree),blockBody=renderInnerTree(tree,true);
 assert.equal(blockBody.replace(/<!--\s*\/?wp:[\s\S]*?-->/g,'').replace(/\s+</g,'<').trim(),staticBody.replace(/\s+</g,'<').trim(),'static/native tree drift');
 assert.match(html,/assets\/css\/inner-pages.css/);
 assert.equal((html.match(/<h1\b/g)||[]).length,1);
 assert.equal((wp.match(/<h1\b/g)||[]).length,1);
 assert.doesNotMatch(wp,/wp:html|<script|wp:mgl/);
 const ids=[...html.matchAll(/\bid="(inner-section-\d+)"/g)].map(x=>x[1]);
 assert.equal(new Set(ids).size,ids.length);
 for(const block of entry.document.blocks.filter(x=>x.type==='paragraph')){
  assert.ok(html.includes(esc(block.text)),'static copy lost');
  assert.ok(wp.includes(esc(block.text)),'native copy lost');
 }
}
assert.equal(pageFamily(REFERENCE_ROUTE),'service');
assert.equal(pageFamily('/forex-white-label/pricing/'),'pricing');
assert.equal(pageFamily('/forex-white-label/vs-grey-label/'),'comparison');
assert.equal(pageFamily('/forex-broker-turnkey/how-it-works/'),'process');
assert.equal(pageFamily('/mt-admin-license/mt5-admin/'),'technical');
assert.equal(pageFamily('/forex-crm/'),'hub');
assert.equal(pageFamily('/about-us/'),'company');
assert.equal(pageFamily('/insights/example/'),'article');
console.log('INNER SYSTEM PASS: '+INNER_ROLLOUT.size+' routes, shared semantic tree, source copy, headings and native editability');
