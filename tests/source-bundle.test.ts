// @vitest-environment node
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { build } from "vite";
import { unzipSync, strFromU8 } from "fflate";
import { expect, it } from "vitest";
import { components } from "../lib/components";
import { componentZip } from "../lib/source-bundle";

it("every downloadable example includes its imports, CSS, licensed fonts and compiles independently", async () => {
  const examples: string[] = [];
  const reportDirectory = path.join(process.cwd(), "out/download-validation");
  await mkdir(reportDirectory, { recursive: true });
  const directory = await mkdtemp(path.join(reportDirectory, "run-"));
  expect(components).toHaveLength(32); expect(new Set(components.map((c) => c.slug)).size).toBe(32);
  for (const component of components) for (const appearance of ["polished", "pixel"] as const) {
    const files = unzipSync(await componentZip(component, appearance));
    const names = Object.keys(files); expect(names).toContain(component.file); expect(names).toContain("styles/tokens.css"); expect(names).toContain("public/fonts/OFL-Geist.txt"); expect(names).toContain("public/fonts/OFL-PixelifySans.txt"); expect(names).toContain("LICENSE");
    const example = strFromU8(files["Example.tsx"]); expect(example).toContain(`appearance="${appearance}"`);
    for (const [name, bytes] of Object.entries(files)) {
      expect(name).not.toContain(".."); expect(name).not.toContain(".env");
      const target = path.join(directory, component.slug, appearance, name); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes);
      if (name === "Example.tsx") examples.push(target);
      if (/\.tsx?$/.test(name)) {
        const imports = ts.preProcessFile(strFromU8(bytes), true, true).importedFiles;
        for (const dependency of imports) {
          if (!dependency.fileName.startsWith(".")) continue;
          const resolved = path.posix.join(path.posix.dirname(name), dependency.fileName);
          expect([resolved, resolved + ".tsx", resolved + ".ts"].some((candidate) => names.includes(candidate)), `${name} imports ${dependency.fileName}`).toBe(true);
        }
      }
      if (name.endsWith(".css")) {
        const css = strFromU8(bytes);
        for (const match of css.matchAll(/@import\s+["']([^"']+)["']/g)) expect(names).toContain(path.posix.join(path.posix.dirname(name), match[1]));
        for (const match of css.matchAll(/url\(["']?(\/fonts\/[^"')?]+)["']?\)/g)) expect(names).toContain("public" + match[1]);
      }
      if (name.startsWith("public/")) {
        const asset = path.join(directory, name);
        await mkdir(path.dirname(asset), { recursive: true });
        await writeFile(asset, bytes);
      }
    }
  }
  const program = ts.createProgram(examples, { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom", "node"] });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  expect(diagnostics.map((d) => `${d.file?.fileName}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`)).toEqual([]);
  const bundle = await build({
    root: directory,
    configFile: false,
    logLevel: "error",
    esbuild: { jsx: "automatic" },
    css: { postcss: { plugins: [] } },
    build: { write: false, minify: false, rollupOptions: { input: examples } },
  });
  if (!("output" in bundle)) throw new Error("Expected one bundle for the downloaded examples");
  const entries = bundle.output.filter((item) => item.type === "chunk" && item.isEntry);
  expect(entries).toHaveLength(examples.length);
  expect(bundle.output.some((item) => item.type === "asset" && item.fileName.endsWith(".css"))).toBe(true);
  await writeFile(path.join(reportDirectory, "report.json"), JSON.stringify({ components: 32, appearances: 2, compiledExamples: examples.length, bundledExamples: entries.length, diagnostics: diagnostics.length, extractedTo: path.relative(process.cwd(), directory) }, null, 2));
}, 120_000);
