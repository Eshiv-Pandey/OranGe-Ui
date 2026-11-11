import { render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import * as pack from "../components/ui/sticker-pack";

describe("original sticker pack", () => {
  it("provides fifty distinct designs and ten per collection", () => {
    expect(pack.STICKERS).toHaveLength(50);
    expect(new Set(pack.STICKERS.map(item => item.name)).size).toBe(50);
    expect(new Set(pack.STICKERS.map(item => item.body)).size).toBe(50);
    for (const category of pack.STICKER_CATEGORIES) expect(pack.STICKERS.filter(item => item.category === category)).toHaveLength(10);
    const named = Object.entries(pack).filter(([name, value]) => /^[A-Z].+Sticker$/.test(name) && typeof value === "function").map(([name, value]) => [name, value as ComponentType<pack.NamedStickerProps>] as const);
    expect(named).toHaveLength(50);
    expect(new Set(named.map(([, Component]) => renderToStaticMarkup(<Component size={96} />))).size).toBe(50);
  });
  it("labels artwork without adding a focus stop and supports decorative use", () => {
    const { rerender } = render(<pack.OrbitSnailSticker size={160} hoverPeel label="A slow little astronaut" />);
    expect(screen.getByRole("img", { name: "A slow little astronaut" })).not.toHaveAttribute("tabindex");
    rerender(<pack.OrbitSnailSticker decorative />);
    expect(screen.queryByRole("img")).toBeNull();
  });
  it("exports fifty parseable standalone SVGs without fonts, external assets or duplicate IDs", () => {
    for (const sticker of pack.STICKERS) {
      const svg = pack.stickerSvg(sticker.name, 512), parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
      expect(parsed.querySelector("parsererror"), sticker.name).toBeNull();
      expect(parsed.documentElement.getAttribute("viewBox")).toBe("0 0 128 128");
      expect(parsed.querySelectorAll("path").length).toBeGreaterThan(1);
      expect(svg).not.toMatch(/<(?:script|image|text|foreignObject)|\bid=|(?:href|url)\s*[=(]/i);
    }
    expect(pack.stickerSvg("orbit-snail", NaN)).toContain('width="512"');
    expect(pack.stickerSvg("orbit-snail", 99999)).toContain('width="4096"');
    expect(() => pack.getSticker("unknown" as pack.StickerName)).toThrow(RangeError);
  });
});
