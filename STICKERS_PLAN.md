# Sticker workspace expansion

Status: the fifth workspace refinement passed a fresh `ship` review with no material fixes. Production build, TypeScript, twenty-six focused unit tests, seven final browser checks, scoped ESLint, copy and whitespace checks passed. The verified `orangeui-stickers@0.1.2` tarball is ready; npm publication is awaiting account 2FA. The earlier public releases remain recorded as history.

## Scope

Keep the established seventy named designs and both playful and sharp finishes. The fifth pass refines recognition of Peace hand, Moka morning, Pocket play, Comet tail, Bubble tea, Infinity ribbon and Link knot with matching silhouettes and facets. Both finishes use precise painted geometry, black outlines and die-cut paper margins. Sharp retains saturated fills and the applicable facets. Preserve the existing oRangeUi neutral workspace and the right-side inspector.

Click motion remains bounce, wiggle, spin or none. Size, rotation, duration, intensity and shadow are editable. Hover or keyboard focus raises artwork eight pixels with a stronger short wiggle and optional soft elevated shadow; the legacy hoverPeel prop enables the same treatment on static artwork. Reduced motion and touch-only devices disable hover movement. The complete die-cut artwork stays within its exported SVG, with painted details contained by the silhouette. Search fields use one continuous focus border without a nested input outline.

## Delivered surfaces and exports

- `/stickers`: compact introduction, searchable collection, Everyday favorites first, Sharp/Playful choice, a compact right-side inspector and one Playground launcher. Phones open the inspector after sticker selection.
- Inspector and native modal editor: shared Appearance/Motion tabs keep the complete property controls and copy/download actions visible without internal scrolling. Native dropdowns have a consistent visible chevron. A labelled Custom color control opens the real color picker beside background presets. Preview colors change the editing surface while exported artwork remains transparent.
- Playground: a full-window native workspace with a larger measured canvas and a narrower right sidebar, with tools below the canvas on phones. Stickers/Edit/Layers/Canvas panes keep each task short. The denser three-column tray measures available height and shows up to thirty stickers per page. Arrangements survive closing and reopening the workspace.
- Preview: the canvas fills the entire viewport without letterbox bars. It requests browser fullscreen when available and retains the same clean window-filling view if denied. Normalized anchors follow its width and height while SVG artwork remains square. Existing stickers support drag and keyboard placement; deletion is protected and editing chrome is hidden. Completed drags create one undo step, interrupted drags roll back, and Escape or Back to editor restores the editor and returns focus to Preview.
- Place and drag beyond the canvas edges, keyboard nudge, resize/rotate, duplicate, visible selected-sticker X removal and undo. X/Y coordinates allow -50% through 150%; the deliberate crop is preserved in exports. Layers support native drag, pointer grips and keyboard forward/back controls; the top list item paints in front. The eighty-item limit remains.
- Canvas backgrounds use a native color picker, palette presets or transparency. On solid custom backgrounds, caption lettering selects the readable neutral foreground or falls back to black/white for at least 4.5:1 contrast. This content-caption correction also reaches React/HTML exports; custom canvas colors survive every scene format.
- Themed React/HTML/JSON radio choices support keyboard navigation. Copy/download retains each placement's finish and animation settings. React and self-contained HTML match the responsive full-viewport Preview; React accepts a height prop for embedding. JSON identifies viewport layout and keeps logical 960 x 600 size units.
- `Sticker` and seventy named components ship through the existing source ZIP and registry workflows.
- `/api/stickers`: seventy designs in both finishes (140 SVGs); `?finish=sharp` or `?finish=playful` selects one edition.
- `orangeui-stickers@0.1.2`: locally verified React package with ESM, CommonJS, TypeScript and standalone CSS. The tested tarball is served at `/downloads/orangeui-stickers-0.1.2.tgz`; npm publication is awaiting account 2FA. The earlier `0.1.0` and `0.1.1` tarballs remain intact.

## Package build and consumer verification

```powershell
node packages/stickers/scripts/test-package.mjs --release --registry
```

The package consumer check installs the real tarball in an isolated project, renders all designs in both finishes through ESM/CommonJS, bundles React and CSS without Next.js/Tailwind/fonts, and checks NodeNext ESM/CommonJS declarations. Preserve the intentional public tarball when changing package source.

