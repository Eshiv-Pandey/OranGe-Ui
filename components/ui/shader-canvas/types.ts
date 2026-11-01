import type { Appearance } from "../appearance";
import type { CreativeTheme } from "../creative-surface";
import type { CSSProperties } from "react";

export type ShaderSettings = Record<string, unknown>;
export type UniformValue = number | readonly number[];
export type ShaderUniform = { type: "float" | "int" | "vec2" | "vec3" | "vec4" | "float[]" | "vec3[]" | "vec4[]"; value: (settings: ShaderSettings) => UniformValue };
/** Add a module to `modules`; the renderer never needs to know its settings. */
export type ShaderModule = { id: string; kind: "source" | "effect"; fragment: string; uniforms: Record<string, ShaderUniform>; defaults: ShaderSettings };
export type ShaderSource = { type: "gradient" | "noise" | (string & {}); colors?: readonly string[]; softness?: number; speed?: number; scale?: number; warp?: number; seed?: number; saturation?: number; grain?: number; [key: string]: unknown };
export type ShaderEffect =
  | { type: "pixelate"; size?: number }
  | { type: "dither"; mode?: "bayer4" | "bayer8" | "blueNoise"; strength?: number; scale?: number }
  | { type: "palette"; preset?: "gameboy" | "cga" | "mono" | "duotone"; colors?: readonly string[] }
  | { type: string; [key: string]: unknown };
export type ShaderInteraction = { warp?: boolean; ripple?: boolean; pixelProximity?: boolean; ditherProximity?: boolean; scroll?: boolean; radius?: number; strength?: number };
export type ShaderCanvasProps = {
  source?: ShaderSource; effects?: readonly ShaderEffect[]; interaction?: ShaderInteraction;
  renderScale?: number; paused?: boolean; appearance?: Appearance; theme?: CreativeTheme;
  className?: string; style?: CSSProperties; label?: string; modules?: readonly ShaderModule[];
};
export type ShaderPreset = Pick<ShaderCanvasProps, "source" | "effects" | "interaction">;
export const clamp = (value: unknown, min: number, max: number, fallback = min) => typeof value === "number" && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback;
export function hexRgb(hex: unknown): number[] {
  const color = typeof hex === "string" && /^#[\da-f]{3}([\da-f]{3})?$/i.test(hex) ? hex.slice(1) : "ff5100";
  const full = color.length === 3 ? color.split("").map((v) => v + v).join("") : color;
  return [0, 2, 4].map((offset) => parseInt(full.slice(offset, offset + 2), 16) / 255);
}
export const PUNCHY_COLORS = ["#ff4d00", "#ff1e56", "#bd3bff", "#31eeff", "#ffbf00"] as const;
export function sourceColors(settings: ShaderSettings) {
  const colors = Array.isArray(settings.colors) && settings.colors.length ? settings.colors.slice(0, 5) : [...PUNCHY_COLORS];
  while (colors.length < 3) colors.push(PUNCHY_COLORS[colors.length]);
  return colors;
}
export const colorUniforms: Record<string, ShaderUniform> = {
  uColors: { type: "vec3[]", value: (s) => Array.from({ length: 5 }, (_, i) => hexRgb(sourceColors(s)[i % sourceColors(s).length])).flat() },
  uColorCount: { type: "int", value: (s) => sourceColors(s).length },
  uSaturation: { type: "float", value: (s) => clamp(s.saturation, 0, 2, 1.2) },
  uGrain: { type: "float", value: (s) => clamp(s.grain, 0, 1, 0.08) },
};
