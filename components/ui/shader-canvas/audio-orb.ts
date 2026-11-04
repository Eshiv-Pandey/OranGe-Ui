import { clamp, colorUniforms, type ShaderModule } from "./types";

export const audioOrb: ShaderModule = {
  id: "audio-orb", kind: "source", defaults: {}, renderBudget: { maxPixels: 260_000, maxFps: 30 },
  uniforms: {
    ...colorUniforms,
    uSpeed: { type: "float", value: (s) => clamp(s.speed, 0, 3, .6) },
    uEnergy: { type: "float", value: (s) => clamp(typeof s.audioLevel === "function" ? s.audioLevel() : s.audioLevel, 0, 1) },
  },
  fragment: `
uniform vec3 uColors[5];
uniform int uColorCount;
uniform float uSaturation;
uniform float uGrain;
uniform float uSpeed;
uniform float uEnergy;
void main() {
  vec2 p = (sourceUv() - .5) * 2.0;
  float t = uTime * uSpeed;
  float radius = length(p);
  float z = sqrt(max(0.0, 1.0 - dot(p, p)));
  vec3 sphere = vec3(p, z);
  float turn = t * .3;
  sphere.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * sphere.xz;
  vec2 flow = sphere.xy;
  flow += vec2(sin(sphere.y * 2.1 + t * .62), cos(sphere.x * 1.8 - t * .48)) * (.32 + uEnergy * .24);
  vec3 color = mix(uColors[0], uColors[1], smoothstep(-.6, .65, flow.x + flow.y * .5));
  color = mix(color, uColors[2], smoothstep(.08, .9, sin(flow.y * 1.8 - flow.x + t * .37)) * .85);
  color = mix(color, uColors[3 % uColorCount], smoothstep(.25, .95, cos(flow.x * 1.6 + flow.y * 1.1 + t * .48)) * .8);
  float shade = .62 + .38 * z;
  color *= shade;
  color += vec3(.16) * pow(max(dot(normalize(vec3(-.45, -.6, 1.0)), normalize(vec3(p, z))), 0.0), 4.0);
  color += uEnergy * .05;
  float edge = 1.0 - smoothstep(.96, 1.0, radius);
  fragColor = vec4(color, edge);
}`,
};
