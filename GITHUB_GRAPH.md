# GitHub graph implementation

Implemented locally on 6 November 2026. No commit or push was made.

## Current defaults

After the owner requested slightly calmer motion, animationSpeed defaults to
1.75 and ambientIntensity to 1.1. This reduces speed by 12.5% and intensity by
about 15% from the earlier doubled settings. Entrance timing is approximately
274ms. The component, demo and typed prop reference use the same defaults.

Current validation on 7 November 2026 uses production build
`tTDwGhyA2Zy_4zNgj-Gzm`. All 12 orb/media browser cases pass, including graph
defaults at 320, 390, 768, 1440 and 1536px in both themes. The 56-case focused
unit and portable-source run, typecheck, lint, copy check, build, and exact-build
bundle and source-trace checks pass. See `ORB_MEDIA_CORRECTIONS.md` for this
latest correction receipt. Earlier build IDs below are historical.

## Earlier doubled-default validation (historical)

Updated earlier on 7 November 2026: animationSpeed defaulted to 2 and ambientIntensity
defaults to 1.3, twice the previous 1 and 0.65. Intensity accepts values from
0 through 2. Speed now scales both entrance timing and ambient duration and
phase; at the default speed the entrance lasts 240ms. The live demo and typed
prop documentation use the same defaults.

The update passed the 638-test serial regression suite, type checking, lint,
copy check, build and exact-build source/bundle checks. The adaptive collection's
final browser suite verifies both new defaults and the faster ambient duration.
Historical production build: UTs1gsNgjyq5ecI-oBDVF. The final adaptive correction
regression reverified the doubled defaults on this build. The validation section below
records the original 6 November implementation separately.

Preview: http://127.0.0.1:3134/components/github-graph

```sh
npm run start -- --hostname 127.0.0.1 --port 3134
```

## Component and demo

`GitHubGraph` is available at `/components/github-graph`, in the Portfolio
category and all five library appearances. The preview starts with labeled,
deterministic sample data. Its inspector can load a public GitHub profile,
randomize the sample, choose one of the four reference palettes, adjust cell
geometry and months, and configure entrance and ambient motion.

The component preserves Sunday-first columns and seven weekday rows. It fills
missing dates, bounds history to twelve months, and contains narrow-screen
scrolling. Hover, keyboard focus and tap reveal a contribution tooltip.
Arrow keys, Home, End, Ctrl+Home, Ctrl+End and Escape support keyboard exploration.
Activation calls `onDayClick`. Decorative motion pauses offscreen and in hidden
tabs; reduced motion and an initially paused component remain fully visible.

Preloaded `data` bypasses networking. A typed `loadContributions` callback
receives the account and an AbortSignal. The default loader uses the public
github-contributions-api.jogruber.de service. Invalid accounts and malformed
responses have recoverable error states. Stale requests are aborted and ignored;
successful data is retained when the graph moves offscreen. No new npm package
was added.

## Implemented files

- `components/ui/github-graph.tsx`: public component, typed props, interactions,
  tooltip and resource lifecycle.
- `components/ui/github-graph-data.ts`: UTC calendar data, validation, palettes,
  loader and deterministic samples.
- `styles/github-graph.css`: scoped styling, focus and motion.
- `components/library/github-graph-demo.tsx` and
  `styles/github-graph-demo.css`: live demo, compact inspector and static thumbnail.
- `lib/github-graph-component.ts`: typed prop documentation, usage, keyboard
  instructions and attribution.
- `lib/components.ts`, `lib/component-categories.ts`,
  `components/library/component-demo.tsx` and `preview-card.tsx`: inventory,
  discovery, lazy loading and static-thumbnail integration.
- `lib/source-bundle.ts` and `THIRD_PARTY_NOTICES.md`: portable source and full
  Unlumen UI MIT notice, Copyright (c) 2026 Léo Wicki.
