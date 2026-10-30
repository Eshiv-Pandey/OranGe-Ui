// @vitest-environment node
import { readFile } from "node:fs/promises";
import { strFromU8 } from "fflate";
import { expect, it } from "vitest";
import { components, componentsInCollection } from "../lib/components";
import { CREATIVE_COMPONENTS } from "../lib/creative-components";
import { collectComponentSource, CREATIVE_AUDIO_ASSETS, CREATIVE_FONT_ASSETS } from "../lib/source-bundle";
import { componentRegistryItem, registryAssetSource } from "../lib/component-registry";

it("registers exactly 84 unique components and keeps creative pieces in their intended collections", () => {
  expect(components).toHaveLength(84); expect(new Set(components.map(({ slug }) => slug)).size).toBe(84); expect(CREATIVE_COMPONENTS).toHaveLength(14);
  expect(componentsInCollection("pixel").filter((component) => component.collection).map(({ slug }) => slug)).toEqual(["season-tree"]);
  expect(componentsInCollection("retro-os").filter((component) => component.collection).map(({ slug }) => slug)).toEqual(["retro-player", "retro-camera"]);
  expect(componentsInCollection("polished").filter((component) => component.collection)).toHaveLength(11);
});
for (const component of CREATIVE_COMPONENTS) it("ships portable dependencies and a real example for " + component.name, async () => {
  const bundle = await collectComponentSource(component, component.collection!);
  expect(strFromU8(bundle.files[component.file])).toMatch(/^"use client";/);
  expect(strFromU8(bundle.files["Example.tsx"])).toContain("<" + component.name);
  expect(bundle.files["LICENSE"]).toBeDefined();
  expect(strFromU8(bundle.files["README.md"])).toContain("Creative collection");
  expect(Object.keys(bundle.files).some((name) => /USER_INSTRUCTIONS|AGENTS|reference-images|\.env/.test(name))).toBe(false);
  if (bundle.files["components/ui/creative-playlist.ts"]) {
    for (const file of CREATIVE_AUDIO_ASSETS) expect(bundle.files[file]).toBeDefined();
    expect(strFromU8(bundle.files[CREATIVE_AUDIO_ASSETS[0]].slice(0, 4))).toBe("RIFF");
    expect(strFromU8(bundle.files["public/audio/orangeui/LICENSE.txt"])).toContain("CC0 1.0");
  }
  if (bundle.files["components/ui/styled-text.tsx"]) {
    for (const file of CREATIVE_FONT_ASSETS) expect(bundle.files[file]).toBeDefined();
    expect(strFromU8(bundle.files[CREATIVE_FONT_ASSETS[0]].slice(0, 4))).toBe("wOF2");
    expect(strFromU8(bundle.files["public/fonts/desi/OFL-baloo-2.txt"])).toContain("SIL OPEN FONT LICENSE");
  }
}, 30_000);
it("embeds real display fonts and complete OFL credits in text registry installs", async () => {
  const component = CREATIVE_COMPONENTS.find(({ slug }) => slug === "hinglish-text")!;
  const item = await componentRegistryItem(component, "polished"), css = item.files.find(({ path }) => path.endsWith("styles/desi-text.css"))!.content;
  expect(css).not.toContain("/fonts/"); expect(css.match(/data:font\/woff2;base64/g)).toHaveLength(2);
  expect(item.files.some(({ path }) => path.endsWith("licenses/OFL-baloo-2.txt"))).toBe(true);
  expect(item.files.every(({ content }) => !content.includes("reference-images"))).toBe(true);
});
for (const slug of ["custom-stamp", "hindi-text", "hinglish-text"]) it("retains standalone image export fonts after registry installation of " + slug, async () => {
  const component = CREATIVE_COMPONENTS.find((item) => item.slug === slug)!;
  const item = await componentRegistryItem(component, component.collection!);
  const installedSource = item.files.find(({ path }) => path.endsWith(slug === "custom-stamp" ? "custom-stamp.tsx" : "styled-text.tsx"))!.content;
  expect(/["']\/fonts\/[^"']+\.woff2["']/.test(installedSource)).toBe(false);
  expect(installedSource.match(/data:font\/woff2;base64/g)?.length).toBe(slug === "custom-stamp" ? 1 : 2);
});
it("embeds asset values while preserving credit comments and caller-owned URLs", () => {
  const source = '// See public/audio/example.wav for credits.\nconst audio = "/audio/example.wav"; const font = \'/fonts/example.woff2\'; const custom = "/music/custom.wav";';
  const files = { "public/audio/example.wav": new Uint8Array([82, 73]), "public/fonts/example.woff2": new Uint8Array([119, 79]) };
  const result = registryAssetSource(source, files);
  expect(result).toContain("// See public/audio/example.wav for credits.");
  expect(result).toContain('const audio = "data:audio/wav;base64,Ukk="');
  expect(result).toContain('const font = "data:font/woff2;base64,d08="');
  expect(result).toContain('const custom = "/music/custom.wav"');
});
it("embeds original sample audio and carries its full CC0 legal text in player registry installs", async () => {
  const component = CREATIVE_COMPONENTS.find(({ slug }) => slug === "island-player")!, item = await componentRegistryItem(component, "polished");
  const source = item.files.find(({ path }) => path.endsWith("creative-playlist.ts"))!.content;
  expect(source.match(/data:audio\/wav;base64/g)).toHaveLength(3);
  expect(/\bsrc:\s*["']\/audio\/orangeui\//.test(source)).toBe(false);
  expect(item.files.some(({ path, content }) => path.endsWith("Orange-sessions-CC0-1.0.txt") && content.includes("Public License Fallback"))).toBe(true);
  expect(await readFile("public/audio/orangeui/sunroom.wav")).toHaveLength(24 * 22050 * 2 + 44);
}, 30_000);
