# Stats, announcements, contact and team blocks

Batch handoff: November 13, 2026. This extension adds 14 layouts: three Stats, three Announcements, four Contact and four Team blocks. The catalogue now contains 75 blocks. Each category includes an original neobrutalist Poster option; all entries belong to the Polished collection and retain their authored materials in both host themes.

This document covers only this extension. The direction contract is `.impeccable/surfaces/components-ui-outreach-blocks.md`; supplied reference evidence is indexed in `references/next-marketing-pins/index.json`.

## Reference and layout map

| Reference | Block and route | Implemented translation |
| --- | --- | --- |
| Stats 1 | `DotStats`, `/blocks/dot-stats` | Ink panel, yellow/violet hundred-dot percentage matrix and textual legend. |
| Stats 2 | `PulseStats`, `/blocks/pulse-stats` | Emerald dashboard, distribution ring, lime/violet metric tiles and labelled bars. |
| Original addition | `PosterStats`, `/blocks/poster-stats` | Cream board with lime, pink and orange definition-list metrics, ink borders and offset shadows. |
| Original addition | `PosterAnnouncement`, `/blocks/poster-announcement` | Lime paper announcement on pink with original sticker art and ink edges. |
| Announcement 2 | `ReminderAnnouncement`, `/blocks/reminder-announcement` | Blue/cream reminder, rotated backing, photographic ground and preparation meter. |
| Announcement 3 | `SceneAnnouncement`, `/blocks/scene-announcement` | Steady taped cobalt card over independently cycling photographs. |
| Contact 1 | `EditorialContact`, `/blocks/editorial-contact` | Oversized cream italic lettering, original stickers, displayed address and form on ink. |
| Contact 2 | `ChannelContact`, `/blocks/channel-contact` | Ruled contact methods on cream, original character art and a message form. |
| Contact 3 | `SignalContact`, `/blocks/signal-contact` | Violet heading and signal artwork, lime form action and ink ground. |
| Original addition | `PosterContact`, `/blocks/poster-contact` | Violet neobrutalist board, cream form, lime action and offset ink shadows. |
| Team 1 | `CollageTeam`, `/blocks/collage-team` | Presentation layout translated to pink/cream portrait, role and biography cards with a closing strip. |
| Team 2 | `FlipTeam`, `/blocks/flip-team` | Presentation mosaic translated to violet profile tiles that reveal roles, interleaved with original artwork. |
| Team 3 | `CharacterTeam`, `/blocks/character-team` | Illustrated profiles on cream, amber and coral cards with circular grounds and expandable biographies. Reference game characters are replaced with original oRangeUi characters. |
| Original addition | `PosterTeam`, `/blocks/poster-team` | Lime, violet and pink photographic profiles with ink edges and offset shadows. |

Reference layout and material cues inform original React/CSS. Reference pixels, brands, claims, people and copyrighted game characters are not distributed.

## Measurements and interaction

`DotStats` clamps finite percentages to 0 through 100 and maps non-finite values to zero. The hundred-dot graphic uses the rounded percentage for filled dots while the displayed value and labelled legend retain the supplied bounded percentage. `PulseStats` period buttons switch the complete dataset, expose pressed state and announce the resulting metrics. Segment values are normalized from finite nonnegative values; charts provide named labels and values. `PosterStats` is a static definition list. Its large measurements retain tight display tracking, while descriptive captions use normal body tracking. Empty metric or period arrays show an explicit empty state.

Announcement actions require application-owned `onAction: () => void | Promise<void>`. Buttons disable without a callback and while it is pending, show Opening..., then expose completion or recoverable rejection feedback. They do not navigate automatically. `dateLabel` is configurable copy; it is not a countdown. Reminder preparation progress is bounded to 0 through 100, with an accessible progressbar name and values.

`SceneAnnouncement` keeps its card, text and action stationary while background image layers crossfade over 900ms. `interval` defaults to six seconds and is bounded to 3 through 60 seconds. Elapsed active time advances the image index; offscreen and hidden-document states suspend the clock rather than catching up on return. Pause backgrounds/Resume backgrounds provides an explicit native toggle. Cycling requires `animate={true}` and at least two images. Reduced motion displays the first photograph without transitions and hides the motion control; `animate={false}` stops automatic changes. An empty background array leaves the solid ground. The user confirmed this steady-card, changing-background behavior.

`FlipTeam` reveals the role on hover or keyboard focus. Enter, Space or a touch tap toggles a persistent flip through the native button, with `aria-pressed` and an accessible name containing the person's name and role. Its local 420ms `cubic-bezier(.16,1,.3,1)` rotation becomes immediate for reduced motion. Both visual faces are hidden from assistive technology to avoid duplicate names. `CharacterTeam` uses native biography summaries; Enter or Space toggles each biography. Collage and Poster teams are static reading layouts. Empty member arrays show an empty state; omitted photographic portraits use initials. The user confirmed the role flips.

## Contact callbacks and validation

All four Contact layouts share the same labelled form. `onSubmit` receives trimmed `{ name, email, message }` only after validation: name must be nonempty, email must have a valid address shape, and message must contain at least ten characters. The textarea allows up to 10,000 characters. Invalid fields receive connected error text, `aria-invalid` and focus on the first invalid field. Pending fields and the submit button disable, duplicate submissions are blocked, and a rejected callback retains the entered values for retry. Success appears only after the callback resolves; `successMessage` defaults to Your message is sent.

