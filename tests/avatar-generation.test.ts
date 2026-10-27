import { afterEach, describe, expect, it, vi } from "vitest";
import { AVATAR_TONE_COLORS, DEFAULT_AVATAR_SEED, generateAvatarConfig, getGlyphTone, normalizeAvatarConfig } from "../lib/avatar/generator";
import { avatarGlyphs } from "../lib/avatar/glyphs";
import { avatarPalettes } from "../lib/avatar/palettes";
import { avatarSvgBody, avatarToDataUrl, avatarToSvgString } from "../lib/avatar/render";
import { avatarToPng } from "../lib/avatar/png";
import type { AvatarConfig } from "../lib/avatar/types";

afterEach(() => vi.unstubAllGlobals());

function parseSvg(svg: string): Document {
  const document = new DOMParser().parseFromString(svg, "image/svg+xml");
  expect(document.querySelector("parsererror")).toBeNull();
  return document;
}

describe("deterministic avatars", () => {
  it("returns identical config and SVG over 1,000 calls without ambient randomness", () => {
    const random = vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("Ambient randomness is forbidden"); });
    const seed = "profile:ಮಾವಿನ ಹಣ್ಣು 🍊";
    const config = generateAvatarConfig(seed);
    const svg = avatarToSvgString(config);
    for (let count = 0; count < 1000; count += 1) {
      expect(generateAvatarConfig(seed)).toEqual(config);
      expect(avatarToSvgString(generateAvatarConfig(seed))).toBe(svg);
    }
    random.mockRestore();
  });

  it("uses every palette and glyph across 10,000 seeds without full-config collisions", () => {
    expect(avatarPalettes.length).toBeGreaterThanOrEqual(60);
    expect(avatarGlyphs.length).toBeGreaterThanOrEqual(30);
    expect(new Set(avatarGlyphs.map((glyph) => glyph.id)).size).toBe(avatarGlyphs.length);
    const unique = new Set<string>();
    const palettes = new Map<number, number>();
    const glyphs = new Map<string, number>();
    const patterns = new Set<string>();
    const depths = new Set<string>();
    for (let seed = 1; seed <= 10000; seed += 1) {
      const config = generateAvatarConfig(`user-${seed}`);
      unique.add(JSON.stringify(config));
      palettes.set(config.palette, (palettes.get(config.palette) ?? 0) + 1);
      glyphs.set(config.glyph, (glyphs.get(config.glyph) ?? 0) + 1);
      patterns.add(config.pattern);
      depths.add(config.depth);
    }
    expect(unique.size).toBe(10000);
    expect(palettes.size).toBe(avatarPalettes.length);
    expect(glyphs.size).toBe(avatarGlyphs.length);
    // Each option must receive a useful share, beyond merely appearing once.
    expect(Math.min(...palettes.values())).toBeGreaterThan(75);
    expect(Math.min(...glyphs.values())).toBeGreaterThan(150);
    expect(patterns.size).toBe(5);
    expect(depths.size).toBe(3);
    expect(avatarPalettes.length * avatarGlyphs.length * 360 * 5 * 3 * 17 * 61).toBeGreaterThan(100000);
  });

  it("selects a tone with at least 3:1 contrast for every gradient", () => {
    // Independently sample evenly spaced stops rather than relying on generator internals.
    const rgb = (hex: string) => [0, 1, 2].map((index) => parseInt(hex.substring(1 + index * 2, 3 + index * 2), 16) / 255);
    const luminance = (channels: number[]) => channels.reduce((total, channel, index) => total + [0.2126, 0.7152, 0.0722][index] * (channel > 0.04045 ? ((channel + 0.055) / 1.055) ** 2.4 : channel / 12.92), 0);
    for (const [index, palette] of avatarPalettes.entries()) {
      const totals = [0, 0, 0];
      const samples = 1000;
      for (let sample = 0; sample < samples; sample += 1) {
        const position = ((sample + 0.5) / samples) * (palette.colors.length - 1);
        const segment = Math.floor(position);
        const progress = position - segment;
        const left = rgb(palette.colors[segment]);
        const right = rgb(palette.colors[segment + 1]);
        for (let channel = 0; channel < 3; channel += 1) totals[channel] += (left[channel] * (1 - progress) + right[channel] * progress) / samples;
      }
      const background = luminance(totals);
      const glyph = luminance(rgb(AVATAR_TONE_COLORS[getGlyphTone(index)]));
      const contrast = (Math.max(background, glyph) + 0.05) / (Math.min(background, glyph) + 0.05);
      expect(contrast, palette.name).toBeGreaterThanOrEqual(3);
      expect(normalizeAvatarConfig({ palette: index, glyphTone: getGlyphTone(index) === "dark" ? "light" : "dark" }).glyphTone).toBe(getGlyphTone(index));
    }
  });

  it("round trips portable configs and accepts empty and Unicode seeds", () => {
    for (const seed of ["", DEFAULT_AVATAR_SEED, "東京", "profile-🙂"]) {
      const config = generateAvatarConfig(seed);
      const saved: unknown = JSON.parse(JSON.stringify(config));
      expect(normalizeAvatarConfig(saved)).toEqual(config);
      expect(avatarToSvgString(normalizeAvatarConfig(saved))).toBe(avatarToSvgString(config));
      expect(JSON.stringify(config).length).toBeLessThan(230);
    }
  });

  it("bounds saved values, rejects unknown enums and removes unrelated data", () => {
    const fallback = generateAvatarConfig(DEFAULT_AVATAR_SEED);
    for (const invalid of [null, undefined, false, [], "test", 8, { version: 99 }]) expect(normalizeAvatarConfig(invalid)).toEqual(fallback);
    const saved = { version: 1, palette: 200, glyph: "<script>alert(1)</script>", angle: 900, pattern: "javascript:", shape: "\" onload=\"", depth: "<style>", glyphScale: -1, highlight: 120, onload: "alert(1)" };
    const config = normalizeAvatarConfig(saved);
    expect(config).toEqual({ ...fallback, palette: avatarPalettes.length - 1, glyphTone: getGlyphTone(avatarPalettes.length - 1), angle: 0, glyphScale: 0.5, highlight: 100 });
    expect(config).not.toHaveProperty("onload");
    expect(saved).toHaveProperty("onload", "alert(1)");
    expect(normalizeAvatarConfig({ palette: NaN, angle: Infinity, glyphScale: "0.8", highlight: -Infinity })).toEqual(fallback);
  });
});

