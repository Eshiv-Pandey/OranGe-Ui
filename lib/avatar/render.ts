import type { Appearance } from "../../components/ui/appearance";
import { AVATAR_TONE_COLORS, normalizeAvatarConfig } from "./generator";
import { avatarGlyphs } from "./glyphs";
import { avatarPalettes } from "./palettes";
import { AVATAR_SHAPES, type AvatarConfig, type AvatarShape } from "./types";

export type AvatarRenderOptions = {
  shape?: AvatarShape;
  appearance?: Appearance;
  /** Provide a unique namespace when embedding several exported SVG strings inline. */
  id?: string;
};

const shapePaths: Record<AvatarShape, string> = {
  squircle: "M50 0C93 0 100 7 100 50C100 93 93 100 50 100C7 100 0 93 0 50C0 7 7 0 50 0Z",
  circle: "M50 0A50 50 0 1 1 50 100A50 50 0 1 1 50 0Z",
  rounded: "M16 0H84Q100 0 100 16V84Q100 100 84 100H16Q0 100 0 84V16Q0 0 16 0Z",
  square: "M0 0H100V100H0Z",
};
const pixelPath = "M20 0H80V5H90V10H95V20H100V80H95V90H90V95H80V100H20V95H10V90H5V80H0V20H5V10H10V5H20Z";

function svgNamespace(id: string): string {
  // Encode underscores too, so escaped characters cannot collide with literal IDs.
  return `av-${Array.from(id).map((character) => /^[a-zA-Z0-9-]$/.test(character) ? character : `_${character.codePointAt(0)?.toString(16)}_`).join("")}`;
}

function dimension(size: number): number {
  return typeof size === "number" && Number.isFinite(size) ? Math.round(Math.min(4096, Math.max(1, size))) : 80;
}

function decimal(value: number): string {
  return String(Number(value.toFixed(6)));
}

/** Trusted, self-contained SVG children for a root with viewBox="0 0 100 100". */
export function avatarSvgBody(value: AvatarConfig, id: string, options: AvatarRenderOptions = {}): string {
  const config = normalizeAvatarConfig(value);
  const palette = avatarPalettes[config.palette];
  const glyph = avatarGlyphs.find((entry) => entry.id === config.glyph) ?? avatarGlyphs[0];
  const namespace = svgNamespace(id);
  const shape = options.shape && AVATAR_SHAPES.includes(options.shape) ? options.shape : config.shape;
  const pixel = options.appearance === "pixel";
  const outline = pixel ? pixelPath : shapePaths[shape];
  const tone = AVATAR_TONE_COLORS[config.glyphTone];
  const radians = config.angle * Math.PI / 180;
  const x = Math.cos(radians) * 50;
  const y = Math.sin(radians) * 50;
  const stops = palette.colors.map((color, index) => `<stop offset="${decimal(index / (palette.colors.length - 1))}" stop-color="${color}"/>`).join("");
  const definitions = [
    `<linearGradient id="${namespace}-gradient" x1="${decimal(50 - x)}%" y1="${decimal(50 - y)}%" x2="${decimal(50 + x)}%" y2="${decimal(50 + y)}%" color-interpolation="sRGB">${stops}</linearGradient>`,
    `<clipPath id="${namespace}-clip"><path d="${outline}"/></clipPath>`,
  ];
  const layers = [`<path d="${outline}" fill="url(#${namespace}-gradient)"/>`];

  if (config.depth !== "flat" || config.pattern === "halo") {
    definitions.push(`<radialGradient id="${namespace}-highlight" cx="${config.highlight}%" cy="0%" r="90%"><stop stop-color="#ffffff" stop-opacity="${config.pattern === "halo" ? "0.25" : "0.14"}"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>`);
    layers.push(`<path d="${outline}" fill="url(#${namespace}-highlight)"/>`);
  }

  if (config.pattern === "dots" || config.pattern === "grid") {
    const pattern = config.pattern === "dots" ? `<circle cx="2" cy="2" r="0.7" fill="${tone}"/>` : `<path d="M0 8V0H8" fill="none" stroke="${tone}" stroke-width="0.6"/>`;
    definitions.push(`<pattern id="${namespace}-pattern" width="8" height="8" patternUnits="userSpaceOnUse">${pattern}</pattern>`);
    layers.push(`<path d="${outline}" fill="url(#${namespace}-pattern)" opacity="0.09"/>`);
  }

  if (config.pattern === "noise") {
    const noiseSeed = config.palette * avatarGlyphs.length + avatarGlyphs.indexOf(glyph);
    definitions.push(`<filter id="${namespace}-noise" x="0" y="0" width="100%" height="100%" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="3" seed="${noiseSeed}" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>`);
    layers.push(`<path d="${outline}" filter="url(#${namespace}-noise)" opacity="0.055"/>`);
  }

  const raised = config.depth === "raised" && !pixel;
  if (raised) {
    definitions.push(`<filter id="${namespace}-shadow" x="-30%" y="-30%" width="160%" height="170%" color-interpolation-filters="sRGB"><feDropShadow dx="0" dy="1.5" stdDeviation="1.3" flood-color="#000000" flood-opacity="0.22"/></filter>`);
  }
  const inset = decimal((100 - config.glyphScale * 100) / 2);
  const scale = decimal(config.glyphScale * 100 / 64);
  layers.push(`<g fill="${tone}" fill-rule="evenodd" transform="translate(${inset} ${inset}) scale(${scale})"${raised ? ` filter="url(#${namespace}-shadow)"` : ""}>${glyph.paths.map((path) => `<path d="${path}"/>`).join("")}</g>`);

  if (options.appearance === "neobrutalism") {
    layers.push(`<path d="${outline}" fill="none" stroke="#101015" stroke-width="5"/>`);
  } else if (options.appearance === "retro-os") {
    definitions.push(`<linearGradient id="${namespace}-bevel" x2="0" y2="1"><stop stop-color="#ffffff" stop-opacity="0.8"/><stop offset="1" stop-color="#000000" stop-opacity="0.5"/></linearGradient>`);
    layers.push(`<path d="${outline}" fill="none" stroke="url(#${namespace}-bevel)" stroke-width="3"/>`);
  } else if (config.depth !== "flat" || options.appearance === "terminal") {
    layers.push(`<path d="${outline}" fill="none" stroke="${tone}" stroke-opacity="0.2" stroke-width="${options.appearance === "terminal" ? "2" : "1"}"/>`);
  }

  return `<defs>${definitions.join("")}</defs><g clip-path="url(#${namespace}-clip)">${layers.join("")}</g>`;
}

/** Standalone SVG for server rendering, email attachments, or local downloads. */
export function avatarToSvgString(config: AvatarConfig, size = 80, options: AvatarRenderOptions = {}): string {
  const pixels = dimension(size);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pixels}" height="${pixels}" viewBox="0 0 100 100" role="img" aria-label="Generated avatar">${avatarSvgBody(config, options.id ?? "export", options)}</svg>`;
}

export function avatarToDataUrl(config: AvatarConfig, size = 80, options: AvatarRenderOptions = {}): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(avatarToSvgString(config, size, options))}`;
}
