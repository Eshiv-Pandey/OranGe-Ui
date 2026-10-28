import { StrictMode, useRef } from "react";
import { renderToString } from "react-dom/server";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { advancePointerGaze, createPointerGaze, pointerFromRect } from "../components/ui/pointer-gaze";
import { createMotionActivity } from "../components/ui/use-motion-activity";
import { usePointerGaze } from "../components/ui/use-pointer-gaze";

afterEach(() => vi.unstubAllGlobals());

describe("deterministic gaze geometry", () => {
  it("normalizes against each component center and clamps off-component movement", () => {
    const rect = { left: 100, top: 200, width: 200, height: 100 };
    expect(pointerFromRect(200, 250, rect)).toEqual({ x: 0, y: 0 });
    expect(pointerFromRect(250, 225, rect)).toEqual({ x: 0.5, y: -0.5 });
    expect(pointerFromRect(-400, 900, rect)).toEqual({ x: -1, y: 1 });
    expect(pointerFromRect(250, 225, { ...rect, width: 0 })).toEqual({ x: 0, y: 0 });
    expect(pointerFromRect(NaN, 225, rect)).toEqual({ x: 0, y: 0 });
  });

  it("has frame-rate-independent easing toward pointer input", () => {
    const first = createPointerGaze("easing");
    const second = createPointerGaze("easing");
    for (const state of [first, second]) { state.pointer = { x: 1, y: -1 }; state.pointerAt = 0; }
    for (let time = 10; time <= 100; time += 10) advancePointerGaze(first, { time, delta: 10 }, { blink: false });
    for (let time = 20; time <= 100; time += 20) advancePointerGaze(second, { time, delta: 20 }, { blink: false });
    expect(first.look.x).toBeGreaterThan(0);
    expect(first.look.x).toBeLessThan(1);
    expect(first.look.x).toBeCloseTo(second.look.x, 10);
    expect(first.look.y).toBeCloseTo(second.look.y, 10);
  });

  it("starts idle glances only after 3000ms without pointer movement", () => {
    const state = createPointerGaze("idle-deadline");
    state.pointerAt = 0;
    state.pointer = { x: 1, y: 1 };
    const scheduledGlance = state.nextGlance;
    advancePointerGaze(state, { time: 2999, delta: 20 });
    expect(state.nextGlance).toBe(scheduledGlance);
    advancePointerGaze(state, { time: 3000, delta: 1 });
    expect(state.nextGlance).toBeGreaterThan(3000);
    state.pointerAt = 3500;
    const nextGlance = state.nextGlance;
    advancePointerGaze(state, { time: 6400, delta: 20 });
    expect(state.nextGlance).toBe(nextGlance);
  });

  it("repeats seeded blinks and idle glances without ambient randomness", () => {
    const random = vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("Unexpected ambient randomness"); });
    try {
      const first = createPointerGaze("same-seed");
      const second = createPointerGaze("same-seed");
      const other = createPointerGaze("different-seed");
      const glanceSamples: string[] = [];
      const blinks: number[] = [];
      for (let time = 0; time < 15000; time += 16) {
        for (const state of [first, second, other]) advancePointerGaze(state, { time, delta: 16 });
        expect(first).toEqual(second);
        expect(Math.abs(first.look.x)).toBeLessThanOrEqual(1);
        expect(Math.abs(first.look.y)).toBeLessThanOrEqual(1);
        glanceSamples.push(JSON.stringify(first.glance));
        blinks.push(first.blinkScale);
      }
      expect(new Set(glanceSamples).size).toBeGreaterThan(2);
      expect(Math.min(...blinks)).toBeLessThan(0.2);
      expect(first).not.toEqual(other);
    } finally { random.mockRestore(); }
  });

  it("keeps blink disabled while allowing noninteractive idle glances", () => {
    const state = createPointerGaze("noninteractive");
    state.pointerAt = 5000;
    state.pointer = { x: 1, y: 1 };
    advancePointerGaze(state, { time: 5000, delta: 50 }, { interactive: false, blink: false });
    expect(state.blinkScale).toBe(1);
    expect(state.nextGlance).toBeGreaterThan(5000);
    expect(state.look.x).not.toBe(1);
  });
});

