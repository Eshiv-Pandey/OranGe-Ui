"use client";

import { useEffect, useRef } from "react";
import styles from "../../styles/portfolio-trail.module.css";

const CELL = 9;
const MIN_HEAT = 0.035;
const COLORS = ["#963a2c", "#e75a2c", "#ff9435", "#ffd058", "#fff0ac"];

/** A fading field of pixel ink, shared by mouse, pen, and touch input. */
export function PixelTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pointers = new Map<number, { x: number; y: number }>();
    let width = 0;
    let height = 0;
    let columns = 0;
    let rows = 0;
    let heat = new Float32Array(0);
    let next = new Float32Array(0);
    let frame = 0;
    let lastFrame = 0;

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      pointers.clear();
      heat.fill(0);
      next.fill(0);
      context!.clearRect(0, 0, width, height);
      canvas!.dataset.active = "false";
    }

    function resize() {
      stop();
      width = window.innerWidth;
      height = window.innerHeight;
      columns = Math.ceil(width / CELL);
      rows = Math.ceil(height / CELL);
      heat = new Float32Array(columns * rows);
      next = new Float32Array(columns * rows);
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas!.width = Math.ceil(width * ratio);
      canvas!.height = Math.ceil(height * ratio);
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      context!.imageSmoothingEnabled = false;
    }

    function render(time: number) {
      const step = Math.max(0.25, Math.min((time - lastFrame) / (1000 / 60), 2));
      lastFrame = time;
      const diffusion = Math.min(0.21, 0.12 * step);
      const decay = Math.pow(0.967, step);
      let maximum = 0;
      context!.clearRect(0, 0, width, height);

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < columns; x++) {
          const index = y * columns + x;
          const neighbors =
            (x > 0 ? heat[index - 1] : 0) +
            (x < columns - 1 ? heat[index + 1] : 0) +
            (y > 0 ? heat[index - columns] : 0) +
            (y < rows - 1 ? heat[index + columns] : 0);
          const value = (heat[index] * (1 - 4 * diffusion) + neighbors * diffusion) * decay;
          next[index] = value;
          maximum = Math.max(maximum, value);
          if (value < MIN_HEAT) continue;

          const color = value < 0.12 ? 0 : value < 0.3 ? 1 : value < 0.6 ? 2 : value < 0.95 ? 3 : 4;
          context!.globalAlpha = Math.min(0.74, value * 1.4);
          context!.fillStyle = COLORS[color];
          context!.fillRect(x * CELL, y * CELL, CELL - 1, CELL - 1);
        }
      }

      [heat, next] = [next, heat];
      context!.globalAlpha = 1;
      // No animation loop runs while the pointer is idle and the ink has faded.
      if (maximum < MIN_HEAT) stop();
      else frame = requestAnimationFrame(render);
    }

    function paint(x: number, y: number, radius: number, strength: number) {
      const centerX = x / CELL;
      const centerY = y / CELL;
      for (let row = Math.max(0, Math.floor(centerY - radius)); row <= Math.min(rows - 1, Math.ceil(centerY + radius)); row++) {
        for (let column = Math.max(0, Math.floor(centerX - radius)); column <= Math.min(columns - 1, Math.ceil(centerX + radius)); column++) {
          const distance = (column - centerX) ** 2 + (row - centerY) ** 2;
          if (distance > radius ** 2) continue;
          const index = row * columns + column;
          const value = strength * Math.exp(-distance / (radius ** 2 * 0.38));
          heat[index] = Math.min(2.4, Math.max(heat[index], value));
        }
      }
      if (!frame) {
        canvas!.dataset.active = "true";
        lastFrame = performance.now();
        frame = requestAnimationFrame(render);
      }
    }

    function move(event: PointerEvent) {
      if (reducedMotion.matches || document.hidden) return;
      const previous = pointers.get(event.pointerId);
      const { clientX: x, clientY: y } = event;
      if (previous) {
        const distance = Math.hypot(x - previous.x, y - previous.y);
        const samples = Math.min(20, Math.ceil(distance / (CELL * 0.7)));
        for (let sample = 1; sample <= samples; sample++) {
          const amount = sample / samples;
          paint(previous.x + (x - previous.x) * amount, previous.y + (y - previous.y) * amount, 2.7, 1.2);
        }
      } else paint(x, y, 2.7, 1.2);
      pointers.set(event.pointerId, { x, y });
    }

    function press(event: PointerEvent) {
      if (reducedMotion.matches || document.hidden) return;
      paint(event.clientX, event.clientY, event.pointerType === "touch" ? 7 : 5.5, 2.2);
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    function release(event: PointerEvent) {
      if (event.pointerType !== "mouse") pointers.delete(event.pointerId);
    }

    function clearPointers() { pointers.clear(); }
    function visibility() { if (document.hidden) stop(); }

    resize();
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerdown", press, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("scroll", clearPointers, { passive: true });
    window.addEventListener("resize", resize);
    window.addEventListener("blur", stop);
    document.addEventListener("visibilitychange", visibility);
    reducedMotion.addEventListener("change", stop);

    return () => {
      stop();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerdown", press);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("scroll", clearPointers);
      window.removeEventListener("resize", resize);
      window.removeEventListener("blur", stop);
      document.removeEventListener("visibilitychange", visibility);
      reducedMotion.removeEventListener("change", stop);
    };
  }, []);

  return <canvas ref={canvasRef} data-pixel-trail data-active="false" aria-hidden="true" className={styles.trail} />;
}
