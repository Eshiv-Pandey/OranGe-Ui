# Adaptive cards and experimental input

Implemented locally on 7 November 2026. No commit or push was made.

## Current public scope

The approved cleanup keeps three standalone components: ChecklistCard and
PollCard under Inputs & forms, and FocusTimerCard under Content & layout.
AdaptiveInput remains installable under Experimental. It is a bounded-language
experiment and should be evaluated before integration into a product.

The library now has 112 regular components and one experiment, for 113 catalogue
entries. All includes both; the Experimental filter and the last navigation
group identify the experiment explicitly. This replaces the twelve-entry scope
and the twenty-component roadmap in the original plan.

EventCard, ReminderCard, BookmarkCard, NoteCard and ColorCard are example recipes.
BillSplitCard, UnitConverterCard and CalculatorCard remain internal supporting
examples. These eight have no standalone catalogue, detail, download or registry
entries. Their public URLs return 404. Their source, types and scoped styles
remain transitive dependencies of the AdaptiveInput installation. Its Load
example picker still explores all eleven kinds, including these recipes.

This cleanup changes organization and shipping scope. It preserves the corrected
prompt, request-scoped interpretation, saved drafts and all renderer behavior.

## Cleanup validation

Production build: 1kNqg4t_kzl8lLIWqlGrA. Typecheck, lint, build, copy checks,
and matching source-trace and standalone bundle checks passed.

All 101 affected behavior, inventory, parser, registry and installation tests
passed. The four public ZIP examples were extracted and typechecked at ES2020;
the combined example bundled independently in Vite. Public source and registry
payloads were checked in all five appearances, including every supporting
renderer in the combined installation. The full catalogue installation suite
was not repeated for this scope-only cleanup.

All 21 browser tests passed in 3 minutes. They cover four public demos at
320, 390, 768 and 1440px in both themes and all five appearances at 390px.
The integrated request workflow also covers 1536px, saved drafts, subsequent
automatic detection, keyboard use and the separate toolbar footer. Public
discovery and experimental grouping passed on desktop and mobile in both
themes. All 24 retired detail/download/registry URLs returned 404; all eight
retained download/registry URLs returned valid payloads. Checklist controls,
poll voting, timer completion, calculation inside the experiment, neutral
focus, reduced motion and the graph defaults passed their regression checks.

The 23 full-page captures were checked for validity, with overview and viewport
contact sheets. Evidence is under .impeccable/review/adaptive-cleanup.

Cleanup files: lib/adaptive-components.ts, lib/component-categories.ts,
lib/source-bundle.ts, components/library/adaptive-demos.tsx,
components/library/catalogue.tsx, PRODUCT.md, ADAPTIVE_INPUT_PLAN.md,
this document and the adaptive surface brief. Tests and current inventory
assertions were updated in adaptive-source.test.ts, adaptive.spec.ts,
adaptive-correction.spec.ts, creative-source.test.ts and
playwright.adaptive-cleanup.config.ts. Renderer source files remain intact.

## Earlier correction after user feedback

The user's 1536x781 screenshot exposed an unreachable prompt and misleading
manual interpretation. The adaptive preview now starts at a reachable top
origin and scrolls through its content. Its toolbar occupies a separate footer
region, so fields, actions and saved cards cannot pass underneath it.
Type-aware interpretation, request-scoped manual selection and explicit
example/custom/saved state replace the rejected behavior.

Final correction build: UTs1gsNgjyq5ecI-oBDVF. Type checking, lint, build,
copy and matching source/bundle checks passed. All 49 affected behavior and
portable-install tests passed. The final 16 browser tests passed in 3 minutes.
The actual workspace matrix covers 320, 390, 768, 1440 and 1536px in both
themes, with all appearances at 390 and 1536px. It checks prompt reachability
and that the entire scroll viewport ends above the toolbar at every state.
The breakfast request, every type switch, subsequent conversion, field edits,
switch-back retention, save/restore, clear, keyboard use and simulated
classifier cancellation passed. Classifier failures and controlled-value
changes were checked in React tests. Existing standalone cards, neutral focus,
reduced motion and doubled graph defaults also passed the regression run.