The final release check installs both the local tarball and the published registry version. Earlier registry releases passed with matching exact SHA-512 integrity; the 0.1.2 registry check follows publication. Local tarball verification alone remains insufficient evidence of a future version's registry availability.

## Fifth workspace refinement verification, November 13, 2026

- Production webpack build and TypeScript passed with existing shared named-version-import advisories. The machine exhausted memory with eleven page-generation workers; a one-worker build succeeded without changing application configuration.
- Seven focused unit files with twenty-six tests passed, followed by the final artwork/source checks. Scoped ESLint, copy and whitespace checks passed.
- Seven final browser checks passed across the initial successful matrix/export/editor/layer checks and the three affected confirmations. Initial test-only failures compared raw CSS serialization after correct undo and targeted a sticker outside the first tray page; geometry comparisons and a visible Orbit snail target corrected them. Application source and the 120 captures stayed unchanged.
- Five viewport sizes in both themes produced 120 valid captures. Scanned gallery/editor/playground accessibility violations and page errors were zero. Native and fallback Preview fill the viewport, support existing drag/keyboard movement, protect deletion, preserve undo and produce matching standalone HTML bounds without network requests.
- All fourteen revised padded 512px variants have zero outside pixels. Metadata, names and the other sixty-three artwork definitions were preserved. Browser export checks cover all 140 variants.
- The fresh reviewer returned `ship` with no material fixes at this refinement scope. The documenter preserved `DESIGN.md`, the sidecar and shared tokens; pre-existing sidecar coverage drift remains outside scope.
- Isolated local package verification passed all seventy designs in both finishes, ESM/CommonJS rendering, standalone CSS, React bundling, Bundler declarations and both NodeNext declaration modes. Registry verification follows publication.

## Fourth workspace refinement verification, November 12, 2026

- Production webpack build and TypeScript passed. The existing shared named-version-import advisories remain.
- Seven focused unit files with twenty-four tests passed. Final scoped ESLint, copy and whitespace checks passed.
- All six final production-browser tests passed with zero skips, unexpected results or flakiness in `out/iteration/stickers/browser-v4-report.json`. They cover all 140 transparent SVG exports and artwork bounds, ZIP/registry source delivery including contours, compact editor settings and exports, free edge placement, removal/undo, layer reordering, portable custom colors, fullscreen denial and exit behavior, scene persistence, focus restoration, hover wiggle and reduced motion.
- Ninety captures cover nine surface states at 1536x772, 1440x900, 390x844, 320x780 and 320x568 in both palettes. Every decoded capture is valid in the local `stickers-v4/contact-sheets/capture-validity.json`. The accessibility record for the scanned gallery, editor and playground states is an empty violation list. The browser checks found no page errors.
- `out/iteration/stickers/npm/package-report.json` records publicly published `orangeui-stickers@0.1.1`, seventy designs and both finishes, with passing isolated local and registry installation, ESM/CommonJS rendering, React/CSS bundling, Bundler declarations and both NodeNext declaration modes. The packed files include contour declarations. Registry and local tarballs have matching exact SHA-512 integrity. The release tarball is copied to `public/downloads/orangeui-stickers-0.1.1.tgz`.
- The fresh reviewer returned `disposition: ship` at the v4 refinement scope with no material fixes. `.impeccable/review/stickers-v4/final-review.md` records inspection of the saved five-viewport render matrix, the all-140 artwork sheet and primary source samples with supplied functional evidence. The reviewer ran no browser, build or recapture and claimed no comp-based score. The v3 verdict below belongs to the prior pass.
- The documenter preserved `DESIGN.md`, `.impeccable/design.json` and shared token files. All forty normative frontmatter colors still match the sidecar's canonical metadata. Existing document/sidecar coverage drift remains local and unrepaired; sticker colors, geometry, motion and compact layout values stay scoped to this surface.
- After npm sign-in completed, `orangeui-stickers@0.1.1` publication succeeded as public latest. The registry briefly returned 404 while processing the release, then returned 200. The final `--release --registry` consumer check passed, including fresh registry installation and an exact local/registry SHA-512 match.

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
