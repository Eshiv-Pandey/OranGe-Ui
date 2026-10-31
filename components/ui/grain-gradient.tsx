"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, clamp, type CreativeTheme } from "./creative-surface";
import { createCreativeWebGL, creativeColor } from "./creative-webgl";
import { GRAIN_GRADIENT_FRAGMENT } from "./grain-gradient-shader";
import { CreativeIcon } from "./creative-icons";
import { downloadCreativeBlob } from "./creative-export";
import "../../styles/creative-shaders.css";

export type GradientPoint = { x: number; y: number };
export const GRAIN_PRESETS = {
  sunset: ["#f1a396", "#ffe3af", "#aacfe4", "#b9a3db"],
  aurora: ["#183c57", "#6abda8", "#665aaf", "#d8a4cf"],
  ocean: ["#10335e", "#168b96", "#82cbbc", "#cbdcd1"],
  holi: ["#f16b92", "#f1b94b", "#69b791", "#9675cc", "#e4844a"],
  diwali: ["#8a3551", "#c25f49", "#edab47", "#f4d783", "#62417e"],
  pongal: ["#567c4e", "#e9bb63", "#c47856", "#e8dca5", "#86ad83"],
} as const;
export type GrainGradientProps = {
  colors?: readonly string[]; speed?: number; blur?: number; intensity?: number; grain?: number;
  interactive?: boolean; theme?: CreativeTheme; className?: string; preset?: keyof typeof GRAIN_PRESETS;
  positions?: readonly GradientPoint[]; onPositionsChange?: (points: GradientPoint[]) => void;
  angle?: number; direction?: "forward" | "reverse"; turbulence?: number; waveScale?: number;
  pointerEffect?: "swirl" | "repel" | "attract" | "ripple"; grainStyle?: "film" | "dots" | "noise";
  vignette?: number; posterize?: number; dither?: boolean; mode?: "mesh" | "radial" | "conic"; showPoints?: boolean;
  showExportButton?: boolean; showFullscreenButton?: boolean; paused?: boolean; appearance?: Appearance;
};
export function defaultGradientPoints(count: number): GradientPoint[] {
  return Array.from({ length: count }, (_, index) => ({ x: 0.5 + Math.cos(index * Math.PI * 2 / count + 0.7) * 0.35, y: 0.5 + Math.sin(index * Math.PI * 2 / count + 0.7) * 0.35 }));
}

