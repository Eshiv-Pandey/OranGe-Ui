import { describe, expect, it } from "vitest";
import { MORPH_MEDIA_ICONS } from "../../components/ui/morph-icons-media";
import { MORPH_NAVIGATION_ICONS } from "../../components/ui/morph-icons-navigation";
import { compileMorphPath, morphEase, morphPathFrame } from "../../components/ui/morph-icon-motion";
import type { MorphIconPath } from "../../components/ui/morph-icon-geometry";

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
        const [firstOpacity, lastOpacity] = (path.opacity || [1, 1]).map((opacity, index) => path.draw?.[index] === 0 ? 0 : opacity);
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

  it("preserves the rigid shaft and chevron leg lengths throughout their turns", () => {
    const rigid = definitions.filter(icon => ["arrow", "chevron", "plus", "sort"].includes(icon.name));
    for (const icon of rigid) for (const source of icon.name === "sort" ? icon.paths.slice(0, 2) : icon.paths) {
      const path = compileMorphPath(source);
      const initial = coordinates(source.from);
      const lengths = (values: number[]) => Array.from({ length: values.length / 2 - 1 }, (_, index) => Math.hypot(values[index * 2 + 2] - values[index * 2], values[index * 2 + 3] - values[index * 2 + 1]));
      const expected = lengths(initial);
      expect(expected.every(length => length > 0), icon.name).toBe(true);
      for (const progress of [0, .125, .25, .375, .5, .625, .75, .875, 1]) {
        const frame = morphPathFrame(path, progress);
        lengths(coordinates(frame.d)).forEach((length, index) => expect(length, `${icon.name} at ${progress}`).toBeCloseTo(expected[index], 3));
        expect(frame.transform, icon.name).toMatch(/^rotate\(/);
        expect(frame.opacity, icon.name).toBe(1);
      }
    }
    const arrow = compileMorphPath(MORPH_NAVIGATION_ICONS.find(icon => icon.name === "arrow")!.paths[0]);
    expect(morphPathFrame(arrow, .5).transform).toBe("rotate(90 12 12)");
    const plus = compileMorphPath(MORPH_MEDIA_ICONS.find(icon => icon.name === "plus")!.paths[0]);
    expect(morphPathFrame(plus, .5).transform).toBe("rotate(22.5 12 12)");
  });

  it("routes geometry through authored keyframes while independent channels wait for their phases", () => {
    const path = compileMorphPath({
      from: "M0 0L4 0", to: "M0 8L4 8", geometryPhase: [.2, .8],
      keyframes: [{ at: .5, d: "M8 4L12 4" }],
      rotation: [0, 90], origin: [2, 4], rotationPhase: [.4, .6],
      opacity: [.2, 1], opacityPhase: [.6, .8],
      draw: [0, 1], drawPhase: [.4, .8],
    });
    expect(morphPathFrame(path, .2)).toEqual({ d: "M0 0L4 0", opacity: 0, transform: "rotate(0 2 4)", draw: 0 });
    const middle = morphPathFrame(path, .5);
    expect(coordinates(middle.d)).toEqual([8, 4, 12, 4]);
    expect(middle.transform).toBe("rotate(45 2 4)");
    expect(middle.draw).toBeCloseTo(.25);
    expect(middle.opacity).toBe(.2);
    expect(morphPathFrame(path, .9)).toEqual({ d: "M0 8L4 8", opacity: 1, transform: "rotate(90 2 4)", draw: 1 });
  });

  it("hides a fully withdrawn stroke so round caps cannot leave an anchor dot", () => {
    const path = compileMorphPath({ from: "M4 12L20 12", to: "M4 12L20 12", draw: [1, 0], drawPhase: [.1, .4] });
    expect(morphPathFrame(path, .1)).toEqual({ d: path.from, opacity: 1, draw: 1 });
    expect(morphPathFrame(path, .25).draw).toBeCloseTo(.5);
    expect(morphPathFrame(path, .4)).toEqual({ d: path.from, opacity: 0, draw: 0 });
    expect(morphPathFrame(path, 1).opacity).toBe(0);
  });

  it("rejects invalid phase, channel and keyframe data before it reaches SVG attributes", () => {
    const base = { from: "M0 0L4 4", to: "M2 2L8 8" };
    for (const name of ["geometryPhase", "opacityPhase", "rotationPhase", "drawPhase"] as const) {
      for (const phase of [[-.1, .5], [.2, 1.1], [.7, .2], [0, NaN]] as const) expect(() => compileMorphPath({ ...base, [name]: phase })).toThrow(/phases/);
    }
    for (const name of ["rotation", "origin", "opacity", "draw"] as const) expect(() => compileMorphPath({ ...base, [name]: [0, Infinity] })).toThrow(/finite/);
    for (const draw of [[-.1, 1], [0, 1.1]] as const) expect(() => compileMorphPath({ ...base, draw })).toThrow(/fraction/);
    const invalidFrames: NonNullable<MorphIconPath["keyframes"]>[] = [
      [{ at: 0, d: base.from }], [{ at: 1, d: base.to }], [{ at: NaN, d: base.to }],
      [{ at: .5, d: "M0 0Q1 1 2 2" }], [{ at: .5, d: "M0 0L1e309 1" }],
      [{ at: .5, d: base.from }, { at: .5, d: base.to }],
    ];
    for (const keyframes of invalidFrames) expect(() => compileMorphPath({ ...base, keyframes })).toThrow(/keyframe/i);
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
