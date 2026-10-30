"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { createMotionActivity, type MotionFrame } from "./use-motion-activity";
import "../../styles/creative-surface.css";

export type CreativeTheme = "light" | "dark" | "auto";
export type CreativeSize = number | string;
export const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, Number.isFinite(value) ? value : minimum));

/** Explicit root classes take priority, followed by data-theme and the OS. */
export function readCreativeTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  const root = document.documentElement;
  if (root.classList.contains("dark")) return "dark";
  if (root.classList.contains("light")) return "light";
  const value = root.dataset.theme;
  if (value === "light" || value === "dark") return value;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribeTheme(notify: () => void) {
  const observer = new MutationObserver(notify);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", notify);
  return () => { observer.disconnect(); query.removeEventListener("change", notify); };
}

export function useCreativeTheme(theme: CreativeTheme = "auto") {
  const system = useSyncExternalStore(subscribeTheme, readCreativeTheme, () => "light" as const);
  return theme === "auto" ? system : theme;
}

export function useCreativeMotion<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const activity = createMotionActivity(element);
    return () => activity.destroy();
  }, [ref]);
}

export function observeCreativeVisibility(element: HTMLElement, onChange: (active: boolean) => void) {
  let visible = typeof IntersectionObserver !== "function";
  let last: boolean | undefined;
  const update = () => {
    const next = visible && document.visibilityState !== "hidden";
    if (next !== last) { last = next; onChange(next); }
  };
  const observer = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry]) => {
    visible = Boolean(entry?.isIntersecting); update();
  }) : null;
  observer?.observe(element);
  document.addEventListener("visibilitychange", update);
  update();
  return () => { observer?.disconnect(); document.removeEventListener("visibilitychange", update); };
}

export type CanvasFrame = MotionFrame & { width: number; height: number; dpr: number; reduced: boolean };

/** Shared scheduling and resize handling, with an immediately usable still frame. */
export function createCreativeCanvas(canvas: HTMLCanvasElement, draw: (context: CanvasRenderingContext2D, frame: CanvasFrame) => void, options: { pixelSize?: number; onActive?: (active: boolean) => void } = {}) {
  const context = canvas.getContext("2d");
  if (!context) return { redraw() {}, destroy() {} };
  let width = 1, height = 1, dpr = 1, time = 0, reduced = true, destroyed = false;
  const redraw = (delta = 0) => {
    if (destroyed) return;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    context.imageSmoothingEnabled = !options.pixelSize;
    draw(context, { width, height, dpr, time, delta, reduced });
  };
  const resize = () => {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width); height = Math.max(1, box.height);
    dpr = options.pixelSize ? 1 / clamp(options.pixelSize, 1, 12) : Math.min(2, window.devicePixelRatio || 1);
    const physicalWidth = Math.max(1, Math.round(width * dpr)), physicalHeight = Math.max(1, Math.round(height * dpr));
    // Assigning an unchanged backing size still clears every visible pixel.
    if (canvas.width !== physicalWidth || canvas.height !== physicalHeight) {
      canvas.width = physicalWidth;
      canvas.height = physicalHeight;
    }
    redraw();
  };
  const observer = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
  observer?.observe(canvas);
  if (!observer) window.addEventListener("resize", resize);
  const activity = createMotionActivity(canvas, {
    onFrame: (frame) => { time = frame.time; redraw(frame.delta); },
    onStatus: (status) => { reduced = status === "reduced"; options.onActive?.(status === "running"); redraw(); },
  });
  resize();
  return {
    redraw: () => redraw(),
    destroy() { destroyed = true; activity.destroy(); observer?.disconnect(); if (!observer) window.removeEventListener("resize", resize); },
  };
}

/** A ref keeps animation callbacks current without restarting resource owners. */
export function useLatest<T>(value: T) {
  const reference = useRef(value);
  useEffect(() => { reference.current = value; }, [value]);
  return reference;
}

/** Local controls remain usable, while a changed prop replaces the local choice. */
export function usePropPreference<T>(value: T): [T, (next: T) => void] {
  const [choice, setChoice] = useState({ input: value, value });
  if (!Object.is(choice.input, value)) setChoice({ input: value, value });
  return [Object.is(choice.input, value) ? choice.value : value, (next: T) => setChoice({ input: value, value: next })];
}
