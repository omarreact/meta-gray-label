# Inner-page architecture and design audit

Baseline: `main` at `7d5568d512e21e09cdd18e57749abe5e1eb7cf49`. Review date: 23 November 2026 (Bangladesh time). Production was inspected on Webflow and the GitHub Pages mirror. This report distinguishes source inspection, live observations and automated verification.

## Architecture

- `data/content.json` contains structured heading/paragraph documents and the page map. `src/renderer.js` renders the structured routes. `worker.js` can use that renderer at the edge; it is a legacy fallback, not the requested live review host.
- `index.html`, `services.html`, `solutions/index.html`, `insights/index.html` and `contact/index.html` have bespoke static compositions. Header/footer are shared by injection and by `includes.js` on retained sources.
- `scripts/static-site-lib.mjs` builds root-host Webflow output or GitHub Pages output with a repository base path. Materialization creates relative route HTML in main for Pages. These are build products, not independent source templates.
- A main-only Action creates generated `webflow` branch output; Webflow Cloud consumes static output. No live production change is required to review this PR.
- WordPress is a native block-theme target. `scripts/fse-pages.mjs` projects content separately, `package-wordpress.mjs` packages it, and WP-CLI imports it through `inc/import-pages.php`. Templates use core post-content. Native navigation has its own representation.
- The README predates materialization and incorrectly says per-route HTML is absent. The package script omitted site-settings assets even though functions.php enqueues them. The latter is fixed in this PR.
- Contact is a bespoke static route outside the canonical page map. It is missing from the original 52-route SEO/FSE coverage. It is explicitly included in the new inventory; this discrepancy remains visible rather than silently claiming parity.

## UI findings

| Severity | Finding | Evidence / consequence |
|---|---|---|
| High | All 47 structured inner routes use essentially one article layout | `buildRouteIndex` distinguishes only service/article; every section uses `renderSections` and numbered copy blocks. Pricing, process, company and admin content have the same composition. |
| High | Static/FSE composition drift | Separate renderers and CSS make responsive spacing and section parity difficult. The new reference serializes one shared semantic tree. |
| High | Hero repeats the opening paragraph | The first paragraph is excerpted into the hero and then rendered again in the intro. Some excerpts stop mid-thought with an ellipsis. The reference uses a concise dedicated summary. |
| High | Type overrides accumulate | style.css exceeds 15,000 lines, followed by site-settings.css with broad important rules. Source h1/h2 settings emphasize large display type regardless of content role. The new scope defines restrained inner-page sizes and readable body copy without changing the home scale. |
| Medium | Small-screen TOC displaces primary content | Existing TOC becomes a horizontal strip before the article; long section names require sideways scrolling. Service reference uses a direct content sequence; editorial family supports a reading sidebar. |
| Medium | Weak product expression | MT5 page is mostly text and an unrelated photographic backdrop. The reference adds a labelled conceptual configuration diagram, capability panels and an integration journey. It is not presented as a live dashboard. |
| Medium | Hero lacks an immediate conversion action | Existing reference hero has no primary CTA. New hero includes setup and model-comparison links, with a short device support line. |
| Medium | Noninteractive FAQs on inner pages | H3/paragraph answers all expand into the reading column. The reference uses native core/details, keyboard support and visible focus. |
| Medium | Brand text clips | SVG viewBox 310 does not contain the whole wordmark. The viewBox is widened without changing the mark or replacing header/footer markup. |
| Medium | Canonical identity changes by mirror build | Existing build rewrites production SEO to the mirror host. The fix keeps Webflow canonical/OG/schema identity and repository-relative assets. |
| Medium | Article metadata lacks source dates | No authoritative publication timestamps exist in structured documents. Reading time can be calculated; dates must not be invented. |
| Low | Repeated generic related-content labels and CTA | Every structured route receives the same ending. The new reference names connected products and uses an MT5-specific final action. |

Live representative inspection confirmed the same MT5 heading and asset structure on both hosts, no obvious root horizontal overflow in the observed views, an overlong hero heading, text-only sections and the clipped logo. Breakpoint measurements are recorded separately by automated QA; screenshots alone are not treated as proof of all interactions. During browser inspection, responsive overrides applied to the active tab, so inactive-tab measurements are not counted as completed breakpoint coverage.

## Design system

`src/inner-system.js` defines the semantic composition and serializes it as static HTML or core Gutenberg groups, headings, paragraphs and details. `assets/css/inner-pages.css` is shared verbatim by both outputs. New styles are scoped to `.mgl-design`, use `mgl-inner-*` components and do not apply to the homepage or shared chrome.

| Family | Intended use | Composition |
|---|---|---|
| Service | MT4/MT5 products, client applications, modules | Compact split hero, conceptual stack, capability cards, operational rows, scoped integration journey, FAQ and connected solutions |
| Hub | Grey/white label, CRM, liquidity, platform categories | Editorial category hero and linked child-route selector |
| Pricing | White/grey label pricing | Centered introduction, package emphasis, fee rows; source-based commercial information, no invented prices |
| Comparison | White vs grey, A/B book | Decision-focused hero and scannable criteria rows |
| Process | Launch workflow | Numbered timeline with source milestones and dependencies |
| Technical | Admin, bridge, back office | Operational architecture and bordered capability panels |
| Article | Brokerage insights | Reading-width body, reading time and anchored sidebar |
| Company | About / why choose us | Narrative split sections with principle-led content |

These families are implemented as reusable composition paths. Rollout remains gated to the MT5 service reference until its actual browser/WordPress QA and screenshots have been reviewed. Presence in this table does not mean all routes have been redesigned or individually approved.

## Reference and safeguards

Route: `/forex-grey-label/mt5-grey-label/`. Original structured content is retained; H1 is shortened for scanning while the original descriptive title remains in SEO. Core setup, optional extras, pricing qualifications and all four FAQ answers remain. New diagrams explicitly describe an illustrative configuration and package-dependent scope. No testimonials, unverified metrics, fixed fees or guaranteed timelines were added.

Both themes use opaque surfaces and explicit contrast tokens. Keyboard focus, 44px minimum actions, native disclosure state and reduced motion are part of QA. No new frontend dependency is added. The motion curve is cubic-bezier(.22,1,.36,1).

Homepage, header and footer source bytes remain unchanged. Logo viewBox and shared canonical-build corrections are narrow compatibility fixes. No main merge, production deployment, DNS edit or paid service is authorized by this PR.
