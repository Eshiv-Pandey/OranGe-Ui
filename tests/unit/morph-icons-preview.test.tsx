import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MorphIconsDemo } from "../../components/library/morph-icons-demo";
import type { MorphIconName } from "../../components/ui/morphing-icons";

type ObserverRecord = { callback: IntersectionObserverCallback; elements: Set<Element>; disconnected: boolean };
let observers: ObserverRecord[];
let reduced: boolean;
let mediaListeners: Set<() => void>;
let keyboardFocus: Element | null;
let hidden: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
  observers = []; reduced = false; mediaListeners = new Set(); keyboardFocus = null;
  hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal("matchMedia", vi.fn((query: string) => ({
    get matches() { return query === "(prefers-reduced-motion: reduce)" && reduced; },
    media: query,
    addEventListener: (_type: string, listener: () => void) => mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => mediaListeners.delete(listener),
  })));
  vi.stubGlobal("IntersectionObserver", class {
    record: ObserverRecord;
    constructor(callback: IntersectionObserverCallback) {
      this.record = { callback, elements: new Set(), disconnected: false }; observers.push(this.record);
    }
    observe(element: Element) { this.record.elements.add(element); }
    unobserve(element: Element) { this.record.elements.delete(element); }
    disconnect() { this.record.disconnected = true; this.record.elements.clear(); }
  });
  vi.stubGlobal("requestAnimationFrame", vi.fn(() => 1));
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  vi.stubGlobal("PointerEvent", class extends MouseEvent {
    pointerId: number; pointerType: string;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init); this.pointerId = init.pointerId ?? 1; this.pointerType = init.pointerType ?? "mouse";
    }
  });
  const nativeMatches = Element.prototype.matches;
  vi.spyOn(Element.prototype, "matches").mockImplementation(function (this: Element, selector: string) {
    return selector === ":focus-visible" ? keyboardFocus === this : nativeMatches.call(this, selector);
  });
});

