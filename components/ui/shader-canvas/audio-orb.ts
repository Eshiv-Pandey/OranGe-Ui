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
  float angle = atan(p.y, p.x);
  float ripple = (sin(angle * 5.0 + uTime * 1.8) + sin(angle * 3.0 - uTime * 2.1)) * uEnergy * .014;
  p /= .85 + uEnergy * .11 + ripple;
  float t = uTime * uSpeed;
  float radius = length(p);
  float z = sqrt(max(0.0, 1.0 - dot(p, p)));
  vec3 sphere = vec3(p, z);
  float turn = t * .3 + uEnergy * .45;
  sphere.xz = mat2(cos(turn), -sin(turn), sin(turn), cos(turn)) * sphere.xz;
  vec2 flow = sphere.xy;
  flow += vec2(sin(sphere.y * 2.1 + t * .62 + uEnergy), cos(sphere.x * 1.8 - t * .48)) * (.32 + uEnergy * .65);
  vec3 color = mix(uColors[0], uColors[1], smoothstep(-.6, .65, flow.x + flow.y * .5));
  color = mix(color, uColors[2], smoothstep(.08, .9, sin(flow.y * 1.8 - flow.x + t * .37)) * .85);
  color = mix(color, uColors[3 % uColorCount], smoothstep(.25, .95, cos(flow.x * 1.6 + flow.y * 1.1 + t * .48)) * .8);
  float luminance = dot(color, vec3(.2126, .7152, .0722));
  color = max(vec3(0.0), mix(vec3(luminance), color, 1.25));
  float shade = .68 + .32 * z;
  color *= shade;
  vec3 n = normalize(vec3(p, z));
  float rim = pow(1.0 - z, 3.0);
  color = mix(color, vec3(.78, .94, 1.0), rim * .72);
  float highlight = pow(max(dot(normalize(vec3(-.4, -.48, 1.0)), n), 0.0), 65.0);
  float longLight = exp(-pow((p.x + .25) * 13.0, 2.0) - pow((p.y + .43) * 3.5, 2.0));
  color += vec3(.98, .99, 1.0) * highlight * 1.5;
  color += vec3(.8, .92, 1.0) * longLight * .4;
  color += pow(max(dot(normalize(vec3(.7, .5, .4)), n), 0.0), 18.0) * vec3(.65, .4, .9) * .6;
  color += sin(z * 14.0 + flow.y * 4.0 + t * .3) * .035;

  color += uEnergy * .13;
  float edge = 1.0 - smoothstep(.96, 1.0, radius);
  fragColor = vec4(color, edge);
}`,
};