function motionBrowser() {
  let sequence = 0;
  let hidden = false;
  const queue = new Map<number, FrameRequestCallback>();
  const mediaListeners = new Set<() => void>();
  const observers: { callback: IntersectionObserverCallback; target?: Element; disconnected: boolean }[] = [];
  const media = {
    matches: false,
    media: "(prefers-reduced-motion: reduce)",
    onchange: null,
    addEventListener: vi.fn((_type: string, callback: () => void) => mediaListeners.add(callback)),
    removeEventListener: vi.fn((_type: string, callback: () => void) => mediaListeners.delete(callback)),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  };
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => hidden ? "hidden" : "visible");
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { queue.set(++sequence, callback); return sequence; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => queue.delete(id)));
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("PointerEvent", MouseEvent);
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

describe("observed motion scheduling", () => {
  let browser: ReturnType<typeof motionBrowser>;
  beforeEach(() => { browser = motionBrowser(); });

  it("does not request frames before the target is observed on screen", () => {
    const element = document.createElement("div");
    const onFrame = vi.fn();
    const activity = createMotionActivity(element, { onFrame });
    expect(element.dataset.motion).toBe("paused");
    expect(browser.queue.size).toBe(0);
    browser.intersection(true);
    expect(element.dataset.motion).toBe("running");
    expect(browser.queue.size).toBe(1);
    browser.frame(1000);
    browser.frame(1016);
    expect(onFrame).toHaveBeenLastCalledWith({ time: 16, delta: 16 });
    expect(element.style.getPropertyValue("--motion-clock")).toBe("0.016");
    activity.destroy();
  });

  it("cancels immediately offscreen and when hidden, preserving clock with no resume catchup", () => {
    const element = document.createElement("div");
    const frames: number[] = [];
    const activity = createMotionActivity(element, { onFrame: ({ time }) => frames.push(time) });
    browser.intersection(true); browser.frame(1000); browser.frame(1016);
    browser.intersection(false);
    expect(browser.queue.size).toBe(0);
    expect(element.dataset.motion).toBe("paused");
    browser.frame(50_000);
    expect(frames).toEqual([0, 16]);
    browser.intersection(true); browser.frame(100_000); browser.frame(100_016);
    expect(frames).toEqual([0, 16, 16, 32]);
    browser.visibility(false);
    expect(browser.queue.size).toBe(0);
    browser.visibility(true); browser.frame(200_000);
    expect(frames.at(-1)).toBe(32);
    activity.destroy();
  });

  it("cancels on reduced motion and resumes with a bounded frame after a main-thread stall", () => {
    const element = document.createElement("div");
    const onFrame = vi.fn();
    const activity = createMotionActivity(element, { onFrame });
    browser.intersection(true); browser.frame(0); browser.frame(1000);
    expect(onFrame).toHaveBeenLastCalledWith({ time: 50, delta: 50 });
    browser.reduce(true);
    expect(browser.queue.size).toBe(0);
    expect(element.dataset.motion).toBe("reduced");
    browser.reduce(false); browser.frame(5000);
    expect(onFrame).toHaveBeenLastCalledWith({ time: 50, delta: 0 });
    activity.destroy();
  });

  it("restores owned DOM state and removes every observer, listener, and queued frame", () => {
    const element = document.createElement("div");
    element.setAttribute("data-motion", "custom");
    element.style.setProperty("--motion-clock", "4", "important");
    const previousPriority = element.style.getPropertyPriority("--motion-clock");
    const onFrame = vi.fn();
    const activity = createMotionActivity(element, { onFrame });
    browser.intersection(true);
    activity.destroy(); activity.destroy();
    expect(browser.queue.size).toBe(0);
    expect(browser.mediaListeners.size).toBe(0);
    expect(browser.observers.every((observer) => observer.disconnected)).toBe(true);
    expect(element.getAttribute("data-motion")).toBe("custom");
    expect(element.style.getPropertyValue("--motion-clock")).toBe("4");
    expect(element.style.getPropertyPriority("--motion-clock")).toBe(previousPriority);
    browser.intersection(true); browser.visibility(false); browser.visibility(true); browser.reduce(true); browser.frame(100);
    expect(onFrame).not.toHaveBeenCalled();
    expect(browser.queue.size).toBe(0);
  });
});

