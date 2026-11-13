"use client";

import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import type { AppearanceProps } from "./appearance";
import { createCreativeCanvas, useLatest } from "./creative-surface";
import { drawGlyphOrb, type GlyphOrbRenderConfig, type GlyphStorm } from "./glyph-orb-renderer";
import "../../styles/glyph-orb.css";

export type GlyphOrbProps = AppearanceProps & Partial<GlyphOrbRenderConfig> & {
  paused?: boolean; interactive?: boolean; draggable?: boolean; hoverLight?: boolean;
  clickStorm?: boolean; momentum?: number; height?: number | string; label?: string;
  children?: ReactNode; style?: CSSProperties;
};
export const GLYPH_ORB_DEFAULTS: GlyphOrbRenderConfig = {
  color: "#ffd4a4", shadowColor: "#70539c", background: "#080a12", glyphSize: 8, spacing: 1.12,
  size: 1, tilt: -22, bands: 8, turbulence: 1.1, speed: .6, lightAngle: -45, lightHeight: .65,
  contrast: .45, glow: .4, charset: " .,:;=+*xX#%@",
};

/** A slowly turning text planet with pointer light, inertial spin and temporary cloud storms. */
export function GlyphOrb({ paused = false, interactive = true, draggable = true, hoverLight = true, clickStorm = true, momentum = .6, height = 460, label = "Rotating planet made of ASCII characters", children, appearance = "polished", className, style, ...overrides }: GlyphOrbProps) {
  const root = useRef<HTMLDivElement>(null), canvas = useRef<HTMLCanvasElement>(null), config = { ...GLYPH_ORB_DEFAULTS, ...Object.fromEntries(Object.entries(overrides).filter(([, value]) => value !== undefined)) };
  const latest = useLatest({ config, paused, momentum });
  const motion = useRef({ time: 0, rotation: 0, latitudeRotation: 0, velocity: 0, lightX: 0, lightY: 0, targetX: 0, targetY: 0, lastPaint: -100, storms: [] as GlyphStorm[], dragging: false });
  const drag = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const painter = useRef<{ redraw: () => void; destroy: () => void } | null>(null);
  useEffect(() => {
    if (paused || !interactive || !draggable) {
      const pointer = drag.current?.id;
      if (pointer !== undefined && canvas.current?.hasPointerCapture?.(pointer)) canvas.current.releasePointerCapture(pointer);
      drag.current = null; motion.current.dragging = false; motion.current.velocity = 0;
      motion.current.targetX = motion.current.targetY = 0;
    }
    if (!hoverLight) motion.current.targetX = motion.current.targetY = 0;
  }, [paused, interactive, draggable, hoverLight]);
  useEffect(() => {
    if (!canvas.current) return;
    if (paused) {
      const element = canvas.current, context = element.getContext("2d");
      if (!context) return;
      const redraw = () => {
        const box = element.getBoundingClientRect(), dpr = Math.min(2, window.devicePixelRatio || 1);
        const width = Math.max(1, Math.round(box.width * dpr)), height = Math.max(1, Math.round(box.height * dpr));
        if (element.width !== width || element.height !== height) { element.width = width; element.height = height; }
        context.setTransform(dpr, 0, 0, dpr, 0, 0);
        drawGlyphOrb(context, box.width, box.height, latest.current.config, motion.current);
        root.current?.setAttribute("data-painted", "true");
      };
      element.dataset.motion = "paused";
      const observer = new ResizeObserver(redraw); observer.observe(element);
      const owner = { redraw, destroy: () => observer.disconnect() }; painter.current = owner; redraw();
      return () => { painter.current = null; owner.destroy(); };
    }
    const owner = createCreativeCanvas(canvas.current, (context, frame) => {
      const state = motion.current, { config: next, paused: stopped, momentum: inertia } = latest.current;
      if (!frame.reduced && !stopped && frame.delta > 0) {
        const delta = frame.delta / 1000;
        state.time += delta;
        state.lightX += (state.targetX - state.lightX) * (1 - Math.exp(-delta * 7));
        state.lightY += (state.targetY - state.lightY) * (1 - Math.exp(-delta * 7));
        if (!state.dragging) { state.rotation += state.velocity * delta; state.velocity *= Math.exp(-delta * (2 + (1 - Math.min(1, Math.max(0, inertia))) * 8)); }
        state.storms = state.storms.map(storm => ({ ...storm, age: storm.age + delta })).filter(storm => storm.age < 6);
        if (frame.time - state.lastPaint < 32) return;
      } else if (frame.delta > 0) return;
      state.lastPaint = frame.time;
      drawGlyphOrb(context, frame.width, frame.height, next, state);
      root.current?.setAttribute("data-painted", "true");
    });
    painter.current = owner;
    return () => { painter.current = null; owner.destroy(); };
  }, [latest, paused]);
  useEffect(() => { painter.current?.redraw(); });
  function point(clientX: number, clientY: number) {
    const box = canvas.current!.getBoundingClientRect(), radius = Math.min(box.width, box.height) * .405 * Math.min(1.5, Math.max(.45, Number.isFinite(config.size) ? config.size : 1));
    return { x: (clientX - box.left - box.width / 2) / radius, y: (clientY - box.top - box.height / 2) / radius };
  }
  function storm(x = 0, y = 0) { const state = motion.current; state.storms = [...state.storms.slice(-3), { x, y, age: 0 }]; painter.current?.redraw(); }
  return <div ref={root} className={["glyph-orb", className].filter(Boolean).join(" ")} data-appearance={appearance} data-interactive={interactive && draggable} style={{ ...style, height, background: config.background } as CSSProperties}>
    <pre className="glyph-orb-fallback" aria-hidden="true">{"       .:-=+*#*+=-:.\n    .:=+*#%%@%%#*+=:.\n  .-=*##%@%%%%@%##*=-.\n :=+*#%%%%@@%%%%%%#*+=:\n.-=*#%%@@%%%%@@%%%%#*=-.\n :=+*#%%%%@@%%%%%%#*+=:\n  .-=*##%@%%%%@%##*=-.\n    .:=+*#%%@%%#*+=:.\n       .:-=+*#*+=-:."}</pre>
    <canvas ref={canvas} role="img" aria-label={label} tabIndex={interactive ? 0 : undefined} onKeyDown={event => {
      if (!interactive) return;
      if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "Escape", "Enter", " "].includes(event.key)) {
        event.preventDefault(); const state = motion.current;
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") state.rotation += event.key === "ArrowLeft" ? -.2 : .2;
        if (event.key === "ArrowUp" || event.key === "ArrowDown") state.latitudeRotation = Math.min(.8, Math.max(-.8, state.latitudeRotation + (event.key === "ArrowUp" ? -.1 : .1)));
        if (event.key === "Home" || event.key === "Escape") { state.rotation = state.latitudeRotation = state.velocity = state.targetX = state.targetY = 0; }
        if ((event.key === "Enter" || event.key === " ") && clickStorm) storm();
        painter.current?.redraw();
      }
    }} onPointerMove={event => {
      if (!interactive || paused) return;
      const state = motion.current, p = point(event.clientX, event.clientY);
      if (hoverLight) { state.targetX = Math.min(1.3, Math.max(-1.3, p.x)); state.targetY = Math.min(1.3, Math.max(-1.3, p.y)); }
      const previous = drag.current;
      if (previous && previous.id === event.pointerId) {
        const dx = event.clientX - previous.x, dy = event.clientY - previous.y;
        state.rotation += dx * .008; state.latitudeRotation = Math.min(.8, Math.max(-.8, state.latitudeRotation + dy * .004)); state.velocity = dx * .22;
        previous.moved ||= Math.abs(dx) + Math.abs(dy) > 2; previous.x = event.clientX; previous.y = event.clientY;
      }
      if (event.currentTarget.dataset.motion === "reduced") painter.current?.redraw();
    }} onPointerDown={event => {
      if (!interactive || paused || event.button !== 0) return;
      const p = point(event.clientX, event.clientY); if (p.x * p.x + p.y * p.y > 1) return;
      if (draggable) { drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false }; motion.current.dragging = true; event.currentTarget.setPointerCapture(event.pointerId); }
    }} onPointerUp={event => {
      const previous = drag.current, p = point(event.clientX, event.clientY);
      if (previous?.id === event.pointerId) { drag.current = null; motion.current.dragging = false; event.currentTarget.releasePointerCapture(event.pointerId); }
      if (!interactive || paused) return;
      if ((!previous || !previous.moved) && clickStorm && p.x * p.x + p.y * p.y <= 1) storm(p.x, p.y);
    }} onPointerCancel={() => { drag.current = null; motion.current.dragging = false; }} onPointerLeave={() => { motion.current.targetX = motion.current.targetY = 0; }} />
    {children && <div className="glyph-orb-content">{children}</div>}
  </div>;
}
