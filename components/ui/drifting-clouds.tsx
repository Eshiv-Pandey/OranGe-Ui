"use client";

import { ShaderCanvas, type ShaderCanvasProps } from "./shader-canvas";
import { clouds } from "./shader-canvas/clouds";

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
  cloudColor?: string;
  shadowColor?: string;
};

const CLOUD_MODULES = [clouds];

/** A slowly drifting, self-shadowed cumulus sky with deterministic seeded detail. */
export function DriftingClouds({ speed = .35, scale = 1, coverage = .62, density = .75, billow = .6, softness = .2, sunAngle = 35, lightIntensity = 1, seed = 7, skyColor = "#087bbd", cloudColor = "#fffdf7", shadowColor = "#6d95b6", renderScale = .65, label = "White cumulus clouds drifting across a blue sky", ...props }: DriftingCloudsProps) {
  return <ShaderCanvas {...props} label={label} renderScale={renderScale} modules={CLOUD_MODULES} className={["drifting-clouds", props.className].filter(Boolean).join(" ")} source={{ type: "clouds", speed, scale, coverage, density, billow, softness, sunAngle, lightIntensity, seed, skyColor, cloudColor, shadowColor, colors: [skyColor, cloudColor, shadowColor] }} />;
}
