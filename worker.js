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

function staticOrigin(env, requestOrigin) {
  return String(env.STATIC_ORIGIN || requestOrigin).replace(/\/$/, "");
}

async function staticFetch(env, requestOrigin, path, init = {}) {
  const target = new URL(path, staticOrigin(env, requestOrigin));
  if (env.ASSETS && typeof env.ASSETS.fetch === "function") {
    const local = new URL(path, requestOrigin);
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
  if (!sharedCache) {
    sharedCache = Promise.all([
      assetText(env, origin, "/data/content.json").then(JSON.parse),
      assetText(env, origin, "/header.html"),
      assetText(env, origin, "/footer.html")
    ]).then(([data, header, footer]) => ({ data, header, footer }));
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

    if (isStaticAssetPath(path)) {
      const upstream = await staticFetch(env, url.origin, path, request);
      const headers = new Headers(upstream.headers);
      headers.set("cache-control", "public, max-age=3600, s-maxage=86400");
      return new Response(upstream.body, { status: upstream.status, headers });
    }

    const { data, header, footer } = await sharedData(env, url.origin);
    const base = publicBase(request, env);

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
