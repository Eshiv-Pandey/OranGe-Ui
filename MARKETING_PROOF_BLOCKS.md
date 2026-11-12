# Testimonials, pricing and FAQ blocks

Completed batch: November 13, 2026. The catalogue contains 61 blocks at this handoff. This batch adds nine reference-led compositions and moves the existing Accordion presentation into the FAQ block collection.

The examples belong to the Polished collection. Their authored palettes stay consistent in both library themes; the neutral catalogue shell and shared palette controls retain their established behavior.

## Reference-to-layout map

Reference numbers follow the supplied order within each category. Reference layout and material cues inform original React and CSS; reference pixels, logos, likenesses and slogans are not shipped.

| Reference | Block and route | Implemented composition |
| --- | --- | --- |
| Testimonials 1 | `StackedTestimonials`, `/blocks/stacked-testimonials` | Green quote card, rotated blue backing, ink offset shadow and lime author footer. |
| Testimonials 2 | `CollageTestimonials`, `/blocks/collage-testimonials` | Tilted lime, pink and cream quote cards on a white stage, with portraits and ratings. |
| Testimonials 3 | `PortraitTestimonials`, `/blocks/portrait-testimonials` | Emerald photographic quotation frame on a dark stage. |
| Testimonials 4 | `InfiniteTestimonials`, `/blocks/infinite-testimonials` | Four seamless rounded quote rows moving left, right, left and right. |
| Pricing 1 | `GlassPricing`, `/blocks/glass-pricing` | Three translucent black/cyan plan panels and a luminous featured plan. |
| Pricing 2 | `TicketPricing`, `/blocks/ticket-pricing` | Orange heading, cream/lime perforated tickets on ink, and a pink group offer. |
| FAQ 1 | `FolderFaq`, `/blocks/folder-faq` | Amber folders on cream; an open folder reveals a white answer sheet above its question. |
| FAQ 2 | `BubbleFaq`, `/blocks/bubble-faq` | Pink question board with a condensed heading and rounded cream disclosures. |
| FAQ 3 | `PosterFaq`, `/blocks/poster-faq` | Angled lime, blue and cream question bands with existing original character artwork. |
| Existing Accordion | `AccordionFaq`, `/blocks/accordion-faq` | Familiar single-open Accordion wrapped in a complete section heading. |

## Interaction and responsive contracts

- `StackedTestimonials` and `PortraitTestimonials` use named Previous/Next buttons, wrap at either end and announce the selected position. They do not rotate automatically. `CollageTestimonials` is a static reading composition. Empty story arrays show an explicit empty state; omitted portraits use initials.
- `InfiniteTestimonials` distributes stories across four rows and duplicates visual groups for seamless travel. Duplicate stories are hidden from assistive technology. `duration` defaults to 55 seconds, is bounded to 15 through 180 seconds, and increases by four seconds for each following row. Hovering or focusing the rows pauses all tracks; Pause motion/Resume motion provides an explicit toggle. Offscreen and hidden-document motion pauses. Reduced motion or `animate={false}` removes travel and visual duplicates, wrapping each story once into readable static lists.
- `GlassPricing` switches between monthly and yearly totals with native pressed-state billing buttons. `TicketPricing` selects a ticket or optional group offer; `groupOffer={null}` removes that strip. Prices use the configured currency, with USD fallback for an invalid code. Actions require `onChoose`, stay disabled while a callback is pending, and expose success or recoverable error feedback. Callbacks belong to the consuming application and do not redirect automatically; pass them from a client component in Next.js.
- `FolderFaq`, `BubbleFaq` and `PosterFaq` use native `details`/`summary`. Enter or Space expands the focused question, focus remains on it, and multiple answers can stay open. `defaultOpen` sets the initial index; `null` starts closed. `AccordionFaq` retains single-open, collapsible behavior plus Arrow keys and Home/End trigger navigation. Empty question arrays show an empty state. Reduced motion removes disclosure-icon transitions without removing disclosure behavior.
- Layout adapts to the block container. At 600px, collage cards and glass plans become single columns, stack geometry tightens and the portrait frame becomes shallower. Ticket plans reflow from four columns to two at 900px and one at 600px, where the group offer also stacks. Bubble FAQ stacks its heading above answers at 700px. Poster FAQ narrows at 700px, then places topic and question beside smaller art at 520px. Folder padding and answer type tighten at 520px. Moving pills retain their four-row structure; static pills wrap rather than clip text.

Visible focus uses the established Section focus treatment with local light or dark contrast. Block typography reuses `Section Display` for headings and the existing body family for ordinary copy; Bubble and Poster headings use `Section Condensed`. Bold color, offset shadows, rotation and glass are local material decisions for these compositions.

## Ordering and Accordion migration

`lib/marketing-proof-blocks.ts` defines the new entries. `lib/blocks.ts` inserts them before the incumbent `testimonials`, `pricing-section` and `faq` entries. FAQ order is Folder, Bubble, Poster, Accordion, then the existing simple FAQ.

Accordion is removed from the public Components catalogue. `/components/accordion` permanently redirects to `/blocks/accordion-faq`. `findComponent("accordion")` retains its legacy definition for source downloads and installation, and `AccordionFaq` continues to import the reusable Accordion implementation. Existing source consumers retain that implementation.

## Source and licensed assets

Source is in `components/ui/blocks/{testimonial-variants,pricing-variants,faq-variants}.tsx`, with corresponding files under `styles/`. `testimonial-data.ts`, shared block behavior, the motion activity hook, Accordion, Section materials and Section artwork remain transitive dependencies. Keep the downloaded `components/`, `styles/` and `public/` folders together.

The self-hosted Section fonts are Bricolage Grotesque, weight 800, and Barlow Condensed, weight 900, distributed under SIL OFL 1.1. Preserve `public/fonts/sections/NOTICE.md` and the corresponding license files. The Section aliases remain local to blocks.

The four illustrative Unsplash portraits and their source/license notes are recorded in `public/photos/keepsakes/TESTIMONIAL_PHOTOS.md`. The source bundle includes that notice and the images. Copyright permission does not supply a model's likeness rights. Sample authors, organizations, quotes, ratings, prices and offers are fictional; the portraits do not depict or endorse those fictional authors. Production consumers must replace examples with their own verified content and authorized portraits. Existing original character/sticker assets retain the notices under `public/art/footer/`. Catalogue previews are original captures of the authored blocks and retain provenance. Preserve all notices in portable distributions.

## Verification evidence

- Main workspace production build and lint passed.
- All 13 unit/source checks passed in `tests/marketing-proof.test.tsx`, including independent task-only source/unit verification and portable source dependencies.
- All four browser checks in `tests/marketing-proof.spec.ts` passed: desktop/mobile rendering and accessibility, four-row motion/pause/reduced motion, keyboard disclosures, pricing feedback and Accordion redirect.
- `.impeccable/review/marketing-proof/screenshots/` holds 22 desktop/mobile captures, including moving and static Infinite states. `out/marketing-proof/a11y-1280.json` and `a11y-390.json` report zero violations for all ten examples.
- Fourteen shipping-raster provenance scans reported zero missing origins.
- The finish review identified documentation persistence as its sole remaining fix, with no visual defect. This reference and the scoped appendix in `DESIGN.md` record the implemented palettes, fonts, motion, reflows, content rules and migration.

These results cover the completed Testimonials, Pricing and FAQ batch.
