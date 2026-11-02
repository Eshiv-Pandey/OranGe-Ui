import { clamp, hexRgb, type ShaderModule } from "./types";
import { CLOUD_FIELD_GLSL, cloudGeometry } from "./clouds-field";

/** Connected cumulus caps with analytic surfaces and directional lighting. */
export const clouds: ShaderModule = {
  id: "clouds", kind: "source",
  renderBudget: { maxPixels: 360_000, maxFps: 30 },
  defaults: { speed: .35, scale: 1, coverage: .62, density: .75, billow: .6, softness: .2, sunAngle: 35, lightIntensity: 1, seed: 7, skyColor: "#087bbd", cloudColor: "#fffdf7", shadowColor: "#6d95b6" },
  uniforms: {
    uCloudLobeCount: { type: "int", value: () => 84 },
    uSpeed: { type: "float", value: (s) => clamp(s.speed, 0, 3, .35) },
    uScale: { type: "float", value: (s) => clamp(s.scale, .5, 2.5, 1) },
    uCoverage: { type: "float", value: (s) => clamp(s.coverage, 0, 1, .62) },
    uDensity: { type: "float", value: (s) => clamp(s.density, 0, 1, .75) },
    uBillow: { type: "float", value: (s) => clamp(s.billow, 0, 1, .6) },
    uSoftness: { type: "float", value: (s) => clamp(s.softness, 0, 1, .2) },
    uSunAngle: { type: "float", value: (s) => clamp(s.sunAngle, 0, 360, 35) * Math.PI / 180 },
    uLightIntensity: { type: "float", value: (s) => clamp(s.lightIntensity, 0, 2, 1) },
    uSeed: { type: "float", value: (s) => clamp(s.seed, 0, 1000, 7) },
    uSkyColor: { type: "vec3", value: (s) => hexRgb(s.skyColor) },
    uCloudColor: { type: "vec3", value: (s) => hexRgb(s.cloudColor) },
    uShadowColor: { type: "vec3", value: (s) => hexRgb(s.shadowColor) },
    uCloudLobes: { type: "vec4[]", value: (s) => cloudGeometry(s).lobes },
    uCloudShapes: { type: "float[]", value: (s) => cloudGeometry(s).shapes },
  },
  fragment: CLOUD_FIELD_GLSL,
};
