---
name: "oRangeUi"
description: "A pixel identity, expressive component artwork, and a precise neutral workspace."
colors:
  primary: "#ff6a00"
  primary-hover: "#ff821f"
  primary-text-light: "#a64500"
  primary-text-dark: "#ff6a00"
  on-primary: "#171717"
  cream-light: "#fafafa"
  surface-light: "#ffffff"
  surface-soft-light: "#f2f2f2"
  ink-light: "#171717"
  muted-light: "#666666"
  line-light: "#1717172b"
  cream-dark: "#000000"
  surface-dark: "#0a0a0a"
  surface-soft-dark: "#171717"
  ink-dark: "#ededed"
  muted-dark: "#a3a3a3"
  line-dark: "#ededed33"
  focus-light: "#525252"
  focus-dark: "#d4d4d4"
  error-light: "#b32c2c"
  error-dark: "#ffa6a0"
  accent-lime-light: "#d1ed89"
  accent-lime-dark: "#b9d674"
  accent-mint-light: "#a7dfbd"
  accent-mint-dark: "#8fcca5"
  accent-amber-light: "#f8cc79"
  accent-amber-dark: "#e5b963"
  accent-sky-light: "#a9d4ef"
  accent-sky-dark: "#8cbddd"
  accent-coral-light: "#f1b1a3"
  accent-coral-dark: "#dfa091"
  reference-white: "#f4f4f7"
  reference-soft: "#cbd0da"
  reference-rule: "rgb(236 238 247 / .19)"
  reference-ground: "#101a1f"
  reference-sky: "#36536d"
  reference-logo: "#ff8337"
  reference-logo-leaf: "#bed184"
  reference-nav-glass: "rgb(189 210 226 / .045)"
  reference-action-glass: "rgb(218 228 238 / .15)"
typography:
  display:
    fontFamily: "var(--font-body), sans-serif"
    fontSize: "clamp(52px, 4.6vw, 76px)"
    fontWeight: 300
    lineHeight: 1.04
    letterSpacing: "-.04em"
  title:
    fontFamily: "var(--font-body), Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-.035em"
  inspector-title:
    fontFamily: "var(--font-body), sans-serif"
    fontSize: "16px"
    fontWeight: 600
    letterSpacing: "-.025em"
  body:
    fontFamily: "var(--font-body), Arial, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  body-compact:
    fontFamily: "var(--font-body), Arial, sans-serif"
    fontSize: "14px"
    lineHeight: 1.5
  label:
    fontFamily: "var(--font-body), sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.5
  button:
    fontFamily: "var(--font-body), Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 650
    lineHeight: 1.4
  badge:
    fontFamily: "var(--font-body), Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.5
  pixel-display:
    fontFamily: "var(--font-display), monospace"
    fontWeight: 600
    lineHeight: 1.05
  terminal:
    fontFamily: "var(--font-mono)"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "-.015em"
  portfolio-body:
    fontFamily: "oRange Geist, sans-serif"
    fontSize: "16px"
    lineHeight: 1.5
  portfolio-clock:
    fontFamily: "Doto, monospace"
    fontSize: "20px"
    fontWeight: 700
    letterSpacing: ".15em"
  portfolio-clock-wide:
    fontFamily: "Doto, monospace"
    fontSize: "24px"
    fontWeight: 700
    letterSpacing: ".15em"
  portfolio-handle:
    fontFamily: "Portfolio Geist Mono, monospace"
    fontSize: "11.5px"
    lineHeight: 1
  portfolio-pixel:
    fontFamily: "oRange Pixel, monospace"
  portfolio-devanagari:
    fontFamily: "Portfolio Devanagari, sans-serif"
rounded:
  square: "0px"
  small: "8px"
  control: "14px"
  component-panel: "22px"
  panel: "28px"
  workspace: "16px"
  editor-number: "7px"
  neobrutalism: "6px"
  badge: "20px"
  pill: "999px"
spacing:
  space-1: "8px"
  space-2: "16px"
  space-3: "24px"
  space-4: "32px"
  space-5: "40px"
  space-6: "48px"
  space-8: "64px"
  space-10: "80px"
  space-12: "96px"
  workspace-gap: "12px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 22px"
  button-secondary:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-light}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 22px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    typography: "{typography.button}"
    rounded: "{rounded.control}"
    padding: "12px 22px"
  input:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-light}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "12px 15px"
  badge:
    backgroundColor: "{colors.surface-soft-light}"
    textColor: "{colors.ink-light}"
    typography: "{typography.badge}"
    rounded: "{rounded.badge}"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-light}"
    typography: "{typography.body-compact}"
    rounded: "{rounded.component-panel}"
    padding: "26px"
  editor-number:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-light}"
    typography: "{typography.label}"
    rounded: "{rounded.editor-number}"
    padding: "6px 7px"
    width: "76px"
  editor-color:
    backgroundColor: "{colors.surface-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.small}"
    padding: "4px 6px 4px 4px"
  palette-swatch:
    backgroundColor: "transparent"
    textColor: "{colors.muted-light}"
    padding: "0px"
  palette-swatch-selected:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    padding: "0px"
  playground-dock:
    backgroundColor: "color-mix(in srgb, var(--surface) 48%, transparent)"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.pill}"
    padding: "4px"
  playground-tab-selected:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.surface-light}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "7px 14px"
  landing-navigation:
    backgroundColor: "{colors.reference-nav-glass}"
    textColor: "#f1f2f7"
    rounded: "{rounded.pill}"
    padding: "8px 24px"
    width: "474px"
  landing-action:
    backgroundColor: "{colors.reference-action-glass}"
    textColor: "#f9fafc"
    rounded: "{rounded.pill}"
    padding: "11px 23px"
---

# Design System: oRangeUi

## Overview

**Creative North Star: "A pixel soul. A polished finish."**

