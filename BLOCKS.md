# Original page blocks

oRangeUi includes 37 original blocks across 28 categories, including two composed templates. Start at `/blocks`, choose a category, and compare its working examples at `/blocks/category/<slug>`. Every entry has a live preview, typed prop documentation, source-file browsing, a complete ZIP and a shadcn-compatible registry command.

Auth currently has five distinct layouts. Other categories have one to three examples; five layouts per category have not been completed.

## Start here

- `/blocks/category/auth`: AuthPanel, QuietAuth, StudioAuth, ContrastAuth and PlayfulAuth, each with sign-in, signup, password recovery and six-digit verification.
- `/blocks/category/hero`: the editorial and product openings.
- `/blocks/category/not-found`: EmptyPage, NeonNotFound and ChaiBreak404.
- `/blocks/category/footer`: SiteFooter and PavilionFooter.
- `/blocks/category/<slug>#block-<block-slug>`: a specific example within a category. Category names use lowercase hyphenated slugs, such as `image-gallery` and `file-upload`.
- `/blocks/<block-slug>`: dedicated documentation, typed props and usage examples.
- `/blocks/editorial-hero` and `/blocks/product-hero`: two distinct openings.
- `/blocks/studio-landing`: a composed marketing page with working section navigation.
- `/blocks/studio-workspace`: a responsive workspace with a daily agenda, project view, notifications, preferences and a focus timer.
- `/preview/blocks/<slug>`: standalone previews outside the documentation shell.

The catalogue starts with category cards. Search and All examples expose individual entries, while the category navigation lists each section's examples and links to their live previews.

Each category entry has Preview and Code views, Full/Tablet/Phone widths and a light/dark host palette. Switching views, width or palette keeps the preview mounted and preserves its current form and interaction state. Each entry owns its controls; Reset deliberately starts that entry's demonstration again. This is local page state, not persistence across reloads. Auth mode changes open a fresh form for the selected flow.

Code loads the complete text source on demand, provides a file selector and copy/download actions, and offers Retry source plus a ZIP when loading fails. If clipboard access fails, a labelled textarea focuses and selects the exact install command or source text for manual copying. Dedicated documentation pages retain separate Preview, Usage and Source views.

Service-backed demos let you try successful and failed callbacks; they do not send, upload, authenticate, purchase or persist data. The provider and passkey buttons are callback demonstrations. In the new Auth examples, Continue with passkey goes through the same `onProvider` callback as the demo identity provider; it does not implement WebAuthn or a production identity flow.

## Auth layouts

| Export | Detail route | Composition |
| --- | --- | --- |
| AuthPanel | `/blocks/auth-panel` | Original split forest artwork and focused form. |
| QuietAuth | `/blocks/quiet-auth` | Centered form, generous space and a restrained sun mark. |
| StudioAuth | `/blocks/studio-auth` | Warm editorial panel and licensed landscape photographs. |
| ContrastAuth | `/blocks/contrast-auth` | Pale-sage/light and dark form pair with a blue-green photographic panel retained in both palettes. |
| PlayfulAuth | `/blocks/playful-auth` | Cream/light and forest/dark form pair with mint, amber and pink paper artwork; starts in signup. |

All five share the typed auth flow and submission behavior. Supply `onSubmit`, optional `providers`/`onProvider`, and application-owned recovery and verification services. ContrastAuth and PlayfulAuth follow the inherited light/dark `color-scheme` through their own paired form palettes; their photographic and paper artwork remains scoped to each layout.

## Coverage

| Section | Export |
| --- | --- |
| Auth | AuthPanel, QuietAuth, StudioAuth, ContrastAuth, PlayfulAuth |
| Hero | EditorialHero, ProductHero |
| Header | SiteHeader |
| Footer | SiteFooter, PavilionFooter |
| Features | FeatureStory |
| Bento | BentoOverview |
| Pricing | PricingSection |
| Testimonials | TestimonialSection |
| Logo Cloud | LogoCloud |
| Integrations | IntegrationDirectory |
| FAQ | FaqSection |
| Contact | ContactSection |
| Newsletter | NewsletterSection |
| Blog | JournalSection |
| Team | TeamSection |
| Careers | CareersSection |
| Image Gallery | ImageGallery |
| CTA | CallToAction |
| Announcement | AnnouncementBar |
| Not Found | EmptyPage, NeonNotFound, ChaiBreak404 |
| App Shell | AppShell |
| Dashboard | WorkspaceOverview |
| Settings | SettingsPanel |
| Notifications | NotificationInbox |
| File Upload | UploadSection |
| Stats | StatsSection |
| Widgets | FocusWidget |
| Templates | StudioLanding, StudioWorkspace |

## Moved scene blocks

The existing recovery pages and pavilion footer now appear under Blocks, retaining their authored artwork and component APIs. Their old component-page URLs permanently redirect to the new detail pages:

| Previous route | Current route | Export |
| --- | --- | --- |
| `/components/neon-sign-404` | `/blocks/neon-sign-404` | NeonNotFound |
| `/components/chai-break-404` | `/blocks/chai-break-404` | ChaiBreak404 |
| `/components/pavilion-footer` | `/blocks/pavilion-footer` | PavilionFooter |

