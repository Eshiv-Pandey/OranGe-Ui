import { COLOR_GLSL } from "./common";
import { clamp, colorUniforms, PUNCHY_COLORS, type ShaderModule } from "./types";
export const gradient: ShaderModule = {
  id: "gradient", kind: "source", defaults: { colors: PUNCHY_COLORS, speed: .4, softness: .55, saturation: 1.2, grain: .08 },
  uniforms: { ...colorUniforms, uSpeed: { type: "float", value: (s) => clamp(s.speed, -3, 3, .4) }, uSoftness: { type: "float", value: (s) => clamp(s.softness, 0, 1, .55) } },
  fragment: `${COLOR_GLSL}
uniform float uSpeed;
uniform float uSoftness;
void main() {
  vec2 uv = sourceUv(); float t = uTime * uSpeed * .35;
  uv += vec2(sin(uv.y * 5.0 + t), cos(uv.x * 4.0 - t)) * .13;
  vec3 color = vec3(0); float total = 0.0;
  // Moving color islands retain saturated centers and blend along their edges.
  for (int i = 0; i < 5; i++) {
    if (i >= uColorCount) break;
    float a = float(i) * 6.283185 / float(uColorCount);
    vec2 center = .5 + .42 * vec2(cos(a + t * .43), sin(a + t * .57));
    center += .12 * vec2(sin(t + a * 2.0), cos(t * .7 + a));
    float weight = exp(-dot(uv - center, uv - center) * mix(24.0, 3.5, uSoftness));
    color += uColors[i] * weight; total += weight;
  }
  fragColor = vec4(finishColor(color / max(total, .00001)), 1);
}`,
};
