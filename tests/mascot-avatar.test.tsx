import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import axe from "axe-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MascotAvatar } from "../components/ui/mascot-avatar";
import { generateMascotConfig, mascotSvgBody, mascotToSvgString, normalizeMascotConfig, MASCOT_OPTIONS, MASCOT_PALETTES } from "../components/ui/mascot-art";
import { APPEARANCE_VALUES } from "../components/ui/appearance";

afterEach(() => vi.unstubAllGlobals());

function parseSvg(svg: string) {
  const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(parsed.querySelector("parsererror")).toBeNull();
  return parsed;
}

describe("portable mascot identity and artwork", () => {
  it("keeps all eight identities stable across seeds and saved JSON", () => {
    const kinds = new Set<string>();
    const random = vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("Ambient randomness must not select an identity"); });
    try {
      for (let index = 0; index < 1000; index++) {
        const seed = `mascot-${index}`;
        const first = generateMascotConfig(seed);
        expect(generateMascotConfig(seed)).toEqual(first);
        expect(normalizeMascotConfig(JSON.parse(JSON.stringify(first)))).toEqual(first);
        kinds.add(first.mascot);
      }
      expect(kinds.size).toBe(8);
      expect(generateMascotConfig(23)).toEqual(generateMascotConfig("23"));
    } finally { random.mockRestore(); }
  });

  it("copies accepted colors and discards unsupported saved markup and options", () => {
    const original = generateMascotConfig("saved-colors");
    const colors = { ...original.colors, body: " #AbC ", accent: "url(https://example.invalid/paint)" };
    const normalized = normalizeMascotConfig({ ...original, colors, extra: "<script>" });
    expect(normalized.colors.body).toBe("#aabbcc");
    expect(normalized.colors.accent).toBe(generateMascotConfig().colors.accent);
    expect(colors.body).toBe(" #AbC ");
    expect(normalized.colors).not.toBe(colors);
    expect(normalized).not.toHaveProperty("extra");
    for (const invalid of [null, [], false, "hello", { version: 2 }]) expect(normalizeMascotConfig(invalid)).toEqual(generateMascotConfig());
    expect(mascotToSvgString(normalized)).not.toMatch(/url\(https|<script/);
  });

  it("exports every original silhouette and AI expression with local definitions and settled colors", () => {
    const silhouettes = new Set<string>();
    for (const [index, option] of MASCOT_OPTIONS.entries()) {
      const config = { ...generateMascotConfig("svg"), mascot: option.value, colors: { ...MASCOT_PALETTES[index].colors } };
      silhouettes.add(mascotSvgBody(config, "same"));
      for (const appearance of APPEARANCE_VALUES) for (const state of ["idle", "thinking", "talking", "error"] as const) {
        const svg = mascotToSvgString(config, 256, { appearance, state });
        const parsed = parseSvg(svg);
        expect(parsed.documentElement.getAttribute("width")).toBe("256");
        expect(parsed.documentElement.getAttribute("viewBox")).toBe("0 0 160 160");
        expect(parsed.querySelectorAll("script,image,foreignObject,animate,animateTransform")).toHaveLength(0);
        expect(svg).not.toContain("var(--");
        expect(parsed.querySelectorAll(".mascot-pupil")).toHaveLength(2);
        expect(parsed.querySelectorAll("clipPath ellipse")).toHaveLength(2);
        expect(parsed.querySelectorAll(".mascot-ear,.mascot-tail").length).toBeGreaterThan(0);
        const ids = [...parsed.querySelectorAll("[id]")].map((element) => element.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const reference of svg.matchAll(/url\(#([^)]*)\)/g)) expect(ids).toContain(reference[1]);
        if (state === "talking") expect(parsed.querySelector(".mascot-talking-mouth")).not.toBeNull();
        if (state === "thinking") expect(parsed.querySelectorAll(".mascot-thinking-dots circle")).toHaveLength(3);
      }
    }
    expect(silhouettes.size).toBe(8);
  });

  it("namespaces repeated inline images without leaking arbitrary ID markup", () => {
    const config = generateMascotConfig("same");
    const ids: string[] = [];
    for (const id of [":r0:", ":r1:", "_3a_r0_3a_", '\"><script>alert(1)</script>']) {
      const svg = mascotToSvgString(config, 128, { id });
      const parsed = parseSvg(svg);
      expect(parsed.querySelector("script")).toBeNull();
      ids.push(...[...parsed.querySelectorAll("[id]")].map((element) => element.id));
    }
    expect(new Set(ids).size).toBe(ids.length);
  });
});

function browserMotion() {
  let nextId = 0;
  let hidden = false;
  const frames = new Map<number, FrameRequestCallback>();
  const listeners = new Set<() => void>();
  const observers: { callback: IntersectionObserverCallback; target?: Element; active: boolean }[] = [];
  const media = { matches: false, addEventListener: (_: string, callback: () => void) => listeners.add(callback), removeEventListener: (_: string, callback: () => void) => listeners.delete(callback) };
  vi.stubGlobal("matchMedia", vi.fn(() => media));
  vi.stubGlobal("PointerEvent", MouseEvent);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { frames.set(++nextId, callback); return nextId; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => frames.delete(id));
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => hidden ? "hidden" : "visible");
  vi.stubGlobal("IntersectionObserver", class {
    item: typeof observers[number];
    constructor(callback: IntersectionObserverCallback) { this.item = { callback, active: true }; observers.push(this.item); }
    observe(target: Element) { this.item.target = target; }
    disconnect() { this.item.active = false; }
  });
  return {
    frames, observers, listeners,
    frame(time: number) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach((callback) => callback(time)); },
    visible(value: boolean) { observers.filter((item) => item.active).forEach((item) => item.callback([{ isIntersecting: value, target: item.target } as IntersectionObserverEntry], {} as IntersectionObserver)); },
    hidden(value: boolean) { hidden = value; document.dispatchEvent(new Event("visibilitychange")); },
    reduced(value: boolean) { media.matches = value; listeners.forEach((callback) => callback()); },
  };
}

