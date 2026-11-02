"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, usePropPreference, observeCreativeVisibility, clamp, type CreativeTheme } from "./creative-surface";
import { createCreativeWebGL, creativeColor } from "./creative-webgl";
import { ANIME_FIRE_FRAGMENT } from "./anime-fire-shader";
import { createFireAudio } from "./fire-audio";
import { CreativeIcon } from "./creative-icons";
import "../../styles/creative-shaders.css";

export type AnimeFireProps = {
  colors?: readonly string[]; speed?: number; intensity?: number; height?: number; interactive?: boolean;
  dither?: boolean; pixelSize?: number; theme?: CreativeTheme; className?: string;
  sound?: boolean; volume?: number; muted?: boolean; appearance?: Appearance;
};
const FIRE_COLORS = ["#e44322", "#ff881a", "#ffd34b"] as const;
const linearColor = (color: string) => creativeColor(color).map((channel) => channel <= .04045 ? channel / 12.92 : ((channel + .055) / 1.055) ** 2.4);

export function AnimeFire({ colors = FIRE_COLORS, speed = 0.6, intensity = 1, height = 0.45, interactive = true, dither, pixelSize, theme = "auto", className, sound = false, volume = 0.3, muted = false, appearance = "polished" }: AnimeFireProps) {
  const resolvedPixel = pixelSize ?? (appearance === "pixel" ? 5 : appearance === "terminal" ? 3 : 1);
  const resolvedDither = dither ?? appearance === "retro-os";
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), pointer = useRef({ x: .5, y: .5, tx: .5, ty: .5, pull: 0, targetPull: 0 });
  const [enabled, setEnabled] = usePropPreference(sound), [isMuted, setMuted] = usePropPreference(muted), [started, setStarted] = useState(false), resolved = useCreativeTheme(theme);
  const session = useRef<ReturnType<typeof createFireAudio> | null>(null), renderer = useRef<ReturnType<typeof createCreativeWebGL> | null>(null), active = useRef(false);
  const latest = useRef({ colors, speed, intensity, height, interactive, dither: resolvedDither, pixelSize: resolvedPixel, appearance, resolved, enabled, isMuted, started, volume });
  useEffect(() => {
    latest.current = { colors, speed, intensity, height, interactive, dither: resolvedDither, pixelSize: resolvedPixel, appearance, resolved, enabled, isMuted, started, volume };
    if (active.current && enabled && !isMuted && started) session.current?.start(volume * clamp(intensity, 0, 2)); else session.current?.stop();
    renderer.current?.redraw();
  }, [colors, speed, intensity, height, interactive, resolvedDither, resolvedPixel, appearance, resolved, enabled, isMuted, started, volume]);
  useEffect(() => {
    if (!canvas.current) return;
    const audio = createFireAudio(); session.current = audio;
    const effect = createCreativeWebGL(canvas.current, ANIME_FIRE_FRAGMENT, (frame) => {
      const config = latest.current, p = pointer.current, smoothing = frame.reduced ? 1 : Math.min(1, frame.delta * 7);
      p.x += (p.tx - p.x) * smoothing; p.y += (p.ty - p.y) * smoothing; p.pull += (p.targetPull - p.pull) * smoothing;
      return {
        uAppearance: ["polished", "pixel", "neobrutalism", "retro-os", "terminal"].indexOf(config.appearance),
        uTime: frame.time * clamp(config.speed, 0, 5), uTheme: config.resolved === "dark" ? 1 : 0,
        uPointer: [p.x, p.y], uPointerActive: config.interactive ? p.pull : 0,
        uEmber: linearColor(config.colors[0] || FIRE_COLORS[0]), uFlame: linearColor(config.colors[1] || FIRE_COLORS[1]), uCore: linearColor(config.colors[2] || FIRE_COLORS[2]),
        uBase: linearColor(config.resolved === "dark" ? "#08090c" : "#fcfbf9"), uIgnite: 1,
        uIntensity: clamp(config.intensity, 0, 3), uHeight: clamp(config.height, .05, 1),
        uDither: config.dither ? 1 : 0, uPixelSize: clamp(config.pixelSize, 1, 20),
      };
    }, {
      renderBudget: { maxPixels: 768_000, maxFps: 30, maxDpr: 1.5 },
      onState: (ready) => { if (root.current) root.current.dataset.renderer = ready ? "webgl" : "fallback"; },
    });
    const stopObserving = observeCreativeVisibility(root.current!, (visible) => {
      active.current = visible;
      const config = latest.current;
      if (visible && config.started && config.enabled && !config.isMuted) audio.start(config.volume * config.intensity); else audio.stop();
    });
    renderer.current = effect;
    return () => { stopObserving(); effect.destroy(); renderer.current = null; audio.destroy(); session.current = null; };
  }, []);
  const start = () => {
    session.current?.unlock(); setStarted(true); setEnabled(true); setMuted(false);
    if (active.current) session.current?.start(volume * intensity);
  };
  return <div className={cn("creative-surface anime-fire", className)} ref={root} data-renderer="fallback" data-theme={resolved} data-appearance={appearance} onPointerDown={() => { if (enabled && !isMuted && !started) start(); }}>
    <div className="anime-fire-fallback" aria-hidden="true" style={{ "--fire-ember": colors[0] || FIRE_COLORS[0], "--fire-flame": colors[1] || FIRE_COLORS[1], "--fire-core": colors[2] || FIRE_COLORS[2] } as CSSProperties} />
    <canvas ref={canvas} role="img" aria-label="Animated cel-shaded fire" tabIndex={interactive ? 0 : -1}
      onPointerMove={(event) => { if (!interactive) return; const box = event.currentTarget.getBoundingClientRect(); pointer.current.tx = clamp((event.clientX - box.left) / box.width, 0, 1); pointer.current.ty = 1 - clamp((event.clientY - box.top) / box.height, 0, 1); pointer.current.targetPull = 1; if (canvas.current?.dataset.motion === "reduced") renderer.current?.redraw(); }}
      onPointerLeave={() => { pointer.current.targetPull = 0; if (canvas.current?.dataset.motion === "reduced") renderer.current?.redraw(); }}
      onKeyDown={(event) => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return; event.preventDefault(); pointer.current.targetPull = 1; if (event.key === "ArrowLeft") pointer.current.tx = clamp(pointer.current.tx - .06, 0, 1); else if (event.key === "ArrowRight") pointer.current.tx = clamp(pointer.current.tx + .06, 0, 1); else if (event.key === "ArrowUp") pointer.current.ty = clamp(pointer.current.ty + .06, 0, 1); else pointer.current.ty = clamp(pointer.current.ty - .06, 0, 1); renderer.current?.redraw(); }} />
    <button type="button" className="creative-button shader-sound-toggle" aria-label={started && enabled && !isMuted ? "Sound on, mute fire sound" : "Sound off, enable fire sound"} aria-pressed={started && enabled && !isMuted} onClick={() => { if (!started || !enabled || isMuted) start(); else { setMuted(true); session.current?.stop(); } }}><CreativeIcon name={started && enabled && !isMuted ? "speaker" : "muted"} width="15" height="15" />{started && enabled && !isMuted ? "Sound on" : "Sound off"}</button>
  </div>;
}
