"use client";

import { useEffect, useRef, type RefObject } from "react";
import { advancePointerGaze, createPointerGaze, pointerFromRect, type PointerGazeOptions } from "./pointer-gaze";
import { useMotionActivity, type MotionElement, type MotionStatus } from "./use-motion-activity";

export type { PointerGazeOptions } from "./pointer-gaze";

/** Shared pointer gaze with no per-frame React state or renders. */
export function usePointerGaze<T extends MotionElement>(ref: RefObject<T | null>, { seed = "orangeui:gaze", interactive = true, blink = true }: PointerGazeOptions = {}) {
  const state = useRef(createPointerGaze(seed));
  const options = useRef({ interactive, blink });
  const status = useRef<MotionStatus>("paused");

  useEffect(() => {
    const element = ref.current;
    const window = element?.ownerDocument.defaultView;
    if (!element || !window) return;
    const variables = ["--gaze-x", "--gaze-y", "--blink-scale"] as const;
    const previous = variables.map((name) => ({ name, value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) }));
    element.style.setProperty("--gaze-x", "0");
    element.style.setProperty("--gaze-y", "0");
    element.style.setProperty("--blink-scale", "1");
    function move(event: PointerEvent) {
      if (!options.current.interactive || status.current !== "running") return;
      state.current.pointer = pointerFromRect(event.clientX, event.clientY, element!.getBoundingClientRect());
      state.current.pointerAt = state.current.clock;
    }
    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      window.removeEventListener("pointermove", move);
      for (const { name, value, priority } of previous) {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      }
    };
  }, [ref]);

  useEffect(() => {
    if (state.current.seed !== String(seed)) state.current = createPointerGaze(seed, state.current.clock);
    if (options.current.interactive !== interactive) state.current.pointerAt = -Infinity;
    options.current = { interactive, blink };
    if (!blink) {
      state.current.blinkScale = 1;
      ref.current?.style.setProperty("--blink-scale", "1");
    }
  }, [seed, interactive, blink, ref]);

  useMotionActivity(ref, {
    onFrame: (frame) => {
      const element = ref.current;
      if (!element) return;
      advancePointerGaze(state.current, frame, options.current);
      element.style.setProperty("--gaze-x", state.current.look.x.toFixed(4));
      element.style.setProperty("--gaze-y", state.current.look.y.toFixed(4));
      element.style.setProperty("--blink-scale", state.current.blinkScale.toFixed(4));
    },
    onStatus: (next) => {
      status.current = next;
      if (next === "reduced") {
        state.current.look = { x: 0, y: 0 };
        state.current.blinkScale = 1;
        state.current.blinkAt = -Infinity;
        state.current.nextBlink = Math.max(state.current.nextBlink, state.current.clock + 1000);
        state.current.pointerAt = -Infinity;
        ref.current?.style.setProperty("--gaze-x", "0");
        ref.current?.style.setProperty("--gaze-y", "0");
        ref.current?.style.setProperty("--blink-scale", "1");
      }
    },
  });
}
