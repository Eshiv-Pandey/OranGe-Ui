# Component follow-up

Status: complete and verified, 31 October 2026. This is the eight-task follow-up after the earlier 17-component rework.

1. Move the oRangeUi logo, collapse control and Search docs into a fixed sidebar header. Scroll navigation independently, retain a compact collapsed rail and provide mobile navigation.
2. Make AnimeFire discoverable, configurable and visually appropriate in all five appearances, including source downloads.
3. Give SeasonTree the same five-appearance support without losing seasons, wind, falling leaves or pause.
4. Redraw Superbike as a detailed side-on racing motorcycle following the two supplied references, without their branding. Preserve editable livery, motion and exports.
5. Redraw MiniDriver facing forward with visible blinking eyes, a large helmet, smaller ears and free hands. Add automatic waves and thumbs-up gestures, direct interaction and pause controls.
6. Connect RetroPlayer's earphones to its body and align the click-wheel labels and controls.
7. Add punchier palettes to the bike, car, helmet, mascots and related artwork while retaining custom colors.
8. Expand CharacterAvatar variety and improve facial, hair and clothing definition with punchier colors.

The five supplied images are available locally and remain private reference material. Preserve the established oRangeUi identity and all existing public APIs unless an additive API is needed.

Verification must include behavior and export checks for changed components, all five appearances for the tree and fire, desktop/mobile sidebar behavior, keyboard and reduced-motion behavior, visual comparison against the references, source portability, lint, TypeScript and a production build. Record exact results here and in STATUS.md, then commit and ordinarily push verified changes.

## Delivered behavior

- The desktop sidebar has a fixed brand, collapse control and Search docs header, independent navigation scrolling and a persistent 64px collapsed rail. Mobile keeps search and navigation in the header. Ctrl+K opens one search dialog and preserves the selected appearance when navigating.
- AnimeFire and SeasonTree appear in all five collections, demos and source downloads. Fire has smooth, pixel, ink-outline, dithered and terminal-cell rendering. Tree foliage and season controls follow the selected appearance, with existing seasons, wind, falling leaves and pause preserved.
- Superbike has a revised side-on tank, tail, fairings, exposed engine and frame, ducts, fasteners and brakes. The initial editor hides the track; users can still enable it. Custom livery, physics, rider and exports remain available.
- MiniDriver has a front-facing helmet, two visible blinking eyes, smaller ears, separate free-hand poses and automatic waves/thumbs up. Clicking the driver waves; demo controls offer thumbs up and pause/resume. New props are additive: `autoGestures`, `paused`, `onPausedChange` and `showControls`. Mobile sizing includes the controls and caption inside the preview.
- RetroPlayer's earphone cable joins a plug anchored to the player body. Wheel controls and labels are centered. Real playback, seeking and track changes remain functional.
- Vehicle, helmet, mascot and character presets use more saturated palettes while retaining custom colors. CharacterAvatar now offers seven hair styles, seven outfits and four face shapes, including new hair silhouettes, seams, collars, straps and garment details.

## Verification

Final application build: `RvaA6UgP0JwZElqdVNPV8`. The main 47-case browser run used `fi1E_hr-5CZDR36xkQKw4`; the seven-case review refresh used `yUDMVTTeHrrw69Cz03eGu`. The final build corrects only AnimeFire's documented appearance-dependent defaults and passes the mobile navigation/theme/prop-table smoke check, build, lint, copy, bundle and trace checks.

| Check | Result |
| --- | --- |
| Unit and source coverage | 468 cases across 36 files pass: 445 non-source cases and 23 source cases; final affected refresh passes 41 cases |
| Portable source compilation | All 410 component examples and 30 avatar utility modules compile and bundle with zero diagnostics |
| Follow-up browser suite | All 7 cases covered by passing results, including 40 fire/tree appearance/theme/viewport accessibility observations and 14 artwork/player accessibility and overflow observations |
| Artwork controls and exports | 18 pass: three editor flows and 15 exact SVG/PNG/settled-preview comparisons |
| Vehicle controls and exports | 13 pass: three editor flows and 10 exact car/bike export comparisons |
| Motion | 3 pass for gaze, actual rendered blink, keyboard reactions, visibility and reduced-motion behavior; follow-up suite also verifies automatic greetings and pause/resume |
| Creative behavior | 4 pass for collection/source navigation, seasons, RetroPlayer audio and AnimeFire WebGL/context restoration/lifecycle |
| Inspector layout | 2 pass for independent desktop scrolling and mobile pinned previews |
| Quality and build | Lint, strict TypeScript, copy check and production build pass |
| Bundle and deployment traces | Pass against final build; each source route retains 200 public files plus 12 runtime files |

The 47 targeted browser cases run in Chromium, using emulated touch where applicable. The short blink is captured inside the page rather than sampled through browser round trips. The final full-page desktop/mobile captures and appearance contact sheets are kept locally under `.impeccable/review/`; logs and the 54 individual appearance/artwork captures are under ignored `out/rework-followup/`. Source portability evidence is in ignored `out/download-validation/`.

The final follow-up run records six passes in `browser.log`; its desktop matrix timed out while the deferred preview was still loading during concurrent captures. The unchanged desktop test passes in the isolated `browser-desktop-recheck.log`, completing all seven cases on that build. The retained main JSON report deliberately preserves that first failure instead of replacing its history.

The manual design detector reports one unchanged camera D-pad bevel outside this follow-up's scope. It reports no finding on the changed sidebar or artwork. The independent visual review confirmed the artwork direction and requested two mobile fixes: restore the theme-mode icon and stop prop identifiers from fragmenting. The icon wrapper is now visible; tables use readable column widths, a visible horizontal-scroll hint and keyboard-accessible scrolling. A fresh replacement verdict reviewer scored both fixes resolved and returned `ship` after the original review session failed with a payload-size error. That verdict applies to the two recorded fixes, preserving the scope of the completed initial review.

The documentation comparison confirms that the incumbent palette, typography, five appearances, original artwork construction and saved configurations are preserved. It verified the AnimeFire default correction and the split browser receipts. The comparison report and review evidence remain local. No requested follow-up task is deferred.
