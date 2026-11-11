"use client";

import { useEffect, useRef } from "react";
import { WILD_CELL, wildBase, wildColor, wildHash, wildHeatAt, wildRegion } from "./wild-pixels";
import styles from "../../../styles/portfolio-wild.module.css";

/** The reference hero field, revealed in pixels and fading with a ragged edge. */
export function WildPixelField({ seed = 1, className = "", ambient = true, paused = false, theme = "light" }: { seed?: number; className?: string; ambient?: boolean; paused?: boolean; theme?: "light" | "dark" }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current, context = canvas?.getContext("2d");
    const parent = canvas?.parentElement;
    if (!canvas || !context || !parent) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let width = 0, height = 0, frame = 0, visible = false;
    let elapsed = 0, reveal = 0, lastFrame = 0;
    const startedAt = performance.now();

    function draw() {
      const bounds = parent!.getBoundingClientRect();
      context!.clearRect(0, 0, width, height);
      const dark = theme === "dark";
      context!.strokeStyle = dark ? "#080808" : "#fafafa";
      context!.lineWidth = 1;
      context!.beginPath();
      for (let x = 0; x <= width; x += WILD_CELL) { context!.moveTo(x + 0.5, 0); context!.lineTo(x + 0.5, height); }
      for (let y = 0; y <= height; y += WILD_CELL) { context!.moveTo(0, y + 0.5); context!.lineTo(width, y + 0.5); }
      if (ambient) context!.stroke();
      const columns = Math.ceil(width / WILD_CELL), rows = Math.ceil(height / WILD_CELL);
      const time = elapsed * 0.001;
      const intro = Math.min(1, reveal / 1600);
      const end = height * 0.55, fade = Math.max(1, height * 0.18);
      const amplitude = Math.min(height, window.innerHeight) * 0.14;
      // Copy stays clear, as the reference masthead does.
      const heading = parent!.querySelector("h2")?.getBoundingClientRect();
      const safeAreas = Array.from(parent!.querySelectorAll("[data-wild-safe]"), element => element.getBoundingClientRect());
      const firstRow = Math.max(0, Math.floor(-bounds.top / WILD_CELL) - 1);
      const lastRow = Math.min(rows - 1, Math.ceil((window.innerHeight - bounds.top) / WILD_CELL) + 1);
      for (let row = firstRow; row <= lastRow; row++) {
        const ny = row * WILD_CELL / Math.min(height, window.innerHeight);
        for (let column = 0; column < columns; column++) {
          const x = column * WILD_CELL, y = row * WILD_CELL;
          const nx = x / width;
          const cutoff = Math.max(0,
            (Math.sin(column * 0.5 + seed) + Math.sin(column * 0.21 - seed * 1.3)) * 0.16 +
            wildHash(Math.floor(column / 2) + 3.3, Math.floor(row / 4), seed) * 0.6 + 0.15);
          const depth = y + cutoff * amplitude;
          const threshold = depth <= end ? 0 : Math.min(1, (depth - end) / fade);
          let value = wildHeatAt(bounds.left + x + WILD_CELL / 2, bounds.top + y + WILD_CELL / 2);
          if (ambient && wildRegion(nx, ny, time, seed) > threshold &&
              wildHash(column * 1.7 + 11.3, row * 1.3 + 5.1, seed) < intro) {
            value += wildBase(nx, ny, time, seed) +
              (wildHash(column, row, seed) - 0.5) * 0.12 +
              Math.sin(column * 0.6 + row * 0.8 + time * 1.7) * 0.045;
          }
          if (heading && bounds.left + x < heading.right + 18 &&
              bounds.top + y < heading.bottom + 12 && bounds.top + y > heading.top - 12) continue;
          if (safeAreas.some(area => bounds.left + x >= area.left - 12 &&
              bounds.left + x <= area.right + 12 && bounds.top + y >= area.top - 10 &&
              bounds.top + y <= area.bottom + 10)) continue;
          const color = wildColor(value);
          if (!color) continue;
          context!.fillStyle = color;
          context!.fillRect(x, y, WILD_CELL - 1, WILD_CELL - 1);
        }
      }
    }

    function resize() {
      const bounds = parent!.getBoundingClientRect();
      width = Math.max(1, Math.round(bounds.width));
      height = Math.max(1, Math.round(bounds.height));
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.round(width * ratio);
      canvas!.height = Math.round(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.imageSmoothingEnabled = false;
      draw();
    }

    function loop(now: number) {
      frame = 0;
      if (!visible || document.hidden || (reducedMotion.matches || paused)) return;
      const delta = Math.min(50, now - lastFrame);
      lastFrame = now;
      elapsed += delta;
      reveal += delta;
      draw();
      frame = requestAnimationFrame(loop);
    }
    function start() {
      if (frame || !visible || document.hidden || (reducedMotion.matches || paused)) return;
      lastFrame = performance.now();
      frame = requestAnimationFrame(loop);
    }
    function visibility() {
      if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
      else start();
    }
    function motionChange() {
      cancelAnimationFrame(frame);
      frame = 0;
      draw();
      start();
    }
    const resizeObserver = new ResizeObserver(resize);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) { cancelAnimationFrame(frame); frame = 0; }
      else start();
    }, { rootMargin: "80px 0px" });
    const themeObserver = new MutationObserver(draw);
    resizeObserver.observe(parent);
    intersectionObserver.observe(parent);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", motionChange);
    elapsed = performance.now() - startedAt;
    resize();

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      themeObserver.disconnect();
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", motionChange);
    };
  }, [seed, ambient, paused, theme]);

  return <canvas ref={canvasRef} data-wild-pixel-field={ambient ? "ambient" : "cursor"} aria-hidden="true" className={`${styles.field} ${className}`} />;
}
