import type { ComponentDefinition, PropDoc } from "./components";

const lifecycle: PropDoc[] = [
  { name: "renderScale", type: "number", defaultValue: "1", description: "Internal resolution multiplier, clamped to 0.25 through 1 and multiplied by device pixel ratio." },
  { name: "paused", type: "boolean", defaultValue: "false", description: "Hold the current frame. Hidden tabs and offscreen canvases pause automatically." },
  { name: "theme / label / style", type: "auto | light | dark / string / CSSProperties", defaultValue: "auto / descriptive label / unset", description: "Inherit the page palette, name the canvas for assistive technology and set its dimensions." },
];
const keyboard = "Use Tab to reach the labeled demo controls and arrow keys to adjust sliders. Pointer and touch interactions are optional and off by default. Reduced motion renders one static frame and disables interactions.";

export const SHADER_COMPONENTS: ComponentDefinition[] = [
  {
    slug: "shader-canvas", name: "ShaderCanvas", category: "Content & layout", customizerPreview: true,
    description: "Punchy mesh gradients and warped noise, with ordered pixel, dither and palette effects that react to you.",
    file: "components/ui/shader-canvas.tsx", keyboard,
    usage: '<ShaderCanvas source={{ type: "noise", colors: ["#ff4d00", "#bd3bff", "#31eeff"], speed: 0.4 }} effects={[{ type: "pixelate", size: 6 }, { type: "dither", mode: "bayer4" }, { type: "palette", preset: "gameboy" }]} interaction={{ warp: true, ripple: true, pixelProximity: true, scroll: false }} />',
    props: [
      { name: "source", type: "ShaderSource", defaultValue: 'type: "gradient"', description: "Gradient: 3 to 5 hex colors, softness and speed. Noise: colors, scale, warp, speed and seed. Both support saturation and grain." },
      { name: "effects", type: "ShaderEffect[]", defaultValue: "[]", description: "Ordered passes: pixelate(size); dither(mode: bayer4, bayer8 or blueNoise, strength, scale); palette(preset or custom colors)." },
      { name: "interaction", type: "ShaderInteraction", defaultValue: "All toggles false", description: "warp, ripple, pixelProximity, ditherProximity and scroll. Radius and strength tune the liquid trail. Up to eight concurrent click ripples." },
      { name: "modules", type: "ShaderModule[]", defaultValue: "Built-in modules", description: "Extend sources and effects with id, kind, fragment, uniforms and defaults. No renderer changes needed." },
      ...lifecycle,
    ],
    notes: ["Import orangeSunset, pixelDream or gameboyNoise alongside ShaderCanvas and spread the preset into its props. The playground exposes each effect, its order and all interaction settings.", "Raw WebGL2 uses a fullscreen triangle and ping-pong framebuffers. Palette matching happens in OKLab. No Three.js dependency is required.", "A CSS gradient remains visible during server rendering or if WebGL2 is unavailable. Source downloads include the renderer, modules, presets and styles."],
  },
  {
    slug: "flowing-water", name: "FlowingWater", category: "Content & layout", customizerPreview: true,
    description: "Deep teal water with moving ripples, refracted light and bright flecks of sun.",
    file: "components/ui/flowing-water.tsx", keyboard,
    usage: '<FlowingWater speed={0.55} sparkle={0.8} color="#067b83" deepColor="#001d31" interaction={{ ripple: true }} />',
    props: [
      { name: "speed / scale", type: "number / number", defaultValue: "0.55 / 1.8", description: "Flow speed and the scale of the overlapping wave field." },
      { name: "depth / choppiness", type: "number / number", defaultValue: "0.65 / 0.55", description: "Water depth and the sharpness of the surface ripples." },
      { name: "sparkle / sunAngle", type: "number / degrees", defaultValue: "0.8 / 35", description: "Strength of the small sun reflections and the light direction." },
      { name: "color / deepColor", type: "hex string / hex string", defaultValue: "#067b83 / #001d31", description: "Shallow turquoise and deep blue water colors." },
      { name: "interaction", type: "ShaderInteraction", defaultValue: "All toggles false", description: "Optional pointer warp, touch/click ripples and scroll-linked flow, with adjustable radius and strength." },
      ...lifecycle,
    ],
    notes: ["Water is generated in a fragment shader from layered wave normals, light refraction and sun glints. It requires no image, video or network downloads.", "Uses the same WebGL2 lifecycle and reduced-motion behavior as ShaderCanvas. Set style={{ height: 640 }} for a taller surface."],
  },
];
