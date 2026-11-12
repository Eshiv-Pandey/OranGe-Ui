# Sticker workspace expansion

Status: the fourth workspace refinement is complete with a fresh `ship` verdict at the v4 refinement scope. Production build, TypeScript, seven focused unit files with twenty-four tests, all six final browser tests, scoped ESLint, copy and whitespace checks passed. The `orangeui-stickers@0.1.1` tarball and isolated consumer checks are complete. Npm registry publication is pending completion of web sign-in after authentication expired. The earlier published release remains `orangeui-stickers@0.1.0`.

## Scope

Keep the established seventy named designs and both playful and sharp finishes. The fourth pass redraws the requested hand, pencil, moon, comet, satellite, sun, cube, flag, pinwheel, music note and ribbon motifs. Both finishes use precise painted silhouettes, black outlines and die-cut paper margins. Sharp retains saturated fills and the applicable enamel facets. Preserve the existing oRangeUi neutral workspace and the right-side inspector.

Click motion remains bounce, wiggle, spin or none. Size, rotation, duration, intensity and shadow are editable. Interactive stickers rise and wiggle on hover or keyboard focus; the legacy hoverPeel prop enables the same treatment on static artwork. Reduced motion and touch-only devices disable hover movement. The complete die-cut artwork stays within its exported SVG, with painted details contained by the silhouette.

## Delivered surfaces and exports

- `/stickers`: compact introduction, searchable collection, Everyday favorites first, Sharp/Playful choice, a compact right-side inspector and one Playground launcher. Phones open the inspector after sticker selection.
- Inspector and native modal editor: shared Appearance/Motion tabs keep the complete property controls and copy/download actions visible without internal scrolling. Native dropdowns have a consistent visible chevron. A labelled Custom color control opens the real color picker beside background presets. Preview colors change the editing surface while exported artwork remains transparent.
- Playground: a full-window native workspace with a larger measured canvas and a narrower right sidebar, with tools below the canvas on phones. Stickers/Edit/Layers/Canvas panes keep each task short. The denser three-column tray measures available height and shows up to thirty stickers per page. Arrangements survive closing and reopening the workspace.
- Preview: an explicit Preview action fills the window with the arranged artwork and a Back to editor control. It requests browser fullscreen when available and retains the same clean preview if fullscreen is denied. Editing chrome, selection frames and removal controls are hidden, and drag, keyboard placement and deletion are disabled. Sticker activation still plays its chosen motion. Escape or Back to editor restores the editor and returns focus to Preview without changing the scene.
- Place and drag beyond the canvas edges, keyboard nudge, resize/rotate, duplicate, visible selected-sticker X removal and undo. X/Y coordinates allow -50% through 150%; the deliberate crop is preserved in exports. Layers support native drag, pointer grips and keyboard forward/back controls; the top list item paints in front. The eighty-item limit remains.
- Canvas backgrounds use a native color picker, palette presets or transparency. On solid custom backgrounds, caption lettering selects the readable neutral foreground or falls back to black/white for at least 4.5:1 contrast. This content-caption correction also reaches React/HTML exports; custom canvas colors survive every scene format.
- Copy/download React, self-contained HTML and JSON canvas layouts. Each placement retains its own finish and animation settings.
- `Sticker` and seventy named components ship through the existing source ZIP and registry workflows.
- `/api/stickers`: seventy designs in both finishes (140 SVGs); `?finish=sharp` or `?finish=playful` selects one edition.
- `orangeui-stickers@0.1.1`: React peer dependencies, ESM, CommonJS, TypeScript and standalone CSS. The tested tarball is served locally at `/downloads/orangeui-stickers-0.1.1.tgz` and can be installed by its file path or preview URL. This version includes the new contours and hover motion. Registry publication is pending; the earlier `0.1.0` registry release remains historical verified evidence.

## Package build and consumer verification

```powershell
node packages/stickers/scripts/test-package.mjs --release
```

The package consumer check installs the real tarball in an isolated project, renders all designs in both finishes through ESM/CommonJS, bundles React and CSS without Next.js/Tailwind/fonts, and checks NodeNext ESM/CommonJS declarations. Preserve the intentional public tarball when changing package source.

Run the additional `--registry` check only after publishing the new version. A passing local tarball consumer check does not establish npm registry availability.

## Fourth workspace refinement verification, November 12, 2026

- Production webpack build and TypeScript passed. The existing shared named-version-import advisories remain.
- Seven focused unit files with twenty-four tests passed. Final scoped ESLint, copy and whitespace checks passed.
- All six final production-browser tests passed with zero skips, unexpected results or flakiness in `out/iteration/stickers/browser-v4-report.json`. They cover all 140 transparent SVG exports and artwork bounds, ZIP/registry source delivery including contours, compact editor settings and exports, free edge placement, removal/undo, layer reordering, portable custom colors, fullscreen denial and exit behavior, scene persistence, focus restoration, hover wiggle and reduced motion.
- Ninety captures cover nine surface states at 1536x772, 1440x900, 390x844, 320x780 and 320x568 in both palettes. Every decoded capture is valid in the local `stickers-v4/contact-sheets/capture-validity.json`. The accessibility record for the scanned gallery, editor and playground states is an empty violation list. The browser checks found no page errors.
- `out/iteration/stickers/npm/package-report.json` records `orangeui-stickers@0.1.1`, seventy designs and both finishes, with passing isolated installation, ESM/CommonJS rendering, React/CSS bundling and both NodeNext declaration modes. The packed files include contour declarations. The release tarball is copied to `public/downloads/orangeui-stickers-0.1.1.tgz`.
- The fresh reviewer returned `disposition: ship` at the v4 refinement scope with no material fixes. `.impeccable/review/stickers-v4/final-review.md` records inspection of the saved five-viewport render matrix, the all-140 artwork sheet and primary source samples with supplied functional evidence. The reviewer ran no browser, build or recapture and claimed no comp-based score. The v3 verdict below belongs to the prior pass.
- The documenter preserved `DESIGN.md`, `.impeccable/design.json` and shared token files. All forty normative frontmatter colors still match the sidecar's canonical metadata. Existing document/sidecar coverage drift remains local and unrepaired; sticker colors, geometry, motion and compact layout values stay scoped to this surface.
- Npm registry authentication returned 401 and a new web sign-in is awaiting completion, so `orangeui-stickers@0.1.1` publication remains pending. The local tarball is tested, and no new registry installation or integrity match is claimed.

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
