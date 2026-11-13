import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { ArcField } from "../components/ui/arc-field";
import { SatinFlow } from "../components/ui/satin-flow";
import { ContourTerrain } from "../components/ui/contour-terrain";
import { SignalLens } from "../components/ui/signal-lens";
import { arcFieldShader, satinFlowShader, contourTerrainShader, signalLensShader } from "../components/ui/atmosphere-shaders";

const modules = [arcFieldShader, satinFlowShader, contourTerrainShader, signalLensShader];
describe("original atmosphere components", () => {
  it.each([ArcField, SatinFlow, ContourTerrain, SignalLens])("server-renders identifiable fallback artwork and real foreground controls", Component => {
    const html = renderToStaticMarkup(<Component label="Custom background" interactive={false}><button type="button">Explore</button></Component>);
    expect(html).toContain('aria-label="Custom background"');
    expect(html).toContain('class="atmosphere-static"');
    expect(html).toContain("<svg");
    expect(html).toContain("Explore");
    expect(html).toContain('data-renderer="fallback"');
  });

  it("isolates fallback definitions and sanitizes invalid colors and dimensions", () => {
    const html = renderToStaticMarkup(<><ArcField color="url(https://example.com)" height={Infinity} seed={NaN} /><ArcField /><SatinFlow /><SignalLens /></>);
    const ids = [...html.matchAll(/<(?:filter|linearGradient|radialGradient) id="([^"]+)"/g)].map(match => match[1]);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toHaveLength(4);
    expect(html).not.toContain("url(https");
    expect(html).not.toMatch(/NaN|Infinity/);
    expect(html).toContain("height:420px");
  });

  it("caps each shader and keeps every uniform finite for malformed public props", () => {
    for (const shader of modules) {
      expect(shader.renderBudget!.maxPixels).toBeLessThanOrEqual(180000);
      expect(shader.renderBudget!.maxFps).toBe(24);
      for (const descriptor of Object.values(shader.uniforms)) {
        const result = descriptor.value({ speed: Infinity, seed: NaN, spread: NaN, folds: Infinity, drape: NaN, levels: Infinity, elevation: NaN, lineWidth: Infinity, curvature: NaN, density: Infinity });
        for (const value of Array.isArray(result) ? result : [result]) expect(Number.isFinite(value)).toBe(true);
      }
      expect(shader.uniforms.uSpeed.value({ speed: -50 })).toBe(0);
      expect(shader.uniforms.uSpeed.value({ speed: 50 })).toBe(2);
    }
  });
});
