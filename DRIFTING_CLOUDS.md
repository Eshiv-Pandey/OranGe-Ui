# DriftingClouds

`DriftingClouds` renders a deterministic, slowly moving cumulus field in WebGL2. It is a source module for the existing `ShaderCanvas` pipeline, so no images, videos, extra rendering dependencies or network requests are needed.

```tsx
import { DriftingClouds } from "./components/ui/drifting-clouds";

<DriftingClouds
  speed={0.35}
  coverage={0.62}
  density={0.75}
  skyColor="#087bbd"
  cloudColor="#fffdf7"
  shadowColor="#6d95b6"
  style={{ height: 600 }}
/>;
```

| Prop | Default | Range and behavior |
| --- | --- | --- |
| `speed` | `0.35` | `0..3`; advection speed. Zero freezes the procedural field. |
| `scale` | `1` | `0.5..2.5`; zoom into the cloud field. |
| `coverage` | `0.62` | `0..1`; expands or contracts the cloud formations. Zero clears the sky. |
| `density` | `0.75` | `0..1`; optical density. Zero clears the sky. |
| `billow` | `0.6` | `0..1`; size of the nested cloud lobes. |
| `softness` | `0.2` | `0..1`; softness of cloud edges. |
| `sunAngle` | `35` | `0..360` degrees; changes the light and self-shadow direction. |
| `lightIntensity` | `1` | `0..2`; sunlight intensity. |
| `seed` | `7` | `0..1000`; reproducible internal billow structure. |
| `skyColor` | `#087bbd` | Sky tint, as a three- or six-digit hex color. |
| `cloudColor` | `#fffdf7` | Sunlit cloud color. |
| `shadowColor` | `#6d95b6` | Cloud shadow and ambient-scattering color. |
| `renderScale` | `0.65` | `0.25..1`; lower values reduce fill cost. |
| `paused` | `false` | Freezes animation while retaining live edits. |

`appearance`, `theme`, `label`, `className`, `style`, and `interaction` follow `ShaderCanvas`. Optional `interaction={{ warp: true }}` adds a pointer breeze; `interaction={{ scroll: true }}` links advection to page scrolling. The demo exposes all cloud properties, palette, render scale, pointer settings and pause.

The renderer pauses when offscreen or in a hidden tab and renders a still frame for reduced motion. A server-rendered CSS gradient in the chosen sky/cloud/shadow palette remains available until WebGL2 is ready or when the context is unavailable. The rendering is procedural and does not use a photograph as a texture.

The density field has twelve connected root volumes and seventy-two uneven outer lobes. The roots keep the tower connected across seeds; outer lobes, folds and fine erosion define its visible surface. Smaller uneven caps articulate both the front faces and silhouettes of the crown and shoulder. Only the two nearest nested cap groups are evaluated in each region, and grazing-angle optical depth keeps their edges clear. Higher volumes recede behind nearer side and lower banks. Adaptive view marching resolves the surface. A close sun sample separates cap contacts, while four expanding samples account for shadows cast by neighboring billows. Direct diffuse light respects that occlusion, separating recessed blue pockets from sunlit caps. Surface normals and light scattering operate in linear color space before display conversion.

Drift stays within a bounded region even during long sessions. The shader caps view traversal at 84 steps and exits early once the cloud becomes opaque or the ray leaves the field. `renderScale` controls the fill cost; use a lower value for many simultaneous previews. The shared renderer owns context restoration, resize, cleanup and frame capture.

## Verification, 1 November 2026

- All five focused tests in `tests/drifting-clouds.test.tsx` pass on the final material. They cover SSR output and caller colors in all five appearances, accessible naming and style forwarding, malformed numeric settings, deterministic seed changes, live demo edits and pause propagation without renderer replacement, and compact thumbnail reuse.
- The final `clouds.ts`, `clouds-field.ts` and shared `renderer.ts` hashes match `out/iteration/clouds/silhouette-report.json`. Its 600 by 900 portrait and 960 by 620 desktop captures pass deterministic still-frame, animation, one-hour shader-time sample, and seed/billow/softness/scale checks with no WebGL errors. Earlier captures and shader sources are preserved in the adjacent evidence archives.
- The one-hour check injects `uTime = 3600`; it is not a one-hour wall-clock session. Source inspection confirms that spatial drift uses bounded sine offsets and bounded noise amplitudes, so it does not accumulate a translation out of the scene.
- The final-source supplement, `out/iteration/clouds/current-runtime-report.json`, passes shape, lighting, individual color, zero-speed and empty-sky checks, synthetic pointer/touch and lifecycle checks, resource cleanup and unavailable-context fallback. All five downloadable appearance examples typecheck and bundle.
- The independent scoped review in `out/iteration/six-task/nature-closure-verdict.md` returned `ship`: the crown and shoulder caps have distinct lit boundaries, blue recesses remain separated, and the connected tower and banks are preserved.

The final renderer evidence identifies ANGLE AMD Direct3D11 in headless Chrome. Cold shader linking measured 59.3 seconds in that harness; live settings and appearance changes reuse the mounted program. This startup measurement and synchronous pixel readbacks are not GPU frame-rate measurements. Physical mobile performance was not measured. [SIX_TASK_UPDATE.md](SIX_TASK_UPDATE.md) records the application-wide navigation, editing, download and production results.
