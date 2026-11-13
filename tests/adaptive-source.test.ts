// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import ts from "typescript";
import { expect, it } from "vitest";
import { components, componentCategories, findComponent } from "../lib/components";
import { ADAPTIVE_CARD_SPECS, ADAPTIVE_COMPONENT_SLUGS } from "../lib/adaptive-components";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { collectComponentSource, componentZip } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";

it("publishes three task cards and one explicit experiment, without standalone recipe entries", () => {
  expect(ADAPTIVE_COMPONENT_SLUGS).toEqual(["adaptive-input", "checklist-card", "focus-timer-card", "poll-card"]);
  expect(components.filter(component => component.category !== "Experimental")).toHaveLength(components.length - 1);
  expect(components.filter(component => component.category === "Experimental").map(component => component.slug)).toEqual(["adaptive-input"]);
  expect(findComponent("checklist-card")?.category).toBe("Inputs & forms");
  expect(findComponent("poll-card")?.category).toBe("Inputs & forms");
  expect(findComponent("focus-timer-card")?.category).toBe("Content & layout");
  expect(componentCategories).not.toContain("Adaptive inputs");
  for (const card of ADAPTIVE_CARD_SPECS.filter(card => !ADAPTIVE_COMPONENT_SLUGS.includes(card.slug))) {
    expect(findComponent(card.slug)).toBeUndefined();
    expect(components.some(component => component.slug === card.slug)).toBe(false);
  }
});

it("ships portable source, scoped styles and typed docs for every public appearance", async () => {
  for (const slug of ADAPTIVE_COMPONENT_SLUGS) for (const appearance of APPEARANCE_VALUES) {
    const component = findComponent(slug)!;
    const bundle = await collectComponentSource(component, appearance);
    for (const file of [component.file, "components/ui/adaptive/types.ts", "styles/adaptive-cards.css", "styles/library-base.css", "Example.tsx", "README.md"]) expect(bundle.files[file], slug + " " + file).toBeDefined();
    expect(bundle.dependencies).toContain("lucide-react");
    if (slug === "adaptive-input") expect(bundle.dependencies).toContain("framer-motion");
    const registry = await componentRegistryItem(component, appearance);
    expect(registry.files.some(file => file.path.endsWith("adaptive-cards.css"))).toBe(true);
    for (const file of registry.files) expect(file.content).not.toMatch(/from ["']@\//);
    expect(strFromU8(bundle.files["README.md"])).toContain(slug === "adaptive-input" ? "onSave" : "onChange");
    expect(strFromU8(bundle.files["README.md"])).toContain("## Typed props");
    if (slug === "adaptive-input") {
      expect(strFromU8(bundle.files["README.md"])).toContain("Experimental:");
      const zip = unzipSync(await componentZip(component, appearance));
      for (const card of ADAPTIVE_CARD_SPECS) {
        const file = "components/ui/" + card.slug + ".tsx";
        expect(zip[file], file + " remains a combined input dependency").toBeDefined();
        expect(registry.files.some(item => item.path === "orangeui/" + file)).toBe(true);
      }
    }
  }
}, 30000);

it("typechecks real extracted ZIPs at ES2020 and bundles the combined example without aliases", async () => {
  const roots: string[] = [];
  for (const slug of ADAPTIVE_COMPONENT_SLUGS) {
    const files = unzipSync(await componentZip(findComponent(slug)!, "polished"));
    const extracted = path.resolve(".impeccable/review/adaptive-cleanup/install", slug);
    for (const [relative, data] of Object.entries(files)) {
      const absolute = path.join(extracted, relative); await mkdir(path.dirname(absolute), { recursive: true }); await writeFile(absolute, data);
    }
    roots.push(path.join(extracted, "Example.tsx"));
  }
  const program = ts.createProgram(roots, { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom"] });
  expect(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, "\n"))).toEqual([]);
  const vite = await import("vite");
  const result = await vite.build({ root: path.dirname(roots[0]), configFile: false, logLevel: "error", esbuild: { jsx: "automatic", target: "es2020" }, css: { postcss: { plugins: [] } }, build: { write: false, minify: false, rollupOptions: { input: roots[0] } } });
  expect("output" in result && result.output.some(output => output.type === "chunk" && output.isEntry)).toBe(true);
}, 60000);
