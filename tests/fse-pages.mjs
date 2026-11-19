import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildNativePages, buildNativeParts, nativePreview } from "../scripts/fse-pages.mjs";
const data = JSON.parse(readFileSync(new URL("../data/content.json", import.meta.url), "utf8"));
const { pages, excluded } = buildNativePages(data);
assert.equal(pages.length, 48);
assert.deepEqual(excluded, ["404.html", "insights/index.html", "services.html", "solutions/index.html"]);
assert.equal(new Set(pages.map(p => p.path)).size, 48);
let blocks = 0;
for (const page of pages) {
  const doc = data.content.documents[page.documentId];
  assert.ok(page.markup.includes("<!-- wp:group"), "missing Gutenberg group: " + page.path);
  assert.ok(page.markup.includes('class="wp-block-heading"'), "missing native heading: " + page.path);
  assert.equal((page.markup.match(/<!-- wp:group/g) || []).length,
    (page.markup.match(/<!-- \/wp:group -->/g) || []).length);
  const sourceTextCount = (page.markup.match(/<!-- wp:(paragraph|heading)(?:\s| -->)/g) || []).length;
  assert.equal(sourceTextCount, doc.blocks.length + 1, "content loss: " + page.path);
  assert.ok(!page.markup.includes("__MGL_CONTENT_"));
  assert.ok(nativePreview(page).includes("<!doctype html>"));
  blocks += doc.blocks.length;
}
const parts = buildNativeParts(data);
assert.ok(parts.header.includes("wp:site-logo"));
assert.ok(parts.header.includes("wp:navigation"));
assert.ok(parts.header.includes('url":"/services/"'));
assert.ok(parts.header.includes('url":"/#faq"'));
assert.ok(parts.footer.includes("wp:site-title"));
assert.ok(!parts.header.includes("__MGL_CONTENT_"));
console.log("FSE CORE-BLOCK TEST PASS: " + pages.length + " pages, " + blocks +
  " document content blocks, editable navigation and footer.");