Callbacks belong to the consuming application. Pass them from a client component in Next.js and connect the service and server-side validation there. Demonstration console callbacks do not send or persist messages. Contact channels are text unless a consumer supplies their real `href`; the large Editorial email is a displayed address.

## Phone and container reflows

- At 750px, PulseStats becomes two columns, growth and balance span the width, and PosterStats becomes one column. At 500px, DotStats puts the summary above the matrix and PulseStats becomes a single reading column.
- At 520px, announcement sticker sizes, reminder padding and backing height tighten. SceneAnnouncement keeps the taped card steady, with smaller copy/padding and a 680px minimum stage height; the motion control stays clear below it.
- At 720px, Editorial contact methods/form, Signal content/form and Poster copy/form stack. At 480px, ruled channels put values below labels, supporting art shrinks, Signal art follows its heading, and Poster form padding tightens. Fields retain visible labels and full available width.
- At 900px, CollageTeam moves from three columns to two and FlipTeam puts the heading above its mosaic. At 650px, Collage, Character and Poster profiles become one column while FlipTeam uses three mosaic columns. At 380px, the flip mosaic uses two columns with larger role text. Artwork, portraits and readable names remain available.

All thresholds are container queries. Visible Section focus edges adapt to each local light or dark material. The neutral library shell and shared token system retain their established behavior.

## Typography, artwork and portable source

The blocks reuse licensed Section Display, Bricolage Grotesque, and the existing body family. `Contact Editorial` is a local CSS alias for italic Cormorant Garamond, declared at weight 400 for EditorialContact's heading and large address. It reuses `public/fonts/film/cormorant-garamond-italic-latin.woff2`, the existing film subset documented at weight 500 in `public/fonts/film/NOTICE.md`. Preserve that notice and `public/fonts/film/OFL-cormorant-garamond.txt`, which carries SIL OFL 1.1. The alias and oversized serif role are scoped to EditorialContact and do not establish a global type ramp.

Section stickers and illustrated profiles are original oRangeUi artwork. Preserve their existing notices under `public/art/footer/` and `public/art/sections/`. CharacterTeam's amber card keeps its original Fold character and uses a pale disk (#f9e8bc) behind it for separation. This is a local material correction.

Sample names, roles, biographies, organizations, statistics, progress, dates and offers are fictional and configurable. Photographic profiles reuse illustrative Unsplash portraits whose source and copyright notes are in `public/photos/keepsakes/TESTIMONIAL_PHOTOS.md`; the photographs do not identify or endorse fictional members. Consumers provide verified content and authorized portraits for production. Announcement landscapes retain `public/photos/keepsakes/NOTICE.md`.

Source lives in `components/ui/blocks/{stats,announcement,contact,team}-variants.tsx` with matching styles. Keep the downloaded `components/`, `styles/`, `public/` and included dependencies together. Source bundles transport the film font and OFL notice for contact styles, landscape assets for announcement backgrounds, and portrait assets/notices for photographic teams. Registry installs embed fonts, photos and background assets as data URLs while preserving caller-supplied URLs. The isolated unit/source verification covers these transports and compilation of all 75 block uses.

## Catalogue ordering and verification

`lib/outreach-blocks.ts` defines the 14 entries. `lib/blocks.ts` inserts them before incumbent `stats`, `announcement`, `contact` and `team` entries. Category order is Dot/Pulse/Poster Stats; Poster/Reminder/Scene Announcements; Editorial/Channel/Signal/Poster Contact; and Collage/Flip/Character/Poster Team, followed by each existing simple example. Earlier blocks and the Accordion migration retain their existing documentation.

Recorded verification at this document pass:

- Final production build and targeted lint passed in the main workspace, including normal PosterStats caption tracking and the pale CharacterTeam center disk.
- All 25 unit/source checks and portable compilation of all 75 usage examples passed in both the main workspace and task-only isolated source verification. They cover font/background/photo transports, form validation/focus/trim/pending/failure recovery, actions, role toggles and ordering.
- All five outreach browser scenarios passed on the final build. Mobile rendering and interactions passed in the final full run. The desktop scenario exceeded its 120-second limit under concurrent suites, then passed alone in 26.5 seconds of execution, 54.2 seconds total, with a 240-second CLI limit.
- The earlier proof-block suite also passed all four scenarios on the final build.
- Current `out/outreach/a11y-1280.json` and `a11y-390.json` each contain 14 layouts with zero targeted axe violations, runtime errors or overflow failures.
- `.impeccable/review/outreach/screenshots/` holds all 31 final captures: 28 base viewport captures plus three active role/background captures. Thumbnails were refreshed from the final PNG captures.
- The final explicit provenance scan reports 14 rasters and zero missing origins. All 14 new WebP sidecars retain origins.
- The pre-documentation report at `.impeccable/review/outreach/detector.json` records 118 intentional material/type advisories and one Contact Editorial documentation warning. This reference and the scoped DESIGN.md appendix now record the alias and license as block-local guidance.

The final finish reviewer returned **ship**, scoring all three earlier findings resolved: PosterStats caption tracking, the Fold character's contrast, and scoped persistence including the Contact Editorial license. No regressions were observed in the four corrected captures. The review scope is those three named findings, assessed through the corrected captures and documentation. This document and the outreach appendix in DESIGN.md satisfy the persistence request.
