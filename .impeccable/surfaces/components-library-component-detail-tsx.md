---
version: 1
slug: "components-library-component-detail-tsx"
primary_target: "components/library/component-detail.tsx"
related_targets: ["styles/library-workspace.css", "components/library/palette-shelf.tsx", "styles/palette-shelf.css", "components/library/creative-demos.tsx", "components/library/reference-demos.tsx", "components/library/liquid-metal-demo.tsx", "components/ui/season-tree.tsx", "components/ui/season-tree-art.ts", "styles/season-tree.css", "styles/creative-players.css", "components/ui/frosted-glass.tsx", "styles/frosted-glass.css", "styles/creative-demos.css", "components/ui/nature-palettes.ts", "components/ui/shader-canvas/clouds-field.ts", "components/ui/shader-canvas/clouds.ts", "components/ui/shader-canvas/grass.ts", "components/ui/shader-canvas/grass-renderer.ts", "components/ui/emberling.tsx", "components/ui/elemental-shape.ts", "components/ui/bubble-wrap.tsx", "components/ui/photo-garland.tsx", "components/ui/journal-stack.tsx", "styles/keepsake-galleries.css", "components/ui/floating-dock.tsx", "styles/interaction-controls.css", "components/ui/liquid-metal.tsx", "components/ui/shader-canvas/liquid-metal.ts", "components/ui/audio-orb.tsx", "components/ui/shader-canvas/audio-orb.ts", "components/ui/vinyl-player.tsx", "components/ui/wave-player.tsx", "styles/reference-players.css", "components/ui/calendar.tsx", "components/ui/alert.tsx", "styles/library-components.css", "lib/theme.ts", "styles/tokens.css", "public/photos/keepsakes/NOTICE.md", "lib/components.ts", "lib/creative-components.ts", "next.config.ts"]
---

# Component playground and editor

Mode: Operate. Scope: component detail routes and shared settings.

## Direction contract

THESIS: Give the live component the whole stage, with a floating view dock and a legible editor beside it.

OWN-WORLD: Preserve the library's neutral light/dark palette, orange accent, pixel logo, typography and component appearances. Give the inspector crisp field boundaries, numeric editing, useful section labels and neutral focus states. Glass belongs to the requested floating view dock and components whose own material is glass. Each component keeps its own artwork and material within this neutral branded library.

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
- Emberling has original Fire, Water and Aqua characters with stronger continuous head-contour animation, six expressions and pointer gaze. The bodies remain planted. Its optional fluid orb maps a moving WebGL pigment wash onto a sphere behind the same expressive face. Both forms retain reduced-motion behavior and static presentation.
- HumanAvatar follows the supplied head-only sticker reference with bold ink, cutout eyes, varied hair and small color accents. The randomize action is visible beside the portrait and updates the editable seed and settings.
- BubbleWrap uses clear film edges and flattened creases, with gesture-gated pop audio enabled by default. Its component defaults are 16 rows by 18 columns; optional fit packing adapts rows to the stage and starts enabled in the full-height demo.
- PhotoGarland keeps a transparent background, sagging wires and attached clips across separated responsive rows. It accepts up to 18 photos, with three to six columns according to available width. JournalStack presents real two-page spreads, a central spine, layered paper edges and fan navigation through clicks, swipes and keyboard controls. Both use twelve local licensed photo samples. Their paper, wire and photo colors belong to the artwork.
- FloatingDock uses monochrome icon-only shortcuts with hover/focus labels. Magnification enlarges layout slots with damped springs, preserving separation. It remains a separate component from the glass view dock.
- LiquidMetal is a ray-marched, fusing mercury sculpture with studio reflections and smooth contours. Aspect-aware framing keeps its form composed in compact stages. The existing finish, tint, speed, ribbons, twist, roughness, sheen, pointer and pause API remains compatible; the demo labels ribbons and twist as droplets and fusion. The render budget is 240,000 pixels at 24 frames per second.
- AudioOrb, VinylPlayer and WavePlayer are new catalogue components. The standalone orb has soft continuously moving sphere pigments with audio energy from `getAnalyser` or `audioLevel`. It pauses offscreen and in hidden tabs, respects reduced motion and retains a fallback. The orb demo and both player demos use the real shared audio engine; the players use local photo covers. VinylPlayer keeps metadata and transport space in small containers, while WavePlayer preserves its wavy progress line beside smaller mobile icons.
- Player meters sample audible bands and settle on pause, buffering or mute. IslandPlayer and NeonPillPlayer keep pale metadata and controls on their dark bodies in light workspaces as well as dark ones.
- Alerts use outlined SVG symbols and a quiet polished border. Sheets separate field groups from a divided footer with more working space. Calendar provides native month and year selectors with descriptive labels, preserving date-grid navigation and accent selection. Shared focus is neutral in light and dark palettes, independent of accent text and button roles.

## Review state

Independent confirmation returned **ship** for five reviewed fixes: complete mobile Vinyl titles, full-width mobile Wave waveform, framed mobile LiquidMetal, matching Journal accessible labels and smooth metal contours. All five are resolved with no remaining scored fixes. This verdict is limited to those fixes; the intended component materials remain intact.

## Scope boundaries

The extension includes twelve local Unsplash sample photographs, with source and license metadata embedded in every JPEG and a matching `public/photos/keepsakes/NOTICE.md`. Six JPEGs are new: city, coast, desert, flowers, night and ocean. The six existing samples also retain embedded provenance. User-selected photos stay on the current device.

The landing composition, all five component appearances, typography and other shared tokens remain incumbent decisions. The approved shared change is neutral focus (light #525252, dark #d4d4d4), synchronized with `lib/theme.ts` and `styles/tokens.css`. Component material colors and one-off effect budgets do not become shared design tokens.