function Gaze({ interactive = true, blink = true, onRender }: { interactive?: boolean; blink?: boolean; onRender?: () => void }) {
  const ref = useRef<SVGSVGElement>(null);
  usePointerGaze(ref, { seed: "component", interactive, blink });
  onRender?.();
  return <svg ref={ref} role="img" aria-label="Gaze test" />;
}

describe("pointer gaze React hook", () => {
  let browser: ReturnType<typeof motionBrowser>;
  beforeEach(() => { browser = motionBrowser(); });

  it("updates CSS variables from window pointer movement without rendering React again", () => {
    const onRender = vi.fn();
    const view = render(<Gaze onRender={onRender} />);
    const svg = screen.getByRole("img");
    vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({ left: 100, top: 100, width: 100, height: 100 } as DOMRect);
    const renders = onRender.mock.calls.length;
    act(() => { browser.intersection(true); browser.frame(0); });
    fireEvent.pointerMove(window, { clientX: 300, clientY: 0 });
    act(() => browser.frame(16));
    expect(Number(svg.style.getPropertyValue("--gaze-x"))).toBeGreaterThan(0);
    expect(Number(svg.style.getPropertyValue("--gaze-y"))).toBeLessThan(0);
    expect(onRender).toHaveBeenCalledTimes(renders);
    view.unmount();
  });

  it("settles under reduced motion and never schedules a pointer wake while reduced or hidden", () => {
    render(<Gaze />);
    const svg = screen.getByRole("img");
    act(() => { browser.intersection(true); browser.frame(0); browser.reduce(true); });
    fireEvent.pointerMove(window, { clientX: 300, clientY: 0 });
    expect(svg).toHaveAttribute("data-motion", "reduced");
    expect(svg.style.getPropertyValue("--gaze-x")).toBe("0");
    expect(svg.style.getPropertyValue("--blink-scale")).toBe("1");
    expect(browser.queue.size).toBe(0);
    act(() => { browser.visibility(false); browser.reduce(false); });
    fireEvent.pointerMove(window, { clientX: 300, clientY: 0 });
    expect(browser.queue.size).toBe(0);
  });

  it("cleans up a Strict Mode replay and reacts to option updates without duplicate loops", () => {
    const add = vi.spyOn(window, "addEventListener");
    const remove = vi.spyOn(window, "removeEventListener");
    const view = render(<StrictMode><Gaze /></StrictMode>);
    act(() => { browser.intersection(true); browser.frame(0); });
    expect(browser.queue.size).toBe(1);
    expect(browser.observers.filter((observer) => !observer.disconnected)).toHaveLength(1);
    view.rerender(<StrictMode><Gaze interactive={false} blink={false} /></StrictMode>);
    expect(browser.queue.size).toBe(1);
    expect(screen.getByRole("img").style.getPropertyValue("--blink-scale")).toBe("1");
    view.unmount();
    expect(browser.queue.size).toBe(0);
    expect(browser.mediaListeners.size).toBe(0);
    expect(browser.observers.every((observer) => observer.disconnected)).toBe(true);
    expect(add.mock.calls.filter(([name]) => name === "pointermove")).toHaveLength(remove.mock.calls.filter(([name]) => name === "pointermove").length);
  });

  it("renders server markup without accessing window or document", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    expect(renderToString(<Gaze />)).toContain('aria-label="Gaze test"');
  });
});