oRangeUi pairs expressive component artwork with a precise, neutral workspace. The orange pixel character, Geist interface type, restrained borders and clearly differentiated component appearances form the shared identity. The working example gets visual priority; navigation and editing controls remain legible around it.

The landing is a scoped expression of that identity: the owner's forest painting, a photographed orange with a photographic citrus leaf replacing its red sun, layered clouds, rooted trees and original painted birds with slow wingbeats in place. Quiet white lettering and the retained glass navigation sit over the artwork. Its warm sky and dark forest remain scene materials; the component library keeps its established light and dark workspace palettes, and pricing retains its existing scenic interface treatment.

Component appearances are independent of palette. Polished, Pixelated, Neobrutalism, Retro OS and Terminal retain their own geometry, typography and depth. The landing and playground composition contracts live in their respective .impeccable/surfaces briefs.

**Key Characteristics:**

- Orange pixel branding alongside readable interface typography.
- Neutral light and dark workspaces with a separate appearance choice.
- Reference-led component artwork, with localized tree and cloud motion and anchored bird wingbeats in the forest landing.
- Visible field boundaries, exact editable values and a persistent live preview.
- Distinct depth and shape language for all five component appearances.

## Colors

The shared palette places warm orange against near-neutral paper, charcoal and black. The frontmatter records the baseline CSS values from `styles/tokens.css`; component token entries show the default polished light treatment. At runtime, semantic CSS variables select the active palette, while `lib/theme.ts` derives hover, accent text and on-accent foreground values and keeps focus neutral in each palette. Preserve those live bindings in new components.

### Primary

- **Orange:** primary actions, active controls, slider progress and brand detail. The hover and readable text roles have separate tokens.
- **Landscape orange:** the landing logo has its own warmer orange and light green leaf, scoped to the reference navigation.

### Secondary

- **Lime, mint, amber, sky and coral:** the existing soft illustration and state accents. Their light and dark token pairs stay together. Mint, amber and coral also distinguish success, warning and danger badges.
- **Error:** semantic feedback with separate light and dark baseline values. Error treatment includes text and field structure rather than color alone.

### Neutral

- **Cream, surface and soft surface:** page, panel and inset layers in each palette. The historical `cream` token is neutral paper in light mode and black in dark mode.
- **Ink, muted and line:** primary content, secondary content and visible boundaries. Keep each palette's values paired.
- **Focus:** a neutral keyboard outline in each palette, independent of the selected accent. Components with their own material may inherit their readable foreground for focus.
- **Reference white, soft, rule, ground and sky:** scoped reference text, boundary and backdrop roles. The current landing has no divider; the retained token values remain unchanged. Its glass colors retain the source CSS alpha values rather than becoming opaque surface colors.

The portfolio exports preserve the source palette in `styles/portfolio-tokens.css`, under their own `--portfolio-*` variables. Marigold, indigo, teal, rose, maroon and cream keep their source light and dark pairs. The footer retains its terracotta frame, printed card, ink, rules and monument colors. Its light-mode muted copy has a component-only accessibility override (`--portfolio-fx-muted: #5b3e35`) for readable small links and contact text over the animated card. The source token file remains unchanged. These are component artwork materials and a scoped readability correction; they do not replace or extend the shared workspace palette.

**The Appearance and Palette Rule.** Choose component appearance separately from light or dark palette; preserve both controls and their independent effects.

**The Accent Contrast Rule.** Use the live semantic accent variables for text and button foregrounds. The theme utility derives readable values when the accent changes.

**The Neutral Focus Rule.** Keep shared keyboard focus neutral in light and dark palettes; changing the accent must preserve the focus role.

## Typography

Geist is the shared interface family. The app serves it through `next/font` and `--font-body`; downloadable library CSS also supplies the local `oRange Geist` face. Pixelify Sans uses `--font-display` with the local `oRange Pixel` alias in library CSS. The terminal stack is Cascadia Code, SFMono-Regular, Consolas, Liberation Mono and monospace. Retro OS uses Arial and Helvetica.

The `portfolio-*` typography entries are source-specific roles and aliases. Portfolio components use the existing `oRange Geist` body and `oRange Pixel` Pixelify Sans face, Doto for the clock, and `Portfolio Geist Mono` for profile handles. The source's Noto Sans Devanagari asset is served as `Portfolio Devanagari` through `--portfolio-font-devanagari`; it is retained for supplied Devanagari content without inventing another shared type scale. `styles/portfolio-fonts.css` records the exact self-hosted aliases. Font-detector warnings for these required source faces are intentional component use, not a new generic workspace family.

| Role | Application |
| --- | --- |
| Display | Light, closely spaced landscape headline. Its fluid size is specific to that surface. |
| Title | Component card titles and comparable compact headings. |
| Inspector title | Clear component identity above customization controls. |
| Body / compact body | Page prose and denser library components. |
| Label / button / badge | Field labels, action labels and passive status markers. |
| Pixel display | Established pixel branding and the Pixelated appearance. |
| Terminal | Monospaced controls in the Terminal appearance. |

The system uses role-specific sizes rather than one universal type ratio. Long descriptions remain in the body family; code and editable hex values use monospace. Landscape mobile sizing is scoped in `styles/reference-landing.css`.

**The Readable Controls Rule.** Keep editor labels, values and documentation readable at working density. Pixel typography belongs to the pixel appearance, established brand treatments and source-specific authored components that require it.

## Layout

The shared spacing scale advances in eight-pixel steps, with a smaller workspace gap for dense adjacent panels. Use the frontmatter spacing tokens for recurring rhythm, and preserve component-specific field padding.

The component workspace uses a fixed navigation rail (240px, or 64px collapsed), a flexible preview stage and a right inspector (344px). At desktop widths up to 1200px the inspector narrows (300px). The stage and inspector use separate bounded surfaces with a shared gap; desktop workspace height follows the viewport (`calc(100dvh - 24px)`, minimum 520px). Controls, artwork and code reserve bottom space for the floating dock.

