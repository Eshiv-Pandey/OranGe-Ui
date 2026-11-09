// @vitest-environment node
import { expect, it } from "vitest";
import { findComponent } from "../lib/components";
import { collectComponentSource } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";

it("packages all scene implementations, palette CSS and the licensed poster font", async () => {
  for (const slug of ["neon-sign-404", "chai-break-404", "pavilion-footer", "wall-switch"]) {
    const definition = findComponent(slug)!; expect(definition).toBeDefined();
    const bundle = await collectComponentSource(definition, "polished");
    expect(bundle.files[definition.file]).toBeDefined(); expect(bundle.files[`styles/${slug}.css`]).toBeDefined();
    expect(new TextDecoder().decode(bundle.files["Example.tsx"])).toContain(`import { ${definition.name} }`);
    expect(bundle.dependencies).not.toContain("next");
    if (slug === "wall-switch") {
      expect(bundle.files["components/ui/wall-switch-renderer.ts"]).toBeDefined();
      expect(bundle.dependencies).toContain("three");
    }
    if (slug === "chai-break-404") {
      expect(bundle.files["public/fonts/desi/yatra-one.woff2"]).toBeDefined();
      expect(bundle.files["public/fonts/desi/OFL-yatra-one.txt"]).toBeDefined();
      const item = await componentRegistryItem(definition, "polished");
      expect(item.files.find(file => file.path.endsWith("chai-break-404.css"))?.content).toContain("data:font/woff2;base64,");
    }
    expect(Object.keys(bundle.files).some(name => /references|USER_INSTRUCTIONS|AGENTS/.test(name))).toBe(false);
  }
});
