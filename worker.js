import {
  buildRouteIndex,
  injectSharedParts,
  isStaticAssetPath,
  normalizePath,
  renderDynamicSitemap,
  renderSimple404,
  renderStructuredPage,
  rewriteRuntimeSeo,
  specialAssetPath
} from "./src/renderer.js";

let sharedCache;
let sharedCacheAt = 0;
const SHARED_CACHE_TTL_MS = 300000;

function staticOrigin(env, requestOrigin) {
  return String(env.STATIC_ORIGIN || requestOrigin).replace(/\/$/, "");
}

function contentTypeForPath(pathname = "") {
  const path = String(pathname).toLowerCase();
  if (path.endsWith(".css")) return "text/css; charset=UTF-8";
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "application/javascript; charset=UTF-8";
  if (path.endsWith(".json") || path.endsWith(".map")) return "application/json; charset=UTF-8";
  if (path.endsWith(".html")) return "text/html; charset=UTF-8";
  if (path.endsWith(".xml")) return "application/xml; charset=UTF-8";
  if (path.endsWith(".txt")) return "text/plain; charset=UTF-8";
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".gif")) return "image/gif";
  if (path.endsWith(".ico")) return "image/x-icon";
  if (path.endsWith(".woff2")) return "font/woff2";
  if (path.endsWith(".woff")) return "font/woff";
  if (path.endsWith(".ttf")) return "font/ttf";
  if (path.endsWith(".otf")) return "font/otf";
  return "";
}

async function staticFetch(env, requestOrigin, path, init = {}) {
  const origin = staticOrigin(env, requestOrigin) + "/";
  const relativePath = String(path || "").replace(/^\/+/, "");
  const target = new URL(relativePath, origin);
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    const local = new URL("/" + relativePath, requestOrigin);
    return env.ASSETS.fetch(new Request(local.toString(), init));
  }
  return fetch(new Request(target.toString(), init));
}

async function assetText(env, origin, path) {
  const response = await staticFetch(env, origin, path, { method: "GET" });
  if (!response.ok) throw new Error(`Asset ${path} returned ${response.status}`);
  return response.text();
}

async function sharedData(env, origin) {
  const now = Date.now();
  if (!sharedCache || now - sharedCacheAt >= SHARED_CACHE_TTL_MS) {
    sharedCacheAt = now;
    sharedCache = Promise.all([
      assetText(env, origin, "/data/content.json").then(JSON.parse),
      assetText(env, origin, "/header.html"),
      assetText(env, origin, "/footer.html")
    ])
      .then(([data, header, footer]) => ({ data, header, footer }))
      .catch((error) => {
        sharedCache = undefined;
        sharedCacheAt = 0;
        throw error;
      });
  }
  return sharedCache;
}

function htmlResponse(html, status = 200) {
  return new Response(html, {
    status,
    headers: {
      "content-type": "text/html; charset=UTF-8",
      "cache-control": status === 200 ? "public, max-age=0, s-maxage=300, stale-while-revalidate=86400" : "no-store",
      "x-content-type-options": "nosniff",
      "referrer-policy": "strict-origin-when-cross-origin"
    }
  });
}

function publicBase(request, env) {
  return String(env.PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
}

export default {
  async fetch(request, env) {
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405, headers: { allow: "GET, HEAD" } });
    }

    const url = new URL(request.url);
    const path = normalizePath(url.pathname);
    const base = publicBase(request, env);

    if (path === "/robots.txt") {
      return new Response(`User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`, {
        headers: { "content-type": "text/plain; charset=UTF-8", "cache-control": "public, max-age=300" }
      });
    }

    if (isStaticAssetPath(path)) {
      const upstream = await staticFetch(env, url.origin, path, request);
      const headers = new Headers(upstream.headers);
      const contentType = contentTypeForPath(path);
      if (contentType) headers.set("content-type", contentType);
      headers.set("cache-control", "public, max-age=3600, s-maxage=86400");
      headers.set("x-content-type-options", "nosniff");
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    const { data, header, footer } = await sharedData(env, url.origin);

    if (path === "/sitemap.xml") {
      return new Response(renderDynamicSitemap(data, base), {
        headers: { "content-type": "application/xml; charset=UTF-8", "cache-control": "public, max-age=300" }
      });
    }

    const special = specialAssetPath(path);
    if (special) {
      const response = await staticFetch(env, url.origin, special, { method: "GET" });
      if (response.ok) {
        let html = await response.text();
        html = injectSharedParts(html, header, footer);
        const canonicalPath = path === "/services/" ? "/services.html" : path === "/404.html" ? "" : path;
        html = rewriteRuntimeSeo(html, canonicalPath ? base + canonicalPath : base + path, { noindex: path === "/404.html" });
        return htmlResponse(html, path === "/404.html" ? 404 : 200);
      }
    }

    const routes = buildRouteIndex(data);
    const entry = routes.get(path);
    if (entry && path !== "/") {
      return htmlResponse(renderStructuredPage({
        route: path,
        entry,
        routeIndex: routes,
        header,
        footer,
        canonicalBase: base
      }));
    }

    return htmlResponse(renderSimple404({ header, footer, canonicalBase: base }), 404);
  }
};
