"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { createCreativeCanvas, useCreativeTheme, usePropPreference, clamp, type CreativeTheme } from "./creative-surface";
import { paintFrostCurve, regrowFrostMask, frostTextCutout, type FrostPoint } from "./frosted-glass-mask";
import { createCreativeSound } from "./creative-audio";
import { CreativeIcon } from "./creative-icons";
import { GARDEN_ART } from "./creative-art";
import "../../styles/frosted-glass.css";

export type FrostedGlassProps = {
  background?: string | ReactNode; frostBlur?: number; tint?: string; grain?: number; brushSize?: number;
  brushSoftness?: number; regrowMs?: number; text?: string; font?: string; onClear?: () => void; showResetButton?: boolean;
  condensationDrips?: boolean; muted?: boolean; volume?: number; theme?: CreativeTheme; appearance?: Appearance; className?: string;
};
type PointerPath = { last: FrostPoint; midpoint: FrostPoint };
function paintCoveredImage(context: CanvasRenderingContext2D, source: HTMLImageElement | HTMLCanvasElement, width: number, height: number) {
  const iw = source instanceof HTMLImageElement ? source.naturalWidth : source.width, ih = source instanceof HTMLImageElement ? source.naturalHeight : source.height;
  if (!iw || !ih) return;
  const factor = Math.max(width / iw, height / ih), cropWidth = width / factor, cropHeight = height / factor;
  context.drawImage(source, (iw - cropWidth) / 2, (ih - cropHeight) / 2, cropWidth, cropHeight, 0, 0, width, height);
}
function paintCssBackground(context: CanvasRenderingContext2D, background: string, width: number, height: number) {
  const colors = background.match(/#[\da-f]{3,8}\b|rgba?\([^)]*\)|hsla?\([^)]*\)/gi);
  if (background.includes("gradient(") && colors?.length) {
    const radial = background.includes("radial-gradient"), gradient = radial ? context.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) * 0.7) : context.createLinearGradient(0, 0, width, height);
    colors.forEach((color, index) => gradient.addColorStop(index / Math.max(1, colors.length - 1), color)); context.fillStyle = gradient;
  } else context.fillStyle = background;
  context.fillRect(0, 0, width, height);
}