The inspector pairs related controls in two columns while full-width groups and disclosures retain their space. Artwork Randomize and Reset actions appear before the option tabs. Canvas settings follow the actual component controls in a disclosure. Color labels sit above the swatch and editable hex value, keeping even Metal tint clear in a narrow column. The install command is one visually truncated line; copy and the accessible text retain the complete command. These are scoped workspace layout refinements, with the shared color, typography and elevation tokens unchanged.

At widths up to 800px, the stage sits above the inspector and the navigation moves to its mobile controls. The stage has a minimum height (340px), the workbench follows the compact viewport, and the inspector body remains bounded (maximum 420px). Keep all three dock labels and the documentation link in one row.

FrostedGlass owns the container that reflows its optional side actions below the pane. This layout travels with the installed component and responds to the space available inside an embed, independently of the library workspace.

The landscape follows the owner's forest painting with a proportional cover crop that keeps tree crowns visible on wide screens. CSS and WebGL share the same source crop, while portrait views retain the full image height. A real photographed orange with its photographic citrus leaf occupies the former red sun's position, with the original birds in front at fixed body positions. Top-center navigation and the lower-left orange UI title keep the exact tagline "Components with a little more warmth." At widths up to 700px, the heading and tagline retain their stack below the focal image area. The landing has no separate Get Started action, divider, bottom copy, footer or visible pause control. Preserve the retained responsive geometry without imposing its composition on library pages. See [the landing surface brief](.impeccable/surfaces/app-page-tsx.md) and [the playground surface brief](.impeccable/surfaces/components-library-component-detail-tsx.md).

PortfolioBanner is absolute within a positioned parent that reserves the same height. The source component default is 22vh; the homepage composition at `/portfolio` uses 26vh. PortfolioFooter follows its host width, with explicit host inset configuration for optional full bleed. Container queries provide two link columns by default, three at a footer width of 680px, and a fourth contact column at 1240px. Below 1240px, Connect With Me spans the row with centered contact content and wrapped social stickers. Tiles are 44px on phones and 48px from 640px. The monument band keeps a minimum height (64px) so the mobile truck fits its scene.

Portfolio demos preserve full scene widths and authored heights inside the artwork preview, with scrolling available when the scene exceeds the stage. Their scoped workspace styles remove inherited mobile automatic widths and maximum-height caps. These relationships belong to the portfolio exports and their composition; the rest of the library shell keeps its established layout.

**The Preview First Rule.** Keep the preview visible while editing, reserve space for its dock, and give the inspector its own scroll region when the layout is side by side.

## Elevation & Depth

Depth is material-specific. Polished controls and standard cards use subtle ambient shadows. Pixelated and Neobrutalism use solid offset shadows. Retro OS uses opposing light and dark bevels. Terminal uses fine lines and flat surfaces. The workspace stage and inspector rely on tone and borders rather than ornamental shadow.

The landscape's painted image carries its depth. A feathered shade stays local to the tagline, supporting its existing color, typography and position while leaving the exposed forest intact. Its navigation and the related pricing surface's action use a restrained blur (16px); the playground dock uses a stronger blur with saturation (24px, 1.55). GlassPlayer and FrostedGlass retain their own translucent component materials. The sidecar records the exact shadow and motion vocabulary, which the frontmatter schema cannot represent.

Transitions provide brief state feedback. Pixelated and Retro OS/Terminal retain their stepped timing where authored. Reduced-motion rules remove decorative CSS animation and transitions, and canvas components retain their static presentation. Forest landing movement remains localized to clouds, tree crowns and the original birds' outer wings. The photographed orange and leaf remain protected, rooted trunks stay anchored, and each bird retains its center and fixed body strip. Reduced motion restores the birds' original wing pose.

**The Scoped Glass Rule.** Use glass on the landscape navigation and action, the playground dock, and components whose own material is glass. Keep the inspector's field boundaries and neutral surfaces intact.

## Shapes

| Appearance or pattern | Form language |
| --- | --- |
| Polished | Rounded controls, smaller internal corners and softly rounded component panels. The shared Card panel radius differs from the broader panel token. |
| Pixelated | Square controls, crisp pixel edges, hard outlines and offset shadows. |
| Neobrutalism | Tight corners, heavier outlines and physical offset depth. |
| Retro OS | Square window geometry with raised or inset bevels. |
| Terminal | Square, precise rules and monospaced density. |
| Workspace | Moderately rounded stage and inspector, compact field corners and a pill dock. |
| Landscape controls | Thin outlined pills above the photograph; the logo keeps its original stepped silhouette. |

The canonical primitive radii are in the frontmatter. Appearance-specific tokens in `styles/library-base.css` and `styles/appearances.css` continue to govern subcomponents.

**The Distinct Appearance Rule.** Preserve each appearance's complete combination of corners, borders, type and depth; a radius change alone does not express the existing system.

## Components

### Buttons

Primary, secondary and ghost remain separate variants. Primary uses the accent and its readable foreground; secondary uses a bordered surface; ghost stays quiet. Polished buttons lift slightly on hover and press downward when active. Disabled and loading states suppress ordinary activation feedback. Appearance variants retain their own border, type, shadow and press behavior.

### Fields and editor controls

Text fields keep a visible frame, label, focus ring and space for help or error text. The editor uses compact boundaries and tabular numeric values. A range pairs a native slider with an editable number; color controls pair the native picker with an editable hex field. Selection controls use pointer cues, text fields use text cues and ranges use horizontal adjustment cues. Preserve the disabled treatment.

The inspector groups controls under clear section labels, keeps Customize separate from API reference, and leaves installation actions at the bottom. Its neutral panels do not borrow the landscape material.

