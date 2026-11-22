# Reference typography — omar.akogs-fashion.com

Source reviewed: https://omar.akogs-fashion.com/
Source component reference: https://github.com/omarreact/mt4-grey-label-kickgent-next
- `components/SharedSiteChrome.tsx`: explicit `Inter, ui-sans-serif, system-ui, sans-serif` for shared site chrome
- `components/HomePageTailwind.tsx`: homepage typography utility classes
- `styles/pintheme-tailwind.css`: `--pt-heading-font` and `--pt-body-font` both use Inter

These are **declared source styles**, not a computed-style capture of every element
on the deployed WordPress website. Its active WordPress theme may apply additional
user customizations.

## Extracted reference specimens

| Role | Family | Size | Weight | Line height | Tracking |
| --- | --- | --- | --- | --- | --- |
| Site chrome | Inter | component-specific | component-specific | component-specific | component-specific |
| Hero heading, desktop | Inter | `clamp(3.3rem,6.1vw,5.8rem)` | 650 | 1.15 | -0.045em |
| Hero heading, <=640px | Inter | `clamp(2.1rem,9vw,2.9rem)` | 650 | 1.15 | -0.04em |
| Primary section headings | Inter | `clamp(2.5rem,5.2vw,4.8rem)` | 600 | 1.02 | -0.055em |
| Alternate section headings | Inter | `clamp(2.6rem,5vw,4.8rem)` | 600 | 1.0 | -0.06em |
| Body paragraphs | Inter | 16px | 400 | 1.6–1.7 | default |
| Card description | Inter | 14px | 400 | 1.55 | default |
| Buttons | Inter | 14px | 800 | component-specific | default |
| Section eyebrow | Inter | 12px | 800 | component-specific | 0.16–0.18em |

## Meta Grey Label implementation

The shared baseline now uses Inter with Arial/Helvetica fallback, 16px body text,
400 weight, 1.65 line height, 600 heading weight, 1.04 shared heading line
height, -0.055em heading tracking, 14px / 600 UI, and 14px / 800 buttons.
The shared h1 max is 93px and h2 max is 77px, with fluid viewports.
The dedicated inner-page design-system rules deliberately retain their own
font-size, line-height and responsive clamps to preserve approved layouts.

The implementation is synchronized across `assets/site-settings.json`,
`assets/css/site-settings.css`, `assets/js/site-settings.js`, `theme.json`,
`assets/css/fse.css`, native/inner-page CSS, and the static header.

For release validation, compare browser-computed font family, loaded font
network request, line wraps, button widths and navbar overflow at
360/390/768/1024/1180/1440/1920px. Check homepage, an inner content page,
directory, and WordPress Site Editor in both color themes. A code review
alone cannot establish visual parity.
