# Meta Grey Label

GitHub main is the source of truth. Review production at https://mg-label.webflow.io/ and its mirror at https://omarreact.github.io/meta-gray-label/. Do not deploy to Vercel or change DNS as part of the inner-page redesign.

## Content and build flow

- `data/content.json`: canonical structured documents and route map.
- `data/inner-pages.json`: inner-page rollout, family summaries and product hero copy.
- `src/inner-system.js`: one semantic composition serialized as static HTML or native Gutenberg blocks. Eight page families: service, hub, pricing, comparison, process, technical, article and company.
- `src/renderer.js`: metadata, shared chrome and structured page rendering.
- `scripts/static-site-lib.mjs`: root-host Webflow output, GitHub Pages base paths, host-neutral materialized routes and production canonical identity.
- `scripts/fse-pages.mjs`: native Gutenberg/FSE projection; independent approved homepage and directory compositions are retained.
- `assets/css/inner-pages.css`: the shared static/native inner-page stylesheet. It is scoped and does not restyle the homepage.

The bespoke sources are `index.html`, `services.html`, `solutions/index.html`, `insights/index.html` and `contact/index.html`. Header/footer sources remain shared. Structured per-route `index.html` files are generated build products committed for GitHub Pages compatibility. Do not hand-edit those files.

Main-only Actions materialize the Pages files and generate the `webflow` deployment branch. The legacy Worker remains a fallback renderer. Branch/PR QA does not deploy to the production hosts.

## Build and check

```bash
node scripts/audit-seo.mjs --check
node tests/dynamic-renderer.mjs
node tests/architecture.mjs
node tests/fse-pages.mjs
node tests/inner-system.mjs
node scripts/generate-fse.mjs --check
node scripts/package-wordpress.mjs --check
PUBLIC_BASE_URL=https://mg-label.webflow.io node scripts/build-static.mjs
PUBLIC_BASE_URL=https://omarreact.github.io/meta-gray-label BASE_PATH=/meta-gray-label node scripts/build-static.mjs
PUBLIC_BASE_URL=https://mg-label.webflow.io node scripts/materialize-pages.mjs
node scripts/inventory-pages.mjs
```

After updating composition, regenerate native patterns with `node scripts/generate-fse.mjs --write`. Package the installable native block theme with `node scripts/package-wordpress.mjs --write`.

## Real WordPress staging and browser QA

GitHub Actions starts disposable wp-env Docker staging, activates the packaged theme, imports native pages, checks all native frontend routes, opens Gutenberg and Site Editor, and captures static/native evidence. The inner reference and route-family checks cover 360, 390, 430, 768, 1024, 1180, 1440 and 1920px in both themes. No test publishes to a production WordPress server.

For Codespaces, `.devcontainer/setup-wordpress.sh` provisions local WordPress on port 8888 with wp-env development credentials. Keep that forwarded port private.

## Audit and release scope

See [route inventory](docs/route-inventory.md) and [architecture/design audit](docs/inner-page-audit.md). The static contact page predates the new system and is outside the JSON/FSE inventory. Article publication dates are absent from the source and are not fabricated.