Calendar pairs its date grid with native month and year selectors. Keep their labels, date limits, disabled states and existing arrow-key date navigation. Selected dates retain the accent while keyboard focus uses the shared neutral outline.

**The Editable Value Rule.** Show editable numbers and colors as real fields with labels and focus feedback. Present API descriptions as reading content.

### Badges and cards

Badges are compact passive labels, with optional dots and semantic tones. Do not imply button behavior on a passive status label. Cards combine a heading, optional eyebrow, content and an optional divided footer. Standard cards inherit appearance-specific surfaces and depth; do not add hover movement to a static card.

### Alerts and sheets

Alerts use outlined SVG status symbols beside the title and message; the polished treatment has a quiet border and no decorative shadow. Sheets separate the header, generously spaced field groups and a divided footer, keeping actions reachable below the content. Both retain their established appearance variants.

### Navigation and playground dock

Library navigation keeps brand and search stationary while the component list scrolls. A shared category map groups components by purpose for navigation, search and the catalogue. Entries follow that category order and alphabetize within each group using an explicit English locale, keeping adjacent-component navigation deterministic. The active entry uses readable text and a visible neutral boundary. The landing and pricing navigation retain their compact five-item arrangement with the orange logo at the center. The existing reference navigation styles and tokens serve both surfaces; the reference action styles and tokens remain in use on pricing.

The playground dock contains Preview, Usage and Source, followed by the documentation link. Its shorter frame preserves a minimum height (44px) and compact tab targets (34px). Selected tabs invert ink and surface; unselected tabs use ink with clear hover and focus feedback. Keep the implemented arrow-key, Home and End behavior. A component entry starts in Preview, while explicit documentation navigation remains reachable.

### Color studies

The shared palette shelf presents named color strips in two columns, with an accent outline and pressed state identifying a selected study. Fire, gradient, meadow and sky editors share this pattern while keeping their individual color fields. Custom studies are named, saved and removable on the current device, with storage feedback presented as status text. Component study colors remain editable artwork, not workspace theme tokens.

The public gradient editor is GrainGradient. ShaderCanvas remains an installable composition engine, while its former catalogue route leads to that single editor.

### Landscape and nature surfaces

Use the mounted forest painting and its registered masks for the landscape. Keep the photographed orange and its photographic citrus leaf still while clouds advect within the sky and tree crowns sway above rooted trunks. The thirteen original painted birds retain their positions and fixed body strips; only their outer wings bend, with a slow rhythm tied to the existing wind gusts and individual phase offsets. Their extracted ink atlas uses one instanced draw on the existing scene clock, while the static painting retains the original birds for the CSS fallback. The optional flower channel and sparkle particles are disabled for this scene. The existing double-speed weather remains; the scene's color and motion values are local rendering choices. Navigation, the orange UI heading and the exact tagline remain HTML. The landing has no visible pause control; the renderer responds automatically to reduced motion and visibility, restores zero wing offset for reduced motion, and keeps the composited painting available as a static fallback. A skip link becomes visible on keyboard focus. `/classic` preserves the earlier library landing. [LANDING_SCENE.md](LANDING_SCENE.md) and [asset provenance](public/landing/README.md) record the runtime, original bird pigments, public-domain orange photograph and CC0 leaf photograph.

SeasonTree uses layered foliage and a continuous, tapered branching form on a transparent canvas, so the chosen preview surface remains visible around the artwork. FlowingGrass uses fine, overlapping rooted blades, sunlight, optional flowers, directional wind and local interaction. DriftingClouds uses bounded cloud volume with lit edges and interior shadow. Their material, color controls and appearance APIs belong to the component examples, while the inspector remains consistent. Keep static presentation and motion preferences part of the component contract.

### Elemental characters and interactive fields

Emberling's Fire, Water and Aqua variants follow the owner's character references with original vector artwork, expressive faces and strongly changing head contours. The bodies stay planted while the head's flame or water silhouette flows. Its two resting arms use matching mirrored geometry; hover or click briefly raises and waves one arm, and leaving the character restores the resting pose. Waving is interaction-only and respects disabled animation and reduced motion. Fluid orb mode uses a moving pigment wash under the same face. HumanAvatar uses bold head-only silhouettes, cutout ink eyes and restrained accent color, with a visible randomize action. These artwork palettes belong to the components and do not become workspace colors.

CharacterAvatar uses a smooth three-quarter face contour without a protruding point. Female, male and neutral options sit alongside none, stubble, beard and mustache facial hair, with the existing hair, glasses, outfit and face controls. The new `gender` and `facialHair` fields remain optional in public version 1 configurations; normalization supplies required fields and defaults legacy data to female and none. The same settled artwork supplies portable exports. These choices belong to the portrait rather than the shared shape system.

Helmet and MiniDriver use a curved frontal shield attached at both fixed temple mounts, at artwork coordinates (35, 111) and (205, 111). Its projected contour rises between those points while the mounts stay in place; the pane and clip shape move together. Both settled visor positions fit the portable SVG frame (`0 0 240 240`). Visor state, keyboard activation, visibility and reduced-motion behavior remain available. This bilateral construction is component geometry, not a shared shape token.

The workspace supplies the complete available preview area. BloomTrail, DraggableCards, BubbleWrap, PhotoGarland and LiquidMetal extend across that area, while individual controls and portraits retain useful proportions. Component actions sit above the shared view dock. Mobile previews start at the top of their stage without inherited sticky offsets.

BubbleWrap uses transparent film, narrow highlights and collapsed creases. It defaults to 16 rows and 18 columns; optional fit packing adjusts rows to the available stage and is enabled in the full-height demo. Its short pressure pop starts only after interaction.

