"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "./appearance";
import { useCreativeTheme, clamp, type CreativeTheme, type CreativeSize } from "./creative-surface";
import { createMotionActivity } from "./use-motion-activity";
import { FLORAL_ART } from "./creative-art";
import { CreativeIcon } from "./creative-icons";
import "../../styles/creative-stamps.css";

export type TiltStamp3DProps = {
  image?: string; label?: string; code?: string; accent?: string; seal?: ReactNode;
  intensity?: number; glare?: boolean; autoRotate?: boolean; size?: CreativeSize; foil?: boolean;
  theme?: CreativeTheme; appearance?: Appearance; className?: string;
};

export function TiltStamp3D({ image = FLORAL_ART, label = "ORANGE STUDIO", code = "MIDNIGHT BLOOM / 1038 U", accent = "#4e419b", seal, intensity = 1, glare = true, autoRotate = false, size = 340, foil = false, theme = "auto", appearance = "polished", className }: TiltStamp3DProps) {
  const root = useRef<HTMLDivElement>(null), card = useRef<HTMLDivElement>(null), target = useRef({ x: 0, y: 0, glareX: 35, glareY: 25 });
  const drag = useRef<{ x: number; y: number } | null>(null), latest = useRef({ intensity, autoRotate, glare }), mounted = useRef(false), orientationCleanup = useRef<(() => void) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null), [orientation, setOrientation] = useState(false), [message, setMessage] = useState("");
  const resolved = useCreativeTheme(theme), description = useId();
  useEffect(() => { latest.current = { intensity, autoRotate, glare }; }, [intensity, autoRotate, glare]);
  useEffect(() => {
    mounted.current = true;
    const element = root.current, paper = card.current; if (!element || !paper) return;
    let x = 0, y = 0, vx = 0, vy = 0;
    const paint = (reduced = false, time = 0) => {
      const config = latest.current, turnX = config.autoRotate && !drag.current ? Math.sin(time / 1900) * 5 : 0, turnY = config.autoRotate && !drag.current ? Math.cos(time / 2300) * 6 : 0;
      if (reduced) { x = 0; y = 0; vx = 0; vy = 0; }
      else {
        vx = (vx + (target.current.x + turnX - x) * 0.075) * 0.76;
        vy = (vy + (target.current.y + turnY - y) * 0.075) * 0.76;
        x += vx; y += vy;
      }
      paper.style.setProperty("--tilt-x", x.toFixed(3) + "deg"); paper.style.setProperty("--tilt-y", y.toFixed(3) + "deg");
      paper.style.setProperty("--glare-x", target.current.glareX + "%"); paper.style.setProperty("--glare-y", target.current.glareY + "%");
      paper.style.setProperty("--glare-opacity", config.glare ? "0.38" : "0");
      paper.style.setProperty("--foil-angle", (120 + y * 4) + "deg");
    };
    const motion = createMotionActivity(element, { onFrame: ({ time }) => paint(false, time), onStatus: (status) => { if (status !== "running") paint(true); } });
    paint(true);
    return () => { mounted.current = false; motion.destroy(); orientationCleanup.current?.(); orientationCleanup.current = null; if (timer.current) clearTimeout(timer.current); };
  }, []);
  const enableOrientation = async () => {
    if (orientation) { orientationCleanup.current?.(); orientationCleanup.current = null; setOrientation(false); target.current.x = 0; target.current.y = 0; return; }
    const EventClass = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    if (!EventClass) { setMessage("Motion controls are unavailable on this device. Drag the card instead."); return; }
    try {
      if (EventClass.requestPermission && await EventClass.requestPermission() !== "granted") { if (mounted.current) setMessage("Motion permission was not granted. Drag the card instead."); return; }
      if (!mounted.current) return;
      const move = (event: DeviceOrientationEvent) => { if (!drag.current) { target.current.x = clamp((event.beta ?? 0) - 30, -15, 15) * intensity; target.current.y = clamp(event.gamma ?? 0, -20, 20) * intensity; } };
      window.addEventListener("deviceorientation", move); orientationCleanup.current = () => window.removeEventListener("deviceorientation", move);
      setOrientation(true); setMessage("Tilt your device to move the card.");
    } catch { if (mounted.current) setMessage("Motion controls could not start. Drag the card instead."); }
  };
  return <div ref={root} className={cn("creative-surface tilt-stamp", className)} data-theme={resolved} data-appearance={appearance} style={{ "--tilt-size": typeof size === "number" ? size + "px" : size, "--tilt-accent": accent } as CSSProperties}>
    <div ref={card} className="tilt-stamp-card" data-foil={foil} tabIndex={0} role="group" aria-label={label + " interactive card"} aria-describedby={description}
      onPointerDown={(event) => { event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); drag.current = { x: event.clientX, y: event.clientY }; }}
      onPointerMove={(event) => {
        const box = event.currentTarget.getBoundingClientRect(), px = (event.clientX - box.left) / box.width, py = (event.clientY - box.top) / box.height;
        target.current.glareX = clamp(px * 100, 0, 100); target.current.glareY = clamp(py * 100, 0, 100);
        if (drag.current) {
          target.current.y += (event.clientX - drag.current.x) * 0.4;
          target.current.x -= (event.clientY - drag.current.y) * 0.4;
          drag.current = { x: event.clientX, y: event.clientY };
        } else { target.current.x = (0.5 - py) * 18 * intensity; target.current.y = (px - 0.5) * 22 * intensity; }
      }}
      onPointerUp={() => { drag.current = null; target.current.x = 0; target.current.y = 0; }} onPointerCancel={() => { drag.current = null; target.current.x = 0; target.current.y = 0; }}
      onPointerLeave={() => { if (!drag.current) { target.current.x = 0; target.current.y = 0; } }}
      onKeyDown={(event) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "Escape"].includes(event.key)) return;
        event.preventDefault();
        if (event.key === "Home" || event.key === "Escape") { target.current.x = 0; target.current.y = 0; }
        else if (event.key === "ArrowLeft") target.current.y -= 10; else if (event.key === "ArrowRight") target.current.y += 10; else if (event.key === "ArrowUp") target.current.x += 10; else target.current.x -= 10;
        if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => { target.current.x = 0; target.current.y = 0; }, 700);
      }}>
      <div className="tilt-stamp-swatch" /><img className="tilt-stamp-picture" src={image} alt="Original floral arrangement" draggable={false} />
      <div className="tilt-stamp-label"><strong>{label}</strong><small>{code}</small><span className="tilt-stamp-seal">{seal ?? <CreativeIcon name="spark" />}</span></div><div className="tilt-stamp-glare" />
    </div>
    <span id={description} className="sr-only">Move your pointer to tilt. Drag to rotate freely. Arrow keys rotate; Home resets.</span>
    <div className="tilt-stamp-footer"><span>Paper, with a little perspective.</span><button type="button" className="creative-button" aria-pressed={orientation} onClick={() => void enableOrientation()}>{orientation ? "Motion on" : "Use device tilt"}</button></div>
    {message && <p className="creative-feedback" role="status">{message}</p>}
  </div>;
}
