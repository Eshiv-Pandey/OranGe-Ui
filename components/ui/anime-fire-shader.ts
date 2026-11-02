/**
 * Adapted from Shader Anime Fire by jay sharma (@radiumcoders), MIT.
 * https://www.23rd.dev/r/shader-anime-fire.json
 * See THIRD_PARTY_NOTICES.md for the attribution and complete license.
 *
 * Local changes: uniform names, appearance treatments, pixel mode and embers.
 * The reference's rising turbulence, cel bands and linear-light color are retained.
 */
export const ANIME_FIRE_FRAGMENT = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uIntensity;
uniform float uHeight;
uniform float uIgnite;
uniform float uTheme;
uniform float uDither;
uniform float uPixelSize;
uniform float uPointerActive;
uniform vec2 uPointer;
// Ember, flame, core and the paper / ink underneath, in linear light.
uniform vec3 uEmber;
uniform vec3 uFlame;
uniform vec3 uCore;
uniform vec3 uBase;
uniform float uAppearance;

// Dave Hoskins' hash: no sin(), so it stays stable on mobile GPUs.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v / 0.875;
}

// Classic Bayer (WebGL1-safe, no bitwise ops)
float bayer2(vec2 c) {
  return mod(c.x * 2.0 + c.y * 3.0, 4.0);
}

float bayer4(vec2 p) {
  vec2 c = mod(floor(p), 4.0);
  return bayer2(mod(c, 2.0)) * 4.0 + bayer2(floor(c * 0.5));
}

float bayer8(vec2 p) {
  vec2 c = mod(floor(p), 8.0);
  return (bayer4(floor(c * 0.5)) * 4.0 + bayer2(mod(c, 2.0)) + 0.5) / 64.0;
}

float climbOf() {
  return mix(0.18, 0.78, uHeight) * uIgnite;
}

// Temperature: below 0 is air, around 1 is the white-hot bed of the fire.
float temperature(vec2 uv, float aspect, float t, float plume) {
  float x = uv.x * aspect;
  float climb = max(climbOf(), 0.001);
  float y = uv.y / climb;

  // Slow swells along the bed, so the flame line is never flat.
  y /= mix(0.6, 1.3, fbm(vec2(x * 1.1 + 3.1, t * 0.16)));
  // Under the pointer the fire stretches up toward it.
  y /= 1.0 + plume * max(uPointer.y / climb - 0.4, 0.3);

  // Turbulence rising through the flame: stretched tall so it reads as
  // tongues, and swept sideways harder the higher it climbs.
  // Few octaves on purpose: smooth, graphic tongues rather than ragged,
  // photographic ones.
  vec2 q = vec2(x * 4.4, uv.y * 1.5 - t * 1.1);
  vec2 w = vec2(
    fbm(q * vec2(0.5, 0.8) + vec2(0.0, -t * 0.3)),
    fbm(q * 0.6 + vec2(5.2, 1.3 - t * 0.25))
  );
  q += (w - 0.5) * vec2(2.4, 0.8) * (0.3 + y);
  float body = fbm(q) - 0.5;
  // Ridged: where the finer noise crosses its midpoint it peaks sharply,
  // which curls the bands into licks instead of flat stripes.
  float licks = 0.2 - abs(fbm(q * vec2(1.5, 2.0) + vec2(0.0, -t * 1.6)) - 0.5) * 2.0;
  float turb = body * 0.8 + licks * 0.45;

  float T = 1.0 - y * 1.1 + turb * 2.6 * min(0.5 + y, 1.2);
  // Nothing burns far above the tips, however the noise rolls.
  return T - smoothstep(1.0, 1.7, y);
}

// Flat cel bands, hottest innermost. 'hot' is the core pushed toward white.
vec3 bands(float T, vec3 hot) {
  float w = 0.012;
  vec3 c = mix(uEmber, uFlame, smoothstep(0.3 - w, 0.3 + w, T));
  c = mix(c, uCore, smoothstep(0.6 - w, 0.6 + w, T));
  return mix(c, hot, smoothstep(1.02 - w, 1.02 + w, T));
}

