import { describe, expect, it } from "vitest";
import { STICKERS, STICKER_CATEGORIES, STICKER_FINISHES, stickerMarkup, stickerSvg } from "../components/ui/sticker-artwork";

describe("expanded sticker artwork", () => {
  it("keeps seventy distinct designs across the original six collections", () => {
    expect(STICKERS).toHaveLength(70);
    expect(new Set(STICKERS.map(sticker => sticker.name)).size).toBe(70);
    expect(new Set(STICKERS.map(sticker => sticker.body)).size).toBe(70);
    for (const category of STICKER_CATEGORIES) {
      expect(STICKERS.filter(sticker => sticker.category === category)).toHaveLength(category === "Everyday" ? 20 : 10);
    }
  });

  it("exports both editions as independent, self-contained, correctly labeled vectors", () => {
    const allMarkup = new Set<string>();
    for (const sticker of STICKERS) {
      expect(stickerMarkup(sticker.name)).toBe(stickerMarkup(sticker.name, "playful"));
      expect(stickerMarkup(sticker.name, "sharp")).not.toBe(stickerMarkup(sticker.name, "playful"));
      for (const finish of STICKER_FINISHES) {
        const svg = stickerSvg(sticker.name, 256, finish);
        const parsed = new DOMParser().parseFromString(svg, "image/svg+xml");
        expect(parsed.querySelector("parsererror"), `${sticker.name}/${finish}`).toBeNull();
        expect(parsed.documentElement.getAttribute("aria-label")).toBe(sticker.title);
        expect(parsed.documentElement.getAttribute("viewBox")).toBe("0 0 128 128");
        expect(parsed.documentElement.getAttribute("width")).toBe("256");
        expect(svg).not.toMatch(/<(?:script|image|text|foreignObject)|\bhref\s*=/i);
        const ids = [...parsed.querySelectorAll("[id]")].map(element => element.id);
        expect(new Set(ids).size).toBe(ids.length);
        for (const reference of svg.matchAll(/url\(#([^)]*)\)/g)) expect(ids).toContain(reference[1]);
        expect(parsed.querySelector(".orange-sticker-contour")?.getAttribute("stroke")).toBe("#171717");
        allMarkup.add(svg);
      }
    }
    expect(allMarkup.size).toBe(140);
  });
});
