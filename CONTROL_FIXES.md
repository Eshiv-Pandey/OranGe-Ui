# Control fixes, 6 November 2026

The CustomStamp sidebar overlap, FluidColorPicker, HaloButton and side-view Helmet are updated in the UI library. Changes remain uncommitted and have not been pushed.

## Implementation

- `components/library/creative-demos.tsx` uses the shared EditorColor instead of the older inline swatch and code label. The stamp background is editable as hex as well as through the native picker.
- `styles/editor-controls.css` contains swatch and hex inputs in a shrinking grid. `styles/library-workspace.css` bounds inspector fields and allows labels to wrap within their own cells.
- `components/ui/fluid-color-picker.tsx` and `styles/fluid-color-picker.css` provide a larger color plane, hue/saturation/brightness gradients, checkerboard opacity, a glossy trigger, selected-preset marks and 44px swatch targets. Pointer capture works with touch dragging and ends on release or cancellation. Slider changes discard stale hex drafts. Alpha-free rendering and short-hex preset selection are normalized. Controlled ownership, validation, keyboard adjustments, Escape and outside dismissal remain supported.
- `components/ui/halo-button.tsx` and `styles/interaction-controls.css` give the rim a square animation layer, visible idle orbit and direct pointer tracking on hover. The neutral center is stable across stylesheet import order. Native button handlers, keyboard focus, disabled/loading and reduced-motion behavior remain intact.
- `components/ui/helmet-art.ts` and `styles/helmet-driver.css` retain the side-view artwork and temple mount. The glass rolls back 28 degrees over the brow while the hinge stays stationary. Live and exported frames share the same opening and 240-unit square viewBox.

The existing component exports, props, registry names and install paths remain compatible. No dependencies or artwork assets were added.

## Validation

- Typecheck, full lint, copy and production build pass. Build `P0MHCY40bZkxcEuDbetn_` generates 119 routes.
- Bundle-size and source-trace checks pass against that build ID.
- Six affected unit/source suites pass 94 cases. The final helmet angle also passes the 23 helmet cases on rerun.
- Twelve unique production browser cases pass: eleven in the final batch and the touch case on a focused rerun. The touch assertion allows the small HSV rounding introduced by controlled 8-bit hex values.
- All four components fit 320, 390, 768 and 1440px in light and dark themes. Checks cover inspector text/input clearance, horizontal overflow, color presets, keyboard editing and focus, invalid hex, alpha, outside dismissal, disabled/loading states, pointer tracking, touch dragging/release, reduced motion, visor bounds and portable exports. No runtime errors appeared in the size/theme matrix.
- Desktop and mobile screenshots and contact sheets are in `.impeccable/review/control-fixes/`. Browser checks used headless Chromium and emulated touch.

## Preview

The updated production preview is running at `http://127.0.0.1:3134`.

```powershell
npm.cmd run start -- --hostname 127.0.0.1 --port 3134
```

Repeat the browser checks against the preview:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3134'
node node_modules/@playwright/test/cli.js test --config=playwright.control-fixes.config.ts
```

Regression coverage is in `tests/control-fixes.spec.ts`, `tests/reference-components.test.tsx`, `tests/helmet-driver.test.tsx` and `tests/helmet-editor.test.tsx`.
