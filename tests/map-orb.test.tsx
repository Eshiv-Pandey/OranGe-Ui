import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { AgentMap, type AgentMapStop } from "../components/ui/agent-map";
import { fitMapCoordinates, mapTileUrl, pointNearCenter, projectMapCoordinate } from "../components/ui/agent-map-geometry";
import { GlyphOrb, GLYPH_ORB_DEFAULTS } from "../components/ui/glyph-orb";
import { drawGlyphOrb } from "../components/ui/glyph-orb-renderer";

const places: AgentMapStop[] = [
  { id: "a", name: "Museum", latitude: 51.5194, longitude: -.127 },
  { id: "b", name: "Square", latitude: 51.5215, longitude: -.1268 },
];
let callbacks: Map<number, FrameRequestCallback>, sequence: number;
beforeEach(() => {
  callbacks = new Map(); sequence = 0;
  vi.stubGlobal("matchMedia", vi.fn(() => Object.assign(new EventTarget(), { matches: false })));
  vi.stubGlobal("IntersectionObserver", undefined);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", vi.fn((callback: FrameRequestCallback) => { callbacks.set(++sequence, callback); return sequence; }));
  vi.stubGlobal("cancelAnimationFrame", vi.fn((id: number) => callbacks.delete(id)));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

it("fits geographic paths including date-line crossing without a world-sized route", () => {
  const coordinates = [{ latitude: 10, longitude: 179.9 }, { latitude: 10.1, longitude: -179.9 }];
  const view = fitMapCoordinates(coordinates, 800, 460);
  const points = coordinates.map(point => pointNearCenter(point, view.zoom, view.center));
  expect(view.zoom).toBeGreaterThan(8);
  expect(Math.abs(points[0].x - points[1].x)).toBeLessThan(800 * .62);
  expect(projectMapCoordinate({ latitude: 90, longitude: 0 }, 13).y).toBeGreaterThan(-1);
  expect(mapTileUrl("/{z}/{x}/{y}", -1, 5, 3)).toBe("/3/7/5");
});
it("keeps controlled stop selection and emits actionable reordered places", () => {
  const select = vi.fn(), reorder = vi.fn();
  const { getByRole, rerender } = render(<AgentMap stops={places} value="a" tileUrl={false} onValueChange={select} onReorder={reorder} />);
  fireEvent.click(getByRole("button", { name: "Select Square 2" }));
  expect(select).toHaveBeenCalledWith("b");
  expect(getByRole("button", { name: "Select Museum 1" })).toHaveAttribute("aria-pressed", "true");
  rerender(<AgentMap stops={places} value="b" tileUrl={false} onValueChange={select} onReorder={reorder} />);
  expect(getByRole("button", { name: "Select Square 2" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(getByRole("button", { name: "Move Square earlier" }));
  expect(reorder).toHaveBeenCalledWith([places[1], places[0]]);
  expect(getByRole("button", { name: "Move Museum earlier" })).toBeDisabled();
});
it("selects the first valid asynchronously loaded stop and recovers when selection is removed", () => {
  const { getByRole, rerender } = render(<AgentMap stops={[]} tileUrl={false} />);
  rerender(<AgentMap stops={places} tileUrl={false} />);
  expect(getByRole("button", { name: "Select Museum 1" })).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(getByRole("button", { name: "Select Square 2" }));
  expect(getByRole("button", { name: "Select Square 2" })).toHaveAttribute("aria-pressed", "true");
  rerender(<AgentMap stops={[places[0]]} tileUrl={false} />);
  expect(getByRole("button", { name: "Select Museum 1" })).toHaveAttribute("aria-pressed", "true");
});
it("offers fullscreen with Escape, body-scroll restoration and usable empty state", () => {
  document.body.style.overflow = "auto";
  const { getByRole, queryByRole, rerender } = render(<AgentMap stops={places} tileUrl={false} />);
  const expand = getByRole("button", { name: "Expand map" }); expand.focus(); fireEvent.click(expand);
  expect(getByRole("dialog")).toHaveAttribute("aria-modal", "true"); expect(document.body.style.overflow).toBe("hidden");
  expect(getByRole("dialog").parentElement).toBe(document.body);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(queryByRole("dialog")).toBeNull(); expect(document.body.style.overflow).toBe("auto"); expect(getByRole("button", { name: "Expand map" })).toHaveFocus();
  rerender(<AgentMap stops={[]} tileUrl={false} />);
  expect(getByRole("region")).toHaveTextContent("Add places with latitude and longitude");
});
it("draws a character sphere with balanced edges, varying cloud frames and no outside glyphs", () => {
  const glyphs: { x: number; y: number; text: string }[] = [];
  const context = { clearRect: vi.fn(), fillRect: vi.fn(), fillText: (text: string, x: number, y: number) => glyphs.push({ text, x, y }) } as unknown as CanvasRenderingContext2D;
  const config = { ...GLYPH_ORB_DEFAULTS, glow: 0 };
  drawGlyphOrb(context, 500, 500, config, { time: 0, rotation: 0, latitudeRotation: 0, lightX: 0, lightY: 0, storms: [] });
  expect(glyphs.length).toBeGreaterThan(2000);
  expect(glyphs.every(glyph => Math.hypot(glyph.x - 250, glyph.y - 250) <= 203)).toBe(true);
  const initial = glyphs.map(glyph => glyph.text).join(""); glyphs.length = 0;
  drawGlyphOrb(context, 500, 500, config, { time: 5, rotation: .8, latitudeRotation: .2, lightX: .5, lightY: -.5, storms: [{ x: 0, y: 0, age: 1 }] });
  expect(glyphs.map(glyph => glyph.text).join("")).not.toBe(initial);
});
it("paused glyph surfaces paint without scheduling frames and unmount cancels running motion", () => {
  const context = { clearRect() {}, fillRect() {}, fillText() {}, setTransform() {} } as unknown as CanvasRenderingContext2D;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
  const { getByRole, rerender, unmount } = render(<GlyphOrb paused />);
  expect(callbacks.size).toBe(0);
  expect(getByRole("img")).toHaveAttribute("data-motion", "paused");
  fireEvent.keyDown(getByRole("img"), { key: "Enter" }); expect(callbacks.size).toBe(0);
  rerender(<GlyphOrb />); expect(callbacks.size).toBe(1);
  act(() => { const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach(callback => callback(30)); });
  unmount(); expect(callbacks.size).toBe(0);
});
it("releases capture and drag state when paused or disabled during a gesture", () => {
  const context = { clearRect() {}, fillRect() {}, fillText() {}, setTransform() {} } as unknown as CanvasRenderingContext2D;
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context);
  const { getByRole, rerender } = render(<GlyphOrb />), element = getByRole("img") as HTMLCanvasElement;
  const capture = vi.fn(), release = vi.fn();
  element.setPointerCapture = capture; element.releasePointerCapture = release; element.hasPointerCapture = () => true;
  vi.spyOn(element, "getBoundingClientRect").mockReturnValue({ width: 500, height: 500, top: 0, left: 0, right: 500, bottom: 500, x: 0, y: 0, toJSON() {} });
  const down = () => fireEvent(element, Object.assign(new Event("pointerdown", { bubbles: true }), { button: 0, pointerId: 7, clientX: 250, clientY: 250 }));
  down(); expect(capture).toHaveBeenCalledWith(7);
  rerender(<GlyphOrb paused />); expect(release).toHaveBeenCalledWith(7); expect(callbacks.size).toBe(0);
  rerender(<GlyphOrb />); release.mockClear(); down();
  rerender(<GlyphOrb interactive={false} />); expect(release).toHaveBeenCalledWith(7);
  expect(getByRole("img")).not.toHaveAttribute("tabindex");
});
