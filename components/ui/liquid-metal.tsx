"use client";

import { ShaderCanvas, type ShaderCanvasProps } from "./shader-canvas";
import { liquidMetal } from "./shader-canvas/liquid-metal";
import { useCreativeTheme } from "./creative-surface";

export const METAL_FINISHES = { chrome: "#d6dee0", gold: "#edc47b", copper: "#dd9171", graphite: "#65787f" } as const;
export type LiquidMetalProps = Omit<ShaderCanvasProps, "source" | "modules" | "effects" | "interaction"> & { finish?: keyof typeof METAL_FINISHES; color?: string; speed?: number; ribbons?: number; twist?: number; roughness?: number; sheen?: number; interactive?: boolean };
const MODULES = [liquidMetal];
export function LiquidMetal({ finish = "chrome", color, speed = .35, ribbons = 3, twist = 1, roughness = .25, sheen = .2, interactive = true, label = "Flowing metal ribbons with moving studio reflections", ...props }: LiquidMetalProps) {
  const theme = useCreativeTheme(props.theme), tint = color ?? METAL_FINISHES[finish], background = theme === "dark" ? "#121819" : "#e4e5df";
  return <ShaderCanvas {...props} className={["liquid-metal", props.className].filter(Boolean).join(" ")} label={label} modules={MODULES} interaction={{ warp: interactive, strength: 0 }} source={{ type: "liquid-metal", color: tint, background, speed, ribbons, twist, roughness, sheen, interactive, colors: [background, tint, "#f6f3e7", tint, background] }} />;
}
