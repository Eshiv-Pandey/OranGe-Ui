import { hexRgb, type ShaderSettings, type ShaderModule } from "./types";
export const PALETTES = {
  gameboy: ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"],
  cga: ["#000000", "#55ffff", "#ff55ff", "#ffffff"],
  mono: ["#101014", "#faf6ed"],
  duotone: ["#321147", "#ff9b38"],
} as const;
export function paletteColors(s: ShaderSettings): readonly string[] {
  return Array.isArray(s.colors) && s.colors.length ? s.colors.slice(0, 16) : PALETTES[s.preset as keyof typeof PALETTES] || PALETTES.gameboy;
}
export const palette: ShaderModule = {
  id: "palette", kind: "effect", defaults: { preset: "gameboy" },
  uniforms: {
    uPalette: { type: "vec3[]", value: (s) => Array.from({ length: 16 }, (_, i) => hexRgb(paletteColors(s)[i % paletteColors(s).length])).flat() },
    uPaletteCount: { type: "int", value: (s) => paletteColors(s).length },
  },
  fragment: `uniform vec3 uPalette[16];
uniform int uPaletteCount;
vec3 oklab(vec3 c) {
  // Convert sRGB to linear light before perceptual nearest-color matching.
  c = mix(c / 12.92, pow((c + .055) / 1.055, vec3(2.4)), step(vec3(.04045), c));
  vec3 lms = mat3(.4122214708,.2119034982,.0883024619, .5363325363,.6806995451,.2817188376, .0514459929,.1073969566,.6299787005) * c;
  lms = pow(max(lms, 0.0), vec3(1.0 / 3.0));
  return mat3(.2104542553,1.9779984951,.0259040371, .793617785,-2.428592205,.7827717662, -.0040720468,.4505937099,-.808675766) * lms;
}
void main() {
  vec3 inputColor = texture(uInput, vUv).rgb, target = oklab(inputColor), nearest = uPalette[0];
  float best = 100.0;
  for (int i = 0; i < 16; i++) {
    if (i >= uPaletteCount) break;
    vec3 delta = target - oklab(uPalette[i]); float distance = dot(delta, delta);
    if (distance < best) { best = distance; nearest = uPalette[i]; }
  }
  fragColor = vec4(nearest, 1);
}`,
};
