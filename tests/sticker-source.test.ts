// @vitest-environment node
import { expect, it } from "vitest";
import { strFromU8 } from "fflate";
import { findComponent } from "../lib/components";
import { collectComponentSource } from "../lib/source-bundle";

it("ships Substack, every new palette and the optional profile-card API", async () => {
  const bundle = await collectComponentSource(findComponent("sticker-social-icons")!, "polished");
  const presets = strFromU8(bundle.files["components/ui/portfolio/social-sticker-presets.ts"]);
  expect(presets).toContain("SiSubstack"); expect(presets).toContain('name: "Patreon"');
  expect(bundle.dependencies).toContain("react-icons");
  expect(strFromU8(bundle.files["styles/portfolio-social.module.css"])).toContain(".substack");
  expect(strFromU8(bundle.files["components/ui/portfolio/social-hover-card.tsx"])).toContain("platform?: string; badge?: string;");
});
