import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildNativePages, buildNativeParts, nativePreview } from "../scripts/fse-pages.mjs";
const data = JSON.parse(readFileSync(new URL("../data/content.json", import.meta.url), "utf8"));
const { pages, excluded, special } = buildNativePages(data,
  readFileSync(new URL("../index.html",import.meta.url),"utf8"));
assert.equal(pages.length, 52);
assert.deepEqual(excluded, []);
assert.deepEqual(special, ["404.html", "insights/index.html", "services.html", "solutions/index.html"]);
assert.equal(new Set(pages.map(p => p.path)).size, 52);
let blocks = 0;
for (const page of pages) {
  const doc = data.content.documents[page.documentId];
  assert.ok(page.markup.includes("<!-- wp:group"), "missing Gutenberg group: " + page.path);
  assert.ok(page.markup.includes('class="wp-block-group alignfull mgl-native-page'),
    "Pages must be full-bleed while preserving section-specific inner widths");
  assert.ok(page.markup.includes('class="wp-block-heading"'), "missing native heading: " + page.path);
  assert.equal((page.markup.match(/<!-- wp:group/g) || []).length,
    (page.markup.match(/<!-- \/wp:group -->/g) || []).length);
  const sourceTextCount = (page.markup.match(/<!-- wp:(paragraph|heading)(?:\s| -->)/g) || []).length;
  if (page.path === "index.html") {
    assert.equal(page.sections,11,"all approved homepage sections must be preserved");
    assert.ok(page.markup.includes("Connect your brokerage for"), "current homepage hero copy must reach FSE");
    assert.ok(page.markup.includes("Plan your brokerage"));
    assert.ok(page.markup.includes("<!-- wp:buttons -->"));
    assert.equal((page.markup.match(/<!-- wp:details /g)||[]).length,6,"native FAQ should have 6 editable disclosure blocks");
    assert.equal((page.markup.match(/mgl-native-service-card--[1-6]/g)||[]).length,12,"6 service cards represented by block attrs and markup");
    assert.equal((page.markup.match(/mgl-native-pricing-card--[1-3]/g)||[]).length,6,"3 pricing blocks represented by attrs and markup");
    assert.ok(page.markup.includes("mgl-native-home-capabilities"));
    assert.ok(page.markup.includes("mgl-native-home-why"));
  } else if (doc) {
    assert.equal(sourceTextCount, doc.blocks.length + 1, "content loss: " + page.path);
  } else {
    assert.ok(sourceTextCount >= 3, "incomplete directory/404 content: " + page.path);
  }
  assert.ok(!page.markup.includes("__MGL_CONTENT_"));
  assert.ok(nativePreview(page).includes("<!doctype html>"));
  blocks += doc?.blocks.length || 0;
}
const parts = buildNativeParts(data);
assert.ok(parts.header.includes("wp:site-logo"));
assert.ok(parts.header.includes("wp:navigation"));
assert.equal((parts.header.match(/<!-- wp:navigation-link/g) || []).length, 42);
assert.equal((parts.header.match(/<!-- wp:navigation-submenu/g) || []).length, 4);
assert.ok(!parts.header.includes("<nav "), "Use the native Navigation block serialization");
assert.ok(parts.header.includes('url":"/services/"'));
assert.ok(parts.header.includes('url":"/#faq"'));
assert.ok(parts.header.includes("Solutions"));
assert.ok(parts.header.includes("Technology"));
assert.ok(parts.header.includes("Company"));
assert.ok(parts.header.includes("Resources"));
assert.ok(parts.header.includes("Forex White Label"));
assert.ok(parts.header.includes("Copy Trading / PAMM / MAM"));
assert.ok(parts.header.includes('"flexWrap":"nowrap"'), "native desktop navigation must remain one-line");
assert.ok(!/mega/i.test(parts.header), "native navigation must not contain a mega-menu structure");
assert.ok(parts.footer.includes("wp:site-title"));
assert.ok(parts.footer.includes("Technology provider only"), "provider disclosure must reach native footer");
assert.ok(parts.footer.includes("MT4/MT5 platform configuration"), "current service scope must reach native footer");
assert.ok(!parts.header.includes("__MGL_CONTENT_"));
console.log("FSE CORE-BLOCK TEST PASS: " + pages.length + " pages, " + blocks +
  " document content blocks, editable navigation and footer.");
