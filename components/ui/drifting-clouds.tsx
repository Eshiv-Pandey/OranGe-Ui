"use client";

import { ShaderCanvas, type ShaderCanvasProps } from "./shader-canvas";
import { clouds } from "./shader-canvas/clouds";
export { SKY_PALETTES } from "./nature-palettes";

export type DriftingCloudsProps = Omit<ShaderCanvasProps, "source" | "modules" | "effects"> & {
  speed?: number;
  scale?: number;
  coverage?: number;
  density?: number;
  billow?: number;
  softness?: number;
  sunAngle?: number;
  lightIntensity?: number;
  seed?: number;
  skyColor?: string;
  horizonColor?: string;
  cloudColor?: string;
  shadowColor?: string;
};

const CLOUD_MODULES = [clouds];

/** A slowly drifting, shaded cumulus sky with deterministic seeded detail. */
export function DriftingClouds({ speed = .35, scale = 1, coverage = .62, density = .75, billow = .6, softness = .2, sunAngle = 35, lightIntensity = 1, seed = 7, skyColor = "#2777bf", horizonColor = "#b4d8ef", cloudColor = "#fff9ed", shadowColor = "#788fab", renderScale = .65, label = "Soft sunlit clouds drifting toward the horizon", ...props }: DriftingCloudsProps) {
  return <ShaderCanvas {...props} label={label} renderScale={renderScale} modules={CLOUD_MODULES} className={["drifting-clouds", props.className].filter(Boolean).join(" ")} source={{ type: "clouds", speed, scale, coverage, density, billow, softness, sunAngle, lightIntensity, seed, skyColor, horizonColor, cloudColor, shadowColor, colors: [skyColor, horizonColor, cloudColor, shadowColor] }} />;
}
