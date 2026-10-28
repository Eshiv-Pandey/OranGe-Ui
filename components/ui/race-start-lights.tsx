"use client";

import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { uiClass, type AppearanceProps } from "./appearance";
import { createRaceStartStore } from "./race-start-sequence";
import "../../styles/race-widgets.css";

export type RaceStartLightsProps = AppearanceProps & {
  running?: boolean;
  /** Change to replay while running remains true. */
  sequenceKey?: string | number;
  /** Active milliseconds between light changes, bounded to 100..10000. */
  intervalMs?: number;
  onComplete?: () => void;
  label?: string;
};

export function RaceStartLights({ running = false, sequenceKey = 0, intervalMs = 800, onComplete, label = "Race start", appearance = "polished", className }: RaceStartLightsProps) {
  const ref = useRef<HTMLDivElement>(null);
  const store = useMemo(() => createRaceStartStore({ running, sequenceKey, intervalMs }), [running, sequenceKey, intervalMs]);
  useEffect(() => { store.setOnComplete(onComplete); }, [store, onComplete]);
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    if (!ref.current) return;
    const connection = store.connect(ref.current);
    return () => connection.destroy();
  }, [store]);
  return <div ref={ref} className={uiClass("race-start-lights", className)} data-appearance={appearance} data-motion="paused" data-phase={snapshot.phase} role="group" aria-label={label.trim() || "Race start"}>
    <div className="race-start-housing" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((light) => <span className="race-start-lamp" data-lit={light <= snapshot.lit} key={light}><span className="race-start-lens" /></span>)}
    </div>
    <span className="race-start-status" role="status" aria-live="polite" aria-atomic="true">{snapshot.message}</span>
  </div>;
}
