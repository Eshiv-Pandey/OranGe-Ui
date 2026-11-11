export const VERTEX = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  // A single oversized triangle has no diagonal seam.
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
export const HEADER = `#version 300 es
precision highp float;
precision highp int;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uInput;
uniform vec2 uResolution;
uniform vec2 uCssSize;
uniform float uTime;
uniform vec2 uPointer;
uniform vec2 uVelocity;
uniform float uPointerActive;
uniform float uRadius;
uniform float uInteractionStrength;
uniform float uWarpEnabled;
uniform float uPixelProximity;
uniform float uDitherProximity;
uniform vec4 uRipples[8];
float proximity(vec2 uv) {
  vec2 delta = (uv - uPointer) * vec2(uCssSize.x / uCssSize.y, 1.0);
  return exp(-dot(delta, delta) / max(.001, uRadius * uRadius)) * uPointerActive;
}
vec2 sourceUv() {
  vec2 uv = vUv;
  uv -= uVelocity * proximity(uv) * .11 * uWarpEnabled * uInteractionStrength;
  for (int i = 0; i < 8; i++) {
    vec4 r = uRipples[i];
    vec2 d = (uv - r.xy) * vec2(uCssSize.x / uCssSize.y, 1.0);
    float dist = length(d), age = max(0.0, uTime - r.z);
    float ring = exp(-pow((dist - age * .24) * 32.0, 2.0));
    uv += normalize(d + .00001) * sin(dist * 85.0 - age * 12.0) * ring * .025 * exp(-age * 1.4) * r.w;
  }
  return uv;
}`;
export const COLOR_GLSL = `
uniform vec3 uColors[5];
uniform int uColorCount;
uniform float uSaturation;
uniform float uGrain;
vec3 finishColor(vec3 c) {
  float luma = dot(c, vec3(.2126, .7152, .0722));
  c = mix(vec3(luma), c, uSaturation);
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) - .5;
  return clamp(c + grain * uGrain, 0.0, 1.0);
}`;
export const NOISE_GLSL = `
float hash21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash21(i), hash21(i + vec2(1,0)), f.x), mix(hash21(i + vec2(0,1)), hash21(i + 1.0), f.x), f.y);
}
float fbm(vec2 p) {
  float value = 0.0, amplitude = .5;
  for (int i = 0; i < 5; i++) { value += noise2(p) * amplitude; p = mat2(.8,-.6,.6,.8) * p * 2.03 + 7.1; amplitude *= .5; }
  return value;
}`;
