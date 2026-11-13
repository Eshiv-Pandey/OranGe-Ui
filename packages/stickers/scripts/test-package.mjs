import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import { buildPackage } from "./build.mjs";

const { packageRoot, repository, manifest } = await buildPackage();
const require = createRequire(path.join(repository, "package.json"));
const ts = require("typescript"), esbuild = require("esbuild");
const npmCli = process.env.npm_execpath || path.join(path.dirname(process.execPath), "node_modules/npm/bin/npm-cli.js");
if (!existsSync(npmCli)) throw new Error("Run this test with npm run test:package so npm_execpath is available");
const scratch = path.join(repository, ".codex-tmp/sticker-package-consumer");
if (!scratch.startsWith(repository + path.sep)) throw new Error("Consumer path escaped the worktree");
await rm(scratch, { recursive: true, force: true });
await mkdir(scratch, { recursive: true });
const destination = path.join(repository, "out/iteration/stickers/npm");
await mkdir(destination, { recursive: true });
const environment = { ...process.env, npm_config_cache: path.join(repository, ".codex-tmp/npm-cache") };
const npm = (args, cwd) => execFileSync(process.execPath, [npmCli, ...args], { cwd, env: environment, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const [packed] = JSON.parse(npm(["pack", "--ignore-scripts", "--json", "--pack-destination", destination], packageRoot));
const files = packed.files.map(file => file.path);
assert(files.includes("dist/index.js") && files.includes("dist/index.cjs") && files.includes("dist/index.d.ts"));
assert(files.includes("dist/index.d.cts"), "CommonJS declarations are missing");
assert(files.includes("styles.css") && files.includes("LICENSE"));
assert(!files.some(file => /HANDOFF|USER_INSTRUCTIONS|AGENTS|\.env|research|\.generated|scripts\//i.test(file)), "Tarball contains local-only files");
assert(Object.keys(manifest.dependencies || {}).length === 0, "Sticker runtime should only require its React peer");
await writeFile(path.join(scratch, "package.json"), JSON.stringify({ name: "sticker-consumer", private: true, type: "module" }, null, 2));
const tarball = path.join(destination, packed.filename);
let registryMetadata;
if (process.argv.includes("--registry")) {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(manifest.name)}/${manifest.version}`);
  assert(response.ok, `Published package metadata returned ${response.status}`);
  registryMetadata = await response.json();
  const integrity = `sha512-${createHash("sha512").update(await readFile(tarball)).digest("base64")}`;
  assert.equal(registryMetadata.dist.integrity, integrity, "Published package differs from the verified local tarball");
}
const installation = registryMetadata ? `${manifest.name}@${manifest.version}` : tarball;
npm(["install", installation, "--registry=https://registry.npmjs.org", "--ignore-scripts", "--legacy-peer-deps", "--no-audit", "--no-fund", "--package-lock=false"], scratch);
for (const dependency of ["react", "react-dom"]) {
  const installed = path.dirname(require.resolve(`${dependency}/package.json`));
  await symlink(installed, path.join(scratch, "node_modules", dependency), process.platform === "win32" ? "junction" : "dir");
}
const consumerRequire = createRequire(path.join(scratch, "package.json"));
const react = consumerRequire("react"), { renderToStaticMarkup } = consumerRequire("react-dom/server");
const cjs = consumerRequire(manifest.name);
const esm = await import(pathToFileURL(path.join(scratch, "node_modules", manifest.name, "dist/index.js")).href);
assert.deepEqual(cjs.STICKERS.map(sticker => sticker.name), esm.STICKERS.map(sticker => sticker.name));
assert(esm.STICKERS.length >= 50, "Catalogue was lost from the package");
for (const sticker of esm.STICKERS) {
  for (const finish of ["playful", "sharp"]) {
    const markup = renderToStaticMarkup(react.createElement(esm.Sticker, { name: sticker.name, finish, size: 120 }));
    assert(markup.includes("<svg") && markup.includes(sticker.title), `Failed package SSR: ${sticker.name}/${finish}`);
    const svg = esm.stickerSvg(sticker.name, 128, finish);
    assert(svg.startsWith("<svg") && !/href=|<script|<image|<text/i.test(svg), `Non-portable SVG: ${sticker.name}/${finish}`);
  }
}
assert.equal(typeof esm.OrbitSnailSticker, "function");
assert.equal(typeof cjs.OrbitSnailSticker, "function");
const css = await readFile(path.join(scratch, "node_modules", manifest.name, "styles.css"), "utf8");
assert(css.includes(".orange-sticker"));
assert(!/@font-face|url\(|--ui-|--font-|tailwind/i.test(css), "Package stylesheet depends on website assets or tokens");
for (const filename of ["index.js", "index.cjs"]) {
  const contents = await readFile(path.join(scratch, "node_modules", manifest.name, "dist", filename), "utf8");
  assert(contents.startsWith('"use client";'), `${filename} lost its React client boundary`);
  assert(!/next\/|library-base\.css|lucide-react|framer-motion/.test(contents), `${filename} includes site dependencies`);
}
const source = path.join(scratch, "consumer.tsx");
await writeFile(source, `import { Sticker, OrbitSnailSticker, type StickerName, type StickerFinish, type StickerMotion } from "${manifest.name}";
import "${manifest.name}/styles.css";
const name: StickerName = "orbit-snail";
const finish: StickerFinish = "sharp";
const motion: StickerMotion = "wiggle";
export const example = <Sticker name={name} finish={finish} motion={motion} duration={700} intensity={1.2} shadow interactive />;
export const named = <OrbitSnailSticker size={96} rotate={-8} />;
// @ts-expect-error Unknown artwork is rejected by the package's name union.
export const invalid = <Sticker name="not-an-orangeui-sticker" />;
`);
const options = {
  strict: true, skipLibCheck: true, noEmit: true, esModuleInterop: true,
  target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
  types: ["react"], typeRoots: [path.join(repository, "node_modules/@types")],
};
const diagnostics = ts.getPreEmitDiagnostics(ts.createProgram([source], options));
assert.equal(diagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(diagnostics, {
  getCanonicalFileName: name => name, getCurrentDirectory: () => scratch, getNewLine: () => "\n",
}));
for (const extension of ["mts", "cts"]) {
  const nodeConsumer = path.join(scratch, `node-consumer.${extension}`);
  await writeFile(nodeConsumer, `import { Sticker, type StickerName } from "${manifest.name}";\nconst name: StickerName = "orbit-snail";\nexport { Sticker, name };\n`);
  const nodeDiagnostics = ts.getPreEmitDiagnostics(ts.createProgram([nodeConsumer], {
    ...options, module: ts.ModuleKind.NodeNext, moduleResolution: ts.ModuleResolutionKind.NodeNext,
  }));
  assert.equal(nodeDiagnostics.length, 0, ts.formatDiagnosticsWithColorAndContext(nodeDiagnostics, {
    getCanonicalFileName: name => name, getCurrentDirectory: () => scratch, getNewLine: () => "\n",
  }));
}
const bundled = await esbuild.build({ entryPoints: [source], bundle: true, write: false, outdir: path.join(scratch, "bundle"), platform: "browser", jsx: "automatic", format: "esm", metafile: true, logLevel: "silent" });
assert(!Object.keys(bundled.metafile.inputs).some(file => /node_modules[\\/]next[\\/]/.test(file)), "Consumer pulled in Next.js");
const report = { package: `${manifest.name}@${manifest.version}`, stickers: esm.STICKERS.length, finishes: 2, tarball, packedFiles: files, esm: true, commonjs: true, declarations: true, nodeNextEsmTypes: true, nodeNextCommonJsTypes: true, reactConsumerBundle: true, isolatedInstall: true };
if (registryMetadata) {
  report.registryInstall = true;
  report.registryIntegrity = registryMetadata.dist.integrity;
  report.registryTarball = registryMetadata.dist.tarball;
}
if (process.argv.includes("--release")) {
  const releaseDirectory = path.join(repository, "public/downloads");
  await mkdir(releaseDirectory, { recursive: true });
  const release = path.join(releaseDirectory, packed.filename);
  await copyFile(tarball, release);
  report.publicDownload = release;
}
await writeFile(path.join(destination, "package-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
