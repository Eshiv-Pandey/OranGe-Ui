# Reference landing scene

The new home page uses the supplied landscape reference, with HTML navigation and text above one raw WebGL2 canvas. The previous home page is preserved at `/classic`, including its original hero, component showcase and GamerBoy. `/pricing` describes the existing MIT license without inventing paid tiers.

## Files

- `app/page.tsx`: page composition, metadata, easy-to-edit text and links.
- `components/landing/reference-scene.tsx`: SSR fallback and accessible motion control.
- `components/landing/reference-renderer.ts`: one visibility-aware animation loop, WebGL resources, context restoration and cleanup.
- `components/landing/reference-shaders.ts`: rooted wind deformation, directional mist advection and additive sparkle shaders.
- `components/landing/reference-noise.ts`: a small deterministic noise lookup shared by the wind, mist and sparkles.
- `components/landing/reference-scene-config.ts`: wind strength/speed, gust speed, cloud speed/displacement, sparkle count/intensity/speed, grain, parallax, DPR cap and pixel budget.
- `styles/reference-landing.css`: reference-proportioned desktop layout and stacked mobile layout.
- `components/landing/reference-assets.py`: deterministic offline plate cleaning and photo-derived mask recipe.

## Scene layers and motion

All textures have the same 1199 x 805 image coordinates. A single cover transform drives the scene and the glitter. Portrait framing centers the person. The source photograph already supplies the foreground depth-of-field blur and color grade; these are preserved rather than re-created with global blur.

The flower mask is derived from purple hues and bright flower heads on the photographed terrain. Dark stems remain anchored. Slightly averaged head/tip masks let whole clumps bend together, with slower foreground movement and visible travelling gusts. Green grass follows with a smaller displacement. Clouds advance along a shared current with local billowing. Two staggered texture phases crossfade before resetting, bounding their travel and preserving the river's course. A deterministic distribution samples 1,800 glitter points from bright cloud/river pixels. Independent twinkles, occasional small star glints and fading particle lifetimes keep the luminous mist visibly alive.

The cloud current samples a 64 x 64 noise texture rather than evaluating nested fractal noise at every screen pixel. Displaced mist samples also check the sky matte, preventing the flattened photograph's hillside from being pulled into the sky. The renderer follows elapsed visible time, so movement keeps its intended speed at lower frame rates. Pointer easing also follows elapsed time. Cancelling the loop resets the previous timestamp, preventing a jump after pause, hidden-tab suspension or an offscreen interval.

The person mask follows the actual silhouette using GrabCut and includes a conservative 12-pixel safety margin. Both original and displaced sample positions are checked to prevent borrowing person pixels into surrounding clouds. The figure bypasses animated grain. Sparkle fragments also check the person and terrain masks, so drifting halos cannot cross either protected area. Motion pauses when the scene is offscreen, when the tab is hidden, or when the visitor chooses Pause scene. Reduced motion displays a fully still image. A photographic CSS background is present in the server HTML and remains visible while textures load or if WebGL2 fails. Context restoration rebuilds the renderer. DPR is capped at 2 and the drawing buffer at 1,600,000 pixels. Actual frame rate depends on device and GPU.

## Mask and layer export guide

The supplied flattened reference runs immediately using the provided masks. No additional asset is required to use this version. For more exact movement around individual stems or future larger displacements, replace these with hand-retouched exports from the original artwork:

| File | Export content |
| --- | --- |
| `reference-scene.png` | Clean full landscape with no baked-in interface, same crop and color profile. |
| `reference-flowers-mask.png` | Grayscale, black outside flowers. White at flower heads, fading toward black at rooted stems; include both foreground corners and the mid-ground clusters. |
| `reference-clouds-mask.png` | Grayscale, white on clouds/sky and the glowing river, black on hill and person. Feather cloud edges gently. |
| `reference-person-mask.png` | Grayscale, white on the crisp person silhouette and the protective margin. Black elsewhere. Keep the subject completely opaque. |
| `reference-grass-mask.png` | Grayscale, white only at grass tips. Keep roots, soil, flowers and person black. |
| `reference-person-silhouette.png` | Unexpanded subject matte retained for pixel verification and optional future separated layers; not loaded at runtime. |

