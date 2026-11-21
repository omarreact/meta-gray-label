import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { existsSync, mkdirSync } from "node:fs";
import { extname, join, normalize, resolve } from "node:path";
import { chromium } from "playwright";

const root = resolve("dist/public");
const shots = resolve("tmp/responsive-browser-screens");
mkdirSync(shots, { recursive: true });

const MIME = {
  ".html":"text/html; charset=utf-8",
  ".css":"text/css; charset=utf-8",
  ".js":"application/javascript; charset=utf-8",
  ".mjs":"application/javascript; charset=utf-8",
  ".json":"application/json; charset=utf-8",
  ".svg":"image/svg+xml",
  ".png":"image/png",
  ".jpg":"image/jpeg",
  ".jpeg":"image/jpeg",
  ".webp":"image/webp",
  ".woff":"font/woff",
  ".woff2":"font/woff2"
};

function safeFile(pathname) {
  let clean = decodeURIComponent(pathname.split("?")[0] || "/");
  if (clean === "/") clean = "/index.html";
  if (clean.endsWith("/")) clean += "index.html";
  const file = normalize(join(root, clean.replace(/^\/+/, "")));
  if (!file.startsWith(root)) return null;
  return file;
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const file = safeFile(url.pathname);
    if (!file || !existsSync(file)) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    const body = await readFile(file);
    res.writeHead(200, {
      "content-type": MIME[extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(body);
  } catch (error) {
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(String(error));
  }
});

await new Promise((resolveReady) => server.listen(4173, "127.0.0.1", resolveReady));
const base = "http://127.0.0.1:4173";
const widths = [360, 390, 768, 1024, 1180, 1440, 1920];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function inspectLayout(page, width, label) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;
    const header = document.querySelector(".mgl-site-header");
    const toggle = document.querySelector(".mgl-menu-toggle");
    const social = document.querySelector(".mgl-header-social");
    const cta = document.querySelector(".mgl-header-cta");
    const nav = document.querySelector(".mgl-primary-nav");
    const h1 = document.querySelector("main h1");
    const rect = header?.getBoundingClientRect();
    const display = (node) => node ? getComputedStyle(node).display : "missing";
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && r.width > 0 && r.height > 0;
    };
    return {
      viewport: window.innerWidth,
      scrollWidth: root.scrollWidth,
      overflow: root.scrollWidth - window.innerWidth,
      headerLeft: rect?.left ?? null,
      headerRight: rect?.right ?? null,
      headerWidth: rect?.width ?? null,
      toggleVisible: visible(toggle),
      socialDisplay: display(social),
      ctaDisplay: display(cta),
      navDisplay: display(nav),
      h1Visible: visible(h1)
    };
  });

  assert(metrics.overflow <= 2, `${label} @ ${width}px horizontal overflow: ${metrics.overflow}px`);
  assert(metrics.h1Visible, `${label} @ ${width}px H1 is not visible`);
  assert(metrics.headerLeft !== null && metrics.headerLeft >= -1, `${label} @ ${width}px header left clipped`);
  assert(metrics.headerRight !== null && metrics.headerRight <= width + 1, `${label} @ ${width}px header right clipped: ${metrics.headerRight}`);

  if (width <= 1199) {
    assert(metrics.toggleVisible, `${label} @ ${width}px mobile menu toggle is not visible`);
    assert(metrics.socialDisplay === "none", `${label} @ ${width}px social control leaked into mobile top bar`);
    assert(metrics.ctaDisplay === "none", `${label} @ ${width}px desktop CTA leaked into mobile top bar`);
  } else {
    assert(!metrics.toggleVisible, `${label} @ ${width}px mobile menu toggle remains visible on desktop`);
    assert(metrics.navDisplay !== "none", `${label} @ ${width}px desktop nav is hidden`);
  }

  return metrics;
}

const browser = await chromium.launch({ headless: true });
const report = [];

try {
  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: width <= 390 ? 844 : width <= 768 ? 900 : 1000 },
      deviceScaleFactor: 1,
      isMobile: width <= 390,
      hasTouch: width <= 390
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push("pageerror: " + error.message));
    page.on("response", (response) => {
      const type = response.request().resourceType();
      if (response.status() >= 400 && ["document", "stylesheet", "script", "image", "font"].includes(type)) {
        errors.push(type + " " + response.status() + ": " + response.url());
      }
    });

    await page.goto(base + "/index.html?theme=dark", { waitUntil: "networkidle" });
    await page.waitForSelector(".mgl-site-header");
    const home = await inspectLayout(page, width, "home");

    if (width <= 1199) {
      const toggle = page.locator(".mgl-menu-toggle");
      await toggle.click();
      assert(await toggle.getAttribute("aria-expanded") === "true", `home @ ${width}px menu did not open`);
      const openOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(openOverflow <= 2, `home @ ${width}px open mobile menu causes horizontal overflow: ${openOverflow}px`);
      await page.keyboard.press("Escape");
      assert(await toggle.getAttribute("aria-expanded") === "false", `home @ ${width}px Escape did not close menu`);
    }

    await page.screenshot({ path: join(shots, `home-${width}.png`), fullPage: true });

    await page.goto(base + "/contact/?theme=dark", { waitUntil: "networkidle" });
    await page.waitForSelector("#mgl-enquiry-form");
    const contact = await inspectLayout(page, width, "contact");
    await page.screenshot({ path: join(shots, `contact-${width}.png`), fullPage: true });

    if (width === 390) {
      await page.locator('[name="name"]').fill("Responsive QA");
      await page.locator('[name="contact"]').fill("qa@example.test");
      await page.locator('[name="model"]').selectOption({ label: "Grey Label" });
      await page.locator('[name="platform"]').selectOption({ label: "MT5" });
      await page.getByRole("button", { name: /Prepare enquiry/i }).click();
      await page.waitForSelector("#mgl-enquiry-output:not([hidden])");
      assert((await page.locator("#mgl-enquiry-summary").textContent())?.includes("Responsive QA"),
        "contact @ 390px prepared brief is missing submitted name");
      assert((await page.locator("#mgl-enquiry-status").textContent())?.includes("No data has been transmitted"),
        "contact @ 390px transmission disclosure missing after prepare");
    }

    assert(errors.length === 0, `${width}px browser errors:\n${errors.join("\n")}`);
    report.push({ width, home, contact });
    await context.close();
  }

  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const themePage = await context.newPage();
  await themePage.goto(base + "/index.html?theme=dark", { waitUntil: "networkidle" });
  const before = await themePage.locator("html").getAttribute("data-bs-theme");
  await themePage.locator("#btnSwitch").click();
  const after = await themePage.locator("html").getAttribute("data-bs-theme");
  assert(before === "dark" && after === "light", `theme toggle failed: ${before} -> ${after}`);
  await context.close();

  console.log("RESPONSIVE BROWSER QA PASS");
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}
