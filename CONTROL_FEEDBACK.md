# Control feedback, 9 November 2026

PromptInput, Combobox, Rating and Command now use one focus indicator on their visible control. Their inner fields and hidden radios suppress the shared outline and focus shadow. Rating selection is shown by the filled stars. Keyboard focus remains neutral and visible.

Combobox has balanced input/action spacing, a compact clear button and a quiet active-option background. Filtering, selection, clearing, form values and keyboard navigation retain their existing behavior.

Calendar month and year selectors use the shared themed Select menus with bounded scrolling, selected checks and compact rows. Date bounds, disabled months, controlled values, leap years and date-grid navigation remain supported. Select accepts an optional `contentClassName` for scoped popup styling.

WallSwitch has a square screwless plate, a narrower recessed rocker, subtle neutral shading and reversible tilt. The Radix switch retains its label, keyboard activation, controlled state, form support and disabled behavior.

InputOTP's playground exposes Numbers only and Letters and numbers. Alphanumeric entry accepts typing and paste, normalizes letters to uppercase and retains native editing. The component's numeric default remains compatible with existing consumers.

Toast notifications fit inside the playground stage and sit above its floating navigation. Small-screen toasts place Undo below the message and keep Dismiss at the top right.

## Verification

The affected behavior suites pass 51 cases. All 9 production browser cases pass, covering 320, 390, 768 and 1440px in both palettes and singular focus across all five appearances. The production build, typecheck, lint, copy, bundle-size and source-trace checks pass. Seven portable-source batches compile and bundle 140 examples with zero diagnostics.

Desktop/mobile, palette, appearance and portable-source validation are recorded in `out/iteration/control-feedback/report.json` and `out/download-validation/report.json`. The latter is an affected-source run, not a full catalogue rerun. Browser checks use Chromium and emulated mobile viewports.

Before/after screenshots are stored locally in `.impeccable/review/control-feedback/`.

## Preview

The production preview uses `http://127.0.0.1:3134`.

```powershell
npm.cmd run start -- --hostname 127.0.0.1 --port 3134
```

Run the affected browser checks against it:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3134'
node node_modules/@playwright/test/cli.js test --config=playwright.control-feedback.config.ts
```
