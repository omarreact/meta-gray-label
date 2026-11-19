#!/usr/bin/env node
/**
 * Export WordPress core block markup and non-production static previews
 * from the existing JSON, without changing any current live HTML pages.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildNativePages, buildNativeParts, nativePreview } from "./fse-pages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const flags = new Set(process.argv.slice(2));
if (flags.size !== 1 || (!flags.has("--check") && !flags.has("--write"))) {
  console.error("Usage: node scripts/generate-fse.mjs --check | --write");
  process.exit(2);
}
const config = JSON.parse(readFileSync(join(root, "data/content.json"), "utf8"));
const { pages, excluded, special } = buildNativePages(config,
  readFileSync(join(root,"templates/pages/index.html"),"utf8"));
const { header, footer } = buildNativeParts(config);
function checkOrWrite(relative, output) {
  const file = resolve(root, relative);
  if (flags.has("--write")) {
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, output);
  } else if (!existsSync(file) || readFileSync(file, "utf8") !== output) {
    throw new Error("Generated native part is stale: " + relative + ". Run --write.");
  }
}
checkOrWrite("parts/header-native.html", header);
checkOrWrite("parts/footer-native.html", footer);
if (pages.length !== 52 || excluded.length !== 0 || special.length !== 4) {
  throw new Error("Expected 48 mapped document pages + 4 unmatched routes");
}
const manifest = {};
for (const page of pages) {
  manifest[page.path] = { file: page.slug + ".html", route: page.route, title: page.title,
    documentId: page.documentId, family: page.family, sections: page.sections, blocks: page.blocks };
  if (flags.has("--write")) {
    const output = resolve(root, "dist/fse/native-pages", page.slug + ".html");
    mkdirSync(dirname(output), { recursive: true });
    writeFileSync(output, page.markup);
    const preview = resolve(root, "dist/fse/previews", page.slug + ".html");
    mkdirSync(dirname(preview), { recursive: true });
    const depth = page.slug.split("/").length;
    const relativeStyle = "../".repeat(depth + 2) + "assets/css/fse.css";
    writeFileSync(preview, nativePreview(page, relativeStyle));
  }
}
if (flags.has("--write")) {
  const location = resolve(root, "dist/fse/manifest.json");
  mkdirSync(dirname(location), { recursive: true });
  writeFileSync(location, JSON.stringify({ source: "data/content.json", generated: manifest,
    excluded, special, pageCount: pages.length }, null, 2) + "\n");
}
console.log("FSE " + (flags.has("--check") ? "CHECK" : "GENERATE") + " PASS: " + pages.length +
  " native editable page sources; " + special.length + " directory/404 layouts derived from canonical fields.");
