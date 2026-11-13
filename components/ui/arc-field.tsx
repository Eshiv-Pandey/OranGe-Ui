"use client";

import { AtmosphereSurface, atmosphereColor, type AtmosphereProps } from "./atmosphere-surface";
import { arcFieldShader } from "./atmosphere-shaders";
export type ArcFieldProps = AtmosphereProps & { spread?: number; glow?: number; branches?: number };
export function ArcField({ color = "#ffbd73", accent = "#fff0cf", background = "#19130f", speed = .3, seed = 7, spread = 1, glow = 1, branches = 4, ...props }: ArcFieldProps) {
  const colors = [atmosphereColor(color, "#ffbd73"), atmosphereColor(accent, "#fff0cf"), atmosphereColor(background, "#19130f")] as const;
  return <AtmosphereSurface {...props} kind="arc-field" module={arcFieldShader} colors={colors} source={{ type: "arc-field", color: colors[0], accent: colors[1], background: colors[2], speed, seed, spread, glow, branches }} />;
}
