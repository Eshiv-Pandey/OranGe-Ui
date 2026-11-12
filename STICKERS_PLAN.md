# Sticker workspace expansion

Status: the third workspace pass is complete. Production build, TypeScript, focused source checks and all four final browser tests passed. A fresh replacement reviewer scored all three original findings resolved. The npm package remains published at `orangeui-stickers@0.1.0`.

## Scope

Keep the original fifty playful designs and add twenty original Everyday designs. All seventy support playful and sharp finishes. Sharp uses saturated fills, finer contours, white trim and individual enamel facets. Preserve the existing oRangeUi neutral workspace and the right-side inspector.

Replace the rejected diagonal peel with original click motion: bounce, wiggle, spin or none. Size, rotation, duration, intensity and shadow are editable. Reduced motion keeps all artwork still. The legacy hoverPeel prop now offers a gentle full-sticker hover lift without clipping.

## Delivered surfaces and exports

- `/stickers`: compact introduction, searchable collection, Everyday favorites first, Sharp/Playful choice, a compact right-side inspector and one Playground launcher. Phones open the inspector after sticker selection.
- Inspector and native modal editor: shared Appearance/Motion tabs keep the complete property controls and copy/download actions visible without internal scrolling. The editor adds a rotation-safe live preview, native color picker and background presets. Preview colors change the editing surface while exported artwork remains transparent.
- Playground: a full-window native workspace with a large canvas and right sidebar, with tools below the canvas on phones. Stickers/Edit/Layers/Canvas panes keep each task short. The sticker tray shows six items on short phones and nine otherwise. Arrangements survive closing and reopening the workspace.
- Place and drag beyond the canvas edges, keyboard nudge, resize/rotate, duplicate, visible selected-sticker X removal and undo. X/Y coordinates allow -50% through 150%; the deliberate crop is preserved in exports. Layers support native drag, pointer grips and keyboard forward/back controls; the top list item paints in front. The eighty-item limit remains.
- Canvas backgrounds use a native color picker, palette presets or transparency. On solid custom backgrounds, caption lettering selects the readable neutral foreground or falls back to black/white for at least 4.5:1 contrast. This content-caption correction also reaches React/HTML exports; custom canvas colors survive every scene format.
- Copy/download React, self-contained HTML and JSON canvas layouts. Each placement retains its own finish and animation settings.
- `Sticker` and seventy named components ship through the existing source ZIP and registry workflows.
- `/api/stickers`: seventy designs in both finishes (140 SVGs); `?finish=sharp` or `?finish=playful` selects one edition.
- `orangeui-stickers@0.1.0`: React peer dependencies, ESM, CommonJS, TypeScript and standalone CSS. The tested tarball is served at `/downloads/orangeui-stickers-0.1.0.tgz`, so npm can install it from the website URL today. `npm install orangeui-stickers@0.1.0` is verified against the published registry package.

## Package build and consumer verification

```powershell
node packages/stickers/scripts/test-package.mjs --release --registry
```

The package consumer check installs the real tarball in an isolated project, renders all designs in both finishes through ESM/CommonJS, bundles React and CSS without Next.js/Tailwind/fonts, and checks NodeNext ESM/CommonJS declarations. Preserve the intentional public tarball when changing package source.

## Third workspace pass verification, November 12, 2026

- Production webpack build and TypeScript passed after the final source corrections at 11:21 local time. The same existing shared named-version-import advisories remain.
- Five focused unit files with sixteen tests and scoped ESLint passed. The focused files cover editor behavior, scene exports, source delivery, sticker-pack source and artwork.
- All four final production-browser tests passed with zero skips, unexpected results or flakiness, recorded at `out/iteration/stickers/browser-v3-confirmation-report.json`. They verify all 140 artwork bounds, source/package delivery, compact inspector/editor settings, focus and exports, free edge placement, removal/undo, pointer and native layer reordering, and portable colors in React/HTML/JSON.
- The eighty captures cover eight surface states at 1536x772, 1440x900, 390x844, 320x780 and 320x568 in both palettes. The short phone's first card and inspector exports/API fit the actual viewport; its editor artboard is 140px high and canvas is 288px wide. The browser checks found no page errors. Axe scans of gallery, editor and playground at 1536px in both palettes recorded no violations.
- A fresh replacement reviewer scored all three original findings resolved: hover contrast, complete short-phone inspector actions, and useful short-phone catalogue/editor/canvas composition. The original reviewer continuation stalled. The local `final-review.md` confirms the original fix list rather than repeating a full-surface audit.
- The single detector run found twenty-six advisories and no primary findings. Compact type/radius values and local preview, selection and canvas colors remain scoped to these surfaces.
- The documenter preserved `DESIGN.md`, `.impeccable/design.json` and shared token files. All forty frontmatter colors match the sidecar's canonical color metadata. Pre-existing root-document/sidecar coverage drift was recorded locally without repair.
- The published `orangeui-stickers@0.1.0` release retains its prior verified npm registry installation, matching tarball SHA-512, ESM/CommonJS, standalone CSS, React bundling and both NodeNext declaration modes.
- Canonical artwork, packaged component/CSS and the public versioned tarball are unchanged. This workspace update requires no new npm publication.

## Local preview

The shared dependency junction requires webpack in this worktree. Keep the original checkout, its dependencies and preview separate. The verified sticker preview uses port 3151 because another development server occupies 3150.

```powershell
$env:TEMP = (Resolve-Path .codex-tmp).Path
$env:TMP = $env:TEMP
node node_modules/next/dist/bin/next dev --webpack --port 3151
```

Production: `node node_modules/next/dist/bin/next build --webpack`, then `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3151`.

For the browser config, set `$env:STICKER_PREVIEW_URL = "http://127.0.0.1:3151"` before running `node node_modules/@playwright/test/cli.js test --config=playwright.sticker-pack.config.ts`. The default test URL remains port 3150 when that port is available.
