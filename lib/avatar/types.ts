export const AVATAR_PATTERNS = ["none", "dots", "grid", "noise", "halo"] as const;
export const AVATAR_SHAPES = ["squircle", "circle", "rounded", "square"] as const;
export const AVATAR_DEPTHS = ["flat", "soft", "raised"] as const;

export type AvatarPattern = typeof AVATAR_PATTERNS[number];
export type AvatarShape = typeof AVATAR_SHAPES[number];
export type AvatarDepth = typeof AVATAR_DEPTHS[number];
export type AvatarGlyphTone = "light" | "dark";
/** Two or three opaque sRGB stops. Saved values are normalized to #rrggbb. */
export type AvatarCustomColors = readonly [string, string] | readonly [string, string, string];

/** Versioned, portable display data. Store this object, never SVG markup, for a custom avatar. */
export type AvatarConfig = {
  version: 1;
  palette: number;
  /** Optional user colors override the palette without changing its saved index. */
  customColors?: AvatarCustomColors;
  glyph: string;
  angle: number;
  pattern: AvatarPattern;
  shape: AvatarShape;
  glyphTone: AvatarGlyphTone;
  depth: AvatarDepth;
  glyphScale: number;
  highlight: number;
};
