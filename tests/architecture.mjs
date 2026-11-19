import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(new URL("../" + file, import.meta.url), "utf8");
const css = read("assets/css/fse.css");
const func = read("functions.php");
const theme = JSON.parse(read("theme.json"));
assert.equal(theme.version, 3);
assert.equal(new Set(theme.settings.color.palette.map(c => c.slug)).size, theme.settings.color.palette.length);
assert.doesNotMatch(css, /(?:^|[{},]\s*)\s*(?:\.container|\.row|\.btn|\.col-|body\b|h[1-6]\b|p\b)/m,
  "Native CSS must not override generic Bootstrap/core selectors");
assert.match(css, /\.mgl-native-page/);
assert.match(css, /\.mgl-native-page\.alignfull/, "Native pages should escape theme width constraint");
assert.match(func, /if\s*\(\s*mgl_is_native_layout\(\)\s*\)/, "Native assets must be conditionally loaded");
assert.match(func, /return;[\s\S]*bootstrap\.min\.css/, "Native path must skip legacy frameworks");
assert.match(func, /get_theme_file_path\(\s*'blocks\//, "Blocks must use metadata registration");
for (const [folder, blockName] of [
  ["legacy-page", "mgl/page"], ["legacy-header", "mgl/header"], ["legacy-footer", "mgl/footer"]
]) {
  const meta = JSON.parse(read("blocks/" + folder + "/block.json"));
  assert.equal(meta.name, blockName);
  assert.equal(meta.apiVersion, 3);
  assert.equal(meta.supports.inserter, false);
}
console.log("ARCHITECTURE PASS: scoped native CSS, native-only asset loading, 3 metadata blocks.");
