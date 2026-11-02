import { clamp, hexRgb } from "./types";

export const GRASS_DEFAULTS = {
  speed: .7, windStrength: .7, gustSpeed: .6, direction: 62, density: 80,
  bladeLength: 1.25, seed: 7, color: "#76aa3c", tipColor: "#e3ed9d", shadowColor: "#17351d", flowers: .55, sunlight: 1.2,
} as const;

export type GrassSettings = { [K in keyof typeof GRASS_DEFAULTS]: (typeof GRASS_DEFAULTS)[K] extends number ? number : string };
export const GRASS_SEGMENTS = 9;
export const GRASS_MAX_BLADES = 56000;
export const GRASS_STRIDE = 8;

export function normalizeGrassSettings(input: Partial<GrassSettings>): GrassSettings {
  const color = (value: unknown, fallback: string) => typeof value === "string" && /^#[\da-f]{3}([\da-f]{3})?$/i.test(value) ? value : fallback;
  return {
    speed: clamp(input.speed, 0, 3, .7), windStrength: clamp(input.windStrength, 0, 2, .7),
    gustSpeed: clamp(input.gustSpeed, 0, 2, .6), direction: clamp(input.direction, 0, 360, 62),
    density: clamp(input.density, 35, 160, 80), bladeLength: clamp(input.bladeLength, .5, 1.5, 1.25),
    flowers: clamp(input.flowers, 0, 1, .55), sunlight: clamp(input.sunlight, .4, 1.6, 1.2),
    seed: clamp(input.seed, 0, 1000, 7), color: color(input.color, GRASS_DEFAULTS.color),
    tipColor: color(input.tipColor, GRASS_DEFAULTS.tipColor), shadowColor: color(input.shadowColor, GRASS_DEFAULTS.shadowColor),
  };
}

export const grassRgb = (color: string) => hexRgb(color);

