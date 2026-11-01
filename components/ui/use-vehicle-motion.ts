"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createVehicleMotion, getVehicleMotionFrame, restVehicleMotion, stepVehicleMotion, vehicleMotionStyles, type VehicleMotionFrame, type VehicleMotionInput, type VehicleMotionOptions } from "./vehicle-motion";
import { useMotionActivity, type MotionElement, type MotionStatus } from "./use-motion-activity";

export type UseVehicleMotionOptions = VehicleMotionInput & VehicleMotionOptions & {
  /** WASD and arrow controls are active only while this vehicle has focus. */
  keyboardControls?: boolean;
  /** Optional imperative SVG update. Runs alongside CSS writes, never through React state. */
  onFrame?: (frame: VehicleMotionFrame) => void;
};

function publish(element: MotionElement, frame: VehicleMotionFrame, onFrame?: UseVehicleMotionOptions["onFrame"]) {
  for (const [name, value] of Object.entries(vehicleMotionStyles(frame))) element.style.setProperty(name, value);
  onFrame?.(frame);
}

/** Shares the visible/active scheduler; speed and lean changes do not restart travel. */
export function useVehicleMotion<T extends MotionElement>(ref: RefObject<T | null>, options: UseVehicleMotionOptions) {
  const state = useRef(createVehicleMotion());
  const latest = useRef(options);
  const status = useRef<MotionStatus>("paused");
  const keyboard = useRef({ keys: new Set<string>(), speed: undefined as number | undefined, steering: 0 });

  useEffect(() => {
    const element = ref.current, window = element?.ownerDocument.defaultView;
    if (!element || !window || !options.keyboardControls) return;
    const directions: Record<string, string> = { w: "up", arrowup: "up", s: "down", arrowdown: "down", a: "left", arrowleft: "left", d: "right", arrowright: "right" };
    const reset = () => { keyboard.current.keys.clear(); keyboard.current.speed = undefined; element.removeAttribute("data-driving"); };
    function key(event: KeyboardEvent) {
      if (event.target !== element || element!.ownerDocument.activeElement !== element || status.current !== "running") return;
      if (event.type === "keydown" && (event.altKey || event.ctrlKey || event.metaKey)) return;
      if (event.key === "Escape") { reset(); element!.blur(); return; }
      const direction = directions[event.key.toLowerCase()];
      if (!direction) return;
      event.preventDefault();
      if (event.type === "keydown") keyboard.current.keys.add(direction);
      else { keyboard.current.keys.delete(direction); if (direction === "up" || direction === "down") keyboard.current.speed = getVehicleMotionFrame(state.current, latest.current).speed; }
      element!.setAttribute("data-driving", "true");
    }
    element.addEventListener("keydown", key as EventListener);
    element.addEventListener("keyup", key as EventListener);
    element.addEventListener("blur", reset);
    window.addEventListener("blur", reset);
    return () => {
      reset(); element.style.removeProperty("--vehicle-steering");
      element.removeEventListener("keydown", key as EventListener); element.removeEventListener("keyup", key as EventListener);
      element.removeEventListener("blur", reset); window.removeEventListener("blur", reset);
    };
  }, [ref, options.keyboardControls]);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const names = [...Object.keys(vehicleMotionStyles(getVehicleMotionFrame(createVehicleMotion()))), "--vehicle-steering"];
    const previous = names.map((name) => ({ name, value: element.style.getPropertyValue(name), priority: element.style.getPropertyPriority(name) }));
    state.current = createVehicleMotion();
    publish(element, getVehicleMotionFrame(state.current, latest.current), latest.current.onFrame);
    return () => {
      for (const { name, value, priority } of previous) {
        if (value) element.style.setProperty(name, value, priority);
        else element.style.removeProperty(name);
      }
    };
  }, [ref]);

  useEffect(() => {
    latest.current = options;
    if (status.current === "reduced" && ref.current) {
      state.current = restVehicleMotion(state.current);
      publish(ref.current, getVehicleMotionFrame(state.current, options), options.onFrame);
    }
  }, [options, ref]);

  useEffect(() => { keyboard.current.speed = undefined; }, [options.speed]);

  useMotionActivity(ref, {
    onFrame: ({ delta }) => {
      const element = ref.current;
      if (!element) return;
      const controls = keyboard.current, keys = controls.keys;
      const steering = Number(keys.has("right")) - Number(keys.has("left"));
      controls.steering += (steering - controls.steering) * (1 - Math.exp(-delta / 150));
      const speed = keys.has("down") ? 0 : keys.has("up") ? 1 : controls.speed ?? latest.current.speed;
      const input = { ...latest.current, speed, lean: steering || latest.current.lean };
      state.current = stepVehicleMotion(state.current, input, delta, latest.current);
      element.style.setProperty("--vehicle-steering", controls.steering.toFixed(5));
      publish(element, getVehicleMotionFrame(state.current, latest.current), latest.current.onFrame);
    },
    onStatus: (next) => {
      status.current = next;
      if (next !== "running") { keyboard.current.keys.clear(); keyboard.current.speed = undefined; ref.current?.removeAttribute("data-driving"); }
      if (next === "reduced" && ref.current) {
        keyboard.current.steering = 0; ref.current.style.setProperty("--vehicle-steering", "0");
        state.current = restVehicleMotion(state.current);
        publish(ref.current, getVehicleMotionFrame(state.current, latest.current), latest.current.onFrame);
      }
    },
  });
}
