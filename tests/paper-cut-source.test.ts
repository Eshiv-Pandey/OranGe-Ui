// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8 } from "fflate";
import ts from "typescript";
import { expect, it } from "vitest";
import { PAPER_CUT_COMPONENT } from "../lib/paper-cut-component";
import { collectComponentSource } from "../lib/source-bundle";
import { componentRegistryItem } from "../lib/component-registry";

it("ships original portable geometry, local CSS, fonts and a compiling React example", async () => {
  const root = path.resolve("out/iteration/cursor-reactive/install");
  const bundle = await collectComponentSource(PAPER_CUT_COMPONENT, "polished");
  for (const file of ["components/ui/paper-cut.tsx", "components/ui/paper-cut-art.ts", "styles/paper-cut.css", "Example.tsx", "LICENSE"]) expect(bundle.files[file]).toBeDefined();
  expect(bundle.dependencies).not.toContain("next");
  for (const [relative, bytes] of Object.entries(bundle.files)) {
    expect(relative).not.toMatch(/AGENTS|USER_INSTRUCTIONS|out\/|\.impeccable|pin\.jpg/);
    const target = path.join(root, relative); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes);
  }
  const source = strFromU8(bundle.files["components/ui/paper-cut-art.ts"]); expect(source).not.toContain("pinimg");
  const program = ts.createProgram([path.join(root, "Example.tsx")], { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom"] });
  expect(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, "\n"))).toEqual([]);
  const item = await componentRegistryItem(PAPER_CUT_COMPONENT, "polished");
  expect(item.files.some(file => file.target.endsWith("components/ui/paper-cut-art.ts"))).toBe(true);
  expect(item.files.map(file => file.content).join("\n")).toContain("data:font/woff2;base64,");
}, 60000);
