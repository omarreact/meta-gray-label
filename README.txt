Meta Grey Label — Standalone WordPress Block Theme
Version: 1.0.0-strict
Source: https://github.com/omarreact/meta-gray-label
Based on PR #36 HEAD 6a8922534b6a9f4b041fae9c5b700c023acf633a

STRUCTURE
Only parts/, patterns/, styles/, templates/, README.txt, functions.php,
screenshot.png, style.css and theme.json are included. No extra files/folders.

CONTENT
53 Gutenberg page compositions were generated from the approved PR #36
content source. 52 WordPress pages are importable; the 404 screen is handled
by templates/404.html. Stylesheets, runtime JS, logos and referenced CSS
media are embedded into style.css and functions.php.

INSTALL / STAGING
1. Download this branch as ZIP (GitHub: Code > Download ZIP).
2. In WordPress 6.6+ / PHP 8.1+, install it under Appearance > Themes.
3. Activate on STAGING first. Back up any established WordPress database.
4. Open Appearance > Meta Grey Label Setup and import missing native pages.
5. Set/check homepage and permalinks. Review all 52 pages and editor blocks.
6. Validate mobile/desktop breakpoints, nav, theme toggle, search, forms and
   the floating typography settings before any production installation.

SAFETY
The approved static site and its build source remain untouched on main and
on PR #36. This branch is a standalone export, NOT a branch to merge into
the static-site repo main. No static pages, DNS, WordPress production, or
deployment are changed by this export.

LIMITATIONS
The strict single CSS/PHP constraint embeds images and content, increasing
single-file size and reducing cache granularity. Codebase typography defaults
are embedded in functions.php; local user settings still use browser storage
and codebase-save proposals still use GitHub issues. External font catalog
and other optional third-party resources depend on network availability.
screenshot.png currently uses the existing site icon as a placeholder, NOT a
verified site screenshot. Full WordPress staging QA remains REQUIRED.
