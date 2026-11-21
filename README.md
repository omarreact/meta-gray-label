# Meta Grey Label

Meta Grey Label is a **data-driven dynamic HTML application** with a compact
native WordPress block-theme conversion path.

## Runtime architecture

```text
Request URL
   ↓
worker.js
   ↓
src/renderer.js
   ↓
data/content.json
   ↓
shared header/footer + reusable layout sections
   ↓
server-rendered HTML
```

Primary dynamic preview:

`https://meta-gray-label-dynamic.farukkhanone.workers.dev/`

**Production / canonical:** `https://meta-gray-label-dynamic.farukkhanone.workers.dev/`

**Webflow design reference only:** `https://mg-label.webflow.io/`

The Worker is the only public/canonical runtime. GitHub remains the source repository; the Worker can proxy source assets from `main` until the static asset bundle is moved fully into Workers Static Assets.

The dynamic runtime renders 47 structured inner routes from one JSON source.
Only four complex HTML design sources remain for layouts that intentionally
keep their bespoke markup:

- `index.html`
- `services.html`
- `solutions/index.html`
- `insights/index.html`

`header.html` and `footer.html` are shared site chrome. The old nested
per-route `index.html` copies have been removed.

## Compact repository model

```text
assets/                 frontend CSS/JS/images
media/                  branding media
data/content.json       canonical content and route data
src/renderer.js         reusable dynamic HTML renderer
worker.js               Cloudflare edge router
header.html             shared dynamic header
footer.html             shared dynamic footer
index.html              bespoke homepage design source
services.html           bespoke services design source
solutions/index.html    bespoke solutions design source
insights/index.html     bespoke insights index design source
templates/              native WordPress block templates
parts/                  native WordPress header/footer
patterns/               WordPress patterns
styles/                 WordPress style variations
scripts/                build/QA/package tooling
tests/                  automated QA
functions.php           compact WordPress theme bootstrap
theme.json              WordPress design tokens/settings
```

The old legacy WordPress renderer, custom fallback blocks, duplicate native
template parts, and 47 static inner-route HTML files are removed.

## Dynamic QA

```bash
node scripts/audit-seo.mjs --check
node tests/dynamic-renderer.mjs
node scripts/build-dynamic.mjs
```

The compact dynamic build contains shared assets/data plus the four bespoke
templates. Structured inner pages are generated at request time and are not
stored as individual HTML files.

## WordPress conversion

The WordPress target is now native Gutenberg/FSE only:

```bash
node tests/architecture.mjs
node tests/fse-pages.mjs
node scripts/generate-fse.mjs --check
node scripts/package-wordpress.mjs --check
node scripts/package-wordpress.mjs --write
```

The generated theme package is written to
`dist/wordpress/meta-grey-label/`. It contains 52 native block page sources,
one scoped native stylesheet, native header/footer parts and no Bootstrap,
AOS, Swiper or legacy custom JavaScript frontend bundle.

GitHub Actions also validates the theme in an isolated real WordPress
installation using wp-env, WP-CLI, HTTP route checks and Playwright
desktop/mobile browser tests.

## Hosting

Cloudflare Workers is the dynamic runtime. GitHub Pages remains a lightweight
legacy compatibility surface for the few retained static design sources.
No custom-domain DNS is changed by this repository migration.


## GitHub Codespaces WordPress staging

The repository includes a Codespaces development container that starts an
isolated WordPress + database environment and installs the generated native
Meta Grey Label block theme.

Open the repository in Codespaces:

`https://codespaces.new/omarreact/meta-gray-label?quickstart=1`

During first creation, `.devcontainer/setup-wordpress.sh` automatically:

1. waits for Docker,
2. packages `dist/wordpress/meta-grey-label/`,
3. starts WordPress with `@wordpress/env`,
4. activates the `meta-grey-label` theme,
5. enables pretty permalinks,
6. imports the native Gutenberg/FSE pages and sets the homepage, and
7. updates WordPress to the Codespaces forwarded port URL.

Open forwarded port `8888` after setup. The local development credentials
provided by `wp-env` are `admin` / `password`. Keep this port **Private**;
this environment is for development/staging, not production hosting.
