# Reference component expansion

## Scope

Six Pinterest references and ten interaction patterns join the existing library. The current Avatar, AvatarGroup, AvatarEditor, CharacterAvatar and MascotAvatar remain unchanged. Human avatars receive a separate navigation category. The verified starting catalogue contains 85 entries; the earlier status prose says 86.

| Request | oRangeUi component | Interaction and material |
| --- | --- | --- |
| [Flower playground](https://in.pinterest.com/pin/675188169180449251/) | BloomTrail | Small colored flowers follow a pointer on a paper surface. Keyboard planting and clearing. |
| [Human avatar reference](https://in.pinterest.com/pin/667799451037833042/) | HumanAvatar | Original black-ink sticker portraits with editable hair, expression, skin, glasses and accent. No reference characters are reproduced. |
| [Journal reference](https://in.pinterest.com/pin/581457001936223935/) | JournalStack | A perspective stack of photo journal pages with pointer, touch and keyboard navigation. |
| [Photo lights](https://in.pinterest.com/pin/905293962616808489/) | PhotoGarland | Two hanging strings, warm bulbs and clipped photos that can be selected. |
| [Bubble-wrap artwork](https://in.pinterest.com/pin/292593307052968670/) | BubbleWrap | A transparent sheet over an image with individually poppable cells, reset and optional gesture-triggered sound. |
| [Film frames](https://in.pinterest.com/pin/89157267630139570/) | FilmStrip | Tilted film frames on binder clips with photo selection. |
| Aceternity Focus Card | FocusCards | Hover or focus sharpens one photograph and softens its neighbors. |
| Aceternity Draggable Card | DraggableCards | Bounded, tilting photo cards with stacking, keyboard movement and reset. |
| Aceternity Encrypted text | CipherText | A character scramble resolves into real, accessible text. |
| Aceternity Squiggly text | WiggleText | Animated SVG displacement applied to real text. |
| Aceternity text flipping board | FlipBoard | Split-flap letters turn through an editable sequence. |
| Aceternity hover border gradient | HaloButton | A moving rim follows pointer position; keyboard focus gets the same emphasis. |
| Aceternity floating dock | FloatingDock | Neighbor-aware icon magnification, real buttons/links and labels. |
| Aceternity gooey input | MorphInput | A search trigger stretches into an editable, submittable input. |
| 23rd.dev Shader Metal | LiquidMetal | An original analytic ribbon shader, with broad studio reflections, brushed detail and pointer lighting. |
| 23rd.dev Gooey Color Picker | FluidColorPicker | An original merging-swatch palette with a saturation/value plane, hue, alpha, hex and keyboard controls. |

## Direction contract

Mode: Experience inside the existing Operate workspace. The component is the subject; the surrounding inspector preserves DESIGN.md and the current playground layout. Each preview starts with useful content and exposes its core interaction immediately. Mobile uses the same artwork with fluid dimensions and usable controls. Reduced motion preserves content and function.

This is an extension of an established surface. The supplied references settle the materials and composition. No replacement visual identity is introduced. Portraits and flowers are editable original vector geometry; galleries use local licensed landscape photographs. Reference images remain local under the ignored out/reference-images directory.

## Source policy

All new implementation code is authored for this repository. No Aceternity or 23rd.dev source code is copied or renamed. Aceternity's [current license page](https://ui.aceternity.com/licence), inspected on 3 November 2026, restricts redistribution of source files. Those previews inform the interaction requirements only. The two 23rd.dev concepts receive independent geometry, rendering, layouts and controls. Original names and visual changes are design decisions, not a claim of legal immunity.

Small Unsplash landscape photos are used as demonstration content under the [Unsplash license](https://unsplash.com/license). Their source URLs and usage notes travel with ZIP and registry downloads. Consumers can supply their own images. The Pinterest reference artwork is not redistributed.

## Verification

The 16 additions are implemented and verified on 3 November 2026. The catalogue contains 101 unique entries. Production build `neVH4702AKcm-mTdyqqOT`, TypeScript, ESLint and copy checks pass.

- The affected behavior/source suite passes 67 cases. This includes visible caption names, meaningful photo descriptions and notes that are present, absent or empty. The final component-only refresh passes all 28 cases.
- All 85 standalone examples covering the new additions compile and bundle across the five appearances. After the caption correction, the two affected download batches were refreshed: 40 examples pass with zero diagnostics.
- All 11 browser cases are covered by passing full-matrix and focused results. The original run had ten passes and one accessibility failure; the final two-case rerun passes paper interactions and accessibility. Scoped axe checks report zero violations across all 16 previews in both themes.
- The 1440x1000 and 390x844 matrix covers light and dark, with no page overflow or runtime errors. JournalStack and DraggableCards received eight fresh observations after the correction, with all 16 replacement PNGs validated. Other coverage includes human SVG/PNG export, original Avatar smoke, bubble brushing, color/search/dock state, real graphics-context restoration, reduced motion and no-JavaScript fallbacks.
- Bundle isolation and final source traces pass. Both download routes retain 269 public source files plus 12 runtime files. Live ZIP and registry checks confirm the corrected source, all six sample photos and their license notes. The photo provenance scan reports six rasters and zero missing origins.

The independent reviewer returned `ship` for the listed caption correction, scoring it resolved. Its initial review accepted the visual work. This verdict is scoped to the requested correction, not a new whole-site audit. A fresh documentation comparison passed and preserved the incumbent product, design system and surface briefs. Physical-device frame rates and user visual acceptance remain unmeasured.

Local evidence is indexed by `out/iteration/reference-expansion/verification-summary.json`. The preview is available at `http://127.0.0.1:3116`. To start the production preview from this checkout:

```powershell
npm.cmd run start -- --hostname 127.0.0.1 --port 3116
```
