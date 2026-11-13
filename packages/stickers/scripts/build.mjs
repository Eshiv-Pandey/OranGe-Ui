import { copyFile, mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repository = path.resolve(packageRoot, "../..");
const require = createRequire(path.join(repository, "package.json"));
const ts = require("typescript");
const esbuild = require("esbuild");
const sourceRoot = path.join(repository, "components/ui");
const generated = path.join(packageRoot, ".generated");
const dist = path.join(packageRoot, "dist");

async function resetBuildDirectory(directory) {
  if (!directory.startsWith(packageRoot + path.sep)) throw new Error("Build directory escaped the package");
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
}

export async function buildPackage() {
  await resetBuildDirectory(generated);
  await resetBuildDirectory(dist);
  const visited = new Set();
  async function copyModule(filename) {
    const absolute = path.resolve(filename);
    if (!absolute.startsWith(sourceRoot + path.sep)) throw new Error(`Package source escaped components/ui: ${filename}`);
    if (visited.has(absolute)) return;
    visited.add(absolute);
    let source = await readFile(absolute, "utf8");
    // Consumers load one explicit stylesheet; the package never loads website fonts or theme CSS.
    source = source.replace(/^import\s+["'][^"']+\.css["'];?\s*$/gm, "");
    const target = path.join(generated, path.relative(sourceRoot, absolute));
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, source);
    for (const imported of ts.preProcessFile(source, true, true).importedFiles) {
      if (!imported.fileName.startsWith(".")) continue;
      const basename = path.resolve(path.dirname(absolute), imported.fileName);
      const resolved = [basename + ".ts", basename + ".tsx", path.join(basename, "index.ts"), path.join(basename, "index.tsx")].find(existsSync);
      if (!resolved) throw new Error(`Cannot resolve package module ${imported.fileName}`);
      await copyModule(resolved);
    }
  }
  await copyModule(path.join(sourceRoot, "sticker-pack.tsx"));
  const entry = path.join(generated, "index.ts");
  await writeFile(entry, 'export * from "./sticker-pack";\n');
  const shared = {
    entryPoints: [entry], bundle: true, platform: "neutral", target: "es2020",
    jsx: "automatic", external: ["react", "react/*"], sourcemap: false,
    legalComments: "none", banner: { js: '"use client";' }, logLevel: "warning",
  };
  await Promise.all([
    esbuild.build({ ...shared, format: "esm", outfile: path.join(dist, "index.js") }),
    esbuild.build({ ...shared, format: "cjs", outfile: path.join(dist, "index.cjs") }),
  ]);
  const options = {
    strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022,
    module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    declaration: true, emitDeclarationOnly: true, noEmitOnError: true,
    outDir: dist, rootDir: generated, types: ["react"],
  };
  const program = ts.createProgram([entry], options);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  if (diagnostics.length) throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
    getCanonicalFileName: name => name, getCurrentDirectory: () => repository, getNewLine: () => "\n",
  }));
  const emitted = program.emit();
  if (emitted.emitSkipped) throw new Error("Package declaration emit was skipped");
  // NodeNext consumers need extension-aware declarations for both module systems.
  async function dualDeclarations(directory) {
    for (const item of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, item.name);
      if (item.isDirectory()) { await dualDeclarations(filename); continue; }
      if (!item.name.endsWith(".d.ts")) continue;
      const source = await readFile(filename, "utf8");
      const withExtensions = extension => source.replace(/(from\s+["'])(\.\.?\/[^"']+)(["'])/g, (_, prefix, module, suffix) => `${prefix}${module}${extension}${suffix}`);
      await writeFile(filename, withExtensions(".js"));
      await writeFile(filename.replace(/\.d\.ts$/, ".d.cts"), withExtensions(".cjs"));
    }
  }
  await dualDeclarations(dist);
  await copyFile(path.join(repository, "styles/sticker-pack.css"), path.join(packageRoot, "styles.css"));
  await copyFile(path.join(repository, "LICENSE"), path.join(packageRoot, "LICENSE"));
  const manifest = JSON.parse(await readFile(path.join(packageRoot, "package.json"), "utf8"));
  console.log(`Built ${manifest.name}@${manifest.version}: ESM, CommonJS, declarations and standalone CSS.`);
  return { packageRoot, repository, dist, manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await buildPackage();
