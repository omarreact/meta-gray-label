#!/usr/bin/env node
/**
 * Package the static source into an installable WordPress block-theme folder.
 * No dependencies and no production changes.
 *
 * node scripts/package-wordpress.mjs --check
 * node scripts/package-wordpress.mjs --write
 *
 * --write creates dist/wordpress/meta-grey-label/ (ZIP the theme folder to
 * install it via Appearance > Themes > Add New > Upload Theme).
 */
import { readFileSync, existsSync, mkdirSync, cpSync, copyFileSync, rmSync } from "node:fs";
import { resolve, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const flags = new Set(process.argv.slice(2));
if (flags.size !== 1 || (!flags.has("--check") && !flags.has("--write"))) {
  console.error("Usage: node scripts/package-wordpress.mjs --check | --write");
  process.exit(2);
}
const wpDir = resolve(root, "dist/wordpress/meta-grey-label");
const safe = (s) => {
  if (typeof s !== "string" || !s || s.includes("\\") ||
      s.split("/").includes("..") || s.startsWith("/")) {
    throw new Error("Invalid path: " + s);
  }
  const p = resolve(root, s);
  if (!p.startsWith(root + sep)) throw new Error("Path escapes repo: " + s);
  return p;
};
const paths = [
  "style.css", "functions.php", "theme.json",
  "assets", "media", "data/content.json",
  "templates", "parts", "patterns", "styles", "inc"
];
for (const p of paths) {
  if (!existsSync(safe(p))) throw new Error("Missing theme path: " + p);
}
const config = JSON.parse(readFileSync(safe("data/content.json"), "utf8"));
if (config.schemaVersion !== 1 || !config.pages || !config.content?.documents) {
  throw new Error("Unexpected content JSON schema");
}
let pages = 0;
let shared = 0;
for (const [file, record] of Object.entries(config.pages)) {
  if (!record || !record.template || !existsSync(safe(record.template))) {
    throw new Error("Missing template for " + file);
  }
  if (record.role === "page") pages++;
  else if (record.role === "shared-part") shared++;
}
if (pages !== 52 || shared !== 2) {
  throw new Error("Unexpected page / template-part inventory: " + pages + "/" + shared);
}
for (const name of ["index", "front-page", "page", "404", "single", "archive", "search"]) {
  const contents = readFileSync(safe("templates/" + name + ".html"), "utf8");
  if (!contents.includes("<!-- wp:template-part")) {
    throw new Error("Non-native WordPress block template: " + name);
  }
}
const theme = JSON.parse(readFileSync(safe("theme.json"), "utf8"));
if (theme.version !== 3 || !theme.templateParts?.length) {
  throw new Error("Invalid WordPress theme.json");
}
for (const p of ["assets/css/style.css", "assets/js/custom.js", "media/branding/logo-light.svg"]) {
  if (!existsSync(safe(p))) throw new Error("Missing media: " + p);
}
if (flags.has("--check")) {
  console.log("WORDPRESS PACKAGE CHECK PASS: " + pages + " pages, " + shared +
    " layout parts; native WordPress templates/theme.json present.");
  process.exit(0);
}
// Only generated dist output is refreshed. Static website and Git history are untouched.
if (!wpDir.startsWith(root + sep) || !wpDir.includes(sep + "dist" + sep)) {
  throw new Error("Unsafe output path.");
}
rmSync(wpDir, { recursive: true, force: true });
mkdirSync(wpDir, { recursive: true });
for (const p of paths) {
  const from = safe(p);
  const to = join(wpDir, p);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}
console.log("WORDPRESS PACKAGE BUILT: " + wpDir);
