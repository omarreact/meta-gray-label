# Meta Grey Label

Static brokerage website with two independent presentations of the same approved content. Theme 1 is the default at `/theme-1/`; Theme 2 is at `/theme-2/`. The root route redirects to the saved theme preference. The 51 inner pages use `?page=<slug>` and are stored in `site-content.json` and `pages.xml`; neither theme contains separate inner-page HTML files.

## Production source and release

- Source of truth: `main` in `omarreact/meta-gray-label`.
- Public site: `https://omarreact.github.io/meta-gray-label/`. `site-manifest.json` declares the canonical public URL used to generate `robots.txt` and `sitemap.xml`.
- GitHub Pages publishes after a commit reaches `main`. The Webflow branch workflow creates a separate static mirror; it does not replace the GitHub Pages canonical site.
- Review a pull request and its `Validate shared Meta Grey Label website` checks before merging. Confirm that the Pages deployment succeeds, then open the homepage and representative service, process, article, directory and contact pages in both themes.
- Roll back a bad release with a new revert commit on `main`, then verify the Pages deployment and affected public routes. Preserve the shared JSON/XML content and both theme directories during rollback.

## Validation

```sh
node --check theme-1/script.js
node --check theme-2/script.js
node scripts/sync-content.mjs --check
node tests/standalone-source.mjs
```

The CI browser job renders all 52 routes in both themes at 360, 768 and 1440 px in light and dark modes. It checks page errors, overflow, theme switching, mobile navigation and the local contact brief. A second check runs representative WCAG automated rules at mobile and desktop widths. Automated checks do not replace manual visual and assistive-technology reviews.

When approved content changes, update `site-content.json`, then run `node scripts/sync-content.mjs` to refresh its XML mirror and the canonical search index. Keep shared business content in JSON/XML and theme-specific layout in the theme directories.

## Known release boundaries

- The contact form prepares a brief locally and supports copying it. It does **not** transmit a lead. Messaging links remain placeholders until an approved destination or backend is supplied.
- Content is rendered in the browser from JSON. GitHub Pages cannot serve distinct initial HTML metadata for every query-string page. Social previews and crawlers that do not execute JavaScript receive the generic shell. Per-page server-rendered previews require a hosting or architecture change.
- The site has no authentication, payment processing or server-side storage. Do not place credentials or personal data in public assets or repository settings.
