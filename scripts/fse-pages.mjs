/**
 * Block-first projection of the canonical JSON content.
 *
 * The 48 routes with authoritative structured documents have native,
 * independently editable core/heading and core/paragraph block content.
 * Unmapped directory/index routes retain their existing HTML renderer.
 * This module never mutates data/content.json or production HTML.
 */
const safeText = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function familyOf(route) {
  if (route === "/") return "home";
  if (route.startsWith("/insights/")) return "editorial";
  if (route.includes("grey-label")) return "grey-label";
  if (route.includes("white-label")) return "white-label";
  if (route.includes("liquidity")) return "liquidity";
  if (route.includes("crm")) return "crm";
  if (route.includes("trading-platforms")) return "platforms";
  if (route.includes("admin-license")) return "admin";
  return "brokerage";
}
function slugOf(path) {
  const slug = path === "index.html" ? "home" : path.replace(/\/index\.html$/, "").replace(/\.html$/, "");
  if (!/^[a-z0-9/-]+$/.test(slug) || !slug) throw new Error("Unsafe source path: " + path);
  return slug;
}
function jsonAttr(attrs) {
  return Object.keys(attrs).length ? " " + JSON.stringify(attrs) : "";
}
function heading(text, level = 2) {
  const n = Math.max(1, Math.min(6, Number(level) || 2));
  const attrs = n === 2 ? {} : { level: n };
  return "<!-- wp:heading" + jsonAttr(attrs) + " -->\n<h" + n + ' class="wp-block-heading">' +
    safeText(text) + "</h" + n + ">\n<!-- /wp:heading -->";
}
function paragraph(text, className) {
  const attr = className ? { className } : {};
  return "<!-- wp:paragraph" + jsonAttr(attr) + " -->\n<p" +
    (className ? ' class="' + className + '"' : "") + ">" + safeText(text) + "</p>\n<!-- /wp:paragraph -->";
}
function openGroup(cls, tag = "div") {
  const opts = { className: cls, layout: { type: "constrained" } };
  if (tag !== "div") opts.tagName = tag;
  return "<!-- wp:group" + jsonAttr(opts) + " -->\n<" + tag +
    ' class="wp-block-group ' + cls + '">';
}
function closeGroup(tag = "div") {
  return "</" + tag + ">\n<!-- /wp:group -->";
}
function routeClass(route) {
  return route === "/" ? "home" : route.replace(/^\/|\/$/g, "").replace(/\.html$/, "").replace(/[^a-z0-9-]+/g, "-");
}
function nativePageMarkup(entry, document, sequence) {
  const family = familyOf(entry.route);
  const name = "mgl-native-page mgl-native-page--" + family + " mgl-native-route--" + routeClass(entry.route);
  const blocks = document.blocks;
  if (!Array.isArray(blocks) || !blocks.length) throw new Error("No structured content for " + entry.path);
  const chunks = [openGroup(name, "main")];
  let open = false;
  let sectionIndex = 0;
  let sawH1 = false;
  function beginSection(variant) {
    if (open) chunks.push(closeGroup("section"));
    const cls = "mgl-native-section mgl-native-section--" + (sectionIndex % 5) +
      " mgl-native-section--" + variant;
    chunks.push(openGroup(cls, "section"));
    open = true;
    sectionIndex++;
  }
  beginSection("hero");
  chunks.push(paragraph("Meta Grey Label / " + family.replaceAll("-", " "), "mgl-native-eyebrow"));
  for (const block of blocks) {
    if (block.type === "heading") {
      const level = Math.max(1, Math.min(6, Number(block.level) || 2));
      if (level === 1) {
        sawH1 = true;
      } else if (level === 2) {
        beginSection(sectionIndex % 2 ? "split" : "editorial");
      }
      chunks.push(heading(block.text, level));
    } else if (block.type === "paragraph") {
      chunks.push(paragraph(block.text));
    } else {
      throw new Error("Unexpected block type in " + entry.path + ": " + block.type);
    }
  }
  if (!sawH1) chunks.splice(2, 0, heading(document.title || entry.title || "Meta Grey Label", 1));
  if (open) chunks.push(closeGroup("section"));
  chunks.push(closeGroup("main"));
  const markup = chunks.join("\n") + "\n";
  if ((markup.match(/<!-- wp:group/g) || []).length !==
      (markup.match(/<!-- \/wp:group -->/g) || []).length) {
    throw new Error("Unbalanced Gutenberg groups: " + entry.path);
  }
  if (markup.includes("__MGL_CONTENT_") || markup.includes("<script")) {
    throw new Error("Invalid generated blocks: " + entry.path);
  }
  return { path: entry.path, slug: slugOf(entry.path), route: entry.route, title: entry.title,
    documentId: entry.id, family, sections: sectionIndex, blocks: blocks.length, sequence, markup };
}
function directoryPageMarkup(config, source, sequence) {
  const rec = config.pages[source];
  const is404 = source === "404.html";
  const f = rec.fields;
  const get = (number) => f["__MGL_CONTENT_" + String(number).padStart(5, "0") + "__"] || "";
  const options = {
    "404.html": [19, 22, 22],
    "insights/index.html": [14, 15, 17],
    "services.html": [18, 19, 22],
    "solutions/index.html": [14, 15, 17]
  };
  const [titleId, introId, sectionId] = options[source];
  const title = get(titleId).replace(/&amp;/g, "&");
  const lead = get(introId);
  const family = is404 ? "missing" : source.startsWith("insights") ? "editorial" : "directory";
  const cls = "mgl-native-page mgl-native-page--" + family +
    " mgl-native-route--" + routeClass(rec.route);
  const list = [];
  if (source === "404.html") {
    list.push({ route: "/", title: get(23) || "Return Home" });
  } else {
    const categories = config.pageMap.pages.filter((item) => {
      if (source === "insights/index.html") return item.route.startsWith("/insights/");
      if (source === "services.html") return item.route.split("/").filter(Boolean).length === 1 &&
        /\/(forex|mt-admin|trading-platforms)/.test(item.route);
      return !item.route.startsWith("/insights/") &&
        /\/(forex|mt-admin|trading-platforms)/.test(item.route);
    });
    for (const item of categories) {
      list.push({ route: item.route, title: item.title });
    }
  }
  const out = [
    openGroup(cls, "main"),
    openGroup("mgl-native-section mgl-native-section--0 mgl-native-section--hero", "section"),
    paragraph("Meta Grey Label / " + (is404 ? "Page not found" : "Solutions"), "mgl-native-eyebrow"),
    heading(title, 1),
    paragraph(lead),
    closeGroup("section")
  ];
  if (list.length) {
    out.push(openGroup("mgl-native-section mgl-native-section--1 mgl-native-section--directory", "section"));
    out.push(heading(get(sectionId) || "Explore", 2));
    for (const item of list) {
      const url = item.route.startsWith("/") ? item.route : nativeUrl(item.route);
      out.push('<!-- wp:paragraph --><p><a href="' + safeText(url) + '">' +
        safeText(item.title) + '</a></p><!-- /wp:paragraph -->');
    }
    out.push(closeGroup("section"));
  }
  out.push(closeGroup("main"));
  return { path: source, slug: slugOf(source), route: rec.route, title,
    documentId: null, family, sections: list.length ? 2 : 1,
    blocks: list.length + 3, sequence, markup: out.join("\n") + "\n" };
}
/**
 * The historical source document for the homepage differs from its current
 * approved 11-section homepage. The visible page fields are authoritative
 * for its native projection: preserve current headings, body copy and CTA URLs.
 */