/** Root positions and blade traits never depend on time, wind, pointer or length. */
export function createGrassField(aspect: number, density: number, seed: number) {
  const width = Math.max(.05, aspect) + .4, height = 1.4;
  const requested = Math.min(GRASS_MAX_BLADES, Math.round(19000 * width * height * Math.pow(density / 80, 1.55)));
  const columns = Math.max(1, Math.ceil(Math.sqrt(requested * width / height)));
  const rows = Math.max(1, Math.floor(requested / columns));
  const count = columns * rows;
  const data = new Float32Array(count * GRASS_STRIDE);
  let state = (Math.round(seed * 4096) ^ 0x9e3779b9) >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = Math.imul(state ^ (state >>> 15), state | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  // Far roots are submitted first, so nearer blades occlude their lower stems.
  // Jitter spans the cell; there are no repeated tufts or aligned root rows.
  for (let row = 0; row < rows; row++) {
    for (let column = 0; column < columns; column++) {
      const offset = (row * columns + column) * GRASS_STRIDE;
      const x = ((column + random()) / columns - .5) * width;
      const y = (.5 - (row + random()) / rows) * height;
      const depth = .3 + (.7 - y) * .65;
      const length = (.028 + Math.pow(random(), .68) * .10 + (random() > .92 ? random() * .07 : 0)) * depth;
      data.set([
        x + Math.sin(y * 47 + seed) * .0025, y,
        length, (.00028 + random() * .00068) * depth,
        (random() - .5) * .54, random() * Math.PI * 2,
        .72 + random() * .58, random(),
      ], offset);
    }
  }
  return { data, count };
}

const FIELD = `
uniform float uDirection, uSeed;
float meadowNoise(vec2 p) {
  vec2 cell = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  vec4 corners = vec4(dot(cell, vec2(127.1, 311.7)), dot(cell + vec2(1, 0), vec2(127.1, 311.7)),
    dot(cell + vec2(0, 1), vec2(127.1, 311.7)), dot(cell + vec2(1), vec2(127.1, 311.7)));
  corners = fract(sin(corners + uSeed * 1.73) * 43758.5453);
  return mix(mix(corners.x, corners.y, f.x), mix(corners.z, corners.w, f.x), f.y);
}
vec4 meadow(vec2 root) {
  vec2 wind = vec2(sin(uDirection), cos(uDirection));
  vec2 crosswind = vec2(wind.y, -wind.x);
  vec2 q = vec2(dot(root, crosswind), dot(root, wind));
  // Seeded local patches vary convergence and interrupt the oblique ridges.
  // Their roots and lighting remain fixed while gusts bend the individual leaves.
  float patchNoise = meadowNoise(q * vec2(7.0, 9.0));
  float breakup = meadowNoise(q * vec2(12.0, 6.0) + 4.7);
  float phase = q.x * 17.0 + sin(q.y * 10.0 + q.x * 2.4 + uSeed * .31) * 1.25 + (patchNoise - .5) * 3.4;
  float crossFold = q.y * 13.0 - q.x * 8.0 + (breakup - .5) * 3.8 + uSeed * .43;
  // Exchange which ridge family leads locally. A phase wobble alone leaves
  // every crest connected; this lets neighboring crests end, fork and overlap.
  float branch = smoothstep(.25, .70, breakup);
  float folds = sin(phase) * mix(.88, .20, branch) + sin(crossFold) * mix(.22, .92, branch);
  float ridge = smoothstep(-.68, .78, folds + .12 * (breakup - .5));
  ridge *= .9 + .1 * sin(q.y * 15.0 + q.x * 7.0 + uSeed);
  float angle = uDirection + .6 * (patchNoise - .5) + .27 * cos(phase) * (1.0 - branch * .6) + (.25 + branch * .22) * sin(crossFold);
  float curl = .3 * sin(phase + .8) + .22 * cos(q.y * 24.0 + q.x * 11.0) + .2 * (breakup - .5);
  return vec4(angle, ridge, phase, curl);
}`;

/** Each instance is one nine-segment leaf, with no per-pixel neighbor search. */
export const GRASS_VERTEX = `#version 300 es
precision highp float;
layout(location = 0) in vec4 aBlade;
layout(location = 1) in vec4 aShape;
uniform vec2 uResolution, uCssSize, uPointer, uVelocity;
uniform float uTime, uSpeed, uWind, uGust, uLength, uPointerActive, uRadius, uInteractionStrength, uFlowers;
out float vAcross, vWidth, vHeight, vLight, vTint, vTurn, vDepth, vFlower;
out vec2 vPetal;
${FIELD}
void main() {
  float h = float(gl_VertexID / 2) / ${GRASS_SEGMENTS}.0;
  float side = (gl_VertexID % 2 == 0) ? -1.0 : 1.0;
  vec2 root = aBlade.xy;
  vec4 field = meadow(root);
  vec2 wind = vec2(sin(uDirection), cos(uDirection));
  bool flower = aShape.w > 1.0 - uFlowers * .0046;
  float angle = flower ? .2 + aShape.x * .4 : field.x + (aShape.w - .5) * .3;
  float leafH = h;
  if (flower) h = min(1.0, float(gl_VertexID / 2) / 6.0);
  vec2 axis = vec2(sin(angle), cos(angle)), normal = vec2(axis.y, -axis.x);
  float clock = uTime * uSpeed;
  float gust = sin(dot(root, wind) * 11.0 - dot(root, vec2(wind.y, -wind.x)) * 4.0 - clock * uGust * 1.8);
  float flutter = sin(clock * 2.1 + aShape.y + root.y * 14.0);
  float curl = field.w + aShape.x + uWind * (.06 + .15 * gust + .04 * flutter);
  float length = aBlade.z * uLength * (.9 + field.y * .6);
  if (flower) length = (.06 + aBlade.z * .8) * uLength;
  float arc = curl * h * h + .16 * sin(h * 3.14159265) * sin(aShape.y) * h;
  float derivative = 2.0 * curl * h + .16 * sin(aShape.y) * (sin(h * 3.14159265) + h * 3.14159265 * cos(h * 3.14159265));
  vec2 away = root - (uPointer - .5) * vec2(uCssSize.x / uCssSize.y, 1.0);
  float influence = exp(-dot(away, away) / max(.001, uRadius * uRadius)) * uPointerActive;
  vec2 pressure = (normalize(away + vec2(.0001)) * .72 + uVelocity * vec2(uCssSize.x / uCssSize.y, 1.0) * .38);
  pressure *= influence * uInteractionStrength;
  pressure = clamp(pressure, vec2(-1.2), vec2(1.2));
  vec2 bend = pressure + wind * uWind * (.055 + .095 * gust);
  // Every animated displacement has h squared as a factor: at h=0 it is zero.
  vec2 center = root + length * (axis * h + normal * arc + bend * h * h);
  vec2 tangent = normalize(axis + normal * derivative + bend * 2.0 * h);
  vec2 across = vec2(tangent.y, -tangent.x);
  float width = aBlade.w * (flower ? .65 : 1.0) * pow(max(0.0, 1.0 - h), .72) * (.78 + .22 * sin(h * 3.14159265));
  float outer = width * 2.8 + .75 / uResolution.y;
  vec2 position = center + across * side * outer;
  vPetal = vec2(0); vFlower = 0.0;
  if (flower && gl_VertexID >= 14) {
    position = center;
    if (gl_VertexID >= 16) {
      vec2 petal = vec2(side, gl_VertexID < 18 ? -1.0 : 1.0);
      float radius = .003 + (.7 - root.y) * .0034;
      position += petal * radius;
      vPetal = petal; vFlower = 1.0;
    }
  }
  gl_Position = vec4(position * vec2(uCssSize.y / uCssSize.x, 1.0) * 2.0, 0.0, 1.0);
  vAcross = side * outer;
  vWidth = width;
  vHeight = h;
  vLight = field.y;
  vDepth = root.y;
  if (!flower) vHeight = leafH;
  vTint = aShape.z;
  vTurn = dot(tangent, normalize(vec2(-.6, .8)));
}`;

export const GRASS_FRAGMENT = `#version 300 es
precision highp float;
in float vAcross, vWidth, vHeight, vLight, vTint, vTurn, vDepth, vFlower;
in vec2 vPetal;
uniform vec3 uGrassColor, uTipColor, uShadowColor;
uniform float uSunlight;
out vec4 fragColor;
void main() {
  float dapple = .22 + vLight * .97;
  float distanceLight = smoothstep(-.3, .6, vDepth) * .2;
  if (vFlower > .5) {
    float angle = atan(vPetal.y, vPetal.x);
    float petal = .66 + .23 * cos(angle * 5.0);
    float radius = length(vPetal);
    float alpha = 1.0 - smoothstep(petal - .12, petal + .04, radius);
    vec3 blossom = mix(vec3(1.0,.99,.91), vec3(.94,.77,.84), smoothstep(.94,1.3,vTint));
    blossom = mix(vec3(.94,.73,.2), blossom, smoothstep(.16,.31,radius));
    blossom *= .65 + dapple * .4 * uSunlight;
    fragColor = vec4(blossom * alpha, alpha); return;
  }
  float blur = smoothstep(.1, .7, vDepth) * .0009;
  float aa = max(.00003, fwidth(vAcross) * .55) + blur;
  float coverage = 1.0 - smoothstep(max(0.0,vWidth - aa), vWidth + aa, abs(vAcross));
  coverage *= 1.0 - smoothstep(.965, 1.0, vHeight);
  if (coverage < .01) discard;
  float rib = exp(-abs(vAcross / max(vWidth,.00002) + .25) * 9.0);
  vec3 leaf = mix(uGrassColor * vec3(.84,.94,.6), uTipColor, .15 + .5 * pow(vHeight,.9));
  float light = (dapple + distanceLight) * (.4 + .6 * sqrt(vHeight)) * vTint * uSunlight;
  leaf = mix(uShadowColor, leaf, .5 + .5 * vHeight) * light;
  leaf += uTipColor * (rib * .24 + .13 * pow(vHeight,4.0)) * vLight * uSunlight;
  leaf += uShadowColor * .23;
  leaf = mix(leaf, uTipColor * .68, smoothstep(.25,.8,vDepth) * .28);
  fragColor = vec4(clamp(leaf,0.0,1.0) * coverage, coverage);
}`;

export const GRASS_GROUND_VERTEX = `#version 300 es
precision highp float;
out vec2 vUv;
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = p; gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

export const GRASS_GROUND_FRAGMENT = `#version 300 es
precision highp float;
in vec2 vUv;
uniform vec2 uCssSize;
uniform vec3 uGrassColor, uShadowColor, uTipColor;
uniform float uSunlight;
out vec4 fragColor;
${FIELD}
void main() {
  vec2 p = (vUv - .5) * vec2(uCssSize.x / uCssSize.y, 1.0);
  float grain = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  float ridge = meadow(p).y;
  vec3 ground = mix(uShadowColor * .65, uGrassColor * .75, ridge * .75) * uSunlight;
  ground = mix(ground, uTipColor * .72, smoothstep(.1,.7,p.y) * .48);
  ground += grain * .012;
  fragColor = vec4(ground, 1.0);
}`;
