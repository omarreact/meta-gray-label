# Meta Grey Label

The repository now keeps **one approved static HTML copy per public route**.
Those files are the visual source of truth for GitHub Pages and the legacy
WordPress fallback. The former duplicate `templates/pages/**` and
`templates/shared/**` trees are removed.

## Dynamic HTML runtime

The canonical runtime is now data-driven. `worker.js` + `src/renderer.js`
render structured inner routes from the single `data/content.json` source at
the edge. Header and footer are injected server-side, so dynamic pages do not
need the old client-side include round trip.

`scripts/build-dynamic.mjs` builds `dist/public/` with only shared assets,
branding, the content source and five special complex templates (home,
services, solutions, insights index and 404). The dozens of nested static
article/service HTML copies are deliberately **not** copied into the dynamic
deployment artifact.

```bash
node tests/dynamic-renderer.mjs
node scripts/build-dynamic.mjs
npx wrangler dev
```

The checked-in nested HTML files remain temporarily because the existing public
GitHub Pages site still publishes directly from `main`. They are compatibility
copies, not the new application architecture. Once the production host is
switched to the dynamic Worker, those compatibility files can be removed
without changing the renderer, content model, URLs or WordPress conversion path.

## Minimal source model

- Public site: root HTML plus route folders required by the current GitHub
  Pages branch publisher and existing pretty URLs.
- Shared site chrome: `header.html` and `footer.html`.
- Frontend assets: `assets/` and `media/`.
- Structured WordPress/native content: `data/content.json`.
- WordPress/FSE source only: `templates/`, `parts/`, `patterns/`,
  `styles/`, `blocks/`, `inc/`, `style.css`, `theme.json`,
  `functions.php`.
- QA/build tooling: `scripts/` and `tests/`.
- Generated packages/previews: `dist/` (ignored).

The unused XML export, generated page-map file, duplicate static templates and
separate transition-document folder were removed. No approved page markup,
CSS, JavaScript, media, route or visual design is changed by this cleanup.

## QA

```bash
node --check scripts/audit-seo.mjs
node --check scripts/fse-pages.mjs
node --check scripts/generate-fse.mjs
node --check scripts/package-wordpress.mjs
node scripts/audit-seo.mjs --check
node tests/architecture.mjs
node tests/fse-pages.mjs
node scripts/generate-fse.mjs --check
node scripts/package-wordpress.mjs --check
php tests/wordpress-renderer-smoke.php
php tests/wordpress-assets-smoke.php
```

## WordPress package

```bash
node scripts/package-wordpress.mjs --write
```

This creates `dist/wordpress/meta-grey-label/` with the exact static fallback
plus the existing opt-in Gutenberg/FSE implementation.