function htmlText(markup) {
  return String(markup || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&(?:nbsp|#160);/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, " ").trim();
}
function homePageMarkup(entry, config, homepageTemplate, sequence) {
  if (typeof homepageTemplate !== "string" || !homepageTemplate.includes('id="home"')) {
    throw new Error("Rendered homepage source is required to preserve approved homepage copy");
  }
  const fields = config.pages["index.html"].fields;
  const html = homepageTemplate.replace(/__MGL_CONTENT_\d{5}__/g, (key) => {
    if (!Object.hasOwn(fields, key)) throw new Error("Missing home field " + key);
    return fields[key];
  });
  const sections = [...html.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section\s*>/gi)];
  if (sections.length !== 11) throw new Error("Homepage section inventory changed: " + sections.length);
  const pageClass = "mgl-native-page mgl-native-page--home mgl-native-route--home";
  const parts = [openGroup(pageClass, "main")];
  let n = 0;
  let hasH1 = false;
  let blockCount = 0;
  for (const [index,section] of sections.entries()) {
    const id = (section[1].match(/\bid\s*=\s*["']([^"']+)["']/i)||[])[1];
    const cls = "mgl-native-section mgl-native-section--" + (index % 5) +
      (index === 0 ? " mgl-native-section--hero" : " mgl-native-section--editorial");
    const options = { tagName: "section", className: cls, layout: { type: "constrained" } };
    if (id) options.anchor = id;
    parts.push("<!-- wp:group" + jsonAttr(options) + " -->\n<section" +
      (id ? ' id="' + safeText(id) + '"' : "") + ' class="wp-block-group ' + cls + '">');
    const items = [...section[2].matchAll(/<(h[1-6]|p)\b[^>]*>([\s\S]*?)<\/\1\s*>/gi)];
    for (const item of items) {
      const text = htmlText(item[2]);
      if (!text || text.length < 2) continue;
      if (item[1].startsWith("h")) {
        const level = Number(item[1].slice(1));
        if (level===1) hasH1 = true;
        parts.push(heading(text, level));
      } else {
        parts.push(paragraph(text));
      }
      blockCount++;
    }
    const buttons = [];
    for (const anchor of section[2].matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
      const clsName = (anchor[1].match(/\bclass\s*=\s*["']([^"']*)["']/i)||[])[1] || "";
      if (!/(^|[\s-])btn(?:\s|-|$)|button/i.test(clsName)) continue;
      const href = (anchor[1].match(/\bhref\s*=\s*["']([^"']*)["']/i)||[])[1] || "";
      const label = htmlText(anchor[2]);
      if (!href || !label || /^(?:javascript|data):/i.test(href)) continue;
      buttons.push([label, href.startsWith("#") || /^(?:mailto:|https?:)/i.test(href) ? href : nativeUrl(href)]);
      if (buttons.length>=4) break;
    }
    if (buttons.length) {
      parts.push('<!-- wp:buttons --><div class="wp-block-buttons">');
      for (const [label,url] of buttons) {
        parts.push('<!-- wp:button --><div class="wp-block-button">' +
          '<a class="wp-block-button__link wp-element-button" href="' +
          safeText(url) + '">' + safeText(label) + '</a></div><!-- /wp:button -->');
        blockCount++;
      }
      parts.push('</div><!-- /wp:buttons -->');
    }
    parts.push(closeGroup("section"));
    n++;
  }
  if (!hasH1) throw new Error("Visible homepage H1 missing from native projection");
  parts.push(closeGroup("main"));
  return { path: "index.html", slug: "home", route: "/", title: "Home",
    documentId: null, source: "visible-page-fields", family: "home",
    sections: n, blocks: blockCount, sequence, markup: parts.join("\n") + "\n" };
}
export function buildNativePages(config, homepageTemplate) {
  if (!config?.pages || !config?.content?.documents || !config?.pageMap?.pages) {
    throw new Error("Missing canonical content data");
  }
  const results = [];
  const seen = new Set();
  let index = 0;
  for (const entry of config.pageMap.pages) {
    if (!config.pages[entry.path] || seen.has(entry.path)) {
      throw new Error("Duplicate or unknown page in page map: " + entry.path);
    }
    const document = config.content.documents[entry.id];
    if (!document || document.status !== "available") {
      throw new Error("Missing document " + entry.id + " for " + entry.path);
    }
    const page = entry.path === "index.html" ?
      homePageMarkup(entry, config, homepageTemplate, index++) :
      nativePageMarkup(entry, document, index++);
    results.push(page);
    seen.add(entry.path);
  }
  const special = Object.entries(config.pages)
    .filter(([path, value]) => value.role === "page" && !seen.has(path))
    .map(([path]) => path).sort();
  for (const source of special) {
    results.push(directoryPageMarkup(config, source, index++));
    seen.add(source);
  }
  if (results.length !== 52 || seen.size !== 52) {
    throw new Error("Native page inventory differs from canonical JSON");
  }
  return { pages: results, special, excluded: [] };
}
function nativeUrl(route) {
  if (route === "index.html") return "/";
  if (route.startsWith("index.html#")) return "/" + route.slice("index.html".length);
  if (route === "services.html") return "/services/";
  if (route.startsWith("/")) return route === "/services.html" ? "/services/" : route;
  return "/" + route.replace(/(^\.\/|index\.html$)/g, "");
}
function navLink(label, route) {
  const url = nativeUrl(route);
  return "<!-- wp:navigation-link" + jsonAttr({ label: label.replace(/&amp;/g, "&"), url, kind: "custom" }) + " -->\n<!-- /wp:navigation-link -->";
}
function navSubmenu(label, route, children, topLevel = false) {
  const attrs = { label: label.replace(/&amp;/g, "&"), url: nativeUrl(route), kind: "custom" };
  if (topLevel) attrs.isTopLevelItem = true;
  return "<!-- wp:navigation-submenu" + jsonAttr(attrs) + " -->\n" +
    children.join("\n") + "\n<!-- /wp:navigation-submenu -->";
}
export function buildNativeParts(config) {
  const f = config.pages["header.html"].fields;
  const get = (n) => f["__MGL_CONTENT_" + String(n).padStart(5, "0") + "__"];
  const link = (t,h) => {
    if (!get(t) || !get(h)) throw new Error("Missing menu label/link " + t);
    return navLink(get(t),get(h));
  };
  const menuSection = (heading, start, end, firstHref) => {
    const children = [];
    for(let i=start;i<=end;i++) children.push(link(i,firstHref+i-start));
    return navSubmenu(get(heading),get(firstHref),children);
  };
  const solutions = navSubmenu(get(2),get(51),[
    menuSection(3,4,5,52),
    menuSection(6,7,11,54),
    menuSection(12,13,17,59),
    menuSection(18,19,23,64),
    menuSection(24,25,28,69),
    menuSection(29,30,34,73),
    menuSection(35,36,39,78)
  ],true);
  const company = navSubmenu(get(41),get(83),[link(42,84),link(43,85),link(44,86)],true);
  const navMarkup = [link(1,50),solutions,link(40,82),company,
    link(45,87),link(46,88),link(47,89)].join("\n");
  const header = [
    '<!-- wp:group {"align":"full","className":"mgl-native-site-header","layout":{"type":"flex","justifyContent":"space-between","flexWrap":"wrap"}} -->',
    '<div class="wp-block-group alignfull mgl-native-site-header">',
    '<!-- wp:group {"className":"mgl-native-brand","layout":{"type":"flex","flexWrap":"nowrap"}} -->',
    '<div class="wp-block-group mgl-native-brand">',
    '<!-- wp:site-logo {"width":60,"shouldSyncIcon":false} /-->',
    '<!-- wp:site-title {"level":0} /-->',
    '</div><!-- /wp:group -->',
    '<!-- wp:navigation {"overlayMenu":"mobile","className":"mgl-native-navigation","layout":{"type":"flex","justifyContent":"right"}} -->',
    navMarkup,
    '<!-- /wp:navigation -->',
    '</div><!-- /wp:group -->'
  ].join("\n") + "\n";
  const ff = config.pages["footer.html"].fields;
  const getFooter = (n) => ff["__MGL_CONTENT_" + String(n).padStart(5, "0") + "__"];
  const links = [[3,21],[4,22],[5,23],[8,25],[9,26],[10,27],[13,29]].map(([t,h]) => {
    const name = getFooter(t)?.replace(/&amp;/g, "&");
    const path = getFooter(h);
    if (!name || !path) throw new Error("Missing footer link " + t);
    const url = nativeUrl(path);
    return '<!-- wp:paragraph --><p><a href="' + safeText(url) + '">' + safeText(name) +
      '</a></p><!-- /wp:paragraph -->';
  }).join("\n");
  const footer = [
    '<!-- wp:group {"align":"full","className":"mgl-native-site-footer","layout":{"type":"constrained"}} -->',
    '<div class="wp-block-group alignfull mgl-native-site-footer">',
    '<!-- wp:site-title {"level":0} /-->',
    '<!-- wp:paragraph --><p>' + safeText(getFooter(1)) + '</p><!-- /wp:paragraph -->',
    '<!-- wp:columns --><div class="wp-block-columns">',
    '<!-- wp:column --><div class="wp-block-column">',
    '<!-- wp:heading {"level":3} --><h3 class="wp-block-heading">Explore</h3><!-- /wp:heading -->',
    links,
    '</div><!-- /wp:column -->',
    '</div><!-- /wp:columns -->',
    '</div><!-- /wp:group -->'
  ].join("\n") + "\n";
  return { header, footer };
}
export function nativePreview(page, styleLink = "../../../assets/css/fse.css") {
  const body = page.markup.replace(/<!--\s*\/?wp:[\s\S]*?-->/g, "");
  return '<!doctype html>\n<html lang="en"><head><meta charset="utf-8">' +
    '<meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow">' +
    '<title>' + safeText(page.title) + ' – FSE Preview</title>' +
    '<link rel="stylesheet" href="' + styleLink + '"></head><body>' +
    body + '</body></html>\n';
}
