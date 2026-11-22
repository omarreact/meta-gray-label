#!/usr/bin/env node
import { readFileSync, existsSync, mkdirSync, cpSync, rmSync, writeFileSync } from "node:fs";
import { resolve, dirname, join, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { buildNativePages, buildNativeParts } from "./fse-pages.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const flags = new Set(process.argv.slice(2));
if (flags.size !== 1 || (!flags.has("--check") && !flags.has("--write"))) {
  console.error("Usage: node scripts/package-wordpress.mjs --check | --write");
  process.exit(2);
}
const wpDir = resolve(root, "dist/wordpress/meta-grey-label");
const safe = (s) => {
  if (typeof s !== "string" || !s || s.includes("\\") || s.split("/").includes("..") || s.startsWith("/")) {
    throw new Error("Invalid path: " + s);
  }
  const p = resolve(root, s);
  if (!p.startsWith(root + sep)) throw new Error("Path escapes repo: " + s);
  return p;
};

const sourcePaths = [
  "style.css",
  "functions.php",
  "theme.json",
  "assets/css/fse.css",
  "assets/css/inner-pages.css",
  "assets/css/site-settings.css",
  "assets/js/site-settings.js",
  "assets/site-settings.json",
  "media/branding",
  "data/content.json",
  "data/inner-pages.json",
  "templates",
  "parts",
  "patterns",
  "styles",
  "inc/import-pages.php"
];
for (const p of sourcePaths) if (!existsSync(safe(p))) throw new Error("Missing theme path: " + p);

const config = JSON.parse(readFileSync(safe("data/content.json"), "utf8"));
const native = buildNativePages(config, readFileSync(safe("index.html"), "utf8"));
const nativeParts = buildNativeParts(config);
if (native.pages.length !== 52 || native.excluded.length !== 0) throw new Error("Unexpected native page coverage");

for (const name of ["index","front-page","page","404","single","archive","search"]) {
  const contents = readFileSync(safe("templates/" + name + ".html"), "utf8");
  if (!contents.includes("<!-- wp:template-part")) throw new Error("Invalid block template: " + name);
}
const theme = JSON.parse(readFileSync(safe("theme.json"), "utf8"));
if (theme.version !== 3 || theme.templateParts?.length !== 2) throw new Error("Invalid compact theme.json");

if (flags.has("--check")) {
  console.log("WORDPRESS PACKAGE CHECK PASS: 52 native block pages; no legacy HTML renderer or framework bundle.");
  process.exit(0);
}

rmSync(wpDir, { recursive: true, force: true });
mkdirSync(wpDir, { recursive: true });
for (const p of sourcePaths) {
  const from = safe(p);
  const to = join(wpDir, p);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}
writeFileSync(join(wpDir, "parts/header.html"), nativeParts.header);
writeFileSync(join(wpDir, "parts/footer.html"), nativeParts.footer);

const output = join(wpDir, "data/fse-pages");
mkdirSync(output, { recursive: true });
const manifest = {};
for (const page of native.pages) {
  const file = join(output, page.slug + ".html");
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, page.markup);
  manifest[page.path] = { file: page.slug + ".html", route: page.route, documentId: page.documentId };
}
writeFileSync(join(output, "manifest.json"),
  JSON.stringify({ pages: manifest, excluded: native.excluded, special: native.special }, null, 2) + "\n");
console.log("WORDPRESS PACKAGE BUILT: " + wpDir + " (" + native.pages.length + " native pages)");
