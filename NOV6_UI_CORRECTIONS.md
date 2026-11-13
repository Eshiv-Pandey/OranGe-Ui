# November 6 component corrections

All changes remain local. No commit or push was made. The portfolio at `E:\eshiv_pandey` was read on disk and was not edited.

## Implemented files

| Area | Files | Result |
| --- | --- | --- |
| Preview surfaces | `styles/library-workspace.css`, `components/library/portfolio-demos.tsx`, `styles/portfolio-demos.css` | Removed the older mobile white background and the extra portfolio preview rectangle. The preview inherits the normal light or dark workspace surface. Social instructions describe hover and keyboard focus; the irrelevant decoration toggle is omitted for social stickers. |
| Banner stars | `components/ui/portfolio-banner.tsx`, `components/ui/portfolio/nebula-background.tsx` | Uses the current portfolio source's sparse glowing star shader. Star radii and positions are measured in CSS pixels, with the drawing-buffer scale passed to the shader. The existing nebula, petals, truck, clock, visibility scheduling and render budget remain available. |
| Helmet | `components/ui/helmet-art.ts`, `styles/helmet-driver.css` | Restored the side-profile shell and temple-pivot glass. Pointer motion, native button activation, configurable paint and settled SVG exports remain supported. Raised visor exports use the original expanded square viewBox. |
| Journal | `components/ui/journal-stack.tsx`, `styles/keepsake-galleries.css`, `lib/reference-components.ts` | One stationary bound book replaces the fanned collection of spreads. A double-sided leaf turns at the central spine with paper shading. Buttons, tapping either page, horizontal swipes, arrow keys and Home/End change the spread. Controlled values, empty photos and reduced motion are supported. Reduced motion renders the selected spread immediately. |
| Character separation | `components/ui/character-art.ts`, `components/ui/character-avatar.tsx`, `components/library/character-demos.tsx`, `lib/components.ts` | Male and female presets have separate generated hair choices. Male swept hair has its own short silhouette. Facial hair is limited to male identities, and Randomize retains the selected group. Legacy version 1 configuration data remains accepted. |
| Avatar animation | `styles/avatar.css` | Animate now visibly tilts, lifts and scales the glyph through a 2.4-second cycle while retaining the animated gradient. Stopping animation returns to the settled pose; reduced motion disables it. |
| Verification | `tests/latest-refinements.spec.ts`, `playwright.latest-refinements.config.ts`, updates to the character, helmet, gallery and source tests | Covers the new appearance and interaction contracts, including animation displacement, one book, reverse page turning, touch click suppression and portable reduced-motion support. |

Existing component props remain supported. `generateCharacterConfig(seed, gender?)` now accepts an optional `"male" | "female"` second argument. `CHARACTER_MALE_HAIR` and `CHARACTER_FEMALE_HAIR` are exported through CharacterAvatar for consumers building their own editor.

No new runtime packages or artwork assets were needed. Registry and source downloads continue to resolve the changed support files, including the journal's reduced-motion hook.

## Validation

- `npm run typecheck`, `npm run lint`, `npm run check:copy` and `npm run build` pass. The final production build is `8b2yqjukqQ_sVhLyGOhMB` and generates 119 routes.
- Bundle-size and source-trace checks pass against that exact build ID. Both download routes retain their public source files and portable assets.
- Affected character, helmet, avatar, gallery, landing renderer and portable-source unit suites pass. The five initial affected suites passed 95 cases; subsequent focused checks cover the revised generation and journal hook dependencies.
- All 12 new production browser cases pass. Six previews fit 320, 390, 768 and 1440px in light and dark with no horizontal overflow or runtime errors. Bright star cores are checked in mobile dark previews. Book turns, reverse navigation, touch, focus, reduced motion, separate character presets and visible Avatar Editor animation are verified.
- All 9 landing-motion cases pass, including anchored bird bodies with slow wingbeats, moving clouds and trees, the orange leaf, reduced motion, terrain isolation, context restoration and static fallbacks.
- All 29 portfolio regression cases pass, including sample footer content, centered responsive socials, missing hover-card data, keyboard focus, truck touch restart and callback, player interactions and portable helmet exports. These ran before the final source-star shader refresh; the refreshed banner is included in the final 12-case matrix and portable-source checks.
- Final visual evidence is under `.impeccable/review/nov6/after/`, with desktop/mobile contact sheets under `.impeccable/review/nov6/`. Testing used headless Chromium rather than a physical phone.

## Pending reference

The supplied handoff contains Image #1 and Image #2 labels without their image contents. Exact matching of the requested avatar skin and expressions remains pending Image #2 or its local path. Skin colors and expression artwork were retained rather than inventing that missing reference.

## Preview

The production preview is running at `http://127.0.0.1:3134`.

```powershell
npm run start -- --hostname 127.0.0.1 --port 3134
```

To repeat the new browser checks against that preview:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3134"
node node_modules/@playwright/test/cli.js test --config=playwright.latest-refinements.config.ts
```
