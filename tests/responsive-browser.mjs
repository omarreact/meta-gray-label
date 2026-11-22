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
const widths = [360, 390, 768, 1024, 1180, 1280, 1440, 1920];

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
    const navList = document.querySelector(".mgl-nav-list");
    const h1 = document.querySelector("main h1");
    const navLink = document.querySelector(".mgl-nav-link");
    const rect = header?.getBoundingClientRect();
    const display = (node) => node ? getComputedStyle(node).display : "missing";
    const visible = (node) => {
      if (!node) return false;
      const style = getComputedStyle(node);
      const r = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && r.width > 0 && r.height > 0;
    };
    const bodyStyle = getComputedStyle(document.body);
    const h1Style = h1 ? getComputedStyle(h1) : null;
    const navStyle = navLink ? getComputedStyle(navLink) : null;
    const ctaStyle = cta ? getComputedStyle(cta) : null;
    const numeric = (value) => Number.parseFloat(value || "0");
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
      navRows: navList ? new Set(Array.from(navList.children).filter(visible).map((item) => Math.round(item.getBoundingClientRect().top))).size : null,
      h1Visible: visible(h1),
      bodyFontFamily: bodyStyle.fontFamily,
      bodyFontWeight: bodyStyle.fontWeight,
      bodyFontSize: numeric(bodyStyle.fontSize),
      bodyLineHeight: numeric(bodyStyle.lineHeight),
      h1FontFamily: h1Style?.fontFamily || "",
      h1FontWeight: h1Style?.fontWeight || "",
      h1FontSize: numeric(h1Style?.fontSize),
      h1LineHeight: numeric(h1Style?.lineHeight),
      h1LetterSpacing: numeric(h1Style?.letterSpacing),
      navFontFamily: navStyle?.fontFamily || "",
      navFontWeight: navStyle?.fontWeight || "",
      navFontSize: numeric(navStyle?.fontSize),
      navLineHeight: numeric(navStyle?.lineHeight),
      ctaFontFamily: ctaStyle?.fontFamily || "",
      ctaFontWeight: ctaStyle?.fontWeight || "",
      ctaFontSize: numeric(ctaStyle?.fontSize),
      ctaLineHeight: numeric(ctaStyle?.lineHeight)
    };
  });

  assert(metrics.overflow <= 2, `${label} @ ${width}px horizontal overflow: ${metrics.overflow}px`);
  assert(metrics.h1Visible, `${label} @ ${width}px H1 is not visible`);
  assert(metrics.headerLeft !== null && metrics.headerLeft >= -1, `${label} @ ${width}px header left clipped`);
  assert(metrics.headerRight !== null && metrics.headerRight <= width + 1, `${label} @ ${width}px header right clipped: ${metrics.headerRight}`);
  assert(/^\"?Inter\b/i.test(metrics.bodyFontFamily), `${label} @ ${width}px body is not using Inter reference stack: ${metrics.bodyFontFamily}`);
  assert(metrics.bodyFontWeight === "400", `${label} @ ${width}px body weight is ${metrics.bodyFontWeight}, expected 400`);
  assert(metrics.bodyFontSize >= 14 && metrics.bodyFontSize <= 17.1, `${label} @ ${width}px body size ${metrics.bodyFontSize} outside 14–17px reference range`);
  assert(Math.abs(metrics.bodyLineHeight / metrics.bodyFontSize - 1.65) < 0.03, `${label} @ ${width}px body line-height ratio differs from 1.65`);
  assert(/^\"?Inter\b/i.test(metrics.h1FontFamily), `${label} @ ${width}px H1 is not using Inter reference stack`);
  assert(metrics.h1LetterSpacing < 0, `${label} @ ${width}px H1 reference negative tracking missing`);
  assert(/^\"?Inter\b/i.test(metrics.navFontFamily), `${label} @ ${width}px nav is not using Inter reference stack`);
  assert(Math.abs(metrics.navFontSize - 14) < 0.25, `${label} @ ${width}px nav size ${metrics.navFontSize} is not 14px`);
  assert(metrics.navFontWeight === "600", `${label} @ ${width}px nav weight is ${metrics.navFontWeight}, expected 600`);
  assert(Math.abs(metrics.navLineHeight / metrics.navFontSize - 1.5) < 0.03, `${label} @ ${width}px nav line-height ratio differs from 1.5`);
  assert(/^\"?Inter\b/i.test(metrics.ctaFontFamily), `${label} @ ${width}px CTA is not using Inter reference stack`);
  assert(metrics.ctaFontWeight === "800", `${label} @ ${width}px CTA weight is ${metrics.ctaFontWeight}, expected 800`);
  assert(Math.abs(metrics.ctaFontSize - 14) < 0.25, `${label} @ ${width}px CTA size ${metrics.ctaFontSize} is not 14px`);

  if (width <= 1199) {
    assert(metrics.toggleVisible, `${label} @ ${width}px mobile menu toggle is not visible`);
    assert(metrics.socialDisplay === "none", `${label} @ ${width}px social control leaked into mobile top bar`);
    assert(metrics.ctaDisplay === "none", `${label} @ ${width}px desktop CTA leaked into mobile top bar`);
  } else {
    assert(!metrics.toggleVisible, `${label} @ ${width}px mobile menu toggle remains visible on desktop`);
    assert(metrics.navDisplay !== "none", `${label} @ ${width}px desktop nav is hidden`);
    assert(metrics.navRows === 1, `${label} @ ${width}px desktop navigation wrapped into ${metrics.navRows} rows`);
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
    await page.route('https://fonts.googleapis.com/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: '/* mocked Google Fonts CSS2 response for QA */' });
    });
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
    assert(home.h1FontWeight === "600", `home @ ${width}px hero weight is ${home.h1FontWeight}, expected 600`);
    assert(Math.abs(home.h1LineHeight / home.h1FontSize - 1.04) < 0.03, `home @ ${width}px hero line-height ratio differs from 1.04`);

    await page.waitForSelector("#mgl-dev-settings-toggle");
    assert(await page.locator("#mgl-dev-settings-toggle").isVisible(), `home @ ${width}px floating settings control is not visible`);
    assert(await page.locator("#mgl-dev-settings-panel").getAttribute("aria-hidden") === "true",
      `home @ ${width}px settings panel should start closed`);

    if (width <= 1199) {
      const toggle = page.locator(".mgl-menu-toggle");
      await toggle.click();
      assert(await toggle.getAttribute("aria-expanded") === "true", `home @ ${width}px menu did not open`);
      const openOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(openOverflow <= 2, `home @ ${width}px open mobile menu causes horizontal overflow: ${openOverflow}px`);
      const firstDisclosure = page.locator("[data-nav-disclosure]").first();
      await firstDisclosure.click();
      assert(await firstDisclosure.getAttribute("aria-expanded") === "true", `home @ ${width}px submenu did not open`);
      const submenuOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert(submenuOverflow <= 2, `home @ ${width}px open submenu causes horizontal overflow: ${submenuOverflow}px`);
      await page.keyboard.press("Escape");
      assert(await toggle.getAttribute("aria-expanded") === "false", `home @ ${width}px Escape did not close menu`);
    }

    const ctaMetrics = await page.locator("#contact .cta__newsletter-inner").evaluate((node) => {
      const container = node.closest(".container");
      const nodeRect = node.getBoundingClientRect();
      const containerRect = container?.getBoundingClientRect();
      const containerStyle = container ? getComputedStyle(container) : null;
      const heading = node.querySelector("h2");
      const headingStyle = heading ? getComputedStyle(heading) : null;
      const containerContentWidth = containerRect
        ? containerRect.width - Number.parseFloat(containerStyle?.paddingLeft || "0") - Number.parseFloat(containerStyle?.paddingRight || "0")
        : 0;
      return {
        width: nodeRect.width,
        containerWidth: containerContentWidth,
        headingFamily: headingStyle?.fontFamily || "",
        headingWeight: headingStyle?.fontWeight || "",
        headingLineHeight: Number.parseFloat(headingStyle?.lineHeight || "0"),
        headingFontSize: Number.parseFloat(headingStyle?.fontSize || "0"),
        headingLetterSpacing: Number.parseFloat(headingStyle?.letterSpacing || "0")
      };
    });
    assert(ctaMetrics.containerWidth > 0, `home @ ${width}px CTA container not found`);
    assert(Math.abs(ctaMetrics.width - ctaMetrics.containerWidth) <= 2, `home @ ${width}px CTA is not full container width: ${ctaMetrics.width}px vs ${ctaMetrics.containerWidth}px`);
    assert(/^\"?Inter\b/i.test(ctaMetrics.headingFamily), `home @ ${width}px CTA heading is not using reference Inter stack`);
    assert(ctaMetrics.headingWeight === "600", `home @ ${width}px CTA heading weight is ${ctaMetrics.headingWeight}, expected 600`);
    assert(Math.abs(ctaMetrics.headingLineHeight / ctaMetrics.headingFontSize - 1.04) < 0.03, `home @ ${width}px CTA heading line-height ratio differs from 1.04`);
    assert(ctaMetrics.headingLetterSpacing < 0, `home @ ${width}px CTA heading reference tracking missing`);

    const faqButtons = page.locator("#faq .accordion__button");
    assert(await faqButtons.count() === 6, `home @ ${width}px expected six FAQ controls`);
    assert(await faqButtons.nth(0).getAttribute("aria-expanded") === "true", `home @ ${width}px first FAQ ARIA state does not match its open panel`);
    assert(await faqButtons.nth(1).getAttribute("aria-expanded") === "false", `home @ ${width}px second FAQ initial ARIA state should be false`);
    assert(await page.locator("#faq .mgl-faq-topic-icon").count() === 6, `home @ ${width}px FAQ topic icons are missing`);
    await faqButtons.nth(1).scrollIntoViewIfNeeded();
    await faqButtons.nth(1).click();
    await page.locator("#faqBody2").waitFor({ state: "visible" });
    assert(await faqButtons.nth(1).getAttribute("aria-expanded") === "true", `home @ ${width}px FAQ did not expose expanded state after click`);
    assert(await faqButtons.nth(0).getAttribute("aria-expanded") === "false", `home @ ${width}px accordion parent did not close the previous item`);
    const faqOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(faqOverflow <= 2, `home @ ${width}px expanded FAQ causes horizontal overflow: ${faqOverflow}px`);

    if (width === 1440) {
      const settingsToggle = page.locator("#mgl-dev-settings-toggle");
      await settingsToggle.click();
      const settingsPanel = page.locator("#mgl-dev-settings-panel");
      assert(await settingsPanel.getAttribute("aria-hidden") === "false", "home @ 1440px settings panel did not open");
      await page.locator("#mgl-global-font-select").selectOption("Poppins");
      await page.waitForTimeout(50);
      const fontState = await page.evaluate(() => ({
        family: document.documentElement.dataset.mglFontFamily,
        cssVar: document.documentElement.style.getPropertyValue("--mgl-global-font-family"),
        googleHref: document.querySelector("#mgl-google-font-runtime")?.getAttribute("href") || ""
      }));
      assert(fontState.family === "Poppins", "home @ 1440px font preview did not apply selected family");
      assert(fontState.cssVar.includes("Poppins"), "home @ 1440px global font CSS variable was not updated");
      assert(fontState.googleHref.includes("fonts.googleapis.com/css2") && fontState.googleHref.includes("Poppins"),
        "home @ 1440px Google Fonts CSS2 request was not generated");
      await page.locator("[data-mgl-save-device]").click();
      const storedFont = await page.evaluate(() => JSON.parse(localStorage.getItem("mgl-dev-font-preference-v1") || "{}").globalFontFamily);
      assert(storedFont === "Poppins", "home @ 1440px device font preference was not persisted");
      await page.locator("[data-mgl-reset-font]").click();
      const resetState = await page.evaluate(() => ({
        family: document.documentElement.dataset.mglFontFamily,
        stored: localStorage.getItem("mgl-dev-font-preference-v1")
      }));
      assert(resetState.family === "Inter" && resetState.stored === null,
        "home @ 1440px font reset did not restore project setting");
      await page.locator("[data-mgl-settings-close]").click();
      assert(await settingsPanel.getAttribute("aria-hidden") === "true", "home @ 1440px settings panel did not close");

      const darkChrome = await page.evaluate(() => {
        const themeIcon = document.querySelector("#btnSwitch img");
        const whatsapp = document.querySelector(".mgl-header-social");
        const logo = document.querySelector("[data-brand-logo]");
        return {
          theme: document.documentElement.getAttribute("data-bs-theme"),
          themeFilter: themeIcon ? getComputedStyle(themeIcon).filter : "",
          whatsappColor: whatsapp ? getComputedStyle(whatsapp).color : "",
          logoWidth: logo?.getBoundingClientRect().width || 0
        };
      });
      assert(darkChrome.theme === "dark", "home @ 1440px expected dark theme before toggle");
      assert(darkChrome.themeFilter.includes("invert"), "home @ 1440px dark theme icon is not rendered light");
      assert(darkChrome.whatsappColor === "rgb(37, 211, 102)", "home @ 1440px WhatsApp icon is not official #25D366");
      assert(darkChrome.logoWidth >= 196, `home @ 1440px logo is too small for readable branding: ${darkChrome.logoWidth}px`);

      await page.locator("#btnSwitch").click();
      await page.waitForTimeout(80);
      const lightChrome = await page.evaluate(() => {
        const themeIcon = document.querySelector("#btnSwitch img");
        return {
          theme: document.documentElement.getAttribute("data-bs-theme"),
          themeFilter: themeIcon ? getComputedStyle(themeIcon).filter : ""
        };
      });
      assert(lightChrome.theme === "light", "home @ 1440px theme toggle did not switch to light");
      assert(!lightChrome.themeFilter.includes("invert"), "home @ 1440px light theme icon did not switch to a dark treatment");
      await page.locator("#btnSwitch").click();
      await page.waitForTimeout(80);

      const firstService = page.locator("#services .service__item").first();
      await firstService.scrollIntoViewIfNeeded();
      await firstService.hover();
      await page.waitForTimeout(380);
      const serviceInteraction = await firstService.locator(".service__item-inner").evaluate((node) => {
        const box = getComputedStyle(node);
        const arrow = getComputedStyle(node, "::after");
        return { transform: box.transform, arrowOpacity: Number.parseFloat(arrow.opacity || "0") };
      });
      assert(serviceInteraction.transform !== "none", "home @ 1440px service card hover transform missing");
      assert(serviceInteraction.arrowOpacity > 0.8, "home @ 1440px service card action icon did not reveal");
    }

    await page.screenshot({ path: join(shots, `home-${width}.png`), fullPage: true });

    await page.goto(base + "/contact/?theme=dark", { waitUntil: "networkidle" });
    await page.waitForSelector("#mgl-enquiry-form");
    const contact = await inspectLayout(page, width, "contact");
    assert(contact.h1FontWeight === "600", `contact @ ${width}px H1 weight is ${contact.h1FontWeight}, expected 600`);
    assert(Math.abs(contact.h1LineHeight / contact.h1FontSize - 1.04) < 0.03, `contact @ ${width}px H1 line-height ratio differs from 1.04`);
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
