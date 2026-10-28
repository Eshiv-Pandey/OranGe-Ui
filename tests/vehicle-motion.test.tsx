import { StrictMode, useRef } from "react";
import { renderToString } from "react-dom/server";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createVehicleMotion, getVehicleMotionFrame, restVehicleMotion, stepVehicleMotion, vehicleMotionStyles, type VehicleMotionInput, type VehicleMotionOptions, type VehicleMotionState } from "../components/ui/vehicle-motion";
import { useVehicleMotion, type UseVehicleMotionOptions } from "../components/ui/use-vehicle-motion";

function advance(state: VehicleMotionState, input: VehicleMotionInput, milliseconds: number, options: VehicleMotionOptions = {}, frameMs = 1000 / 60) {
  for (let elapsed = 0; elapsed < milliseconds - 0.000001; elapsed += frameMs) state = stepVehicleMotion(state, input, Math.min(frameMs, milliseconds - elapsed), options);
  return state;
}

describe("vehicle travel and force integration", () => {
  it("clamps target inputs and reaches exact endpoints with finite acceleration", () => {
    let state = createVehicleMotion();
    for (let index = 0; index < 1000; index += 1) {
      const previousVelocity = state.velocity;
      state = stepVehicleMotion(state, { speed: 4 }, 16);
      expect(state.velocity).toBeGreaterThanOrEqual(previousVelocity);
      expect(state.velocity).toBeLessThanOrEqual(70);
      expect((state.velocity - previousVelocity) / 0.016).toBeLessThanOrEqual(18.0000001);
      expect(state.acceleration).toBeLessThanOrEqual(18.0000001);
    }
    expect(state.velocity).toBe(70);
    for (let index = 0; index < 1000; index += 1) {
      const previousVelocity = state.velocity;
      state = stepVehicleMotion(state, { speed: -4 }, 16);
      expect(state.velocity).toBeGreaterThanOrEqual(0);
      expect(state.velocity).toBeLessThanOrEqual(previousVelocity);
      expect((previousVelocity - state.velocity) / 0.016).toBeLessThanOrEqual(28.0000001);
      expect(state.acceleration).toBeGreaterThanOrEqual(-28.0000001);
    }
    expect(state.velocity).toBe(0);
    expect(state.acceleration).toBe(0);
  });

  it("integrates constant-speed travel and exact wheel angle independently of frame rate", () => {
    const options = { maxSpeed: 60, wheelRadius: 0.3 };
    const slow = advance(createVehicleMotion(0.25, options), { speed: 0.25 }, 2000, options, 1000 / 30);
    const fast = advance(createVehicleMotion(0.5, options), { speed: 0.5 }, 2000, options, 1000 / 120);
    const slowFrame = getVehicleMotionFrame(slow, options);
    const fastFrame = getVehicleMotionFrame(fast, options);
    expect(slow.travel).toBeCloseTo(30, 9);
    expect(fast.travel).toBeCloseTo(60, 9);
    expect(fast.travel).toBeCloseTo(slow.travel * 2, 9);
    expect(fastFrame.wheelAngle).toBeCloseTo(200, 9);
    expect(fastFrame.wheelAngle).toBeCloseTo(slowFrame.wheelAngle * 2, 9);
  });

  it("keeps acceleration travel consistent at 30, 60, and 120fps", () => {
    const states = [30, 60, 120].map((fps) => advance(createVehicleMotion(), { speed: 0.8 }, 6000, {}, 1000 / fps));
    for (const state of states) {
      expect(state.velocity).toBeCloseTo(states[0].velocity, 8);
      expect(state.travel).toBeCloseTo(states[0].travel, 8);
      expect(state.pitch.position).toBeCloseTo(states[0].pitch.position, 3);
    }
  });

  it("raises a right-facing nose during acceleration and dives under braking", () => {
    const options = { roughness: 0 };
    const launch = advance(createVehicleMotion(), { speed: 1 }, 650, options);
    expect(launch.acceleration).toBeGreaterThan(0);
    expect(launch.pitch.position).toBeLessThan(-1);
    expect(launch.frontSuspension.position).toBeLessThan(0);
    expect(launch.rearSuspension.position).toBeGreaterThan(0);
    const brake = advance(createVehicleMotion(1), { speed: 0 }, 650, options);
    expect(brake.acceleration).toBeLessThan(0);
    expect(brake.pitch.position).toBeGreaterThan(1);
    expect(brake.frontSuspension.position).toBeGreaterThan(0);
    expect(brake.rearSuspension.position).toBeLessThan(0);
  });

  it("settles suspension, wings, wheel blur, and travel at speed zero", () => {
    const moving = advance(createVehicleMotion(), { speed: 1 }, 6000);
    const resting = advance(moving, { speed: 0 }, 14000);
    const later = advance(resting, { speed: 0 }, 4000);
    const frame = getVehicleMotionFrame(resting);
    expect(later.travel).toBe(resting.travel);
    expect(frame.velocity).toBe(0);
    expect(frame.acceleration).toBe(0);
    expect(frame.pitch).toBe(0);
    expect(frame.bodyY).toBe(0);
    expect(frame.frontSuspension).toBe(0);
    expect(frame.rearSuspension).toBe(0);
    expect(frame.frontWing).toBe(0);
    expect(frame.rearWing).toBe(0);
    expect(frame.wheelBlur).toBe(0);
    expect(frame.wheelSpokes).toBe(1);
    expect(frame.speedLines).toBe(0);
    expect(frame.heat).toBe(0);
  });

  it("is pure and treats zero, negative, or invalid elapsed time as no-ops", () => {
    const state = createVehicleMotion(0.5);
    Object.values(state).forEach((value) => { if (typeof value === "object") Object.freeze(value); });
    Object.freeze(state);
    expect(stepVehicleMotion(state, { speed: 1 }, 0)).toBe(state);
    expect(stepVehicleMotion(state, { speed: 1 }, -1)).toBe(state);
    expect(stepVehicleMotion(state, { speed: 1 }, NaN)).toBe(state);
    expect(stepVehicleMotion(state, { speed: 1 }, Infinity)).toBe(state);
    const next = stepVehicleMotion(state, { speed: 1 }, 16);
    expect(next.travel).toBeGreaterThan(0);
    expect(state.travel).toBe(0);
    expect(state.pitch.position).toBe(0);
  });

  it("bounds an oversized frame instead of catching up a wall-clock gap", () => {
    const state = createVehicleMotion(0.5);
    const normal = stepVehicleMotion(state, { speed: 1 }, 50);
    const delayed = stepVehicleMotion(state, { speed: 1 }, 60000);
    expect(delayed).toEqual(normal);
    expect(delayed.travel).toBeLessThan(2);
  });

  it("remains bounded during repeated hard throttle, braking, lean, and launch changes", () => {
    let state = createVehicleMotion();
    for (let index = 0; index < 5000; index += 1) {
      state = stepVehicleMotion(state, { speed: Math.floor(index / 40) % 2, lean: index % 2 ? -1 : 1, wheelie: true }, index % 3 ? 16 : 10000, { kind: "bike", roughness: 1 });
      const frame = getVehicleMotionFrame(state, { kind: "bike" });
      Object.values(frame).forEach((value) => expect(Number.isFinite(value)).toBe(true));
      expect(Math.abs(frame.pitch)).toBeLessThan(15);
      expect(Math.abs(frame.frontSuspension)).toBeLessThan(10);
      expect(Math.abs(frame.rearSuspension)).toBeLessThan(10);
      expect(Math.abs(frame.lean)).toBeLessThanOrEqual(25);
      expect(frame.velocity).toBeGreaterThanOrEqual(0);
      expect(frame.velocity).toBeLessThanOrEqual(60);
    }
  }, 15_000);

  it("handles invalid controls and option values without emitting nonfinite CSS", () => {
    const options = { maxSpeed: NaN, wheelRadius: 0, pixelsPerMeter: Infinity, maxAcceleration: -1, responseTime: 0, roadPeriod: 0, backgroundPeriod: -4 };
    const state = stepVehicleMotion(createVehicleMotion(), { speed: NaN, lean: Infinity }, 50, options);
    const css = vehicleMotionStyles(getVehicleMotionFrame(state, options));
    expect(state.velocity).toBe(0);
    expect(Object.values(css).join(" ")).not.toMatch(/NaN|Infinity/);
  });
});