afterEach(() => { cleanup(); vi.clearAllTimers(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function emitVisibility(element: Element, isIntersecting: boolean) {
  act(() => {
    observers.filter(observer => !observer.disconnected && observer.elements.has(element)).forEach(observer => {
      observer.callback([{ target: element, isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
  });
}
function reveal(container: HTMLElement) {
  act(() => {
    observers.filter(observer => !observer.disconnected).forEach(observer => {
      const entries = [...observer.elements].map(target => ({ target, isIntersecting: true } as IntersectionObserverEntry));
      if (entries.length) observer.callback(entries, {} as IntersectionObserver);
    });
  });
  return gallery(container);
}
function gallery(container: HTMLElement) {
  const element = container.querySelector<HTMLElement>("[data-morph-gallery]");
  if (!element) throw new Error("Missing morph gallery");
  return element;
}
function tile(container: HTMLElement, name: MorphIconName) {
  const button = container.querySelector<HTMLButtonElement>(`[data-preview-name="${name}"]`);
  if (!button) throw new Error(`Missing preview: ${name}`);
  return button;
}
function active(container: HTMLElement, name: MorphIconName) {
  return tile(container, name).querySelector("svg")?.getAttribute("data-state") === "active";
}
function advance(milliseconds: number) { act(() => vi.advanceTimersByTime(milliseconds)); }
function setHidden(value: boolean) {
  act(() => { hidden.mockReturnValue(value); document.dispatchEvent(new Event("visibilitychange")); });
}
function setReduced(value: boolean) {
  act(() => { reduced = value; for (const listener of mediaListeners) listener(); });
}

describe("morph icon showcase playback", () => {
  it("starts only when the gallery is visible and staggers automatic advances across four groups", () => {
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    expect(gallery(container)).toHaveAttribute("data-running", "false");
    expect(vi.getTimerCount()).toBe(0);
    reveal(container);
    expect(gallery(container)).toHaveAttribute("data-running", "true");
    expect(vi.getTimerCount()).toBe(1);
    advance(699);
    expect(active(container, "menu")).toBe(false);
    advance(1);
    expect(active(container, "menu")).toBe(true);
    expect(active(container, "chevron")).toBe(false);
    expect(active(container, "arrow")).toBe(false);
    expect(active(container, "fullscreen")).toBe(false);
    advance(700);
    expect(active(container, "menu")).toBe(true);
    expect(active(container, "chevron")).toBe(true);
    expect(active(container, "arrow")).toBe(false);
    advance(700);
    expect(active(container, "arrow")).toBe(true);
    expect(active(container, "fullscreen")).toBe(false);
    advance(700);
    expect(active(container, "fullscreen")).toBe(true);
    expect(container.querySelectorAll('[data-preview-name] svg[data-state="active"]')).toHaveLength(40);
    advance(700);
    expect(active(container, "menu")).toBe(false);
    expect(active(container, "chevron")).toBe(true);
    expect(vi.getTimerCount()).toBe(1);
  });

  it("holds a hovered preview, switches it only on click, and resumes after pointer leave", () => {
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    reveal(container);
    const menu = tile(container, "menu");
    fireEvent.pointerOver(menu, { pointerType: "mouse" });
    advance(5600);
    expect(active(container, "menu")).toBe(false);
    fireEvent.click(menu);
    expect(active(container, "menu")).toBe(true);
    advance(2800);
    expect(active(container, "menu")).toBe(true);
    fireEvent.pointerOut(menu, { pointerType: "mouse", relatedTarget: document.body });
    advance(2800);
    expect(active(container, "menu")).toBe(false);
  });

  it("holds keyboard focus, supports Enter activation, and resumes after blur", async () => {
    const user = userEvent.setup({ delay: null });
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    reveal(container);
    const menu = tile(container, "menu");
    keyboardFocus = menu;
    act(() => menu.focus());
    advance(5600);
    expect(active(container, "menu")).toBe(false);
    await act(async () => { const input = user.keyboard("{Enter}"); await vi.advanceTimersByTimeAsync(0); await input; });
    expect(active(container, "menu")).toBe(true);
    advance(2800);
    expect(active(container, "menu")).toBe(true);
    keyboardFocus = null;
    act(() => menu.blur());
    advance(2800);
    expect(active(container, "menu")).toBe(false);
  });

  it("keeps a touched preview manually controlled until Resume releases it", () => {
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    reveal(container);
    const menu = tile(container, "menu");
    fireEvent.pointerOver(menu, { pointerType: "touch" });
    fireEvent.pointerDown(menu, { pointerType: "touch" });
    fireEvent.click(menu);
    expect(active(container, "menu")).toBe(true);
    expect(screen.getByRole("button", { name: "Resume previews" })).toBeEnabled();
    advance(5600);
    expect(active(container, "menu")).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Resume previews" }));
    expect(screen.getByRole("button", { name: "Pause previews" })).toBeEnabled();
    advance(700);
    expect(active(container, "menu")).toBe(false);
  });

  it("pauses every preview globally while manual clicks remain usable, then resumes one interval", () => {
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    reveal(container);
    fireEvent.click(screen.getByRole("button", { name: "Pause previews" }));
    expect(gallery(container)).toHaveAttribute("data-running", "false");
    expect(vi.getTimerCount()).toBe(0);
    fireEvent.click(tile(container, "menu"));
    advance(10000);
    expect(active(container, "menu")).toBe(true);
    expect(active(container, "chevron")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Resume previews" }));
    expect(vi.getTimerCount()).toBe(1);
    advance(700);
    expect(active(container, "menu")).toBe(false);
  });

  it("stops on a hidden document, excludes offscreen icons, and cleans up observers and intervals", () => {
    const { container, unmount } = render(<MorphIconsDemo appearance="polished" />);
    const scene = reveal(container);
    emitVisibility(tile(container, "menu"), false);
    advance(700);
    expect(active(container, "menu")).toBe(false);
    advance(700);
    expect(active(container, "chevron")).toBe(true);
    setHidden(true);
    expect(scene).toHaveAttribute("data-running", "false");
    expect(vi.getTimerCount()).toBe(0);
    advance(10000);
    expect(active(container, "chevron")).toBe(true);
    setHidden(false);
    expect(vi.getTimerCount()).toBe(1);
    emitVisibility(tile(container, "menu"), true);
    advance(700);
    expect(active(container, "menu")).toBe(true);
    emitVisibility(scene, false);
    expect(vi.getTimerCount()).toBe(0);
    emitVisibility(scene, true);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(observers.every(observer => observer.disconnected)).toBe(true);
    expect(mediaListeners.size).toBe(0);
  });

  it("disables automatic playback under reduced motion but preserves manual state selection", () => {
    reduced = true;
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    reveal(container);
    expect(vi.getTimerCount()).toBe(0);
    expect(screen.getByRole("button", { name: "Motion off: reduced motion is on" })).toBeDisabled();
    expect(screen.getByText("Motion off")).toBeInTheDocument();
    fireEvent.click(tile(container, "menu"));
    expect(active(container, "menu")).toBe(true);
    advance(10000);
    expect(active(container, "menu")).toBe(true);
    setReduced(false);
    expect(screen.getByRole("button", { name: "Pause previews" })).toBeEnabled();
    expect(vi.getTimerCount()).toBe(1);
    advance(700);
    expect(active(container, "menu")).toBe(false);
    setReduced(true);
    expect(vi.getTimerCount()).toBe(0);
    expect(gallery(container)).toHaveAttribute("data-running", "false");
  });

  it("cycles the six thumbnail icons without mounting the full editing interface", () => {
    const { container, unmount } = render(<MorphIconsDemo appearance="polished" thumbnail />);
    expect(container.querySelectorAll("[data-preview-name]")).toHaveLength(6);
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(screen.queryByRole("button", { name: "Pause previews" })).toBeNull();
    expect(screen.queryByRole("complementary", { name: "Component properties" })).toBeNull();
    reveal(container);
    advance(700);
    expect(active(container, "menu")).toBe(true);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("morph icon search and state controls", () => {
  it("filters by category and state text, resets an empty result, and preserves selected state", () => {
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    reveal(container);
    fireEvent.click(screen.getByRole("button", { name: "Pause previews" }));
    const categories = screen.getByRole("group", { name: "Icon categories" });
    fireEvent.click(within(categories).getByRole("button", { name: "Media" }));
    expect(container.querySelectorAll("[data-preview-name]")).toHaveLength(7);
    expect(within(categories).getByRole("button", { name: "Media" })).toHaveAttribute("aria-pressed", "true");
    const search = screen.getByRole("searchbox", { name: "Search morphing icons" });
    fireEvent.change(search, { target: { value: "captured" } });
    expect(container.querySelectorAll("[data-preview-name]")).toHaveLength(1);
    fireEvent.click(tile(container, "camera"));
    expect(tile(container, "camera")).toHaveAttribute("data-selected", "true");
    expect(within(screen.getByRole("group", { name: "Selected icon state" })).getByRole("button", { name: "Captured" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(search, { target: { value: "zz-no-such-state" } });
    expect(container.querySelectorAll("[data-preview-name]")).toHaveLength(0);
    expect(screen.getByText("No matching icons.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(search).toHaveValue("");
    expect(within(categories).getByRole("button", { name: "All" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll("[data-preview-name]")).toHaveLength(40);
    expect(active(container, "camera")).toBe(true);
    expect(tile(container, "camera")).toHaveAttribute("data-selected", "true");
  });

  it("holds an explicitly selected state and applies the size and stroke controls", () => {
    const { container } = render(<MorphIconsDemo appearance="polished" />);
    reveal(container);
    expect(tile(container, "menu").querySelector("svg")).toHaveAttribute("width", "48");
    expect(screen.getByRole("button", { name: "Switch Menu state" }).querySelector("svg")).toHaveAttribute("width", "80");
    expect(screen.getByRole("slider", { name: "Icon size" })).toHaveAttribute("max", "128");
    expect(tile(container, "menu").querySelector("svg")).toHaveAttribute("stroke-width", "1.75");
    expect(tile(container, "notification").getAttribute("aria-label")).toContain("Alerts");
    const picker = screen.getByRole("group", { name: "Selected icon state" });
    fireEvent.click(within(picker).getByRole("button", { name: "Close" }));
    expect(active(container, "menu")).toBe(true);
    expect(within(picker).getByRole("button", { name: "Close" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Resume previews" })).toBeEnabled();
    advance(5600);
    expect(active(container, "menu")).toBe(true);
    fireEvent.change(screen.getByRole("slider", { name: "Icon size" }), { target: { value: "64" } });
    fireEvent.change(screen.getByRole("slider", { name: "Stroke" }), { target: { value: "3" } });
    const selected = screen.getByRole("button", { name: "Switch Menu state" });
    expect(selected.querySelector("svg")).toHaveAttribute("width", "64");
    expect(selected.querySelector("svg")).toHaveAttribute("stroke-width", "3");
    expect(tile(container, "menu").querySelector("svg")).toHaveAttribute("stroke-width", "3");
    fireEvent.click(screen.getByRole("button", { name: "Resume previews" }));
    advance(700);
    expect(active(container, "menu")).toBe(false);
  });
});
