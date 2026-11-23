# Meta Grey Label — HTML, CSS and JavaScript

This repository is the **standalone HTML website** for Meta Grey Label. It does not contain or generate a WordPress theme, PHP application, Gutenberg/FSE template, or installable theme ZIP.

Source of truth: the `main` branch.
Public reference: https://mg-label.webflow.io/
GitHub Pages mirror: https://omarreact.github.io/meta-gray-label/

## Architecture

- **HTML:** `index.html`, `services.html`, `solutions/index.html`, `insights/index.html`, `contact/index.html`, and generated inner-page `index.html` routes.
- **CSS:** `assets/css/style.css` is the existing main design; `assets/css/inner-pages.css`, `directories.css`, and `site-settings.css` extend the approved layouts.
- **Browser JavaScript:** `assets/js/custom.js`, `site-settings.js`, `directories.js`, `contact-brief.js`, and other existing page assets manage menus, theme switching, filters, forms, and typography.
- **Structured content:** `data/content.json`, `data/inner-pages.json`, and `data/directories.json` provide source content and route configuration.
- **Build-time JavaScript:** `src/renderer.js`, `src/inner-system.js`, `src/directories.js`, and `scripts/static-site-lib.mjs` render structured pages into standalone HTML files.
- **Optional edge JavaScript:** `worker.js` can render the same content for a Cloudflare Worker deployment; it is not required by the static HTML build.

The custom homepage, header, footer, and independent directory/contact layouts are preserved. The existing responsive styling and interactions remain in their JavaScript and CSS files.

## Build and preview

Node.js 24 or newer:

```bash
npm run build
# Output: dist/public/
cd dist/public && python3 -m http.server 4173
```

Open http://localhost:4173/. The finished `dist/public/` directory is a static site; no Node.js, PHP, database, or CMS is required on the hosting server.

To build with a canonical production origin:

```bash
PUBLIC_BASE_URL=https://mg-label.webflow.io BASE_PATH="" npm run build
```

To build for the GitHub Pages project path:

```bash
PUBLIC_BASE_URL=https://omarreact.github.io/meta-gray-label BASE_PATH=/meta-gray-label npm run build
```

The committed route files are generated for GitHub Pages compatibility. **Edit structured content and JavaScript renderer sources, not generated route HTML**. `npm run materialize:pages` regenerates the tracked routes and SEO files.

## JavaScript site controls

The floating settings panel in `assets/js/site-settings.js` manages typography, including font family, sizes, weights and spacing. Preview changes apply immediately in the browser. The saved local preview uses browser storage; resetting restores `assets/site-settings.json` defaults.

The panel's **Save to website** action creates a GitHub issue with a validated settings payload. The repository-owner-only workflow in `.github/workflows/apply-site-settings.yml` then updates **only** `assets/site-settings.json` on `main`, triggering standard static validation and publishing workflows. Site visitors do not receive repository write permissions, and a browser alone cannot commit code changes.

Dark/light theme switching, mobile navigation, service filters, internal navigation, and the contact-brief interface remain browser JavaScript features. A static site has no built-in authentication, database or server-side form processing; those require an independently configured API/service.

## Quality checks

```bash
node scripts/audit-seo.mjs --check
node tests/architecture.mjs
node tests/dynamic-renderer.mjs
node tests/directories.mjs
node tests/inner-system.mjs
node tests/inner-links.mjs
node scripts/audit-assets.mjs
npm run build
```

GitHub Actions also runs Playwright responsive UI and interaction tests at desktop and mobile widths. The **Materialize GitHub Pages routes** and **Build Webflow deployment branch** workflows continue to publish static output after authorized merges to `main`.

Do not deploy to Vercel or modify DNS as part of routine site maintenance.
