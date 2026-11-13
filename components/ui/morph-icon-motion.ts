import type { MorphIconPath } from "./morph-icon-geometry";

const numbers = /[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:e[-+]?\d+)?/gi;
export type CompiledMorphPath = MorphIconPath & {
  start: readonly number[];
  end: readonly number[];
  parts: readonly string[];
};

export function compileMorphPath(path: MorphIconPath): CompiledMorphPath {
  const start = (path.from.match(numbers) || []).map(Number);
  const end = (path.to.match(numbers) || []).map(Number);
  const signature = (value: string) => value.replace(numbers, "#").replace(/\s/g, "");
  if (!start.length || start.length !== end.length || signature(path.from) !== signature(path.to) || [...start, ...end].some(value => !Number.isFinite(value))) {
    throw new Error("Morph paths must have matching commands and finite coordinates.");
  }
  return { ...path, start, end, parts: path.from.split(numbers) };
}

export function morphPathFrame(path: CompiledMorphPath, progress: number) {
  const p = Math.max(0, Math.min(1, Number.isFinite(progress) ? progress : 0));
  const d = p === 0 ? path.from : p === 1 ? path.to : path.parts.map((part, index) => part + (index < path.start.length ? Math.round((path.start[index] + (path.end[index] - path.start[index]) * p) * 1000) / 1000 : "")).join("");
  const [start, end] = path.opacity || [1, 1];
  return { d, opacity: start + (end - start) * p };
}

export const morphEase = (progress: number) => 1 - (1 - Math.max(0, Math.min(1, progress))) ** 3;