Changed files: components/ui/adaptive-input.tsx,
components/ui/adaptive/card-ui.tsx, components/ui/focus-timer-card.tsx,
components/library/adaptive-demos.tsx,
styles/adaptive-cards.css, styles/adaptive-demos.css,
lib/adaptive-components.ts, tests/adaptive-cards.test.tsx,
tests/adaptive-correction.spec.ts, tests/adaptive.spec.ts and
playwright.adaptive-correction.config.ts.

All fourteen final full-page captures were inspected and are valid. The fresh
reviewer scored all five reported fixes resolved with disposition: ship,
scoped to those fixes. The documenter completed the incumbent comparison;
DESIGN.md and its sidecar retain their baseline hashes. This correction is
complete locally. Evidence and receipts are under
.impeccable/review/adaptive-correction. The validation section below records
the original appearance correction separately. No commit or push was made.

Preview: http://127.0.0.1:3134/components/adaptive-input

```sh
npm run start -- --hostname 127.0.0.1 --port 3134
```

## Four public entries

| Component | Placement | Behavior |
| --- | --- | --- |
| ChecklistCard | Inputs & forms | Adds, edits, checks and removes list items. |
| FocusTimerCard | Content & layout | Runs a deadline-based countdown with start, pause and reset. |
| PollCard | Inputs & forms | Edits choices, selects votes and changes a previous selection. |
| AdaptiveInput | Experimental | Interprets bounded phrases as editable cards and preserves the raw request. |

All four have live demos, typed props, source ZIPs and registry entries in all
five appearances. Thumbnails stay static. No package dependency was added.
The combined experiment includes in-memory saved cards and an explicitly labeled
simulated async classifier. Randomize leads its inspector.

## Installation

Use the source download on any component page or its generated registry command:

```sh
npx shadcn@latest add "<library-origin>/r/adaptive-input.json?style=polished"
```

Replace adaptive-input with checklist-card, focus-timer-card or poll-card to
install a standalone card. The other eight renderer files ship only inside
the combined experiment.
Each ZIP includes Example.tsx, transitive components and CSS, typed support
files, dependency installation instructions and licenses. Keep the bundled
folder relationships intact and merge public/fonts into your public directory.
No project alias or Tailwind setup is needed. Both Vite and Next.js React 19
hosts are supported; callbacks belong inside a client component in Next.js.

```tsx
"use client";
import { AdaptiveInput } from "./components/ui/adaptive-input";
import type { AdaptiveIntent } from "./components/ui/adaptive/types";

export function Capture({ onSave }: { onSave: (value: AdaptiveIntent) => void }) {
  return <AdaptiveInput currency="INR" onSave={onSave} />;
}
```

Standalone cards accept typed value/defaultValue, onChange, editable, disabled,
showSubmit, appearance and className props. FocusTimerCard exposes onComplete.
PollCard exposes allowChangeVote and emits updated vote data through onSubmit.
The internal computed renderers show Use result when onSubmit is supplied
and block invalid data. They are not separate installation entries.
Calculation utilities live in components/ui/adaptive/math.ts. Full individual
prop descriptions are included in both the website API reference and ZIP README.

## Interpretation and ownership

The default parser is offline and recognizes deliberately bounded phrases. It
does not claim unrestricted language understanding. Users can correct details
or manually select another type. Typed custom renderers can replace any card.

An optional AdaptiveClassifier receives text, a reference Date and an AbortSignal.
Requests are debounced; stale, rejected or malformed responses cannot replace
the current interpretation. A custom result needs confidence of at least 0.8.
The application owns any service endpoint and credentials.

