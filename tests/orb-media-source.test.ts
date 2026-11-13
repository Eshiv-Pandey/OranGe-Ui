// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8 } from "fflate";
import ts from "typescript";
import { expect, it } from "vitest";
import { findComponent } from "../lib/components";
import { collectComponentSource } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";
import { APPEARANCE_VALUES } from "../components/ui/appearance";

it("ships the corrected media components, typed transparency and Live Orb attribution portably", async () => {
  const roots: string[] = [];
  for (const slug of ["audio-orb", "mascot-avatar", "flowing-water", "film-strip"]) for (const appearance of APPEARANCE_VALUES) {
    const component = findComponent(slug)!;
    const bundle = await collectComponentSource(component, appearance);
    const registry = await componentRegistryItem(component, appearance);
    for (const file of registry.files) expect(file.content).not.toMatch(/from ["']@\//);
    if (slug === "audio-orb") {
      expect(strFromU8(bundle.files["components/ui/shader-canvas/types.ts"])).toContain("transparent?: boolean");
      expect(strFromU8(bundle.files["README.md"])).toContain("Live Orb");
      expect(strFromU8(bundle.files["THIRD_PARTY_NOTICES.md"])).toContain("https://www.23rd.dev/r/live-orb.json");
      expect(registry.files.some(file => file.path.endsWith("THIRD_PARTY_NOTICES.md"))).toBe(true);
    }
    if (appearance !== "polished") continue;
    const folder = path.resolve(".impeccable/review/orb-media-corrections/install", slug);
    for (const [file, content] of Object.entries(bundle.files)) {
      const target = path.join(folder, file); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, content);
    }
    roots.push(path.join(folder, "Example.tsx"));
  }
  const program = ts.createProgram(roots, { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom"] });
  expect(ts.getPreEmitDiagnostics(program).map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))).toEqual([]);
}, 60000);
