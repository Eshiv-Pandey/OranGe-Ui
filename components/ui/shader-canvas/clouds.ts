import { clamp, hexRgb, type ShaderModule } from "./types";
import { CLOUD_FIELD_GLSL } from "./clouds-field";
import { cloudNoiseTexels } from "./clouds-noise";

/** Texture-backed cloud volume with a bounded primary march and a single light probe. */
export const clouds: ShaderModule = {
  id: "clouds", kind: "source",
  renderBudget: { maxPixels: 220_000, maxFps: 24 },
  textures: { uCloudNoise: { width: 256, height: 256, data: cloudNoiseTexels, repeat: true } },
  defaults: { speed: .35, scale: 1, coverage: .62, density: .75, billow: .6, softness: .2, sunAngle: 35, lightIntensity: 1, seed: 7, skyColor: "#2777bf", horizonColor: "#b4d8ef", cloudColor: "#fff9ed", shadowColor: "#788fab" },
  uniforms: {
    uMarchSteps: { type: "int", value: () => 24 },
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
    uHorizonColor: { type: "vec3", value: (s) => hexRgb(s.horizonColor ?? "#b4d8ef") },
    uCloudColor: { type: "vec3", value: (s) => hexRgb(s.cloudColor) },
    uShadowColor: { type: "vec3", value: (s) => hexRgb(s.shadowColor) },
  },
  fragment: CLOUD_FIELD_GLSL,
};
