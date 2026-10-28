import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { act } from "@testing-library/react";
import { Avatar } from "../components/ui/avatar";
import { generateAvatarConfig, getGlyphTone, normalizeAvatarColors, normalizeAvatarConfig } from "../lib/avatar/generator";
import { avatarPalettes } from "../lib/avatar/palettes";
import { avatarToDataUrl, avatarToSvgString } from "../lib/avatar/render";
import type { AvatarConfig } from "../lib/avatar/types";

afterEach(() => vi.unstubAllGlobals());

function svgDocument(source: string) {
  const parsed = new DOMParser().parseFromString(source, "image/svg+xml");
  expect(parsed.querySelector("parsererror")).toBeNull();
  return parsed;
}

describe("portable custom avatar colors", () => {
  it("canonicalizes two or three hex stops without mutating or retaining caller arrays", () => {
    const input = Object.freeze([" #AbC ", "#12DEef"]);
    const colors = normalizeAvatarColors(input);
    expect(colors).toEqual(["#aabbcc", "#12deef"]);
    expect(colors).not.toBe(input);
    expect(input).toEqual([" #AbC ", "#12DEef"]);
    expect(normalizeAvatarColors(["#FFF", "#123456", "#000"])).toEqual(["#ffffff", "#123456", "#000000"]);
  });

  it.each([
    null, undefined, false, {}, "#fff", [], ["#fff"], ["#fff", "#000", "#123", "#456"],
    ["#fff", null], ["#fff", 3], ["#fff", "#ffff"], ["#fff", "#ffffff80"],
    ["#fff", "red"], ["#fff", "ffffff"], ["#fff", "rgb(255,0,0)"],
    ["#fff", "url(https://example.test/paint)"], ["#fff", '<script>alert(1)</script>'],
    ["#fff", '#000" onload="alert(1)'], Array(2), ["#ggg", "#000"],
  ].map((customColors) => ({ customColors })))("rejects an invalid tuple atomically: $customColors", ({ customColors }) => {
    const original = generateAvatarConfig("invalid-custom-colors");
    expect(normalizeAvatarColors(customColors)).toBeUndefined();
    expect(normalizeAvatarConfig({ ...original, customColors })).toEqual(original);
  });

  it("round trips custom colors deterministically and strips unrelated saved data", () => {
    const candidate = { ...generateAvatarConfig("custom-round-trip"), customColors: ["#F70", "#DDF", "#bAd"], extra: "discard me" };
    const expected = normalizeAvatarConfig(candidate);
    expect(expected.customColors).toEqual(["#ff7700", "#ddddff", "#bbaadd"]);
    expect(expected).not.toHaveProperty("extra");
    const svg = avatarToSvgString(expected);
    const random = vi.spyOn(Math, "random").mockImplementation(() => { throw new Error("Randomness is forbidden during normalization"); });
    try {
      for (let count = 0; count < 100; count += 1) {
        const restored = normalizeAvatarConfig(JSON.parse(JSON.stringify(expected)));
        expect(restored).toEqual(expected);
        expect(restored.customColors).not.toBe(expected.customColors);
        expect(avatarToSvgString(restored)).toBe(svg);
      }
    } finally { random.mockRestore(); }
  });

  it("preserves every generated version-1 config and its original tone API", () => {
    for (let index = 0; index < avatarPalettes.length; index += 1) {
      const original = generateAvatarConfig(`legacy-${index}`);
      expect(normalizeAvatarConfig(original)).toEqual(original);
      expect(normalizeAvatarConfig(original)).not.toHaveProperty("customColors");
      expect(getGlyphTone(index, undefined)).toBe(getGlyphTone(index));
      expect(getGlyphTone(index, ["invalid", "colors"])).toBe(getGlyphTone(index));
    }
  });

  it("chooses a readable glyph from effective colors, including a changed palette fallback", () => {
    expect(getGlyphTone(0, ["#fff", "#eee"])).toBe("dark");
    expect(getGlyphTone(0, ["#000", "#111", "#222"])).toBe("light");
    const base = generateAvatarConfig("custom-tone");
    expect(normalizeAvatarConfig({ ...base, customColors: ["#fff", "#eee"], glyphTone: "light" }).glyphTone).toBe("dark");
    expect(normalizeAvatarConfig({ ...base, customColors: ["#000", "#111"], glyphTone: "dark" }).glyphTone).toBe("light");
    const restoredPalette = normalizeAvatarConfig({ ...base, palette: 2, customColors: undefined });
    expect(restoredPalette.glyphTone).toBe(getGlyphTone(2));
  });
});

describe("custom avatar rendering and export", () => {
  it("uses only sanitized stops and exports a deterministic settled frame", () => {
    const config = normalizeAvatarConfig({ ...generateAvatarConfig("custom-export"), customColors: ["#f70", "#aaf", "#dff"] });
    const source = avatarToSvgString(config, 128);
    const parsed = svgDocument(source);
    expect([...parsed.querySelectorAll('linearGradient[id$="-gradient"] stop')].map((stop) => stop.getAttribute("stop-color"))).toEqual(config.customColors);
    expect(parsed.querySelector(".avatar-gradient-shift")?.getAttribute("opacity")).toBe("0");
    expect(parsed.querySelector("animate, animateTransform, script, image, foreignObject, style")).toBeNull();
    expect(parsed.querySelector(".avatar-glyph-motion")?.hasAttribute("transform")).toBe(false);
    expect(decodeURIComponent(avatarToDataUrl(config, 128).split(",")[1])).toBe(source);
  });

  it("does not place untrusted custom color markup into an SVG", () => {
    const config = { ...generateAvatarConfig("untrusted-colors"), customColors: ['#fff"/><image href="https://example.test/"/>', "#000"] } as unknown as AvatarConfig;
    const source = avatarToSvgString(config);
    expect(source).not.toContain("https://example.test");
    expect(svgDocument(source).querySelector("script, image, foreignObject")).toBeNull();
  });

  it("keeps custom Avatar usable without browser globals during server rendering", () => {
    vi.stubGlobal("window", undefined);
    vi.stubGlobal("document", undefined);
    const config = normalizeAvatarConfig({ ...generateAvatarConfig("server-custom"), customColors: ["#ff5500", "#ffcc55"] });
    const markup = renderToString(<Avatar animate config={config} name="Custom profile" />);
    expect(markup).toContain('data-animate="true"');
    expect(markup).toContain('aria-label="Custom profile"');
    expect(markup).toContain('stop-color="#ff5500"');
    expect(renderToString(<Avatar config={config} />)).not.toContain("data-animate");
  });

  it("hydrates an animated custom Avatar without changing SVG data or IDs", async () => {
    const config = normalizeAvatarConfig({ ...generateAvatarConfig("hydrate-custom"), customColors: ["#ff7700", "#ffdd77"] });
    const tree = <><Avatar animate config={config} /><Avatar config={config} /></>;
    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = renderToString(tree);
    const before = host.innerHTML;
    const errors: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => { root = hydrateRoot(host, tree, { onRecoverableError: (error) => errors.push(error) }); });
      expect(errors).toEqual([]);
      expect(host.innerHTML).toBe(before);
      const ids = [...host.querySelectorAll("[id]")].map((element) => element.id);
      expect(new Set(ids).size).toBe(ids.length);
    } finally {
      await act(async () => { root?.unmount(); });
      host.remove();
    }
  });
});
