import { clamp, colorUniforms, hexRgb, type ShaderModule } from "./types";

/** Live Orb wash and capsule geometry by jay sharma, MIT. See THIRD_PARTY_NOTICES.md. */
export const audioOrb: ShaderModule = {
  id: "audio-orb", kind: "source", defaults: {}, renderBudget: { maxPixels: 180_000, maxFps: 30 },
  uniforms: {
    ...colorUniforms,
    uSpeed: { type: "float", value: s => clamp(s.speed, 0, 3, .6) },
    uEnergy: { type: "float", value: s => clamp(typeof s.audioLevel === "function" ? s.audioLevel() : s.audioLevel, 0, 1) },
    uLook: { type: "vec2", value: s => typeof s.look === "function" ? s.look() : [0, 0] },
    uBlinkScale: { type: "float", value: s => clamp(typeof s.blinkScale === "function" ? s.blinkScale() : 1, 0, 1, 1) },
    uEye: { type: "vec3", value: s => hexRgb(s.eyeColor ?? "#1d2328") },
    uShowEyes: { type: "float", value: s => s.showEyes === false ? 0 : 1 },
  },
  fragment: `
uniform vec3 uColors[5];
uniform int uColorCount;
uniform float uSpeed;
uniform float uEnergy;
uniform vec2 uLook;
uniform float uBlinkScale;
uniform vec3 uEye;
uniform float uShowEyes;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

vec3 orient(vec3 p, vec2 look) {
  float yaw = look.x * 0.92;
  float pitch = -look.y * 0.78;
  float cy = cos(yaw);
  float sy = sin(yaw);
  float cp = cos(pitch);
  float sp = sin(pitch);
  vec3 q = vec3(p.x, p.y * cp - p.z * sp, p.y * sp + p.z * cp);
  return vec3(q.x * cy + q.z * sy, q.y, -q.x * sy + q.z * cy);
}

float eyeMask(vec3 n, vec3 e, vec3 right, vec3 up, float halfH, float rad) {
  float facing = dot(n, e);
  float x = dot(n, right) - dot(e, right);
  float y = dot(n, up) - dot(e, up);
  float d = length(vec2(x, y / max(halfH, .03))) - rad;
  float fill = 1.0 - smoothstep(-0.01, 0.01, d);
  return fill * smoothstep(0.12, 0.32, facing);
}

vec3 wash(vec3 n, float t) {
  vec2 q = n.xy * 2.2 + n.z * 0.85;
  vec2 w1 = vec2(
    fbm(q * 1.4 + vec2(t * 0.22, t * 0.18)),
    fbm(q * 1.4 + vec2(-t * 0.16, t * 0.24) + 4.1)
  );
  q += (w1 - 0.5) * 0.72;
  float f = fbm(q * 2.1 + vec2(0.0, t * 0.12));
  float g = fbm(q * 4.6 - vec2(t * 0.2, 0.0));
  vec3 col = mix(uColors[0], uColors[1], smoothstep(0.28, 0.72, f));
  return mix(col, uColors[2], pow(smoothstep(0.42, 0.9, g), 1.4));
}

void main() {
  vec2 uv = (sourceUv() - .5) * 2.0;
  uv.x *= uCssSize.x / max(uCssSize.y, 1.0);
  float angle = atan(uv.y, uv.x);
  float radius = .94 + uEnergy * .035;
  radius += sin(angle * 4.0 + uTime * 1.4) * uEnergy * .009;
  vec2 p = uv / radius;
  float r2 = dot(p, p);
  float edge = 1.0 - smoothstep(.985, 1.012, sqrt(max(r2, 0.0)));
  if (edge <= .001) { fragColor = vec4(0.0); return; }
  vec3 n = normalize(vec3(p, sqrt(max(1.0 - r2, 0.0))));
  vec2 look = uLook;
  float lm = length(look);
  if (lm > 1.0) look /= lm;
  vec3 right = orient(vec3(1.0, 0.0, 0.0), look);
  vec3 up = orient(vec3(0.0, 1.0, 0.0), look);
  vec3 leftEye = orient(normalize(vec3(-.32, .08, 1.0)), look);
  vec3 rightEye = orient(normalize(vec3(.32, .08, 1.0)), look);
  float halfH = max(uBlinkScale, .03);
  float eyes = max(eyeMask(n, leftEye, right, up, halfH, .065), eyeMask(n, rightEye, right, up, halfH, .065));
  vec3 movingNormal = normalize(n + vec3(sin(n.y * 3.0 + uTime), cos(n.x * 3.0 - uTime), 0.0) * uEnergy * .18);
  vec3 body = wash(movingNormal, uTime * uSpeed + uEnergy * .6);
  if (uColorCount > 3) body = mix(body, uColors[3], smoothstep(.55, .9, fbm(n.xy * 3.0 + uTime * .1)) * .35);
  body *= 1.0 + uEnergy * .045;
  fragColor = vec4(clamp(mix(body, uEye, eyes * uShowEyes), 0.0, 1.0), edge);
}
`,
};
