import { clamp, hexRgb, type ShaderModule } from "./types";

/** Twisted, beveled ribbons with analytic normals and a reflected studio environment. */
export const liquidMetal: ShaderModule = {
  id: "liquid-metal", kind: "source", defaults: {}, renderBudget: { maxPixels: 360_000, maxFps: 30 },
  uniforms: {
    uMetal: { type: "vec3", value: (s) => hexRgb(s.color) }, uBackdrop: { type: "vec3", value: (s) => hexRgb(s.background) },
    uSpeed: { type: "float", value: (s) => clamp(s.speed, 0, 3, .35) }, uRibbonCount: { type: "int", value: (s) => Math.round(clamp(s.ribbons, 1, 5, 3)) },
    uTwist: { type: "float", value: (s) => clamp(s.twist, 0, 2, 1) }, uRoughness: { type: "float", value: (s) => clamp(s.roughness, 0, 1, .12) },
    uSheen: { type: "float", value: (s) => clamp(s.sheen, 0, 1, .2) }, uFollow: { type: "float", value: (s) => s.interactive === false ? 0 : 1 },
  },
  fragment: `
uniform vec3 uMetal, uBackdrop;
uniform float uSpeed, uTwist, uRoughness, uSheen, uFollow;
uniform int uRibbonCount;
float ribbonSpine(float x, float lane, float t) {
  float shift = (uPointer.y - .5) * uPointerActive * uFollow * .06;
  return lane + .12 * sin(x * 2.8 + t * .67 + lane * 8.0)
    + .045 * cos(x * 5.1 - t * .43 + lane * 12.0) + shift;
}
vec3 reflectedRoom(vec3 r) {
  vec2 lamp = (uPointer - .5) * uPointerActive * uFollow * .7;
  float blur = .035 + uRoughness * .25;
  float softbox = 1.0 - smoothstep(.26, .26 + blur, abs(r.x + .35 - lamp.x));
  softbox *= 1.0 - smoothstep(.6, .95, abs(r.y - lamp.y));
  float strip = 1.0 - smoothstep(.045, .045 + blur, abs(r.x - .63 - lamp.x));
  float ceiling = smoothstep(.1, .55, r.y + lamp.y);
  float horizon = exp(-pow((r.y + .32) * 6.0, 2.0));
  return vec3(.012 + ceiling * .16) + softbox * vec3(3.1, 3.0, 2.9)
    + strip * vec3(2.5, 2.75, 3.0) + horizon * .38;
}
vec3 metalTone(vec3 c) {
  c *= 1.1;
  return pow(clamp((c * (2.51 * c + .03)) / (c * (2.43 * c + .59) + .14), 0.0, 1.0), vec3(.4545));
}
void main() {
  float aspect = uCssSize.x / max(uCssSize.y, 1.0);
  vec2 screen = (sourceUv() - .5) * vec2(aspect, 1.0);
  vec2 p = mat2(.9394, -.3429, .3429, .9394) * screen;
  float t = uTime * uSpeed;
  vec3 color = uBackdrop * (1.0 - min(length(screen) * .055, .12));
  float count = float(uRibbonCount);
  for (int i = 0; i < 5; i++) {
    if (i >= uRibbonCount) break;
    float k = float(i), f = count > 1.0 ? k / (count - 1.0) : .5;
    float lane = (f - .5) * (.18 + count * .11);
    float localTime = t * (.85 + f * .15);
    float middle = ribbonSpine(p.x, lane, localTime);
    float slope = (ribbonSpine(p.x + .002, lane, localTime) - ribbonSpine(p.x - .002, lane, localTime)) / .004;
    float distance = (p.y - middle) / sqrt(1.0 + slope * slope);
    float roll = (.65 + uTwist * .8) * p.x + k * 1.63 + localTime * .36;
    roll += sin(p.x * 2.1 - localTime * .3 + k) * .35 * uTwist;
    float width = (.115 - count * .008) * (.9 + .16 * sin(p.x * 1.7 + localTime * .5 + k));
    float projected = width * max(abs(cos(roll)), .06);
    float aa = max(fwidth(distance), .0008);
    float shadow = exp(-pow((distance + .027) / (projected + .024), 4.0)) * .2;
    color *= 1.0 - shadow;
    float coverage = 1.0 - smoothstep(projected - aa, projected + aa, abs(distance));
    if (coverage <= .001) continue;
    float crossSection = clamp(distance / projected, -1.0, 1.0);
    vec3 tangent = normalize(vec3(1.0, slope, 0.0));
    vec3 across = normalize(vec3(-slope, 1.0, 0.0));
    vec3 normal = cos(roll) * vec3(0.0, 0.0, 1.0) - sin(roll) * across;
    float bevel = crossSection * .35 + pow(abs(crossSection), 5.0) * sign(crossSection) * .8;
    normal = normalize(normal + across * bevel + tangent * sin(p.x * 18.0 - localTime * 2.4 + k) * .025);
    if (normal.z < 0.0) normal = -normal;
    vec3 reflected = reflect(vec3(0.0, 0.0, -1.0), normal);
    float fresnel = pow(1.0 - normal.z, 4.0);
    vec3 film = .5 + .5 * cos(vec3(0.0, 2.1, 4.2) + p.x * 1.9 + crossSection * 1.2 + localTime * .4);
    vec3 tint = mix(uMetal, vec3(1.0), fresnel * .6) * mix(vec3(1.0), .65 + film * .8, uSheen * (.3 + fresnel * .7));
    vec3 light = reflectedRoom(reflected) * tint;
    light += pow(max(dot(reflected, normalize(vec3(-.45, .5, 1.0))), 0.0), 90.0) * tint * 2.2;
    float cutline = pow(abs(crossSection), 20.0);
    light += cutline * (.22 + fresnel * .65) * tint;
    color = mix(color, metalTone(light), coverage);
  }
  fragColor = vec4(color, 1.0);
}`,
};
