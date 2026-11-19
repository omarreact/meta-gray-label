/** Assert every route from the canonical JSON against a real wp-env server. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const site = process.env.MGL_WP_BASE || "http://localhost:8888";
const data = JSON.parse(readFileSync(new URL("../data/content.json", import.meta.url),"utf8"));
const routes = Object.values(data.pages).filter(p=>p.role==="page").map(p=>p.route);
assert.equal(routes.length,52);
const results=[];
for (const path of routes) {
  const route=path==="/services.html"?"/services/":path;
  const is404=path==="/404.html";
  if(is404)continue;
  const response=await fetch(site+route,{redirect:"follow"});
  assert.equal(response.status,200,route+" unexpected HTTP status");
  const html=await response.text();
  assert.match(html,/<h1(?:\s|>)/i,route+" missing SSR H1");
  assert.match(html,/mgl-native-page/,route+" missing Gutenberg content");
  assert.match(html,/mgl-native-site-header/,route+" missing native FSE header");
  assert.match(html,/mgl-native-site-footer/,route+" missing native FSE footer");
  assert.match(html,/assets\/css\/fse\.css/,route+" missing compact native stylesheet");
  assert.doesNotMatch(html,/assets\/css\/bootstrap\.min\.css/,route+" contains legacy Bootstrap");
  assert.doesNotMatch(html,/assets\/js\/custom\.js/,route+" contains legacy custom JS");
  const h1=(html.match(/<h1(?:\s|>)/gi)||[]).length;
  assert.equal(h1,1,route+" needs one semantic H1");
  results.push(route);
}
assert.equal(results.length,51);
const notFound=await fetch(site+"/does-not-exist-meta-grey-label-404/",{redirect:"manual"});
assert.equal(notFound.status,404,"Missing route must return actual HTTP 404");
console.log("REAL WORDPRESS HTTP PASS: 51 native routes + HTTP 404. No legacy framework asset leaks.");