PhotoGarland places up to 18 photos on separated, responsive rows with sagging wires and attached clips. Its transparent backdrop preserves the preview surface. JournalStack presents real two-page spreads with a central spine, layered paper edges, photographs and notes. Its fan navigation supports clicks, swipes and the existing keyboard controls. Both use the twelve local licensed sample photos, whose embedded source metadata and `public/photos/keepsakes/NOTICE.md` travel with the assets.

FloatingDock has monochrome, icon-only shortcut slots with labels revealed on hover or focus. Damped springs enlarge the layout slots as well as their icons, preserving separation. This component is distinct from the shared glass playground view dock.

LiquidMetal uses original analytic twisted ribbons with beveled edges and reflected studio light, following the owner's supplied shader-metal reference. Three ribbons and subtle iridescent sheen (0.15) are the component and demo defaults. Finish, tint, ribbon count, twist, roughness, sheen, speed, pointer lighting and pause remain controllable through the existing parameter API. Aspect-aware projection preserves the ribbons across stage sizes. Its renderer caps the backing image at 360,000 pixels and motion at 30 frames per second; these are effect budgets, not shared design tokens.

### Portfolio source components

PortfolioBanner, PortfolioFooter, AnimatedTruck and StickerSocialIcons preserve the current portfolio's authored materials with the owner's requested library refinements. `docs/portfolio-source.json` records the retained source files and their hashes; `PORTFOLIO_COMPONENTS.md` carries installation and composition details. Keep the original art, palette pairs, fonts and sticker SVGs together with the documented accessibility, interaction and container-layout refinements when installing or editing these components.

The banner retains its nebula, marigold petals, interactive pixel field, Doto clock and original transparent lorry. The footer is a printed card mounted on a terracotta board, ending in its SVG monument skyline and a truck scaled to that skyline. Its demo uses Sample Studio, reserved example.com links, sample contact details and sample profiles without avatars. No red character is included; consumers can supply optional `brandMark` artwork beside the wordmark.

AnimatedTruck retains the artwork's 570:328 proportions, contact shadow, separate driving and suspension layers, and five staggered exhaust puffs. Its full-width track keeps the artwork visible from 4% to `96% - truck width`. The banner truck uses `clamp(76px, 8vw, 140px)` over 18 seconds; the footer truck uses `clamp(76px, 15%, 180px)` over 14 seconds. A native Restart truck button restarts the drive on pointer, touch or keyboard activation, with an optional callback. `restartOnInteract={false}` opts out of the restart. Hover and touch focus allow driving to continue; explicit pause and reduced motion remain honored. The library demo's callback resumes paused decoration.

StickerSocialIcons retains the original physical sticker silhouettes, local material colors, rotations and SVG marks. Optional profile cards open on focus as well as hover; a profile without card data remains a labeled link. Reduced motion retains visible still artwork. These authored components keep the library's theme, accessibility and installation conventions without creating a new library-wide visual world.

### Audio orb and players

