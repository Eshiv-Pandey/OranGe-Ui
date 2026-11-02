/**
 * Volumetric sky adapted from Shader Sky by jay sharma / 23rd.dev (MIT).
 * See THIRD_PARTY_NOTICES.md. A texture-backed, bounded march replaces the
 * former analytic caps. Lighting takes one coarse sample, with no nested march.
 */
export const CLOUD_FIELD_GLSL = `
uniform sampler2D uCloudNoise;
uniform float uSpeed, uScale, uCoverage, uDensity, uBillow, uSoftness, uSunAngle, uLightIntensity, uSeed;
uniform int uMarchSteps;
uniform vec3 uSkyColor, uHorizonColor, uCloudColor, uShadowColor;

float cloudHash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * .1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float cloudNoise2(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return texture(uCloudNoise, (i + f + .5) / 256.0).r;
}
float cloudNoise3(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  vec2 rg = texture(uCloudNoise, (i.xy + vec2(37,239) * i.z + f.xy + .5) / 256.0).gr;
  return mix(rg.x, rg.y, f.z);
}
float cloudDensity(vec3 q, float height, float coverage) {
  float profile = smoothstep(0.0, .14, height) * (1.0 - smoothstep(.36, 1.0, height));
  float n = cloudNoise3(q) * .5 + cloudNoise3(q * 2.03 + 3.1) * .26;
  n += cloudNoise3(q * 4.07 + 7.7) * .16 + cloudNoise3(q * 8.3 + 1.9) * .08;
  float d = (n * profile - (1.0 - coverage)) / max(.1, coverage);
  float erosion = cloudNoise3(q * 7.8 + vec3(0, -uTime * uSpeed * .05, 0));
  d -= erosion * uBillow * .14 * (1.0 - max(d, 0.0));
  return max(0.0, d) * smoothstep(0.0, .01 + uSoftness * .13, d);
}
void main() {
  vec2 uv = sourceUv();
  vec2 screen = (uv - .5) * vec2(uCssSize.x / uCssSize.y, 1.0);
  vec3 ray = normalize(vec3(screen.x, screen.y + .49, 1.0));
  vec3 sun = normalize(vec3(cos(uSunAngle), .8 + sin(uSunAngle) * .35, .65));
  float up = max(ray.y, 0.0), mu = max(dot(ray, sun), 0.0);
  vec3 haze = mix(uHorizonColor, uCloudColor, .16);
  vec3 sky = mix(uHorizonColor, uSkyColor, pow(smoothstep(0.0, .8, up), .65));
  sky = mix(sky, haze, exp(-up * 10.0) * .45);
  sky += uCloudColor * (pow(mu, 9.0) * .08 + pow(mu, 160.0) * .22) * uLightIntensity;

  vec3 light = vec3(0.0);
  float transmittance = 1.0;
  if (uCoverage > .001 && uDensity > .001 && ray.y > .02) {
    float start = 1.0 / ray.y;
    if (start < 30.0) {
      float end = min(1.95 / ray.y, start + 5.5);
      float stepSize = (end - start) / float(uMarchSteps);
      float distance = start + stepSize * cloudHash(gl_FragCoord.xy);
      float frequency = 1.65 / uScale;
      vec3 drift = vec3(uTime * uSpeed * .23 + uSeed * 3.7, uSeed * .43, uTime * uSpeed * .09);
      float sigma = mix(9.0, 29.0, uDensity);
      for (int i = 0; i < uMarchSteps; i++) {
        vec3 p = ray * distance, q = p * frequency + drift;
        float height = (p.y - 1.0) / .95;
        float weather = cloudNoise2(q.xz * .22 + 13.7);
        float coverage = clamp(mix(.22, .74, uCoverage) + (weather - .5) * .9, .02, .98);
        float d = cloudDensity(q, height, coverage);
        if (d > .002) {
          // One density probe gives self-shadowing without a nested light loop.
          float shade = cloudDensity(q + sun * .3, height + .23, coverage) * sigma * .2;
          float sunlight = max(exp(-shade), exp(-shade * .25) * .6);
          float edge = pow(mu, 7.0) * exp(-d * 12.0) * .28;
          vec3 ambient = mix(uShadowColor * .8, mix(uHorizonColor, uCloudColor, .5), height);
          vec3 illumination = mix(ambient, uCloudColor * (1.04 + edge), clamp(sunlight * uLightIntensity, 0.0, 1.0));
          illumination += uCloudColor * pow(max(height, 0.0), 2.0) * .17 * uLightIntensity;
          float opacity = 1.0 - exp(-d * sigma * stepSize);
          float fog = 1.0 - exp(-distance * .035);
          illumination = mix(illumination, haze, fog * .8);
          light += transmittance * opacity * illumination;
          transmittance *= 1.0 - opacity;
          if (transmittance < .025) break;
        }
        distance += stepSize;
      }
    }
  }
  vec3 color = sky * transmittance + light;
  color += (cloudHash(gl_FragCoord.xy) - .5) * .003;
  fragColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;
