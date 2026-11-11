import { StrictMode } from "react";
import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { AnimeFire } from "../components/ui/anime-fire";
import { createCreativeWebGL } from "../components/ui/creative-webgl";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function harness() {
  let lost = false, next = 0;
  const queue = new Map<number, FrameRequestCallback>();
  const extension = { loseContext: vi.fn(() => { lost = true; }) };
  const gl = new Proxy({
    createShader: () => lost ? null : {}, createProgram: vi.fn(() => ({})), createBuffer: () => ({}),
    getShaderParameter: () => !lost, getProgramParameter: () => !lost,
    getAttribLocation: () => 0, getUniformLocation: () => null,
    getExtension: () => extension, isContextLost: () => lost,
    drawArrays: vi.fn(), deleteProgram: vi.fn(), deleteBuffer: vi.fn(),
  }, { get(target, key) { return key in target ? target[key as keyof typeof target] : /^[A-Z_0-9]+$/.test(String(key)) ? 0 : () => {}; } });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(gl as unknown as WebGLRenderingContext);
  vi.spyOn(HTMLCanvasElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 400, height: 300, left: 0, top: 0 } as DOMRect);
  vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
  vi.stubGlobal("IntersectionObserver", undefined); vi.stubGlobal("ResizeObserver", undefined);
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { queue.set(++next, callback); return next; });
  vi.stubGlobal("cancelAnimationFrame", (id: number) => queue.delete(id));
  return { gl, queue, extension, setLost(value: boolean) { lost = value; }, frame(time: number) {
    const [id, callback] = [...queue][0]; queue.delete(id); callback(time);
  } };
}

it("keeps AnimeFire rendering after Strict Mode replays the effect on the same canvas", () => {
  const h = harness();
  const view = render(<StrictMode><AnimeFire /></StrictMode>);
  expect(view.container.querySelector(".anime-fire")).toHaveAttribute("data-renderer", "webgl");
  expect(h.gl.createProgram).toHaveBeenCalledTimes(2);
  expect(h.gl.deleteProgram).toHaveBeenCalledOnce();
  expect(h.gl.isContextLost()).toBe(false);
  expect(h.queue.size).toBe(1);
  view.unmount();
  expect(h.queue.size).toBe(0);
  expect(h.gl.deleteProgram).toHaveBeenCalledTimes(2);
  expect(h.gl.deleteBuffer).toHaveBeenCalledTimes(2);
});

it("recovers from real context loss and leaves no callbacks after disposal", () => {
  const h = harness(), canvas = document.createElement("canvas"), state = vi.fn();
  const renderer = createCreativeWebGL(canvas, "void main() {}", () => ({}), { onState: state });
  expect(state).toHaveBeenLastCalledWith(true);
  h.setLost(true);
  const event = new Event("webglcontextlost", { cancelable: true });
  canvas.dispatchEvent(event);
  expect(event.defaultPrevented).toBe(true);
  expect(state).toHaveBeenLastCalledWith(false);
  const draws = h.gl.drawArrays.mock.calls.length;
  renderer.redraw(); expect(h.gl.drawArrays).toHaveBeenCalledTimes(draws);
  h.setLost(false); canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(state).toHaveBeenLastCalledWith(true);
  expect(h.gl.createProgram).toHaveBeenCalledTimes(2);
  renderer.destroy();
  const programs = h.gl.createProgram.mock.calls.length;
  canvas.dispatchEvent(new Event("webglcontextrestored")); renderer.redraw();
  expect(h.gl.createProgram).toHaveBeenCalledTimes(programs);
  expect(h.queue.size).toBe(0);
});

it("bounds fire resolution and draw frequency on a large high-DPR display", () => {
  const h = harness(), canvas = document.createElement("canvas");
  vi.stubGlobal("devicePixelRatio", 3);
  vi.mocked(canvas.getBoundingClientRect).mockReturnValue({ width: 2400, height: 1600 } as DOMRect);
  const renderer = createCreativeWebGL(canvas, "void main() {}", () => ({}), {
    renderBudget: { maxPixels: 768_000, maxFps: 30, maxDpr: 1.5 },
  });
  expect(canvas.width * canvas.height).toBeLessThanOrEqual(768_000);
  expect(canvas.width / canvas.height).toBeCloseTo(1.5, 2);
  h.frame(0);
  const draws = h.gl.drawArrays.mock.calls.length;
  h.frame(8); h.frame(16); h.frame(24);
  expect(h.gl.drawArrays).toHaveBeenCalledTimes(draws);
  h.frame(34); expect(h.gl.drawArrays).toHaveBeenCalledTimes(draws + 1);
  renderer.destroy(); expect(h.queue.size).toBe(0);
});
