import { createRef } from "react";
import { renderToString } from "react-dom/server";
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as icons from "../../components/ui/morphing-icons";
import { MORPH_MEDIA_ICONS } from "../../components/ui/morph-icons-media";
import { MORPH_NAVIGATION_ICONS } from "../../components/ui/morph-icons-navigation";
import type { MorphIconName, NamedMorphIconProps } from "../../components/ui/morphing-icons";

const { MorphIcon, getMorphIcon, MORPH_ICONS, morphIconSvg } = icons;
const definitions = [...MORPH_NAVIGATION_ICONS, ...MORPH_MEDIA_ICONS];
const namedExports = {
  menu: icons.MenuMorphIcon, chevron: icons.ChevronMorphIcon, arrow: icons.ArrowMorphIcon,
  fullscreen: icons.FullscreenMorphIcon, sidebar: icons.SidebarMorphIcon, layout: icons.LayoutMorphIcon,
  sort: icons.SortMorphIcon, filter: icons.FilterMorphIcon, folder: icons.FolderMorphIcon,
  lock: icons.LockMorphIcon, search: icons.SearchMorphIcon, settings: icons.SettingsMorphIcon,
  "sun-moon": icons.ThemeMorphIcon, eye: icons.VisibilityMorphIcon, link: icons.LinkMorphIcon,
  bookmark: icons.BookmarkMorphIcon, pin: icons.PinMorphIcon, calendar: icons.CalendarMorphIcon,
  edit: icons.EditMorphIcon, trash: icons.TrashMorphIcon,
  "play-pause": icons.PlayPauseMorphIcon, volume: icons.VolumeMorphIcon, microphone: icons.MicrophoneMorphIcon,
  camera: icons.CameraMorphIcon, record: icons.RecordMorphIcon, repeat: icons.RepeatMorphIcon,
  shuffle: icons.ShuffleMorphIcon, heart: icons.HeartMorphIcon, star: icons.StarMorphIcon,
  check: icons.CheckMorphIcon, plus: icons.PlusMorphIcon, copy: icons.CopyMorphIcon,
  send: icons.SendMorphIcon, download: icons.DownloadMorphIcon, upload: icons.UploadMorphIcon,
  cloud: icons.CloudMorphIcon, notification: icons.NotificationMorphIcon, mail: icons.MailMorphIcon,
  message: icons.MessageMorphIcon, user: icons.UserMorphIcon,
} satisfies Record<MorphIconName, (props: NamedMorphIconProps) => React.JSX.Element>;

let now: number;
let nextFrame: number;
let reduced: boolean;
let frames: Map<number, FrameRequestCallback>;
let mediaListeners: Set<() => void>;

