// @vitest-environment node
import { strFromU8 } from "fflate";
import { expect, it } from "vitest";
import { blocks, findBlock } from "../lib/blocks";
import { blockSource, blockRegistryItem } from "../lib/block-source";

it("places all new Bento compositions above the original in reference order", () => {
  expect(blocks.filter(block => block.category === "Bento").map(block => block.slug)).toEqual(["wildseed-bento", "current-bento", "revenue-bento", "studio-bento", "neon-bento", "bento-overview"]);
});

it("places the new Hero compositions before both existing openings", () => {
  expect(blocks.filter(block => block.category === "Hero").map(block => block.slug)).toEqual(["playground-hero", "oddkin-hero", "woven-hero", "neon-hero", "editorial-hero", "product-hero"]);
});

it("embeds the original woven material and preserves its attribution in registry installs", async () => {
  const entry = findBlock("woven-hero")!;
  const bundle = await blockSource(entry);
  expect(bundle.files["public/art/sections/woven-glow.webp"]).toBeDefined();
  expect(strFromU8(bundle.files["public/art/sections/NOTICE.md"])).toContain("No third-party reference pixels");
  const item = await blockRegistryItem(entry);
  expect(item.files.find(file => file.path.endsWith("hero-variants.tsx"))?.content).toContain("data:image/webp;base64,");
  expect(item.files.some(file => file.path.endsWith("SECTION_ARTWORK.md"))).toBe(true);
}, 30000);

it("ships original art and display fonts with complete portable installs", async () => {
  const entry = findBlock("wildseed-bento")!;
  const bundle = await blockSource(entry);
  expect(bundle.files["public/fonts/sections/barlow-condensed-900.woff2"]).toBeDefined();
  expect(bundle.files["public/fonts/sections/OFL-barlowcondensed.txt"]).toBeDefined();
  expect(bundle.files["public/art/footer/playful-colony-sprout.webp"]).toBeDefined();
  expect(bundle.files["public/art/footer/NOTICE.md"]).toBeDefined();
  const item = await blockRegistryItem(entry);
  expect(item.files.find(file => file.path.endsWith("section-visuals.tsx"))?.content).toContain("data:image/webp;base64,");
  expect(item.files.find(file => file.path.endsWith("section-materials.css"))?.content).toContain("data:font/woff2;base64,");
  expect(strFromU8(bundle.files["README.md"])).toContain("fictional");
}, 30000);


it("ships the neon border controls without the 404 billboard", async () => {
  for (const slug of ["neon-hero", "neon-bento"]) {
    const bundle = await blockSource(findBlock(slug)!);
    expect(bundle.files["components/ui/blocks/neon-borders.tsx"]).toBeDefined();
    expect(bundle.files["styles/neon-borders.css"]).toBeDefined();
    expect(bundle.files["components/ui/neon-sign-404.tsx"]).toBeUndefined();
  }
}, 30000);
