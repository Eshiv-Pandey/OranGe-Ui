import { clamp, hexRgb, type ShaderModule } from "./types";

/** Analytic folded ribbons and studio reflections, authored for oRangeUi. */
export const liquidMetal: ShaderModule = {
  id: "liquid-metal", kind: "source", defaults: {}, renderBudget: { maxPixels: 600_000, maxFps: 30 },
  uniforms: {
    uMetal: { type: "vec3", value: (s) => hexRgb(s.color) }, uBackdrop: { type: "vec3", value: (s) => hexRgb(s.background) },
    uSpeed: { type: "float", value: (s) => clamp(s.speed, 0, 3, .35) }, uRibbonCount: { type: "int", value: (s) => Math.round(clamp(s.ribbons, 1, 5, 3)) },
    uTwist: { type: "float", value: (s) => clamp(s.twist, 0, 2, 1) }, uRoughness: { type: "float", value: (s) => clamp(s.roughness, 0, 1, .25) },
    uSheen: { type: "float", value: (s) => clamp(s.sheen, 0, 1, .2) }, uFollow: { type: "float", value: (s) => s.interactive === false ? 0 : 1 },
  },
  fragment: `
uniform vec3 uMetal;
uniform vec3 uBackdrop;
uniform float uSpeed;
uniform int uRibbonCount;
uniform float uTwist;
uniform float uRoughness;
uniform float uSheen;
uniform float uFollow;
void main() {
  vec2 uv = sourceUv();
  vec2 position = (uv - .5) * vec2(uCssSize.x / uCssSize.y, 1.0);
  float t = uTime * uSpeed;
  vec3 color = uBackdrop * (1.0 - length(position) * .12);
  vec2 lamp = mix(vec2(-.35,.55), (uPointer - .5) * 1.7, uPointerActive * uFollow);
  for (int i = 0; i < 5; i++) {
    if (i >= uRibbonCount) break;
    float lane = float(i) - float(uRibbonCount - 1) * .5;
    float angle = -.5 + sin(t * .18 + float(i)) * .09;
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    vec2 p = rotation * position;
    float phase = p.x * 5.0 + t * .8 + float(i) * .74;
    float center = lane * .18 + sin(phase) * .105 * uTwist + sin(p.x * 2.8 - t * .5) * .075;
    float slope = cos(phase) * .525 * uTwist + cos(p.x * 2.8 - t * .5) * .21;
    float width = .095 + .028 * cos(phase * .7 + float(i));
    float across = (p.y - center) / width;
    float edge = max(fwidth(across), .008);
    float coverage = 1.0 - smoothstep(1.0 - edge, 1.0 + edge, abs(across));
    float height = sqrt(max(.0001, 1.0 - min(across * across, 1.0)));
    vec3 normal = normalize(vec3(slope * across * .8, -across, height));
    vec3 reflection = reflect(vec3(0,0,-1), normal);
    float brush = sin(p.x * 950.0 + sin(p.y * 320.0) * .6) * uRoughness * .015;
    float softbox = exp(-pow((reflection.y - lamp.y * .35 - .28) / (.18 + uRoughness * .3), 2.0));
    float strip = exp(-pow((reflection.y + .66 + lamp.x * .25) / .075, 2.0));
    float room = .07 + .32 * smoothstep(-.15, .5, reflection.y) + softbox * .9 + strip * .65;
    float rim = pow(1.0 - height, 3.0) * .45;
    vec3 specular = vec3(1.0,.985,.945) * softbox * .33;
    vec3 iridescent = .5 + .5 * cos(vec3(0,2.1,4.2) + reflection.y * 7.0 + p.x * 3.0);
    vec3 metal = uMetal * (room + brush) + specular + rim * mix(uMetal, vec3(1), .5);
    metal += (iridescent - .4) * uSheen * pow(1.0-height, 1.5) * .45;
    float shadow = exp(-pow((abs(across) - 1.1) * 4.0, 2.0)) * .19 * (1.0-coverage);
    color *= 1.0 - shadow;
    color = mix(color, metal, coverage);
  }
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
};