beforeEach(() => {
  now = 0; nextFrame = 0; reduced = false;
  frames = new Map(); mediaListeners = new Set();
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextFrame; frames.set(id, callback); return id;
  }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => frames.delete(id)));
  vi.stubGlobal("matchMedia", vi.fn(() => ({
    get matches() { return reduced; },
    media: "(prefers-reduced-motion: reduce)",
    addEventListener: (_type: string, listener: () => void) => mediaListeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => mediaListeners.delete(listener),
  })));
});

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function frame(time: number) {
  act(() => {
    now = time;
    const pending = [...frames];
    for (const [id] of pending) frames.delete(id);
    for (const [, callback] of pending) callback(time);
  });
}
function pathState(svg: SVGSVGElement) {
  return [...svg.querySelectorAll("path")].map(path => ({
    d: path.getAttribute("d"), opacity: Number(path.getAttribute("opacity")),
    transform: path.getAttribute("transform"), pathLength: path.getAttribute("pathLength"),
    dasharray: path.getAttribute("stroke-dasharray"), dashoffset: path.getAttribute("stroke-dashoffset"),
  }));
}
function endpoint(name: MorphIconName, active: boolean) {
  const index = active ? 1 : 0;
  return getMorphIcon(name).paths.map(path => ({
    d: active ? path.to : path.from,
    opacity: path.draw?.[index] === 0 ? 0 : (path.opacity || [1, 1])[index],
    transform: path.rotation ? `rotate(${path.rotation[index]} ${(path.origin || [12, 12]).join(" ")})` : null,
    pathLength: path.draw ? "1" : null, dasharray: path.draw ? "1" : null,
    dashoffset: path.draw ? String(1 - path.draw[index]) : null,
  }));
}
function svgElement(container: HTMLElement) {
  const svg = container.querySelector("svg");
  if (!svg) throw new Error("Missing morph SVG");
  return svg;
}
function rotation(svg: SVGSVGElement) {
  return Number(svg.querySelector("path")?.getAttribute("transform")?.match(/^rotate\(([-+\d.]+)/)?.[1]);
}

describe("controlled morph icons", () => {
  it("server-renders all forty generic and named exports in their requested initial state", () => {
    expect(MORPH_ICONS.map(icon => icon.name)).toEqual(definitions.map(icon => icon.name));
    expect(Object.keys(namedExports)).toHaveLength(40);
    const consoleError = vi.spyOn(console, "error");
    for (const definition of definitions) {
      const NamedIcon = namedExports[definition.name];
      for (const active of [false, true]) {
        const markup = renderToString(<MorphIcon name={definition.name} active={active} />);
        const namedMarkup = renderToString(<NamedIcon active={active} />);
        expect(namedMarkup, definition.name).toBe(markup);
        const wrapper = document.createElement("div"); wrapper.innerHTML = markup;
        const svg = svgElement(wrapper);
        expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
        expect(svg).toHaveAttribute("data-morph-icon", definition.name);
        expect(svg).toHaveAttribute("data-state", active ? "active" : "idle");
        expect(pathState(svg), definition.name).toEqual(endpoint(definition.name, active));
        expect(svg.querySelectorAll("script,image,foreignObject")).toHaveLength(0);
      }
    }
    expect(consoleError).not.toHaveBeenCalled();
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("exports a standalone SVG matching both controlled endpoint states for every icon", () => {
    for (const definition of definitions) for (const active of [false, true]) {
      const parsed = new DOMParser().parseFromString(morphIconSvg(definition.name, active, 96, 3), "image/svg+xml");
      expect(parsed.querySelector("parsererror"), definition.name).toBeNull();
      const svg = parsed.documentElement as unknown as SVGSVGElement;
      expect(svg.getAttribute("width")).toBe("96");
      expect(svg.getAttribute("stroke-width")).toBe("3");
      expect(svg.getAttribute("aria-label")).toBe(`${definition.title}: ${definition.states[active ? 1 : 0]}`);
      expect(pathState(svg), definition.name).toEqual(endpoint(definition.name, active));
      expect(svg.querySelectorAll("script,image,foreignObject")).toHaveLength(0);
    }
  });

  it("shares the 1.5 default stroke between React artwork and standalone SVG", () => {
    const { container } = render(<MorphIcon name="menu" />);
    expect(svgElement(container)).toHaveAttribute("stroke-width", "1.5");
    expect(svgElement(container).style.strokeWidth).toBe("1.5");
    const exported = new DOMParser().parseFromString(morphIconSvg("menu"), "image/svg+xml");
    expect(exported.documentElement.getAttribute("stroke-width")).toBe("1.5");
  });

  it("keeps ordinary icons controlled without an activity loop or internal click toggle", () => {
    const { container, rerender } = render(<MorphIcon name="plus" />);
    const svg = svgElement(container);
    expect(frames.size).toBe(0);
    svg.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(svg).toHaveAttribute("data-state", "idle");
    expect(pathState(svg)).toEqual(endpoint("plus", false));
    rerender(<MorphIcon name="plus" active />);
    expect(frames.size).toBe(1);
    expect(pathState(svg)).toEqual(endpoint("plus", false));
    frame(1000);
    expect(pathState(svg)).toEqual(endpoint("plus", true));
    expect(frames.size).toBe(0);
  });

  it("reverses rapid state changes from the painted geometry with one pending frame", () => {
    const { container, rerender } = render(<MorphIcon name="plus" duration={400} />);
    const svg = svgElement(container);
    const paths = [...svg.querySelectorAll("path")];
    rerender(<MorphIcon name="plus" active duration={400} />);
    frame(100);
    const forward = pathState(svg);
    const forwardAngle = rotation(svg);
    expect(forward).not.toEqual(endpoint("plus", false));
    expect(forward).not.toEqual(endpoint("plus", true));
    rerender(<MorphIcon name="plus" duration={400} />);
    expect(pathState(svg)).toEqual(forward);
    expect(frames.size).toBe(1);
    frame(100);
    expect(pathState(svg)).toEqual(forward);
    frame(125);
    const reverse = pathState(svg);
    expect(rotation(svg)).toBeLessThan(forwardAngle);
    expect(rotation(svg)).toBeGreaterThan(0);
    rerender(<MorphIcon name="plus" active duration={400} />);
    expect(pathState(svg)).toEqual(reverse);
    frame(125);
    expect(pathState(svg)).toEqual(reverse);
    expect(frames.size).toBe(1);
    frame(1000);
    expect(pathState(svg)).toEqual(endpoint("plus", true));
    expect([...svg.querySelectorAll("path")]).toEqual(paths);
    expect(frames.size).toBe(0);
  });

  it("reverses a partially drawn confirmation continuously and returns to a fully hidden stroke", () => {
    const { container, rerender } = render(<MorphIcon name="check" duration={600} />);
    const svg = svgElement(container);
    rerender(<MorphIcon name="check" active duration={600} />);
    frame(100);
    const forward = pathState(svg), confirmation = forward[1];
    expect(confirmation.pathLength).toBe("1");
    expect(confirmation.dasharray).toBe("1");
    expect(Number(confirmation.dashoffset)).toBeGreaterThan(0);
    expect(Number(confirmation.dashoffset)).toBeLessThan(1);
    rerender(<MorphIcon name="check" duration={600} />);
    expect(pathState(svg)).toEqual(forward);
    frame(100);
    expect(pathState(svg)).toEqual(forward);
    frame(125);
    const reverse = pathState(svg);
    expect(Number(reverse[1].dashoffset)).toBeGreaterThan(Number(confirmation.dashoffset));
    rerender(<MorphIcon name="check" active duration={600} />);
    expect(pathState(svg)).toEqual(reverse);
    frame(125);
    expect(pathState(svg)).toEqual(reverse);
    frame(1000);
    expect(pathState(svg)).toEqual(endpoint("check", true));
    rerender(<MorphIcon name="check" duration={600} />);
    frame(2000);
    expect(pathState(svg)).toEqual(endpoint("check", false));
    expect(pathState(svg)[1]).toMatchObject({ opacity: 0, dashoffset: "1" });
    expect(frames.size).toBe(0);
  });

  it("remounts a changed icon name in its selected state and cancels the old transition", () => {
    const { container, rerender } = render(<MorphIcon name="menu" />);
    const previous = svgElement(container);
    rerender(<MorphIcon name="menu" active />);
    frame(50);
    expect(frames.size).toBe(1);
    rerender(<MorphIcon name="camera" active />);
    const current = svgElement(container);
    expect(current).not.toBe(previous);
    expect(previous.isConnected).toBe(false);
    expect(pathState(current)).toEqual(endpoint("camera", true));
    expect(frames.size).toBe(0);
    frame(1000);
    expect(pathState(current)).toEqual(endpoint("camera", true));
  });

  it("snaps under explicit reduced motion without scheduling animation frames", () => {
    const { container, rerender } = render(<MorphIcon name="heart" reducedMotion />);
    const svg = svgElement(container);
    rerender(<MorphIcon name="heart" active reducedMotion />);
    expect(pathState(svg)).toEqual(endpoint("heart", true));
    rerender(<MorphIcon name="heart" reducedMotion />);
    expect(pathState(svg)).toEqual(endpoint("heart", false));
    expect(requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("reacts to a reduced-motion preference change during a transition and releases its listeners", () => {
    const { container, rerender, unmount } = render(<MorphIcon name="volume" />);
    const svg = svgElement(container);
    rerender(<MorphIcon name="volume" active />);
    frame(50);
    expect(frames.size).toBe(1);
    act(() => { reduced = true; for (const listener of mediaListeners) listener(); });
    expect(pathState(svg)).toEqual(endpoint("volume", true));
    expect(frames.size).toBe(0);
    rerender(<MorphIcon name="volume" />);
    expect(pathState(svg)).toEqual(endpoint("volume", false));
    act(() => { reduced = false; for (const listener of mediaListeners) listener(); });
    rerender(<MorphIcon name="volume" active />);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(mediaListeners.size).toBe(0);
  });

  it("keeps default artwork decorative and gives named artwork usable accessible names", () => {
    const { container, rerender } = render(<MorphIcon name="play-pause" />);
    expect(svgElement(container)).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("img")).toBeNull();
    rerender(<MorphIcon name="play-pause" label="Player status" />);
    expect(screen.getByRole("img", { name: "Player status" })).toBe(svgElement(container));
    expect(svgElement(container)).not.toHaveAttribute("aria-hidden");
    rerender(<MorphIcon name="play-pause" decorative={false} active reducedMotion />);
    expect(screen.getByRole("img", { name: "Playback: Pause" })).toBe(svgElement(container));
    rerender(<MorphIcon name="play-pause" label="Player status" decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(svgElement(container)).not.toHaveAttribute("aria-label");
  });

  it("honors native aria naming and an explicit hidden state", () => {
    const { container, rerender } = render(<><span id="icon-name">Upload progress</span><MorphIcon name="upload" aria-labelledby="icon-name" /></>);
    expect(screen.getByRole("img", { name: "Upload progress" })).toBe(svgElement(container));
    rerender(<MorphIcon name="upload" aria-label="Upload progress" />);
    expect(screen.getByRole("img", { name: "Upload progress" })).toBe(svgElement(container));
    rerender(<MorphIcon name="upload" aria-label="Upload progress" aria-hidden />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(svgElement(container)).toHaveAttribute("aria-hidden", "true");
  });

  it("passes SVG refs and ordinary attributes through generic and named exports", () => {
    const reference = createRef<SVGSVGElement>();
    const { container, rerender } = render(<MorphIcon name="star" ref={reference} className="custom-icon" data-testid="custom-morph" size="1.5em" style={{ color: "red" }} />);
    expect(reference.current).toBe(svgElement(container));
    expect(reference.current).toHaveAttribute("width", "1.5em");
    expect(reference.current).toHaveClass("custom-icon");
    expect(reference.current).toHaveStyle({ color: "rgb(255, 0, 0)" });
    const namedReference = createRef<SVGSVGElement>();
    rerender(<icons.StarMorphIcon ref={namedReference} size={32} />);
    expect(reference.current).toBeNull();
    expect(namedReference.current).toBe(svgElement(container));
    expect(namedReference.current).toHaveAttribute("height", "32");
  });

  it("cancels a pending frame on unmount without painting a detached SVG", () => {
    const { container, rerender, unmount } = render(<MorphIcon name="message" />);
    const svg = svgElement(container);
    rerender(<MorphIcon name="message" active />);
    frame(30);
    const painted = pathState(svg);
    expect(frames.size).toBe(1);
    unmount();
    expect(frames.size).toBe(0);
    expect(mediaListeners.size).toBe(0);
    frame(1000);
    expect(pathState(svg)).toEqual(painted);
  });

  it("keeps listening activity running after settling and exits from the currently painted bars", () => {
    const { container, rerender } = render(<MorphIcon name="microphone" active duration={400} />);
    const svg = svgElement(container), paths = [...svg.querySelectorAll("path")];
    expect(pathState(svg)).toEqual(endpoint("microphone", true));
    expect(frames.size).toBe(1);
    frame(0);
    frame(250);
    const first = pathState(svg);
    frame(400);
    const current = pathState(svg);
    expect(current).not.toEqual(first);
    expect(svg).toHaveAttribute("data-state", "active");
    expect(svg).toHaveAttribute("stroke-width", "1.5");
    expect([...svg.querySelectorAll("path")]).toEqual(paths);
    expect(frames.size).toBe(1);
    rerender(<MorphIcon name="microphone" duration={400} />);
    expect(pathState(svg)).toEqual(current);
    frame(400);
    expect(pathState(svg)).toEqual(current);
    frame(420);
    expect(pathState(svg)).not.toEqual(current);
    frame(1000);
    expect(pathState(svg)).toEqual(endpoint("microphone", false));
    expect(frames.size).toBe(0);
  });

  it("animates only three standalone typing dots and honors opt-out and both reduced-motion controls", () => {
    const { container, rerender } = render(<MorphIcon name="message" active />);
    const svg = svgElement(container);
    frame(0);
    frame(250);
    const first = pathState(svg);
    frame(400);
    const current = pathState(svg), definition = getMorphIcon("message");
    expect(current).not.toEqual(first);
    expect(current.filter(path => path.opacity > 0)).toHaveLength(3);
    definition.paths.forEach((path, index) => {
      if (path.activity) {
        expect(current[index].d).toBe(path.to);
        expect(current[index].transform).toMatch(/^translate\(0 /);
      } else expect(current[index].opacity).toBe(0);
    });
    expect(frames.size).toBe(1);
    rerender(<MorphIcon name="message" active animateActivity={false} />);
    expect(pathState(svg)).toEqual(endpoint("message", true));
    expect(frames.size).toBe(0);
    rerender(<MorphIcon name="message" active />);
    expect(frames.size).toBe(1);
    frame(500); frame(750);
    expect(pathState(svg)).not.toEqual(endpoint("message", true));
    act(() => { reduced = true; for (const listener of mediaListeners) listener(); });
    expect(pathState(svg)).toEqual(endpoint("message", true));
    expect(frames.size).toBe(0);
    act(() => { reduced = false; for (const listener of mediaListeners) listener(); });
    expect(frames.size).toBe(1);
    rerender(<MorphIcon name="message" active reducedMotion />);
    expect(pathState(svg)).toEqual(endpoint("message", true));
    expect(frames.size).toBe(0);
  });

  it.each(["microphone", "message"] as const)("suspends %s activity offscreen or in a hidden tab and releases its observer and SVG ref", name => {
    const records: { callback: IntersectionObserverCallback; observed: Element[]; disconnect: () => void }[] = [];
    vi.stubGlobal("IntersectionObserver", class {
      record: typeof records[number];
      constructor(callback: IntersectionObserverCallback) {
        this.record = { callback, observed: [], disconnect: vi.fn() }; records.push(this.record);
      }
      observe(element: Element) { this.record.observed.push(element); }
      disconnect() { this.record.disconnect(); }
    });
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(false);
    const removeListener = vi.spyOn(document, "removeEventListener");
    const reference = createRef<SVGSVGElement>();
    const { container, unmount } = render(<MorphIcon name={name} active ref={reference} />);
    const svg = svgElement(container), observer = records[0];
    expect(reference.current).toBe(svg);
    expect(records).toHaveLength(1);
    expect(observer.observed).toEqual([svg]);
    frame(0); frame(250);
    expect(frames.size).toBe(1);
    const visibility = (isIntersecting: boolean) => act(() => observer.callback([{
      target: svg, isIntersecting, time: now, rootBounds: null,
      boundingClientRect: svg.getBoundingClientRect(), intersectionRect: svg.getBoundingClientRect(), intersectionRatio: isIntersecting ? 1 : 0,
    }], {} as IntersectionObserver));
    visibility(false);
    expect(pathState(svg)).toEqual(endpoint(name, true));
    expect(frames.size).toBe(0);
    visibility(true);
    expect(frames.size).toBe(1);
    frame(300); frame(550);
    expect(pathState(svg)).not.toEqual(endpoint(name, true));
    act(() => { hidden.mockReturnValue(true); document.dispatchEvent(new Event("visibilitychange")); });
    expect(pathState(svg)).toEqual(endpoint(name, true));
    expect(frames.size).toBe(0);
    act(() => { hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange")); });
    expect(frames.size).toBe(1);
    unmount();
    expect(reference.current).toBeNull();
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(removeListener).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(mediaListeners.size).toBe(0);
    expect(frames.size).toBe(0);
  });
});