describe("vehicle rendering signals", () => {
  it("crossfades every spoke out at high speed and keeps blur and spokes complementary", () => {
    const low = getVehicleMotionFrame(createVehicleMotion(0.05));
    const medium = getVehicleMotionFrame(createVehicleMotion(0.22));
    const fast = getVehicleMotionFrame(createVehicleMotion(1));
    expect(low.wheelBlur).toBe(0);
    expect(medium.wheelBlur).toBeGreaterThan(0);
    expect(medium.wheelBlur).toBeLessThan(1);
    expect(fast.wheelBlur).toBe(1);
    expect(fast.wheelSpokes).toBe(0);
    for (const frame of [low, medium, fast]) expect(frame.wheelBlur + frame.wheelSpokes).toBe(1);
    expect(fast.speedLines).toBeGreaterThan(low.speedLines);
    expect(fast.shadowScaleX).toBeGreaterThan(low.shadowScaleX);
    expect(fast.shadowOpacity).toBeGreaterThan(low.shadowOpacity);
  });

  it("scrolls road, markings, and background from the same travel with parallax", () => {
    const state = { ...createVehicleMotion(), travel: 1 };
    const frame = getVehicleMotionFrame(state, { pixelsPerMeter: 100 });
    const scaled = getVehicleMotionFrame(state, { pixelsPerMeter: 200 });
    expect(frame.roadOffset).toBe(-100);
    expect(frame.markingOffset).toBe(-100);
    expect(frame.backgroundOffset).toBe(-12);
    expect(frame.farBackgroundOffset).toBe(-4.5);
    expect(scaled.roadOffset).toBe(-40);
    expect(scaled.markingOffset).toBe(-200);
    expect(scaled.backgroundOffset).toBe(-24);
    expect(scaled.wheelAngle).toBe(frame.wheelAngle);
  });

  it("gives bikes braking fork compression, acceleration rear squat, lean, and rider tuck", () => {
    const options = { kind: "bike" as const, roughness: 0 };
    const launch = getVehicleMotionFrame(advance(createVehicleMotion(), { speed: 1 }, 650, options), options);
    const brake = getVehicleMotionFrame(advance(createVehicleMotion(1, options), { speed: 0 }, 650, options), options);
    const corner = getVehicleMotionFrame(advance(createVehicleMotion(1, options), { speed: 1, lean: -4 }, 3000, options), options);
    expect(launch.rearSquat).toBeGreaterThan(3);
    expect(brake.forkCompression).toBeGreaterThan(3);
    expect(brake.pitch).toBeGreaterThan(0);
    expect(corner.lean).toBeCloseTo(-24, 3);
    expect(corner.riderTuck).toBeCloseTo(1, 4);
  });

  it("allows one optional wheelie per launch and only rearms after returning to rest", () => {
    const options = { kind: "bike" as const, roughness: 0 };
    const launched = advance(createVehicleMotion(), { speed: 1, wheelie: true }, 450, options);
    expect(launched.wheelie.position).toBeGreaterThan(3);
    expect(launched.launchArmed).toBe(false);
    const steady = advance(launched, { speed: 1, wheelie: true }, 10000, options);
    expect(steady.wheelie.position).toBe(0);
    expect(steady.launchArmed).toBe(false);
    expect(steady.launchElapsed).toBe(-1);
    const steadyAgain = advance(steady, { speed: 1, wheelie: true }, 3000, options);
    expect(steadyAgain.wheelie.position).toBe(0);
    const rest = advance(steadyAgain, { speed: 0, wheelie: true }, 12000, options);
    expect(rest.launchArmed).toBe(true);
    expect(advance(rest, { speed: 1, wheelie: true }, 450, options).wheelie.position).toBeGreaterThan(3);
    const disabled = advance(createVehicleMotion(), { speed: 1, wheelie: false }, 600, options);
    expect(disabled.wheelie.position).toBe(0);
    const car = advance(createVehicleMotion(), { speed: 1, wheelie: true }, 600);
    expect(car.wheelie.position).toBe(0);
  });

  it("resets dynamic pose under reduced motion while preserving integrated wheel and road phase", () => {
    const state = advance(createVehicleMotion(), { speed: 1, wheelie: true, lean: 1 }, 700, { kind: "bike" });
    const resting = restVehicleMotion(state);
    const frame = getVehicleMotionFrame(resting);
    expect(resting.travel).toBe(state.travel);
    expect(frame.pitch).toBe(0);
    expect(frame.lean).toBe(0);
    expect(frame.velocity).toBe(0);
    expect(frame.riderTuck).toBe(0);
    expect(frame.wheelBlur).toBe(0);
    expect(frame.wheelAngle).toBe(state.travel / 0.34);
  });
});

