"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import type { AppearanceProps } from "./appearance";
import type { CreativeTheme } from "./creative-surface";
import { ShaderCanvas, type ShaderModule, type ShaderSource } from "./shader-canvas";
import { clamp } from "./shader-canvas/types";
import "../../styles/atmosphere-surfaces.css";

export type AtmosphereKind = "arc-field" | "satin-flow" | "contour-terrain" | "signal-lens";
export type AtmosphereProps = AppearanceProps & {
  color?: string; accent?: string; background?: string; speed?: number; seed?: number;
  height?: number | string; interactive?: boolean; paused?: boolean; renderScale?: number;
  theme?: CreativeTheme; label?: string; children?: ReactNode;
};
export const atmosphereColor = (value: unknown, fallback: string) => typeof value === "string" && /^#[\da-f]{3}([\da-f]{3})?$/i.test(value) ? value : fallback;

type SurfaceProps = AtmosphereProps & { kind: AtmosphereKind; module: ShaderModule; source: ShaderSource; colors: readonly [string, string, string] };
export function AtmosphereSurface({ kind, module, source, colors, height = 420, interactive = true, paused = false, renderScale = .75, theme = "auto", label, appearance = "polished", className, children }: SurfaceProps) {
  const safeHeight = typeof height === "number" ? `${clamp(height, 120, 1200, 420)}px` : height;
  return <div className={["atmosphere-surface", kind, className].filter(Boolean).join(" ")} data-appearance={appearance}
    style={{ height: safeHeight, "--atmosphere-color": colors[0], "--atmosphere-accent": colors[1], "--atmosphere-background": colors[2] } as CSSProperties}>
    <ShaderCanvas modules={[module]} source={{ ...source, colors: [colors[2], colors[0], colors[1]] }} interaction={{ warp: interactive, ripple: interactive, radius: .3, strength: .65 }}
      paused={paused} renderScale={renderScale} theme={theme} appearance={appearance} label={label ?? kind.replace(/-/g, " ") + " background"} />
    <AtmosphereFallback kind={kind} source={source} />
    {children && <div className="atmosphere-content">{children}</div>}
  </div>;
}

function AtmosphereFallback({ kind, source }: { kind: AtmosphereKind; source: ShaderSource }) {
  const id = useId().replace(/:/g, "");
  const seed = clamp(source.seed, 0, 1000, 7);
  const point = (i: number) => [64 + i / 40 * 672, 240 + Math.sin(i / 40 * Math.PI) * clamp(source.spread, .2, 2, 1) * (Math.sin(i * .6924 + seed) * 30.24 + Math.sin(i * 1.652) * 12 + Math.sin(i * 4.871) * 4.32)];
  if (kind === "arc-field") {
    const points = Array.from({ length: 41 }, (_, i) => point(i).map(n => n.toFixed(2)).join(",")).join(" ");
    return <svg className="atmosphere-static" viewBox="0 0 800 480" preserveAspectRatio="none" aria-hidden="true"><defs><filter id={id}><feGaussianBlur stdDeviation="5" /></filter></defs>
      <polyline points={points} fill="none" stroke="var(--atmosphere-color)" strokeWidth="6" filter={`url(#${id})`} opacity=".65" />
      <polyline points={points} fill="none" stroke="var(--atmosphere-accent)" strokeWidth="1.6" strokeLinejoin="round" />
      {Array.from({ length: Math.round(clamp(source.branches, 0, 6, 4)) }, (_, i) => { const [x, y] = point(7.5 + i * 4.5), side = i % 2 ? 1 : -1; return <path key={i} d={`M${x} ${y}l32 ${side * 36}l44 ${side * 43}`} fill="none" stroke="var(--atmosphere-color)" strokeWidth="1" opacity=".6" />; })}
      <g fill="var(--atmosphere-accent)"><circle cx="64" cy="240" r="3" /><circle cx="736" cy="240" r="3" /></g>
    </svg>;
  }
  if (kind === "satin-flow") return <svg className="atmosphere-static" viewBox="0 0 800 480" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id={id}><stop stopColor="var(--atmosphere-background)" /><stop offset=".42" stopColor="var(--atmosphere-color)" /><stop offset=".62" stopColor="var(--atmosphere-accent)" /><stop offset=".78" stopColor="var(--atmosphere-color)" /><stop offset="1" stopColor="var(--atmosphere-background)" /></linearGradient></defs>
    {Array.from({ length: Math.round(clamp(source.folds, 2, 12, 5)) }, (_, i) => <path key={i} d={`M${i * 160 - 200} -80C${i * 160 + 40} 70 ${i * 160 - 170} 250 ${i * 160 + 80} 560H${i * 160 + 260}C${i * 160 + 20} 240 ${i * 160 + 210} 80 ${i * 160 - 20} -80Z`} fill={`url(#${id})`} />)}
  </svg>;
  if (kind === "contour-terrain") return <svg className="atmosphere-static" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    {[[210, 160, 1, .8], [595, 315, .9, 1.4], [355, 450, 1.3, .7]].flatMap(([x, y, sx, sy], hill) => Array.from({ length: Math.round(clamp(source.levels, 6, 40, 18) / 3) }, (_, ring) => {
      const radius = 24 + ring * 27;
      const path = Array.from({ length: 64 }, (_, i) => { const a = i / 64 * Math.PI * 2, r = radius * (1 + .06 * Math.sin(a * 3 + seed * .1 + hill)); return `${i ? "L" : "M"}${(x + Math.cos(a) * r * sx).toFixed(2)} ${(y + Math.sin(a) * r * sy).toFixed(2)}`; }).join(" ") + "Z";
      return <path key={`${hill}-${ring}`} d={path} fill="none" stroke={ring % 5 === 0 ? "var(--atmosphere-accent)" : "var(--atmosphere-color)"} strokeWidth={clamp(source.lineWidth, .5, 2.5, 1)} opacity=".75" />;
    }))}
  </svg>;
  return <svg className="atmosphere-static" viewBox="0 0 800 480" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs><radialGradient id={id}><stop stopColor="var(--atmosphere-color)" stopOpacity=".65" /><stop offset=".8" stopColor="var(--atmosphere-color)" stopOpacity=".15" /><stop offset="1" stopColor="var(--atmosphere-background)" stopOpacity="0" /></radialGradient></defs>
    <ellipse cx="400" cy="240" rx="330" ry="210" fill={`url(#${id})`} />
    {Array.from({ length: Math.round(clamp(source.density, 4, 24, 10)) }, (_, i) => <g key={i} fill="none" opacity={.65 - i * .018}><ellipse cx="275" cy="230" rx={20 + i * 24} ry={15 + i * 18} stroke="var(--atmosphere-color)" strokeWidth="3" /><ellipse cx="525" cy="265" rx={15 + i * 24} ry={10 + i * 18} stroke="var(--atmosphere-accent)" strokeWidth="2" /></g>)}
    <path d={Array.from({ length: 120 }, (_, i) => `M0 ${i * 4}H800`).join(" ")} stroke="var(--atmosphere-background)" strokeWidth="1.5" opacity={clamp(source.scanlines, 0, 1, .4)} />
  </svg>;
}
