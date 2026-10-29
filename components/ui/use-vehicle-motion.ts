"use client";

import { useEffect, useRef, type RefObject } from "react";
import { createVehicleMotion, getVehicleMotionFrame, restVehicleMotion, stepVehicleMotion, vehicleMotionStyles, type VehicleMotionFrame, type VehicleMotionInput, type VehicleMotionOptions } from "./vehicle-motion";
import { useMotionActivity, type MotionElement, type MotionStatus } from "./use-motion-activity";

export type UseVehicleMotionOptions = VehicleMotionInput & VehicleMotionOptions & {
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

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const names = Object.keys(vehicleMotionStyles(getVehicleMotionFrame(createVehicleMotion())));
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

  useMotionActivity(ref, {
    onFrame: ({ delta }) => {
      const element = ref.current;
      if (!element) return;
      state.current = stepVehicleMotion(state.current, latest.current, delta, latest.current);
      publish(element, getVehicleMotionFrame(state.current, latest.current), latest.current.onFrame);
    },
    onStatus: (next) => {
      status.current = next;
      if (next === "reduced" && ref.current) {
        state.current = restVehicleMotion(state.current);
        publish(ref.current, getVehicleMotionFrame(state.current, latest.current), latest.current.onFrame);
      }
    },
  });
}
