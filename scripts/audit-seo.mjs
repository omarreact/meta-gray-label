#!/usr/bin/env node
/**
 * HTML-first SEO quality gate.
 *
 * node scripts/audit-seo.mjs --check [--root=dist/site]
 * node scripts/audit-seo.mjs --report [--root=dist/site]
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, isAbsolute, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const mode = args.find((arg) => arg === "--check" || arg === "--report");
const rootArg = args.find((arg) => arg.startsWith("--root="));
if (!mode || args.some((arg) => !["--check","--report"].includes(arg) && !arg.startsWith("--root="))) {
  console.error("Usage: node scripts/audit-seo.mjs --check|--report [--root=dist/site]");
  process.exit(2);
}
const rootValue = rootArg ? rootArg.slice("--root=".length) : "";
if (rootValue && (isAbsolute(rootValue) || rootValue.includes("\\") || rootValue.split("/").includes(".."))) {
  throw new Error("Unsafe audit root: " + rootValue);
}
const siteRoot = rootValue ? resolve(repoRoot, rootValue) : repoRoot;
if (!siteRoot.startsWith(repoRoot + sep) && siteRoot !== repoRoot) throw new Error("Audit root escapes repository");

const config = JSON.parse(readFileSync(resolve(repoRoot, "data/content.json"), "utf8"));
const pages = Object.entries(config.pages).filter(([, value]) => value.role === "page");
const sitemap = new Set(config.sitemap.urls);
const base = config.sitemap.urls.find((url) => url.endsWith("/"));
if (!base || !/^https:\/\/[^/]+\/[^?#]+\/$/.test(base)) {
  throw new Error("Unexpected canonical site base in sitemap configuration");
}
const problems = [];
const warnings = [];
function attr(tag, key) {
  const pattern = new RegExp("\\b" + key + "\\s*=\\s*([\"'])(.*?)\\1", "i");
  return (tag.match(pattern) || [])[2] || "";
}
function tags(html, name) {
  return [...html.matchAll(new RegExp("<" + name + "\\b[^>]*>", "gi"))].map((m) => m[0]);
}
function problem(file, message) { problems.push(file + ": " + message); }
function warning(file, message) { warnings.push(file + ": " + message); }
function localTargetExists(file, value, baseHref = "") {
  if (!value || value.startsWith("#") || value.startsWith("?") ||
      value.startsWith("//") || value.startsWith("/") ||
      /^[a-z][a-z0-9+.-]*:/i.test(value)) return true;
  const clean = value.split(/[?#]/, 1)[0];
  if (!clean) return true;
  const fileDir = resolve(siteRoot, dirname(file));
  const hasLocalBase = baseHref && !baseHref.startsWith("//") && !/^[a-z][a-z0-9+.-]*:/i.test(baseHref);
  const baseDir = hasLocalBase ? resolve(fileDir, baseHref) : fileDir;
  let target = resolve(baseDir, clean);
  if (clean.endsWith("/")) target = resolve(target, "index.html");
  return existsSync(target);
}
for (const [path, page] of pages) {
  const file = resolve(siteRoot, path);
  if (!existsSync(file)) {
    problem(path, "generated page is missing");
    continue;
  }
  const html = readFileSync(file, "utf8");
  const titleTags = [...html.matchAll(/<title\b[^>]*>([\s\S]*?)<\/title>/gi)].map((m) => m[1].trim());
  if (titleTags.length !== 1 || !titleTags[0]) problem(path, "requires one nonempty <title>");
  const h1Count = [...html.matchAll(/<h1(?:\s|>)/gi)].length;
  if (h1Count !== 1) problem(path, "expected one H1; found " + h1Count);
  const meta = tags(html, "meta");
  const descriptions = meta.filter((tag) => attr(tag, "name").toLowerCase() === "description");
  if (descriptions.length !== 1 || !attr(descriptions[0] || "", "content")) {
    problem(path, "requires exactly one nonempty meta description");
  }
  const canonicals = tags(html, "link").filter((tag) => attr(tag, "rel").split(/\s+/).includes("canonical"));
  const isNotFound = path === "404.html";
  const expected = base + (page.route || "").replace(/^\//, "");
  if (isNotFound) {
    if (canonicals.length) problem(path, "404 must not declare a canonical");
    const robots = meta.filter((tag) => attr(tag, "name").toLowerCase() === "robots");
    if (!robots.some((tag) => /\bnoindex\b/i.test(attr(tag, "content")))) problem(path, "404 must be noindex");
    if (sitemap.has(expected)) problem(path, "404 must not be in sitemap");
  } else {
    if (canonicals.length !== 1 || attr(canonicals[0] || "", "href") !== expected) {
      problem(path, "requires one sitemap-aligned self-canonical " + expected);
    }
    if (!sitemap.has(expected)) problem(path, "missing canonical URL from sitemap");
  }
  const openGraph = meta.filter((tag) => attr(tag, "property") === "og:title");
  if (openGraph.length !== 1) warning(path, "Open Graph title count is " + openGraph.length);
  const baseTag = tags(html, "base")[0] || "";
  const baseHref = attr(baseTag, "href");
  const refs = [
    ...tags(html, "a").map((tag) => ["href", attr(tag, "href")]),
    ...tags(html, "link").map((tag) => ["href", attr(tag, "href")]),
    ...tags(html, "script").map((tag) => ["src", attr(tag, "src")]),
    ...tags(html, "img").map((tag) => ["src", attr(tag, "src")]),
    ...tags(html, "source").map((tag) => ["src", attr(tag, "src")])
  ];
  for (const [kind, value] of refs) {
    if (value && !localTargetExists(path, value, baseHref)) problem(path, "broken local " + kind + " " + JSON.stringify(value));
  }
  const imgs = tags(html, "img");
  const withoutAlt = imgs.filter((tag) => !/\balt\s*=/.test(tag));
  if (withoutAlt.length) warning(path, "images missing alt attribute: " + withoutAlt.length);
  if (html.length > 100000) warning(path, "large HTML response: " + html.length + " characters");
}
if (sitemap.size !== pages.length - 1) problem("sitemap", "expected " + (pages.length - 1) + " canonical URLs, got " + sitemap.size);
console.log("SEO AUDIT: " + pages.length + " pages; " + problems.length + " technical errors; " + warnings.length + " advisory warnings.");
if (mode === "--report") {
  for (const line of [...problems, ...warnings]) console.log(" - " + line);
} else {
  for (const line of problems) console.error("ERROR " + line);
}
if (problems.length) process.exit(1);
