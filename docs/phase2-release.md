# Phase 2: directory composition and release hardening

> **Historical audit (pre-HTML-only refactor).** This document records the earlier dual static/WordPress implementation and its original QA evidence. The WordPress generator, PHP and FSE pipeline have been removed. For the current standalone HTML/JavaScript architecture and commands, see [README](../README.md).

Baseline: PR #36 at `ba882fa14430eaa9cd12665ae012eccd87c326fe`; production main at `7d5568d512e21e09cdd18e57749abe5e1eb7cf49`. Continued on `feat/inner-page-design-system`. Release evidence is pinned to the tested commit and Actions run in the PR description. No production deployment or merge is part of this change.

## Architecture and content

The eight existing inner families remain intact. `src/directories.js` extends their semantic tree and serializer. `data/directories.json` holds service groups and decision pathways. Static build, relative GitHub Pages materialization and native Gutenberg generation use this composition. The 47 structured documents in `data/content.json` are unchanged in Phase 2.

| Route | Composition | Progressive interaction |
| --- | --- | --- |
| `/services.html` | Eight service groups, asymmetric turnkey row, connected launch journey, model-selection help | Category filter with fragment deep links, keyboard activation, pressed state and live status |
| `/solutions/` | Nine business needs under four stages, four operating-model panels, requirements guide | Business-stage filter; individual services remain a separate destination |
| `/insights/` | Featured model guide, editorial topic rows, all 15 source articles | Topic filter; source-derived reading time, no fabricated publication dates |

Without JavaScript every group remains visible and its navigation links work. Native WordPress uses `/services/`; its serialized paragraph links are normalized to that alias. Directory schema is `CollectionPage`; article routes retain `Article`. Production canonicals stay on `mg-label.webflow.io` for both static hosts.

## Visual findings and remedies

- The live Services banner consumed too much vertical space and reused generic product-card styling; it also showed duplicate arrow treatments. The directory now has a compact category hero, concise summaries and one arrow per link.
- Screenshot review found that the mobile stack panel and wrapped category chips delayed service discovery. Mobile directory heroes now prioritize a direct browse action and defer secondary ambient panels; category controls scroll horizontally. The Turnkey card title is explicitly kept in its content column.
- Solutions and Insights previously used clipped opening-paragraph excerpts in repetitive cards. Solutions now presents operating decisions; Insights uses editorial hierarchy and reading metadata.
- The same generic trading/CRM/execution hero diagram appeared on KYC, back-office, liquidity-bridge and admin pages. These now show contextual operational diagrams with package qualifications retained. Upgrade implementation sections use the existing journey pattern rather than another technical panel stack.
- Native chrome previously used a plain site title, a different header flow and a one-column footer. It now uses the approved wordmark, floating header proportions, theme control, quote/WhatsApp actions, navigation icons, three footer columns, disclosure and social links.
- Browser QA found a native mobile specificity conflict: core button display rules kept desktop actions visible and pushed the menu toggle outside the viewport. Scoped mobile selectors now hide these actions. QA explicitly checks visible header controls stay within the viewport.
- Manual native screenshot review found global font controls enlarging footer headings and a 24px post-content/template gap. Chrome now has explicit scoped typography and wrapper spacing, with browser assertions for both.
- Fixed native chrome required extra breathing room above the existing native homepage hero. Only that compatibility spacing changes; the approved static homepage, static header and static footer sources remain byte-identical to main.
- Strict parity caught WordPress smart-quote conversion in an article-list title. The shared directory display now uses the same typographic apostrophe; source data and factual meaning are unchanged.
- Motion remains restrained. Shared anchor scrolling honors reduced motion; directory hover changes only the border. No new preloader or frontend dependency is introduced.

## Native editability and intentional differences

Native header and footer remain core Navigation, Site Logo, Site Title, Group, Buttons, headings and paragraphs. A render filter supplies the approved logo only when no custom Site Logo attachment is selected; a user's selected logo wins. Footer social links remain editable text links with CSS icons. No static header is injected into WordPress.

WordPress retains its native navigation focus management and submenu controls. Its mobile navigation is a bounded modal panel rather than the static JavaScript accordion; native submenu grouping and disclosure behavior therefore remain distinct. Body text and directory composition are shared and receive strict native/static geometry checks. Exact header/dropdown pixel identity is not claimed.

## Conservative asset audit

Run `node scripts/audit-assets.mjs` for the inventory, source references, CSS dependencies and byte counts. It searches tracked source, generated markup, data, runtime loaders and CSS. Ambiguous basename matches deliberately retain assets.

- Removed `assets/css/all.min.css`: 102,033 bytes, no frontend import, generated reference, runtime loader or WordPress package dependency.
- Removed six vendor requests from the 47 redesigned routes and three directories: Font Awesome SVG runtime, Swiper JS/CSS, AOS JS/CSS and PureCounter. These files remain for the approved homepage and retained legacy compositions. The omitted files total 1,678,313 uncompressed bytes per redesigned page; this is not a compressed transfer or Lighthouse measurement.
- Retained numbered banner, feature, team, blog, testimonial and partner images because shared CSS, source data, render fallbacks or homepage references still exist. No image was deleted on a filename heuristic.
- Found eight image dependencies referenced by native home CSS but omitted from the installable theme. They are now packaged, together with existing sun/moon control icons. Package generation rejects unresolved native stylesheet dependencies.

## Repeatable release checks

The PR workflow runs source syntax, SEO/route inventory, dynamic build, root-host Webflow build, mirror/base-path build, relative materialization, internal links, shared native serialization, PHP lint and asset smoke tests, package creation and archive validation. It then starts disposable WordPress/MariaDB and checks import, HTTP routes, browser behavior, Gutenberg pages, both template parts, Site Editor, contact brief preparation and native/static parity.

Browser coverage includes all 50 redesigned routes at 360, 390, 430, 768, 1024, 1180, 1440 and 1920 in both themes, plus a fresh 22-route representative review in both hosts. Representative screenshots cover all eight widths; full-page captures cover 390 and 1440 in both themes. Directory before/after captures use the actual PR baseline HTML in a fresh context. The Actions artifacts contain metrics and screenshots; the final PR description records actual results, including failures corrected during this phase.
