// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import ts from "typescript";
import { expect, it } from "vitest";
import { ATMOSPHERE_COMPONENTS } from "../lib/atmosphere-components";
import { KINETIC_COMPONENTS } from "../lib/kinetic-components";
import { collectComponentSource, componentZip } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";

const evidence = path.resolve("out/iteration/creative-extension/install");
const entries = [...ATMOSPHERE_COMPONENTS, ...KINETIC_COMPONENTS];

function checkImports(files: Readonly<Record<string, Uint8Array | string>>, dependencies: readonly string[]) {
  const names = new Set(Object.keys(files));
  const resolve = (from: string, specifier: string) => {
    const relative = path.posix.normalize(path.posix.join(path.posix.dirname(from), specifier));
    expect([relative, `${relative}.tsx`, `${relative}.ts`, `${relative}/index.ts`, `${relative}/index.tsx`].some(candidate => names.has(candidate)), `${from} imports missing ${specifier}`).toBe(true);
  };
  for (const [relative, contents] of Object.entries(files)) {
    expect(relative).not.toMatch(/(?:^|\/)(?:\.env|AGENTS\.md|USER_INSTRUCTIONS\.md|\.impeccable|library|out)(?:\/|$)|HANDOFF\.local/);
    if (!/\.(?:tsx?|css)$/.test(relative)) continue;
    const text = typeof contents === "string" ? contents : strFromU8(contents);
    if (relative.endsWith(".css")) {
      for (const match of text.matchAll(/@import\s+(?:url\(\s*)?["']([^"']+)["']/g)) if (match[1].startsWith(".")) resolve(relative, match[1]);
      for (const match of text.matchAll(/url\(\s*["']?(\/fonts\/[^"')?]+)["']?\s*\)/g)) expect(names.has(`public${match[1]}`), `${relative} references missing font ${match[1]}`).toBe(true);
      continue;
    }
    for (const item of ts.preProcessFile(text, true, true).importedFiles) {
      const specifier = item.fileName;
      expect(specifier, `${relative} retains a project alias`).not.toMatch(/^@\//);
      expect(specifier, `${relative} depends on Next.js`).not.toMatch(/^next(?:\/|$)/);
      if (specifier.startsWith(".")) resolve(relative, specifier);
      else {
        const dependency = specifier.startsWith("@") ? specifier.split("/").slice(0, 2).join("/") : specifier.split("/")[0];
        if (!["react", "react-dom"].includes(dependency)) expect(dependencies, `${relative} imports undeclared ${dependency}`).toContain(dependency);
      }
    }
  }
}

async function compile(files: Readonly<Record<string, Uint8Array | string>>, folder: string, entry: string) {
  for (const [relative, contents] of Object.entries(files)) {
    const target = path.join(folder, relative);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, contents);
  }
  const program = ts.createProgram([path.join(folder, entry)], { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom"] });
  const diagnostics = ts.getPreEmitDiagnostics(program).map(item => `${item.file?.fileName ?? entry}${item.file && item.start !== undefined ? `:${item.file.getLineAndCharacterOfPosition(item.start).line + 1}` : ""}: ${ts.flattenDiagnosticMessageText(item.messageText, "\n")}`);
  expect(diagnostics, `Portable ES2020 compilation: ${entry}`).toEqual([]);
}

for (const component of entries) it(`${component.slug} ships complete ES2020 ZIP and relocated registry examples`, async () => {
  const bundle = await collectComponentSource(component, "polished");
  expect(bundle.dependencies).not.toContain("next");
  const archive = await componentZip(component, "polished");
  const zip = unzipSync(archive);
  expect(Object.keys(zip).sort()).toEqual(Object.keys(bundle.files).sort());
  for (const relative of [component.file, "Example.tsx", "README.md", "LICENSE", "styles/tokens.css", "styles/appearances.css"]) expect(zip[relative]).toBeDefined();
  if (ATMOSPHERE_COMPONENTS.some(entry => entry.slug === component.slug)) {
    for (const relative of ["components/ui/atmosphere-surface.tsx", "components/ui/atmosphere-shaders.ts", "components/ui/shader-canvas/renderer.ts", "styles/atmosphere-surfaces.css"]) expect(zip[relative]).toBeDefined();
  } else {
    expect(zip["styles/kinetic-components.css"]).toBeDefined();
    expect(zip["components/ui/kinetic-elements.tsx"]).toBeDefined();
  }
  expect(strFromU8(zip["Example.tsx"])).toContain('appearance="polished"');
  checkImports(zip, bundle.dependencies);
  await mkdir(path.join(evidence, component.slug), { recursive: true });
  await writeFile(path.join(evidence, component.slug, `${component.slug}.zip`), archive);
  await compile(zip, path.join(evidence, component.slug, "zip"), "Example.tsx");

  const registry = await componentRegistryItem(component, "polished");
  const files = Object.fromEntries(registry.files.map(file => [file.target.replace(/^~\//, ""), file.content]));
  expect(files[`orangeui/${component.file}`]).toBeDefined();
  expect(files[registry.meta.example]).toBeDefined();
  expect(files["orangeui/licenses/orangeui-LICENSE.txt"]).toBeDefined();
  expect(registry.dependencies).not.toContain("next");
  checkImports(files, registry.dependencies);
  await writeFile(path.join(evidence, component.slug, "registry.json"), JSON.stringify(registry, null, 2));
  await compile(files, path.join(evidence, component.slug, "registry"), registry.meta.example);
}, 60000);
