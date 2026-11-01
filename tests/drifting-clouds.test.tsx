import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DriftingClouds } from "../components/ui/drifting-clouds";
import { clouds } from "../components/ui/shader-canvas/clouds";
import { cloudGeometry } from "../components/ui/shader-canvas/clouds-field";
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

it("keeps the connected cloud layout reproducible when previews use different seeds", () => {
  const first = cloudGeometry({ seed: 7 });
  const second = cloudGeometry({ seed: 31 });
  const again = cloudGeometry({ seed: 7 });
  expect(first).toEqual(again);
  expect(first.lobes).not.toEqual(second.lobes);
  expect(first.lobes).toHaveLength(84 * 4); expect(first.shapes).toHaveLength(84);
  expect(first.lobes.every(Number.isFinite)).toBe(true);
  for (let group = 0; group < 12; group++) {
    const root = group * 7 * 4;
    expect(first.lobes.slice(root, root + 4)).toEqual(second.lobes.slice(root, root + 4));
  }
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
