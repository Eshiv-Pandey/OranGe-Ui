---
version: 1
slug: "components-library-block-collection-tsx"
primary_target: "components/library/block-collection.tsx"
related_targets: ["components/library/block-catalogue.tsx","components/library/block-section-nav.tsx","app/blocks/category/[category]/page.tsx","styles/block-collection.css","components/ui/blocks/auth.tsx","components/ui/blocks/auth-variants.tsx","styles/auth-blocks.css"]
---

# Category block collections

Scope: a local extension of the existing Blocks discovery surface at `/blocks/category/<slug>`. Visitor modes: Read for category orientation and source inspection; Experience for browsing working previews at useful scale. Preview controls support those tasks without changing the shared visual world.

## Direction contract

THESIS: start with a section, compare its original live examples, and bring complete source into a project. The current collection has 37 blocks in 28 categories. Auth has five layouts; the remaining categories do not claim equivalent variant counts.

OWN-WORLD: inherit `DESIGN.md`, Geist interface type, the orange pixel identity, semantic orange shell actions, paired neutral host palettes, readable boundaries and existing control APIs. Auth artwork palettes and the retained recovery/footer scenes remain scoped component materials. No new design canon, global palette, type ramp or appearance rule is established by this surface.

STORY: choose a category in the catalogue or library navigation, follow an example anchor, try its form or interaction, change its width or host palette, then inspect Code or follow Documentation for typed props. Copy the complete source or install command, with a labelled manual-copy fallback when clipboard access fails. Provider and passkey actions remain application-owned callbacks; demonstrations do not authenticate or persist data.

FIRST VIEWPORT: retain the existing library frame around a direct category heading, short explanation and truthful example count. Show the first example's title, description, Documentation link, Preview/Code switch, source actions and width/palette controls beside a real preview. Category navigation exposes the examples without presenting every block as an unrelated component.

FORM: ordinary established-library extension; code-led. Each entry owns its Preview/Code, width, palette and source-selection state. Switching views preserves the mounted preview, and width/palette changes preserve its form and interaction state. Explicit Reset starts that entry again. Source loads on demand with a recoverable error, Retry source and ZIP download. Narrow layouts retain reachable controls, coherent reading order and contained source scrolling.

FINISH: record current build, route, interaction, source, accessibility and bounded visual results separately from the passed 30-block baseline. The extension does not refresh `DESIGN.md` or `.impeccable/design.json`. Pre-existing drift and defects are reported without becoming rules for future surfaces.
