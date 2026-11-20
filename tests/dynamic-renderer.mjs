import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  buildRouteIndex,
  normalizePath,
  renderStructuredPage,
  specialAssetPath
} from "../src/renderer.js";

const data = JSON.parse(readFileSync(new URL("../data/content.json", import.meta.url), "utf8"));
const header = readFileSync(new URL("../header.html", import.meta.url), "utf8");
const footer = readFileSync(new URL("../footer.html", import.meta.url), "utf8");
const routes = buildRouteIndex(data);

assert.ok(routes.size >= 45, "Expected structured route coverage");
assert.equal(normalizePath("/forex-grey-label"), "/forex-grey-label/");
assert.equal(specialAssetPath("/"), "/index.html");
assert.equal(specialAssetPath("/services/"), "/services.html");

let rendered = 0;
for (const [route, entry] of routes) {
  if (route === "/") continue;
  const html = renderStructuredPage({
    route,
    entry,
    routeIndex: routes,
    header,
    footer,
    canonicalBase: "https://example.test"
  });
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /<main class="mgl-inner-page/);
  assert.match(html, /<header\b/i, "shared header missing: " + route);
  assert.match(html, /<footer\b/i, "shared footer missing: " + route);
  assert.equal((html.match(/<h1\b/gi) || []).length, 1, "expected one H1: " + route);
  assert.ok(!html.includes("data-shared-part"), "unresolved shared placeholder: " + route);
  assert.ok(!html.includes("../assets/"), "relative assets remain: " + route);
  for (const block of entry.document.blocks || []) {
    if (block.type === "paragraph" && block.text?.trim()) {
      assert.ok(html.includes(block.text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")),
        "content loss in " + route);
    }
  }
  rendered++;
}
assert.ok(rendered >= 40);
console.log("DYNAMIC RENDERER PASS: " + rendered + " structured routes rendered from one JSON source with shared header/footer.");