- `tests/github-graph.test.tsx`, `github-graph-source.test.ts`,
  `github-graph.spec.ts` and `playwright.github-graph.config.ts`: data, lifecycle,
  keyboard, source distribution and browser checks.
- Existing category, inventory, bundle and trace checks include the graph.

## Installation

Use Download source from the demo, or its generated shadcn-compatible command:

```sh
npx shadcn@latest add "<library-origin>/r/github-graph.json?style=polished"
```

The ZIP includes `Example.tsx`, support modules, styles, dependency installation
instructions and licenses. Keep the bundled folder relationships intact.
No project alias or Tailwind setup is required. The component supports a React
19 TypeScript host using the library's ES2020 target. Keep
`THIRD_PARTY_NOTICES.md` with redistributed source.

```tsx
import { GitHubGraph } from "./components/ui/github-graph";
import { GITHUB_GRAPH_SAMPLE } from "./components/ui/github-graph-data";

<GitHubGraph account="sample-dev" data={GITHUB_GRAPH_SAMPLE} months={6} autoFit />
```

Full prop and keyboard documentation is available in the live API reference.
For application-owned loading, provide `data` or a custom loader. An unavailable
public service shows a retry state.

## Validation

Verified production build: `xJERy_vb98jTgoPBo4Cdg`.

- `npm run typecheck`, `npm run lint`, `npm run build` and `npm run check:copy`
  passed. Lint finished without warnings.
- Eighteen graph, discovery, source and preview-policy tests passed.
- The full serial regression run passed 589 tests and found one portable export
  failure involving newer JavaScript APIs. Those APIs were replaced and the
  failed installation batch passed on rerun. That batch extracts, typechecks
  and bundles the graph and three neighboring components in all five appearances.
- Eleven browser tests passed on the final production build. The layout matrix
  covers 320, 390, 768 and 1440px in light and dark themes, without page horizontal
  overflow or browser errors. Interaction checks cover keyboard focus and
  navigation, tooltips, selection, twelve-month internal scrolling, profile
  loading/error/retry, profile draft isolation, pause, offscreen motion and
  reduced motion.
- Real public `octocat` loading succeeded in Chromium. The graph rendered 185
  days. Its production ZIP returned 19 files, its registry returned 16 files,
  and both retained the graph styles, data and license. No browser errors occurred.
- Exact-build bundle and source-trace checks passed. Graph source and styling
  are included in both production installation routes. Standalone graph
  JavaScript measured 52,796 gzip bytes including Framer Motion and support
  modules, excluding host React and React DOM.
- One detector pass returned no findings. Desktop/mobile screenshots were
  inspected in two bounded batches.
- The independent review requested one correction: keep both new keyboard
  focus styles neutral. Grid cells and the username input now use `--focus`.
  Computed styles confirm `#525252` in light and `#d4d4d4` in dark, with 2px
  outlines that stay unchanged across all four graph palettes. The same layout
  matrix was recaptured after this correction.
- Reviewer verdict: `ship`, scoring the neutral-focus finding resolved. The
  verdict covers that correction. The documenter returned `preserve` and
  `complete`; DESIGN.md and .impeccable/design.json remain hash-identical to
  their pre-handoff contents.

Evidence is under the ignored `.impeccable/review/github-graph/` directory.
Independent review and incumbent-system comparison are recorded there.
Physical-device testing was not performed.

## Adaptive input reference

The linked Shapeshift example at
https://x.com/anishfn/status/2102327334485557422 is feasible as a separate reusable
component. Its input chooses prepared event, checklist, timer, color, calculation
and other cards. Its source uses an offline classifier by default and optionally
uses Jev for intent classification; ordinary code computes dates and numbers.

A suitable library API would expose typed intents, configurable card renderers,
an offline parser, and an optional async classifier with cancellation. It can
work without an API key, while a host application supplies AI classification
through its own server route. This reference was assessed, not implemented in
this graph task.

The separate twelve-component release was implemented on 7 November 2026.
See ADAPTIVE_INPUT.md for its demos, typed APIs, installation and validation.
