const SPECIAL_ROUTES = new Map([
  ["/", "/index.html"],
  ["/index.html", "/index.html"],
  ["/contact/", "/contact/index.html"],
  ["/services.html", "/services.html"],
  ["/services/", "/services.html"],
  ["/solutions/", "/solutions/index.html"],
  ["/insights/", "/insights/index.html"],
]);

const STATIC_PREFIXES = ["/assets/", "/media/"];

export function normalizePath(pathname = "/") {
  let path = String(pathname || "/").split("?")[0].split("#")[0];
  if (!path.startsWith("/")) path = "/" + path;
  path = path.replace(/\/+/g, "/");
  if (path !== "/" && !path.includes(".") && !path.endsWith("/")) path += "/";
  return path;
}

export function isStaticAssetPath(pathname) {
  const path = normalizePath(pathname);
  return STATIC_PREFIXES.some((prefix) => path.startsWith(prefix)) ||
    path === "/favicon.ico";
}

export function specialAssetPath(pathname) {
  return SPECIAL_ROUTES.get(normalizePath(pathname)) || null;
}

export function buildRouteIndex(data) {
  const documents = data?.content?.documents || {};
  const index = new Map();
  for (const page of data?.pageMap?.pages || []) {
    const doc = documents[page.id];
    if (!doc || page.status !== "available" || !page.route) continue;
    index.set(normalizePath(page.route), {
      ...page,
      document: doc,
      family: page.route.startsWith("/insights/") ? "article" : "service"
    });
  }
  return index;
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function plainText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function excerpt(value = "", max = 170) {
  const text = plainText(value);
  if (text.length <= max) return text;
  return text.slice(0, Math.max(0, max - 1)).replace(/\s+\S*$/, "") + "…";
}

function slugify(value = "") {
  return plainText(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "section";
}

function titleFromRouteSegment(segment) {
  return segment
    .split("-")
    .filter(Boolean)
    .map((word) => word === "mt4" || word === "mt5" || word === "kyc" || word === "crm"
      ? word.toUpperCase()
      : word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function firstParagraph(blocks = []) {
  return blocks.find((block) => block?.type === "paragraph" && plainText(block.text))?.text || "";
}

function firstH1(blocks = [], fallback = "") {
  return blocks.find((block) => block?.type === "heading" && Number(block.level) === 1)?.text || fallback;
}

function splitDocument(blocks = []) {
  const content = blocks.filter((block) => !(block?.type === "heading" && Number(block.level) === 1));
  const intro = [];
  const sections = [];
  let current = null;

  for (const block of content) {
    if (block?.type === "heading" && Number(block.level) === 2) {
      current = { title: block.text, blocks: [] };
      sections.push(current);
      continue;
    }
    if (!current) intro.push(block);
    else current.blocks.push(block);
  }
  return { intro, sections };
}

function renderBlock(block) {
  if (!block) return "";
  const text = escapeHtml(block.text || "");
  if (!text) return "";
  if (block.type === "heading") {
    const level = Math.min(4, Math.max(3, Number(block.level) || 3));
    return `<h${level}>${text}</h${level}>`;
  }
  if (block.type === "paragraph") return `<p>${text}</p>`;
  return "";
}

function routeCategory(route) {
  const parts = normalizePath(route).split("/").filter(Boolean);
  return parts[0] || "";
}

function heroImageForRoute(route, family) {
  const category = routeCategory(route);
  if (family === "article") {
    const images = ["/assets/images/blog/1.png", "/assets/images/blog/2.png", "/assets/images/blog/3.png"];
    const score = String(route).split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return images[score % images.length];
  }

  const categoryImages = {
    "forex-white-label": "/assets/images/blog/1.png",
    "forex-grey-label": "/assets/images/blog/2.png",
    "forex-broker-turnkey": "/assets/images/blog/1.png",
    "forex-liquidity": "/assets/images/blog/2.png",
    "forex-crm": "/assets/images/blog/3.png",
    "trading-platforms": "/assets/images/blog/2.png",
    "mt-admin-license": "/assets/images/blog/3.png",
    "forex-company-license": "/assets/images/blog/1.png",
    "about-us": "/assets/images/team/4.png"
  };
  return categoryImages[category] || "/assets/images/about/1.png";
}

function breadcrumbs(route, entry, routeIndex) {
  const parts = normalizePath(route).split("/").filter(Boolean);
  const crumbs = [{ label: "Home", href: "/" }];
  let prefix = "/";
  for (let i = 0; i < parts.length; i++) {
    prefix += parts[i] + "/";
    const current = routeIndex.get(prefix);
    const last = i === parts.length - 1;
    const label = current?.title || (prefix === "/insights/" ? "Insights" : titleFromRouteSegment(parts[i]));
    crumbs.push({ label, href: last ? null : prefix });
  }
  if (crumbs.length === 1 && entry?.title) crumbs.push({ label: entry.title, href: null });
  return crumbs;
}

function renderBreadcrumbs(route, entry, routeIndex) {
  return `<nav class="mgl-crumb" aria-label="Breadcrumb"><ol>${breadcrumbs(route, entry, routeIndex)
    .map((crumb) => crumb.href
      ? `<li><a href="${escapeHtml(crumb.href)}">${escapeHtml(crumb.label)}</a></li>`
      : `<li aria-current="page">${escapeHtml(crumb.label)}</li>`)
    .join("")}</ol></nav>`;
}

function renderSections(sections) {
  return sections.map((section, index) => {
    const number = String(index + 1).padStart(2, "0");
    const id = `section-${index + 1}-${slugify(section.title)}`;
    return `<section class="mgl-copy-block mgl-copy-block--${index % 4}" id="${id}" aria-labelledby="${id}-title"><div class="mgl-copy-heading"><span>${number}</span><h2 id="${id}-title">${escapeHtml(section.title)}</h2></div><div class="mgl-copy-text">${section.blocks.map(renderBlock).join("")}</div></section>`;
  }).join("");
}

function renderToc(sections, family) {
  if (!sections.length) return "";
  const back = family === "article" ? "/insights/" : "/solutions/";
  const backLabel = family === "article" ? "All insights" : "All solutions";
  return `<aside class="mgl-toc"><div class="mgl-toc-inner"><span>ON THIS PAGE</span><ol>${sections.map((section, index) => {
    const id = `section-${index + 1}-${slugify(section.title)}`;
    return `<li><a href="#${id}">${escapeHtml(section.title)}</a></li>`;
  }).join("")}</ol><a class="mgl-toc-back" href="${back}">${backLabel} <span>→</span></a></div></aside>`;
}

function relatedEntries(route, routeIndex, family) {
  const category = routeCategory(route);
  const candidates = [...routeIndex.values()].filter((item) => {
    if (normalizePath(item.route) === normalizePath(route)) return false;
    if (item.route === "/") return false;
    if (family === "article") return item.route.startsWith("/insights/");
    return routeCategory(item.route) === category && !item.route.startsWith("/insights/");
  });
  const fallback = [...routeIndex.values()].filter((item) =>
    normalizePath(item.route) !== normalizePath(route) &&
    item.route !== "/" &&
    (family === "article" ? item.route.startsWith("/insights/") : !item.route.startsWith("/insights/"))
  );
  return [...candidates, ...fallback.filter((item) => !candidates.includes(item))].slice(0, 3);
}

function renderRelated(route, routeIndex, family) {
  const related = relatedEntries(route, routeIndex, family);
  if (!related.length) return "";
  const label = family === "article" ? "Brokerage insights" : "Brokerage solutions";
  return `<section class="mgl-related" aria-labelledby="related-title"><div class="container"><div class="mgl-section-label">KEEP EXPLORING</div><h2 id="related-title">Related ${family === "article" ? "insights" : "solutions"}</h2><div class="mgl-related-grid">${related.map((item) =>
    `<a class="mgl-related-card" href="${escapeHtml(item.route)}"><span>${label}</span><h3>${escapeHtml(item.title)}</h3><b>Explore <span aria-hidden="true">→</span></b></a>`
  ).join("")}</div></div></section>`;
}

function rootifySharedMarkup(markup = "") {
  return String(markup).replace(/\b(src|href)=(["'])([^"']+)\2/gi, (match, attr, quote, raw) => {
    const value = raw.trim();
    if (!value || value.startsWith("#") || value.startsWith("/") || value.startsWith("//") ||
        /^[a-z][a-z0-9+.-]*:/i.test(value)) return match;
    let next = value.replace(/^\.\//, "");
    if (next === "index.html") next = "";
    else if (next.startsWith("index.html#")) next = next.slice("index.html".length);
    next = "/" + next;
    return `${attr}=${quote}${next}${quote}`;
  });
}

export function injectSharedParts(html, header, footer) {
  let output = String(html || "");
  output = output.replace(/<template\b[^>]*data-shared-part=["']header["'][^>]*><\/template>/i, rootifySharedMarkup(header));
  output = output.replace(/<template\b[^>]*data-shared-part=["']footer["'][^>]*><\/template>/i, rootifySharedMarkup(footer));
  output = output.replace(/<script\b[^>]*src=["'][^"']*assets\/js\/includes\.js["'][^>]*><\/script>/gi, "");
  if (!/assets\/js\/custom\.js/.test(output)) {
    output = output.replace(/<\/body>/i, '<script src="/assets/js/custom.js"></script></body>');
  }
  return output;
}

export function rewriteRuntimeSeo(html, canonicalUrl, options = {}) {
  let output = String(html || "");
  const canonical = escapeHtml(canonicalUrl);
  output = output.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i, `<link rel="canonical" href="${canonical}">`);
  output = output.replace(/<meta\b[^>]*property=["']og:url["'][^>]*>/i, `<meta property="og:url" content="${canonical}">`);
  if (options.noindex) {
    if (/<meta\b[^>]*name=["']robots["'][^>]*>/i.test(output)) {
      output = output.replace(/<meta\b[^>]*name=["']robots["'][^>]*>/i, '<meta name="robots" content="noindex,follow">');
    } else {
      output = output.replace(/<\/head>/i, '<meta name="robots" content="noindex,follow"></head>');
    }
  }
  return output;
}

export function renderStructuredPage({ route, entry, routeIndex, header = "", footer = "", canonicalBase = "" }) {
  const doc = entry.document;
  const blocks = Array.isArray(doc?.blocks) ? doc.blocks : [];
  const title = firstH1(blocks, entry.title || doc?.title || "Meta Grey Label");
  const description = excerpt(firstParagraph(blocks), 160) || "Meta Grey Label brokerage technology and trading infrastructure.";
  const summary = excerpt(firstParagraph(blocks), 190);
  const { intro, sections } = splitDocument(blocks);
  const family = entry.family || (route.startsWith("/insights/") ? "article" : "service");
  const canonical = canonicalBase.replace(/\/$/, "") + normalizePath(route);
  const category = routeCategory(route);
  const heroImage = heroImageForRoute(route, family);

  const page = `<!doctype html>
<html lang="en" data-bs-theme="dark">
<head><script id="mgl-theme-boot">(function(){try{var q=new URLSearchParams(location.search).get('theme');var s=localStorage.getItem('theme');var t=q==='light'||q==='dark'?q:s==='light'||s==='dark'?s:'dark';document.documentElement.setAttribute('data-bs-theme',t)}catch(e){document.documentElement.setAttribute('data-bs-theme','dark')}})();</script>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} | Meta Grey Label</title>
<meta name="author" content="MetaGreyLabel">
<meta name="description" content="${escapeHtml(description)}">
<meta property="og:title" content="${escapeHtml(title)} | Meta Grey Label">
<meta property="og:site_name" content="Meta Grey Label">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:type" content="website">
<meta property="og:url" content="${escapeHtml(canonical)}">
<meta property="og:image" content="${escapeHtml(canonicalBase.replace(/\/$/, "") + "/media/branding/icon-512.png")}">
<link rel="canonical" href="${escapeHtml(canonical)}">
<link rel="icon" type="image/svg+xml" href="/media/branding/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/media/branding/favicon-32.png">
<link rel="apple-touch-icon" sizes="180x180" href="/media/branding/apple-touch-icon.png">
<link rel="stylesheet" href="/assets/css/bootstrap.min.css">
<link rel="stylesheet" href="/assets/css/aos.css">
<link rel="stylesheet" href="/assets/css/all.min.css">
<link rel="stylesheet" href="/assets/css/swiper-bundle.min.css">
<link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
<div class="preloader"><img src="/media/branding/logo-symbol.svg" alt="Meta Grey Label loading" width="90" height="90"></div>
${rootifySharedMarkup(header)}
<main class="mgl-inner-page mgl-family-${family} mgl-category-${slugify(category)}" id="main-content">
<section class="mgl-inner-hero" style="--mgl-inner-hero-image:url('${heroImage}')"><div class="container mgl-hero-grid"><div>
${renderBreadcrumbs(route, entry, routeIndex)}
<h1>${escapeHtml(title)}</h1>
${summary ? `<p class="mgl-hero-summary">${escapeHtml(summary)}</p>` : ""}
</div></div></section>
<section class="mgl-article-wrap"><div class="container"><div class="mgl-reading-layout"><article class="mgl-copy">
${intro.length ? `<div class="mgl-intro">${intro.map(renderBlock).join("")}</div>` : ""}
${renderSections(sections)}
</article>
${renderToc(sections, family)}
</div></div></section>
${renderRelated(route, routeIndex, family)}
<section class="mgl-bottom-cta"><div class="container"><div class="mgl-bottom-inner"><div><span>YOUR NEXT STEP</span><h2>Plan the operating model before the implementation.</h2><p>Review the platform, execution and client-operations layers together, then choose the structure that fits your brokerage.</p></div><div class="mgl-bottom-actions"><a class="mgl-btn mgl-btn-primary" href="/contact/">Get Started</a><a class="mgl-bottom-link" href="/solutions/">All solutions <span aria-hidden="true">→</span></a></div></div></div></section>
</main>
${rootifySharedMarkup(footer)}
<a href="#" class="scrollToTop scrollToTop--style1" aria-label="Scroll to top"><i class="fa-solid fa-arrow-up-from-bracket" aria-hidden="true"></i></a>
<script src="/assets/js/bootstrap.bundle.min.js"></script>
<script src="/assets/js/all.min.js"></script>
<script src="/assets/js/swiper-bundle.min.js"></script>
<script src="/assets/js/aos.js"></script>
<script src="/assets/js/purecounter_vanilla.js"></script>
<script src="/assets/js/custom.js"></script>
</body></html>`;
  return page;
}

export function renderDynamicSitemap(data, canonicalBase) {
  const base = canonicalBase.replace(/\/$/, "");
  const routes = new Set(["/", "/contact/", "/services.html", "/solutions/", "/insights/"]);
  for (const page of data?.pageMap?.pages || []) {
    if (page.status === "available" && page.route && page.route !== "/404.html") routes.add(normalizePath(page.route));
  }
  const escapeXml = (value) => String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<?xml version="1.0" encoding="utf-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${[...routes].map((route) => `  <url><loc>${escapeXml(base + route)}</loc></url>`).join("\n")}\n</urlset>\n`;
}

export function renderSimple404({ header = "", footer = "", canonicalBase = "" } = {}) {
  return `<!doctype html><html lang="en" data-bs-theme="dark"><head><script id="mgl-theme-boot">(function(){try{var q=new URLSearchParams(location.search).get('theme');var s=localStorage.getItem('theme');var t=q==='light'||q==='dark'?q:s==='light'||s==='dark'?s:'dark';document.documentElement.setAttribute('data-bs-theme',t)}catch(e){document.documentElement.setAttribute('data-bs-theme','dark')}})();</script><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Page Not Found | Meta Grey Label</title><link rel="stylesheet" href="/assets/css/bootstrap.min.css"><link rel="stylesheet" href="/assets/css/style.css"></head><body>${rootifySharedMarkup(header)}<main class="mgl-inner-page" id="main-content"><section class="mgl-inner-hero"><div class="container"><h1>Page not found</h1><p class="mgl-hero-summary">The page you requested does not exist or may have moved.</p><a class="mgl-btn mgl-btn-primary" href="/">Return home</a></div></section></main>${rootifySharedMarkup(footer)}<script src="/assets/js/bootstrap.bundle.min.js"></script><script src="/assets/js/custom.js"></script></body></html>`;
}
