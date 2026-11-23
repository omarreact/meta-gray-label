import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { buildRouteIndex, renderStructuredPage } from '../src/renderer.js';
const at = (path) => new URL('../' + path, import.meta.url);
const read = (path) => readFileSync(at(path), 'utf8');
for (const path of [
  'index.html', 'header.html', 'footer.html', 'services.html',
  'assets/css/style.css', 'assets/css/inner-pages.css',
  'assets/css/site-settings.css', 'assets/js/site-settings.js',
  'assets/js/custom.js', 'assets/site-settings.json',
  'scripts/build-static.mjs', 'scripts/static-site-lib.mjs',
  'src/renderer.js', 'src/inner-system.js', 'data/content.json'
]) assert.ok(existsSync(at(path)), 'Missing HTML/JavaScript source: ' + path);
for (const path of [
  'theme.json', 'functions.php', 'style.css', '.wp-env.json',
  'scripts/generate-fse.mjs', 'scripts/fse-pages.mjs',
  'scripts/package-wordpress.mjs', 'inc/admin-setup.php',
  'inc/import-pages.php', 'assets/css/fse.css',
  'assets/css/native-chrome.css', 'assets/js/native-chrome.js',
  'templates/front-page.html', 'parts/header.html'
]) assert.equal(existsSync(at(path)), false, 'WordPress dependency remains: ' + path);
const settings = JSON.parse(read('assets/site-settings.json'));
assert.ok(settings.typography?.globalFontFamily, 'JavaScript typography settings missing');
const routes = buildRouteIndex(JSON.parse(read('data/content.json')));
const page = routes.get('/forex-grey-label/mt5-grey-label/');
assert.ok(page, 'Structured HTML route missing');
const html = renderStructuredPage({
  route: page.route, entry: page, routeIndex: routes, canonicalBase: 'https://mg-label.webflow.io'
});
assert.match(html, /<main\b/);
assert.match(html, /assets\/js\/site-settings\.js/);
assert.match(html, /assets\/css\/inner-pages\.css/);
assert.doesNotMatch(html, /<!--\s*wp:|\bwp-block-/);
console.log('ARCHITECTURE PASS: static HTML + JavaScript renderer and settings, no WordPress/theme runtime.');
