import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DIRECTORY_ROUTES, directoryEntry, buildDirectoryPage, directoryEntries } from '../src/directories.js';
import { renderInnerTree } from '../src/inner-system.js';
import { renderStructuredPage, buildRouteIndex } from '../src/renderer.js';
const data = JSON.parse(readFileSync('data/content.json', 'utf8'));
const entries = directoryEntries(data), routes = buildRouteIndex(data);
let links = 0;
for (const route of DIRECTORY_ROUTES) {
  const body = renderInnerTree(buildDirectoryPage(route, entries));
  const html = renderStructuredPage({
    route, entry: directoryEntry(route), routeIndex: routes,
    canonicalBase: 'https://mg-label.webflow.io'
  });
  assert.ok(html.includes('CollectionPage'));
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes('https://mg-label.webflow.io' + route));
  assert.ok(html.includes(body));
  assert.doesNotMatch(body, /<!--\s*wp:|\bwp-block-/);
  assert.doesNotMatch(html, /preloader|aos\.css|swiper-bundle|all\.min\.js/);
  const ids = new Set([...html.matchAll(/id="([^"]+)"/g)].map(x => x[1]));
  for (const [, href] of body.matchAll(/href="([^"]+)"/g)) {
    if (href.startsWith('#')) assert.ok(ids.has(href.slice(1)), href);
    else assert.ok(routes.has(href) || DIRECTORY_ROUTES.has(href) || href === '/contact/', href);
    links++;
  }
  if (route === '/insights/') {
    assert.doesNotMatch(body, /<time|datetime=|datePublished/);
    for (const entry of entries.filter(x => x.route.startsWith('/insights/')))
      assert.ok(body.includes(entry.route));
  }
}
console.log('DIRECTORY SYSTEM PASS: 3 HTML directory trees, source-based articles, ' + links + ' valid links/anchors.');
