// @vitest-environment node
import { strFromU8 } from "fflate";
import { expect, it } from "vitest";
import { blocks, findBlock } from "../lib/blocks";
import { blockSource, blockRegistryItem } from "../lib/block-source";

it("places all new Bento compositions above the original in reference order", () => {
  expect(blocks.filter(block => block.category === "Bento").map(block => block.slug)).toEqual(["wildseed-bento", "current-bento", "revenue-bento", "studio-bento", "neon-bento", "bento-overview"]);
});

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
