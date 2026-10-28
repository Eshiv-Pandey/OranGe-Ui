# Five appearances and Infinite Avatar

Status: complete and verified, 28 October 2026. See `STATUS.md` for measured results and saved evidence.

## Product scope

- Add Neobrutalism, Retro OS, and Terminal to Polished and Pixelated. Every reusable component, demo, story, usage example, and source download supports the five appearances. Functional component categories stay independent of appearance.
- Replace green-tinted dark surfaces with OLED black and neutral grays. Use a vivid saturated brand orange, with accessible text and focus colors. Keep intentional illustrated-card accent colors and the purple GamerBoy display.
- Extend Avatar with deterministic, upload-free SVG identity. Add AvatarGroup and a controlled AvatarEditor, bringing the catalogue to 34 real components.
- Mood boards are private style input only. No reference files enter the repository. All glyphs are original drawings; use only general squircle, gradient, simple-glyph, and soft-depth qualities.

## Avatar contract and deliverables

- A small versioned JSON config, stable hash and seeded generator in `lib/avatar/`. Same seed produces identical configs and SVG strings without random or network dependencies.
- At least 60 curated gradient palettes and 30 original SVG glyphs; subtle dots, grid, noise, highlight, and no-pattern options. More than 100,000 combinations. Automatically selected glyph tone meets 3:1 contrast against each gradient's average color.
- Pure SVG Avatar usable from a synchronous server component, unique SVG definition IDs, seed/config/fallback usage, accessible names, fixed dimensions, five named sizes plus numeric sizing, and selectable shapes. Pixel appearance uses a stepped mask.
- AvatarGroup supports overlap, sizing, maximum visible members, and accessible overflow counts.
- Controlled AvatarEditor emits config changes for palette, glyph, angle, pattern, shuffle, and seed-default reset. It never persists user data. All controls support keyboard operation.
- SVG string and data URL export work on the server; optional PNG export is a separate browser helper. Public exports, source ZIP transitive dependencies, and generated usage examples include the new system.
- Stories cover seed controls, 100 seeds, sizes/shapes, groups, editor with JSON, and all five appearances. Documentation explains seed usage, JSON persistence, SSR, exports, and theming.

## Verification gates

- Determinism over 1,000 repeated calls; diversity across 10,000 seeds and use of every palette/glyph; automatic contrast for every palette; safe serialized config handling.
- Component fallback/config/seed rendering, unique IDs, SSR and hydration, group overflow, controlled editor changes/reset, and SVG/PNG exports.
- All 34 components and all five appearances in light/dark themes, accessible active overlays, mobile navigation, direct appearance URLs, source downloads, and keyboard interactions.
- Visual review of the original glyphs and 100-avatar variety grid; five appearance contact sheets; OLED neutrals, lively orange, desktop/tablet/360/390px layouts and active mobile controls.
- Lint, strict typecheck, copy checks, unit tests, Next production build, Storybook build, isolated downloaded-example compilation/bundling, and browser checks.
- Update STATUS.md with measured outcomes and saved evidence. Commit in small reviewable stages and push verified work.
