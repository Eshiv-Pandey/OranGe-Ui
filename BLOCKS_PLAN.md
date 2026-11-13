# Original oRangeUi blocks

Baseline status: the original 30-block implementation completed verification, finish-review corrections and design documentation on 11 November 2026. The expansion now includes five Auth layouts, seven Footer layouts and category collections.

The brief is to examine Efferd and Watermelon UI, cover the same kinds of reusable sections, and make original polished work with consistent quality. Their component source, artwork and copy are not implementation inputs.

## Coverage

The union of the two public catalogues has 27 useful section types:

Auth, Hero, Header, Footer, Features, Bento, Pricing, Testimonials, Logo Cloud, Integrations, FAQ, Contact, Newsletter, Blog, Team, Careers, Image Gallery, CTA, Announcement, Not Found, App Shell, Dashboard, Settings, Notifications, File Upload, Stats and Widgets.

Each has a complete original representative. The expanded direction is at least five original examples per section. Auth has five distinct layouts covering sign-in, signup, password recovery and verification; Footer has seven distinct closes. The other categories retain their initial examples while subsequent sections are developed. Two distinct heroes and composed marketing/workspace templates show how the system works across a complete page. Quality and consistency remain the acceptance bar for every addition.

## Auth expansion checkpoint

- Five layouts: AuthPanel, QuietAuth, StudioAuth, ContrastAuth and PlayfulAuth.
- Category-first discovery at `/blocks`, with large stacked previews at `/blocks/category/<slug>`.
- Preview/Code, responsive widths, light/dark palettes, per-example Reset, source retry and manual clipboard recovery.
- NeonNotFound and ChaiBreak404 moved into Not Found; PavilionFooter moved into Footer. Legacy component links redirect to their block pages.
- At this verified checkpoint: 37 original blocks in 28 categories, with Auth expanded to five. The later Footer checkpoint is recorded below.
- The 50-sticker collection has its own `feat/stickers-50` branch and separate worktree, with `STICKERS_PLAN.md` for its session handoff.
- Auth verification and design receipts are recorded separately from the baseline in `BLOCKS.md` and local `out/iteration/auth-expansion/`.

## Footer expansion checkpoint

- Five new layouts lead the category: BlueHourFooter, StudioFooter, ColonyFooter, HillsideFooter and SkylineFooter. PavilionFooter follows; SiteFooter is last.
- Current total: 42 original blocks in 28 categories. Auth has five layouts and Footer has seven; the other sections remain on their earlier coverage.
- Browse and category headers are compact. Preview/Code, widths, palettes, Reset and interaction-state retention remain available.
- Standalone source, typed props, complete ZIPs and registry entries include local artwork, styles, fonts and notices.
- Engraved and painted landscape plates, playful characters and sticker accents are original local assets. SkylineFooter retains the existing user-supplied portfolio skyline and truck extraction. [FOOTERS.md](FOOTERS.md) records references and integration.
- Seven metadata/source checks passed, including all 42 standalone examples. The first browser matrix passed 20 renders at 1440px/390px in both palettes with no Axe violations. Final build and browser confirmation after the font update are pending.

## Delivery

- A searchable `/blocks` collection with category discovery.
- Dedicated block pages with live previews, responsive viewport controls, light/dark themes, source files and documented typed props.
- Standalone preview URLs so full sections have room to work.
- Complete shadcn registry entries and source ZIPs using the existing secure source pipeline.
- Reusable blocks with configurable copy/data and application-owned callbacks.
- Existing orange branding, Geist type, semantic palette and working Button/Input controls.
- Keyboard behavior, mobile layouts, loading/error/empty states and reduced motion.
- Meaningful interaction, source-download, registry and browser checks.
- Bounded visual inspection, independent finish review and design documentation.

## Research

- Efferd: https://efferd.com/blocks, https://efferd.com/blocks/auth, https://efferd.com/blocks/hero. Its public categories cover marketing sections and app layouts; discovery leads to previews and registry installation.
- `watermelonui.com` does not resolve. The current official site is https://ui.watermelon.sh/. Its `/blocks`, `/dashboards`, `/templates` and `/llms.txt` cover sections, full compositions and public source-backed discovery.
- Pinterest: https://www.pinterest.com/pin/905786543810340986/ and https://www.pinterest.com/pin/6685099441223939/. Public pin image metadata was fetched and the previews were visually inspected. The useful observations are list rhythm, restrained navigation, clear content hierarchy and spacing. No referenced artwork is shipped.
- Other examined pins: https://www.pinterest.com/pin/836895543266152583/ is a poster rather than a useful UI reference; https://www.pinterest.com/pin/153403931054580601/ is a conventional illustration-led hero. Neither determines the new blocks' composition.

Private research captures and the existing worktree baseline are under ignored `out/iteration/`. Existing uncommitted work was recorded before integration and remains owned by its original work.

## Historical 30-block checkpoint

All 30 entries, discovery/detail pages, standalone previews, typed props, secure registry entries and ZIP downloads are implemented. The production build, scoped lint, copy check, 15 focused interaction/source checks and five production browser suites passed. All extracted examples compile at ES2020 and the composed landing example builds in React/Vite without Next.js.

The independent finish reviewer requested four fixes: preserve block-owned preview spacing, depict each block faithfully in its catalogue miniature, retain accessible primary-anchor colors in dark mode and make the mobile props table readable. Those fixes were applied as one batch. A fifth browser check verifies embedded/standalone auth positioning, dark marketing contrast and keyboard table scrolling. The original reviewer's continuation exceeded the runtime image limit; a fresh reviewer scored the same four findings resolved from the refreshed captures. Its ship verdict covers those four fixes.

The design scan ran once, with no primary findings. A fresh documenter verified the finished extension against the incumbent system and preserved DESIGN.md and its sidecar. Existing type/radius inventory gaps and the sidecar's older Input focus specimen were recorded locally without a system refresh. Private verification records remain under ignored out/iteration/.
