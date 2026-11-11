# Original page blocks

oRangeUi includes 30 original Polished blocks across 27 section types and two composed templates. Discover them at `/blocks`. Every entry has a live preview, typed prop documentation, source-file browsing, a complete ZIP and a shadcn-compatible registry command.

## Start here

- `/blocks/auth-panel`: sign-in, signup, password recovery and six-digit verification.
- `/blocks/editorial-hero` and `/blocks/product-hero`: two distinct openings.
- `/blocks/studio-landing`: a composed marketing page with working section navigation.
- `/blocks/studio-workspace`: a responsive workspace with a daily agenda, project view, notifications, preferences and a focus timer.
- `/preview/blocks/<slug>`: standalone previews outside the documentation shell.

The preview can switch between full, tablet and phone widths without resetting the component. Light and dark palettes are independent of width. Reset starts a fresh demonstration. Auth previews expose every flow. Service-backed demos let you try successful and failed callbacks; they do not send, upload, authenticate, purchase or persist data.

## Coverage

| Section | Export |
| --- | --- |
| Auth | AuthPanel |
| Hero | EditorialHero, ProductHero |
| Header | SiteHeader |
| Footer | SiteFooter |
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
| Not Found | EmptyPage |
| App Shell | AppShell |
| Dashboard | WorkspaceOverview |
| Settings | SettingsPanel |
| Notifications | NotificationInbox |
| File Upload | UploadSection |
| Stats | StatsSection |
| Widgets | FocusWidget |
| Templates | StudioLanding, StudioWorkspace |

## Installation and integration

Copy the installation command from a block page. It uses `/r/block-<slug>.json` and installs into the project-root `orangeui/` namespace. Keep its folders together. The example and all local dependencies are included. Registry installation embeds fonts and sample photographs as data URLs; retain the included licenses and allow the corresponding `font-src` and `img-src` data URLs in a restricted CSP.

ZIP downloads at `/api/blocks/<slug>` include original React/TypeScript source, imported styles, local dependencies, fonts, demonstration photographs, an example and a README. Merge the included `public/` directory into your application. The CSS imports are included; Tailwind is not required. Read text files through `/api/blocks/<slug>?format=source`.

The application owns authentication, provider login, checkout, email, file storage and persistence. Supply the typed callbacks to connect those services. Promises show pending, success and recoverable error states. Forms validate before calling your service and prevent repeat submissions while pending. Validate requests again on your server. Service actions are disabled when their callback is absent; notification read state can optionally remain local.

In Next.js, pass callback props inside a client component. The downloadable source uses React 19 and TypeScript and is framework independent. Set `data-theme="light"` or `data-theme="dark"` on HTML. With neither, styles follow the system palette. These blocks support the Polished collection.

Daylight is fictional. Sample organizations, people, prices, quotations and statistics are illustrative. Replace sample content with your own verified copy, links, prices, testimonials and metrics. The existing landscape photographs use the Unsplash license; preserve their notice with redistributed samples.

## Design and provenance

This extension uses the existing Geist typography, orange actions, semantic neutral surfaces and shared Button/Input controls. Marketing sections vary typography, imagery and density; workspace sections prioritize clear lists and useful states. Layouts respond to the containing preview's width through container queries. Motion respects reduced-motion preferences.

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

Verified on 11 November 2026: production build, TypeScript, scoped lint, copy checks, 15 focused Vitest checks and five production Playwright suites passed. The independent review's four material corrections were scored resolved in the final verdict. A separate design verification confirmed the extension's use of the existing system and preserved its design documents.
