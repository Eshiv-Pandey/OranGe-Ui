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
  {
    slug: "flowing-grass", name: "FlowingGrass", category: "Content & layout", customizerPreview: true,
    description: "Sunlit grass with fine curved blades, flowing gusts and a breeze that follows your pointer.",
    file: "components/ui/flowing-grass.tsx",
    keyboard: "Tab reaches the demo controls. Arrow keys adjust sliders; the adjacent number fields accept exact values. Pointer and touch breeze is enabled by default. Set interaction={{ warp: false }} to disable it. Reduced motion holds a static frame and disables interaction.",
    usage: '<FlowingGrass windStrength={0.7} gustSpeed={0.6} direction={32} interaction={{ warp: true }} />',
    props: [
      { name: "speed / windStrength / gustSpeed", type: "number", defaultValue: "0.7 / 0.7 / 0.6", description: "Wind speed (0 to 3), blade bending (0 to 2) and travelling gust speed (0 to 2)." },
      { name: "direction", type: "number", defaultValue: "32", description: "Direction of the blade field in degrees, from 0 to 360." },
      { name: "density / bladeLength", type: "number", defaultValue: "80 / 1.25", description: "Number of blades across the field (35 to 160) and their length (0.5 to 1.5)." },
      { name: "seed", type: "number", defaultValue: "7", description: "Reproduce the same field with a seed from 0 to 1000." },
      { name: "color / tipColor / shadowColor", type: "hex string", defaultValue: "#76aa3c / #d5ee94 / #071f16", description: "Independent blade, sunlit-tip and deep-fold colors." },
      { name: "interaction", type: "ShaderInteraction", defaultValue: "warp: true", description: "Move a pointer or drag a finger through the blades. Radius and strength tune the local breeze; warp: false disables it." },
      ...lifecycle,
    ],
    notes: ["Long curved blades grow from stable roots and bend with coherent travelling gusts. Pointer or touch input adds a local breeze without dragging the whole image.", "A dedicated instanced WebGL2 renderer follows the library's surface, theme and frame-export contracts. Static CSS fallback, visibility pause and all five appearances are supported. Source downloads include the renderer and deterministic blade geometry."],
  },
  {
    slug: "drifting-clouds", name: "DriftingClouds", category: "Content & layout", customizerPreview: true,
    description: "A blue sky filled with drifting cumulus, soft billows and editable sunlight.",
    file: "components/ui/drifting-clouds.tsx", keyboard,
    usage: '<DriftingClouds speed={0.35} coverage={0.62} density={0.75} skyColor="#087bbd" cloudColor="#fffdf7" shadowColor="#6d95b6" />',
    props: [
      { name: "speed / scale", type: "number", defaultValue: "0.35 / 1", description: "Advection speed (0 to 3) and cloud-field zoom (0.5 to 2.5)." },
      { name: "coverage / density", type: "number", defaultValue: "0.62 / 0.75", description: "Amount of sky occupied by clouds and optical density, from 0 to 1. Zero clears the sky." },
      { name: "billow / softness", type: "number", defaultValue: "0.6 / 0.2", description: "Rounded turbulent detail and edge softness, each from 0 to 1." },
      { name: "sunAngle / lightIntensity", type: "number", defaultValue: "35 / 1", description: "Sun direction in degrees and sunlight intensity from 0 to 2." },
      { name: "seed", type: "number", defaultValue: "7", description: "Deterministic cloud detail from a seed between 0 and 1000." },
      { name: "skyColor / cloudColor / shadowColor", type: "hex string", defaultValue: "#087bbd / #fffdf7 / #6d95b6", description: "Blue sky, sunlit clouds and shaded billows. Three- and six-digit hex colors are accepted." },
      { name: "interaction", type: "ShaderInteraction", defaultValue: "All toggles false", description: "Optional pointer breeze and scroll-linked motion, with adjustable radius and strength." },
      ...lifecycle.map((prop) => prop.name === "renderScale" ? { ...prop, defaultValue: "0.65" } : prop),
    ],
    notes: ["The shader integrates density and sunlight through a three-dimensional cloud field. Seeded billows preserve their shape as they drift.", "All controls remain live while paused. Hidden and offscreen canvases stop rendering, and reduced motion uses a still frame. Source downloads include every local renderer dependency."],
  },
];
