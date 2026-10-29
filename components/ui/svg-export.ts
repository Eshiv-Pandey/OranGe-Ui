export type SvgExportOptions = {
  /** Explicit color values for generated SVG variables, never computed page CSS. */
  variables?: Readonly<Record<string, string>>;
  foreground?: string;
};
export type SvgPngOptions = SvgExportOptions & { width?: number; height?: number; background?: string };

function opaqueHex(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const hex = value.trim().toLowerCase();
  if (!/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/.test(hex)) return undefined;
  return hex.length === 4 ? "#" + [...hex.slice(1)].map((channel) => channel + channel).join("") : hex;
}

/** Normalize user-editable opaque colors before using them in SVG attributes. */
export function normalizeSvgColor(value: unknown, fallback = "#ff7700"): string {
  return opaqueHex(value) ?? opaqueHex(fallback) ?? "#ff7700";
}

/** Escape user-visible SVG text and attribute values. Use numeric/color helpers for those types. */
export function escapeSvgText(value: unknown, maximum = 80): string {
  return [...String(value ?? "")].filter((character) => character.charCodeAt(0) >= 32 || [9, 10, 13].includes(character.charCodeAt(0))).join("").slice(0, Math.max(0, Math.min(1000, maximum))).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character]!);
}

/** Consistent JSON ordering for copied and persisted normalized configurations. */
export function stableConfigJson(value: unknown): string {
  const json = JSON.stringify(value, (_key, item: unknown) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return item;
    return Object.fromEntries(Object.entries(item).sort(([first], [second]) => first < second ? -1 : first > second ? 1 : 0));
  }, 2);
  if (json === undefined) throw new Error("Configuration must be JSON serializable.");
  return json;
}

/**
 * Resolve colors and validate a trusted SVG renderer's settled output.
 * This is not a sanitizer for arbitrary third-party SVG documents.
 */
export function prepareSvgExport(source: string, { variables = {}, foreground = "#101015" }: SvgExportOptions = {}): string {
  if (typeof source !== "string" || source.length > 2_000_000 || !/^\s*<svg\b/i.test(source) || !/<\/svg>\s*$/i.test(source)) throw new Error("Export requires a standalone SVG document.");
  if (/<(?:script|foreignObject|image|iframe|object|embed|animate(?:Motion|Transform)?|set)\b/i.test(source) || /\son[a-z]+\s*=/i.test(source) || /<!DOCTYPE|<!ENTITY|<\?xml-stylesheet/i.test(source)) throw new Error("Export requires static SVG artwork without scripts or external content.");
  if (/\b(?:href|xlink:href)\s*=\s*["'](?!#)/i.test(source) || /@import\b|\banimation\s*:/i.test(source)) throw new Error("Export cannot depend on external files or animation.");
  const resolved = source.replace(/var\(\s*(--[a-z0-9_-]+)\s*(?:,\s*([^()]+))?\)/gi, (_match, name: string, fallback?: string) => {
    const color = opaqueHex(variables[name]) ?? opaqueHex(fallback);
    if (!color) throw new Error(`Choose an explicit export color for ${name}.`);
    return color;
  }).replace(/currentColor/gi, normalizeSvgColor(foreground, "#101015"));
  if (/var\s*\(/i.test(resolved) || [...resolved.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)].some((match) => !/^#[a-zA-Z0-9_-]+$/.test(match[2].trim()))) throw new Error("Export contains unresolved colors or an external resource.");
  if (!/\bxmlns\s*=\s*["']http:\/\/www\.w3\.org\/2000\/svg["']/i.test(resolved)) throw new Error("Export SVG is missing its namespace.");
  if (typeof DOMParser !== "undefined" && new DOMParser().parseFromString(resolved, "image/svg+xml").querySelector("parsererror")) throw new Error("The renderer produced an invalid SVG document.");
  return resolved;
}

const dimension = (value: number | undefined, fallback: number) => typeof value === "number" && Number.isFinite(value) ? Math.max(1, Math.min(4096, Math.round(value))) : fallback;

/** Browser-only PNG conversion; module import and SVG preparation remain SSR-safe. */
export async function svgToPng(source: string, options: SvgPngOptions = {}): Promise<Blob> {
  if (typeof document === "undefined" || typeof Image === "undefined" || typeof DOMParser === "undefined") throw new Error("PNG export requires a browser. Export SVG on the server.");
  const svg = prepareSvgExport(source, options);
  const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
  if (parsed.querySelector("parsererror") || parsed.documentElement.localName !== "svg") throw new Error("The renderer produced an invalid SVG document.");
  const viewBox = parsed.documentElement.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  const ratio = viewBox?.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0 ? viewBox[3] / viewBox[2] : 1;
  const width = dimension(options.width, 512);
  const height = dimension(options.height, dimension(width * ratio, width));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("PNG export requires a 2D canvas context.");
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("The SVG could not be decoded. Export SVG instead."));
      image.src = url;
    });
    if (options.background) {
      context.fillStyle = normalizeSvgColor(options.background, "#ffffff");
      context.fillRect(0, 0, width, height);
    }
    context.drawImage(image, 0, 0, width, height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("The browser could not encode the PNG.")), "image/png"));
  } finally { URL.revokeObjectURL(url); }
}

/** Download a generated asset and release its object URL after the browser receives it. */
export function downloadArtwork(blob: Blob, filename: string): void {
  if (typeof document === "undefined") throw new Error("Downloads require a browser.");
  const safeFilename = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(0, 120) || "artwork.svg";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = safeFilename;
  link.hidden = true;
  document.body.append(link);
  try { link.click(); }
  finally {
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}
