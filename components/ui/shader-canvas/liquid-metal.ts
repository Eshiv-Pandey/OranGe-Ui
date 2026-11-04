import { clamp, hexRgb, type ShaderModule } from "./types";

/** Ray-marched chrome loops with open centers and reflected studio lights. */
export const liquidMetal: ShaderModule = {
  id: "liquid-metal", kind: "source", defaults: {}, renderBudget: { maxPixels: 240_000, maxFps: 24 },
  uniforms: {
    uMetal: { type: "vec3", value: (s) => hexRgb(s.color) }, uBackdrop: { type: "vec3", value: (s) => hexRgb(s.background) },
    uSpeed: { type: "float", value: (s) => clamp(s.speed, 0, 3, .35) }, uRibbonCount: { type: "int", value: (s) => Math.round(clamp(s.ribbons, 1, 5, 2)) },
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


float smoothMetal(float a, float b, float k) {
  float h = clamp(.5 + .5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}
float metalRing(vec3 p, float offset, float phase) {
  float t = uTime * uSpeed;
  p.x -= offset;
  float tilt = .42 * sin(phase + t * .18);
  p.yz = mat2(cos(tilt), -sin(tilt), sin(tilt), cos(tilt)) * p.yz;
  float angle = atan(p.y, p.x);
  float radius = .67 + sin(angle * 2.0 + phase + t * .25) * .085 * uTwist;
  float tube = .17 + .055 * sin(angle * 3.0 + phase - t * .3);
  vec2 q = vec2(length(p.xy / vec2(1.12, .82)) - radius, p.z - sin(angle * 2.0 + t * .2 + phase) * .18 * uTwist);
  return length(q) * .8 - tube;
}
float metalShape(vec3 p) {
  float t = uTime * uSpeed;
  float spin = sin(t * .16) * .25;
  p.xz = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * p.xz;
  p.xy = mat2(cos(-.35), -sin(-.35), sin(-.35), cos(-.35)) * p.xy;
  float d = metalRing(p, 0.0, .5);
  for (int i = 1; i < 5; i++) {
    if (i >= uRibbonCount) break;
    float signX = mod(float(i), 2.0) < .5 ? -1.0 : 1.0;
    vec3 q = p;
    q.y += signX * .16;
    q.z += sin(float(i) * 1.8 + t * .15) * .15;
    float ring = metalRing(q, signX * (.53 + float(i - 1) * .09), float(i) * 1.4);
    d = smoothMetal(d, ring, .10 + uTwist * .025);
  }
  return d;
}
vec3 metalNormal(vec3 p) {
  vec2 e = vec2(.002, 0);
  return normalize(vec3(metalShape(p + e.xyy) - metalShape(p - e.xyy), metalShape(p + e.yxy) - metalShape(p - e.yxy), metalShape(p + e.yyx) - metalShape(p - e.yyx)));
}
vec3 metalStudio(vec3 ray) {
  vec2 lamp = (uPointer - .5) * uPointerActive * uFollow * .6;
  float angle = atan(ray.x, ray.z) + lamp.x;
  float soft = .025 + uRoughness * .18;
  float ribbon = smoothstep(-.9 - soft, -.9 + soft, angle) * (1.0 - smoothstep(-.38 - soft, -.38 + soft, angle));
  float strip = smoothstep(.8 - soft, .8 + soft, angle) * (1.0 - smoothstep(1.05 - soft, 1.05 + soft, angle));
  float ceiling = smoothstep(.15, .6, ray.y + lamp.y);
  float horizon = 1.0 - smoothstep(.04, .2 + uRoughness * .2, abs(ray.y + .3));
  vec3 room = mix(vec3(.006), vec3(.18), ray.y * .5 + .5);
  room += ribbon * (1.0 - smoothstep(.6, .9, abs(ray.y))) * vec3(2.6, 2.65, 2.7);
  room += strip * vec3(2.1) + ceiling * .75 + horizon * .35;
  return room;
}
void main() {
  vec2 uv = sourceUv();
  float aspect = uCssSize.x / max(uCssSize.y, 1.0);
  vec2 p = (uv - .5) * vec2(aspect, 1.0);
  vec2 framed = p / min(aspect, 1.0);
  vec3 origin = vec3(0, 0, 3.8);
  vec3 ray = normalize(vec3(framed * 4.3, -3.8));
  float travel = 0.0;
  float distanceToSurface = 1.0;
  float minimumDistance = 100.0, closestTravel = 0.0;
  for (int i = 0; i < 68; i++) {
    distanceToSurface = metalShape(origin + ray * travel);
    if (distanceToSurface < minimumDistance) { minimumDistance = distanceToSurface; closestTravel = travel; }
    if (distanceToSurface < .001 || travel > 6.0) break;
    travel += distanceToSurface * .8;
  }
  float vignette = smoothstep(.0, 1.0, length(p));
  vec3 background = uBackdrop * (1.0 - vignette * .06);
  // The contact shadow follows the sculpture's broad footprint.
  background *= 1.0 - exp(-pow(framed.x * 2.2, 2.0) - pow((framed.y + .34) * 12.0, 2.0)) * .17;
  vec3 color = background;
  float edgeWidth = max(length(dFdx(ray)), length(dFdy(ray))) * max(closestTravel, 1.0) * 1.25;
  float coverage = 1.0 - smoothstep(.001, .001 + edgeWidth, minimumDistance);
  if (closestTravel < 6.0 && coverage > 0.0) {
    vec3 position = origin + ray * closestTravel;
    vec3 normal = metalNormal(position);
    vec3 reflected = reflect(ray, normal);
    float fresnel = pow(1.0 - max(dot(-ray, normal), 0.0), 3.0);
    vec3 chrome = metalStudio(reflected) * mix(uMetal, vec3(1.0), fresnel * .6);
    chrome += pow(max(dot(reflected, normalize(vec3(-.7, .8, 1))), 0.0), 75.0) * 1.3;
    vec3 film = .5 + .5 * cos(vec3(0, 2.1, 4.2) + normal.x * 4.0 + normal.y * 5.0);
    chrome += (film - .5) * uSheen * fresnel * .2;
    color = mix(background, pow(max(chrome, vec3(0.0)) / (1.0 + max(chrome, vec3(0.0))), vec3(.72)), coverage);
  }
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`,
};
