# WordPress migration reference

## Static + WordPress-ready, one GitHub repository

The website's authoritative content is `data/content.json`. Existing
`templates/pages/**` and `templates/shared/**` keep their independent
approved designs. `node scripts/generate.mjs --check` verifies static output.

Native WordPress files added alongside the static site:
- Root `style.css`, `theme.json`, `functions.php`
- `templates/index.html`, `front-page.html`, `page.html`, `404.html`,
  `single.html`, `archive.html`, `search.html`
- `parts/header.html`, `parts/footer.html`
- `styles/light.json` and `styles/dark.json`
- `patterns/*.php` as editable native Gutenberg patterns
- `inc/renderer.php` bridge for existing complex layouts
- `inc/import-pages.php` optional, explicit WP-CLI page importer

WordPress block templates call server-rendered `mgl/page`, `mgl/header`,
and `mgl/footer` blocks. These read the same JSON and HTML templates as
the static renderer. No duplicate copy source needs to be maintained.
The WordPress runtime enqueues existing local CSS/JS and rewrites local
asset and navigation URLs to the active WordPress site.

## Test and package

```sh
node scripts/generate.mjs --check
node scripts/package-wordpress.mjs --check
php -l functions.php
php -l inc/renderer.php
php -l inc/import-pages.php
php tests/wordpress-renderer-smoke.php
node scripts/package-wordpress.mjs --write
cd dist/wordpress && zip -qr meta-grey-label.zip meta-grey-label
```

Upload the generated zip through WordPress Appearance > Themes, or copy
the `meta-grey-label` directory into `wp-content/themes` and activate.

After installation, install hierarchical WP Pages from the existing JSON
using WP-CLI. This command is DRY RUN by default:

```sh
wp mgl import-pages
wp mgl import-pages --apply --set-homepage
```

Existing WordPress pages are never overwritten; the importer adds only
missing pages. With WordPress pretty permalinks, `services.html` becomes
`/services/`. Confirm redirects and SEO/canonical migration when changing
domains or switching production.

## Important technical boundaries

This is a functional **block-theme bridge**, not a pixel-perfect WordPress
approval. The 52 existing bespoke page designs render through server-side
blocks. Complex sections are not yet independently editable with Gutenberg
native blocks; the JSON and HTML templates remain the editing source.
Native patterns are available to author *new* editable content.

The static theme switch and WordPress global style variations are independent
controls; visual parity and asset/JS behavior must be verified in an actual
WordPress installation, especially nested navigation and mobile behavior.

Before distributing a WordPress theme, review licensing of all bundled fonts,
images, template libraries, and source assets. Do not assume third-party
template licenses permit redistribution or WordPress conversion.

No WordPress DB, plugin, DNS, main branch, or hosting changes are triggered
by this repository-only work.
