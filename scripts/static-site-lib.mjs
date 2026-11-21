import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync
} from "node:fs";
import { dirname, resolve, sep } from "node:path";
import {
  buildRouteIndex,
  injectSharedParts,
  normalizePath,
  renderDynamicSitemap,
  renderSimple404,
  renderStructuredPage,
  rewriteRuntimeSeo
} from "../src/renderer.js";

const SPECIAL_ROUTES = [
  { route: "/", source: "index.html", outputs: ["index.html"] },
  { route: "/services.html", source: "services.html", outputs: ["services.html", "services/index.html"] },
  { route: "/solutions/", source: "solutions/index.html", outputs: ["solutions/index.html"] },
  { route: "/insights/", source: "insights/index.html", outputs: ["insights/index.html"] },
  { route: "/contact/", source: "contact/index.html", outputs: ["contact/index.html"] }
];

const LEGACY_BASES = [
  "https://meta-gray-label-dynamic.farukkhanone.workers.dev",
  "https://omarreact.github.io/meta-gray-label",
  "https://mg-label.webflow.io"
];

export function normalizeBasePath(value = "") {
  const raw = String(value || "").trim();
  if (!raw || raw === "/") return "";
  return "/" + raw.replace(/^\/+|\/+$/g, "");
}

export function normalizePublicBase(value) {
  const raw = String(value || "").trim() || "https://omarreact.github.io/meta-gray-label";
  return raw.replace(/\/+$/, "");
}

