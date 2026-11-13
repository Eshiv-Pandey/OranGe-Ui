"use client";

import { AtmosphereSurface, atmosphereColor, type AtmosphereProps } from "./atmosphere-surface";
import { signalLensShader } from "./atmosphere-shaders";
export type SignalLensProps = AtmosphereProps & { density?: number; curvature?: number; scanlines?: number; chromatic?: number };
export function SignalLens({ color = "#74d9c3", accent = "#eeaa72", background = "#081b1c", speed = .3, seed = 7, density = 10, curvature = .35, scanlines = .4, chromatic = .5, ...props }: SignalLensProps) {
  const colors = [atmosphereColor(color, "#74d9c3"), atmosphereColor(accent, "#eeaa72"), atmosphereColor(background, "#081b1c")] as const;
  return <AtmosphereSurface {...props} kind="signal-lens" module={signalLensShader} colors={colors} source={{ type: "signal-lens", color: colors[0], accent: colors[1], background: colors[2], speed, seed, density, curvature, scanlines, chromatic }} />;
}
