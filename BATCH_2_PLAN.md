# Batch 2: creative components

Scope: add 14 distinct catalogue components to the verified 70-component library, for 84 total. StyledText is the shared generator behind HindiText and HinglishText, not an extra catalogue entry.

Implementation and verification are complete as of 30 October 2026. Exact results, evidence and browser limitations are recorded in STATUS.md and out/batch-2/verification-summary.json.

The attached brief was read on 30 October 2026. All 12 images in the linked Google document were downloaded and visually reviewed. Reference copies stay in ignored out/reference-images/. They are visual direction only and are never distributed with the library.

## Delivery checklist

| Component | Collection | Required behavior | Status |
| --- | --- | --- | --- |
| SeasonTree | Pixelated | Original procedural foliage, four season palettes and transitions, falling leaves, season picker | Verified |
| RetroPlayer | Retro OS | Real playback, working click wheel, editable original decals, earbuds | Verified |
| RetroCamera | Retro OS | Permission states, live camera, zoom, filters, capture/gallery/download, front/back flip | Verified |
| SwingKeychain | Polished | Lazy custom Verlet physics, draggable original charms, collisions, synthesized jingle | Verified |
| CustomStamp | Polished | Perforated edges, image/text/color editor, postmark, sheet, PNG/SVG export | Verified |
| TiltStamp3D | Polished | Pointer/drag/keyboard tilt, spring return, glare, mobile orientation, original floral artwork | Verified |
| IslandPlayer | Polished | Shared real audio engine, timing, scrubbing, equalizer, output action | Verified |
| GlassPlayer | Polished | Cover-derived backdrop, real audio, controlled like, share/copy fallback | Verified |
| NeonPillPlayer | Polished | Collapsed default, hover/focus/touch expansion, glow, real audio | Verified |
| AnimeFire | Polished | Original cel-shaded WebGL, exact base defaults, pointer attraction, embers, optional crackle | Verified |
| GrainGradient | Polished | Original WebGL, palettes/points/presets, motion and grain controls, modes, image export | Verified |
| HindiText | Polished | Licensed Devanagari display face, offline transliteration, styling, PNG/SVG export | Verified |
| HinglishText | Polished | Matching Latin/Devanagari face, mixed text, original pattern, styling and exports | Verified |
| FrostedGlass | Polished | Smoothed pressure-aware multiple pointers, offscreen mask, regrowth, text cutout, reset | Verified |

All components need typed props, className, live auto/light/dark themes, reduced-motion support, responsive demos with controls, prop documentation, public exports, portable source/registry downloads, and resource cleanup. Canvas/WebGL animation runs only on screen in a visible tab; DPR is capped at 2. Audio starts through a user gesture and has a visible mute control.

## Verification

- Meaningful unit checks for player state, physics, transliteration, masks, media cleanup, theme updates, and source assets.
- Desktop and 380px browser review in both themes, including interaction, audio gating, reduced motion, WebGL fallback and context restoration.
- Lint, typecheck, copy check, source/registry checks, and production build.
- Save current evidence in out/batch-2/ and record exact outcomes, limitations and licenses in STATUS.md.
- Commit and ordinarily push verified task changes; personal working rules remain local.

## Final brief audit, 30 October 2026

The attached brief and all 12 private reference images were reconciled with the desktop and 380px previews in both palettes. The requested device silhouettes, seasonal foliage, perforated paper, flowers above the swatch, player layouts, mixed-script lettering and clear lettering through frost are present. The final audit corrected a repeated-resize defect that hid the frost and its text cutout. The new pixel regression passes in all four viewport/palette combinations.

The final build passes 35 affected unit/source cases, 80 independently compiled and bundled examples, nine affected browser cases and four catalogue viewport cases. All 56 creative accessibility observations are clean. Lint, strict TypeScript, copy checks, production build, bundle isolation and source traces pass. Earlier full results remain recorded in STATUS.md; this final pass refreshes the affected checks.

No required component is deferred. SwingKeychain uses a lazily loaded custom Verlet solver with canvas shading, one of the implementation approaches allowed by the brief. HindiText uses Yatra One and HinglishText uses Baloo 2 under SIL OFL 1.1, with swappable tokens and complete notices. The sample playlist contains three original synthesized CC0 1.0 recordings. Original artwork supplies the demos; reference characters, lettering, logos and album art are not distributed.

Browser verification covers Chromium and emulated touch. Camera checks use a fake MediaStream and device tilt uses granted permissions with synthetic events. A sustained 60fps result on physical phones was not measured. Exact reports, the reproduced defect and final screenshots are in out/batch-2/final-audit/.
