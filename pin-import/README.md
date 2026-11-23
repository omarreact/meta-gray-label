# Import the complete Meta Grey Label website into WordPress

This repository remains the canonical HTML/JavaScript website. `pin-import/`
contains reproducible, **flat HTML snapshots** (`pages/<slug>.html`), not a WordPress theme or a theme generator.
The generator and universal importer belong to
[WpBlockThemeFSE](https://github.com/omarreact/WpBlockThemeFSE).

The manifest includes **53 pages**: Home 01, 51 inner pages and the independently
designed Home 02 (`index-2.html` → `/index-2/` in WordPress). Home 02 preserves its independent layout and bundled media but uses the same
shared Meta Grey Label header as Home 01. Root `header.html` and `footer.html`
provide the canonical import fragments.

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

Home 02's template CSS, JavaScript, images and font files are bundled as `assets/css/home-2.css`, `assets/js/home-2.js`, `assets/fonts/forexy-*` and `assets/media/forexy-*` and copied into the generated theme. Their original
licenses still apply. Optional Google Fonts requests remain online dependencies.

## Runtime GitHub import

Use PIN Universal FSE / PIN Site Importer **0.4.1 or later**. Enter repository
`https://github.com/omarreact/meta-gray-label`, branch `main`, source format Auto.
Leave the build folder empty. Import drafts into staging first. Enable referenced
CSS, JavaScript and static asset mirroring. The complete-site build above is the
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
