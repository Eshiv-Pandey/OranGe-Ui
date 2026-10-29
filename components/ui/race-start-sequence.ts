import { observeRaceMotion } from "./race-motion";

export type RaceStartPhase = "idle" | "countdown" | "ready" | "go";
export type RaceStartSnapshot = { phase: RaceStartPhase; lit: number; message: string };
export type RaceStartSequenceOptions = { running: boolean; intervalMs?: number; sequenceKey?: string | number; onComplete?: () => void };

export function raceStartInterval(value = 800) {
  return Number.isFinite(value) ? Math.min(10000, Math.max(100, value)) : 800;
}

/** The first light turns on immediately; all five extinguish after five intervals. */
export function raceStartSnapshot(elapsedMs: number, running = true, intervalMs = 800): RaceStartSnapshot {
  if (!running) return { phase: "idle", lit: 0, message: "Ready to start" };
  const elapsed = Number.isFinite(elapsedMs) ? Math.max(0, elapsedMs) : 0;
  const step = Math.floor(elapsed / raceStartInterval(intervalMs));
  if (step >= 5) return { phase: "go", lit: 0, message: "Go" };
  if (step === 4) return { phase: "ready", lit: 5, message: "All five lights on. Get ready." };
  return { phase: "countdown", lit: step + 1, message: `${step + 1} of 5 lights on` };
}

/**
 * A tiny external store emits only discrete light changes, never animation frames.
 * Reduced motion keeps meaningful timing; offscreen and hidden time are excluded.
 */
export function createRaceStartStore(options: RaceStartSequenceOptions) {
  const interval = raceStartInterval(options.intervalMs);
  let snapshot = raceStartSnapshot(0, options.running, interval);
  const listeners = new Set<() => void>();
  let completed = false;
  let onComplete = options.onComplete;
  const publish = (elapsed: number) => {
    const next = raceStartSnapshot(elapsed, options.running, interval);
    if (next.phase === snapshot.phase && next.lit === snapshot.lit) return;
    snapshot = next;
    listeners.forEach((listener) => listener());
    if (snapshot.phase === "go" && !completed) {
      completed = true;
      onComplete?.();
    }
  };
  return {
    getSnapshot: () => snapshot,
    setOnComplete(callback: RaceStartSequenceOptions["onComplete"]) { onComplete = callback; },
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    connect(element: HTMLElement) {
      const window = element.ownerDocument.defaultView;
      if (!window) return { destroy() {} };
      let elapsed = 0;
      let segmentStarted: number | null = null;
      let timer: number | undefined;
      let destroyed = false;
      const now = () => window.performance.now();
      function collectTime() {
        if (segmentStarted !== null) {
          const current = now();
          elapsed += Math.max(0, current - segmentStarted);
          segmentStarted = current;
        }
      }
      function cancel() {
        if (timer !== undefined) window!.clearTimeout(timer);
        timer = undefined;
      }
      function schedule() {
        const nextBoundary = (Math.floor(elapsed / interval) + 1) * interval;
        timer = window!.setTimeout(tick, Math.max(1, nextBoundary - elapsed));
      }
      function tick() {
        timer = undefined;
        if (destroyed || segmentStarted === null) return;
        collectTime();
        publish(elapsed);
        if (!destroyed && snapshot.phase !== "go") schedule();
        else segmentStarted = null;
      }
      const observer = observeRaceMotion(element, ({ visible }) => {
        const shouldRun = options.running && visible && snapshot.phase !== "go";
        if (shouldRun && segmentStarted === null) {
          segmentStarted = now();
          schedule();
        } else if (!shouldRun && segmentStarted !== null) {
          collectTime();
          segmentStarted = null;
          cancel();
        }
      });
      return {
        destroy() {
          destroyed = true;
          cancel();
          segmentStarted = null;
          observer.destroy();
        },
      };
    },
  };
}
