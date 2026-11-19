# Meta Grey Label — static website

The deployed website is static HTML/CSS/JavaScript. Edit content in
data/content.json and visual markup in templates/. Do not edit the generated
HTML pages directly: they are build outputs and will be overwritten.

The JSON includes 53 historical structured content documents, the text and
editable links/metadata for 52 HTML pages, and the shared header/footer
fields. Templates preserve original layouts, responsive styles, animations,
inline scripts, and theme behavior. The old data/content.xml remains for
historical reference only and is not used by the generator.

Requirements: Node.js 20+ (no dependencies).

Regenerate after editing content or a template:

    node scripts/generate.mjs --write

Verify output before committing:

    node scripts/generate.mjs --check

The generator updates only changed files, preserving existing static hosting
routes. It also generates sitemap.xml and data/page-map.json from the same JSON.
GitHub Actions checks parity on pull requests but does not deploy or push.

Editing:
- content.documents: human-readable historical structured copy.
- pages["index.html"].fields: homepage visible text, links and metadata.
- pages["header.html"].fields: navbar labels and links.
- pages["footer.html"].fields: footer labels and links.
- Each record references an independent template in templates/pages/ or
  templates/shared/ for page-specific design and shared layout.
- To change a design, edit its HTML template and keep the matching
  __MGL_CONTENT_00001__-style markers.
- Editing content.documents alone does not update already-designed HTML;
  update the relevant pages[*].fields values as well.
