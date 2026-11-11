import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DriftingClouds } from "../components/ui/drifting-clouds";
import { clouds } from "../components/ui/shader-canvas/clouds";
import { cloudNoiseTexels } from "../components/ui/shader-canvas/clouds-noise";
import { createShaderRenderer } from "../components/ui/shader-canvas/renderer";
import type { ShaderCanvasProps } from "../components/ui/shader-canvas/types";
import DriftingCloudsDemo from "../components/library/drifting-clouds-demo";
import { APPEARANCE_VALUES } from "../components/ui/appearance";

vi.mock("../components/ui/shader-canvas/renderer", () => ({ createShaderRenderer: vi.fn(() => ({ redraw: vi.fn(), destroy: vi.fn() })) }));
beforeEach(() => { vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })); });
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

it("renders meaningful server output with caller colors, naming and all appearances", () => {
  for (const appearance of APPEARANCE_VALUES) {
    const html = renderToString(<DriftingClouds appearance={appearance} label="Clouds over the garden" skyColor="#125" cloudColor="#ffeedd" shadowColor="#778899" className="garden-sky" style={{ height: 640 }} />);
    expect(html).toContain('data-renderer="fallback"');
    expect(html).toContain(`data-appearance="${appearance}"`);
    expect(html).toContain('aria-label="Clouds over the garden"');
    expect(html).toContain("rgb(17 34 85)"); expect(html).toContain("rgb(255 238 221)");
    expect(html).toContain("garden-sky"); expect(html).toContain("height:640px");
  }
});

it("clamps malformed physical settings before they reach GLSL", () => {
  expect(clouds.uniforms.uCoverage.value({ coverage: -1 })).toBe(0);
  expect(clouds.uniforms.uDensity.value({ density: Infinity })).toBe(.75);
  expect(clouds.uniforms.uScale.value({ scale: 0 })).toBe(.5);
  expect(clouds.uniforms.uSpeed.value({ speed: NaN })).toBe(.35);
  expect(clouds.uniforms.uSeed.value({ seed: 9000 })).toBe(1000);
  expect(clouds.uniforms.uSunAngle.value({ sunAngle: 180 })).toBeCloseTo(Math.PI);
  expect(clouds.uniforms.uCloudColor.value({ cloudColor: "#fff" })).toEqual([1, 1, 1]);
});

it("keeps the volumetric lookup repeatable and continuous between adjacent depth slices", () => {
  const first = cloudNoiseTexels();
  expect(first).toEqual(cloudNoiseTexels());
  expect(first).toHaveLength(256 * 256 * 4);
  expect(new Set(first.filter((_, i) => i % 4 === 0)).size).toBeGreaterThan(200);
  for (const [x, y] of [[0, 0], [255, 255], [17, 90]]) {
    const pixel = (y * 256 + x) * 4;
    const nextSlice = (((y + 239) & 255) * 256 + ((x + 37) & 255)) * 4;
    expect(first[pixel]).toBe(first[nextSlice + 1]);
    expect(first[pixel + 3]).toBe(255);
  }
  expect(clouds.renderBudget!.maxPixels).toBeLessThanOrEqual(360000);
  expect(clouds.renderBudget!.maxFps).toBeLessThanOrEqual(30);
});

it("edits cloud shape, lighting, colors and pause state without replacing the renderer", () => {
  render(<DriftingCloudsDemo />);
  const read = vi.mocked(createShaderRenderer).mock.calls[0][1] as () => ShaderCanvasProps;
  expect(read().source?.type).toBe("clouds");
  fireEvent.change(screen.getByRole("slider", { name: "Sky coverage" }), { target: { value: "0" } });
  fireEvent.change(screen.getByRole("slider", { name: "Cloud density" }), { target: { value: "0.3" } });
  fireEvent.change(screen.getByRole("slider", { name: "Billow detail" }), { target: { value: "0.9" } });
  fireEvent.change(screen.getByRole("slider", { name: "Edge softness" }), { target: { value: "0.8" } });
  fireEvent.change(screen.getByRole("slider", { name: "Cloud scale" }), { target: { value: "1.8" } });
  fireEvent.change(screen.getByRole("slider", { name: "Sunlight" }), { target: { value: "1.5" } });
  fireEvent.change(screen.getByRole("slider", { name: "Sun angle" }), { target: { value: "220" } });
  fireEvent.change(screen.getByLabelText("Sky color"), { target: { value: "#552288" } });
  fireEvent.click(screen.getByRole("checkbox", { name: "Pause animation" }));
  expect(read().source).toMatchObject({ coverage: 0, density: .3, billow: .9, softness: .8, scale: 1.8, lightIntensity: 1.5, sunAngle: 220, skyColor: "#552288" });
  expect(read().paused).toBe(true);
  expect(createShaderRenderer).toHaveBeenCalledOnce();
});

it("keeps preview cards compact and reuses the same component with a lower render scale", () => {
  render(<DriftingCloudsDemo thumbnail appearance="pixel" />);
  expect(screen.queryByRole("slider")).not.toBeInTheDocument();
  const read = vi.mocked(createShaderRenderer).mock.calls[0][1] as () => ShaderCanvasProps;
  expect(read()).toMatchObject({ appearance: "pixel", renderScale: .4 });
  expect(screen.getByRole("img")).toHaveClass("drifting-clouds");
});
