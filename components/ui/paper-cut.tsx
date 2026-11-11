"use client";

import { useEffect, useId, useMemo, useRef, type ReactNode } from "react";
import type { Appearance } from "./appearance";
import { createPaperCutArt, PAPER_CUT_PALETTES, paperBound, type PaperCutPalette } from "./paper-cut-art";
import "../../styles/paper-cut.css";

export type { PaperCutPalette } from "./paper-cut-art";
export type PaperCutProps = {
  palette?: PaperCutPalette; seed?: number; layers?: number; depth?: number;
  strength?: number; response?: number; interactive?: boolean; paused?: boolean;
  aspectRatio?: number; appearance?: Appearance; className?: string;
  label?: string; children?: ReactNode;
};

/** An SSR-visible vector surface with one demand-driven parallax loop per instance. */
export function PaperCut({ palette = "ocean", seed = 7, layers = 8, depth = 1, strength = 1,
  response = .16, interactive = true, paused = false, aspectRatio = 1.55,
  appearance = "polished", className = "", label = "Layered paper-cut artwork", children }: PaperCutProps) {
  const host = useRef<HTMLDivElement>(null);
  const unique = useId().replace(/:/g, "");
  const safePalette = PAPER_CUT_PALETTES[palette] ? palette : "ocean";
  const colors = PAPER_CUT_PALETTES[safePalette];
  const relief = paperBound(depth, 0, 2, 1);
  const amount = paperBound(strength, 0, 2, 1);
  const damping = paperBound(response, .06, .6, .16);
  const ratio = paperBound(aspectRatio, .65, 2.5, 1.55);
  const sheets = useMemo(() => createPaperCutArt(seed, layers, safePalette), [seed, layers, safePalette]);

  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const window = element.ownerDocument.defaultView;
    if (!window) return;
    const document = element.ownerDocument;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const groups = Array.from(element.querySelectorAll<SVGGElement>("[data-paper-sheet]"));
    const shadow = element.querySelector<SVGFEDropShadowElement>("feDropShadow");
    let visible = typeof window.IntersectionObserver !== "function";
    let destroyed = false, frame = 0, previous = 0, touch: number | null = null;
    let x = 0, y = 0, targetX = 0, targetY = 0;
    const canMove = () => interactive && !paused && !media.matches && visible && document.visibilityState !== "hidden";
    const cancel = () => { if (frame) window.cancelAnimationFrame(frame); frame = 0; previous = 0; };
    const paint = () => {
      groups.forEach((group, index) => {
        const sheet = sheets[index];
        const offset = (sheet.depth - .12) * amount * 25;
        group.setAttribute("transform", `translate(${(x * offset).toFixed(3)} ${(y * offset).toFixed(3)}) rotate(${(x * y * sheet.depth * amount * .9).toFixed(3)} 500 350)`);
      });
      shadow?.setAttribute("dx", (-2 * relief - x * amount * 5).toFixed(3));
      shadow?.setAttribute("dy", (-6 * relief - y * amount * 5).toFixed(3));
      element.dataset.paperPosition = `${x.toFixed(3)},${y.toFixed(3)}`;
    };
    const tick = (now: number) => {
      frame = 0;
      if (destroyed || !canMove()) return;
      const delta = previous ? Math.min(50, now - previous) : 16;
      previous = now;
      const ease = 1 - Math.exp(-delta / (damping * 1000));
      x += (targetX - x) * ease; y += (targetY - y) * ease;
      const settled = Math.abs(targetX - x) + Math.abs(targetY - y) < .001;
      if (settled) { x = targetX; y = targetY; previous = 0; }
      paint();
      if (!settled) frame = window.requestAnimationFrame(tick);
    };
    const schedule = () => { if (canMove() && !frame) frame = window.requestAnimationFrame(tick); };
    const center = () => { touch = null; targetX = 0; targetY = 0; schedule(); };
    const synchronize = () => {
      if (!canMove()) { cancel(); x = y = targetX = targetY = 0; touch = null; paint(); }
      element.dataset.paperMotion = media.matches ? "reduced" : paused || !visible || document.visibilityState === "hidden" ? "paused" : "ready";
    };
    const move = (event: PointerEvent) => {
      if (!event.isPrimary || !canMove() || (event.pointerType === "touch" && touch !== event.pointerId)) return;
      const box = element.getBoundingClientRect();
      if (!box.width || !box.height) return;
      targetX = paperBound((event.clientX - box.left) / box.width * 2 - 1, -1, 1, 0);
      targetY = paperBound((event.clientY - box.top) / box.height * 2 - 1, -1, 1, 0);
      schedule();
    };
    const down = (event: PointerEvent) => {
      if (!event.isPrimary || event.pointerType !== "touch") return;
      touch = event.pointerId; move(event);
    };
    const key = (event: KeyboardEvent) => {
      if (event.target !== element || !canMove()) return;
      const directions: Record<string, [number, number]> = { ArrowLeft: [-.2, 0], ArrowRight: [.2, 0], ArrowUp: [0, -.2], ArrowDown: [0, .2] };
      if (directions[event.key]) {
        event.preventDefault();
        targetX = paperBound(targetX + directions[event.key][0], -1, 1, 0);
        targetY = paperBound(targetY + directions[event.key][1], -1, 1, 0); schedule();
      } else if (event.key === "Escape" || event.key === "Home") { event.preventDefault(); center(); }
    };
    const blur = (event: FocusEvent) => { if (!element.contains(event.relatedTarget as Node | null)) center(); };
    const observer = typeof window.IntersectionObserver === "function" ? new window.IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting); synchronize();
    }) : null;
    observer?.observe(element);
    element.addEventListener("pointermove", move); element.addEventListener("pointerdown", down);
    element.addEventListener("pointerleave", center); element.addEventListener("pointerup", center);
    element.addEventListener("pointercancel", center); element.addEventListener("keydown", key);
    element.addEventListener("focusout", blur);
    document.addEventListener("visibilitychange", synchronize); media.addEventListener("change", synchronize);
    paint(); synchronize();
    return () => {
      destroyed = true; cancel(); observer?.disconnect();
      element.removeEventListener("pointermove", move); element.removeEventListener("pointerdown", down);
      element.removeEventListener("pointerleave", center); element.removeEventListener("pointerup", center);
      element.removeEventListener("pointercancel", center); element.removeEventListener("keydown", key);
      element.removeEventListener("focusout", blur);
      document.removeEventListener("visibilitychange", synchronize); media.removeEventListener("change", synchronize);
    };
  }, [sheets, interactive, paused, amount, damping, relief]);

  return <div ref={host} className={`paper-cut ${className}`} data-appearance={appearance} data-interactive={interactive}
    role="group" aria-label={label} aria-describedby={interactive ? `${unique}-help` : undefined}
    tabIndex={interactive ? 0 : undefined} style={{ aspectRatio: ratio, background: colors.paper }}>
    <svg className="paper-cut-art" viewBox="0 0 1000 700" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      <defs><filter id={`${unique}-shadow`} x="-30%" y="-30%" width="160%" height="160%" colorInterpolationFilters="sRGB">
        <feDropShadow dx={-2 * relief} dy={-6 * relief} stdDeviation={5 * relief} floodColor={colors.shadow} floodOpacity={.36 * relief} />
      </filter></defs>
      <rect width="1000" height="700" fill={colors.paper} />
      {sheets.map((sheet, index) => <g key={index} data-paper-sheet filter={`url(#${unique}-shadow)`}>
        <path d={sheet.path} fill={sheet.color} stroke="#ffffff" strokeOpacity=".14" strokeWidth=".9" />
      </g>)}
    </svg>
    {children && <div className="paper-cut-content">{children}</div>}
    {interactive && <span id={`${unique}-help`} className="paper-cut-help">Move your pointer or touch the artwork to shift the paper layers. Arrow keys move the perspective; Home or Escape centers it. Reduced motion shows a still composition.</span>}
  </div>;
}
