/** No-dependency actual HTTP checks against disposable WordPress staging. */
import assert from "node:assert/strict";
const site = process.env.MGL_WP_BASE || "http://localhost:8888";
const routes = ["/", "/about-us/", "/forex-grey-label/", "/services/", "/solutions/", "/insights/"];
for (const path of routes) {
  const response = await fetch(site + path, { redirect: "follow" });
  assert.equal(response.status, 200, path + " HTTP status");
  const html = await response.text();
  assert.match(html, /<h1(?:\s|>)/i, path + " no server-rendered H1");
  assert.match(html, /mgl-native-page/, path + " no native Gutenberg page");
  assert.match(html, /mgl-native-site-header/, path + " no native FSE header");
  assert.match(html, /mgl-native-site-footer/, path + " no native FSE footer");
  assert.doesNotMatch(html, /assets\/css\/bootstrap\.min\.css/, path + " legacy Bootstrap");
  assert.doesNotMatch(html, /assets\/js\/custom\.js/, path + " legacy custom.js");
  assert.match(html, /assets\/css\/fse\.css/, path + " no compact native CSS");
  console.log("PASS " + path + ": native SSR without theme framework assets");
}
const notFound = await fetch(site + "/does-not-exist-meta-grey-label-404/", { redirect: "manual" });
assert.equal(notFound.status, 404, "Unmatched route must return HTTP 404");
console.log("REAL WORDPRESS HTTP PASS: six routes plus HTTP 404.");
