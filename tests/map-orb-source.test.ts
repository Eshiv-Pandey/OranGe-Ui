// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8 } from "fflate";
import ts from "typescript";
import { expect, it } from "vitest";
import { findComponent } from "../lib/components";
import { collectComponentSource } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";

const evidence = path.resolve("out/iteration/map-orb/install");
async function compile(files: Readonly<Record<string, Uint8Array | string>>, folder: string, entry: string) {
  for (const [relative, contents] of Object.entries(files)) {
    const target = path.join(folder, relative);
    await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, contents);
  }
  const program = ts.createProgram([path.join(folder, entry)], { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom"] });
  expect(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, "\n"))).toEqual([]);
}

for (const slug of ["agent-map", "glyph-orb"]) it(`${slug} installs portable compiling ZIP and registry examples with its complete renderer`, async () => {
  const component = findComponent(slug)!;
  expect(component).toBeDefined();
  const bundle = await collectComponentSource(component, "polished");
  for (const relative of [component.file, `styles/${slug}.css`, "components/ui/creative-surface.ts", "styles/creative-surface.css", "Example.tsx", "README.md", "LICENSE"]) expect(bundle.files[relative]).toBeDefined();
  expect(bundle.files[`components/ui/${slug === "agent-map" ? "agent-map-geometry" : "glyph-orb-renderer"}.ts`]).toBeDefined();
  expect(bundle.dependencies).not.toContain("next"); expect(bundle.dependencies).not.toContain("framer-motion");
  for (const relative of Object.keys(bundle.files)) expect(relative).not.toMatch(/USER_INSTRUCTIONS|AGENTS|\.impeccable|library\/|\.env/);
  expect(strFromU8(bundle.files["Example.tsx"])).toContain('appearance="polished"');
  await compile(bundle.files, path.join(evidence, slug, "zip"), "Example.tsx");

  const registry = await componentRegistryItem(component, "polished");
  const files = Object.fromEntries(registry.files.map(file => [file.target.replace(/^~\//, ""), file.content]));
  expect(registry.files.some(file => file.target.endsWith(`styles/${slug}.css`))).toBe(true);
  for (const file of registry.files) expect(file.content).not.toMatch(/from ["']@\//);
  await compile(files, path.join(evidence, slug, "registry"), `orangeui/examples/${slug}.tsx`);
  if (slug === "agent-map") {
    expect(bundle.dependencies).toContain("lucide-react");
    expect(strFromU8(bundle.files[component.file])).toContain("© OpenStreetMap contributors");
    expect(registry.files.find(file => file.target.endsWith(component.file))?.content).toContain("https://www.openstreetmap.org/copyright");
    expect(strFromU8(bundle.files["README.md"])).toContain("tile usage policy");
  }
}, 60000);
