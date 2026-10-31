# Component rework

The 31 October 2026 rework follows the supplied visual references while keeping the artwork original and editable. Reference images stay local and are not distributed. The catalogue now has 82 entries after merging the duplicate livery and helmet editor pages into their component pages.

## Scope and implementation

| Request | Implementation | Verification |
| --- | --- | --- |
| Shared editor layout | Wide preview, right-hand properties panel, independent desktop scrolling and pinned mobile artwork | Desktop/mobile captures and editor scrolling tests |
| Default dark theme | Server HTML defaults to dark; explicit saved light choice is preserved | Fresh-storage and reload browser test |
| SwingKeychain | Transparent stage, shaped enamel charms, linked tethers, fixed-step weighted physics, metallic contact synthesis | Physics regressions, pointer/keyboard interaction and captured audio buffer |
| RetroCamera | Both-side preview option, explicit flip labels, right-side filters and sticker editing | Live fake camera, zoom, capture, download, cleanup and layout checks |
| RetroPlayer | Refined device, screen, click wheel and cable; right-side sticker tools | Real playback, seeking, track changes and cleanup |
| SeasonTree | Connected canopy, exposed branches, irregular pixel shading and transparent backdrop | Season transition, canvas and viewport checks |
| CharacterAvatar | Three-quarter face, swept hair, glasses and detailed jacket; reference-led default | Config, gaze, export and viewport checks |
| Helmet | Detailed side profile, pivoting visor, transparent background and original livery | Keyboard visor, normalized config and export checks |
| MascotAvatar | Stronger silhouettes, expressions, original cap and paw details | All eight kinds, chat states and pointer reactions |
| MiniDriver | Revised helmet and suit details with larger preview | Wave, gaze and export checks |
| OpenWheelCar | Sculpted body, cockpit, aero, floor and wheel details | Vehicle art, suspension and motion checks |
| Superbike | Revised tank, fairing, tail, windscreen, brakes and swingarm; optional rider | Vehicle art/motion and riderless preview |
| Music players | Revised Island, Glass and Neon proportions, cover art, typography and transport controls | Playback, seek, mute, like/share and touch expansion |
| AnimeFire | Broad layered flames with curling tips and fire ambience synthesis | WebGL lifecycle and sound gating checks |
| GrainGradient | Flowing pigment field, editable palettes and fullscreen view with fallback | WebGL pixels, controls, export, fullscreen and focus return |
| FrostedGlass | Original botanical render, stronger glass material and readable cutout type | Drawing, reset, regrowth and fractional resize regression |
| TiltStamp3D | Original modeled flowers, distinct paper and color swatch, clearer depth | Tilt, spring return and viewport checks |
| Duplicate entries | LiveryEditor and HelmetEditor removed from catalogue/navigation; page redirects retained | Catalogue and redirect tests |

The reusable editor APIs remain available for existing consumers. SVG exports use the same geometry as the interactive components. New botanical artwork is modeled locally and embedded in portable source modules. No reference logos, album covers, character assets or vendor implementation code are included.

## Verification state

Implemented and verified on 31 October 2026. The 455-test full unit run passes across 35 files; the subsequent effects tests bring passing coverage to 457 distinct tests across 36 files. The final vehicle/effects run passes all 12 affected cases. Lint, TypeScript, copy checks, production build, standalone bundle isolation and both deployment-source traces pass. Final build: `jLcfFzglubClyY06mqxuv`.

- All 24 creative browser scenarios pass. The final six-case layout, accessibility, frost-resize and high-density refresh also passes, including 56 desktop/mobile observations across both themes.
- All five rework regressions pass: dark default and saved light choice, catalogue aliases, independent desktop scrolling, pinned mobile artwork, and native/fallback fullscreen with focus restoration.
- All 15 character/helmet/driver export scenarios and all 10 car/bike export scenarios pass across five appearances. SVG, PNG and settled previews match exactly. The five bike export cases pass again after correcting the optional rider's accessible export label.
- All three canonical car, bike and helmet editor flows pass, including keyboard tabs, saved configuration, colors, motion, scene controls and the optional rider.
- Fourteen final character, mascot, helmet, driver, vehicle and AvatarEditor viewport/accessibility observations pass at 1366x768 and 390x844, with no runtime errors or horizontal overflow. Desktop/mobile contact sheets and the expanded Neon player were visually reviewed.
- Both source routes retain 197 public files plus 12 runtime files, without private instructions, references or verification artifacts.

The main creative behavior and character exports use build `Wdj2ainHJKLQNtmFWR2kA`. Layout, rework regressions and car/bike exports use `iZzKG0Q7eBSY71kZ5lnGs`. The final build changes only the bike export's accessible label and whitespace; its affected export and source checks were repeated. Evidence is retained under ignored `out/rework/`, `out/rework-character/`, `out/rework-physical/`, `out/rework-effects/` and `out/iteration/` directories.

Browser verification uses Chromium, emulated touch, a fake camera MediaStream and synthetic orientation events. Generated fire and keychain audio buffers and lifecycle behavior were checked; the sounds were not audibly auditioned. No physical-phone performance claim is made. No requested component is deferred.
