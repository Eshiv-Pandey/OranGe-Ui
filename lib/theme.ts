import type { Appearance } from "../components/ui/appearance";

export const DEFAULT_ACCENT = "#ff6a00";
export const ACCENT_PRESETS = [
  { name: "Orange", color: DEFAULT_ACCENT },
  { name: "Violet", color: "#8b5cf6" },
  { name: "Blue", color: "#2563eb" },
  { name: "Emerald", color: "#059669" },
  { name: "Rose", color: "#e11d48" },
] as const;
export function normalizeAccent(value: unknown): string {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value.toLowerCase() : DEFAULT_ACCENT;
}
const channels = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16));
function luminance(hex: string) {
  return channels(hex).map((channel) => { const value = channel / 255; return value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4; }).reduce((sum, value, index) => sum + value * [.2126, .7152, .0722][index], 0);
}
export function contrastRatio(a: string, b: string) { const values = [luminance(a), luminance(b)].sort((a, b) => b - a); return (values[0] + .05) / (values[1] + .05); }
function mix(from: string, to: string, amount: number) {
  const ends = channels(to);
  return "#" + channels(from).map((value, index) => Math.round(value + (ends[index] - value) * amount).toString(16).padStart(2, "0")).join("");
}
function readableAccent(accent: string, background: string, dark: boolean) {
  for (let step = 0; step <= 20; step++) {
    const candidate = mix(accent, dark ? "#ffffff" : "#000000", step / 20);
    if (contrastRatio(candidate, background) >= 4.5) return candidate;
  }
  return dark ? "#ffffff" : "#000000";
}
export function accentTokens(value: string, dark: boolean) {
  const accent = normalizeAccent(value);
  // Retro OS panels are the lowest-contrast neutral surface in each palette.
  const text = readableAccent(accent, dark ? "#1f1f1f" : "#e5e5e5", dark);
  const onPrimary = contrastRatio(accent, "#171717") >= 4.5 ? "#171717" : contrastRatio(accent, "#ffffff") >= 4.5 ? "#ffffff" : "#000000";
  return { "--primary": accent, "--primary-hover": mix(accent, onPrimary === "#ffffff" ? "#000000" : "#ffffff", .12), "--on-primary": onPrimary, "--primary-text": text, "--focus": text };
}
export function themeCss(accent: string, appearance: Appearance) {
  const block = (selector: string, dark: boolean) => `${selector} {\n${Object.entries(accentTokens(accent, dark)).map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`;
  const systemDark = block(':root:not([data-theme="light"])', true).split("\n").map((line) => `  ${line}`).join("\n");
  return `/* oRangeUi: set appearance="${appearance}" on your components. */\n${block(':root, [data-theme="light"], :root[data-theme="light"]', false)}\n\n@media (prefers-color-scheme: dark) {\n${systemDark}\n}\n\n${block('[data-theme="dark"], :root[data-theme="dark"]', true)}\n`;
}
