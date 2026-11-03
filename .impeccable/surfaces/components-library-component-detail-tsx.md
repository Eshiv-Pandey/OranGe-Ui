---
version: 1
slug: "components-library-component-detail-tsx"
primary_target: "components/library/component-detail.tsx"
related_targets: ["styles/library-workspace.css", "components/library/palette-shelf.tsx", "styles/palette-shelf.css", "components/library/creative-demos.tsx", "components/ui/season-tree.tsx", "components/ui/season-tree-art.ts", "styles/season-tree.css", "styles/creative-players.css", "components/ui/frosted-glass.tsx", "styles/frosted-glass.css", "styles/creative-demos.css", "components/ui/nature-palettes.ts", "components/ui/shader-canvas/clouds-field.ts", "components/ui/shader-canvas/clouds.ts", "components/ui/shader-canvas/grass.ts", "components/ui/shader-canvas/grass-renderer.ts", "lib/components.ts", "next.config.ts"]
---

# Component playground and editor

Mode: Operate. Scope: component detail routes and shared settings.

## Direction contract

THESIS: Give the live component the whole stage, with a floating view dock and a legible editor beside it.

OWN-WORLD: Preserve the library's neutral light/dark palette, orange accent, pixel logo and component appearances. Give the inspector crisp field boundaries, numeric editing, useful section labels and consistent focus states. Glass belongs to the requested floating dock and components whose own material is glass.

STORY: Open at the preview, customize beside it, switch to usage or source, then install or read the API.

FIRST VIEWPORT: Left navigation, full-height central preview and independent right inspector. A compact translucent dock floats above the stage's bottom edge. On mobile the preview remains above the controls and the dock fits in one row.

FORM: An extension of the existing library, with the owner-approved glass navigation reference and independent editor redesign. No direction seed applies to this scoped surface.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Implemented extension

The approved extension keeps the workspace geometry and shared brand. The floating dock has a shorter frame (44px minimum, 4px padding), compact tabs (34px minimum), and a translucent surface with blur and saturation (24px, 1.55). It remains one row on mobile and reserves the same preview story: Preview, Usage, Source, documentation.

Color studies use one shared palette shelf across AnimeFire, GrainGradient, FlowingGrass and DriftingClouds. Named strips sit in a two-column grid; the selected strip has an accent outline and pressed state. Individual colors remain editable. A named custom study can be saved, recalled or removed on this device, with up to six saved studies per editor. These palettes color the component artwork and do not redefine the workspace theme.

GrainGradient is the single public gradient catalogue editor. Its common controls appear first and additional shaping controls sit in a disclosure. The former ShaderCanvas catalogue route redirects here, while ShaderCanvas remains available for installation and composition.

## Component materials

- SeasonTree keeps a transparent canvas around an asymmetrical canopy. The polished tree has warm foliage, a continuously curved tapered trunk, irregular bark marks and separately falling leaves. Seasons share the branching structure; the seasonal picker and the existing motion controls remain available. Its canopy and bark colors are artwork choices, not global tokens.
- FlowingGrass presents a fine, sunlit meadow with sparse flowers among rooted blades. Color studies, flower amount and sunlight work alongside the existing wind and interaction controls. Preserve the anchored roots and irregular distribution.
- DriftingClouds presents shaded cloud volume, sunlit edges and atmospheric depth. The implementation adapts the supplied Shader Sky reference using a bounded march and a coarse light probe. Keep its attribution in THIRD_PARTY_NOTICES.md. The cloud colors and render budget belong to this effect.
- IslandPlayer keeps a compact dark body with a pale play control and a clear track hierarchy. GlassPlayer uses a tinted pane over its cover image, with an opaque enough control area for readable metadata. NeonPillPlayer retains the compact circular cover trigger and its expansion into track controls, with the glow confined to the player. These are component materials, not editor surfaces.
- FrostedGlass places its actions beside the tall pane when space permits. Its own inline-size container stacks those actions below the pane at 540px and below, so the installed component retains the behavior outside the library. The playground provides a local background image picker alongside garden, gradient and flow choices. The image stays in the browser; removing it restores the garden. Clear, reset, sound and keyboard drawing remain component controls.
- AnimeFire retains its restored animation and gains the shared palette shelf without changing its material contract.

## Component feedback refinement, 4 November 2026

- All previews use the full workspace stage. BloomTrail, DraggableCards, BubbleWrap, PhotoGarland and LiquidMetal fill its width and height. Remove inherited sticky offsets on mobile, fit character grids within their columns and keep component actions above the view dock.
- Emberling has original Fire, Water and Aqua bodies with continuous contour animation, six expressions and pointer gaze. Its optional fluid orb maps a moving WebGL pigment wash onto a sphere behind the same expressive face. Both forms retain reduced-motion behavior and static presentation.
- HumanAvatar follows the supplied head-only sticker reference with bold ink, cutout eyes, varied hair and small color accents. The randomize action is visible beside the portrait and updates the editable seed and settings.
- BubbleWrap uses clear film edges and flattened creases, with gesture-gated pop audio enabled by default. PhotoGarland keeps a transparent background, sagging wires and precisely attached clips. Their material colors are intentional artwork colors outside shared editor tokens.
- FloatingDock magnification enlarges layout slots with damped springs, preserving separation. LiquidMetal uses a continuous folded surface with reflected studio light. Player meters sample meaningful audible bands and settle on pause, buffering or mute.

## Scope boundaries

This extension ships no new raster assets. Canvas artwork, generated shader texture data and user-selected local photos do not create a new repository raster asset. Preserve existing raster provenance. The landing composition, all five component appearances, neutral theme tokens and typography remain incumbent decisions. Review advisories and one-off decorative colors do not become shared design tokens.
