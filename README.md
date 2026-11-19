# Meta Grey Label — block-first conversion with safe static fallback

**The current public website stays static.** Its 52 approved HTML layouts
and content are preserved. All authoring content is in **data/content.json**,
and the original 54 template sources are in `templates/pages/**` and
`templates/shared/**`. The existing static output does not require WordPress.

## Static HTML site

    node scripts/generate.mjs --check
    node scripts/generate.mjs --write

## Native Gutenberg content (opt-in)

47 inner pages have structured documents matching current live copy: a deterministic
generator now converts **visible content for the eleven-section homepage and all mapped inner pages** into
serialized native WordPress core/group, core/heading and core/paragraph
blocks. The remaining four directory/404 routes (404, insights index, services, solutions) have
simplified editable Gutenberg directory/404 layouts generated from the
same visible JSON fields and route map. Their original bespoke HTML designs
remain the default until verified.

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

The WordPress package contains 52 generated core-block layout sources under
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


## Technical SEO, CSS safety and performance

The static build keeps server-rendered titles, descriptions, Open Graph tags,
a 51-URL sitemap and exactly one H1 per page. Home and Services canonical URLs
are now derived from their existing JSON `og:url` value; 404 stays noindex.
`node scripts/audit-seo.mjs --check` validates all 52 routes. The optional
`--report` prints non-blocking accessibility/image warnings.

WordPress native pages only load `assets/css/fse.css` and WordPress core
blocks (no copied Bootstrap, AOS, Swiper, Font Awesome or legacy custom.js).
Every new native CSS class is `mgl-native-*`, with selectors scoped to these
components. The original static site and legacy WordPress fallback continue
using existing assets until visual parity is confirmed.

Custom fallback blocks use `blocks/*/block.json` metadata as recommended
by the WordPress Block API. WordPress core owns canonical URL and page title;
SEO plugins may supply additional metadata without hard-coded duplicates.


## Verification before releasing the WordPress theme

GitHub Actions runs two independent checks: exact static HTML parity/SEO checks
and an **isolated real WordPress staging installation** using official
`@wordpress/env`, Docker and MariaDB. The staging job activates the built
theme, dry-runs and then imports 51 new Pages, verifies all 51 HTTP routes
and 404 status, runs desktop/mobile Playwright checks, and opens the actual
Gutenberg Post Editor and Full Site Editor.

The editor check asserts that the imported home, about and grey-label pages
contain **zero invalid Gutenberg blocks**. Representative staging screenshots
are attached to the Actions run, not committed to this repository.

The native home now has distinct, editable sections for its 11 source
sections, including six linked service cards, three pricing columns and
six native HTML Details / Gutenberg FAQ blocks. WordPress's core details
interaction needs no Bootstrap or extra theme JavaScript.

**Important release boundary:** the native page designs use the existing
approved content, but they are not yet guaranteed pixel-identical to the
original vendor-based static HTML. The original static templates and assets
remain untouched. A real production WordPress migration still requires
reviewing real images, media, third-party licensing, domain/canonical
redirection and a rollback plan. Do not import native layouts into an
existing production WordPress database without a backup and approval.

## Code/asset budget notes

The native Gutenberg frontend loads approximately 8 KB of scoped MGL
theme CSS (uncompressed source) and no custom theme JavaScript, in addition
to whatever WordPress core requires. Legacy HTML intentionally keeps its
original CSS/JS because ripping out interdependent icon, slider and theme
libraries before full browser QA would compromise the approved design.
These two render targets are deliberately independent.
