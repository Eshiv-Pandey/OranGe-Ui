// Pixel sizes, noise and thermal bands from the craft.wild.as canvas field.
export const WILD_CELL = 9;
export const WILD_BRUSH = 10;
export const WILD_COLORS = ["#1c2541", "#3b5bd9", "#f5c518", "#e0492a", "#d8ff00"];

export function wildColor(value: number) {
  if (value < 0.3) return null;
  if (value >= 0.86 && value < 1.02) return WILD_COLORS[4];
  if (value >= 0.78) return WILD_COLORS[3];
  if (value >= 0.62) return WILD_COLORS[2];
  if (value >= 0.46) return WILD_COLORS[1];
  return WILD_COLORS[0];
}

export function wildHash(column: number, row: number, seed: number) {
  const value = Math.sin(column * 127.1 + row * 311.7 + seed * 0.13) * 43758.5453;
  return value - Math.floor(value);
}

export function wildBase(nx: number, ny: number, time: number, seed: number) {
  nx += Math.sin(ny * 5 + time * 0.5 + seed) * 0.05;
  ny += Math.cos(nx * 5 - time * 0.4) * 0.05;
  const value =
    Math.sin(nx * 5.6 + seed * 1.3 + time * 0.3) *
      Math.cos(ny * 4.7 - seed * 0.7 + time * 0.22) +
    Math.sin((nx * 1.4 + ny * 1.7) * 4.1 - seed + time * 0.16) +
    Math.sin(ny * 9 + seed * 2.1 + nx * 3) * 0.5 +
    Math.sin(nx * 13 - seed * 1.7) * 0.28;
  return 0.5 + 0.5 * (value / 2.55);
}

export function wildRegion(nx: number, ny: number, time: number, seed: number) {
  return 0.5 + 0.5 * Math.sin(nx * 2.1 + time * 0.12 + seed * 0.7) *
    Math.cos(ny * 1.8 - time * 0.09 + seed * 0.3);
}

type HeatSampler = (x: number, y: number) => number;
let sampleHeat: HeatSampler | null = null;

export function setWildHeatSampler(sampler: HeatSampler | null) {
  sampleHeat = sampler;
}

// Section backgrounds combine their ambient field with the same cursor/click heat.
export function wildHeatAt(x: number, y: number) {
  return sampleHeat?.(x, y) ?? 0;
}
