#!/usr/bin/env node
/**
 * Meta Grey Label static site generator.
 *
 * Source: data/content.json + templates.
 * Default --write keeps legacy in-repo generation for compatibility.
 * --out=<dir> writes a clean deploy artifact without polluting Git.
 */
import {
  readFileSync, existsSync, mkdirSync, writeFileSync, cpSync, rmSync
} from "node:fs";
import { dirname, isAbsolute, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const mode = args.find((arg) => arg === "--check" || arg === "--write");
const outArg = args.find((arg) => arg.startsWith("--out="));
const allowed = args.filter((arg) => arg === "--check" || arg === "--write" || arg.startsWith("--out="));
if (!mode || allowed.length !== args.length || args.filter((arg) => arg === "--check" || arg === "--write").length !== 1) {
  console.error("Usage: node scripts/generate.mjs --check|--write [--out=dist/site]");
  process.exit(2);
}
const writeMode = mode === "--write";
const outValue = outArg ? outArg.slice("--out=".length) : "";
if (outValue && (isAbsolute(outValue) || outValue.includes("\\") || outValue.split("/").includes(".."))) {
  throw new Error("Unsafe output directory: " + outValue);
}
const outputRoot = outValue ? resolve(root, outValue) : root;
if (!outputRoot.startsWith(root + sep) && outputRoot !== root) {
  throw new Error("Output escapes repository root");
}
if (outValue && outputRoot === root) {
  throw new Error("Refusing to treat repository root as isolated output");
}
if (writeMode && outValue) {
  rmSync(outputRoot, { recursive: true, force: true });
  mkdirSync(outputRoot, { recursive: true });
}

const config = JSON.parse(readFileSync(resolve(root, "data/content.json"), "utf8"));
if (config.schemaVersion !== 1 || !config.pages || !config.content || !config.sitemap) {
  throw new Error("Unexpected or incomplete data/content.json schema");
}

function sourcePath(relative) {
  if (typeof relative !== "string" || !relative || relative.includes("\\") ||
      isAbsolute(relative) || relative.split("/").includes("..")) {
    throw new Error("Unsafe source path: " + relative);
  }
  const absolute = resolve(root, relative);
  if (!absolute.startsWith(root + sep)) throw new Error("Source escapes repository root: " + relative);
  return absolute;
}
function outputPath(relative) {
  if (typeof relative !== "string" || !relative || relative.includes("\\") ||
      isAbsolute(relative) || relative.split("/").includes("..")) {
    throw new Error("Unsafe output path: " + relative);
  }
  const absolute = resolve(outputRoot, relative);
  if (!absolute.startsWith(outputRoot + sep)) throw new Error("Output escapes target: " + relative);
  return absolute;
}

let verified = 0;
let updated = 0;
const mismatches = [];
function emit(relative, content) {
  const absolute = outputPath(relative);
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
  } else {
    mismatches.push(relative);
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
    if (!record.route || pageRoutes.has(record.route)) throw new Error("Missing or duplicated route: " + file);
    pageRoutes.add(record.route);
  } else if (record.role === "shared-part") {
    shared++;
  } else {
    throw new Error("Unexpected page role: " + file);
  }
  const html = readFileSync(sourcePath(record.template), "utf8");
  const used = new Set();
  const rendered = html.replace(/__MGL_CONTENT_\d{5}__/g, (placeholder) => {
    if (!Object.hasOwn(record.fields, placeholder)) throw new Error("Missing content field " + placeholder + " in " + file);
    if (typeof record.fields[placeholder] !== "string") throw new Error("Non-string field " + placeholder + " in " + file);
    used.add(placeholder);
    return record.fields[placeholder];
  });
  const unused = Object.keys(record.fields).filter((key) => !used.has(key));
  if (unused.length) throw new Error("Unused fields in " + file + ": " + unused.slice(0, 4).join(", "));
  emit(file, rendered);
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
  if (!sitemapPaths.has(route)) throw new Error("Page missing from sitemap: " + route);
}
emit("sitemap.xml", sitemapXml);
if (!config.pageMap || !Array.isArray(config.pageMap.pages)) throw new Error("Missing page-map data");
emit("data/page-map.json", JSON.stringify(config.pageMap, null, 2) + "\n");

if (writeMode && outValue) {
  for (const path of ["assets", "media"]) {
    cpSync(sourcePath(path), outputPath(path), { recursive: true });
  }
  cpSync(sourcePath("robots.txt"), outputPath("robots.txt"));
  writeFileSync(outputPath(".nojekyll"), "", "utf8");

  // Preserve the existing pretty /services/ alias exactly while the canonical
  // source remains services.html.
  if (existsSync(sourcePath("services/index.html"))) {
    mkdirSync(dirname(outputPath("services/index.html")), { recursive: true });
    cpSync(sourcePath("services/index.html"), outputPath("services/index.html"));
  }
}

if (mismatches.length) {
  for (const file of mismatches) console.error("OUT OF DATE " + file);
  console.error("FAILED: " + mismatches.length + " generated output(s) need regeneration.");
  process.exit(1);
}
console.log((writeMode ? "GENERATE" : "CHECK") + " PASS: " + pages +
  " pages, " + shared + " shared parts; output=" + (outValue || ".") +
  "; " + verified + " unchanged, " + updated + " updated.");
