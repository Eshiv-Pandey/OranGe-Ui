import { afterEach, expect, it, vi } from "vitest";
import { createReferenceRenderer } from "../components/landing/reference-renderer";
import { REFERENCE_SCENE_CONFIG } from "../components/landing/reference-scene-config";

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

async function harness(width = 1199, height = 805) {
  const uniforms = new Map<string, number>(), queue = new Map<number, FrameRequestCallback>();
  let next = 0;
  const gl = new Proxy({
    createShader: () => ({}), createProgram: () => ({}), createVertexArray: () => ({}), createTexture: () => ({}),
    getShaderParameter: () => true, getProgramParameter: () => true,
    getUniformLocation: (_program: unknown, name: string) => name,
    uniform1f: (name: string, value: number) => uniforms.set(name, value),
    deleteTexture: vi.fn(), deleteProgram: vi.fn(), drawArrays: vi.fn(),
  }, { get(target, key) { return key in target ? target[key as keyof typeof target] : /^[A-Z_0-9]+$/.test(String(key)) ? 0 : () => {}; } });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(((kind: string) => kind === "webgl2" ? gl : null) as typeof HTMLCanvasElement.prototype.getContext);
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getBoundingClientRect").mockReturnValue({ width, height, left: 0, top: 0 } as DOMRect);
  const media = Object.assign(new EventTarget(), { matches: false });
  vi.stubGlobal("matchMedia", () => media); vi.stubGlobal("devicePixelRatio", 3);
  vi.stubGlobal("Image", class {
    naturalWidth = 1199; naturalHeight = 805; onload?: () => void;
    set src(_value: string) { queueMicrotask(() => this.onload?.()); }
  });
  vi.stubGlobal("IntersectionObserver", undefined); vi.stubGlobal("ResizeObserver", undefined);
  const visibility = vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { queue.set(++next, callback); return next; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
  const state = vi.fn();
  const renderer = createReferenceRenderer(canvas, { ...REFERENCE_SCENE_CONFIG, sparkleCount: 0 }, state);
  await vi.waitFor(() => expect(state).toHaveBeenLastCalledWith("webgl2"));
  return { canvas, gl, media, uniforms, queue, renderer, visibility, state, frame(time: number) {
    expect(queue.size).toBe(1);
    const [id, callback] = [...queue][0]; queue.delete(id); callback(time);
  } };
}

it("advances a full visible second at 10 fps, including a zero first timestamp", async () => {
  const h = await harness();
  try {
    for (let time = 0; time <= 1000; time += 100) h.frame(time);
    expect(h.uniforms.get("uTime")).toBeCloseTo(1, 5);
    expect(h.queue.size).toBe(1);
  } finally { h.renderer.destroy(); }
});

it("freezes the scene on pause and visibility loss, then resumes without catching up", async () => {
  const h = await harness();
  try {
    h.frame(0); h.frame(100);
    h.renderer.setPaused(true);
    expect(h.queue.size).toBe(0); expect(h.canvas.dataset.motion).toBe("paused");
    h.renderer.setPaused(false); h.frame(20_000);
    expect(h.uniforms.get("uTime")).toBeCloseTo(.1);
    h.frame(20_100);
    h.visibility.mockReturnValue("hidden"); document.dispatchEvent(new Event("visibilitychange"));
    expect(h.queue.size).toBe(0);
    h.visibility.mockReturnValue("visible"); document.dispatchEvent(new Event("visibilitychange")); h.frame(80_000);
    expect(h.uniforms.get("uTime")).toBeCloseTo(.2);
    h.media.matches = true; h.media.dispatchEvent(new Event("change"));
    expect(h.uniforms.get("uMotion")).toBe(0); expect(h.uniforms.get("uTime")).toBe(0);
    expect(h.canvas.dataset.motion).toBe("reduced"); expect(h.queue.size).toBe(0);
    h.media.matches = false; h.media.dispatchEvent(new Event("change")); h.frame(100_000);
    expect(h.uniforms.get("uTime")).toBeCloseTo(.2);
  } finally { h.renderer.destroy(); }
  expect(h.queue.size).toBe(0); expect(h.gl.deleteTexture).toHaveBeenCalledTimes(6);
});

it("caps large high-DPR buffers and restores the same scene after context loss", async () => {
  const h = await harness(3840, 2160);
  try {
    expect(h.canvas.width * h.canvas.height).toBeLessThanOrEqual(REFERENCE_SCENE_CONFIG.maxPixels);
    expect(h.canvas.width / h.canvas.height).toBeCloseTo(3840 / 2160, 2);
    const event = new Event("webglcontextlost", { cancelable: true }); h.canvas.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true); expect(h.queue.size).toBe(0);
    expect(h.state).toHaveBeenLastCalledWith("fallback");
    h.canvas.dispatchEvent(new Event("webglcontextrestored"));
    expect(h.state).toHaveBeenLastCalledWith("webgl2"); expect(h.queue.size).toBe(1);
  } finally { h.renderer.destroy(); }
});
