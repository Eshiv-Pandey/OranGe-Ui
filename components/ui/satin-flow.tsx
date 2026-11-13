"use client";

import { AtmosphereSurface, atmosphereColor, type AtmosphereProps } from "./atmosphere-surface";
import { satinFlowShader } from "./atmosphere-shaders";
export type SatinFlowProps = AtmosphereProps & { folds?: number; drape?: number; sheen?: number; angle?: number };
export function SatinFlow({ color = "#cb857d", accent = "#fff1dc", background = "#392b32", speed = .3, seed = 7, folds = 5, drape = .8, sheen = 1, angle = -18, ...props }: SatinFlowProps) {
  const colors = [atmosphereColor(color, "#cb857d"), atmosphereColor(accent, "#fff1dc"), atmosphereColor(background, "#392b32")] as const;
  return <AtmosphereSurface {...props} kind="satin-flow" module={satinFlowShader} colors={colors} source={{ type: "satin-flow", color: colors[0], accent: colors[1], background: colors[2], speed, seed, folds, drape, sheen, angle }} />;
}
