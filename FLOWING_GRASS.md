# FlowingGrass

FlowingGrass renders a dense field of long, curved grass blades in raw WebGL2. Its dedicated renderer draws instanced ribbons, with the same surface, theme and frame-export contracts as ShaderCanvas. It needs no texture, video or Three.js dependency.

```tsx
import { FlowingGrass } from "./components/ui/flowing-grass";

<FlowingGrass
  speed={0.7}
  windStrength={0.7}
  gustSpeed={0.6}
  direction={32}
  density={80}
  bladeLength={1.25}
  seed={7}
  color="#76aa3c"
  tipColor="#d5ee94"
  shadowColor="#071f16"
  interaction={{ warp: true, radius: 0.22, strength: 1 }}
  renderScale={0.8}
  style={{ height: 640 }}
/>
```

The wind bends blade tips while roots remain fixed. Every leaf is a separate nine-segment ribbon with its own root, length, width, curvature, lean and tone. Seeded regions alternate the dominant ridge direction, so illuminated crests end, fork and interleave around dark green channels. Orientation, light and gusts are sampled at each root; all animated displacement grows from zero at the root to full strength at the tip. The field itself never slides or stretches. Soft leaf shadows and the order of the roots create overlap within the field. A pointer or touch parts nearby blades and adds a directional wake. Set `interaction={{ warp: false }}` to disable it. Reduced motion disables pointer interaction and renders a static frame.

| Prop | Default | Range or purpose |
| --- | --- | --- |
| `speed` | `0.7` | Animation clock multiplier, 0 to 3. |
| `windStrength` | `0.7` | Tip bending, 0 to 2; zero stops wind movement. |
| `gustSpeed` | `0.6` | Travelling gust speed, 0 to 2. |
| `direction` | `32` | Field direction in degrees, 0 to 360. Zero points upward. |
| `density` | `80` | Root density, 35 to 160, within the renderer's blade budget. |
| `bladeLength` | `1.25` | Blade length multiplier, 0.5 to 1.5. |
| `seed` | `7` | Stable field seed, 0 to 1000. |
| `color` | `#76aa3c` | Main blade color. |
| `tipColor` | `#d5ee94` | Sunlit tips and fine central highlights. |
| `shadowColor` | `#071f16` | Deep green folds and undergrowth. |
| `interaction` | `{ warp: true }` | Optional pointer/touch breeze; radius and strength use ShaderCanvas settings. |
| `renderScale` | `1` | Internal resolution multiplier, 0.25 to 1, with a 2.4 million pixel ceiling. |
| `paused` | `false` | Hold the current frame. |
| `appearance`, `theme` | `polished`, `auto` | Existing appearance metadata and host theme selection. |
| `label` | `Sunlit grass flowing in the wind` | Accessible image description. |
| `className`, `style` | unset | Extend the surface and set dimensions. |

All numeric settings clamp invalid and out-of-range values. The canvas pauses when offscreen or when its tab is hidden, and releases its GPU resources on unmount. Explicit pause also freezes pointer relaxation. A green CSS gradient is visible during server rendering and when WebGL2 is unavailable. The standalone effect has no controls or focus traps; the documented demo exposes native keyboard-operable controls.

## Implementation

- `components/ui/flowing-grass.tsx`: public React API.
- `components/ui/shader-canvas/grass.ts`: defaults, sanitized settings, deterministic root generation and ribbon shaders.
- `components/ui/shader-canvas/grass-renderer.ts`: instanced WebGL2 renderer, visibility lifecycle, pointer/touch input and synchronous frame export.
- `components/library/flowing-grass-demo.tsx`: live preview and complete wind, blade, color, pointer and playback controls.
- `tests/flowing-grass.test.tsx`: SSR fallback, control wiring, invalid settings, deterministic geometry, resource bounds, buffer reuse, pointer pause, reduced motion, visibility and context restoration.

The renderer uses two draw calls and one reusable instance buffer, with at most 130,000 blades. Wind, pointer input, length and color changes reuse that buffer; density, seed and aspect changes regenerate it. The geometry has no per-pixel search over overlapping blades. Source downloads must retain both grass helpers, `canvas-frame.ts`, existing styles and their transitive utility dependencies.

## Verification

On 1 November 2026, all ten focused grass tests passed on the final material. They cover strict pause and pointer state, static reduced motion, deterministic seeds, leaf-length variation, geometry budgets, root-buffer reuse, hidden/offscreen suspension, GPU resource cleanup and context restoration. Paused and reduced-motion canvases refresh their static frame when made visible, including a hidden initial mount and settings changed while hidden.

The final standalone Chrome WebGL2 run used ANGLE AMD Direct3D11 and compiled both programs without shader or page errors. GPU transform feedback sampled 32 blades and measured zero root displacement under both wind and pointer input, while their tips moved. Wind, pointer and browser-emulated touch produced measurable pixel changes. Explicit pause and reduced motion each produced zero changed pixels. Offscreen drawing stopped and resumed on return; all tracked programs, buffers and vertex arrays were released after destruction.

The exact desktop (800 by 700), mobile (390 by 620) and reference-size (640 by 1050) captures, matching source SHA-256 hashes and numeric evidence are in `out/iteration/grass-v3/`. All five downloadable appearance examples typecheck and bundle. The independent scoped review in `out/iteration/six-task/nature-closure-verdict.md` returned `ship`, resolving ridge continuity and light/dark balance. Earlier captures and verdicts are preserved.

These checks cover headless desktop rendering and emulated input, not physical mobile frame rate. [SIX_TASK_UPDATE.md](SIX_TASK_UPDATE.md) records the separate application, production and source-download results.
