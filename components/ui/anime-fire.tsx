"use client";

import { useEffect, useRef, useState } from "react";
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

export function AnimeFire({ colors = FIRE_COLORS, speed = 0.6, intensity = 1, height = 0.45, interactive = true, dither = false, pixelSize = 1, theme = "auto", className, sound = false, volume = 0.3, muted = false, appearance = "polished" }: AnimeFireProps) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), pointer = useRef({ x: 0.5, y: 0.12, tx: 0.5, ty: 0.12 });
  const [enabled, setEnabled] = usePropPreference(sound), [isMuted, setMuted] = usePropPreference(muted), [started, setStarted] = useState(false), resolved = useCreativeTheme(theme);
  const session = useRef<ReturnType<typeof createFireAudio> | null>(null), renderer = useRef<ReturnType<typeof createCreativeWebGL> | null>(null), active = useRef(false);
  const latest = useRef({ colors, speed, intensity, height, interactive, dither, pixelSize, resolved, enabled, isMuted, started, volume });
  useEffect(() => {
    latest.current = { colors, speed, intensity, height, interactive, dither, pixelSize, resolved, enabled, isMuted, started, volume };
    if (active.current && enabled && !isMuted && started) session.current?.start(volume * clamp(intensity, 0, 2)); else session.current?.stop();
    renderer.current?.redraw();
  }, [colors, speed, intensity, height, interactive, dither, pixelSize, resolved, enabled, isMuted, started, volume]);
  useEffect(() => {
    if (!canvas.current) return;
    const audio = createFireAudio(); session.current = audio;
    const effect = createCreativeWebGL(canvas.current, ANIME_FIRE_FRAGMENT, (frame) => {
      const config = latest.current, p = pointer.current, smoothing = frame.reduced ? 1 : Math.min(1, frame.delta * 7);
      p.x += (p.tx - p.x) * smoothing; p.y += (p.ty - p.y) * smoothing;
      return { uTime: frame.time, uTheme: config.resolved === "dark" ? 1 : 0, uPointer: [p.x, p.y], uColors: [0, 1, 2].flatMap((index) => creativeColor(config.colors[index] || FIRE_COLORS[index])), uSpeed: clamp(config.speed, 0, 5), uIntensity: clamp(config.intensity, 0, 3), uHeight: clamp(config.height, 0.05, 1), uInteractive: config.interactive ? 1 : 0, uDither: config.dither ? 1 : 0, uPixelSize: clamp(config.pixelSize, 1, 20) };
    }, {
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
  return <div className={cn("creative-surface anime-fire", className)} ref={root} data-theme={resolved} data-appearance={appearance} onPointerDown={() => { if (enabled && !isMuted && !started) start(); }}>
    <div className="anime-fire-fallback" aria-hidden="true"><svg viewBox="0 0 360 360" preserveAspectRatio="none"><path d="M0 360V317Q24 308 21 272Q48 298 52 238Q88 278 84 202Q115 240 134 176Q160 196 164 134Q183 172 178 222Q212 185 220 254Q250 214 259 281Q284 253 291 296Q326 265 360 320V360Z" fill={colors[0] || FIRE_COLORS[0]} stroke="#77313a" strokeWidth="5"/><path d="M22 360Q32 319 64 300Q96 319 108 263Q142 283 157 222Q189 245 183 293Q220 269 242 317Q268 300 294 334Q330 310 347 360Z" fill={colors[1] || FIRE_COLORS[1]}/><path d="M77 360Q115 324 138 307Q159 321 168 284Q187 319 211 320Q220 346 257 360Z" fill={colors[2] || FIRE_COLORS[2]}/></svg></div>
    <canvas ref={canvas} role="img" aria-label="Original cel-shaded fire" tabIndex={interactive ? 0 : -1}
      onPointerMove={(event) => { if (!interactive) return; const box = event.currentTarget.getBoundingClientRect(); pointer.current.tx = clamp((event.clientX - box.left) / box.width, 0, 1); pointer.current.ty = 1 - clamp((event.clientY - box.top) / box.height, 0, 1); if (root.current?.dataset.motion === "reduced") renderer.current?.redraw(); }}
      onPointerLeave={() => { pointer.current.tx = 0.5; pointer.current.ty = 0.12; }}
      onKeyDown={(event) => { if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return; event.preventDefault(); if (event.key === "ArrowLeft") pointer.current.tx -= 0.06; else if (event.key === "ArrowRight") pointer.current.tx += 0.06; else if (event.key === "ArrowUp") pointer.current.ty += 0.06; else pointer.current.ty -= 0.06; renderer.current?.redraw(); }} />
    <button type="button" className="creative-button shader-sound-toggle" aria-label={started && enabled && !isMuted ? "Sound on, mute fire sound" : "Sound off, enable fire sound"} aria-pressed={started && enabled && !isMuted} onClick={() => { if (!started || !enabled || isMuted) start(); else { setMuted(true); session.current?.stop(); } }}><CreativeIcon name={started && enabled && !isMuted ? "speaker" : "muted"} width="15" height="15" />{started && enabled && !isMuted ? "Sound on" : "Sound off"}</button>
  </div>;
}
