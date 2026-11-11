// @vitest-environment node
import { expect, it } from "vitest";
import { findComponent } from "../lib/components";
import { collectComponentSource } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";

it("includes the new switch and ribbon dependencies in downloadable source", async () => {
  for (const slug of ["wall-switch", "endless-film"]) {
    const component = findComponent(slug)!; expect(component).toBeDefined();
    const bundle = await collectComponentSource(component, "polished");
    expect(bundle.files[component.file]).toBeDefined(); expect(bundle.files[`styles/${slug}.css`]).toBeDefined();
    expect(bundle.files["Example.tsx"]).toBeDefined();
    if (slug === "endless-film") {
      expect(bundle.files["components/ui/endless-film-path.ts"]).toBeDefined();
      expect(bundle.files["public/photos/keepsakes/NOTICE.md"]).toBeDefined();
    }
  }
});

it("embeds local photos into the endless ribbon registry install", async () => {
  const registry = await componentRegistryItem(findComponent("endless-film")!, "polished");
  const photos = registry.files.find(file => file.path.endsWith("keepsake-photos.ts"))!;
  expect(photos.content).toContain("data:image/jpeg;base64,");
  expect(photos.content).not.toContain('"/photos/keepsakes/');
});
