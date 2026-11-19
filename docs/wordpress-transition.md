# Meta Grey Label — incremental Full Site Editing implementation

## Canonical architecture and current boundaries

- **Source of authoring truth:** `data/content.json`, including 53 historical
  documents, 52 page records, current visible labels and navigation.
- **Production static output:** existing HTML pages, unchanged; regeneration
  via `scripts/generate.mjs`.
- **Native content:** `scripts/fse-pages.mjs` projects the 47 mapped inner pages from structured documents and the current 11-section
  homepage from its actual rendered JSON fields into Gutenberg core/group, core/heading,
  and core/paragraph markup. No content strings are duplicated into the
  FSE generator.
- **Four bespoke routes:** `404.html`, `insights/index.html`,
  `services.html`, `solutions/index.html` also receive simplified native
  directory/404 layouts from the current JSON fields and page map. Their
  approved HTML designs remain the default; visual parity is still needed.
- **Native site structure:** generated `parts/header-native.html` uses
  core/site-logo, core/site-title and core/navigation; footer uses
  core/site-title, core/columns and core/paragraph.
- **Opt-in WordPress template:** `templates/page-native.html` uses native
  editable parts + core/post-content. Default templates retain original
  HTML rendering for backward compatibility.
- **Design system:** `theme.json`, `styles/light.json`,
  `styles/dark.json`, and scoped `assets/css/fse.css`.
- **Actual interactive sections:** these remain HTML+JS, not yet complete
  custom Gutenberg blocks. To achieve full section-by-section design parity,
  each interactive section needs block registration, editor UI, and
  WordPress browser QA.

## Commands (safe locally; no deployment)

    node scripts/generate.mjs --check
    node tests/fse-pages.mjs
    node scripts/generate-fse.mjs --check
    node scripts/generate-fse.mjs --write
    php tests/wordpress-renderer-smoke.php
    node scripts/package-wordpress.mjs --check
    node scripts/package-wordpress.mjs --write

After theme package creation, zip the directory in
`dist/wordpress/meta-grey-label/` and install the archive in a fresh
WordPress staging instance.

Dry-run WordPress page import (no database writes):

    wp mgl import-pages --native

Create **only missing pages** using native core blocks, only after
reviewing the preview and approving the WordPress rendering:

    wp mgl import-pages --apply --native --set-homepage

Without `--native`, the importer creates empty WordPress page records and
uses the existing HTML renderer. With `--native`, up to 51 newly created pages receive
Gutenberg page content and a native template (home uses the WordPress
front-page fallback with an opt-in rendering guard); the 404 page has a
native source preview but is not imported as a normal WordPress Page. Existing pages are never overwritten.

## Production migration is not finished

A successful PHP smoke test or package creation does not prove visual
equivalence. Before switching production to WordPress, complete:
1. WordPress staging install with actual Gutenberg block parsing and editor
   validation, including native header navigation, nested menus and theme
   styles.
2. Per-page visual comparison of 52 desktop/mobile layouts, CTA actions,
   dark/light switch, image URLs, responsive navigation and animations.
3. Convert complex custom Hero, comparison, pricing, FAQ and card designs
   into editable native patterns or registered custom blocks.
4. Migrate all navigation/submenu structure, directory pages and media.
5. Verify canonical/redirect mapping, assets, WP database state,
   security/capabilities and rollback.
6. Decide whether GitHub JSON or WordPress database wins for editor-written
   content; two-way sync does not yet exist.

No site has been deployed or switched by the repository changes.
