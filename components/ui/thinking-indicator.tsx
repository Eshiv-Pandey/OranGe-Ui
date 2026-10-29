"use client";

import { useEffect, useRef } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import "../../styles/launch-ai.css";

export type ThinkingIndicatorProps = AppearanceProps & { label?: string; active?: boolean; announce?: boolean };

/** CSS owns the animation. Observation needs no requestAnimationFrame loop. */
export function ThinkingIndicator({ label = "Thinking", active = true, announce = true, appearance = "polished", className }: ThinkingIndicatorProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const document = element.ownerDocument, window = document.defaultView;
    if (!window) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = typeof window.IntersectionObserver !== "function";
    const sync = () => { element.dataset.motion = media.matches ? "reduced" : active && visible && document.visibilityState !== "hidden" ? "running" : "paused"; };
    const observer = typeof window.IntersectionObserver === "function" ? new window.IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); sync(); }) : null;
    observer?.observe(element);
    document.addEventListener("visibilitychange", sync);
    media.addEventListener("change", sync);
    sync();
    return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", sync); media.removeEventListener("change", sync); };
  }, [active]);
  return <div ref={ref} className={uiClass("ui-thinking-indicator", className)} data-appearance={appearance} data-motion="paused" role={announce ? "status" : undefined} aria-live={announce ? "polite" : undefined} aria-atomic={announce || undefined}>
    <span className="ui-thinking-dots" aria-hidden="true"><span /><span /><span /></span><span>{label.trim() || "Thinking"}</span>
  </div>;
}
