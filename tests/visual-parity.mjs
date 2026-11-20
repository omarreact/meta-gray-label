import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";

const sourceBase = process.env.MGL_SOURCE_BASE || "http://127.0.0.1:4173";
const wordpressBase = process.env.MGL_WP_BASE || "http://localhost:8888";
const dir = "tmp/design-parity";
mkdirSync(dir, { recursive: true });

const routes = [
  { slug: "home", source: "/", wordpress: "/" },
  { slug: "services", source: "/services.html", wordpress: "/services/" },
  { slug: "solutions", source: "/solutions/", wordpress: "/solutions/" },
  { slug: "insights", source: "/insights/", wordpress: "/insights/" }
];
const sizes = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "mobile", width: 390, height: 844 }
];

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const report = { generatedAt: new Date().toISOString(), sourceBase, wordpressBase, cases: [] };

async function inspect(page) {
  return page.evaluate(() => {
    const box = (selector) => {
      const el = document.querySelector(selector);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        x: Math.round(r.x), y: Math.round(r.y),
        width: Math.round(r.width), height: Math.round(r.height),
        color: cs.color, backgroundColor: cs.backgroundColor,
        fontFamily: cs.fontFamily, fontSize: cs.fontSize, lineHeight: cs.lineHeight
      };
    };
    const h1 = document.querySelector("h1");
    const h1box = h1 ? box("h1") : null;
    return {
      title: document.title,
      theme: document.documentElement.getAttribute("data-bs-theme"),
      body: box("body"),
      header: box("header"),
      main: box("main"),
      footer: box("footer"),
      h1: h1 ? { text: h1.textContent.trim().replace(/\s+/g, " "), ...h1box } : null,
      h1Count: document.querySelectorAll("h1").length,
      sections: document.querySelectorAll("section").length || document.querySelectorAll(".mgl-native-section").length,
      navLinks: document.querySelectorAll("header a").length,
      mobileToggleVisible: [...document.querySelectorAll(".header-bar,.wp-block-navigation__responsive-container-open")]
        .some((el) => {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          return r.width > 0 && r.height > 0 && cs.display !== "none" && cs.visibility !== "hidden";
        }),
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      scrollHeight: document.documentElement.scrollHeight
    };
  });
}

async function capture(kind, base, route, size) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    colorScheme: "dark"
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));

  const response = await page.goto(base + route, { waitUntil: "networkidle", timeout: 45000 });
  assert.ok(response && response.status() < 400, kind + " " + route + " HTTP " + response?.status());

  if (kind === "source") {
    await page.waitForSelector("header", { state: "attached", timeout: 10000 });
    await page.waitForSelector("footer", { state: "attached", timeout: 10000 });
    await page.waitForTimeout(500);
  }

  // Exercise the page like a real visitor so AOS/lazy content is revealed before evidence capture.
  await page.evaluate(async () => {
    const maxY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const step = Math.max(240, Math.floor(window.innerHeight * 0.7));
    for (let y = 0; y <= maxY; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 35));
    }
    window.scrollTo(0, maxY);
    await new Promise((resolve) => setTimeout(resolve, 150));
    window.AOS?.refreshHard?.();
    window.scrollTo(0, 0);
    await new Promise((resolve) => setTimeout(resolve, 250));
  });

  const metrics = await inspect(page);
  assert.equal(metrics.h1Count, 1, kind + " " + route + " must have exactly one H1");
  assert.ok(metrics.scrollWidth <= metrics.clientWidth + 3,
    kind + " " + route + " horizontal overflow " + metrics.scrollWidth + " > " + metrics.clientWidth);

  const file = `${dir}/${route === "/" ? "home" : route.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/g, "-")}-${kind}-${size.name}.png`;
  await page.screenshot({ path: file, fullPage: true });
  await context.close();
  return { file, metrics, errors };
}

try {
  for (const size of sizes) {
    for (const route of routes) {
      const source = await capture("source", sourceBase, route.source, size);
      const wordpress = await capture("wordpress", wordpressBase, route.wordpress, size);
      report.cases.push({ slug: route.slug, size: size.name, source, wordpress });
    }
  }
} finally {
  await browser.close();
}

writeFileSync(dir + "/metrics.json", JSON.stringify(report, null, 2) + "\n");
console.log("VISUAL PARITY EVIDENCE PASS: 16 full-page screenshots + layout metrics.");
