# Sticker workspace expansion

Status: implementation and verification complete. The npm package is published and registry installation is verified. The finish reviewer scored both final mobile layout and finish-comparison fixes resolved.

## Scope

Keep the original fifty playful designs and add twenty original Everyday designs. All seventy support playful and sharp finishes. Sharp uses saturated fills, finer contours, white trim and individual enamel facets. Preserve the existing oRangeUi neutral workspace and the right-side inspector.

Replace the rejected diagonal peel with original click motion: bounce, wiggle, spin or none. Size, rotation, duration, intensity and shadow are editable. Reduced motion keeps all artwork still. The legacy hoverPeel prop now offers a gentle full-sticker hover lift without clipping.

## Delivered surfaces and exports

- `/stickers`: searchable collection, Everyday favorites first, Sharp/Playful choice, live right-side inspector and a native modal editor with more controls.
- Playground: place and drag stickers, keyboard nudge, resize/rotate, layers, duplicate/remove/front, undo, backgrounds and caption. Arrangements survive workspace tab switches.
- Copy/download React, self-contained HTML and JSON canvas layouts. Each placement retains its own finish and animation settings.
- `Sticker` and seventy named components ship through the existing source ZIP and registry workflows.
- `/api/stickers`: seventy designs in both finishes (140 SVGs); `?finish=sharp` or `?finish=playful` selects one edition.
- `orangeui-stickers@0.1.0`: React peer dependencies, ESM, CommonJS, TypeScript and standalone CSS. The tested tarball is served at `/downloads/orangeui-stickers-0.1.0.tgz`, so npm can install it from the website URL today. `npm install orangeui-stickers@0.1.0` is verified against the published registry package.

## Package build and consumer verification

```powershell
node packages/stickers/scripts/test-package.mjs --release --registry
```

The package consumer check installs the real tarball in an isolated project, renders all designs in both finishes through ESM/CommonJS, bundles React and CSS without Next.js/Tailwind/fonts, and checks NodeNext ESM/CommonJS declarations. Preserve the intentional public tarball when changing package source.

## Verification, November 12, 2026

- Production webpack build and TypeScript passed. Existing named version-import advisories remain in the shared library shell and getting-started component.
- Five focused unit files, sixteen tests passed. Focused ESLint, copy and staged whitespace checks passed.
- Four browser tests passed with no failures, skips or flakiness. They cover all 140 transparent artwork exports, source/registry installation, editor settings and focus, playground dragging/keyboard/export behavior, and maximum-size animation bounds.
- The final mobile review confirmation passed in both palettes at 1440px, 390px and 320px, with zero Axe findings. Phone titles have two actual text rows; the first card ends at 747px and 764px respectively. All 54 original capture views were refreshed, with labeled Sharp/Playful comparisons added.
- Fresh npm registry installation and matching tarball SHA-512 verify `orangeui-stickers@0.1.0`, all seventy designs in both finishes, ESM/CommonJS, standalone CSS, React bundling and both NodeNext declaration modes.
- The documenter preserved `DESIGN.md` and `.impeccable/design.json`. Existing narrative drift in the sidecar was reported without changing shared tokens.
- The fresh finish review required a compact phone introduction and direct finish comparison. Both were resolved in the final verdict. The review was restarted once after an image-limit failure.

## Local preview

The shared dependency junction requires webpack in this worktree. Keep the original checkout, its dependencies and preview separate. The verified sticker preview uses port 3151 because another development server occupies 3150.

```powershell
$env:TEMP = (Resolve-Path .codex-tmp).Path
$env:TMP = $env:TEMP
node node_modules/next/dist/bin/next dev --webpack --port 3151
```

Production: `node node_modules/next/dist/bin/next build --webpack`, then `node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3151`.

For the browser config, set `$env:STICKER_PREVIEW_URL = "http://127.0.0.1:3151"` before running `node node_modules/@playwright/test/cli.js test --config=playwright.sticker-pack.config.ts`. The default test URL remains port 3150 when that port is available.