export function applyBasePathToHtml(html, basePath = "") {
  const prefix = normalizeBasePath(basePath);
  if (!prefix) return String(html || "");

  let output = String(html || "");
  output = output.replace(/\b(href|src|action|poster)=(["'])(\/[^"']*)\2/gi, (match, attr, quote, value) => {
    if (value.startsWith("//") || value === prefix || value.startsWith(prefix + "/")) return match;
    return `${attr}=${quote}${prefix}${value}${quote}`;
  });
  output = output.replace(/url\((["']?)(\/[^)'"]+)\1\)/gi, (match, quote, value) => {
    if (value === prefix || value.startsWith(prefix + "/")) return match;
    return `url(${quote}${prefix}${value}${quote})`;
  });
  return output;
}

export function rewritePlatformReferences(html, publicBase) {
  let output = String(html || "");
  const target = normalizePublicBase(publicBase);
  for (const base of LEGACY_BASES) {
    output = output.split(base).join(target);
  }
  return output;
}

function safeTarget(root, relativePath) {
  const target = resolve(root, relativePath);
  if (target !== root && !target.startsWith(root + sep)) {
    throw new Error("Unsafe static output path: " + relativePath);
  }
  return target;
}

function writeText(root, relativePath, content) {
  const target = safeTarget(root, relativePath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content, "utf8");
}

function copyPath(projectRoot, outRoot, source, target = source) {
  const from = safeTarget(projectRoot, source);
  const to = safeTarget(outRoot, target);
  if (!existsSync(from)) throw new Error("Missing static source: " + source);
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

function specialSet() {
  return new Set(SPECIAL_ROUTES.map((item) => normalizePath(item.route)));
}

function renderSpecial({ projectRoot, outRoot, publicBase, basePath, header, footer }) {
  for (const item of SPECIAL_ROUTES) {
    const source = readFileSync(safeTarget(projectRoot, item.source), "utf8");
    let html = injectSharedParts(source, header, footer);
    const canonical = normalizePublicBase(publicBase) + (item.route === "/" ? "/" : item.route);
    html = rewriteRuntimeSeo(html, canonical);
    html = rewritePlatformReferences(html, publicBase);
    html = applyBasePathToHtml(html, basePath);
    for (const output of item.outputs) writeText(outRoot, output, html);
  }
}

export function generateStructuredPages({
  projectRoot,
  outRoot,
  publicBase,
  basePath = "",
  cleanStale = false,
  manifestPath = ".github/generated-pages.json"
}) {
  const data = JSON.parse(readFileSync(safeTarget(projectRoot, "data/content.json"), "utf8"));
  const header = readFileSync(safeTarget(projectRoot, "header.html"), "utf8");
  const footer = readFileSync(safeTarget(projectRoot, "footer.html"), "utf8");
  const routes = buildRouteIndex(data);
  const excluded = specialSet();
  const generated = [];

  for (const [route, entry] of routes) {
    const normalized = normalizePath(route);
    if (excluded.has(normalized)) continue;
    const relative = normalized.replace(/^\/+/, "") + "index.html";
    let html = renderStructuredPage({
      route: normalized,
      entry,
      routeIndex: routes,
      header,
      footer,
      canonicalBase: normalizePublicBase(publicBase)
    });
    html = rewritePlatformReferences(html, publicBase);
    html = applyBasePathToHtml(html, basePath);
    writeText(outRoot, relative, html);
    generated.push(relative);
  }

  const manifestTarget = safeTarget(projectRoot, manifestPath);
  if (cleanStale && existsSync(manifestTarget)) {
    try {
      const previous = JSON.parse(readFileSync(manifestTarget, "utf8"));
      for (const relative of previous.files || []) {
        if (generated.includes(relative)) continue;
        const stale = safeTarget(projectRoot, relative);
        if (existsSync(stale)) rmSync(stale, { force: true });
      }
    } catch (error) {
      console.warn("Could not read previous generated-page manifest:", error.message);
    }
  }

  return { data, header, footer, routes, generated };
}

export function buildStaticSite({
  projectRoot,
  outRoot,
  publicBase,
  basePath = ""
}) {
  const root = resolve(projectRoot);
  const out = resolve(outRoot);
  if (out !== root && !out.startsWith(root + sep)) throw new Error("Unsafe static build directory");

  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });

  for (const path of ["assets", "media", "data/content.json"]) copyPath(root, out, path);

  const data = JSON.parse(readFileSync(safeTarget(root, "data/content.json"), "utf8"));
  const header = readFileSync(safeTarget(root, "header.html"), "utf8");
  const footer = readFileSync(safeTarget(root, "footer.html"), "utf8");

  renderSpecial({ projectRoot: root, outRoot: out, publicBase, basePath, header, footer });

  const generated = generateStructuredPages({
    projectRoot: root,
    outRoot: out,
    publicBase,
    basePath,
    cleanStale: false
  });

  let notFound = renderSimple404({ header, footer, canonicalBase: normalizePublicBase(publicBase) });
  notFound = rewritePlatformReferences(notFound, publicBase);
  notFound = applyBasePathToHtml(notFound, basePath);
  writeText(out, "404.html", notFound);
  writeText(out, "sitemap.xml", renderDynamicSitemap(data, normalizePublicBase(publicBase)));
  writeText(out, "robots.txt", `User-agent: *\nAllow: /\nSitemap: ${normalizePublicBase(publicBase)}/sitemap.xml\n`);
  writeText(out, ".nojekyll", "");

  return {
    generatedCount: generated.generated.length,
    publicBase: normalizePublicBase(publicBase),
    basePath: normalizeBasePath(basePath)
  };
}

export function materializeGitHubPages({
  projectRoot,
  publicBase = "https://omarreact.github.io/meta-gray-label",
  basePath = "/meta-gray-label"
}) {
  const root = resolve(projectRoot);
  const result = generateStructuredPages({
    projectRoot: root,
    outRoot: root,
    publicBase,
    basePath,
    cleanStale: true
  });

  let notFound = renderSimple404({
    header: result.header,
    footer: result.footer,
    canonicalBase: normalizePublicBase(publicBase)
  });
  notFound = rewritePlatformReferences(notFound, publicBase);
  notFound = applyBasePathToHtml(notFound, basePath);
  writeText(root, "404.html", notFound);
  writeText(root, "sitemap.xml", renderDynamicSitemap(result.data, normalizePublicBase(publicBase)));
  writeText(root, "robots.txt", `User-agent: *\nAllow: /\nSitemap: ${normalizePublicBase(publicBase)}/sitemap.xml\n`);

  const manifest = {
    generatedAt: new Date().toISOString(),
    publicBase: normalizePublicBase(publicBase),
    basePath: normalizeBasePath(basePath),
    files: result.generated
  };
  writeText(root, ".github/generated-pages.json", JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}
