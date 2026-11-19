# Meta Grey Label — block-first conversion with safe static fallback

**The current public website stays static.** Its 52 approved HTML layouts
and content are preserved. All authoring content is in **data/content.json**,
and the original 54 template sources are in `templates/pages/**` and
`templates/shared/**`. The existing static output does not require WordPress.

## Static HTML site

    node scripts/generate.mjs --check
    node scripts/generate.mjs --write

## Native Gutenberg content (opt-in)

48 of 52 routes have complete, structured source documents: a deterministic
generator now converts **2,735 actual headings and paragraphs** into
serialized native WordPress core/group, core/heading and core/paragraph
blocks. The other four routes (404, insights index, services, solutions) keep
their approved static/legacy implementations until suitable bespoke native
templates are ready.

    node tests/fse-pages.mjs
    node scripts/generate-fse.mjs --check
    node scripts/generate-fse.mjs --write

`--write` creates local preview HTML and native block files in
`dist/fse/`. This **does not replace live HTML**. The native
header/footer block parts are generated from the *same* content.json nav
labels/URLs, and may be edited in the WordPress Site Editor.

## WordPress theme (tested PHP bridge + native blocks)

    node scripts/package-wordpress.mjs --check
    php tests/wordpress-renderer-smoke.php
    node scripts/package-wordpress.mjs --write

The WordPress package contains the generated core-block post content under
`data/fse-pages/`, a native page template in `templates/page-native.html`,
and native FSE template parts `parts/header-native.html` /
`parts/footer-native.html`.

Once installed in a **test WordPress instance**, import routes with WP-CLI:

    wp mgl import-pages
    wp mgl import-pages --apply --set-homepage

To opt into the editable Gutenberg layout for newly created pages only:

    wp mgl import-pages --native
    wp mgl import-pages --apply --native --set-homepage

The importer does not modify existing pages. Native mode intentionally
changes their visual presentation: do **not** use it in production without
checking full desktop/mobile parity. Native page layout previews are a
starting point, not yet a pixel-for-pixel copy of complex original designs.

WordPress Site Editor edits are stored in the WordPress database and are
**not automatically synchronized back to GitHub**.

Read `docs/wordpress-transition.md` for the feature matrix, precautions
and deployment boundaries. No hosting, DNS, production merge, or CMS
database modification occurs through this branch.