function motionBrowser() {
  let sequence = 0;
  let hidden = false;
  const queue = new Map<number, FrameRequestCallback>();
  const mediaListeners = new Set<() => void>();
  const observers: { callback: IntersectionObserverCallback; target?: Element; disconnected: boolean }[] = [];
  const media = {
    matches: false, media: "(prefers-reduced-motion: reduce)", onchange: null,
    addEventListener: vi.fn((_type: string, callback: () => void) => mediaListeners.add(callback)),
    removeEventListener: vi.fn((_type: string, callback: () => void) => mediaListeners.delete(callback)),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  };
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => hidden ? "hidden" : "visible");
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { queue.set(++sequence, callback); return sequence; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => queue.delete(id)));
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("IntersectionObserver", class {
    record: typeof observers[number];
    constructor(callback: IntersectionObserverCallback) { this.record = { callback, disconnected: false }; observers.push(this.record); }
    observe(target: Element) { this.record.target = target; }
    unobserve() {}
    disconnect() { this.record.disconnected = true; }
    takeRecords() { return []; }
  });
  return {
    queue, observers, mediaListeners,
    frame(time: number) { const callbacks = [...queue.values()]; queue.clear(); callbacks.forEach((callback) => callback(time)); },
    intersection(visible: boolean) {
      for (const observer of observers.filter((entry) => !entry.disconnected)) observer.callback([{ isIntersecting: visible, target: observer.target } as IntersectionObserverEntry], {} as IntersectionObserver);
    },
    visibility(visible: boolean) { hidden = !visible; document.dispatchEvent(new Event("visibilitychange")); },
    reduce(value: boolean) { media.matches = value; mediaListeners.forEach((listener) => listener()); },
  };
}

