#!/usr/bin/env node
/**
 * Meta Grey Label static site generator.
 * Single source of editable text, URLs, SEO metadata and document content:
 * data/content.json. Presentation stays in independent HTML templates.
 *
 * Usage:
 *   node scripts/generate.mjs --check
 *   node scripts/generate.mjs --write
 *
 * No npm dependencies or runtime server are required.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const flags = new Set(process.argv.slice(2));
if (flags.has("--help") || flags.has("-h")) {
  console.log("Usage: node scripts/generate.mjs --check | --write");
  process.exit(0);
}
if (flags.size !== 1 || (!flags.has("--check") && !flags.has("--write"))) {
  console.error("Specify exactly one option: --check or --write");
  process.exit(2);
}
const writeMode = flags.has("--write");
const config = JSON.parse(readFileSync(resolve(root, "data/content.json"), "utf8"));
if (config.schemaVersion !== 1 || !config.pages || !config.content || !config.sitemap) {
  throw new Error("Unexpected or incomplete data/content.json schema");
}

function localPath(relative) {
  if (typeof relative !== "string" || !relative || relative.includes("\\") ||
      isAbsolute(relative) || relative.split("/").includes("..")) {
    throw new Error("Unsafe relative path: " + relative);
  }
  const absolute = resolve(root, relative);
  if (!absolute.startsWith(root + sep)) {
    throw new Error("Path escapes repository root: " + relative);
  }
  return absolute;
}
function rebaseOneLevelRelativeUrls(html) {
  return html.replace(/\b(src|href)=("[^"]*"|'[^']*')/gi, (full, name, quoted) => {
    const quote = quoted[0];
    const value = quoted.slice(1, -1);
    if (!value || value.startsWith("#") || value.startsWith("?") ||
        value.startsWith("/") || value.startsWith("//") ||
        value.startsWith("../") || /^[a-z][a-z0-9+.-]*:/i.test(value)) {
      return full;
    }
    const rebased = value.startsWith("./") ? "../" + value.slice(2) : "../" + value;
    return name + "=" + quote + rebased + quote;
  });
}

let verified = 0;
let updated = 0;
const mismatches = [];

function emit(relative, content) {
  const absolute = localPath(relative);
  const expected = Buffer.from(content, "utf8");
  const existing = existsSync(absolute) ? readFileSync(absolute) : null;
  if (existing !== null && existing.equals(expected)) {
    verified++;
    return;
  }
  if (writeMode) {
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, expected);
    updated++;
    console.log("UPDATED " + relative);
  } else {
    mismatches.push(relative);
    console.error("OUT OF DATE " + relative);
  }
}
const pageRoutes = new Set();
let pages = 0;
let shared = 0;
for (const [file, record] of Object.entries(config.pages)) {
  if (!record || !record.fields || typeof record.template !== "string") {
    throw new Error("Invalid page record: " + file);
  }
  if (record.role === "page") {
    pages++;
    if (!record.route || pageRoutes.has(record.route)) {
      throw new Error("Missing or duplicated route: " + file);
    }
    pageRoutes.add(record.route);
  } else if (record.role === "shared-part") {
    shared++;
  } else {
    throw new Error("Unexpected page role: " + file);
  }
  const html = readFileSync(localPath(record.template), "utf8");
  const used = new Set();
  const rendered = html.replace(/__MGL_CONTENT_\d{5}__/g, (placeholder) => {
    if (!Object.hasOwn(record.fields, placeholder)) {
      throw new Error("Missing content field " + placeholder + " in " + file);
    }
    if (typeof record.fields[placeholder] !== "string") {
      throw new Error("Non-string field " + placeholder + " in " + file);
    }
    used.add(placeholder);
    return record.fields[placeholder];
  });
  const unused = Object.keys(record.fields).filter((key) => !used.has(key));
  if (unused.length) {
    throw new Error("Unused fields in " + file + ": " + unused.slice(0, 4).join(", "));
  }
  const output = file === "services/index.html"
    ? rebaseOneLevelRelativeUrls(rendered)
    : rendered;
  emit(file, output);
}
const sitemap = config.sitemap;
if (!Array.isArray(sitemap.urls) || !sitemap.xmlns || !sitemap.declaration) {
  throw new Error("Invalid sitemap configuration");
}
const xmlEscape = (value) => String(value).replace(/&/g, "&amp;")
  .replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const sitemapXml = sitemap.declaration + "\n" +
  '<urlset xmlns="' + xmlEscape(sitemap.xmlns) + '">\n' +
  sitemap.urls.map((url) => "  <url><loc>" + xmlEscape(url) + "</loc></url>\n").join("") +
  "</urlset>\n";
const sitemapPaths = new Set(sitemap.urls.map((url) => {
  const value = new URL(url);
  return value.pathname.replace(/^\/meta-gray-label/, "") || "/";
}));
for (const route of pageRoutes) {
  if (route === "/404.html") continue;
  if (!sitemapPaths.has(route)) {
    throw new Error("Page missing from sitemap: " + route);
  }
}
emit("sitemap.xml", sitemapXml);
if (!config.pageMap || !Array.isArray(config.pageMap.pages)) {
  throw new Error("Missing page-map data");
}
emit("data/page-map.json", JSON.stringify(config.pageMap, null, 2) + "\n");
if (mismatches.length) {
  console.error("FAILED: " + mismatches.length + " generated output(s) need regeneration.");
  process.exit(1);
}
console.log((writeMode ? "GENERATE" : "CHECK") + " PASS: " + pages +
  " pages, " + shared + " shared parts, 1 sitemap, 1 page map; " +
  verified + " unchanged, " + updated + " updated.");
