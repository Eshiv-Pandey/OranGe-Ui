"use client";

import { ShaderCanvas, type ShaderCanvasProps } from "./shader-canvas";
import { water } from "./shader-canvas/water";
export type FlowingWaterProps = Omit<ShaderCanvasProps, "source" | "modules" | "effects"> & {
  speed?: number; scale?: number; depth?: number; sparkle?: number; choppiness?: number; sunAngle?: number; color?: string; deepColor?: string;
};
const WATER_MODULES = [water];
/** Procedural flowing water, with no texture downloads or video assets. */
export function FlowingWater({ speed = .55, scale = 1.8, depth = .65, sparkle = .8, choppiness = .55, sunAngle = 35, color = "#067b83", deepColor = "#001d31", label = "Sunlight sparkling on flowing teal water", interaction, ...props }: FlowingWaterProps) {
  return <ShaderCanvas {...props} interaction={{ ripple: true, ...interaction }} label={label} modules={WATER_MODULES} className={["flowing-water", props.className].filter(Boolean).join(" ")} source={{ type: "water", speed, scale, depth, sparkle, choppiness, sunAngle, color, deepColor, colors: [deepColor, color, "#23989f"] }} />;
}
