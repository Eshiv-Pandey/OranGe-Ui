import { clamp, type ShaderModule } from "./types";
export const pixelate: ShaderModule = {
  id: "pixelate", kind: "effect", defaults: { size: 6 },
  uniforms: { uSize: { type: "float", value: (s) => clamp(s.size, 1, 128, 6) } },
  fragment: `uniform float uSize;
void main() {
  // Use CSS pixels so DPR and render scale do not change the authored size.
  float size = mix(uSize, 1.0, proximity(vUv) * uPixelProximity);
  vec2 uv = (floor(vUv * uCssSize / size) + .5) * size / uCssSize;
  fragColor = texture(uInput, clamp(uv, 0.0, 1.0));
}`,
};
