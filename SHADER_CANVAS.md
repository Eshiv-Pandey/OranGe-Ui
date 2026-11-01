# ShaderCanvas

`ShaderCanvas` is a raw WebGL2 surface. It runs a source followed by the effects in the order you supply, using one animation loop, one fullscreen triangle and two reusable framebuffer textures.

```tsx
import { ShaderCanvas, orangeSunset } from "./components/ui/shader-canvas";

<ShaderCanvas
  {...orangeSunset}
  effects={[
    { type: "pixelate", size: 6 },
    { type: "dither", mode: "blueNoise", strength: 0.6 },
    { type: "palette", preset: "cga" },
  ]}
  interaction={{ warp: true, ripple: true, pixelProximity: true }}
  renderScale={0.75}
  style={{ height: 500 }}
/>
```

Sources accept 3 to 5 hex colors. `gradient` adds `softness` and `speed`; `noise` adds `scale`, `warp`, `speed` and `seed`. Both support `saturation` and `grain`. Presets are `orangeSunset`, `pixelDream` and `gameboyNoise`.

Effects:

- `pixelate`: `size` in CSS pixels, independent of device pixel ratio.
- `dither`: `mode` (`bayer4`, `bayer8`, `blueNoise`), `strength` and `scale`. Blue noise uses a deterministic void-and-cluster threshold tile.
- `palette`: `preset` (`gameboy`, `cga`, `mono`, `duotone`) or `colors` (up to 16 hex colors). The nearest color is selected in OKLab after sRGB linearization.

All interaction toggles default to false: `warp`, `ripple`, `pixelProximity`, `ditherProximity` and `scroll`. `radius` and `strength` adjust pointer influence. Pointer Events support mouse, pen and touch; the ripple pool holds up to eight waves. Scroll progress advances the flow's time. Reduced motion disables all interactions and holds a static frame.

`renderScale` ranges from 0.25 to 1. Hidden tabs and offscreen canvases stop their animation loop. Resize, DPR changes, context loss and resource cleanup are handled by the renderer. The CSS gradient fallback works during SSR, before initialization and if WebGL2 fails. `paused` holds the current image.

## Add a module

Pass custom definitions through `modules`. Keep definitions in a client module because uniform descriptors contain functions. Source modules can call `sourceUv()` for the standard interaction distortion. Effects sample `uInput`; both receive `vUv`, `uTime`, `uResolution` and `uCssSize`.

```tsx
import { ShaderCanvas, type ShaderModule } from "./components/ui/shader-canvas";

const tint: ShaderModule = {
  id: "tint", kind: "effect", defaults: { amount: 0.3 },
  uniforms: {
    uAmount: { type: "float", value: (s) => Number(s.amount) },
  },
  fragment: `uniform float uAmount;
void main() {
  vec3 color = texture(uInput, vUv).rgb;
  fragColor = vec4(mix(color, vec3(1., .3, .05), uAmount), 1.);
}`,
};

<ShaderCanvas modules={[tint]} effects={[{ type: "tint", amount: 0.25 }]} />
```

The core adds the GLSL version and common header. Module uniforms support scalar float/int, vectors and float/vec3/vec4 arrays. Built-in modules and shaders live in `components/ui/shader-canvas/`.

## FlowingWater

`FlowingWater` shares this renderer and lifecycle. It adds `speed`, `scale`, `depth`, `sparkle`, `choppiness`, `sunAngle`, `color` and `deepColor`. Its procedural surface combines wave normals, refracted caustics and sharp sun reflections. There are no external images or video assets.

The component detail pages provide live controls for each visual and interaction setting. Their source downloads include every local module and style dependency.