function Vehicle({ onRender, ...options }: UseVehicleMotionOptions & { onRender?: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  useVehicleMotion(ref, options);
  onRender?.();
  return <svg ref={ref} role="img" aria-label="Test vehicle" />;
}

describe("vehicle React motion lifecycle", () => {
  let browser: ReturnType<typeof motionBrowser>;
  beforeEach(() => { browser = motionBrowser(); });
  afterEach(() => vi.unstubAllGlobals());

  it("updates speed and lean without per-frame renders or restarting accumulated travel", () => {
    const onRender = vi.fn();
    const firstFrame = vi.fn();
    const view = render(<Vehicle speed={1} kind="bike" onRender={onRender} onFrame={firstFrame} />);
    const svg = screen.getByRole("img");
    expect(svg.getAttribute("data-motion")).toBe("paused");
    expect(browser.queue.size).toBe(0);
    const initialRenders = onRender.mock.calls.length;
    act(() => {
      browser.intersection(true);
      for (let time = 0; time <= 1600; time += 16) browser.frame(time);
    });
    const previousTravel = Number(svg.style.getPropertyValue("--vehicle-travel"));
    const previousVelocity = Number(svg.style.getPropertyValue("--vehicle-velocity"));
    expect(previousTravel).toBeGreaterThan(0);
    expect(onRender).toHaveBeenCalledTimes(initialRenders);
    const secondFrame = vi.fn();
    view.rerender(<Vehicle speed={0.1} lean={1} kind="bike" onRender={onRender} onFrame={secondFrame} />);
    const rendersAfterInput = onRender.mock.calls.length;
    const previousCallbacks = firstFrame.mock.calls.length;
    act(() => { for (let time = 1616; time <= 2000; time += 16) browser.frame(time); });
    expect(Number(svg.style.getPropertyValue("--vehicle-travel"))).toBeGreaterThan(previousTravel);
    expect(Number(svg.style.getPropertyValue("--vehicle-velocity"))).toBeLessThan(previousVelocity);
    expect(parseFloat(svg.style.getPropertyValue("--vehicle-lean"))).toBeGreaterThan(0);
    expect(onRender).toHaveBeenCalledTimes(rendersAfterInput);
    expect(firstFrame).toHaveBeenCalledTimes(previousCallbacks);
    expect(secondFrame).toHaveBeenCalled();
  });

  it("freezes offscreen and hidden with identical travel on each first resumed frame", () => {
    render(<Vehicle speed={1} />);
    const svg = screen.getByRole("img");
    act(() => { browser.intersection(true); browser.frame(0); browser.frame(16); browser.frame(32); });
    const beforePause = svg.getAttribute("style");
    act(() => { browser.intersection(false); browser.frame(50000); });
    expect(browser.queue.size).toBe(0);
    expect(svg.getAttribute("style")).toBe(beforePause);
    act(() => { browser.intersection(true); browser.frame(100000); });
    expect(svg.getAttribute("style")).toBe(beforePause);
    act(() => browser.frame(100016));
    const beforeHidden = svg.getAttribute("style");
    act(() => { browser.visibility(false); browser.frame(200000); });
    expect(browser.queue.size).toBe(0);
    expect(svg.getAttribute("style")).toBe(beforeHidden);
    act(() => { browser.visibility(true); browser.frame(300000); });
    expect(svg.getAttribute("style")).toBe(beforeHidden);
  });

  it("keeps a neutral static pose under reduced motion including prop updates", () => {
    const view = render(<Vehicle speed={1} kind="bike" wheelie lean={1} />);
    const svg = screen.getByRole("img");
    act(() => {
      browser.intersection(true);
      for (let time = 0; time <= 800; time += 16) browser.frame(time);
    });
    const travel = svg.style.getPropertyValue("--vehicle-travel");
    act(() => browser.reduce(true));
    expect(browser.queue.size).toBe(0);
    expect(svg.getAttribute("data-motion")).toBe("reduced");
    expect(parseFloat(svg.style.getPropertyValue("--vehicle-pitch"))).toBe(0);
    expect(parseFloat(svg.style.getPropertyValue("--vehicle-lean"))).toBe(0);
    expect(Number(svg.style.getPropertyValue("--vehicle-speed"))).toBe(0);
    expect(svg.style.getPropertyValue("--vehicle-travel")).toBe(travel);
    view.rerender(<Vehicle speed={0.6} kind="bike" lean={-1} wheelie />);
    act(() => browser.frame(90000));
    expect(browser.queue.size).toBe(0);
    expect(svg.style.getPropertyValue("--vehicle-travel")).toBe(travel);
    expect(parseFloat(svg.style.getPropertyValue("--vehicle-lean"))).toBe(0);
    act(() => { browser.reduce(false); browser.frame(100000); });
    expect(svg.style.getPropertyValue("--vehicle-travel")).toBe(travel);
    act(() => browser.frame(100016));
    expect(Number(svg.style.getPropertyValue("--vehicle-travel"))).toBeGreaterThan(Number(travel));
  });

  it("cleans up frames and CSS variables through StrictMode mount and unmount", () => {
    const view = render(<StrictMode><Vehicle speed={1} /></StrictMode>);
    const svg = screen.getByRole("img");
    act(() => { browser.intersection(true); browser.frame(0); browser.frame(16); });
    expect(browser.queue.size).toBe(1);
    view.unmount();
    expect(browser.queue.size).toBe(0);
    expect(browser.mediaListeners.size).toBe(0);
    expect(browser.observers.every((observer) => observer.disconnected)).toBe(true);
    expect(svg.style.getPropertyValue("--vehicle-speed")).toBe("");
    expect(svg.style.getPropertyValue("--vehicle-wheel-angle")).toBe("");
    expect(svg.getAttribute("data-motion")).toBeNull();
  });

  it("is safe to render on the server without reading browser APIs", () => {
    const matchMedia = vi.mocked(window.matchMedia);
    matchMedia.mockClear();
    expect(renderToString(<Vehicle speed={1} kind="bike" />)).toContain("Test vehicle");
    expect(matchMedia).not.toHaveBeenCalled();
    expect(browser.queue.size).toBe(0);
  });
});
