// @vitest-environment node
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { build } from "vite";
import { unzipSync, strFromU8 } from "fflate";
import { afterAll, beforeAll, expect, it, vi } from "vitest";
import { components } from "../lib/components";
import { componentFiles, componentZip } from "../lib/source-bundle";
import { APPEARANCE_VALUES } from "../components/ui/appearance";

const reportDirectory = path.join(process.cwd(), "out/download-validation");
let directory: string;
const componentBatchSize = 4;
const compilerBatchSize = 25;
const batches = Array.from({ length: Math.ceil(components.length / componentBatchSize) }, (_, index) => components.slice(index * componentBatchSize, (index + 1) * componentBatchSize));
const completed: { compiledExamples: number; compiledAvatarUtilities: number; bundledEntries: number }[] = [];

beforeAll(async () => {
  await mkdir(reportDirectory, { recursive: true });
  directory = await mkdtemp(path.join(reportDirectory, "run-"));
});

afterAll(async () => {
  const compiledExamples = completed.reduce((sum, batch) => sum + batch.compiledExamples, 0);
  const compiledAvatarUtilities = completed.reduce((sum, batch) => sum + batch.compiledAvatarUtilities, 0);
  await writeFile(path.join(reportDirectory, "report.json"), JSON.stringify({ complete: completed.length === batches.length, components: components.length, appearances: APPEARANCE_VALUES.length, compiledExamples, bundledExamples: compiledExamples, compiledAvatarUtilities, bundledAvatarUtilities: compiledAvatarUtilities, diagnostics: 0, componentBatchSize, compilerBatchSize, extractedTo: path.relative(process.cwd(), directory) }, null, 2));
});

it("registers unique components and all five appearances", () => {
  expect(components.length).toBeGreaterThanOrEqual(35);
  expect(new Set(components.map((component) => component.slug)).size).toBe(components.length);
  expect(APPEARANCE_VALUES).toEqual(["polished", "pixel", "neobrutalism", "retro-os", "terminal"]);
});

