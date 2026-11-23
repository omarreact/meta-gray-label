import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRouteIndex, renderStructuredPage } from '../src/renderer.js';
import { INNER_ROLLOUT, REFERENCE_ROUTE, buildInnerPage, renderInnerTree, esc, pageFamily } from '../src/inner-system.js';
const data = JSON.parse(readFileSync('data/content.json', 'utf8'));
const routes = buildRouteIndex(data);
for (const route of INNER_ROLLOUT) {
  const entry = routes.get(route);
  assert.ok(entry, 'unknown rollout route ' + route);
  for (const block of entry.document.blocks)
    assert.doesNotMatch(block.text, /FAQs?:H[1-6]:/, 'draft heading marker in public copy');
  const html = renderStructuredPage({ route, entry, routeIndex: routes, canonicalBase: 'https://mg-label.webflow.io' });
  const body = renderInnerTree(buildInnerPage(entry, [...routes.values()]));
  assert.match(html, /assets\/css\/inner-pages\.css/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((body.match(/<h1\b/g) || []).length, 1);
  assert.doesNotMatch(body, /<!--\s*wp:|\bwp-block-/);
  const ids = [...html.matchAll(/\bid="(inner-section-\d+)"/g)].map(x => x[1]);
  assert.equal(new Set(ids).size, ids.length);
  for (const block of entry.document.blocks.filter(x => x.type === 'paragraph'))
    assert.ok(html.includes(esc(block.text)), 'static copy lost on ' + route);
}
assert.equal(pageFamily(REFERENCE_ROUTE), 'service');
assert.equal(pageFamily('/forex-white-label/pricing/'), 'pricing');
assert.equal(pageFamily('/forex-white-label/vs-grey-label/'), 'comparison');
assert.equal(pageFamily('/forex-broker-turnkey/how-it-works/'), 'process');
assert.equal(pageFamily('/mt-admin-license/mt5-admin/'), 'technical');
assert.equal(pageFamily('/forex-crm/'), 'hub');
assert.equal(pageFamily('/about-us/'), 'company');
assert.equal(pageFamily('/insights/example/'), 'article');
console.log('INNER SYSTEM PASS: ' + INNER_ROLLOUT.size + ' HTML routes with shared semantic tree, source copy and headings.');
