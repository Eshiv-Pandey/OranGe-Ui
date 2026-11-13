import type { MorphIconPath } from "./morph-icon-geometry";

const numbers = /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi;
export type CompiledMorphPath = MorphIconPath & {
  start: readonly number[];
  end: readonly number[];
  parts: readonly string[];
  frames: readonly { at: number; d: string; values: readonly number[] }[];
};

export function compileMorphPath(path: MorphIconPath): CompiledMorphPath {
  const start = (path.from.match(numbers) || []).map(Number);
  const end = (path.to.match(numbers) || []).map(Number);
  const signature = (value: string) => value.replace(numbers, "#").replace(/\s/g, "");
  if (!start.length || start.length !== end.length || signature(path.from) !== signature(path.to) || [...start, ...end].some(value => !Number.isFinite(value))) {
    throw new Error("Morph paths must have matching commands and finite coordinates.");
  }
  for (const phase of [path.geometryPhase, path.opacityPhase, path.rotationPhase, path.drawPhase]) {
    if (phase && (phase.some(value => !Number.isFinite(value) || value < 0 || value > 1) || phase[0] > phase[1])) throw new Error("Morph phases must be ordered fractions from zero to one.");
  }
  for (const channel of [path.rotation, path.origin, path.opacity, path.draw]) {
    if (channel?.some(value => !Number.isFinite(value))) throw new Error("Morph channels must use finite values.");
  }
  if (path.draw?.some(value => value < 0 || value > 1)) throw new Error("Stroke drawing must be a fraction from zero to one.");
  const frames = [{ at: 0, d: path.from, values: start }, ...(path.keyframes || []).map(frame => {
    const values = (frame.d.match(numbers) || []).map(Number);
    if (!Number.isFinite(frame.at) || frame.at <= 0 || frame.at >= 1 || signature(frame.d) !== signature(path.from) || values.length !== start.length || values.some(value => !Number.isFinite(value))) throw new Error("Morph keyframes need compatible paths and a position between zero and one.");
    return { ...frame, values };
  }), { at: 1, d: path.to, values: end }].sort((a, b) => a.at - b.at);
  if (frames.some((frame, index) => index > 0 && frame.at === frames[index - 1].at)) throw new Error("Morph keyframe positions must be unique.");
  return { ...path, start, end, parts: path.from.split(numbers), frames };
}

const channelProgress = (progress: number, phase: readonly [number, number] = [0, 1]) => progress <= phase[0] ? 0 : progress >= phase[1] ? 1 : (progress - phase[0]) / (phase[1] - phase[0]);
const interpolate = (values: readonly [number, number], progress: number) => values[0] + (values[1] - values[0]) * progress;

export function morphPathFrame(path: CompiledMorphPath, progress: number) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const geometry = channelProgress(p, path.geometryPhase);
  const nextIndex = path.frames.findIndex(frame => frame.at >= geometry);
  const next = path.frames[Math.max(0, nextIndex)], previous = path.frames[Math.max(0, nextIndex - 1)];
  const local = next.at === previous.at ? 0 : (geometry - previous.at) / (next.at - previous.at);
  const d = geometry === next.at ? next.d : path.parts.map((part, index) => part + (index < previous.values.length ? Math.round((previous.values[index] + (next.values[index] - previous.values[index]) * local) * 1000) / 1000 : "")).join("");
  const draw = path.draw ? interpolate(path.draw, channelProgress(p, path.drawPhase)) : undefined;
  const opacity = draw === 0 ? 0 : interpolate(path.opacity || [1, 1], channelProgress(p, path.opacityPhase));
  const transform = path.rotation ? `rotate(${interpolate(path.rotation, channelProgress(p, path.rotationPhase))} ${(path.origin || [12, 12]).join(" ")})` : undefined;
  return { d, opacity, ...(transform ? { transform } : {}), ...(draw !== undefined ? { draw } : {}) };
}

export const morphEase = (progress: number) => 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3;
