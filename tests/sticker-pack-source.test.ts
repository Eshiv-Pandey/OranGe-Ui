// @vitest-environment node
import { expect, it } from "vitest";
import { strFromU8 } from "fflate";
import { componentRegistryItem } from "../lib/component-registry";
import { collectComponentSource } from "../lib/source-bundle";
import { findComponent } from "../lib/components";
import { STICKERS } from "../components/ui/sticker-artwork";

it("installs all seventy designs, named exports, styles and the working example in both transports", async () => {
  const component = findComponent("sticker-pack")!;
  const bundle = await collectComponentSource(component, "polished");
  const source = strFromU8(bundle.files["components/ui/sticker-artwork.ts"]);
  for (const sticker of STICKERS) expect(source).toContain(`"${sticker.name}"`);
  expect(Object.keys(bundle.files)).toEqual(expect.arrayContaining([component.file, "components/ui/sticker-artwork.ts", "components/ui/sticker-contours.ts", "styles/sticker-pack.css", "LICENSE", "Example.tsx"]));
  expect(source).toContain('from "./sticker-contours"');
  expect(strFromU8(bundle.files["components/ui/sticker-contours.ts"])).toContain("export const STICKER_CONTOURS");
  expect(bundle.dependencies).toEqual([]);
  const registry = await componentRegistryItem(component, "polished");
  expect(registry.files.find(file => file.target === "~/orangeui/components/ui/sticker-artwork.ts")?.content).toContain('from "./sticker-contours"');
  expect(registry.files.find(file => file.target === "~/orangeui/components/ui/sticker-contours.ts")?.content).toContain("export const STICKER_CONTOURS");
  expect(registry.files.find(file => file.target === "~/orangeui/examples/sticker-pack.tsx")?.content).toContain('<Sticker appearance="polished" name="essential-heart"');
  expect(registry.files.some(file => /HANDOFF|USER_INSTRUCTIONS|AGENTS|research|pinterest/i.test(file.path))).toBe(false);
});
