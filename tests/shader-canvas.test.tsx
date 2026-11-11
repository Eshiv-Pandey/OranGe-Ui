import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { ShaderCanvas, gameboyNoise, type ShaderCanvasProps } from "../components/ui/shader-canvas";
import { createShaderRenderer } from "../components/ui/shader-canvas/renderer";
import { hexRgb, sourceColors } from "../components/ui/shader-canvas/types";
import { clouds } from "../components/ui/shader-canvas/clouds";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function harness(reduced = false) {
  let framebuffer: object | null = null, texture: object | null = null, next = 0;
  const draws: { framebuffer: object | null; texture: object | null }[] = [], uniforms = new Map<string, unknown>(), queue = new Map<number, FrameRequestCallback>();
  const constants = { VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4, FRAMEBUFFER_COMPLETE: 5, MAX_TEXTURE_SIZE: 6 };
  const gl = new Proxy({ ...constants, createShader: () => ({}), createProgram: () => ({}), createTexture: () => ({}), createFramebuffer: () => ({}), createVertexArray: () => ({}), getShaderParameter: () => true, getProgramParameter: () => true, getParameter: () => 4096, checkFramebufferStatus: () => 5,
    getUniformLocation: (_program: object, name: string) => name, bindFramebuffer: (_target: unknown, value: object | null) => { framebuffer = value; }, bindTexture: (_target: unknown, value: object | null) => { texture = value; }, drawArrays: () => draws.push({ framebuffer, texture }),
    uniform1i: (name: string, value: unknown) => uniforms.set(name, value), uniform1f: (name: string, value: unknown) => uniforms.set(name, value), uniform2fv: (name: string, value: unknown) => uniforms.set(name, value), uniform3fv: (name: string, value: unknown) => uniforms.set(name, value), uniform4fv: (name: string, value: unknown) => uniforms.set(name, value),
    deleteProgram: vi.fn(), deleteTexture: vi.fn(), deleteFramebuffer: vi.fn(), deleteVertexArray: vi.fn(),
  }, { get(target, key) { return key in target ? target[key as keyof typeof target] : /^[A-Z_0-9]+$/.test(String(key)) ? 0 : () => {}; } });
  const canvas = document.createElement("canvas"); vi.spyOn(canvas, "getContext").mockReturnValue(gl as unknown as WebGL2RenderingContext);
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ width: 400, height: 200, left: 0, top: 0 } as DOMRect);
  const query = { matches: reduced, addEventListener: vi.fn(), removeEventListener: vi.fn() };
  vi.stubGlobal("matchMedia", () => query); vi.stubGlobal("devicePixelRatio", 2); vi.spyOn(document, "hidden", "get").mockReturnValue(false);
  vi.stubGlobal("IntersectionObserver", undefined); vi.stubGlobal("ResizeObserver", undefined);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { queue.set(++next, callback); return next; }); vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
  return { canvas, gl, draws, uniforms, queue, query, frame(time: number) { const [id, callback] = [...queue][0]; queue.delete(id); callback(time); } };
}
it("renders an SSR-safe gradient before a context is available and normalizes hex input", () => {
  const markup = renderToString(<ShaderCanvas source={{ type: "gradient", colors: ["#ff4d00", "#31eeff", "#ffbf00"] }} />);
  expect(markup).toContain("data-renderer=\"fallback\""); expect(markup).toContain("linear-gradient"); expect(markup).toContain("role=\"img\"");
  expect(hexRgb("#0f8")).toEqual([0, 1, 136 / 255]); expect(sourceColors({ colors: ["#123"] })).toHaveLength(3);
});
it("runs ordered passes through alternating targets, scales resolution, and releases every resource", () => {
  const h = harness(); let config: ShaderCanvasProps = { ...gameboyNoise, renderScale: .5 }; const ready = vi.fn();
  const renderer = createShaderRenderer(h.canvas, () => config, ready);
  expect(h.canvas.width).toBe(400); expect(h.canvas.height).toBe(200); expect(h.draws).toHaveLength(4);
  expect(h.draws[0].framebuffer).toBe(h.draws[2].framebuffer); expect(h.draws[1].framebuffer).not.toBe(h.draws[0].framebuffer); expect(h.draws[3].framebuffer).toBeNull();
  expect(h.queue.size).toBe(1); expect(h.uniforms.get("uWarpEnabled")).toBe(0);
  config = { ...config, renderScale: 0, paused: true }; renderer.redraw(); expect(h.canvas.width).toBe(200); expect(h.queue.size).toBe(0);
  renderer.destroy(); expect(h.gl.deleteProgram).toHaveBeenCalledTimes(4); expect(h.gl.deleteTexture).toHaveBeenCalledTimes(4); expect(h.gl.deleteFramebuffer).toHaveBeenCalledTimes(4); expect(h.gl.deleteVertexArray).toHaveBeenCalledOnce();
});
it("renders a single reduced-motion frame with interactions disabled", () => {
  const h = harness(true); const renderer = createShaderRenderer(h.canvas, () => ({ interaction: { warp: true, ripple: true, pixelProximity: true, ditherProximity: true, scroll: true } }), vi.fn());
  expect(h.queue.size).toBe(0); expect(h.uniforms.get("uTime")).toBe(0); expect(h.uniforms.get("uWarpEnabled")).toBe(0); expect(h.uniforms.get("uPixelProximity")).toBe(0); expect(h.uniforms.get("uDitherProximity")).toBe(0);
  renderer.destroy();
});
it("stops on a hidden tab, resumes without a time jump, and keeps one RAF after prop changes", () => {
  const h = harness(), hidden = vi.spyOn(document, "hidden", "get"); hidden.mockReturnValue(false);
  const renderer = createShaderRenderer(h.canvas, () => ({}), vi.fn()); renderer.redraw(); renderer.redraw(); expect(h.queue.size).toBe(1);
  h.frame(performance.now() + 20); const time = h.uniforms.get("uTime");
  hidden.mockReturnValue(true); document.dispatchEvent(new Event("visibilitychange")); expect(h.queue.size).toBe(0);
  hidden.mockReturnValue(false); document.dispatchEvent(new Event("visibilitychange")); expect(h.queue.size).toBe(1); expect(h.uniforms.get("uTime")).toBe(time);
  renderer.destroy();
});
it("opts into pointer interactions and reuses an eight-ripple pool for touch", () => {
  const h = harness(); let config: ShaderCanvasProps = {};
  const renderer = createShaderRenderer(h.canvas, () => config, vi.fn());
  const point = () => { const event = new Event("pointerdown"); Object.assign(event, { clientX: 100, clientY: 100, pointerType: "touch" }); h.canvas.dispatchEvent(event); };
  point(); renderer.redraw(); expect(h.uniforms.get("uPointerActive")).toBe(0);
  config = { interaction: { warp: true, ripple: true } }; for (let i = 0; i < 12; i++) point(); renderer.redraw();
  expect(h.uniforms.get("uWarpEnabled")).toBe(1); expect(h.uniforms.get("uPointerActive")).toBe(1);
  const ripples = h.uniforms.get("uRipples") as number[]; expect(ripples).toHaveLength(32); expect(ripples.filter((_value, i) => i % 4 === 3)).toEqual(Array(8).fill(1));
  renderer.destroy();
});
it("pauses offscreen and resumes when IntersectionObserver reports the canvas visible", () => {
  const h = harness(); let intersect: (entries: { isIntersecting: boolean }[]) => void = () => {};
  vi.stubGlobal("IntersectionObserver", class { constructor(callback: typeof intersect) { intersect = callback; } observe() {} disconnect() {} });
  const renderer = createShaderRenderer(h.canvas, () => ({}), vi.fn()); expect(h.queue.size).toBe(0);
  intersect([{ isIntersecting: true }]); expect(h.queue.size).toBe(1);
  intersect([{ isIntersecting: false }]); expect(h.queue.size).toBe(0); renderer.destroy();
});

