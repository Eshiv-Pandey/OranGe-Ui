import { describe, expect, it } from "vitest";
import { MORPH_MEDIA_ICONS } from "../../components/ui/morph-icons-media";
import { MORPH_NAVIGATION_ICONS } from "../../components/ui/morph-icons-navigation";
import { compileMorphPath, morphEase, morphPathFrame } from "../../components/ui/morph-icon-motion";

const definitions = [...MORPH_NAVIGATION_ICONS, ...MORPH_MEDIA_ICONS];
const coordinates = (path: string) => (path.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi) || []).map(Number);
const commands = (path: string) => path.match(/[MLCQAZHVST]/gi)?.join("");

describe("morph path compilation and interpolation", () => {
  it("compiles every original state pair without changing endpoints or command topology", () => {
    expect(definitions).toHaveLength(40);
    expect(new Set(definitions.map(icon => icon.name)).size).toBe(40);
    for (const definition of definitions) {
      expect(definition.paths.length, definition.name).toBeGreaterThan(0);
      for (const path of definition.paths) {
        const compiled = compileMorphPath(path);
        expect(morphPathFrame(compiled, 0).d, definition.name).toBe(path.from);
        expect(morphPathFrame(compiled, 1).d, definition.name).toBe(path.to);
        const [firstOpacity, lastOpacity] = path.opacity || [1, 1];
        expect(morphPathFrame(compiled, 0).opacity).toBe(firstOpacity);
        expect(morphPathFrame(compiled, 1).opacity).toBe(lastOpacity);
        for (const progress of [.1, .25, .5, .75, .9]) {
          const frame = morphPathFrame(compiled, progress);
          const values = coordinates(frame.d);
          expect(commands(frame.d), definition.name).toBe(commands(path.from));
          expect(values, definition.name).toHaveLength(compiled.start.length);
          expect(values.every(Number.isFinite), definition.name).toBe(true);
          expect(frame.opacity).toBeGreaterThanOrEqual(0);
          expect(frame.opacity).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("interpolates negative and scientific coordinates without losing curve segments", () => {
    const path = compileMorphPath({ from: "M-4 2e1C0 2 6 8 10 12", to: "M4 4e1C10 12 16 18 20 22", opacity: [.2, .8] });
    const frame = morphPathFrame(path, .5);
    expect(coordinates(frame.d)).toEqual([0, 30, 5, 7, 11, 13, 15, 17]);
    expect(commands(frame.d)).toBe("MC");
    expect(frame.opacity).toBeCloseTo(.5);
  });

  it("rejects incompatible commands, missing coordinates and nonfinite coordinates", () => {
    expect(() => compileMorphPath({ from: "M0 0L1 1", to: "M0 0Q1 1 2 2" })).toThrow(/matching commands/);
    expect(() => compileMorphPath({ from: "M0 0L1 1", to: "M0 0L1" })).toThrow(/matching commands/);
    expect(() => compileMorphPath({ from: "Z", to: "Z" })).toThrow(/finite coordinates/);
    expect(() => compileMorphPath({ from: "M1e309 0L1 1", to: "M0 0L1 1" })).toThrow(/finite coordinates/);
  });

  it("bounds frame progress and keeps exponential easing monotonic", () => {
    const path = compileMorphPath({ from: "M0 0L4 4", to: "M2 2L8 8", opacity: [0, 1] });
    for (const invalid of [-1, NaN, Infinity]) expect(morphPathFrame(path, invalid)).toEqual({ d: path.from, opacity: 0 });
    expect(morphPathFrame(path, 2)).toEqual({ d: path.to, opacity: 1 });
    expect(morphEase(-1)).toBe(0);
    expect(morphEase(2)).toBe(1);
    const samples = Array.from({ length: 11 }, (_, index) => morphEase(index / 10));
    expect(samples[0]).toBe(0);
    expect(samples[10]).toBe(1);
    expect(samples.slice(1).every((sample, index) => sample >= samples[index])).toBe(true);
    expect(morphEase(.5)).toBeGreaterThan(.5);
  });
});
