"use client";

import { useEffect, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { useCreativeTheme } from "./creative-surface";
import { createShaderRenderer } from "./shader-canvas/renderer";
import { sourceColors, hexRgb, type ShaderCanvasProps } from "./shader-canvas/types";
import "../../styles/shader-canvas.css";

export type { ShaderCanvasProps, ShaderSource, ShaderEffect, ShaderInteraction, ShaderModule, ShaderPreset } from "./shader-canvas/types";
export { orangeSunset, pixelDream, gameboyNoise } from "./shader-canvas/presets";
export { SHADER_MODULES } from "./shader-canvas/modules";
export function ShaderCanvas(props: ShaderCanvasProps) {
  const { source, appearance = "polished", theme = "auto", className, style, label = "Animated shader canvas" } = props;
  const canvas = useRef<HTMLCanvasElement>(null), root = useRef<HTMLDivElement>(null), current = useRef(props), renderer = useRef<ReturnType<typeof createShaderRenderer> | null>(null);
  const resolved = useCreativeTheme(theme);
  useEffect(() => { current.current = props; renderer.current?.redraw(); }, [props]);
  useEffect(() => {
    if (!canvas.current) return;
    try { renderer.current = createShaderRenderer(canvas.current, () => current.current, (ready) => { if (root.current) root.current.dataset.renderer = ready ? "webgl2" : "fallback"; }); }
    catch { if (root.current) root.current.dataset.renderer = "fallback"; }
    return () => { renderer.current?.destroy(); renderer.current = null; };
  }, []);
  const colors = sourceColors(source || {}).map((color) => "rgb(" + hexRgb(color).map((channel) => Math.round(channel * 255)).join(" ") + ")");
  return <div ref={root} role="img" aria-label={label} className={cn("creative-surface shader-canvas", className)} data-theme={resolved} data-appearance={appearance} data-renderer="fallback" style={{ "--shader-fallback": "linear-gradient(125deg," + colors.join(",") + ")", ...style } as CSSProperties}>
    <div className="shader-canvas-fallback" aria-hidden="true" />
    <canvas ref={canvas} aria-hidden="true" />
  </div>;
}