AudioOrb adapts the MIT Live Orb color wash to coral (#f58b6b), mint (#74d7bb) and blue (#8094e8), with smaller capsule eyes drawn into the WebGL surface. A transparent canvas surrounds its single antialiased silhouette without a separate rim or circular border band. Typed `showEyes`, `eyeColor`, `interactive` and `blink` props retain gaze and natural blinking. These are editable component colors and behaviors, not workspace palette roles. Real audio energy supplied through `getAnalyser` or `audioLevel` drives expansion, edge movement and internal flow. Typed `sensitivity` accepts 0.25 to 4, defaults to 1.6 and is editable in the demo. Optional `tracks` and `showControls` connect Play music to the shared playback engine and Listen to local microphone analysis. Microphone activation requires a user gesture, reports denied permission and stops its media tracks on stop, hide and unmount. The local rendering budget is 180,000 pixels at 30 frames per second. Offscreen and hidden-tab motion pauses, reduced motion retains a still, and unavailable WebGL retains a gradient and capsule-eye fallback that recovers when the context returns.

VinylPlayer combines a neutral rounded body, a large cropped photographic record, playback-driven rotation, an audio meter and clear timing. Its responsive copy area preserves the metadata and transport space. Hovering the disk or focusing it with the keyboard expands the cover across the full card; tapping toggles the expanded state. Expansion resets rotation to zero, keeps the photo upright and still, removes the dimming and hides the grooves and spindle. The collapsed disk rotates during playback. The authored 550ms transition changes the disk's position, width, height and radius to match the full-card reference; this is a scoped artwork transition, not a shared control-motion rule. Reduced motion keeps the state change without the transition.

WavePlayer uses a wide photographic cover, pale blue controls in light mode and neutral controls in dark mode. Its scrubber reveals waves only along the played portion up to the actual playhead; the unplayed portion remains a straight, quieter line. The native range retains seeking and keyboard access, and the waveform retains its width beside smaller mobile icons. Both demos use real shared playback and local licensed photo covers. Player meters sample audible frequency bands and settle on pause, buffering or mute. IslandPlayer and NeonPillPlayer retain readable pale metadata and controls on their dark bodies in either workspace palette.

## Do's and Don'ts

### Do:

- **Do** retain the oRangeUi name and existing orange pixel logo.
- **Do** use semantic palette variables so light and dark surfaces, borders, text and focus adapt together.
- **Do** preserve the owner's forest landing composition, keep the photographed orange and leaf still, and limit bird motion to slow wingbeats around fixed body positions.
- **Do** keep all five component appearances available without turning them into palette choices.
- **Do** provide visible keyboard focus, descriptive field labels, precise value entry and useful disabled states.
- **Do** keep navigation and page copy in HTML and preserve static content when motion or WebGL is unavailable.
- **Do** keep component artwork and nature effects visually distinct from the editor that controls them.

### Don't:

- **Don't** replace the library's neutral workspace palette with the landscape's scenic colors.
- **Don't** spread glass across editor fields or reduce their visible boundaries.
- **Don't** animate the landing orange, leaf, bird centers or body strips, readable interface text or navigation; the original birds' outer wings alone follow the slow gust rhythm.
- **Don't** present API documentation as editable controls.
- **Don't** remove the palette, appearance, focus or reduced-motion behavior when restyling a component.
- **Don't** use em dashes in project copy.

The November 9 control refinement gives PromptInput, Combobox and Command one neutral focus edge on their visible shell. Rating highlights the focused star's hit area while the native radio stays visually hidden. Selected stars communicate the rating without another selection frame. Calendar month and year navigation use compact themed Select menus with bounded scrolling. WallSwitch uses a screwless square plate, a narrow recessed rocker and two restrained tilt positions. InputOTP's playground exposes numeric and alphanumeric formats. Playground notifications fit inside the stage and reserve clearance above its floating dock; narrow toasts place their action below the message.

The November 9 scene polish presents one tall neon recovery composition with broad orange faces, curled warm tubes, clipped teal edging and a brick wall receiving light. Chai enters from above the glass rim; liquid remains clipped inside, the tilt slider is removed and drag release eases back into the pour. PavilionFooter adds floral dome carving and architectural ornament, eased pointer parallax, fading lamps and a bird flight that returns before relaunch. Its navigation and controls remain usable with reduced motion. Polished WallSwitch uses a lazy beveled solid model with cast shadows while native switch behavior and a context-loss CSS fallback remain. Scene artwork is original inline SVG and CSS; the switch model uses Three.js. Pixel scene artwork remains an optional inspector control.

The later November 9 chai and pavilion extension supersedes the pavilion launch-and-return behavior recorded above: four birds now fly automatically on separate paths with articulated wingbeats and glides, with no flight control. The symmetric central pavilion has three smaller neighbors in different softer blues; aligned Back to top text and arrow retain scrolling and heading focus. ChaiBreak404 fills the stage with original SVG brass, Hindi lettering, block-print sleeves, bangles, marigold toran and floral borders. It always enables ChaiPour's `fullscreen` mode and reveals a soft steam-cloud 404 after the rim-entering pour; dragging and eased release remain. Visibility pauses decorative motion, while reduced motion retains the full glass and cloud and rests the birds and parallax. ChaiYatra is a local CSS alias for the existing SIL OFL licensed Yatra One asset at `public/fonts/desi/yatra-one.woff2`. These artwork colors and lettering sizes stay scoped to the scenes, so the shared palette, type ramp, normative frontmatter and sidecar remain unchanged.

### Scene and photographic film corrections, November 9, 2026

This scoped correction supersedes the earlier Hindi lettering, soft steam-cloud and pavilion lamp descriptions above. ChaiBreak404 removes both Hindi chai labels while preserving brass, block-print sleeves, bangles, marigold toran and floral borders. After the rim-entering pour, clearly defined white steam strokes and cloud lobes form 404 above the full glass, with a warm outline for legibility. Dragging and eased release remain, and reduced motion retains the full glass and steam 404. ChaiYatra remains the component CSS alias for the existing SIL OFL licensed Yatra One asset at `public/fonts/desi/yatra-one.woff2`, used by the recovery heading.

PavilionFooter retains its symmetric indigo pavilion, three smaller softer-blue neighbors, automatic articulated birds and real footer navigation. Its light button visibly warms the arches of all four buildings. Inherited `--pavilion-window` and `--pavilion-window-glow` values, set by the root's `data-lit` state, reach the referenced architecture inside every SVG `use` instance. The 700ms fill and glow transition stays local to the scene; reduced motion keeps lighting usable without transitions and rests birds and parallax.

EndlessFilm retains licensed photography and its incumbent paper and olive palettes. One shared photograph, border and punched-sprocket texture follows a continuous lit spatial mesh, with real bends, twist, perspective, a darker reverse face, depth-tested overlap and soft offset shadows. Wheel feed and surrounding page or preview scroll move the same photograph and perforation phase in both directions. Dragging, horizontal scrubbing, vertical touch scrolling, keyboard selection, pause and navigation controls remain available. Reduced motion retains manual access to a still ribbon; unavailable or lost WebGL exposes a photograph fallback with controls, and context restoration restores the ribbon. Lazy renderer loading, a 480,000-pixel backing-image budget, 30fps automatic painting and disposal of listeners, observers and renderer resources are component behavior.

FilmCormorant is a component CSS alias for self-hosted Cormorant Garamond italic, weight 500, at `public/fonts/film/cormorant-garamond-italic-latin.woff2`. Its source and SIL OFL license remain in `public/fonts/film/NOTICE.md` and `public/fonts/film/OFL-cormorant-garamond.txt`; photographs retain their existing `public/photos/keepsakes/NOTICE.md` provenance in portable source downloads. These aliases and artwork materials extend established scene worlds. The existing shared palette, type ramp, normative frontmatter, sidecar and library appearance, focus and motion conventions remain authoritative. Current implementation and verification scope are recorded in `SCENE_COMPONENTS.md` and the latest section of `SCENE_POLISH.md`.

### Film clarity and chai continuity, November 10, 2026

EndlessFilm's pure black stage (#000) in both host palettes supersedes the earlier paper and olive background description. Its light foreground and visible focus edge remain independent of the host theme. A matte front (roughness 0.94, metalness 0, no clearcoat), gentler lighting, shallow twist and fewer obscuring folds keep the licensed photographs clear. Photographs and punched sprockets still share path-distance feed; controls, touch scrolling and renderer fallback/recovery retain their established behavior.

ChaiBreak404 matches its full-page SVG to the actual page aspect ratio. Original hands and block-print sleeves extend to the upper-left and lower-right corners while preserving mobile recovery-copy clearance. Three independent 404 steam glyphs use 108-unit spacing and unclipped blur, retaining rounded strokes and cloud lobes. The external pour meets the rendered rim and continues as a clipped interior stream to the animated tea and foam surface; both streams follow pouring and reduced-motion visibility. Kettle dragging, eased release and the removal of both Hindi labels remain.

These are scoped extensions of the existing scene worlds. Licensed ChaiYatra and FilmCormorant, original Indian artwork and photograph provenance remain unchanged, with no new rasters. The shared palette, type ramp, normative frontmatter, sidecar and library appearance, focus and motion conventions remain authoritative. Current implementation and verification, including the independent five-fix ship verdict, are recorded in SCENE_COMPONENTS.md and the latest SCENE_POLISH.md section.

### Chai timing and high-DPI film, November 10, 2026

Chai's gripping hand moves with the tilted kettle, with articulated fingertips, nails, palm creases and sleeve folds. Liquid releases after sufficient tilt, travels from the spout before entering the glass, and adds volume only after reaching the tea surface. Already released liquid finishes falling after cutoff; the full glass retains its volume. Layered marigold petals, leaves and tassels keep the upper toran detailed and inside the page edge. EndlessFilm preserves its pure black background, matte photographic ribbon and existing controls, while its backing canvas supports DPR 2 within 2,500,000 pixels and its shared atlas uses up to 640 by 500 pixels per frame. The device's texture limit bounds atlas width. These changes preserve the existing licensed fonts, photographs, shared tokens and scene worlds. Current checks and the scoped finish review are recorded in SCENE_POLISH.md.

### Chai pour geometry and hand layering, November 10, 2026

Chai sizes its kettle and gripping hand together to preserve a downward drop above the glass on short, wide pages. The grip stays inside the page and the sleeve reaches its upper-left edge. Original hand artwork layers far fingers and palm behind the handle and glass, with curled fingertips and the opposing thumb in front, smaller nails, soft skin shading and restrained joint creases. These are local illustration and placement decisions within the established cream, brass and block-print scene, with no new shared tokens, fonts or raster assets.

### Neon blocks and copy feedback, November 12, 2026

NeonHero and NeonBento use mint, orange and violet light borders, cream copy and original geometric line artwork on black. The 404 billboard no longer appears in either composition. Bento cells brighten on hover or focus within, with one occasional one-second dimming cycle every 5.5 to 11 seconds. Automatic cycles pause offscreen, in a hidden document and for reduced motion. Availability text remains configurable through signText. The host palette remains available through the site's shared controls; local block palette selectors are removed.

Hero preview actions preserve the current page for pointer and keyboard activation. Portable component destinations remain configurable by the consuming application. Block copy controls acknowledge successful clipboard writes with a checkmark and a temporary Copied label, retain feedback with reduced motion, and expose selected text when clipboard access fails. The generic demo content banner is removed across block previews; callback and auth-flow controls remain usable. Catalogue captures now show the revised neon compositions. Validation and the scoped ship review are recorded in BLOCK_UI_REFINEMENTS.md.

### Testimonials, pricing and FAQ blocks, November 13, 2026

This completed Polished library extension adds nine reference-led compositions and moves the existing Accordion presentation into FAQ Blocks. Authored palettes remain consistent in both host themes and stay local to these blocks. The neutral shell, shared tokens, normative frontmatter and sidecar retain the established library system. MARKETING_PROOF_BLOCKS.md records layouts, source and verification; the catalogue contains 61 blocks at this handoff.

StackedTestimonials combines green (#07944d), rotated blue backing (#0679ac) and a lime footer (#a9e263) with an ink offset shadow. CollageTestimonials places lime (#baff89), pink (#f7b4d8) and cream cards on white (#fdfcf8), retaining local rotation and ink shadows. PortraitTestimonials uses emerald (#007b58) on dark (#171b16); InfiniteTestimonials uses white pills (#fdfcfb) on warm gray (#e9e1de). GlassPricing uses translucent black (#050a12), cyan light and pale copy; TicketPricing combines orange (#ff6421), ink (#101014), cream (#f3efe3), lime (#d5ff33) and pink (#ff3b97). FolderFaq uses cream (#f7ecd7), amber (#ffb51e) and white answer sheets; BubbleFaq uses pink (#f4afe3) and cream (#f8f1e7); PosterFaq combines ink (#06080b), lime (#ceff29), blue (#0864e7) and cream (#fcfcef). AccordionFaq inherits the semantic palette.

Headings reuse Section Display, the self-hosted Bricolage Grotesque weight-800 alias; BubbleFaq and PosterFaq use Section Condensed, Barlow Condensed weight 900. Ordinary copy uses the existing body family. Keep the SIL OFL licenses and source notices in public/fonts/sections/ with distributed fonts. These aliases and container-based headline sizes are block-local typography.

StackedTestimonials and PortraitTestimonials use manual Previous/Next controls with position announcements; CollageTestimonials is static. InfiniteTestimonials has four seamless rows moving left/right/left/right. Duration defaults to 55 seconds, is bounded to 15 through 180 seconds, and adds four seconds per following row. Hover, row focus, explicit Pause motion, offscreen state and hidden-document state pause travel. Reduced motion or animate={false} yields wrapping static lists showing each story once; visual duplicates are hidden from assistive technology. Pricing uses application-owned callbacks with pending and recoverable success/error feedback. Native FAQ disclosures retain keyboard access and multiple open answers; AccordionFaq retains single-open, collapsible behavior with Arrow keys and Home/End navigation. Reduced motion removes disclosure-icon transitions.

Container reflows make collage and glass plans one column at 600px, tighten stacked cards and reduce portrait depth. Tickets reflow from four columns to two at 900px and one at 600px, where the group offer stacks. BubbleFaq stacks at 700px. PosterFaq narrows at 700px and puts topic/question beside smaller art at 520px; FolderFaq tightens at 520px. Static pills wrap readable text. Visible focus adapts to each local material.

Sample authors, organizations, quotes, ratings, prices and offers are fictional and configurable. Illustrative Unsplash portraits do not identify or endorse those authors; production consumers supply verified content and authorized portraits. Keep public/photos/keepsakes/TESTIMONIAL_PHOTOS.md, font licenses and existing original character-art notices with portable source. Reference layout/material cues inform original code; reference pixels, logos, likenesses and slogans do not ship. Catalogue captures retain raster provenance.

New examples precede incumbent testimonials, pricing-section and faq entries. FAQ order is Folder, Bubble, Poster, Accordion, then simple FAQ. Accordion leaves the public Components catalogue; /components/accordion permanently redirects to /blocks/accordion-faq. Legacy findComponent("accordion") lookup and reusable source remain available for downloads and installation. This appendix covers only the completed Testimonials, Pricing and FAQ batch.


### Stats, announcements, contact and team blocks, November 13, 2026

This scoped extension adds 14 Polished blocks, bringing the catalogue to 75. Each of Stats, Announcements, Contact and Team gains an original neobrutalist Poster option, and new entries lead the existing simple example in each category. Their authored palettes remain consistent in both host themes. The neutral shell, shared tokens, normative frontmatter, sidecar and earlier proof-block documentation retain the established library system. OUTREACH_BLOCKS.md records the reference map, source contracts and verification.

DotStats uses ink (#121513), yellow (#f5ff75) and violet (#a294ef) for a hundred-dot percentage panel; PulseStats uses emerald (#286c59), lime (#deff86), violet (#a997fa) and dark chart tiles. PosterStats combines cream (#f2eddb), lime (#daff74), pink (#edaacf) and orange (#ffb268) with ink edges and offset shadows. Its measurements retain tight display tracking while descriptive captions use normal body tracking. PosterAnnouncement places lime paper (#ddff73) on pink (#edadd5); ReminderAnnouncement uses a cream card (#f9fbef), blue label and rotated backing over a licensed photograph. SceneAnnouncement keeps its taped cobalt card (#303cdd) and lime copy (#eaff75) steady over independently cycling photographic backgrounds.

EditorialContact uses cream (#f1f0da) on ink (#20201e), original stickers and oversized italic lettering. ChannelContact uses ruled cream (#f8f6ee) with original art. SignalContact pairs violet (#b5a4ff), lime (#ddff73) and ink (#17181a); PosterContact combines violet (#e4adf0), a cream form (#f4f2de), lime action and local offset shadows. CollageTeam translates its presentation reference to cream profiles on pink (#e7abea); FlipTeam translates its presentation mosaic to cream (#f3f3d9), violet (#dfacf1) role tiles and original artwork. CharacterTeam replaces game characters with original oRangeUi illustrated profiles on cream, amber (#ffbf42) and coral (#ff6d59). The center Fold character retains its artwork and amber card, with a pale circular ground (#f9e8bc). PosterTeam uses lime (#daff75), violet (#d1b1ff) and pink (#f0adcf) photographic cards with ink edges and offset shadows. These materials remain block-local.

Headings reuse Section Display, the licensed Bricolage Grotesque alias, with the existing body family for ordinary copy. Contact Editorial is a scoped CSS alias for Cormorant Garamond italic, declared at weight 400 for EditorialContact's heading and large address. It reuses the existing film subset at public/fonts/film/cormorant-garamond-italic-latin.woff2, documented at weight 500 in public/fonts/film/NOTICE.md. Keep that notice and OFL-cormorant-garamond.txt, carrying SIL OFL 1.1, with distributed fonts. The alias and oversized serif role do not establish a global type ramp.

SceneAnnouncement cycles backgrounds using active elapsed time at a default six-second interval, bounded to 3 through 60 seconds, with a 900ms opacity crossfade. Card geometry and readable copy stay steady. Explicit Pause backgrounds, offscreen state and hidden-document state suspend changes; reduced motion shows the first image without transitions and hides the motion toggle. animate={false} stops automatic changes. FlipTeam reveals roles on hover or focus and allows a persistent Enter, Space or touch toggle. Its local 420ms cubic-bezier(.16,1,.3,1) rotation becomes immediate for reduced motion; accessible button names contain the person's name and role. CharacterTeam uses native biography disclosures, while CollageTeam and PosterTeam remain static. Statistics expose labels and values, with PulseStats period controls switching the complete dataset. Application-owned announcement and contact callbacks disable pending actions and expose completion or recoverable errors. Contact validates a trimmed name, address and message, focuses the first invalid field with connected error text, and permits retries after rejection.

Container reflows preserve phone reading order. PulseStats moves to two columns and PosterStats to one at 750px; DotStats and PulseStats become single reading columns at 500px. Announcement card padding, sticker sizes and stage proportions tighten at 520px while the Scene card stays steady. Contact columns stack at 720px; ruled channel values move below their labels and artwork shrinks at 480px. CollageTeam becomes two columns and FlipTeam places its heading above the mosaic at 900px. Collage, Character and Poster teams become single columns at 650px, with three flip-mosaic columns; at 380px the mosaic uses two columns. Visible Section focus edges adapt to each local material.

Sample people, roles, biographies, organizations, statistics, progress, dates and offers are fictional and configurable. Illustrative Unsplash portraits do not identify or endorse those fictional members; production consumers supply verified content and authorized portraits. Preserve public/photos/keepsakes/TESTIMONIAL_PHOTOS.md for profiles, the existing landscape NOTICE.md for announcement backgrounds, font licenses and original artwork notices with portable source. Reference layout/material cues inform original code; reference pixels, brands, claims and copyrighted game characters do not ship. Source downloads retain transitive styles, fonts, backgrounds, portraits and notices; registry transports embed bundled assets while preserving caller-supplied URLs. The scoped implementation, completed verification and final ship review of the three named fixes are recorded in OUTREACH_BLOCKS.md.