vec3 linearToSrgb(vec3 c) {
  c = clamp(c, 0.0, 1.0);
  vec3 lo = c * 12.92;
  vec3 hi = 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055;
  return mix(lo, hi, step(vec3(0.0031308), c));
}

void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  float t = uTime;

  vec2 cell = floor(gl_FragCoord.xy / uPixelSize);
  vec2 uv = gl_FragCoord.xy / uResolution;
  if (uDither > 0.5 || uPixelSize > 1.0) uv = (cell + 0.5) * uPixelSize / uResolution;

  float dx = (uv.x - uPointer.x) * aspect;
  float plume = exp(-dx * dx * 26.0) * uPointerActive;

  float T = temperature(uv, aspect, t, plume);
  // Dither shakes the band edges by the Bayer threshold, so each boundary
  // prints as an ordered-dot blend instead of a hard line.
  float q = uDither > 0.5 ? bayer8(cell) - 0.5 : 0.0;
  T += q * 0.14;
  float edge = uDither > 0.5 ? 0.001 : 0.012;
  float cover = smoothstep(0.0, edge, T) * clamp(uIntensity, 0.0, 1.0);

  // The whole fire breathes a little, like a real one lighting a room.
  float flicker = 0.86 + 0.14 * noise(vec2(t * 2.3, 4.7));
  float glow = exp(-uv.y / max(climbOf() * 1.7, 0.02) * 3.4) * flicker;
  glow += plume * exp(-length(vec2(dx, uv.y - uPointer.y)) * 5.0) * 0.5;
  glow *= uIntensity;
  if (uDither > 0.5) glow = step(0.52 + q * 0.98, glow * 2.0) * 0.5;

  // On ink the core goes near white; on paper white would vanish into the
  // page, so it stops at a pale gold.
  vec3 hot = mix(uCore, vec3(1.0), uTheme > 0.5 ? 0.75 : 0.4);
  vec3 col = mix(uBase, mix(uEmber, uFlame, 0.4), glow * (uTheme > 0.5 ? 0.08 : 0.12));
  col = mix(col, bands(T, hot), cover);

  vec3 srgb = linearToSrgb(col);
  if (uDither < 0.5) srgb += (hash(gl_FragCoord.xy + fract(t)) - 0.5) * 0.006;
  // Local appearances retain the reference's underlying flame field.
  if (uAppearance > 1.5 && uAppearance < 2.5) {
    float contour = min(abs(T), min(abs(T - 0.3), abs(T - 0.6)));
    srgb = mix(srgb, vec3(.055, .035, .06), (1.0 - smoothstep(.01, .04, contour)) * cover);
  }
  if (uAppearance > 3.5) {
    vec2 cell = fract(gl_FragCoord.xy / vec2(5.0, 8.0));
    float glyph = step(.18, cell.x) * step(cell.x, .82) * step(.18, cell.y) * step(cell.y, .8);
    float lit = step(0.0, T) * (.45 + step(.3, T) * .25 + step(.6, T) * .3);
    vec3 ink = linearToSrgb(mix(uEmber, uCore, lit)) * mix(.48, 1.0, uTheme);
    srgb = mix(linearToSrgb(uBase), ink, lit * glyph * clamp(uIntensity, 0.0, 1.0));
  } else {
    // Original local embers accompany the separate, gesture-gated crackle.
    for (int i = 0; i < 12; i++) {
      float fi = float(i), seed = hash(vec2(fi, 3.4));
      float rise = fract(seed + t * (.07 + seed * .035));
      float x = hash(vec2(fi, 7.8)) + sin(rise * 9.0 + fi + t) * .018;
      vec2 d = (uv - vec2(x, .12 + rise * .77)) * vec2(aspect, 1.0);
      float ember = (1.0 - smoothstep(.001, .0045, length(d))) * sin(rise * 3.14159);
      srgb = mix(srgb, linearToSrgb(uFlame), ember * .7 * clamp(uIntensity, 0.0, 1.0));
    }
  }
  gl_FragColor = vec4(clamp(srgb, 0.0, 1.0), 1.0);
}
`;
