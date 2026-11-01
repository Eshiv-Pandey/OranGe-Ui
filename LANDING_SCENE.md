# Reference landing scene

The new home page uses the supplied landscape reference, with HTML navigation and text above one raw WebGL2 canvas. The previous home page is preserved at `/classic`, including its original hero, component showcase and GamerBoy. `/pricing` describes the existing MIT license without inventing paid tiers.

## Files

- `app/page.tsx`: page composition, metadata, easy-to-edit text and links.
- `components/landing/reference-scene.tsx`: SSR fallback and accessible motion control.
- `components/landing/reference-renderer.ts`: one visibility-aware animation loop, WebGL resources, context restoration and cleanup.
- `components/landing/reference-shaders.ts`: photographic displacement and additive sparkle shaders.
- `components/landing/reference-scene-config.ts`: wind strength/speed, gust speed, cloud speed/displacement, sparkle count/intensity, grain, parallax and DPR cap.
- `styles/reference-landing.css`: reference-proportioned desktop layout and stacked mobile layout.
- `components/landing/reference-assets.py`: deterministic offline plate cleaning and photo-derived mask recipe.

## Scene layers and motion

All textures have the same 1199 x 805 image coordinates. A single cover transform drives the scene and the glitter. Portrait framing centers the person. The source photograph already supplies the foreground depth-of-field blur and color grade; these are preserved rather than re-created with global blur.

The flower mask is derived from purple hues and bright flower heads on the photographed terrain. Dark stems remain anchored. Cluster phases, slower foreground movement and a travelling gust create the wind. Green grass has a much smaller displacement. Clouds use bounded domain-warped fractal noise, keeping the river recognizable. A deterministic distribution samples 1,400 glitter points from bright cloud/river pixels, excludes the person and twinkles each point independently. They use additive blending with a small halo.

The person mask follows the actual silhouette using GrabCut and includes a conservative 12-pixel safety margin. Both original and displaced sample positions are checked to prevent borrowing person pixels into surrounding clouds. The figure bypasses animated grain. Motion pauses when the scene is offscreen, when the tab is hidden, or when the visitor chooses Pause scene. Reduced motion displays a fully still image. A photographic CSS background is present in the server HTML and remains visible while textures load or if WebGL2 fails. Context restoration rebuilds the renderer. DPR is capped at 2. Actual frame rate depends on device and GPU.

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

Export every file on the original canvas without trimming or resizing. Use 8-bit PNG and the same sRGB profile. White permits displacement in the flower/cloud/grass masks; white prevents displacement in the person mask. Keep the person protection margin at least as large as the maximum source-image displacement. With genuinely separated artwork, optional RGBA layers would be `sky-clouds.png`, `person.png`, `hill-grass.png`, and `flowers.png`, all registered to the same full canvas; these are not required or loaded by the current single-plate renderer.

The photo-derived masks are deliberately conservative, so nearby clouds can move while the person remains fixed. They do not claim semantic precision for each flower stem. Areas originally obscured by the screenshot's interface are reconstructed from nearby texture. Their original hidden details cannot be recovered from the screenshot alone.

## Rebuild the provided assets

The script requires Python with Pillow, NumPy and OpenCV headless. These are offline preparation tools, not application dependencies.

```powershell
python components/landing/reference-assets.py path/to/image-5.png public/landing
```

Do not replace the source with a differently cropped image without updating the documented mask recipe. The script checks the source dimensions, preserves the provided artwork's grade and writes asset origin/processing metadata into each PNG.

## Verification

Focused tests in `tests/reference-landing.test.tsx` cover image cover fitting, deterministic river-weighted sparkle placement, silhouette exclusion, SSR fallback, pause/resume/cleanup and reduced-motion control changes. Browser evidence is saved under ignored `out/iteration/reference-landing/` and is reported separately from those unit checks.

All seven focused tests pass. Development-browser checks verified WebGL2 at 1199 x 805, 1440 x 900 and 390 x 844, one displayed canvas, no runtime/accessibility/overflow failures, a working pause control and JavaScript-disabled fallback. Final moving-frame captures preserve all 5,150 tested person-silhouette pixels while flowers and clouds move. Glitter stays near luminous mist, with no particles in the upper sky.

`out/iteration/reference-landing/lifecycle-checks.json` verifies hidden-tab and reduced-motion suspension, context restoration, DPR 3 capped to 2 and unavailable-WebGL fallback. Hidden-tab and context-loss events are simulated browser checks. The independent review in `out/iteration/six-task/landing-review.md` returned `ship` for composition, responsive framing, material, typography, subject protection and localized motion.

The retained motion timing uses headless SwiftShader and does not establish a hardware frame rate. Missing historical comp-spec, build-phase and image-diff artifacts are not claimed as passed. [SIX_TASK_UPDATE.md](SIX_TASK_UPDATE.md) records production navigation, licensing, static fallback and preserved `/classic` regression results separately from the development visual evidence.
