"use client";

import { useEffect, useRef, useState } from "react";
import "../../../styles/neon-borders.css";

/** A single quiet light cycle, paused outside the viewport and in reduced motion. */
export function useNeonBorders(count: number, enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [dimmed, setDimmed] = useState(-1);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = typeof IntersectionObserver !== "function";
    let timer: ReturnType<typeof setTimeout> | undefined;
    let nextDimmed = -1;
    function schedule() {
      clearTimeout(timer);
      if (!enabled || media.matches || !visible || document.visibilityState === "hidden") {
        setDimmed(-1);
        nextDimmed = -1;
        return;
      }
      timer = setTimeout(() => {
        nextDimmed = nextDimmed === -1 ? Math.floor(Math.random() * count) : -1;
        setDimmed(nextDimmed);
        schedule();
      }, nextDimmed === -1 ? 5500 + Math.random() * 5500 : 1000);
    }
    const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); schedule(); }) : undefined;
    if (ref.current) observer?.observe(ref.current);
    document.addEventListener("visibilitychange", schedule);
    media.addEventListener("change", schedule);
    schedule();
    return () => { clearTimeout(timer); observer?.disconnect(); document.removeEventListener("visibilitychange", schedule); media.removeEventListener("change", schedule); };
  }, [count, enabled]);
  return { ref, lit: (index: number) => !enabled || dimmed !== index };
}

export function NeonOrbit() {
  return <svg className="sb-neon-orbit" viewBox="0 0 300 260" fill="none" aria-hidden="true">
    <g className="sb-neon-orbit-mint" stroke="currentColor" strokeWidth="1.5"><circle cx="150" cy="130" r="92" /><ellipse cx="150" cy="130" rx="92" ry="34" transform="rotate(-35 150 130)" /><ellipse cx="150" cy="130" rx="34" ry="92" transform="rotate(-35 150 130)" /></g>
    <g className="sb-neon-orbit-orange" stroke="currentColor" strokeWidth="2"><path d="M150 27v20m0 166v20M47 130h20m166 0h20" /><circle cx="225" cy="78" r="6" fill="currentColor" /><path d="m152 95-26 38h24l-4 32 29-43h-25z" strokeLinejoin="round" /></g>
  </svg>;
}