describe("MascotAvatar interactions", () => {
  let browser: ReturnType<typeof browserMotion>;
  beforeEach(() => { browser = browserMotion(); });

  it("supports keyboard hello reactions without losing focus", async () => {
    const user = userEvent.setup();
    render(<MascotAvatar mascot="dune-hopper" />);
    const button = screen.getByRole("button", { name: "Dune hopper, idle" });
    await user.tab();
    expect(button).toHaveFocus();
    await user.keyboard(" ");
    expect(screen.getByRole("status")).toHaveTextContent("Dune hopper says hello.");
    expect(button.querySelector(".mascot-reacted")).not.toBeNull();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("status")).toHaveTextContent("Dune hopper noticed you.");
    expect(button).toHaveFocus();
  });

  it("keeps saved identity precedence, supports explicit overrides, and labels AI state changes", () => {
    const config = generateMascotConfig("persisted");
    const { container, rerender } = render(<MascotAvatar seed="ignored" config={config} mascot="moss-snail" colors={{ body: "#ABC" }} state="thinking" size={64} />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Moss snail, thinking");
    expect(container.querySelector("svg")?.getAttribute("width")).toBe("64");
    expect(container.querySelector("svg")?.innerHTML).toContain("#aabbcc");
    expect(container.querySelector(".mascot-thinking-dots")).not.toBeNull();
    rerender(<MascotAvatar config={config} mascot="moss-snail" state="talking" />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Moss snail, talking");
    expect(container.querySelector(".mascot-talking-mouth")).not.toBeNull();
    rerender(<MascotAvatar config={config} mascot="moss-snail" state="error" />);
    expect(screen.getByRole("button")).toHaveAccessibleName("Moss snail, error");
    expect(container.querySelector("[data-state=error]")).not.toBeNull();
  });

  it("renders a passive named image without adding an extra button or focus stop", async () => {
    const { container } = render(<MascotAvatar mascot="ribbon-ray" interactive={false} aria-label="Research companion" />);
    expect(screen.getByRole("img", { name: "Research companion" })).toBeVisible();
    expect(screen.queryByRole("button")).toBeNull();
    expect(container.querySelector("[tabindex]")).toBeNull();
    expect((await axe.run(container, { rules: { "color-contrast": { enabled: false } } })).violations).toEqual([]);
  });

  it("connects pointer gaze to the SVG host and pauses immediately offscreen, hidden, or reduced", () => {
    const { container, unmount } = render(<StrictMode><MascotAvatar mascot="burrow-bud" blink={false} /></StrictMode>);
    const host = container.querySelector<HTMLElement>(".mascot-avatar")!;
    vi.spyOn(host, "getBoundingClientRect").mockReturnValue({ x: 100, y: 100, left: 100, top: 100, right: 300, bottom: 300, width: 200, height: 200, toJSON: () => ({}) });
    expect(host.dataset.motion).toBe("paused");
    expect(browser.frames.size).toBe(0);
    act(() => { browser.visible(true); browser.frame(100); fireEvent.pointerMove(window, { clientX: 500, clientY: -100 }); });
    act(() => { for (let time = 116; time < 600; time += 16) browser.frame(time); });
    expect(Number(host.style.getPropertyValue("--gaze-x"))).toBeGreaterThan(.9);
    expect(Number(host.style.getPropertyValue("--gaze-y"))).toBeLessThan(-.9);
    expect(Number(host.style.getPropertyValue("--blink-scale"))).toBe(1);
    const clock = host.style.getPropertyValue("--motion-clock");
    act(() => { browser.visible(false); browser.frame(90_000); });
    expect(host.dataset.motion).toBe("paused");
    expect(browser.frames.size).toBe(0);
    expect(host.style.getPropertyValue("--motion-clock")).toBe(clock);
    act(() => { browser.visible(true); browser.frame(100_000); browser.hidden(true); });
    expect(host.dataset.motion).toBe("paused");
    expect(browser.frames.size).toBe(0);
    act(() => { browser.hidden(false); browser.reduced(true); });
    expect(host.dataset.motion).toBe("reduced");
    expect(host.style.getPropertyValue("--gaze-x")).toBe("0");
    expect(host.style.getPropertyValue("--gaze-y")).toBe("0");
    expect(browser.frames.size).toBe(0);
    unmount();
    expect(browser.listeners.size).toBe(0);
    expect(browser.observers.every((item) => !item.active)).toBe(true);
  });

  it("server-renders and hydrates repeated instances without changing the SVG or its IDs", async () => {
    const tree = <><MascotAvatar seed="hydrated" /><MascotAvatar seed="hydrated" interactive={false} /></>;
    const host = document.createElement("div");
    host.innerHTML = renderToString(tree);
    document.body.append(host);
    const before = [...host.querySelectorAll("svg")].map((svg) => svg.outerHTML);
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    await act(async () => { root = hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) }); });
    expect(errors).toEqual([]);
    expect([...host.querySelectorAll("svg")].map((svg) => svg.outerHTML)).toEqual(before);
    const ids = [...host.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    await act(async () => root?.unmount());
    host.remove();
  });
});
