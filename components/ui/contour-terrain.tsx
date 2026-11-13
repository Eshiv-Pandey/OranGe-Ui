"use client";

import { AtmosphereSurface, atmosphereColor, type AtmosphereProps } from "./atmosphere-surface";
import { contourTerrainShader } from "./atmosphere-shaders";
export type ContourTerrainProps = AtmosphereProps & { levels?: number; elevation?: number; lineWidth?: number; scale?: number };
export function ContourTerrain({ color = "#507b74", accent = "#b57748", background = "#f0eee5", speed = .2, seed = 7, levels = 18, elevation = 1, lineWidth = 1, scale = 1, ...props }: ContourTerrainProps) {
  const colors = [atmosphereColor(color, "#507b74"), atmosphereColor(accent, "#b57748"), atmosphereColor(background, "#f0eee5")] as const;
  return <AtmosphereSurface {...props} kind="contour-terrain" module={contourTerrainShader} colors={colors} source={{ type: "contour-terrain", color: colors[0], accent: colors[1], background: colors[2], speed, seed, levels, elevation, lineWidth, scale }} />;
}
