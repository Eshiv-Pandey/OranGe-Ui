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
  focus-light: "#a64500"
  focus-dark: "#ff821f"
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

The landscape is a scoped expression of that identity: a photographic plate, indigo-blue sky, lavender terrain, peach-lit mist and small teal sparkles. Quiet white lettering and translucent controls preserve the image's depth. This treatment belongs to the landscape landing and its related pricing surface; the component library keeps its established light and dark workspace palettes.

Component appearances are independent of palette. Polished, Pixelated, Neobrutalism, Retro OS and Terminal retain their own geometry, typography and depth. The landing and playground composition contracts live in their respective .impeccable/surfaces briefs.

**Key Characteristics:**

- Orange pixel branding alongside readable interface typography.
- Neutral light and dark workspaces with a separate appearance choice.
- Photographic landscape material with localized, optional motion.
- Visible field boundaries, exact editable values and a persistent live preview.
- Distinct depth and shape language for all five component appearances.

## Colors

The shared palette places warm orange against near-neutral paper, charcoal and black. The frontmatter records the baseline CSS values from `styles/tokens.css`; component token entries show the default polished light treatment. At runtime, semantic CSS variables select the active palette, while `lib/theme.ts` derives hover, accent text, focus and on-accent foreground values. Preserve those live bindings in new components.

### Primary

- **Orange:** primary actions, active controls, slider progress and brand detail. The hover and readable text roles have separate tokens.
- **Landscape orange:** the landing logo has its own warmer orange and light green leaf, scoped to the reference navigation.

### Secondary

- **Lime, mint, amber, sky and coral:** the existing soft illustration and state accents. Their light and dark token pairs stay together. Mint, amber and coral also distinguish success, warning and danger badges.
- **Error and focus:** semantic feedback colors, with separate light and dark baseline values. Error treatment includes text and field structure rather than color alone.

### Neutral

- **Cream, surface and soft surface:** page, panel and inset layers in each palette. The historical `cream` token is neutral paper in light mode and black in dark mode.
- **Ink, muted and line:** primary content, secondary content and visible boundaries. Keep each palette's values paired.
- **Reference white, soft, rule, ground and sky:** the landscape's text, divider and backdrop roles. Its glass colors retain the source CSS alpha values rather than becoming opaque surface colors.

**The Appearance and Palette Rule.** Choose component appearance separately from light or dark palette; preserve both controls and their independent effects.

**The Accent Contrast Rule.** Use the live semantic accent variables for text, focus and foregrounds. The theme utility derives readable values when the accent changes.

## Typography

Geist is the shared interface family. The app serves it through `next/font` and `--font-body`; downloadable library CSS also supplies the local `oRange Geist` face. Pixelify Sans uses `--font-display` with the local `oRange Pixel` alias in library CSS. The terminal stack is Cascadia Code, SFMono-Regular, Consolas, Liberation Mono and monospace. Retro OS uses Arial and Helvetica.

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

**The Readable Controls Rule.** Keep editor labels, values and documentation readable at working density. Pixel typography belongs to the pixel appearance and established brand treatments.

## Layout

The shared spacing scale advances in eight-pixel steps, with a smaller workspace gap for dense adjacent panels. Use the frontmatter spacing tokens for recurring rhythm, and preserve component-specific field padding.

The component workspace uses a fixed navigation rail (240px, or 64px collapsed), a flexible preview stage and a right inspector (344px). At desktop widths up to 1200px the inspector narrows (300px). The stage and inspector use separate bounded surfaces with a shared gap; desktop workspace height follows the viewport (`calc(100dvh - 24px)`, minimum 520px). Controls, artwork and code reserve bottom space for the floating dock.

At widths up to 800px, the stage sits above the inspector and the navigation moves to its mobile controls. The stage has a minimum height (340px), the workbench follows the compact viewport, and the inspector body remains bounded (maximum 420px). Keep all three dock labels and the documentation link in one row.

FrostedGlass owns the container that reflows its optional side actions below the pane. This layout travels with the installed component and responds to the space available inside an embed, independently of the library workspace.

The landscape follows its own reference composition: central figure and river, top-center navigation, lower-left title, right-side action and lower divider/copy. At widths up to 700px, the text and action stack below the focal image area. Preserve that responsive relationship without imposing its composition on library pages. See [the landing surface brief](.impeccable/surfaces/app-page-tsx.md) and [the playground surface brief](.impeccable/surfaces/components-library-component-detail-tsx.md).