export function GrainGradient({ colors, speed = 0.14, blur = 0.7, intensity = 0.95, grain = 0.35, interactive = true, theme = "auto", className, preset, positions, onPositionsChange, angle = 25, direction = "forward", turbulence = 0.65, waveScale = 2.5, pointerEffect = "swirl", grainStyle = "film", vignette = 0, posterize = 0, dither = false, mode = "mesh", showPoints = false, showExportButton = true, showFullscreenButton = true, paused = false, appearance = "polished" }: GrainGradientProps) {
  const resolved = useCreativeTheme(theme), root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), renderer = useRef<ReturnType<typeof createCreativeWebGL> | null>(null);
  const palette = (colors?.length ? colors : preset ? GRAIN_PRESETS[preset] : resolved === "dark" ? GRAIN_PRESETS.aurora : GRAIN_PRESETS.sunset).slice(0, 12);
  const [localPoints, setLocalPoints] = useState<GradientPoint[]>([]), [message, setMessage] = useState("");
  const [expanded, setExpanded] = useState<false | "native" | "fallback">(false);
  const expandButton = useRef<HTMLButtonElement>(null);
  const points = positions?.length === palette.length ? positions : localPoints.length === palette.length ? localPoints : defaultGradientPoints(palette.length);
  const pointer = useRef({ x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 }), frozenTime = useRef(0);
  const latest = useRef({ palette, points, speed, blur, intensity, grain, interactive, resolved, angle, direction, turbulence, waveScale, pointerEffect, grainStyle, vignette, posterize, dither, mode, paused });
  useEffect(() => { latest.current = { palette, points, speed, blur, intensity, grain, interactive, resolved, angle, direction, turbulence, waveScale, pointerEffect, grainStyle, vignette, posterize, dither, mode, paused }; renderer.current?.redraw(); }, [palette, points, speed, blur, intensity, grain, interactive, resolved, angle, direction, turbulence, waveScale, pointerEffect, grainStyle, vignette, posterize, dither, mode, paused]);
  useEffect(() => {
    if (!canvas.current) return;
    const effect = createCreativeWebGL(canvas.current, GRAIN_GRADIENT_FRAGMENT, (frame) => {
      const config = latest.current, p = pointer.current, smoothing = frame.reduced ? 1 : Math.min(1, frame.delta * 5);
      p.x += (p.tx - p.x) * smoothing; p.y += (p.ty - p.y) * smoothing;
      if (!config.paused && !frame.reduced) frozenTime.current += frame.delta;
      const colorValues = Array.from({ length: 12 }, (_, index) => creativeColor(config.palette[index] || config.palette.at(-1) || "#967dba")).flat();
      const pointValues = Array.from({ length: 12 }, (_, index) => [config.points[index]?.x ?? 0.5, 1 - (config.points[index]?.y ?? 0.5)]).flat();
      return { uTime: frame.reduced ? 0 : frozenTime.current, uTheme: config.resolved === "dark" ? 1 : 0, uPointer: [p.x, p.y], uColors: colorValues, uPositions: pointValues, uColorCount: config.palette.length, uSpeed: clamp(config.speed, 0, 5) * (config.direction === "reverse" ? -1 : 1), uBlur: clamp(config.blur, 0, 1), uIntensity: clamp(config.intensity, 0, 1), uGrain: clamp(config.grain, 0, 1), uAngle: config.angle * Math.PI / 180, uTurbulence: clamp(config.turbulence, 0, 2), uWaveScale: clamp(config.waveScale, 0.1, 12), uPointerEffect: ["swirl", "repel", "attract", "ripple"].indexOf(config.pointerEffect), uInteractive: config.interactive ? 1 : 0, uGrainStyle: ["film", "dots", "noise"].indexOf(config.grainStyle), uVignette: clamp(config.vignette, 0, 1), uPosterize: config.posterize, uDither: config.dither ? 1 : 0, uMode: ["mesh", "radial", "conic"].indexOf(config.mode) };
    }, { onState: (ready) => { if (root.current) root.current.dataset.renderer = ready ? "webgl" : "fallback"; } });
    renderer.current = effect;
    return () => { effect.destroy(); renderer.current = null; };
  }, []);
  useEffect(() => {
    const changed = () => {
      setExpanded(document.fullscreenElement === root.current ? "native" : false);
      expandButton.current?.focus();
    };
    document.addEventListener("fullscreenchange", changed);
    return () => document.removeEventListener("fullscreenchange", changed);
  }, []);
  useEffect(() => {
    if (expanded !== "fallback") return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    expandButton.current?.focus();
    const keys = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); setExpanded(false); expandButton.current?.focus(); }
      if (event.key === "Tab") {
        const buttons = root.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
        if (!buttons?.length) return;
        const first = buttons[0], last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", keys);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", keys); };
  }, [expanded]);
  const toggleFullscreen = async () => {
    if (expanded) {
      if (document.fullscreenElement === root.current) await document.exitFullscreen();
      else setExpanded(false);
      return;
    }
    try {
      if (!root.current?.requestFullscreen) { setExpanded("fallback"); return; }
      await root.current.requestFullscreen();
    } catch { setExpanded("fallback"); }
  };
  const changePoint = (index: number, point: GradientPoint) => {
    const next = points.map((value, i) => i === index ? { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) } : { ...value });
    if (!positions) setLocalPoints(next); onPositionsChange?.(next);
  };
  const exportImage = () => {
    const element = canvas.current; if (!element) return;
    const save = (blob: Blob | null) => { if (blob && root.current) { downloadCreativeBlob(blob, "orange-gradient.png"); setMessage("Your gradient is ready."); } };
    if (root.current?.dataset.renderer === "webgl") { renderer.current?.redraw(); element.toBlob(save, "image/png"); }
    else {
      const image = document.createElement("canvas"), context = image.getContext("2d"); if (!context) return;
      image.width = 1000; image.height = 800;
      const gradient = context.createLinearGradient(0, 0, image.width, image.height);
      palette.forEach((color, index) => gradient.addColorStop(index / Math.max(1, palette.length - 1), color)); context.fillStyle = gradient; context.fillRect(0, 0, image.width, image.height); image.toBlob(save, "image/png");
    }
  };
  return <div ref={root} className={cn("creative-surface grain-gradient", className)} data-theme={resolved} data-appearance={appearance} data-fullscreen={expanded || undefined} style={{ "--gradient-fallback": (mode === "conic" ? "conic-gradient(" : mode === "radial" ? "radial-gradient(circle," : "linear-gradient(" + angle + "deg,") + palette.join(",") + ")" } as CSSProperties}>
    <div className="grain-gradient-fallback" aria-hidden="true" />
    <canvas ref={canvas} role="img" aria-label="Flowing grain gradient" onPointerMove={(event) => { if (!interactive) return; const box = event.currentTarget.getBoundingClientRect(); pointer.current.tx = clamp((event.clientX - box.left) / box.width, 0, 1); pointer.current.ty = 1 - clamp((event.clientY - box.top) / box.height, 0, 1); }} onPointerLeave={() => { pointer.current.tx = 0.5; pointer.current.ty = 0.5; }} />
    {showPoints && mode === "mesh" && points.map((point, index) => <button type="button" className="gradient-color-point" key={index} aria-label={"Color point " + (index + 1) + ". Drag or use arrow keys."} style={{ left: point.x * 100 + "%", top: point.y * 100 + "%", background: palette[index] }} onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); }} onPointerMove={(event) => { if (!event.currentTarget.hasPointerCapture(event.pointerId)) return; const box = root.current!.getBoundingClientRect(); changePoint(index, { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }); }} onKeyDown={(event) => { const keys: Record<string, [number, number]> = { ArrowLeft: [-0.02, 0], ArrowRight: [0.02, 0], ArrowUp: [0, -0.02], ArrowDown: [0, 0.02] }; if (keys[event.key]) { event.preventDefault(); const [x, y] = keys[event.key]; changePoint(index, { x: point.x + x, y: point.y + y }); } }} />)}
    {showFullscreenButton && <button ref={expandButton} type="button" className="creative-button shader-fullscreen" aria-pressed={Boolean(expanded)} onClick={() => void toggleFullscreen()}><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d={expanded ? "M9 3v6H3m12-6v6h6M9 21v-6H3m12 6v-6h6" : "M9 3H3v6m12-6h6v6M3 15v6h6m12-6v6h-6"} /></svg>{expanded ? "Exit full screen" : "Full screen"}</button>}
    {showExportButton && <button type="button" className="creative-button shader-export" onClick={exportImage}><CreativeIcon name="download" width="14" height="14" />Save image</button>}
    {message && <p className="shader-feedback" role="status">{message}</p>}
  </div>;
}
