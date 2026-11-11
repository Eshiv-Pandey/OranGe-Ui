import { clamp, hexRgb, sourceColors, type ShaderModule } from "./types";

/** A moving pigment wash mapped onto a sphere, independent of the SVG face. */
export const elementalOrb: ShaderModule = {
  id: "elemental-orb", kind: "source", defaults: {},
  renderBudget: { maxPixels: 90_000, maxFps: 30 },
  uniforms: {
    uOrbA: { type: "vec3", value: (settings) => hexRgb(sourceColors(settings)[0]) },
    uOrbB: { type: "vec3", value: (settings) => hexRgb(sourceColors(settings)[1]) },
    uOrbC: { type: "vec3", value: (settings) => hexRgb(sourceColors(settings)[2]) },
    uOrbSpeed: { type: "float", value: (settings) => clamp(settings.speed, .1, 3, 1) },
  },
  fragment: `
uniform vec3 uOrbA;
uniform vec3 uOrbB;
uniform vec3 uOrbC;
uniform float uOrbSpeed;

float orbHash(vec3 p) {
  p = fract(p * .1031);
  p += dot(p, p.yzx + 33.33);
  return fract((p.x + p.y) * p.z);
}
float orbNoise(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(orbHash(i), orbHash(i + vec3(1,0,0)), f.x),
        mix(orbHash(i + vec3(0,1,0)), orbHash(i + vec3(1,1,0)), f.x), f.y),
    mix(mix(orbHash(i + vec3(0,0,1)), orbHash(i + vec3(1,0,1)), f.x),
        mix(orbHash(i + vec3(0,1,1)), orbHash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
float orbFlow(vec3 p) {
  float value = 0.0, amplitude = .56;
  for (int octave = 0; octave < 4; octave++) {
    value += orbNoise(p) * amplitude;
    p = p.yzx * 2.03 + vec3(3.7, 8.1, 1.3);
    amplitude *= .46;
  }
  return value;
}
void main() {
  vec2 p = (sourceUv() - .5) * 2.0;
  float z = sqrt(max(0.0, 1.0 - dot(p, p)));
  vec3 normal = vec3(p, z);
  float t = uTime * uOrbSpeed * .35;
  float angle = t * .4;
  normal.xz = mat2(cos(angle), -sin(angle), sin(angle), cos(angle)) * normal.xz;
  vec3 domain = normal * 2.2 + vec3(0.0, t * .26, t * .15);
  vec3 warp = vec3(orbFlow(domain + t * .2), orbFlow(domain.yzx - t * .18 + 4.7), orbFlow(domain.zxy + 7.3));
  float pigment = orbFlow(domain + (warp - .5) * 2.4);
  float ribbon = orbFlow(domain * 1.8 - warp * 1.6 + vec3(t * .3));
  vec3 color = mix(uOrbA, uOrbB, smoothstep(.25, .65, pigment));
  color = mix(color, uOrbC, smoothstep(.42, .72, ribbon) * .85);
  color *= .87 + z * .13;
  fragColor = vec4(color, 1.0);
}`,
};