**The Preview First Rule.** Keep the preview visible while editing, reserve space for its dock, and give the inspector its own scroll region when the layout is side by side.

## Elevation & Depth

Depth is material-specific. Polished controls and standard cards use subtle ambient shadows. Pixelated and Neobrutalism use solid offset shadows. Retro OS uses opposing light and dark bevels. Terminal uses fine lines and flat surfaces. The workspace stage and inspector rely on tone and borders rather than ornamental shadow.

The landscape's image carries its depth. Navigation and its main action use a restrained blur (16px); the playground dock uses a stronger blur with saturation (24px, 1.55). GlassPlayer and FrostedGlass retain their own translucent component materials. The sidecar records the exact shadow and motion vocabulary, which the frontmatter schema cannot represent.

Transitions provide brief state feedback. Pixelated and Retro OS/Terminal retain their stepped timing where authored. Reduced-motion rules remove decorative CSS animation and transitions, and canvas components retain their static presentation. Landscape movement remains localized to flowers, grass, mist and small sparkles; the fixed person is protected.

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

**The Editable Value Rule.** Show editable numbers and colors as real fields with labels and focus feedback. Present API descriptions as reading content.

### Badges and cards

Badges are compact passive labels, with optional dots and semantic tones. Do not imply button behavior on a passive status label. Cards combine a heading, optional eyebrow, content and an optional divided footer. Standard cards inherit appearance-specific surfaces and depth; do not add hover movement to a static card.

### Navigation and playground dock

Library navigation keeps brand and search stationary while the component list scrolls. The active entry uses readable text and a visible neutral boundary. The landing navigation retains its compact five-item arrangement with the orange logo at the center.

The playground dock contains Preview, Usage and Source, followed by the documentation link. Its shorter frame preserves a minimum height (44px) and compact tab targets (34px). Selected tabs invert ink and surface; unselected tabs use ink with clear hover and focus feedback. Keep the implemented arrow-key, Home and End behavior. A component entry starts in Preview, while explicit documentation navigation remains reachable.

### Color studies

The shared palette shelf presents named color strips in two columns, with an accent outline and pressed state identifying a selected study. Fire, gradient, meadow and sky editors share this pattern while keeping their individual color fields. Custom studies are named, saved and removable on the current device, with storage feedback presented as status text. Component study colors remain editable artwork, not workspace theme tokens.

The public gradient editor is GrainGradient. ShaderCanvas remains an installable composition engine, while its former catalogue route leads to that single editor.

### Landscape and nature surfaces

Use the existing cleaned photographic plate and masks for the landscape, preserving the recognizable river, fixed central figure, restrained type and orange logo. Keep scene motion subtle and localized; navigation, copy and the pause control remain HTML. The previous landing remains a separate visual surface at `/classic`.

SeasonTree uses layered foliage and a continuous, tapered branching form on a transparent canvas, so the chosen preview surface remains visible around the artwork. FlowingGrass uses fine, overlapping rooted blades, sunlight, optional flowers, directional wind and local interaction. DriftingClouds uses bounded cloud volume with lit edges and interior shadow. Their material, color controls and appearance APIs belong to the component examples, while the inspector remains consistent. Keep static presentation and motion preferences part of the component contract.

## Do's and Don'ts

### Do:

- **Do** retain the oRangeUi name and existing orange pixel logo.
- **Do** use semantic palette variables so light and dark surfaces, borders, text and focus adapt together.
- **Do** preserve the photographic landing composition and keep the central figure clear of scene motion.
- **Do** keep all five component appearances available without turning them into palette choices.
- **Do** provide visible keyboard focus, descriptive field labels, precise value entry and useful disabled states.
- **Do** keep navigation and page copy in HTML and preserve static content when motion or WebGL is unavailable.
- **Do** keep component artwork and nature effects visually distinct from the editor that controls them.

### Don't:

- **Don't** replace the library's neutral workspace palette with the landscape's scenic colors.
- **Don't** spread glass across editor fields or reduce their visible boundaries.
- **Don't** turn the fixed landing figure, readable interface text or navigation into animated scenery.
- **Don't** present API documentation as editable controls.
- **Don't** remove the palette, appearance, focus or reduced-motion behavior when restyling a component.
- **Don't** use em dashes in project copy.