export function FrostedGlass({ background = GARDEN_ART, frostBlur = 18, tint = "rgba(220,233,210,0.48)", grain = 0.18, brushSize = 38, brushSoftness = 0.55, regrowMs = 0, text = "", font = "italic bold 66px Georgia", onClear, showResetButton = true, condensationDrips = false, muted = true, volume = 0.2, theme = "auto", appearance = "polished", className }: FrostedGlassProps) {
  const root = useRef<HTMLDivElement>(null), stage = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), source = useRef<HTMLImageElement>(null), backdrop = useRef<HTMLDivElement>(null);
  const mask = useRef<HTMLCanvasElement | null>(null), renderer = useRef<ReturnType<typeof createCreativeCanvas> | null>(null), audio = useRef<ReturnType<typeof createCreativeSound> | null>(null);
  const paths = useRef(new Map<number, PointerPath>()), dirty = useRef(true), reset = useRef(true), holes = useRef(false), keyboard = useRef<FrostPoint>({ x: 140, y: 160, pressure: 0.7 });
  const [isMuted, setMuted] = usePropPreference(muted), resolved = useCreativeTheme(theme);
  const latest = useRef({ background, frostBlur, tint, grain, brushSize, brushSoftness, regrowMs, text, font, condensationDrips, isMuted, volume });
  useEffect(() => {
    if (latest.current.text !== text || latest.current.font !== font) reset.current = true;
    latest.current = { background, frostBlur, tint, grain, brushSize, brushSoftness, regrowMs, text, font, condensationDrips, isMuted, volume };
    dirty.current = true; renderer.current?.redraw();
  }, [background, frostBlur, tint, grain, brushSize, brushSoftness, regrowMs, text, font, condensationDrips, isMuted, volume]);
  useEffect(() => {
    if (!canvas.current) return;
    const pointerPaths = paths.current;
    const maskCanvas = document.createElement("canvas"), frost = document.createElement("canvas"), noise = document.createElement("canvas"), noiseContext = noise.getContext("2d"), maskContext = maskCanvas.getContext("2d"), frostContext = frost.getContext("2d");
    if (!maskContext || !frostContext || !noiseContext) return;
    mask.current = maskCanvas; const sound = createCreativeSound(); audio.current = sound;
    noise.width = 128; noise.height = 128;
    const pixels = noiseContext.createImageData(128, 128);
    let seed = 2166136261;
    for (let index = 0; index < pixels.data.length; index += 4) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const value = seed >>> 24; pixels.data[index] = value; pixels.data[index + 1] = value; pixels.data[index + 2] = value; pixels.data[index + 3] = 90; }
    noiseContext.putImageData(pixels, 0, 0);
    let lastWidth = 0, lastHeight = 0, lastGrain = -1, lastBlur = -1, lastTint = "", lastSource: unknown = null;
    const drips: FrostPoint[] = [];
    const paint = createCreativeCanvas(canvas.current, (context, frame) => {
      const config = latest.current, physicalWidth = Math.max(1, Math.round(frame.width * frame.dpr)), physicalHeight = Math.max(1, Math.round(frame.height * frame.dpr));
      if (lastWidth !== physicalWidth || lastHeight !== physicalHeight) {
        const previous = document.createElement("canvas"); previous.width = maskCanvas.width; previous.height = maskCanvas.height; previous.getContext("2d")?.drawImage(maskCanvas, 0, 0);
        maskCanvas.width = frost.width = physicalWidth; maskCanvas.height = frost.height = physicalHeight;
        maskContext.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0); frostContext.setTransform(frame.dpr, 0, 0, frame.dpr, 0, 0);
        maskContext.fillStyle = "#fff"; maskContext.fillRect(0, 0, frame.width, frame.height);
        if (holes.current && previous.width > 1) { maskContext.globalCompositeOperation = "copy"; maskContext.drawImage(previous, 0, 0, frame.width, frame.height); maskContext.globalCompositeOperation = "source-over"; }
        lastWidth = physicalWidth; lastHeight = physicalHeight; dirty.current = true; lastSource = null;
      }
      if (reset.current) {
        maskContext.save(); maskContext.globalCompositeOperation = "copy"; maskContext.fillStyle = "#fff"; maskContext.fillRect(0, 0, frame.width, frame.height); maskContext.restore();
        holes.current = false; reset.current = false; dirty.current = true; drips.length = 0;
      }
      if (config.regrowMs > 0 && holes.current && !frame.reduced && frame.delta) { regrowFrostMask(maskContext, frame.width, frame.height, frame.delta, config.regrowMs); dirty.current = true; }
      if (config.condensationDrips && !frame.reduced && frame.delta) {
        if (pointerPaths.size && drips.length < 10 && Math.random() < frame.delta / 1000) { const path = [...pointerPaths.values()][0]; drips.push({ ...path.last, pressure: 0.5 }); }
        for (let index = drips.length - 1; index >= 0; index--) { const point = drips[index], next = { ...point, y: point.y + frame.delta * 0.016 }; paintFrostCurve(maskContext, point, point, next, 6, 0.75); drips[index] = next; if (next.y > frame.height) drips.splice(index, 1); dirty.current = true; }
      }
      frostTextCutout(maskContext, config.text, config.font, frame.width, frame.height);
      const liveCanvas = backdrop.current?.querySelector("canvas"), image = source.current?.complete && source.current.naturalWidth ? source.current : null, imageSource = liveCanvas || image;
      const dynamic = Boolean(liveCanvas);
      if (imageSource !== lastSource || lastGrain !== config.grain || lastBlur !== config.frostBlur || lastTint !== config.tint) { dirty.current = true; lastSource = imageSource; }
      if (!dirty.current && !dynamic) return;
      frostContext.save(); frostContext.globalCompositeOperation = "source-over"; frostContext.clearRect(0, 0, frame.width, frame.height);
      frostContext.fillStyle = "#b6c9b7"; frostContext.fillRect(0, 0, frame.width, frame.height);
      frostContext.filter = "blur(" + clamp(config.frostBlur, 0, 45) + "px)";
      if (imageSource) paintCoveredImage(frostContext, imageSource, frame.width, frame.height);
      else if (typeof config.background === "string") paintCssBackground(frostContext, config.background, frame.width, frame.height);
      frostContext.filter = "none"; frostContext.fillStyle = config.tint; frostContext.fillRect(0, 0, frame.width, frame.height);
      frostContext.globalAlpha = clamp(config.grain, 0, 1); frostContext.fillStyle = frostContext.createPattern(noise, "repeat")!; frostContext.fillRect(0, 0, frame.width, frame.height); frostContext.globalAlpha = 1;
      frostContext.globalCompositeOperation = "destination-in"; frostContext.drawImage(maskCanvas, 0, 0, frame.width, frame.height); frostContext.restore();
      context.clearRect(0, 0, frame.width, frame.height); context.drawImage(frost, 0, 0, frame.width, frame.height);
      lastGrain = config.grain; lastBlur = config.frostBlur; lastTint = config.tint; dirty.current = false;
    });
    renderer.current = paint;
    void document.fonts.ready.then(() => { if (renderer.current === paint) { reset.current = true; dirty.current = true; paint.redraw(); } });
    return () => { paint.destroy(); sound.destroy(); renderer.current = null; audio.current = null; mask.current = null; pointerPaths.clear(); maskCanvas.width = frost.width = noise.width = 0; };
  }, []);
  const brush = (from: FrostPoint, control: FrostPoint, to: FrostPoint) => {
    const context = mask.current?.getContext("2d"); if (!context) return;
    paintFrostCurve(context, from, control, to, clamp(brushSize, 4, 150), clamp(brushSoftness, 0, 1)); holes.current = true; dirty.current = true; renderer.current?.redraw();
  };
  const clearGlass = () => {
    const context = mask.current?.getContext("2d"); if (!context || !canvas.current) return;
    context.save(); context.setTransform(1, 0, 0, 1, 0, 0); context.clearRect(0, 0, mask.current!.width, mask.current!.height); context.restore();
    holes.current = true; dirty.current = true; renderer.current?.redraw(); onClear?.();
  };
  const resetGlass = () => { reset.current = true; paths.current.clear(); dirty.current = true; renderer.current?.redraw(); };
  const point = (event: React.PointerEvent<HTMLCanvasElement>): FrostPoint => {
    const box = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top, pressure: event.pointerType === "pen" || event.pointerType === "touch" ? event.pressure || 0.55 : 0.7 };
  };
  const isImage = typeof background === "string" && !background.includes("gradient(") && !/^(#|rgb|hsl|transparent|[a-z]+$)/i.test(background);
  return <div className={cn("creative-surface frosted-glass", className)} ref={root} data-theme={resolved} data-appearance={appearance}>
    <div ref={stage} className="frosted-glass-stage">
      <div ref={backdrop} className="frosted-glass-background" style={typeof background === "string" && !isImage ? { background } : undefined}>{isImage ? <img ref={source} src={background as string} alt="" onLoad={() => { dirty.current = true; renderer.current?.redraw(); }} /> : typeof background !== "string" ? background : null}</div>
      <div className="frosted-glass-initial" aria-hidden="true" style={{ backdropFilter: "blur(" + frostBlur + "px)", background: tint } as CSSProperties} />
      <canvas ref={canvas} tabIndex={0} aria-label="Write on frosted glass. Arrow keys draw. Space clears the glass. R resets the frost."
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); const next = point(event); paths.current.set(event.pointerId, { last: next, midpoint: next }); brush(next, next, next); if (!isMuted) { audio.current?.unlock(); audio.current?.play("wipe", volume); } }}
        onPointerMove={(event) => { const path = paths.current.get(event.pointerId); if (!path) return; const next = point(event), midpoint = { x: (path.last.x + next.x) / 2, y: (path.last.y + next.y) / 2, pressure: (path.last.pressure + next.pressure) / 2 }; brush(path.midpoint, path.last, midpoint); paths.current.set(event.pointerId, { last: next, midpoint }); }}
        onPointerUp={(event) => { const path = paths.current.get(event.pointerId); if (path) brush(path.midpoint, path.last, path.last); paths.current.delete(event.pointerId); }} onPointerCancel={(event) => paths.current.delete(event.pointerId)}
        onKeyDown={(event) => {
          if (event.key === " ") { event.preventDefault(); clearGlass(); return; } if (event.key.toLowerCase() === "r") { resetGlass(); return; }
          const moves: Record<string, [number, number]> = { ArrowLeft: [-16, 0], ArrowRight: [16, 0], ArrowUp: [0, -16], ArrowDown: [0, 16] };
          if (!moves[event.key] || !stage.current) return; event.preventDefault(); const [dx, dy] = moves[event.key], previous = keyboard.current;
          const next = { ...previous, x: clamp(previous.x + dx, 0, stage.current.clientWidth), y: clamp(previous.y + dy, 0, stage.current.clientHeight) }; brush(previous, previous, next); keyboard.current = next;
        }} />
    </div>
    <div className="frosted-glass-footer"><span>Write a little. Reveal a little.</span><div className="creative-actions"><button type="button" className="creative-icon-button" aria-label={isMuted ? "Unmute wipe sound" : "Mute wipe sound"} aria-pressed={isMuted} onClick={() => { if (isMuted) audio.current?.unlock(); setMuted(!isMuted); }}><CreativeIcon name={isMuted ? "muted" : "speaker"} /></button><button type="button" className="creative-button" onClick={clearGlass}>Clear glass</button>{showResetButton && <button type="button" className="creative-button" onClick={resetGlass}><CreativeIcon name="refresh" width="13" height="13" />Reset frost</button>}</div></div>
  </div>;
}
