import { clamp, hexRgb, type ShaderModule } from "./types";

/** A continuous mercury surface with reflected studio light panels. */
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

float metalSurface(vec2 p, float t) {
  float detail = .65 + float(uRibbonCount) * .18;
  p *= detail;
  p += vec2(sin(p.y * 1.2 + t * .35), cos(p.x * 1.15 - t * .28)) * (.28 + uTwist * .35);
  float broad = sin(p.x * 1.8 + sin(p.y * 1.25 + t * .22) * 1.25 + t * .31);
  float cross = cos(p.y * 2.0 - sin(p.x * 1.65 - t * .2) * 1.15 - t * .25);
  float fold = sin(p.x * 3.1 + p.y * 1.9 + sin(p.y * 2.25 + t * .18) * uTwist);
  return broad * .5 + cross * .38 + fold * .105;
}
float metalPanel(vec2 p, vec2 halfSize, float feather) {
  vec2 edge = smoothstep(halfSize - feather, halfSize + feather, abs(p));
  return (1.0 - edge.x) * (1.0 - edge.y);
}
vec3 metalStudio(vec3 ray, vec2 lamp) {
  vec2 sphere = vec2(atan(ray.x, ray.z), asin(clamp(ray.y, -.999, .999)));
  sphere += lamp;
  float softness = .035 + uRoughness * .24;
  float key = metalPanel(sphere - vec2(-.65, .55), vec2(.5, .42), softness);
  float strip = metalPanel(sphere - vec2(1.05, -.1), vec2(.13, .86), softness * .7);
  float fill = metalPanel(sphere - vec2(.12, -1.0), vec2(1.0, .2), softness * 1.8);
  float ceiling = smoothstep(.25, .85, ray.y) * .42;
  vec3 room = mix(vec3(.025, .035, .043), vec3(.25, .29, .32), .5 + .5 * ray.y);
  room *= 1.0 - metalPanel(sphere - vec2(.3, .1), vec2(.19, .44), .14) * .9;
  return room + ceiling + key * vec3(2.5, 2.45, 2.35) + strip * vec3(2.0, 2.2, 2.4) + fill * vec3(.9, .97, 1.05);
}
void main() {
  vec2 uv = sourceUv();
  vec2 position = (uv - .5) * vec2(uCssSize.x / max(uCssSize.y, 1.0), 1.0);
  vec2 p = position * 5.2;
  float t = uTime * uSpeed;
  float e = .003;
  float dx = (metalSurface(p + vec2(e, 0), t) - metalSurface(p - vec2(e, 0), t)) / (2.0 * e);
  float dy = (metalSurface(p + vec2(0, e), t) - metalSurface(p - vec2(0, e), t)) / (2.0 * e);
  vec3 normal = normalize(vec3(-dx * 1.45, -dy * 1.45, 1.0));
  vec3 view = normalize(vec3(position * .3, -1.0));
  vec3 reflection = reflect(view, normal);
  vec2 lamp = (uPointer - .5) * vec2(.6, .35) * uPointerActive * uFollow;
  vec3 studio = metalStudio(reflection, lamp);
  float fresnel = pow(1.0 - max(dot(-view, normal), 0.0), 4.0);
  vec3 tint = mix(uMetal, vec3(1.0), fresnel * .65);
  vec3 color = studio * tint + uBackdrop * .025;
  vec3 film = .5 + .5 * cos(vec3(0, 2.1, 4.2) + reflection.y * 6.0 + reflection.x * 4.0);
  color += (film - .5) * uSheen * fresnel * .32;
  color = color / (1.0 + color * .24);
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
};