Export every file on the original canvas without trimming or resizing. Use 8-bit PNG and the same sRGB profile. White permits displacement in the flower/cloud/grass masks; white prevents displacement in the person mask. Preserve the person protection margin and the shader's source/destination checks when increasing displacement. With genuinely separated artwork, optional RGBA layers would be `sky-clouds.png`, `person.png`, `hill-grass.png`, and `flowers.png`, all registered to the same full canvas; these are not required or loaded by the current single-plate renderer.

The photo-derived masks are deliberately conservative, so nearby clouds can move while the person remains fixed. They do not claim semantic precision for each flower stem. Areas originally obscured by the screenshot's interface are reconstructed from nearby texture. Their original hidden details cannot be recovered from the screenshot alone.

## Rebuild the provided assets

The script requires Python with Pillow, NumPy and OpenCV headless. These are offline preparation tools, not application dependencies.

```powershell
python components/landing/reference-assets.py path/to/image-5.png public/landing
```

Do not replace the source with a differently cropped image without updating the documented mask recipe. The script checks the source dimensions, preserves the provided artwork's grade and writes asset origin/processing metadata into each PNG.

## Motion regression coverage

`tests/reference-renderer.test.ts` exercises the real renderer with a controlled frame clock: one elapsed second at 10 fps, a zero first timestamp, exact pause, hidden-tab and reduced-motion suspension, resume without catching up, resource cleanup, context restoration and the large-display pixel budget. `tests/reference-motion.spec.ts` checks actual moving frames on desktop and mobile. It measures changes above the grain level separately in cloud and flower masks, requires zero changes to the person, and checks keyboard pause/resume, reduced motion, accessibility, unavailable WebGL and no-JavaScript navigation. Run it with `playwright.reference-motion.config.ts` against the current build.

New evidence lives under ignored `out/iteration/landing-motion/`. The original production build's failing motion and buffer-budget checks are retained in its `baseline/` directory. This regression coverage supersedes using any pixel change as proof that motion is perceptible.

The correction is verified on production build `lmjC8Ariy9I66Rjzn51Ul` on 2 November 2026. All ten focused unit tests and all five production browser cases pass, alongside lint, strict TypeScript, copy checks and the production build. The final moving-frame comparisons preserve all 5,150 desktop and 5,666 mobile subject pixels exactly. The terrain check uses a synthetic blue sky and red hill with the shipping masks and a late-cycle time offset; all three samples contain zero leaked red terrain pixels.

Moving-frame evidence copies the canvas in the renderer's animation frame, before its drawing buffer is cleared. This avoids screenshot stabilization waits accidentally sampling the same point in a wind cycle. The separate page captures retain the complete HTML layout. Timing receipts identify headless SwiftShader and do not establish a physical-device frame rate. Browser videos and `motion-preview.gif` provide temporal evidence alongside the PNGs.

## Earlier verification

Focused tests in `tests/reference-landing.test.tsx` cover image cover fitting, deterministic river-weighted sparkle placement, silhouette exclusion, SSR fallback, pause/resume/cleanup and reduced-motion control changes. Browser evidence is saved under ignored `out/iteration/reference-landing/` and is reported separately from those unit checks.

All seven focused tests pass. Development-browser checks verified WebGL2 at 1199 x 805, 1440 x 900 and 390 x 844, one displayed canvas, no runtime/accessibility/overflow failures, a working pause control and JavaScript-disabled fallback. Final moving-frame captures preserve all 5,150 tested person-silhouette pixels while flowers and clouds move. Glitter stays near luminous mist, with no particles in the upper sky.

`out/iteration/reference-landing/lifecycle-checks.json` verifies hidden-tab and reduced-motion suspension, context restoration, DPR 3 capped to 2 and unavailable-WebGL fallback. Hidden-tab and context-loss events are simulated browser checks. The independent review in `out/iteration/six-task/landing-review.md` returned `ship` for composition, responsive framing, material, typography, subject protection and localized motion.

The retained motion timing uses headless SwiftShader and does not establish a hardware frame rate. Missing historical comp-spec, build-phase and image-diff artifacts are not claimed as passed. [SIX_TASK_UPDATE.md](SIX_TASK_UPDATE.md) records production navigation, licensing, static fallback and preserved `/classic` regression results separately from the development visual evidence.