Raw prompt text stays unchanged when switching card types. Each type retains
its edited draft until the prompt changes. A manual type applies only to the
current request; changing the raw text resumes automatic detection, including
controlled value changes. Compatible text is parsed into that type's fields.
Incompatible fields start empty rather than treating event attendees as tasks
or inventing numbers. Plain comma-separated notes can be interpreted as lists.
Empty numeric draft fields use NaN; onSave blocks them until the data is valid.
initialIntent restores validated
saved data on mount; remount with a new key to restore another record. Validate
serialized records with isAdaptiveIntent. The demo's saved cards are in memory.
The demo's Load example selector distinguishes example text, Custom input and
Saved request. Relative dates in the live demo use the local date at mount.

Relative dates use the reference Date's local calendar. Friday and next Friday
both mean the next Friday strictly after today. Events keep missing times empty.
Reminders with a date but no time use an editable 09:00 default. Date and time
data remain local strings; the host owns time zones, calendars and notifications.

Timers never autoplay. They use wall-clock deadlines to avoid interval drift
and remove intervals and visibility listeners on unmount. Cards hand data to
callbacks; they do not create remote records. Clipboard actions show success or
failure. Bookmark actions accept HTTP and HTTPS only. Notes remain plain text.

## Implemented files

- components/ui/adaptive-input.tsx and the eleven components/ui/*-card.tsx files.
- components/ui/adaptive/: types, parser, calculations, samples, shared fields
  and typed rendering.
- styles/adaptive-cards.css and styles/adaptive-demos.css.
- components/library/adaptive-demos.tsx and lib/adaptive-components.ts.
- lib/components.ts, lib/component-categories.ts, component-demo.tsx and
  preview-card.tsx for catalogue, discovery, lazy demos and static thumbnails.
- lib/source-bundle.ts for installation docs with typed props.
- styles/creative-demos.css for wrapping long documentation URLs at 320px.
- tests/adaptive-parser.test.ts, adaptive-cards.test.tsx,
  adaptive-source.test.ts, adaptive.spec.ts and playwright.adaptive.config.ts.
- Existing inventory, bundle and source-trace checks include the collection.

## Original release validation (historical)

These receipts describe the earlier twelve-entry release, before the cleanup.
They are retained as history, not as the current inventory or a fresh rerun.

Final production build: u-qRa6VMgyZWN9eckl0gU.

- npm run typecheck, lint, build and check:copy passed. Lint had no warnings.
- The full serial regression suite passed 638 tests across 55 files. After the
  reviewer requested appearance bindings, all 44 affected parser, card and
  portable-source tests passed again.
- All 605 catalogue examples and 30 avatar utilities were extracted,
  typechecked at ES2020 and bundled. The new combined example also passes an
  independent Vite bundle without project aliases.
- Twelve final browser tests passed. The layout matrix covers all twelve routes
  at 320, 390, 768 and 1440px in both themes, with no horizontal page overflow or
  browser errors. All five appearances were checked in both themes at 390px.
- Browser interactions cover all intent examples, raw-text preservation,
  edited draft restoration, save/edit/remove, simulated classification,
  checklist controls, poll votes, timers, copy feedback and disabled editing.
  Keyboard focus uses neutral gray in both themes. Reduced motion settles the
  card transition. GitHub graph's doubled defaults were checked in the browser.
- Exact-build source traces and standalone bundle checks passed. Adaptive cards
  do not import shader or Markdown engines. Detector found no primary issues;
  seven advisories concern actual swatch data, numeric display sizes and radii.
- All twelve live source ZIPs and all twelve registry responses returned
  complete payloads with scoped styles and typed installation documentation.

Evidence is under .impeccable/review/adaptive-input. An initial ENOSPC run was
discarded and rerun after preserving four stale generated installation runs in
P:/Codex-generated/orangeui-install-cache. No source or artwork was deleted.

The fresh finish reviewer scored the appearance-frame, font and outer-panel
correction resolved, with disposition: ship. That verdict covers the listed
fixes. The documenter completed the incumbent design-system comparison and
confirmed that DESIGN.md and .impeccable/design.json remain byte-for-byte
unchanged. The local 8px poll-choice and remove-control radius remains advisory.
Receipts: .impeccable/review/adaptive-input/finish-review.md,
finish-verdict.md and documenter.md.
