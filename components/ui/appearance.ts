export const APPEARANCE_VALUES = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"] as const;

export type Appearance = (typeof APPEARANCE_VALUES)[number];

export const APPEARANCES = [
  { value: "polished", label: "Polished", description: "Soft corners, quiet borders, and smooth depth." },
  { value: "pixel", label: "Pixelated", description: "Stepped details, square controls, and pixel type." },
  { value: "neobrutalism", label: "Neobrutalism", description: "Bold outlines, solid shadows, and punchy orange." },
  { value: "retro-os", label: "Retro OS", description: "Beveled controls, window frames, and classic desktop details." },
  { value: "terminal", label: "Terminal", description: "Monospace type, precise lines, and orange command accents." },
] as const satisfies readonly { value: Appearance; label: string; description: string }[];

export function isAppearance(value: unknown): value is Appearance {
  return typeof value === "string" && APPEARANCE_VALUES.some((appearance) => appearance === value);
}

export function parseAppearance(value: unknown): Appearance {
  return isAppearance(value) ? value : "polished";
}

export type AppearanceProps = { appearance?: Appearance; className?: string };
export function uiClass(name: string, className?: string) {
  return ["ui", name, className].filter(Boolean).join(" ");
}
