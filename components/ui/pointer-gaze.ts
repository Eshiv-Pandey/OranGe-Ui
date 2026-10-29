import type { MotionFrame } from "./use-motion-activity";

export type PointerGazeOptions = { seed?: string | number; interactive?: boolean; blink?: boolean };
export type GazeVector = { x: number; y: number };
export type PointerGazeState = {
  seed: string;
  randomState: number;
  clock: number;
  pointerAt: number;
  pointer: GazeVector;
  glance: GazeVector;
  look: GazeVector;
  blinkScale: number;
  blinkAt: number;
  nextBlink: number;
  nextGlance: number;
};

const clamp = (value: number) => Math.max(-1, Math.min(1, value));

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  return hash >>> 0;
}

function random(state: PointerGazeState) {
  state.randomState = (state.randomState + 0x6d2b79f5) | 0;
  let value = Math.imul(state.randomState ^ (state.randomState >>> 15), 1 | state.randomState);
  value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
  return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
}

export function createPointerGaze(seed: string | number = "orangeui:gaze", clock = 0): PointerGazeState {
  const state: PointerGazeState = {
    seed: String(seed), randomState: hashSeed(String(seed)), clock,
    pointerAt: -Infinity, pointer: { x: 0, y: 0 }, glance: { x: 0, y: 0 }, look: { x: 0, y: 0 },
    blinkScale: 1, blinkAt: -Infinity, nextBlink: 0, nextGlance: 0,
  };
  state.nextBlink = clock + 1600 + random(state) * 2400;
  state.nextGlance = clock + 3000;
  return state;
}

/** Positive x points right; positive y points down. Zero-size targets keep a neutral gaze. */
export function pointerFromRect(clientX: number, clientY: number, rect: { left: number; top: number; width: number; height: number }): GazeVector {
  if (rect.width <= 0 || rect.height <= 0 || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return { x: 0, y: 0 };
  return { x: clamp((clientX - rect.left - rect.width / 2) / (rect.width / 2)), y: clamp((clientY - rect.top - rect.height / 2) / (rect.height / 2)) };
}

/** Mutates only its private state. Inputs are active-time frames, never wall time. */
export function advancePointerGaze(state: PointerGazeState, frame: MotionFrame, options: PointerGazeOptions = {}) {
  const { interactive = true, blink = true } = options;
  state.clock = frame.time;
  const steering = interactive && frame.time - state.pointerAt < 3000;
  if (!steering && frame.time >= state.nextGlance) {
    const centered = random(state) < 0.25;
    state.glance.x = centered ? 0 : (random(state) * 2 - 1) * 0.7;
    state.glance.y = centered ? 0 : (random(state) * 2 - 1) * 0.45;
    state.nextGlance = frame.time + 900 + random(state) * 1900;
  }
  const target = steering ? state.pointer : state.glance;
  const easing = 1 - Math.exp(-Math.max(0, frame.delta) / (steering ? 80 : 240));
  state.look.x = clamp(state.look.x + (target.x - state.look.x) * easing);
  state.look.y = clamp(state.look.y + (target.y - state.look.y) * easing);

  if (blink && frame.time >= state.nextBlink) {
    state.blinkAt = frame.time;
    state.nextBlink = frame.time + 2400 + random(state) * 3300;
  }
  const blinkTime = frame.time - state.blinkAt;
  const closure = blinkTime < 65 ? blinkTime / 65 : blinkTime < 95 ? 1 : blinkTime < 175 ? 1 - (blinkTime - 95) / 80 : 0;
  state.blinkScale = blink ? 1 - Math.min(1, Math.max(0, closure)) * 0.92 : 1;
}