it("caps cloud pixels on a large high-DPR screen and throttles high-refresh frames", () => {
  const h = harness();
  vi.mocked(h.canvas.getBoundingClientRect).mockReturnValue({ width: 2400, height: 1600, left: 0, top: 0 } as DOMRect);
  const renderer = createShaderRenderer(h.canvas, () => ({ source: { type: "clouds" }, modules: [clouds], renderScale: 1 }), vi.fn());
  expect(h.canvas.width * h.canvas.height).toBeLessThanOrEqual(360_000);
  expect(h.canvas.width / h.canvas.height).toBeCloseTo(1.5, 2);
  const now = performance.now() + 100;
  h.frame(now);
  const draws = h.draws.length;
  h.frame(now + 8); h.frame(now + 16); h.frame(now + 24);
  expect(h.draws).toHaveLength(draws);
  h.frame(now + 43);
  expect(h.draws).toHaveLength(draws + 1);
  renderer.destroy();
  expect(h.queue.size).toBe(0);
});

it("allocates lookup textures once, reuses them through edits, and releases them with the program", () => {
  const h = harness(), data = vi.fn(() => new Uint8Array(16));
  const sourceModule = { ...clouds, textures: { uCloudNoise: { width: 2, height: 2, data, repeat: true } } };
  let config: ShaderCanvasProps = { source: { type: "clouds" }, modules: [sourceModule] };
  const renderer = createShaderRenderer(h.canvas, () => config, vi.fn());
  for (let i = 0; i < 20; i++) { config = { ...config, source: { type: "clouds", coverage: i / 20 } }; renderer.redraw(); }
  expect(data).toHaveBeenCalledOnce();
  expect(h.uniforms.get("uCloudNoise")).toBe(1);
  renderer.destroy();
  expect(h.gl.deleteTexture).toHaveBeenCalledTimes(3);
  expect(h.gl.deleteProgram).toHaveBeenCalledOnce();
});