describe("avatar exports", () => {
  it("produces valid standalone SVG and an equivalent data URL without DOM globals", () => {
    const config = generateAvatarConfig("server-export");
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const svg = avatarToSvgString(config, 128);
    const url = avatarToDataUrl(config, 128);
    expect(decodeURIComponent(url.split(",")[1])).toBe(svg);
    const parsed = parseSvg(svg);
    expect(parsed.documentElement.getAttribute("viewBox")).toBe("0 0 100 100");
    expect(parsed.documentElement.getAttribute("width")).toBe("128");
    expect(parsed.querySelectorAll("script, image, foreignObject, text")).toHaveLength(0);
    expect(avatarToSvgString(config, Infinity)).toContain('width="80"');
    expect(avatarToSvgString(config, 0)).toContain('width="1"');
  });

  it("keeps SVG references local, safely encoded, and unique for every instance", () => {
    const config = normalizeAvatarConfig({ ...generateAvatarConfig("namespace"), pattern: "noise", depth: "raised" });
    const ids = new Set<string>();
    for (const id of [":r0:", ":r1:", "_3a_r0_3a_", '\"><script>alert(1)</script>', ""]) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg">${avatarSvgBody(config, id)}</svg>`;
      const parsed = parseSvg(svg);
      expect(parsed.querySelector("script")).toBeNull();
      const localIds = [...parsed.querySelectorAll("[id]")].map((element) => element.id);
      for (const localId of localIds) {
        expect(ids.has(localId)).toBe(false);
        expect(localId).toMatch(/^[a-zA-Z][a-zA-Z0-9_-]*$/);
        ids.add(localId);
      }
      for (const reference of svg.matchAll(/url\(#([^)]*)\)/g)) expect(localIds).toContain(reference[1]);
    }
  });

  it("renders every glyph and pattern as safe SVG with stepped pixel masks", () => {
    const config = generateAvatarConfig("all-art");
    for (const glyph of avatarGlyphs) {
      const svg = avatarToSvgString({ ...config, glyph: glyph.id });
      expect(parseSvg(svg).querySelector("g[fill-rule=evenodd]")).not.toBeNull();
      expect(svg).toContain(glyph.paths[0]);
    }
    for (const pattern of ["none", "dots", "grid", "noise", "halo"] as const) {
      const parsed = parseSvg(avatarToSvgString({ ...config, pattern }));
      expect(parsed.querySelectorAll("linearGradient").length).toBeGreaterThan(0);
    }
    const smooth = parseSvg(avatarToSvgString(config, 80));
    const pixel = parseSvg(avatarToSvgString(config, 80, { appearance: "pixel" }));
    expect(smooth.querySelector("clipPath path")?.getAttribute("d")).toContain("C");
    expect(pixel.querySelector("clipPath path")?.getAttribute("d")).not.toMatch(/[ACQ]/);
    for (const appearance of ["polished", "neobrutalism", "retro-os", "terminal"] as const) {
      const parsed = parseSvg(avatarToSvgString(config, 80, { appearance, shape: "circle" }));
      expect(parsed.querySelector("clipPath path")?.getAttribute("d")).toContain("A50");
    }
  });

  it("never includes arbitrary saved markup in an export", () => {
    const untrusted = { glyph: '<image href="https://example.com/" onload="alert(1)"/>', palette: "url(https://example.com)", pattern: '<script>alert(1)</script>', angle: '0" onload="alert(1)' } as unknown as AvatarConfig;
    const svg = avatarToSvgString(untrusted, 90, { id: '\"><script>alert(1)</script>' });
    expect(svg).not.toContain("https://example.com");
    expect(svg).not.toContain("onload=");
    expect(parseSvg(svg).querySelector("script, image")).toBeNull();
  });

  it("rejects PNG conversion on the server with a useful error", async () => {
    vi.stubGlobal("document", undefined);
    await expect(avatarToPng(generateAvatarConfig("server-png"))).rejects.toThrow("PNG export requires a browser");
  });

  it("revokes the SVG object URL on PNG success and image decoding failure", async () => {
    const config = generateAvatarConfig("png");
    const png = new Blob(["png"], { type: "image/png" });
    const drawImage = vi.fn();
    const canvas = { width: 0, height: 0, getContext: () => ({ drawImage }), toBlob: (callback: BlobCallback) => callback(png) };
    const createObjectURL = vi.fn(() => "blob:avatar-preview");
    const revokeObjectURL = vi.fn();
    vi.stubGlobal("document", { createElement: () => canvas });
    vi.stubGlobal("URL", { createObjectURL, revokeObjectURL });
    let fail = false;
    vi.stubGlobal("Image", class {
      onload?: () => void;
      onerror?: () => void;
      set src(_value: string) { if (fail) this.onerror?.(); else this.onload?.(); }
    });
    await expect(avatarToPng(config, 192)).resolves.toBe(png);
    expect(drawImage).toHaveBeenCalledOnce();
    expect(canvas.width).toBe(192);
    expect(canvas.height).toBe(192);
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:avatar-preview");
    fail = true;
    await expect(avatarToPng(config)).rejects.toThrow("could not be loaded");
    expect(revokeObjectURL).toHaveBeenCalledTimes(2);
  });
});
