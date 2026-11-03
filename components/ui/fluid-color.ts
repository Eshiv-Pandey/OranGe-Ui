import { bounded } from "./interaction-utils";

export type FluidColor = { h: number; s: number; v: number; a: number };
export function hexToFluidColor(value: string, fallbackHue = 0): FluidColor | null {
  const match = /^#?([\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.exec(value.trim());
  if (!match) return null;
  const hex = match[1].length <= 4 ? [...match[1]].map((letter) => letter + letter).join("") : match[1];
  const [r, g, b] = [0, 2, 4].map((offset) => parseInt(hex.slice(offset, offset + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min;
  let h = fallbackHue;
  if (delta > 0) h = ((max === r ? (g - b) / delta : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4) * 60 + 360) % 360;
  return { h, s: max === 0 ? 0 : delta / max * 100, v: max * 100, a: hex.length === 8 ? parseInt(hex.slice(6), 16) / 255 : 1 };
}

export function fluidColorToHex(color: FluidColor) {
  const h = ((bounded(color.h, 0, 360) % 360) + 360) % 360, s = bounded(color.s, 0, 100) / 100, v = bounded(color.v, 0, 100) / 100;
  const chroma = v * s, x = chroma * (1 - Math.abs(h / 60 % 2 - 1)), m = v - chroma;
  const rgb = h < 60 ? [chroma, x, 0] : h < 120 ? [x, chroma, 0] : h < 180 ? [0, chroma, x] : h < 240 ? [0, x, chroma] : h < 300 ? [x, 0, chroma] : [chroma, 0, x];
  const byte = (value: number) => Math.round(value * 255).toString(16).padStart(2, "0");
  return "#" + rgb.map((channel) => byte(channel + m)).join("") + (color.a < .999 ? byte(bounded(color.a, 0, 1)) : "");
}
