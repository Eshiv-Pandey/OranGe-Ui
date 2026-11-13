// @vitest-environment node
import { Buffer } from "node:buffer";
import { expect, it } from "vitest";
import { strFromU8 } from "fflate";
import { findComponent } from "../lib/components";
import { collectComponentSource, KEEPSAKE_PHOTO_ASSETS } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";
import { liquidMetal } from "../components/ui/shader-canvas/liquid-metal";

it('ships the film renderer, its dependency and licensed display font in portable installs', async () => {
  const component = findComponent('endless-film')!;
  const bundle = await collectComponentSource(component, 'polished');
  expect(bundle.files['components/ui/endless-film-renderer.ts']).toBeDefined();
  expect(bundle.dependencies).toContain('three');
  expect(bundle.devDependencies).toContain('@types/three');
  expect(bundle.files['public/fonts/film/cormorant-garamond-italic-latin.woff2']).toBeDefined();
  expect(strFromU8(bundle.files['public/fonts/film/OFL-cormorant-garamond.txt'])).toContain('SIL OPEN FONT LICENSE');
  const registry = await componentRegistryItem(component, 'polished');
  expect(registry.files.find(file => file.path.endsWith('endless-film.css'))?.content).toContain('data:font/woff2;base64,');
  expect(registry.files.find(file => file.path.endsWith('FILM_FONT_CREDITS.md'))?.content).toContain('Cormorant Garamond');
});

it("ships actual photographs and their license notes in gallery source archives", async () => {
  const bundle = await collectComponentSource(findComponent("journal-stack")!, "polished");
  expect(bundle.files["components/ui/portfolio/use-reduced-motion.ts"]).toBeDefined();
  for (const file of KEEPSAKE_PHOTO_ASSETS) expect(bundle.files[file], file).toBeDefined();
  expect([...bundle.files["public/photos/keepsakes/lake.jpg"].slice(0, 2)]).toEqual([255, 216]);
  expect(strFromU8(bundle.files["public/photos/keepsakes/NOTICE.md"])).toContain("https://unsplash.com/license");
  expect(strFromU8(bundle.files["README.md"])).toContain("Copy public/photos/keepsakes/");
});

it("embeds usable JPEGs in registry installs instead of depending on this server's public paths", async () => {
  const registry = await componentRegistryItem(findComponent("photo-garland")!, "polished");
  const photos = registry.files.find((file) => file.path.endsWith("keepsake-photos.ts"))!.content;
  expect(photos).not.toContain('"/photos/keepsakes/');
  const data = [...photos.matchAll(/data:image\/jpeg;base64,([A-Za-z0-9+/=]+)/g)]; expect(data).toHaveLength(12);
  for (const match of data) expect([...Buffer.from(match[1], "base64").subarray(0, 2)]).toEqual([255, 216]);
  expect(registry.files.find((file) => file.path.endsWith("KEEPSAKE_PHOTOS.md"))?.content).toContain("Unsplash");
});

it("caps metal rendering and normalizes invalid numeric shader settings", () => {
  expect(liquidMetal.renderBudget).toEqual({ maxPixels: 360_000, maxFps: 30 });
  expect(liquidMetal.uniforms.uRibbonCount.value({ ribbons: 100 })).toBe(5);
  expect(liquidMetal.uniforms.uSpeed.value({ speed: Number.NaN })).toBe(.35);
  expect(liquidMetal.uniforms.uRoughness.value({ roughness: -3 })).toBe(0);
});
