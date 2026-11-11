import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { STICKERS, STICKER_CATEGORIES, STICKER_FINISHES, stickerMarkup, stickerSvg } from "../components/ui/sticker-artwork";

describe("expanded sticker artwork", () => {
  it("retains the original fifty vectors and adds twenty distinct everyday designs", () => {
    // Frozen release artwork: the new edition must never silently replace the playful originals.
    expect(createHash("sha256").update(JSON.stringify(STICKERS.slice(0, 50))).digest("hex"))
      .toBe("7479ec242db75e5558b9d59341d99d914af541b466af38a922140238fd4ef03e");
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
        expect(svg).not.toMatch(/<(?:script|image|text|foreignObject)|\bid=|(?:href|url)\s*[=(]/i);
        allMarkup.add(svg);
      }
    }
    expect(allMarkup.size).toBe(140);
  });
});
