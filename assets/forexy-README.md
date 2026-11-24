# Home 02 source assets

These assets support the independently designed `home-2/index.html` page. They were
copied from that page's original Kodesolution URLs so the static website and
its secondary homepage use the same local images, scripts, styles and font files.
Original copyright and license notices in the source files are retained.

`inventory.json` records original URLs, original SHA-256 hashes and the hashes of
the bundled files. CSS uses the first available modern font format for each face;
redundant legacy fallback formats are omitted. Eight unused background URLs that
already returned HTTP 404 upstream are set to `none`. The stylesheet's optional
Plus Jakarta Sans Google Fonts import remains an online font dependency.

This directory contains third-party template assets, not a new license grant.
Use it under the applicable original template and font licenses.

For Home 02, `home-2/style.css` combines the original Bootstrap stylesheet and all local `@import` CSS dependencies, in their original cascade order. Local icon fonts and visual assets remain intact.

`home-2/script.js` combines the existing 14 Forexy scripts without changing their load order. Embedded original library attribution remains in the bundle. The independent Home 02 layout still uses the shared Meta Grey Label header.

Bundled Forexy graphics and font assets now live under `assets/media/forexy-*` and `assets/fonts/forexy-*`. Original upstream filenames and hashes remain recorded in the historical `assets/forexy-inventory.json`.
