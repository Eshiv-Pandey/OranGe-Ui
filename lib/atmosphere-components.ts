import type { ComponentDefinition } from "./components";

const sharedProps: ComponentDefinition["props"] = [
  { name: "color / accent / background", type: "hex color", defaultValue: "Component palette", description: "Three independent material colors. Three- and six-digit hex values are accepted; invalid colors use the original palette." },
  { name: "speed / seed", type: "number / number", defaultValue: "0.3 / 7", description: "Motion speed from 0 to 2 and a stable composition seed from 0 to 1000. ContourTerrain defaults to speed 0.2." },
  { name: "interactive / paused", type: "boolean / boolean", defaultValue: "true / false", description: "Pointer displacement and click ripples, or a still image. Reduced motion automatically removes animation and pointer response." },
  { name: "height / renderScale", type: "number | string / number", defaultValue: "420 / 0.75", description: "Responsive surface height and rendering scale from 0.25 to 1. Pixel and frame-rate caps remain active on high-DPR displays." },
  { name: "children", type: "ReactNode", defaultValue: "Not set", description: "Real foreground content. Child controls remain interactive. Set readable foreground colors and spacing appropriate to the chosen background." },
  { name: "theme / appearance / label / className", type: "CreativeTheme / Appearance / string / string", defaultValue: "auto / polished / Component name / Not set", description: "Library presentation, accessible image description and an additional outer class. Material colors stay independent of page theme." },
];
const notes = [
  "Original geometry and GLSL authored for oRangeUi. Public React Bits previews informed the effect categories; no React Bits implementation, asset, preset or source text is included.",
  "Uses the local ShaderCanvas lifecycle: one frame loop per surface, bounded render resolution, offscreen and hidden-tab suspension, reduced-motion still frames, context-loss fallback and cleanup on unmount.",
  "Static original SVG fallback artwork is server-rendered and remains usable without JavaScript or WebGL. Foreground content is ordinary React markup, never captured in the shader.",
];
const entry = (slug: string, name: string, description: string, usage: string, props: ComponentDefinition["props"], budget: string): ComponentDefinition => ({
  slug, name, description, category: "Backgrounds & shaders", collection: "polished", customizerPreview: true,
  file: `components/ui/${slug}.tsx`, usage,
  keyboard: "Use the labeled demo controls. Pointer effects are optional and decorative; foreground links and buttons keep native keyboard behavior. Pause freezes motion. Reduced motion shows a still composition.",
  props: [...props, ...sharedProps], notes: [...notes, budget],
});

export const ATMOSPHERE_COMPONENTS: ComponentDefinition[] = [
  entry("arc-field", "ArcField", "A warm electrical bridge with sharp forks, luminous terminals and a quiet pulse.", '<ArcField spread={1} branches={4} glow={1} />', [
    { name: "spread / branches / glow", type: "number / number / number", defaultValue: "1 / 4 / 1", description: "Arc displacement from 0.2 to 2, zero to six branching forks, and glow from 0 to 2. The bridge spans the surface horizontally." },
  ], "Rendering is capped at 140000 pixels and 24fps. The continuous small-area pulse avoids full-surface flashing."),
  entry("satin-flow", "SatinFlow", "Curved rose-satin drapery with broad folds and light calculated from its surface normals.", '<SatinFlow folds={5} drape={0.8} sheen={1} />', [
    { name: "folds / drape", type: "number / number", defaultValue: "5 / 0.8", description: "Two to twelve folds and curved drape from 0 to 2." },
    { name: "sheen / angle", type: "number / degrees", defaultValue: "1 / -18", description: "Grazing highlight strength from 0 to 2 and fabric orientation from -180 to 180 degrees." },
  ], "Rendering is capped at 180000 pixels and 24fps. An analytic height field and finite-difference normals provide the material shading."),
  entry("contour-terrain", "ContourTerrain", "A flat cartographic terrain with drifting analytic hills and readable major contours.", '<ContourTerrain levels={18} elevation={1} />', [
    { name: "levels / elevation", type: "number / number", defaultValue: "18 / 1", description: "Six to forty contour levels and hill elevation from 0.25 to 2. Every fifth contour uses the accent color." },
    { name: "lineWidth / scale", type: "number / number", defaultValue: "1 / 1", description: "Antialiased line weight from 0.5 to 2.5 and map magnification from 0.5 to 3." },
  ], "Rendering is capped at 180000 pixels and 24fps. Derivative-aware contour widths retain clear lines as the surface resizes."),
  entry("signal-lens", "SignalLens", "Twin-source oscilloscope interference through a curved teal signal lens.", '<SignalLens density={10} curvature={0.35} scanlines={0.4} />', [
    { name: "density / curvature", type: "number / number", defaultValue: "10 / 0.35", description: "Signal ring density from 4 to 24 and barrel lens curvature from 0 to 1." },
    { name: "scanlines / chromatic", type: "number / number", defaultValue: "0.4 / 0.5", description: "Display scanline strength from 0 to 1 and horizontal RGB signal separation from 0 to 2." },
  ], "Rendering is capped at 160000 pixels and 24fps. This is a smooth interference field, with no copied plasma, phosphor-mask or power-on implementation."),
];
export const ATMOSPHERE_SLUGS = ["arc-field", "satin-flow", "contour-terrain", "signal-lens"] as const;
