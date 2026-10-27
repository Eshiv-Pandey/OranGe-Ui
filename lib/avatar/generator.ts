import { avatarGlyphs } from "./glyphs";
import { avatarPalettes } from "./palettes";
import { AVATAR_DEPTHS, AVATAR_PATTERNS, AVATAR_SHAPES, type AvatarConfig, type AvatarGlyphTone } from "./types";

export const DEFAULT_AVATAR_SEED = "orangeui:guest";
export const AVATAR_TONE_COLORS = { light: "#ffffff", dark: "#101015" } as const;

/** FNV-1a over UTF-16 code units, kept stable for persisted seed identities. */
function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function channels(hex: string): number[] {
  return [1, 3, 5].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255);
}

function luminance(rgb: readonly number[]): number {
  const linear = rgb.map((channel) => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4);
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}

function contrast(first: number, second: number): number {
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Choose the more readable tone against the average of the evenly spaced sRGB stops. */
export function getGlyphTone(palette: number): AvatarGlyphTone {
  const colors = (avatarPalettes[palette] ?? avatarPalettes[0]).colors;
  const average = [0, 0, 0];
  for (let stop = 0; stop < colors.length; stop += 1) {
    // End stops cover half the area of an interior stop in a linear gradient.
    const weight = (stop === 0 || stop === colors.length - 1 ? 0.5 : 1) / (colors.length - 1);
    channels(colors[stop]).forEach((channel, index) => { average[index] += channel * weight; });
  }
  const background = luminance(average);
  return contrast(background, 1) >= contrast(background, luminance(channels(AVATAR_TONE_COLORS.dark))) ? "light" : "dark";
}

/** Generate portable display data without browser APIs, IO, or ambient randomness. */
export function generateAvatarConfig(seed: string): AvatarConfig {
  const random = seededRandom(hashSeed(seed));
  const palette = Math.floor(random() * avatarPalettes.length);
  return {
    version: 1,
    palette,
    glyph: avatarGlyphs[Math.floor(random() * avatarGlyphs.length)].id,
    angle: Math.floor(random() * 360),
    pattern: AVATAR_PATTERNS[Math.floor(random() * AVATAR_PATTERNS.length)],
    shape: "squircle",
    glyphTone: getGlyphTone(palette),
    depth: AVATAR_DEPTHS[Math.floor(random() * AVATAR_DEPTHS.length)],
    glyphScale: (70 + Math.floor(random() * 17)) / 100,
    highlight: 20 + Math.floor(random() * 61),
  };
}

const fallbackConfig = generateAvatarConfig(DEFAULT_AVATAR_SEED);
const glyphIds: ReadonlySet<string> = new Set(avatarGlyphs.map((glyph) => glyph.id));

function boundedNumber(value: unknown, fallback: number, minimum: number, maximum: number, precision = 0): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  const factor = 10 ** precision;
  return Math.round(Math.min(maximum, Math.max(minimum, value)) * factor) / factor;
}

function enumValue<T extends string>(value: unknown, values: readonly T[], fallback: T): T {
  return typeof value === "string" && values.includes(value as T) ? value as T : fallback;
}

/** Normalize saved JSON before rendering. Unknown fields never become SVG attributes. */
export function normalizeAvatarConfig(value: unknown): AvatarConfig {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ...fallbackConfig };
  const candidate = value as Record<string, unknown>;
  if (candidate.version !== undefined && candidate.version !== 1) return { ...fallbackConfig };
  const palette = boundedNumber(candidate.palette, fallbackConfig.palette, 0, avatarPalettes.length - 1);
  return {
    version: 1,
    palette,
    glyph: typeof candidate.glyph === "string" && glyphIds.has(candidate.glyph) ? candidate.glyph : fallbackConfig.glyph,
    angle: boundedNumber(candidate.angle, fallbackConfig.angle, 0, 360) % 360,
    pattern: enumValue(candidate.pattern, AVATAR_PATTERNS, fallbackConfig.pattern),
    shape: enumValue(candidate.shape, AVATAR_SHAPES, fallbackConfig.shape),
    glyphTone: getGlyphTone(palette),
    depth: enumValue(candidate.depth, AVATAR_DEPTHS, fallbackConfig.depth),
    glyphScale: boundedNumber(candidate.glyphScale, fallbackConfig.glyphScale, 0.5, 1, 3),
    highlight: boundedNumber(candidate.highlight, fallbackConfig.highlight, 0, 100),
  };
}
