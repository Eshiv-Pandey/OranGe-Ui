# November 7 orb and media corrections

Changes remain local. No commit or push was made. The portfolio source at `E:\eshiv_pandey` was not edited.

| Area | Implemented files | Result |
| --- | --- | --- |
| AudioOrb | `components/ui/audio-orb.tsx`, `components/ui/shader-canvas/audio-orb.ts`, `styles/audio-orb.css`, `components/library/creative-demos.tsx`, `lib/creative-components.ts` | Adapts the actual MIT Live Orb color wash to coral, mint and blue, with smaller capsule eyes. Removes the separate rim and circular border layers. Music and microphone energy drive expansion and flow. |
| Transparent artwork | `components/ui/shader-canvas.tsx`, `components/ui/shader-canvas/types.ts`, `components/ui/shader-canvas/renderer.ts` | Adds typed `transparent?: boolean`, default false. AudioOrb opts into alpha; opaque source defaults remain supported. Changing this prop recreates the canvas and its context. |
| Mascot inspector | `components/library/component-demo.tsx`, `styles/creative-demos.css`, `styles/library-workspace.css` | Groups Character and Chat state as full-width stacked selectors with readable labels in desktop and mobile inspectors. |
| FlowingWater | `components/ui/flowing-water.tsx`, `components/library/flowing-water-demo.tsx`, `lib/shader-components.ts` | Enables click and touch ripples by default. `interaction={{ ripple: false }}` disables them. Pause and reduced motion suppress interaction. |
| FilmStrip | `styles/keepsake-galleries.css` | Uses content-sized grid rows and intrinsic photo dimensions so one uploaded photograph does not stretch to fill the vertical track. |
| GitHubGraph | `components/ui/github-graph.tsx`, `components/library/github-graph-demo.tsx`, `lib/github-graph-component.ts`, `GITHUB_GRAPH.md` | Sets `animationSpeed` to 1.75 and `ambientIntensity` to 1.1 by default, slightly calmer than the prior doubled settings. |
| Distribution and docs | `THIRD_PARTY_NOTICES.md`, `lib/source-bundle.ts`, `DESIGN.md`, `.impeccable/surfaces/components-library-component-detail-tsx.md` | Retains the MIT Live Orb attribution in source ZIPs and registry installation. Updates component material and interaction documentation. |
| Verification | `tests/orb-media.spec.ts`, `tests/orb-media-source.test.ts`, `tests/shader-canvas.test.tsx`, `playwright.orb-media.config.ts` | Checks responsive previews, alpha pixels, real audio energy, context loss/recovery, selector geometry, photo proportions, GPU ripple uniforms and portable TypeScript source. |

No new runtime dependency or artwork asset was added. Existing component exports and live routes remain available.

## Props and installation

AudioOrb retains `colors`, `size`, `speed`, `paused`, `audioLevel`, `getAnalyser`, `audioActive`, `tracks`, `showControls`, `sensitivity`, `eyeColor`, `showEyes`, `interactive`, `blink`, `theme`, `label` and appearance props. Defaults are coral/mint/blue, 320px, speed 0.6, sensitivity 1.6 and eye color #1d2328. Its WebGL budget is 180,000 pixels at 30fps. The full typed API is shown beside the live demo.

Use Download source or the registry command from each component page. For example:

```sh
npx shadcn@latest add "<library-origin>/r/audio-orb.json?style=polished"
```

Keep the bundled relative folders, styles and license files. All five appearance bundles were checked for project-alias imports; polished examples for AudioOrb, MascotAvatar, FlowingWater and FilmStrip were extracted and typechecked with strict TypeScript and the ES2020 target.

## Validation

Verified production build: `tTDwGhyA2Zy_4zNgj-Gzm`, with 124 generated pages.

- `npm run typecheck`, `npm run lint`, `npm run check:copy` and `npm run build` pass. Lint reports no warnings.
- All 56 focused unit and source-installation cases pass across five suites.
- All 12 production browser cases pass. The five-component matrix covers 320, 390, 768, 1440 and 1536px in light and dark, with no horizontal page overflow or runtime errors. Keyboard focus and selector activation, reduced-motion frames, transparent exterior pixels, one-photo proportions and graph defaults are verified.
- Playback and fake-device microphone input both produce live orb energy; stopping audio settles it. Context loss shows the capsule-eye fallback and restoration resumes WebGL.
- Clicking water sends an active ripple to the GPU; explicit opt-out removes and prevents ripples. This assertion observes GPU uniforms independently of ambient water animation.
- Exact-build bundle and source-trace checks pass. AudioOrb is 16,665 gzip bytes excluding host React and React DOM; the two installation routes retain the public support files and assets.
- The bounded final capture review found no remaining issue in this correction scope. Captures and contact sheets are in `.impeccable/review/orb-media-corrections/after/`; the scoped verdict is in `finish-review.md` beside that folder. Tests used headless Chromium, not a physical phone.

## Preview

The verified production preview is running at `http://127.0.0.1:3134`.

```powershell
npm run start -- --hostname 127.0.0.1 --port 3134
```

To repeat the browser checks:

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3134"
node node_modules/@playwright/test/cli.js test --config=playwright.orb-media.config.ts
```
