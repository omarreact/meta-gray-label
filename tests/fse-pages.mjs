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
    assert.equal(page.sections,8,"all approved consolidated homepage sections must be preserved");
    assert.ok(page.markup.includes("Launch a brokerage that works as one system."));
    assert.ok(page.markup.includes("Every client event should connect to the next system."));
    assert.ok(page.markup.includes("Build the stack in four clear operating layers."));
    assert.ok(page.markup.includes("Start with the level of control your brokerage actually needs."));
    assert.ok(page.markup.includes("Choose the operating model first. Then connect the technology around it."));
    assert.ok(page.markup.includes("<!-- wp:buttons -->"));
    assert.equal((page.markup.match(/<!-- wp:details /g)||[]).length,6,"native FAQ should have 6 editable disclosure blocks");
    for (const id of ["home","about","roadmap","services","models","resources","faq","contact"]) {
      assert.ok(page.markup.includes("mgl-native-home-" + id), "missing native homepage section: " + id);
    }
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
assert.equal((parts.header.match(/<!-- wp:navigation-link/g) || []).length, 38);
assert.equal((parts.header.match(/<!-- wp:navigation-submenu/g) || []).length, 9);
assert.ok(!parts.header.includes("<nav "), "Use the native Navigation block serialization");
assert.ok(parts.header.includes('url":"/services/"'));
assert.ok(parts.header.includes('url":"/#faq"'));
assert.ok(parts.footer.includes("wp:site-title"));
assert.ok(!parts.header.includes("__MGL_CONTENT_"));
console.log("FSE CORE-BLOCK TEST PASS: " + pages.length + " pages, " + blocks +
  " document content blocks, editable navigation and footer.");
