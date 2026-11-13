# Forest landing scene

The homepage uses the owner's forest painting with a real orange replacing the red sun. HTML navigation, the `orange UI` heading and `Components with a little more warmth.` tagline retain their layout. `/classic` preserves the earlier library landing. No visible pause control or Get Started action appears on `/`.

## Implementation

`app/page.tsx` composes the page and preloads the static scene. `reference-scene.tsx` provides the CSS fallback before WebGL is ready. `reference-scene-config.ts` selects the mounted assets and supplies all tuning. The renderer and shaders under `components/landing/` use one canvas with cloud advection, rooted tree sway, painted wing motion and stationary fruit protection.

The supplied 736 x 920 painting cover-fits without stretching at `50% 64%`, bringing the tree crowns into view on wide screens such as 1535 x 776. At aspect ratios of 2.5 and above, the anchor moves to `50% 56%` to keep the orange below the navigation. WebGL translates these CSS overflow positions into the same source coordinates; portrait views retain the full image height. The real orange is a silhouette-derived cutout from a public-domain photograph by Renee Comet for the National Cancer Institute, with a leaf and stem extracted from Petr Kratochvil's CC0 clementine photograph. The former red disk is locally inpainted, and the original birds are composited in front. See [asset provenance](public/landing/README.md) for the sources and runtime masks.

A feathered local shade behind the tagline preserves its existing color, typography and position while improving contrast against the brighter part of the reframed sky. The forest remains outside that shade.

Wind speed is 2.9, gust speed 1.7 and cloud speed 0.17, retaining the requested double-speed weather. Tree crown displacement is weighted at 0.9 while the matte fades toward rooted trunks. There are no sparkle particles in this painting. Stationary masks protect both destination and sampled source fruit pixels. Cloud samples also stay within the sky matte so terrain does not leak into the sky.

The thirteen original birds occupy a padded ink atlas extracted from the painting. Their source positions and wing spans are recorded in `reference-birds.ts`. A single instanced draw overlays them on `sunset-flight-scene.png`, which reconstructs the sky beneath their old silhouettes and retains the exact photographed fruit. A fixed strip anchors each body while the outer wings bend by up to 2.2 source pixels. Wing rhythm follows gust speed 1.7, giving a 3.70-second cycle, with individual phase offsets. This uses the existing scene clock and frame loop. Reduced motion restores the original wing pose, and the CSS fallback keeps the original painted birds visible without JavaScript.

## Lifecycle and performance

The renderer uses elapsed animation time, caps DPR at 2 and caps its drawing buffer at 1,600,000 pixels. It stops when offscreen or hidden, resumes without catching up suspended time, and rebuilds after WebGL context restoration. Reduced motion displays a fully still scene. The CSS background stays available while textures load, if WebGL is unavailable, and with JavaScript disabled.

## Rebuild assets

Use the original painting and the downloaded orange and clementine photographs with Python, Pillow, NumPy and OpenCV:

```powershell
python components/landing/sunset-assets.py painting.png orange-photo.jpg clementine-photo.jpg public/landing
```

The script checks the original dimensions and embeds the source and complete processing recipe into every PNG. Runtime uses only the local PNG files. Replacing the painting requires corresponding registered motion and protection masks.

## Verification

`tests/reference-landing.test.tsx` checks cover fitting, forest and orange landmarks at 1535 x 776, SSR fallback and cleanup. `tests/reference-renderer.test.ts` covers elapsed time, pause, visibility, reduced motion, resume, resource cleanup, context restoration, the pixel budget and one batched flock draw per scene frame. `tests/reference-motion.spec.ts` measures actual cloud and tree changes above grain levels, visible tree coverage, stationary fruit pixels outside wing occlusion, moving wing tips around fixed bodies, full-cycle pose restoration, terrain isolation, reduced motion, large displays and fallback navigation. `tests/refinement.spec.ts` covers the current page at 320, 390, 768 and 1440px in both themes.

```powershell
$env:PLAYWRIGHT_BASE_URL = "http://127.0.0.1:3134"
node node_modules/@playwright/test/cli.js test --config=playwright.reference-motion.config.ts
node node_modules/@playwright/test/cli.js test --config=playwright.refinement.config.ts
```

Moving-frame evidence is saved under ignored `out/iteration/landing-motion/`; the tree and leaf correction captures are under `.impeccable/review/tree-leaf/`, including 1535 x 776 and the four size/theme combinations above. The capture manifest also records pixel-based tagline contrast at the reported user viewport. `tree-leaf-validation.json` in the motion evidence directory records the latest checks and the targeted leaf-guard assertion rerun. Headless Chromium and SwiftShader establish simulated browser behavior, not a physical phone frame rate. Historical November 1 and 2 evidence describes the previous person-and-flowers scene and does not validate the current painting.
