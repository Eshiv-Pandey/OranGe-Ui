"use client";

import { useEffect, useRef, type RefObject } from "react";
import "../../styles/motion.css";

export type MotionElement = HTMLElement | SVGElement;
export type MotionStatus = "running" | "paused" | "reduced";
/** Active animation time and bounded frame duration, in milliseconds. */
export type MotionFrame = { time: number; delta: number };
export type MotionCallbacks = {
  onFrame?: (frame: MotionFrame) => void;
  onStatus?: (status: MotionStatus, time: number) => void;
};

/** One observed, visibility-aware frame loop. Importing this module is SSR-safe. */
export function createMotionActivity(element: MotionElement, callbacks: MotionCallbacks = {}) {
  const document = element.ownerDocument;
  const window = document.defaultView;
  if (!window) return { destroy() {} };

  const previousStatus = element.getAttribute("data-motion");
  const previousClock = element.style.getPropertyValue("--motion-clock");
  const previousClockPriority = element.style.getPropertyPriority("--motion-clock");
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  let onScreen = typeof window.IntersectionObserver !== "function";
  let status: MotionStatus | undefined;
  let frame = 0;
  let clock = 0;
  let previousTime: number | null = null;
  let destroyed = false;

  function cancel() {
    if (frame) window!.cancelAnimationFrame(frame);
    frame = 0;
    previousTime = null;
  }

  function tick(now: number) {
    frame = 0;
    if (destroyed || status !== "running") return;
    // A paused or stalled animation resumes from its last visible moment.
    const delta = previousTime === null ? 0 : Math.min(50, Math.max(0, now - previousTime));
    previousTime = now;
    clock += delta;
    element.style.setProperty("--motion-clock", (clock / 1000).toFixed(3));
    callbacks.onFrame?.({ time: clock, delta });
    if (!destroyed && status === "running") frame = window!.requestAnimationFrame(tick);
  }

  function synchronize() {
    if (destroyed) return;
    const next: MotionStatus = media.matches ? "reduced" : onScreen && document.visibilityState !== "hidden" ? "running" : "paused";
    if (next !== "running") cancel();
    if (status !== next) {
      status = next;
      element.setAttribute("data-motion", next);
      callbacks.onStatus?.(next, clock);
    }
    if (next === "running" && !frame) frame = window!.requestAnimationFrame(tick);
  }

  const observer = typeof window.IntersectionObserver === "function" ? new window.IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    synchronize();
  }) : null;
  observer?.observe(element);
  document.addEventListener("visibilitychange", synchronize);
  media.addEventListener("change", synchronize);
  element.style.setProperty("--motion-clock", "0.000");
  synchronize();

  return {
    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancel();
      observer?.disconnect();
      document.removeEventListener("visibilitychange", synchronize);
      media.removeEventListener("change", synchronize);
      if (previousStatus === null) element.removeAttribute("data-motion");
      else element.setAttribute("data-motion", previousStatus);
      if (previousClock) element.style.setProperty("--motion-clock", previousClock, previousClockPriority);
      else element.style.removeProperty("--motion-clock");
    },
  };
}

/** Callbacks stay current without restarting the clock or triggering React renders. */
export function useMotionActivity<T extends MotionElement>(ref: RefObject<T | null>, callbacks: MotionCallbacks = {}) {
  const latest = useRef(callbacks);
  useEffect(() => { latest.current = callbacks; }, [callbacks]);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const activity = createMotionActivity(element, {
      onFrame: (frame) => latest.current.onFrame?.(frame),
      onStatus: (status, time) => latest.current.onStatus?.(status, time),
    });
    return () => activity.destroy();
  }, [ref]);
}
