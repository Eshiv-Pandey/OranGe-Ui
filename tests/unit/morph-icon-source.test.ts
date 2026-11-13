// @vitest-environment node
import { readFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { strFromU8, unzipSync } from "fflate";
import { expect, it } from "vitest";
import { APPEARANCE_VALUES } from "../../components/ui/appearance";
import * as icons from "../../components/ui/morphing-icons";
import { AUTONOMOUS_PREVIEWS } from "../../components/library/preview-card";
import { componentUsage, components, findComponent } from "../../lib/components";
import { componentRegistryItem } from "../../lib/component-registry";
import { componentZip } from "../../lib/source-bundle";

const coreFiles = [
  "components/ui/morphing-icons.tsx",
  "components/ui/morph-icon-geometry.ts",
  "components/ui/morph-icon-motion.ts",
  "components/ui/morph-icons-navigation.ts",
  "components/ui/morph-icons-media.ts",
];
const namedExportNames = Object.keys(icons).filter(name => /^[A-Z].+MorphIcon$/.test(name));

function expectResolvedImports(files: Record<string, Uint8Array | string>) {
  const names = Object.keys(files);
  for (const [name, value] of Object.entries(files)) {
    if (!/\.tsx?$/.test(name)) continue;
    const content = typeof value === "string" ? value : strFromU8(value);
    for (const dependency of ts.preProcessFile(content, true, true).importedFiles) {
      if (!dependency.fileName.startsWith(".")) continue;
      const resolved = path.posix.join(path.posix.dirname(name), dependency.fileName);
      expect([resolved, resolved + ".tsx", resolved + ".ts", resolved + "/index.ts", resolved + "/index.tsx"].some(candidate => names.includes(candidate)), `${name} imports ${dependency.fileName}`).toBe(true);
    }
  }
}

it("registers the collection and exposes all forty named controlled icons", async () => {
  const component = findComponent("morphing-icons")!;
  expect(components.filter(item => item.slug === component.slug)).toHaveLength(1);
  expect(component.name).toBe("MorphIcon");
  expect(component.file).toBe(coreFiles[0]);
  expect(component.customizerPreview).toBe(true);
  expect(icons.MORPH_ICONS).toHaveLength(40);
  expect(new Set(icons.MORPH_ICONS.map(icon => icon.name)).size).toBe(40);
  expect(namedExportNames).toHaveLength(40);
  for (const name of namedExportNames) expect(typeof icons[name as keyof typeof icons]).toBe("function");
  expect(await readFile("index.ts", "utf8")).toContain('export * from "./components/ui/morphing-icons";');
  expect(AUTONOMOUS_PREVIEWS.has(component.slug)).toBe(true);
});

it("generates a controlled Favorite example with valid toggle semantics in every appearance", () => {
  const component = findComponent("morphing-icons")!;
  for (const appearance of APPEARANCE_VALUES) {
    const example = componentUsage(component, appearance);
    expect(example).toContain('import { useState } from "react";');
    expect(example).toContain("const [favorite, setFavorite] = useState(false);");
    expect(example).toContain("aria-pressed={favorite}");
    expect(example).toContain("setFavorite(value => !value)");
    expect(example).toContain(`appearance="${appearance}" name="heart" active={favorite}`);
    expect(example).not.toMatch(/setInterval|setTimeout/);
    const syntax = ts.transpileModule(example, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX }, reportDiagnostics: true });
    expect(syntax.diagnostics).toEqual([]);
  }
});

it("ships complete, portable geometry and motion through both ZIP and registry", async () => {
  const component = findComponent("morphing-icons")!;
  const files = unzipSync(await componentZip(component, "polished"));
  for (const file of coreFiles) {
    expect(files[file], file).toBeDefined();
    const dependencies = ts.preProcessFile(strFromU8(files[file]), true, true).importedFiles;
    expect(dependencies.every(dependency => dependency.fileName.startsWith(".") || dependency.fileName === "react"), `${file} only imports React or bundled source`).toBe(true);
  }
  expect(files["components/ui/appearance.ts"]).toBeDefined();
  expect(files["LICENSE"]).toBeDefined();
  expect(Object.keys(files).some(name => /morph-icons-demo|AGENTS|USER_INSTRUCTIONS|\.local\.md|references|\.env/.test(name))).toBe(false);
  const source = strFromU8(files[coreFiles[0]]);
  for (const name of namedExportNames) expect(source).toContain(`${name} = named(`);
  expectResolvedImports(files);

  const registry = await componentRegistryItem(component, "polished");
  expect(registry.name).toBe("orangeui-morphing-icons");
  expect(registry.meta.source).toBe(`orangeui/${coreFiles[0]}`);
  for (const file of coreFiles) expect(registry.files.some(item => item.target === `~/orangeui/${file}`), file).toBe(true);
  const example = registry.files.find(file => file.path === "orangeui/examples/morphing-icons.tsx")!;
  expect(example.content).toContain('from "../components/ui/morphing-icons"');
  expect(example.content).toContain("active={favorite}");
  expectResolvedImports(Object.fromEntries(registry.files.map(file => [file.path.replace(/^orangeui\//, ""), file.content])));
  expect(registry.dependencies).not.toContain("next");
});
