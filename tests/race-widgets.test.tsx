import { StrictMode } from "react";
import { act, cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_VALUES } from "@/components/ui/appearance";
import { RaceStartLights } from "../components/ui/race-start-lights";
import { RaceProgress } from "../components/ui/race-progress";
import { raceStartInterval, raceStartSnapshot } from "../components/ui/race-start-sequence";

function browserMotion() {
  let hidden = false;
  const listeners = new Set<() => void>();
  const observers: { callback: IntersectionObserverCallback; target?: Element; active: boolean }[] = [];
  const media = { matches: false, addEventListener: (_: string, callback: () => void) => listeners.add(callback), removeEventListener: (_: string, callback: () => void) => listeners.delete(callback) };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("requestAnimationFrame", vi.fn());
  vi.stubGlobal("IntersectionObserver", class {
    record: typeof observers[number];
    constructor(callback: IntersectionObserverCallback) { this.record = { callback, active: true }; observers.push(this.record); }
    observe(target: Element) { this.record.target = target; }
    disconnect() { this.record.active = false; }
  });
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => hidden ? "hidden" : "visible");
  return {
    observers, listeners,
    visible(value: boolean) { observers.filter((observer) => observer.active).forEach((observer) => observer.callback([{ isIntersecting: value, target: observer.target } as IntersectionObserverEntry], {} as IntersectionObserver)); },
    visibility(value: boolean) { hidden = !value; document.dispatchEvent(new Event("visibilitychange")); },
    reduce(value: boolean) { media.matches = value; listeners.forEach((listener) => listener()); },
  };
}

afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("discrete race-start timing", () => {
  it("defines all five light boundaries and extinguishes them together after the hold", () => {
    expect(raceStartSnapshot(0, false)).toEqual({ phase: "idle", lit: 0, message: "Ready to start" });
    for (let index = 0; index < 5; index += 1) {
      expect(raceStartSnapshot(index * 800).lit).toBe(index + 1);
      expect(raceStartSnapshot((index + 1) * 800 - 1).lit).toBe(index + 1);
    }
    expect(raceStartSnapshot(3200).phase).toBe("ready");
    expect(raceStartSnapshot(4000)).toEqual({ phase: "go", lit: 0, message: "Go" });
    expect(raceStartSnapshot(100000).phase).toBe("go");
  });

  it("bounds invalid timing values and keeps elapsed-time inputs finite", () => {
    expect(raceStartInterval(NaN)).toBe(800);
    expect(raceStartInterval(-3)).toBe(100);
    expect(raceStartInterval(30000)).toBe(10000);
    for (const elapsed of [NaN, -5, Infinity]) expect(raceStartSnapshot(elapsed).lit).toBe(1);
    expect(raceStartSnapshot(500, true, 0).phase).toBe("go");
  });
});

