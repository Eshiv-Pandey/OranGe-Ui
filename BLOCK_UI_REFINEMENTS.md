# Block UI refinements

Completed November 12, 2026.

## Delivered

- Replaced the NeonHero and NeonBento 404 billboard with original geometric light artwork and neon color styling.
- Gave every neon bento cell mint, orange or violet borders. Hover and focus within brighten the border; a single timer occasionally dims one cell for one second. The timer pauses offscreen, when the document is hidden and with reduced motion.
- Added animated checkmark and temporary Copied feedback to prompt, command, example and source copy controls. Feedback begins only after a successful clipboard write. Failed writes retain selected manual-copy text.
- Removed the generic demo content banner across all block designs and removed block-local palette selectors from collection, documentation and standalone previews.
- Kept hero preview mouse, auxiliary-click and keyboard actions on the current page. Consumer-supplied portable component links retain their destination behavior.
- Refreshed neon catalogue thumbnails and their provenance. Allowed the existing public section artwork in the source-trace audit while retaining private-file exclusions.

## Verification

Production build jWDkYDZKV6HcP56NC7BR7 completed. TypeScript, scoped lint, copy checks, bundle checks and source-trace checks passed. Repository lint completed with no errors and two existing unused eslint-disable warnings in neon-sign-404.tsx copies.

Five targeted unit/source suites passed, totaling 25 tests. All six browser scenarios passed across the initial batch and focused clipboard-test corrections: responsive sections and accessibility at 1440, 768, 390 and 320 pixels in both host palettes; revenue controls and portable prompts; hero ordering; mouse and keyboard navigation prevention; border hover, automatic cycles, hidden-document pause and reduced motion; successful clipboard contents, repeat actions and denied-copy recovery. Windows clipboard comparisons normalize CRLF to LF, and copy-button locators remain stable while their labels change.

Four additional targeted auth and footer browser scenarios passed after adapting existing tests to inherited page palettes: distinct auth surface colors, accessibility for all five auth layouts in both palettes, and compact footer controls with preserved newsletter state. Updated affected older tests to stop selecting removed dropdowns.

## Ship review

Reviewed desktop and phone captures together. No clipped text, horizontal overflow, missing images or accessibility violations were found in the section coverage. Neon border and copy animations preserve readable content and reduced-motion feedback. All requested controls and visual corrections are implemented. Existing shared palette and licensed image/font provenance remain intact.

Preview: http://127.0.0.1:3152/blocks/category/hero and http://127.0.0.1:3152/blocks/category/bento.
