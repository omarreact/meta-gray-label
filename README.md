# Meta Grey Label — static HTML + WordPress-ready architecture

The source of website content is **data/content.json**. Existing independently
designed pages live in **templates/pages/** and shared layout components
in **templates/shared/**. Never edit generated page HTML directly.

Generate or verify 52 static HTML pages:

    node scripts/generate.mjs --write
    node scripts/generate.mjs --check

WordPress block theme compatibility files now live alongside the static site:
root **style.css**, **theme.json**, **functions.php**; **parts/**,
**styles/**, **patterns/** and native WordPress **templates/**; PHP adapters
in **inc/**. The WordPress server-side render blocks reuse the exact
data/content.json values and original page layouts, not a second content
source. Native Gutenberg patterns support new editable sections.

Check or export a WordPress-installable theme:

    node scripts/package-wordpress.mjs --check
    php tests/wordpress-renderer-smoke.php
    node scripts/package-wordpress.mjs --write
    cd dist/wordpress && zip -qr meta-grey-label.zip meta-grey-label

With WP-CLI installed, create hierarchical WP Pages from JSON:

    wp mgl import-pages
    wp mgl import-pages --apply --set-homepage

First command is dry-run; the second creates only missing pages. Native
WordPress Site Editor editing of *all* existing complex sections and
full visual behavior require later Gutenberg/browser parity work.

Read **docs/wordpress-transition.md** for technical limitations.
The original data/content.xml remains as legacy backup only.
No live WordPress database, DNS, deployment or hosting is changed here.