describe("RaceStartLights lifecycle", () => {
  let browser: ReturnType<typeof browserMotion>;
  beforeEach(() => { vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] }); browser = browserMotion(); });

  it("waits for visibility, advances every light, and completes once without animation frames", () => {
    const complete = vi.fn();
    const { container } = render(<RaceStartLights running intervalMs={500} onComplete={complete} />);
    const lit = () => container.querySelectorAll('[data-lit="true"]').length;
    expect(screen.getByRole("group", { name: "Race start" })).toHaveAttribute("data-motion", "paused");
    expect(lit()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    act(() => browser.visible(true));
    for (let count = 2; count <= 5; count += 1) {
      act(() => vi.advanceTimersByTime(500));
      expect(lit()).toBe(count);
    }
    expect(screen.getByRole("status")).toHaveTextContent("All five lights on");
    expect(complete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(500));
    expect(lit()).toBe(0);
    expect(screen.getByRole("status")).toHaveTextContent("Go");
    expect(complete).toHaveBeenCalledTimes(1);
    act(() => vi.advanceTimersByTime(100000));
    expect(complete).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("excludes offscreen and hidden time while retaining the partially elapsed interval", () => {
    const complete = vi.fn();
    const { container } = render(<RaceStartLights running intervalMs={500} onComplete={complete} />);
    const lit = () => container.querySelectorAll('[data-lit="true"]').length;
    act(() => { browser.visible(true); vi.advanceTimersByTime(200); browser.visible(false); vi.advanceTimersByTime(60000); });
    expect(lit()).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
    act(() => { browser.visible(true); vi.advanceTimersByTime(299); });
    expect(lit()).toBe(1);
    act(() => vi.advanceTimersByTime(1));
    expect(lit()).toBe(2);
    act(() => { vi.advanceTimersByTime(150); browser.visibility(false); vi.advanceTimersByTime(90000); });
    expect(lit()).toBe(2);
    expect(vi.getTimerCount()).toBe(0);
    act(() => { browser.visibility(true); vi.advanceTimersByTime(349); });
    expect(lit()).toBe(2);
    act(() => vi.advanceTimersByTime(1));
    expect(lit()).toBe(3);
    expect(complete).not.toHaveBeenCalled();
  });

  it("continues meaningful discrete status under reduced motion and still pauses while hidden", () => {
    browser.reduce(true);
    const complete = vi.fn();
    const { container } = render(<RaceStartLights running intervalMs={100} onComplete={complete} />);
    const host = screen.getByRole("group");
    expect(host).toHaveAttribute("data-motion", "reduced");
    act(() => { browser.visible(true); vi.advanceTimersByTime(100); });
    expect(container.querySelectorAll('[data-lit="true"]')).toHaveLength(2);
    act(() => { browser.visibility(false); vi.advanceTimersByTime(10000); });
    expect(complete).not.toHaveBeenCalled();
    act(() => { browser.visibility(true); vi.advanceTimersByTime(400); });
    expect(screen.getByRole("status")).toHaveTextContent("Go");
    expect(complete).toHaveBeenCalledTimes(1);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("restarts with a new sequence key and uses the latest completion callback without restarting timing", () => {
    const first = vi.fn(), latest = vi.fn();
    const view = render(<RaceStartLights running intervalMs={100} sequenceKey={1} onComplete={first} />);
    act(() => { browser.visible(true); vi.advanceTimersByTime(250); });
    view.rerender(<RaceStartLights running intervalMs={100} sequenceKey={1} onComplete={latest} />);
    act(() => vi.advanceTimersByTime(250));
    expect(latest).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    view.rerender(<RaceStartLights running intervalMs={100} sequenceKey={2} onComplete={latest} />);
    expect(screen.getByRole("status")).toHaveTextContent("1 of 5");
    act(() => { browser.visible(true); vi.advanceTimersByTime(500); });
    expect(latest).toHaveBeenCalledTimes(2);
    view.rerender(<RaceStartLights running={false} intervalMs={100} sequenceKey={2} onComplete={latest} />);
    expect(screen.getByRole("status")).toHaveTextContent("Ready to start");
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels an unfinished sequence when stopped and releases StrictMode observers and timers", () => {
    const complete = vi.fn();
    const view = render(<StrictMode><RaceStartLights running intervalMs={200} onComplete={complete} /></StrictMode>);
    act(() => { browser.visible(true); vi.advanceTimersByTime(250); });
    expect(vi.getTimerCount()).toBe(1);
    view.rerender(<StrictMode><RaceStartLights running={false} intervalMs={200} onComplete={complete} /></StrictMode>);
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(10000));
    expect(complete).not.toHaveBeenCalled();
    view.unmount();
    expect(browser.listeners.size).toBe(0);
    expect(browser.observers.every((observer) => !observer.active)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("RaceProgress contract", () => {
  beforeEach(() => { browserMotion(); });

  it("exposes the familiar value/max contract with named determinate progress", () => {
    const view = render(<RaceProgress label="Workshop build" value={16} max={32} />);
    const bar = screen.getByRole("progressbar", { name: "Workshop build" });
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "32");
    expect(bar).toHaveAttribute("aria-valuenow", "16");
    expect(bar).toHaveAttribute("aria-valuetext", "50% complete");
    expect(screen.getByText("50%")).toBeVisible();
    expect(view.container.firstElementChild).toHaveStyle({ "--race-progress": "0.5", "--race-percent": "50%" });
    view.rerender(<RaceProgress label="Workshop build" value={32} max={32} showValue={false} vehicle="bike" />);
    expect(bar).toHaveAttribute("aria-valuenow", "32");
    expect(screen.queryByText("100%")).toBeNull();
    expect(view.container.querySelector('[data-vehicle="bike"] svg')).not.toBeNull();
  });

  it("bounds endpoints and invalid inputs without producing an indeterminate or invalid position", () => {
    const view = render(<RaceProgress label="Delivery" value={-1} />);
    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    view.rerender(<RaceProgress label="Delivery" value={200} />);
    expect(bar).toHaveAttribute("aria-valuenow", "100");
    expect(view.container.firstElementChild).toHaveStyle({ "--race-progress": "1" });
    view.rerender(<RaceProgress label="Delivery" value={NaN} max={0} />);
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar).toHaveAttribute("aria-valuenow", "0");
    expect(view.container.innerHTML).not.toMatch(/NaN|Infinity/);
  });

  it("accepts livery colors and a custom decorative vehicle while sanitizing paint values", () => {
    const custom = vi.fn(({ progress }: { progress: number }) => <svg data-custom-progress={progress} viewBox="0 0 20 10"><path d="M0 10L20 0V10Z" /></svg>);
    const view = render(<RaceProgress label="Progress" value={75} vehicle="bike" colors={{ base: " #AbC ", accent: "url(https://invalid.test)" }} appearance="retro-os" renderVehicle={custom} />);
    expect(custom).toHaveBeenCalledWith({ vehicle: "bike", progress: 0.75, appearance: "retro-os" });
    expect(view.container.querySelector('[data-custom-progress="0.75"]')).not.toBeNull();
    expect(view.container.firstElementChild).toHaveStyle({ "--race-base": "#abc", "--race-accent": "#f4cf83" });
    expect(view.container.innerHTML).not.toContain("invalid.test");
  });

  it.each(APPEARANCE_VALUES)("renders both widgets and both vehicles with scoped %s appearance", (appearance) => {
    const { container } = render(<><RaceStartLights appearance={appearance} /><RaceProgress label="Car progress" value={40} appearance={appearance} /><RaceProgress label="Bike progress" value={80} appearance={appearance} vehicle="bike" /></>);
    expect(container.querySelectorAll(`[data-appearance="${appearance}"]`)).toHaveLength(3);
    expect(screen.getAllByRole("progressbar")).toHaveLength(2);
    expect(container.querySelectorAll(".race-progress-icon")).toHaveLength(2);
    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("server-renders a settled sequence and exact progress without browser globals", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const markup = renderToStaticMarkup(<><RaceStartLights running /><RaceProgress label="Upload" value={55} vehicle="bike" /></>);
    expect(markup).toContain('data-motion="paused"');
    expect(markup).toContain('data-phase="countdown"');
    expect(markup).toContain('aria-valuenow="55"');
    expect(markup).toContain('aria-valuetext="55% complete"');
    expect(markup).not.toMatch(/NaN|Infinity/);
    vi.unstubAllGlobals();
  });
});
