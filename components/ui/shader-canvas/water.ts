import { NOISE_GLSL } from "./common";
import { clamp, hexRgb, type ShaderModule } from "./types";
export const water: ShaderModule = {
  id: "water", kind: "source", defaults: { speed: .55, scale: 1.8, depth: .65, sparkle: .8, choppiness: .55, sunAngle: 35, color: "#067b83", deepColor: "#001d31" },
  uniforms: {
    uSpeed: { type: "float", value: (s) => clamp(s.speed, 0, 3, .55) }, uScale: { type: "float", value: (s) => clamp(s.scale, .5, 8, 1.8) },
    uDepth: { type: "float", value: (s) => clamp(s.depth, 0, 1, .65) }, uSparkle: { type: "float", value: (s) => clamp(s.sparkle, 0, 2, .8) },
    uChop: { type: "float", value: (s) => clamp(s.choppiness, 0, 1, .55) }, uSunAngle: { type: "float", value: (s) => clamp(s.sunAngle, 0, 360, 35) * Math.PI / 180 },
    uWaterColor: { type: "vec3", value: (s) => hexRgb(s.color) }, uDeepColor: { type: "vec3", value: (s) => hexRgb(s.deepColor) },
  },
  fragment: `${NOISE_GLSL}
uniform float uSpeed;
uniform float uScale;
uniform float uDepth;
uniform float uSparkle;
uniform float uChop;
uniform float uSunAngle;
uniform vec3 uWaterColor;
uniform vec3 uDeepColor;
float surface(vec2 p, float t) {
  float height = 0.0, amplitude = .42, frequency = 1.0;
  vec2 drift = vec2(t * .16, -t * .22);
  // Advected, cross-direction waves create long broken ridges and tiny ripples.
  for (int i = 0; i < 7; i++) {
    float angle = float(i) * 2.39996 + .25;
    vec2 direction = vec2(cos(angle), sin(angle));
    float phase = dot(p + drift, direction) * frequency + t * (1.0 + float(i) * .21);
    float wave = sin(phase + sin(phase * .31 + t * .17) * .7);
    height += wave * amplitude;
    p += direction * cos(phase) * amplitude * uChop;
    frequency *= 1.83; amplitude *= .54;
  }
  return height;
}
void main() {
  vec2 uv = sourceUv(), p = (uv - .5) * vec2(uCssSize.x / uCssSize.y, 1.0) * uScale * 5.0;
  float t = uTime * uSpeed, h = surface(p, t), e = .013;
  vec2 gradient = vec2(surface(p + vec2(e,0),t) - surface(p - vec2(e,0),t), surface(p + vec2(0,e),t) - surface(p - vec2(0,e),t)) / (2.0 * e);
  vec3 normal = normalize(vec3(-gradient * .85, 1.0));
  vec3 light = normalize(vec3(cos(uSunAngle) * .5, sin(uSunAngle) * .5, .8));
  vec3 halfVector = normalize(light + vec3(0,.2,1));
  float fresnel = pow(1.0 - normal.z, 3.0), lightness = max(0.0, dot(normal, light));
  // Refracted ridges below the surface read as teal caustics, not painted foam.
  vec2 refracted = p + normal.xy * .65;
  float caustic = pow(max(0.0, 1.0 - abs(surface(refracted * 1.7, t * .7))), 12.0);
  float depthVariation = smoothstep(-.35,.55,h) * .42 + fbm(p * .3 + t * .035) * .33;
  vec3 color = mix(uWaterColor, uDeepColor, clamp(uDepth * .7 + depthVariation, 0.0, .98));
  color += uWaterColor * (lightness * .12 + caustic * (1.0 - uDepth * .55) * .65);
  color += vec3(.19,.47,.52) * fresnel * .24;
  // A sharp sun lobe, modulated by microfacets, breaks into dense moving glitter.
  float specular = pow(max(dot(normal,halfVector),0.0), 110.0);
  float micro = noise2(p * 45.0 + t * .25);
  float glitter = smoothstep(.07,.32,specular) * smoothstep(.42,.68,micro);
  float sunPath = .18 + .82 * pow(clamp(uv.y + uv.x * .18,0.0,1.0),.65);
  color += vec3(1.0,.97,.83) * glitter * uSparkle * 2.1 * sunPath;
  color += vec3(.8,.93,1) * specular * uSparkle * .3;
  fragColor = vec4(clamp(color,0.0,1.0),1);
}`,
};
