import { act, cleanup, render, screen } from "@testing-library/react";
import { lazy, Suspense, useEffect, useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewCard } from "../components/library/preview-card";
import { copyCanvasFrame, registerCanvasFrame } from "../components/ui/canvas-frame";

let observers: { node: Element; change: (entries: IntersectionObserverEntry[]) => void }[], reduced: boolean;
const visible = (index: number, value = true) => observers[index].change([{ isIntersecting: value } as IntersectionObserverEntry]);
beforeEach(() => {
  vi.useFakeTimers(); observers = []; reduced = false;
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: reduced, addEventListener() {}, removeEventListener() {} })));
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.stubGlobal("IntersectionObserver", class { constructor(private change: (entries: IntersectionObserverEntry[]) => void) {} observe(node: Element) { observers.push({ node, change: this.change }); } disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => setTimeout(() => callback(performance.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", clearTimeout);
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ x: 0, y: 0, left: 0, top: 0, right: 200, bottom: 160, width: 200, height: 160, toJSON() {} });
  Object.defineProperty(HTMLElement.prototype, "animate", { configurable: true, value: vi.fn(() => ({ cancel() {} })) });
  Object.defineProperty(HTMLElement.prototype, "getAnimations", { configurable: true, value: () => [] });
});
afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("live catalogue previews", () => {
  it("lazy mounts, runs actual component handlers, then releases the live subtree offscreen", async () => {
    const dispose = vi.fn(), enter = vi.fn();
    function Example() { const [on, setOn] = useState(false); useEffect(() => dispose, []); return <button onPointerEnter={enter} onClick={() => setOn(!on)} aria-pressed={on}>Toggle preview</button>; }
    const { container } = render(<PreviewCard label="Example"><Example /></PreviewCard>);
    expect(screen.queryByRole("button")).toBeNull();
    act(() => visible(0));
    await act(async () => vi.advanceTimersByTime(2000));
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
    expect(enter).toHaveBeenCalled();
    act(() => visible(0, false)); await act(async () => vi.advanceTimersByTime(200));
    expect(dispose).toHaveBeenCalledOnce();
    expect(container.querySelector(".preview-still button")).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector(".preview-still")).toHaveAttribute("inert");
  });
  it("limits running previews to six and promotes waiting cards when one leaves", async () => {
    const { container } = render(<>{Array.from({ length: 8 }, (_, i) => <PreviewCard key={i} label={`Preview ${i}`}><button>Example {i}</button></PreviewCard>)}</>);
    act(() => observers.forEach((_, i) => visible(i)));
    await act(async () => vi.advanceTimersByTime(200));
    expect(container.querySelectorAll('[data-playing="true"]')).toHaveLength(6);
    expect(container.querySelectorAll(".demo-preview > .thumbnail-inner")).toHaveLength(6);
    act(() => visible(0, false)); await act(async () => vi.advanceTimersByTime(20));
    expect(observers[6].node).toHaveAttribute("data-playing", "true");
    expect(container.querySelectorAll('[data-playing="true"]')).toHaveLength(6);
  });
  it("holds a static frame for reduced motion and never dispatches clicks", async () => {
    reduced = true; const click = vi.fn();
    const { container } = render(<PreviewCard label="Quiet"><button onClick={click}>Still frame</button></PreviewCard>);
    act(() => visible(0)); await act(async () => vi.advanceTimersByTime(5000));
    expect(click).not.toHaveBeenCalled();
    expect(container.querySelector(".preview-still button")).toHaveTextContent("Still frame");
    expect(container.querySelector(".demo-preview")).toHaveAttribute("data-cursor", "false");
  });
  it("lets autonomous components run without a fake cursor and stops on a hidden tab", async () => {
    const click = vi.fn(); const { container } = render(<PreviewCard label="Flow" autonomous><button onClick={click}>Flowing scene</button></PreviewCard>);
    act(() => visible(0)); await act(async () => vi.advanceTimersByTime(2000));
    expect(click).not.toHaveBeenCalled(); expect(container.querySelector(".demo-preview")).toHaveAttribute("data-playing", "true");
    vi.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => document.dispatchEvent(new Event("visibilitychange"))); await act(async () => vi.advanceTimersByTime(200));
    expect(container.querySelector(".demo-preview")).toHaveAttribute("data-playing", "false");
    expect(container.querySelector(".demo-preview > .thumbnail-inner")).toBeNull();
  });
  it("keeps automated previews from launching page-level popups", async () => {
    const click = vi.fn(); render(<PreviewCard label="Popup"><button aria-haspopup="dialog" onClick={click}>Open dialog</button></PreviewCard>);
    act(() => visible(0)); await act(async () => vi.advanceTimersByTime(2000));
    expect(click).not.toHaveBeenCalled();
  });
  it("waits for lazy content before freezing a reduced-motion frame", async () => {
    reduced = true;
    let resolve!: (module: { default: () => React.JSX.Element }) => void;
    const Loaded = () => <button>Loaded shader controls</button>;
    const Lazy = lazy(() => new Promise<{ default: typeof Loaded }>(done => { resolve = done; }));
    const { container } = render(<PreviewCard label="Lazy"><Suspense fallback={<div data-preview-pending>Preparing preview...</div>}><Lazy /></Suspense></PreviewCard>);
    act(() => visible(0)); await act(async () => vi.advanceTimersByTime(500));
    expect(container.querySelector(".demo-preview > .thumbnail-inner [data-preview-pending]")).not.toBeNull();
    expect(container.querySelector(".preview-still")).toBeEmptyDOMElement();
    await act(async () => resolve({ default: Loaded }));
    await act(async () => vi.advanceTimersByTime(150));
    expect(container.querySelector(".preview-still button")).toHaveTextContent("Loaded shader controls");
    expect(container.querySelector(".preview-still [data-preview-pending]")).toBeNull();
  });
  it("redraws a disposable GPU frame synchronously before copying and releases capture callbacks", () => {
    const source = document.createElement("canvas"), target = document.createElement("canvas"), order: string[] = [];
    const release = registerCanvasFrame(source, () => { source.width = 640; source.height = 360; order.push("draw"); });
    vi.spyOn(target, "getContext").mockReturnValue({ drawImage: (canvas: HTMLCanvasElement) => { expect(canvas).toBe(source); order.push("copy"); } } as unknown as CanvasRenderingContext2D);
    copyCanvasFrame(source, target);
    expect(order).toEqual(["draw", "copy"]); expect([target.width, target.height]).toEqual([640, 360]);
    release(); copyCanvasFrame(source, target); expect(order).toEqual(["draw", "copy", "copy"]);
  });
});
