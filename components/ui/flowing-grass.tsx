"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useCreativeTheme } from "./creative-surface";
import type { ShaderCanvasProps } from "./shader-canvas/types";
import { grassRgb, normalizeGrassSettings, type GrassSettings } from "./shader-canvas/grass";
import { createGrassRenderer } from "./shader-canvas/grass-renderer";
import "../../styles/shader-canvas.css";

export type FlowingGrassProps = Omit<ShaderCanvasProps, "source" | "modules" | "effects"> & Partial<GrassSettings>;

/** An instanced field of long, rooted leaves. Pointer and touch breeze are on by default. */
export function FlowingGrass(props: FlowingGrassProps) {
  const { appearance = "polished", theme = "auto", className, style, label = "Sunlit grass flowing in the wind" } = props;
  const settings = normalizeGrassSettings(props), resolved = useCreativeTheme(theme);
  const config = { ...props, ...settings, interaction: { warp: true, ...props.interaction } };
  const canvas = useRef<HTMLCanvasElement>(null), root = useRef<HTMLDivElement>(null), current = useRef(config);
  const renderer = useRef<ReturnType<typeof createGrassRenderer> | null>(null);
  useEffect(() => { current.current = config; renderer.current?.redraw(); });
  useEffect(() => {
    if (!canvas.current) return;
    try {
      renderer.current = createGrassRenderer(canvas.current, () => current.current, (ready) => {
        if (root.current) root.current.dataset.renderer = ready ? "webgl2" : "fallback";
      });
    } catch { if (root.current) root.current.dataset.renderer = "fallback"; }
    return () => { renderer.current?.destroy(); renderer.current = null; };
  }, []);
  const colors = [settings.shadowColor, settings.color, settings.tipColor].map((color) => "rgb(" + grassRgb(color).map((channel) => Math.round(channel * 255)).join(" ") + ")");
  return <div ref={root} role="img" aria-label={label} className={cn("creative-surface shader-canvas flowing-grass", className)}
    data-theme={resolved} data-appearance={appearance} data-renderer="fallback"
    style={{ "--shader-fallback": "linear-gradient(125deg," + colors.join(",") + ")", ...style } as CSSProperties}>
    <div className="shader-canvas-fallback" aria-hidden="true" />
    <canvas ref={canvas} aria-hidden="true" />
  </div>;
}
