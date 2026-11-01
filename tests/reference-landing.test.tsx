import { act, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { referenceCover, referenceSparkles } from "../components/landing/reference-scene-config";
import { ReferenceScene } from "../components/landing/reference-scene";

const renderer = vi.hoisted(() => ({ destroy: vi.fn(), setPaused: vi.fn() }));
vi.mock("../components/landing/reference-renderer", () => ({
  createReferenceRenderer: vi.fn((_canvas: HTMLCanvasElement, _config: unknown, onState: (state: string) => void) => { onState("webgl2"); return renderer; }),
}));

function pixels(width: number, height: number, channel: number) {
  const result = new Uint8ClampedArray(width * height * 4).fill(channel);
  for (let i = 3; i < result.length; i += 4) result[i] = 255;
  return result;
}

describe("reference scene image mapping", () => {
  it("keeps native reference coordinates and cover-fits without stretching", () => {
    expect(referenceCover(1199, 805)).toEqual({ scale: [1, 1], center: [.5, .5] });
    const portrait = referenceCover(390, 844), wide = referenceCover(1920, 1080);
    expect(portrait.scale[1]).toBe(1); expect(portrait.scale[0]).toBeLessThan(1);
    expect(wide.scale[0]).toBe(1); expect(wide.scale[1]).toBeLessThan(1);
    const screenPersonX = (.511 - portrait.center[0]) / portrait.scale[0] + .5;
    expect(screenPersonX).toBeCloseTo(.511, 2);
    expect(referenceCover(0, 0).scale.every(Number.isFinite)).toBe(true);
  });

  it("places a repeatable field on bright cloud pixels and excludes the protected person", () => {
    const width = 40, height = 40;
    const plate = pixels(width, height, 240), clouds = pixels(width, height, 255), person = pixels(width, height, 0);
    for (let y = 0; y < height; y++) for (let x = 16; x < 24; x++) person[(y * width + x) * 4] = 255;
    const positions = referenceSparkles(width, height, plate, clouds, person, 300);
    expect(positions.length).toBe(2100);
    expect(referenceSparkles(width, height, plate, clouds, person, 300)).toEqual(positions);
    for (let i = 0; i < positions.length; i += 7) {
      const x = Math.floor(positions[i] * width), y = Math.floor((1 - positions[i + 1]) * height);
      expect(person[(y * width + x) * 4]).toBe(0);
      expect(positions[i + 3]).toBeGreaterThan(0);
    }
  });

  it("does not create glitter on black, excluded or absent clouds", () => {
    const dark = pixels(8, 8, 0), light = pixels(8, 8, 255);
    expect(referenceSparkles(8, 8, dark, light, dark, 100)).toHaveLength(0);
    expect(referenceSparkles(8, 8, light, dark, dark, 100)).toHaveLength(0);
    expect(referenceSparkles(8, 8, light, light, light, 100)).toHaveLength(0);
    expect(referenceSparkles(8, 8, light, light, dark, -2)).toHaveLength(0);
  });

  it("rejects plain blue sky and confines particles to luminous cloud ridges below it", () => {
    const width = 40, height = 40;
    const plate = pixels(width, height, 0), clouds = pixels(width, height, 255), person = pixels(width, height, 0);
    for (let index = 0; index < plate.length; index += 4) { plate[index] = 130; plate[index + 1] = 170; plate[index + 2] = 220; }
    expect(referenceSparkles(width, height, plate, clouds, person, 100)).toHaveLength(0);
    // A bright upper-sky mark stays excluded. Only the actual cloud-edge row emits.
    for (const y of [3, 12]) for (let x = 0; x < width; x++) {
      const index = (y * width + x) * 4; plate[index] = plate[index + 1] = plate[index + 2] = 250;
    }
    const points = referenceSparkles(width, height, plate, clouds, person, 100);
    expect(points).toHaveLength(700);
    for (let index = 0; index < points.length; index += 7) expect(Math.floor((1 - points[index + 1]) * height)).toBe(12);
  });
});

describe("reference scene controls", () => {
  function motionPreference(initial: boolean) {
    const listeners = new Set<() => void>();
    const media = { matches: initial, addEventListener: (_event: string, listener: () => void) => listeners.add(listener), removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener) };
    vi.stubGlobal("matchMedia", vi.fn(() => media));
    return (reduced: boolean) => { act(() => { media.matches = reduced; listeners.forEach((listener) => listener()); }); };
  }

  it("server-renders a photographic fallback before effects or WebGL", () => {
    const html = renderToString(<ReferenceScene />);
    expect(html).toContain('class="reference-static"');
    expect(html).toContain('data-renderer="fallback"');
    expect(html.match(/<canvas/g)).toHaveLength(1);
  });

  it("pauses and resumes the same renderer, then releases it on unmount", () => {
    motionPreference(false); renderer.setPaused.mockClear(); renderer.destroy.mockClear();
    const { unmount } = render(<ReferenceScene />);
    fireEvent.click(screen.getByRole("button", { name: "Pause scene motion" }));
    expect(renderer.setPaused).toHaveBeenLastCalledWith(true);
    fireEvent.click(screen.getByRole("button", { name: "Play scene: resume motion" }));
    expect(renderer.setPaused).toHaveBeenLastCalledWith(false);
    unmount(); expect(renderer.destroy).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it("reflects a changing reduced-motion preference without exposing a misleading play control", () => {
    const setReduced = motionPreference(false);
    render(<ReferenceScene />);
    setReduced(true);
    expect(screen.getByRole("button", { name: "Still scene: reduced motion enabled" })).toBeDisabled();
    setReduced(false);
    expect(screen.getByRole("button", { name: "Pause scene motion" })).toBeEnabled();
    vi.unstubAllGlobals();
  });
});
