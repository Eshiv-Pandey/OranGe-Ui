# Adaptive collection shipping scope

Updated on 7 November 2026 after the owner questioned the usefulness of the
larger collection and approved a smaller scope. This supersedes the original
twelve-entry release recommendation and twenty-component roadmap.

## Public entries

| Component | Placement | What it does |
| --- | --- | --- |
| ChecklistCard | Inputs & forms | Adds, edits, checks and removes task items. |
| FocusTimerCard | Content & layout | Runs a countdown with start, pause, reset and completion callbacks. |
| PollCard | Inputs & forms | Presents editable choices, votes and optional vote changes. |
| AdaptiveInput | Experimental | Interprets bounded phrases as editable cards, with optional host classification. |

The three task cards offer useful standalone interactions. The combined input
is experimental because its bounded parser requires users to check the result.
The catalogue counts 112 regular components and one experiment as 113 entries.
All includes both, with an explicit Experimental filter and navigation group.

## Supporting examples

EventCard, ReminderCard, BookmarkCard, NoteCard and ColorCard are example recipes
inside AdaptiveInput. BillSplitCard, UnitConverterCard and CalculatorCard are
internal supporting examples. All eight retain their source, typed data,
behavioral tests and transitive installation support. They have no standalone
catalogue listings, detail routes, downloads or registry items.

AdaptiveInput still offers all eleven kinds in Load example and through typed
renderers. That demo explores the interaction without presenting every renderer
as a separate product offering.

## Acceptance requirements

- Keep source installation and registry entries for the four public components
  in all five appearances.
- Keep the eight supporting renderers in the combined input ZIP and registry.
- Preserve offline parsing, optional typed classification, raw text, edited
  drafts, saved restoration and request-scoped manual selection.
- Keep responsive previews, keyboard access, neutral focus and reduced motion.
- Remove demoted entries consistently from search, sidebar, catalogue and
  standalone installation routes. Retired URLs return 404.
- Preserve the existing visual system and unrelated working-tree changes.

There is no active commitment to ship eight additional cards. Reconsider new
entries only when there is a concrete use case and a useful standalone API.
ADAPTIVE_INPUT.md records installation, behavior and validation.

Original interaction reference: https://x.com/anishfn/status/2102327334485557422
