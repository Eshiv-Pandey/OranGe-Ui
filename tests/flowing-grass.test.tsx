import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { FlowingGrass, type FlowingGrassProps } from "../components/ui/flowing-grass";
import { createGrassField, GRASS_MAX_BLADES, GRASS_STRIDE, normalizeGrassSettings } from "../components/ui/shader-canvas/grass";
import type { GrassRenderOptions } from "../components/ui/shader-canvas/grass-renderer";
import FlowingGrassDemo from "../components/library/flowing-grass-demo";

const renderer = vi.hoisted(() => ({ read: undefined as (() => FlowingGrassProps) | undefined }));
vi.mock("../components/ui/shader-canvas/grass-renderer", () => ({ createGrassRenderer: (_canvas: HTMLCanvasElement, read: () => FlowingGrassProps) => {
  renderer.read = read;
  return { redraw() {}, destroy() {} };
} }));
beforeEach(() => { vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} })); });
afterEach(() => { cleanup(); renderer.read = undefined; vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("provides an accessible, green server fallback without needing WebGL or image assets", () => {
  const markup = renderToString(<FlowingGrass className="garden" label="A breeze across the meadow" />);
  expect(markup).toContain('aria-label="A breeze across the meadow"');
  expect(markup).toContain('data-renderer="fallback"');
  expect(markup).toContain("flowing-grass garden");
  expect(markup).toContain("rgb(118 170 60)");
  expect(markup).not.toContain("<img");
});

it("preserves the shader surface contract and allows pointer breeze to be disabled", () => {
  const view = render(<FlowingGrass appearance="pixel" seed={81} />);
  expect(renderer.read?.().interaction?.warp).toBe(true);
  expect(renderer.read?.().seed).toBe(81);
  view.rerender(<FlowingGrass appearance="terminal" interaction={{ warp: false }} paused />);
  expect(renderer.read?.().interaction?.warp).toBe(false);
  expect(renderer.read?.().paused).toBe(true);
  expect(screen.getByRole("img")).toHaveAttribute("data-appearance", "terminal");
  expect(screen.getByRole("img")).toHaveClass("shader-canvas", "flowing-grass");
});

it("sanitizes non-finite and out-of-range inputs before they reach shader uniforms", () => {
  expect(normalizeGrassSettings({ density: 0 }).density).toBe(35);
  expect(normalizeGrassSettings({ density: Infinity }).density).toBe(80);
  expect(normalizeGrassSettings({ windStrength: 12 }).windStrength).toBe(2);
  expect(normalizeGrassSettings({ speed: -4 }).speed).toBe(0);
  expect(normalizeGrassSettings({ bladeLength: NaN }).bladeLength).toBe(1.25);
  expect(normalizeGrassSettings({ color: "invalid" }).color).toBe("#76aa3c");
});

it("connects wind, geometry, colors, pointer controls and pause to the live grass", () => {
  render(<FlowingGrassDemo />);
  fireEvent.change(screen.getByRole("slider", { name: "Wind strength" }), { target: { value: "1.5" } });
  fireEvent.change(screen.getByRole("slider", { name: "Grass density" }), { target: { value: "140" } });
  fireEvent.change(screen.getByLabelText("Grass color"), { target: { value: "#208c51" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Pointer breeze" }));
  fireEvent.click(screen.getByRole("checkbox", { name: "Pause animation" }));
  const props = renderer.read?.();
  expect(props).toMatchObject({ windStrength: 1.5, density: 140, color: "#208c51" });
  expect(props?.interaction?.warp).toBe(false);
  expect(props?.paused).toBe(true);
});

it("generates repeatable roots, a broad leaf length distribution, and a bounded field", () => {
  const first = createGrassField(.63, 35, 7), repeated = createGrassField(.63, 35, 7), changed = createGrassField(.63, 35, 8);
  expect(first.data).toEqual(repeated.data);
  expect(first.data.slice(0, 32)).not.toEqual(changed.data.slice(0, 32));
  const lengths = Array.from({ length: first.count }, (_, index) => first.data[index * GRASS_STRIDE + 2]);
  expect(Math.max(...lengths) / Math.min(...lengths)).toBeGreaterThan(5);
  const dense = createGrassField(4, 160, 7);
  expect(dense.count).toBeLessThanOrEqual(GRASS_MAX_BLADES);
  expect(dense.count).toBeGreaterThan(first.count);
  expect(dense.data.length).toBe(dense.count * GRASS_STRIDE);
});

const { createGrassRenderer: createRenderer } = await vi.importActual<typeof import("../components/ui/shader-canvas/grass-renderer")>("../components/ui/shader-canvas/grass-renderer");

function harness(reduced = false) {
  let next = 0;
  const uniforms = new Map<string, number | number[]>(), queue = new Map<number, FrameRequestCallback>();
  const draws: number[] = [];
  const gl = new Proxy({
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, MAX_TEXTURE_SIZE: 5,
    createShader: () => ({}), createProgram: () => ({}), createBuffer: () => ({}), createVertexArray: () => ({}),
    getShaderParameter: () => true, getProgramParameter: () => true, getParameter: () => 4096,
    getUniformLocation: (_program: unknown, name: string) => name,
    uniform1f: (name: string, value: number) => uniforms.set(name, value),
    uniform2fv: (name: string, value: number[]) => uniforms.set(name, value),
    uniform3fv: (name: string, value: number[]) => uniforms.set(name, value),
    drawArrays: () => draws.push(0), drawArraysInstanced: (_mode: number, _first: number, _count: number, instances: number) => draws.push(instances),
    bufferData: vi.fn(), deleteProgram: vi.fn(), deleteBuffer: vi.fn(), deleteVertexArray: vi.fn(),
  }, { get(target, key) { return key in target ? target[key as keyof typeof target] : /^[A-Z_0-9]+$/.test(String(key)) ? 0 : () => {}; } });
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockReturnValue(gl as unknown as WebGL2RenderingContext);
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ width: 400, height: 200, left: 0, top: 0 } as DOMRect);
  const query = { matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => query); vi.stubGlobal("devicePixelRatio", 2);
  vi.stubGlobal("IntersectionObserver", undefined); vi.stubGlobal("ResizeObserver", undefined);
  vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { queue.set(++next, callback); return next; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
  return { canvas, gl, uniforms, queue, draws, query, frame(time: number) {
    const [id, callback] = [...queue][0]; queue.delete(id); callback(time);
  }, pointer(type: string, pointerType = "mouse") {
    const event = new Event(type); Object.assign(event, { clientX: 270, clientY: 100, pointerType }); canvas.dispatchEvent(event);
  } };
}

it("uses two draws and reuses roots while wind, length, color and resolution change", () => {
  const h = harness(); let config: GrassRenderOptions = { renderScale: .5 };
  const instance = createRenderer(h.canvas, () => config, vi.fn());
  expect(h.canvas.width).toBe(400); expect(h.canvas.height).toBe(200);
  expect(h.draws).toHaveLength(2); expect(h.draws[1]).toBeLessThanOrEqual(GRASS_MAX_BLADES);
  expect(h.gl.bufferData).toHaveBeenCalledTimes(1);
  config = { windStrength: 1.8, bladeLength: 1.5, color: "#ddea80", renderScale: .8 };
  instance.redraw(); instance.redraw();
  expect(h.gl.bufferData).toHaveBeenCalledTimes(1); expect(h.queue.size).toBe(1);
  config = { ...config, density: 105 }; instance.redraw(); expect(h.gl.bufferData).toHaveBeenCalledTimes(2);
  config = { ...config, paused: true }; instance.redraw(); expect(h.queue.size).toBe(0);
  instance.destroy();
  expect(h.gl.deleteProgram).toHaveBeenCalledTimes(2); expect(h.gl.deleteBuffer).toHaveBeenCalledOnce(); expect(h.gl.deleteVertexArray).toHaveBeenCalledOnce();
  expect(h.query.removeEventListener).toHaveBeenCalledWith("change", expect.any(Function));
});

it("holds wind and pointer state exactly while paused and ignores touch under reduced motion", () => {
  const h = harness(); let config: GrassRenderOptions = { interaction: { warp: true } };
  const instance = createRenderer(h.canvas, () => config, vi.fn());
  h.frame(100); h.pointer("pointerdown", "touch"); h.frame(150);
  expect(h.uniforms.get("uPointerActive")).toBeGreaterThan(0);
  const time = h.uniforms.get("uTime"), pointer = h.uniforms.get("uPointer"), active = h.uniforms.get("uPointerActive");
  config = { ...config, paused: true }; instance.redraw(); h.pointer("pointermove"); instance.redraw();
  expect(h.uniforms.get("uTime")).toBe(time); expect(h.uniforms.get("uPointer")).toEqual(pointer); expect(h.uniforms.get("uPointerActive")).toBe(active);
  expect(h.queue.size).toBe(0);
  h.query.matches = true; h.query.addEventListener.mock.calls[0][1](); h.pointer("pointerdown", "touch"); instance.redraw();
  expect(h.uniforms.get("uTime")).toBe(0); expect(h.uniforms.get("uPointerActive")).toBe(0); expect(h.queue.size).toBe(0);
  instance.destroy();
});

it("stops when hidden or offscreen, resumes without a clock jump, and restores a lost context", () => {
  const h = harness(), hidden = vi.spyOn(document, "hidden", "get");
  let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  const disconnect = vi.fn();
  vi.stubGlobal("IntersectionObserver", class { constructor(callback: typeof intersect) { intersect = callback; } observe() {} disconnect = disconnect; });
  const ready = vi.fn(), instance = createRenderer(h.canvas, () => ({}), ready);
  expect(h.queue.size).toBe(0); intersect([{ isIntersecting: true }]); expect(h.queue.size).toBe(1);
  h.frame(100); h.frame(150); const time = h.uniforms.get("uTime");
  hidden.mockReturnValue(true); document.dispatchEvent(new Event("visibilitychange")); expect(h.queue.size).toBe(0);
  hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange")); h.frame(8000);
  expect(h.uniforms.get("uTime")).toBe(time);
  intersect([{ isIntersecting: false }]); expect(h.queue.size).toBe(0);
  intersect([{ isIntersecting: true }]);
  const lost = new Event("webglcontextlost", { cancelable: true }); h.canvas.dispatchEvent(lost);
  expect(lost.defaultPrevented).toBe(true); expect(ready).toHaveBeenLastCalledWith(false); expect(h.queue.size).toBe(0);
  h.canvas.dispatchEvent(new Event("webglcontextrestored")); expect(ready).toHaveBeenLastCalledWith(true); expect(h.queue.size).toBe(1);
  instance.destroy(); expect(h.queue.size).toBe(0); expect(disconnect).toHaveBeenCalledOnce();
});

it.each([
  { mode: "paused", paused: true, reduced: false },
  { mode: "reduced motion", paused: false, reduced: true },
])("refreshes a $mode frame on foregrounding without starting animation", ({ paused, reduced }) => {
  const h = harness(reduced), hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);
  let config: GrassRenderOptions = { paused };
  const ready = vi.fn(), instance = createRenderer(h.canvas, () => config, ready);
  expect(h.draws).toHaveLength(0); expect(h.queue.size).toBe(0);

  hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange"));
  expect(ready).toHaveBeenLastCalledWith(true);
  expect(h.draws).toHaveLength(2); expect(h.queue.size).toBe(0);

  hidden.mockReturnValue(true); document.dispatchEvent(new Event("visibilitychange"));
  config = { ...config, direction: 180 }; instance.redraw();
  expect(h.draws).toHaveLength(2);
  hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange"));
  expect(h.draws).toHaveLength(4); expect(h.uniforms.get("uDirection")).toBe(Math.PI);
  expect(h.uniforms.get("uTime")).toBe(0); expect(h.queue.size).toBe(0);
  instance.destroy();
});