`/blocks/auth` also redirects to `/blocks/category/auth`. The existing site recovery page continues to use ChaiBreak404. These are discovery moves, not newly generated scene artwork. PaperCut remains at `/components/paper-cut`; the separate sticker work is not included in the 37-block count.

## Installation and integration

Copy the installation command from a block page. It uses `/r/block-<slug>.json` and installs into the project-root `orangeui/` namespace. Keep its folders together. The example and all local dependencies are included. Registry installation embeds fonts and sample photographs as data URLs; retain the included licenses and allow the corresponding `font-src` and `img-src` data URLs in a restricted CSP.

ZIP downloads at `/api/blocks/<slug>` include original React/TypeScript source, imported styles, local dependencies, fonts, demonstration photographs, an example and a README. Merge the included `public/` directory into your application. The CSS imports are included; Tailwind is not required. Read text files through `/api/blocks/<slug>?format=source`.

The application owns authentication, provider login, checkout, email, file storage and persistence. Supply the typed callbacks to connect those services. Promises show pending, success and recoverable error states. Forms validate before calling your service and prevent repeat submissions while pending. Validate requests again on your server. Service actions are disabled when their callback is absent; notification read state can optionally remain local.

In Next.js, pass callback props inside a client component. The downloadable source uses React 19 and TypeScript and is framework independent. Set `data-theme="light"` or `data-theme="dark"` on HTML. With neither, styles follow the system palette. These blocks support the Polished collection.

Daylight is fictional. Sample organizations, people, prices, quotations and statistics are illustrative. Replace sample content with your own verified copy, links, prices, testimonials and metrics. The existing landscape photographs use the Unsplash license; preserve their notice with redistributed samples.

## Design and provenance

The category shell inherits the existing Geist typography, orange actions, semantic neutral surfaces and readable library controls. Auth examples vary layout and local artwork palettes while sharing the existing Button/Input APIs. Marketing sections vary typography, imagery and density; workspace sections prioritize clear lists and useful states. Layouts respond to the containing preview's width through container queries. Motion respects reduced-motion preferences.

Auth-specific materials and the moved scene palettes remain scoped to their examples. This expansion does not redefine the shared palette, type ramp, appearance rules or design-system documents.

Efferd and the current Watermelon UI site at `https://ui.watermelon.sh/` informed the section coverage and discovery flow. Public Pinterest previews informed spacing and workspace hierarchy. Their source, components, copy and artwork were not used. The compositions and demonstration content were authored for oRangeUi.

## Verification

Run from the repository root:

```sh
npm run build
npx vitest run tests/blocks.test.tsx tests/blocks-source.test.ts --maxWorkers=1 --fileParallelism=false
npx playwright test --config=playwright.blocks.config.ts
```

The browser suite expects a production preview at `http://127.0.0.1:3140`:

```sh
npm run start -- --hostname 127.0.0.1 --port 3140
```

The checks cover form flows and callback errors, file selection limits, billing selection, preferences, notifications, project filtering, timer behavior, all extracted usage examples, registry portability, public source boundaries and production download routes. Desktop/phone captures, representative dark captures and accessibility checks are kept under local verification output.

### Historical 30-block baseline

Verified on 11 November 2026 before the Auth/category expansion: production build, TypeScript, scoped lint, copy checks, 15 focused Vitest checks and five production Playwright suites passed. The independent review's four material corrections were scored resolved in its scoped final verdict. A separate design verification confirmed the original extension's use of the existing system and preserved its design documents. Those results remain baseline evidence; they do not certify the current 37-block expansion.

### Current Auth/category expansion

Verified on the final production build (`8_B7_32TuFYcAUNzXsoSR`): build and TypeScript, scoped lint and copy checks passed. The focused unit/source run passed 31 checks, including compilation of all 37 standalone usage examples; after the earlier correction batch, the overlapping 25 Auth/Blocks unit/source checks were refreshed and passed. Staged source/type verification also passed.

The 18 Auth/category production browser tests passed, including five forms in both palettes with 10 Axe observations, keyboard focus after internal auth-mode changes, form retention across width/palette/Code switches and explicit reset, painted ContrastAuth/PlayfulAuth theme changes, source retry, manual copying, legacy redirects and embedded scenes. The five existing Blocks suites also passed against all 37 downloads, source traces, assets and desktop/mobile overflow checks.

PaperCut's separate verification passed two production browser tests for motion, keyboard and reduced-motion behavior, with four theme/device Axe observations. It remains outside the Blocks count. These Axe observations apply to the tested states, not every possible consumer configuration.

One design-detector run reported zero primary findings and advisories only. The builder completed its initial inspection, one correction batch and confirmation. The independent finish reviewer then identified one fix: remove the WELCOME IN eyebrow from PlayfulAuth and its miniature. That text was removed while the pink icon ornament and composition were preserved.

After the reviewer fix, seven affected browser tests passed against the final build, covering state retention, all five forms in both palettes with Axe, and four category/Auth recapture matrices. These refreshes overlap the earlier 25 unique browser checks: 18 Auth/category, five Blocks and two PaperCut. The earlier unit/source and browser evidence remains covered; the refreshed tests are not added as distinct coverage totals. The local design verification records source inheritance and system preservation under `out/iteration/auth-expansion/design-verification.md`. The independent reviewer scored the single material correction resolved and returned ship at the reviewed scope.
