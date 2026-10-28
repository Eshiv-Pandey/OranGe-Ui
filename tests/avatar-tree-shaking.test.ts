// @vitest-environment node
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import { runInNewContext } from "node:vm";
import { build, normalizePath } from "vite";
import { expect, it } from "vitest";
import { avatarPalettes } from "../lib/avatar/palettes";
import { avatarGlyphs } from "../lib/avatar/glyphs";

it("bundles a palette-only barrel import without glyph data or generator code", async () => {
  const output = path.resolve("out/download-validation");
  await mkdir(output, { recursive: true });
  const directory = await mkdtemp(path.join(output, "avatar-tree-shaking-"));
  const entry = path.join(directory, "palettes-only.ts");
  const barrel = normalizePath(path.resolve("lib/avatar/index.ts"));
  await writeFile(entry, `import { avatarPalettes } from ${JSON.stringify(barrel)}; export { avatarPalettes };`);
  const bundle = await build({
    configFile: false,
    logLevel: "error",
    build: {
      write: false,
      minify: false,
      lib: { entry, formats: ["cjs"], fileName: "palettes-only" },
    },
  });
  const results = Array.isArray(bundle) ? bundle : [bundle];
  const chunks = results.flatMap((result) => "output" in result ? result.output.filter((item) => item.type === "chunk") : []);
  expect(chunks).toHaveLength(1);
  const chunk = chunks[0];
  const renderedModules = Object.entries(chunk.modules).filter(([, moduleInfo]) => moduleInfo.renderedLength > 0).map(([id]) => normalizePath(id));
  const exported: { avatarPalettes?: unknown } = {};
  runInNewContext(chunk.code, { exports: exported });
  expect(exported.avatarPalettes).toEqual(avatarPalettes);
  for (const moduleName of ["glyphs", "generator", "render"]) {
    expect(renderedModules.some((id) => id.endsWith(`/lib/avatar/${moduleName}.ts`)), `${moduleName} must be removed from the palette consumer`).toBe(false);
  }
  for (const glyph of avatarGlyphs) {
    expect(chunk.code).not.toContain(glyph.id);
    expect(chunk.code).not.toContain(glyph.paths[0]);
  }
  expect(chunk.code).not.toContain("orangeui:guest");
  await mkdir("out/avatar", { recursive: true });
  await writeFile("out/avatar/tree-shaking.json", JSON.stringify({
    mode: "Vite production library bundle",
    imported: "avatarPalettes from lib/avatar/index.ts",
    bytes: Buffer.byteLength(chunk.code),
    paletteCount: avatarPalettes.length,
    renderedModules: renderedModules.map((id) => normalizePath(path.relative(process.cwd(), id))),
    excludedModules: ["glyphs.ts", "generator.ts", "render.ts"],
    runtimeDataMatches: true,
  }, null, 2) + "\n");
}, 30_000);
