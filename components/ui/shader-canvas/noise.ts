import { COLOR_GLSL, NOISE_GLSL } from "./common";
import { clamp, colorUniforms, PUNCHY_COLORS, type ShaderModule } from "./types";
export const noise: ShaderModule = {
  id: "noise", kind: "source", defaults: { colors: PUNCHY_COLORS, scale: 3, warp: 1.2, speed: .4, seed: 1, saturation: 1.2, grain: .04 },
  uniforms: { ...colorUniforms, uScale: { type: "float", value: (s) => clamp(s.scale, .1, 20, 3) }, uWarp: { type: "float", value: (s) => clamp(s.warp, 0, 5, 1.2) }, uSpeed: { type: "float", value: (s) => clamp(s.speed, -3, 3, .4) }, uSeed: { type: "float", value: (s) => clamp(s.seed, -10000, 10000, 1) } },
  fragment: `${COLOR_GLSL}${NOISE_GLSL}
uniform float uScale;
uniform float uWarp;
uniform float uSpeed;
uniform float uSeed;
void main() {
  vec2 p = sourceUv() * vec2(uCssSize.x / uCssSize.y, 1.0) * uScale + uSeed * 1.37;
  float t = uTime * uSpeed * .15;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2,1.3) - t));
  vec2 r = vec2(fbm(p + q * 3.0 * uWarp + vec2(1.7,9.2) + t), fbm(p + q * 3.0 * uWarp + vec2(8.3,2.8) - t));
  float value = clamp(fbm(p + r * 3.0 * uWarp) * 1.6 - .25, 0.0, .9999);
  float band = value * float(uColorCount - 1); int index = int(floor(band));
  vec3 color = mix(uColors[index], uColors[min(index + 1, uColorCount - 1)], smoothstep(0.0, 1.0, fract(band)));
  fragColor = vec4(finishColor(color), 1);
}`,
};
