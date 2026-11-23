# Import the complete Meta Grey Label website into WordPress

This repository remains the canonical HTML/JavaScript website. `pin-import/`
contains reproducible import sources, not a WordPress theme or a theme generator.
The generator and universal importer belong to
[WpBlockThemeFSE](https://github.com/omarreact/WpBlockThemeFSE).

The manifest includes **53 pages**: Home 01, 51 inner pages and the independently
designed Home 02 (`index-2.html` → `/index-2/` in WordPress). Home 02 uses its own
header, footer, CSS and scripts. The primary header/footer are complete FSE
fragments, including the source wrappers needed by menus and styling.

## Recommended complete-site installation

1. Download the `meta-grey-label-wordpress-complete` artifact from the successful
   **Build and validate complete WordPress import** GitHub Actions run.
2. On a fresh staging WordPress, install and activate `pin-site-meta-grey-label.zip`.
3. Tools → Import → WordPress: import `website.xml` as an administrator.
4. Settings → Reading: choose the imported Home page as the static homepage.
5. Settings → Permalinks: choose Post name.
6. Review Home 01, Home 02, menus, mobile layouts, forms, theme switching and the
   Site Editor before switching an existing production site.

The artifact also contains the build warnings and desktop/mobile QA screenshots.
Core blocks expose native editing controls where conversion preserves the source
markup. Complex source widgets remain Custom HTML, editable as markup. Backend
forms, accounts, payment processing and other server integrations are not
created by static website conversion.

Home 02 retains the external Kodesolution CSS, JavaScript, images and fonts used
by the canonical source. Their availability and usage rights remain requirements;
this is not an offline redistribution of that vendor's template package.

## Runtime GitHub import

Use PIN Universal FSE / PIN Site Importer **0.4.1 or later**. Enter repository
`https://github.com/omarreact/meta-gray-label`, branch `main`, source format Auto.
Leave the build folder empty. Import drafts into staging first. Enable referenced
CSS, JavaScript and static asset mirroring. Home 02 also requires the explicit
**trusted external/CDN JavaScript** option. The complete-site build above is the
recommended path for repeatable fidelity and per-page assets.

Re-importing changes page content; use a fresh staging site or back up edited
pages. No workflow in this repository installs or activates a production theme.

## Maintain the source

After changing canonical HTML or `assets/js/includes.js`, run:

```sh
node scripts/prepare-wordpress-import.mjs
node tests/wordpress-source.mjs
```

The prep step regenerates the manifest, full shared fragments, import snapshots
and inventory. It keeps the canonical pages intact, resolves snapshot URLs from
their original locations, adds WordPress-only layout adapters and prevents the
static include loader from replacing editor-managed template parts.

CI rejects stale snapshots, missing local files and omitted page records. The
WordPress workflow additionally imports the generated theme/WXR, validates core
block save compatibility, and compares static/WordPress desktop/mobile headers,
images, headings, typography and menu/theme interactions.