// Each batch is an independent check with its own timeout. Catalogue growth
// adds checks without increasing one test's memory use or whole-suite timeout.
for (const batch of batches) it(`downloads, typechecks and bundles ${batch.map((component) => component.slug).join(", ")} in every appearance`, async () => {
  const examples: string[] = [];
  const avatarUtilities: string[] = [];
  for (const component of batch) for (const appearance of APPEARANCE_VALUES) {
    const files = unzipSync(await componentZip(component, appearance));
    const names = Object.keys(files); expect(names).toContain(component.file); expect(names).toContain("styles/tokens.css"); expect(names).toContain("styles/appearances.css"); expect(names).toContain("public/fonts/OFL-Geist.txt"); expect(names).toContain("public/fonts/OFL-PixelifySans.txt"); expect(names).toContain("LICENSE");
    if (component.slug.startsWith("avatar")) {
      for (const name of ["styles/avatar.css", "lib/avatar/types.ts", "lib/avatar/palettes.ts", "lib/avatar/glyphs.ts", "lib/avatar/generator.ts", "lib/avatar/render.ts", "lib/avatar/index.ts", "lib/avatar/png.ts"]) expect(names).toContain(name);
      const readme = strFromU8(files["README.md"]);
      for (const guidance of ["seed", "JSON.stringify(config)", "normalizeAvatarConfig", "React Server Components", "avatarToSvgString", "avatarToDataUrl", "./lib/avatar/png", "avatarToPng"]) expect(readme).toContain(guidance);
    }
    const example = strFromU8(files["Example.tsx"]); expect(example).toContain(`appearance="${appearance}"`);
    for (const [name, bytes] of Object.entries(files)) {
      expect(name).not.toContain(".."); expect(name).not.toContain(".env");
      const target = path.join(directory, component.slug, appearance, name); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes);
      if (name === "Example.tsx") examples.push(target);
      if (name === "lib/avatar/index.ts" || name === "lib/avatar/png.ts") avatarUtilities.push(target);
      if (/\.tsx?$/.test(name)) {
        const imports = ts.preProcessFile(strFromU8(bytes), true, true).importedFiles;
        for (const dependency of imports) {
          if (!dependency.fileName.startsWith(".")) continue;
          const resolved = path.posix.join(path.posix.dirname(name), dependency.fileName);
          expect([resolved, resolved + ".tsx", resolved + ".ts", resolved + "/index.ts", resolved + "/index.tsx"].some((candidate) => names.includes(candidate)), `${name} imports ${dependency.fileName}`).toBe(true);
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
  const entryPoints = [...examples, ...avatarUtilities];
  // Each ZIP has its own dependency copies. Bound compiler/bundler memory as
  // the catalogue grows while still checking every example and utility entry.
  function checkTypes(batch: string[]) {
    const program = ts.createProgram(batch, { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom", "node"] });
    return ts.getPreEmitDiagnostics(program).map((d) => `${d.file?.fileName}: ${ts.flattenDiagnosticMessageText(d.messageText, "\n")}`);
  }
  async function checkBundle(batch: string[]) {
    const bundle = await build({
      root: directory, configFile: false, logLevel: "error",
      esbuild: { jsx: "automatic" }, css: { postcss: { plugins: [] } },
      build: { write: false, minify: false, rollupOptions: { input: batch } },
    });
    if (!("output" in bundle)) throw new Error("Expected one bundle for the downloaded examples");
    const entryCount = bundle.output.filter((item) => item.type === "chunk" && item.isEntry).length;
    expect(entryCount).toBe(batch.length);
    return { entryCount, hasCss: bundle.output.some((item) => item.type === "asset" && item.fileName.endsWith(".css")) };
  }
  let bundledEntries = 0, hasCss = false;
  for (let offset = 0; offset < entryPoints.length; offset += compilerBatchSize) {
    const entries = entryPoints.slice(offset, offset + compilerBatchSize);
    expect(checkTypes(entries)).toEqual([]);
    const result = await checkBundle(entries);
    bundledEntries += result.entryCount;
    hasCss ||= result.hasCss;
  }
  expect(bundledEntries).toBe(entryPoints.length);
  expect(avatarUtilities).toHaveLength(batch.filter((component) => ["avatar", "avatar-group", "avatar-editor"].includes(component.slug)).length * APPEARANCE_VALUES.length * 2);
  expect(hasCss).toBe(true);
  completed.push({ compiledExamples: examples.length, compiledAvatarUtilities: avatarUtilities.length, bundledEntries });
}, 90_000);

it("follows a local directory entry and keeps dependency traversal inside permitted source folders", async () => {
  const reportDirectory = path.join(process.cwd(), "out/download-validation");
  await mkdir(reportDirectory, { recursive: true });
  const directory = await mkdtemp(path.join(reportDirectory, "resolver-"));
  const fixture = {
    "components/ui/fixture.tsx": 'import { tone } from "../../lib/avatar"; export function Fixture() { return tone; }',
    "lib/avatar/index.ts": 'export { tone } from "./value";',
    "lib/avatar/value.ts": 'export const tone = "orange";',
    "public/fonts/geist-latin.woff2": "font",
    "public/fonts/pixelify-sans-latin.woff2": "font",
    "public/fonts/OFL-Geist.txt": "font license",
    "public/fonts/OFL-PixelifySans.txt": "font license",
    LICENSE: "license",
  };
  for (const [name, contents] of Object.entries(fixture)) {
    const file = path.join(directory, name);
    await mkdir(path.dirname(file), { recursive: true });
    await writeFile(file, contents);
  }
  const component = { ...components[0], slug: "fixture", name: "Fixture", file: "components/ui/fixture.tsx", usage: "<Fixture />" };
  const cwd = vi.spyOn(process, "cwd").mockReturnValue(directory);
  try {
    const files = await componentFiles(component, "terminal");
    expect(Object.keys(files)).toEqual(expect.arrayContaining(["lib/avatar/index.ts", "lib/avatar/value.ts"]));
    await writeFile(path.join(directory, component.file), 'import "../../private"; export function Fixture() { return null; }');
    await expect(componentFiles(component, "terminal")).rejects.toThrow("Source dependency outside component folders");
  } finally {
    cwd.mockRestore();
  }
});
