# Meta Grey Label

The repository now keeps **one approved static HTML copy per public route**.
Those files are the visual source of truth for GitHub Pages and the legacy
WordPress fallback. The former duplicate `templates/pages/**` and
`templates/shared/**` trees are removed.

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
