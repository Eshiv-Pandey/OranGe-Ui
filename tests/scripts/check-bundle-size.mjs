import assert from "node:assert/strict";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const requested = process.argv[process.argv.indexOf("--build-id") + 1];
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
assert(process.argv.includes("--build-id") && requested === buildId, "Pass the current verified launch build ID");
const names = ["button", "avatar", "open-wheel-car", "markdown", "live-orb"];
const bundle = await build({
  resolve: { alias: { "@": process.cwd() } },
  configFile: false, logLevel: "error", esbuild: { jsx: "automatic" }, css: { postcss: { plugins: [] } },
  build: { write: false, minify: true, rollupOptions: {
    preserveEntrySignatures: "strict",
    input: Object.fromEntries(names.map((name) => [name, path.resolve(`components/ui/${name}.tsx`)])),
    external: (id) => /^react(?:-dom)?(?:\/|$)/.test(id),
    onwarn(warning, warn) { if (warning.code !== "MODULE_LEVEL_DIRECTIVE") warn(warning); },
  } },
});
assert(!Array.isArray(bundle) && "output" in bundle);
const chunks = new Map(bundle.output.filter((item) => item.type === "chunk").map((item) => [item.fileName, item]));
function reachable(entry, visited = new Set()) {
  if (visited.has(entry.fileName)) return visited;
  visited.add(entry.fileName);
  for (const dependency of entry.imports) if (chunks.has(dependency)) reachable(chunks.get(dependency), visited);
  return visited;
}
const entries = bundle.output.filter((item) => item.type === "chunk" && item.isEntry).map((entry) => {
  const included = [...reachable(entry)].map((name) => chunks.get(name));
  const modules = included.flatMap((chunk) => Object.keys(chunk.modules));
  if (entry.name === "button") assert(!modules.some((id) => /(?:live-orb|react-markdown|[\\/]three[\\/])/.test(id)), "Button must not pull in optional visual or Markdown engines");
  return { name: entry.name, minifiedBytes: included.reduce((sum, item) => sum + Buffer.byteLength(item.code), 0), gzipBytes: included.reduce((sum, item) => sum + gzipSync(item.code).length, 0), moduleCount: modules.length, chunks: included.map((item) => item.fileName) };
});
async function walk(directory) {
  const files = [];
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, item.name);
    if (item.isDirectory()) files.push(...await walk(name));
    else if (name.endsWith(".js")) { const bytes = await readFile(name); files.push({ name: path.relative(".next", name).replaceAll("\\", "/"), bytes: bytes.length, gzipBytes: gzipSync(bytes).length }); }
  }
  return files;
}
const appChunks = await walk(".next/static/chunks");
const report = { buildId, note: "Standalone entry totals exclude host React and React DOM. Next totals cover all emitted chunks, not one route's initial transfer.", standaloneEntries: entries, nextApp: { chunks: appChunks.length, bytes: appChunks.reduce((sum, item) => sum + item.bytes, 0), gzipBytes: appChunks.reduce((sum, item) => sum + item.gzipBytes, 0), largest: appChunks.sort((a, b) => b.gzipBytes - a.gzipBytes).slice(0, 10) } };
await mkdir("out/iteration", { recursive: true });
await writeFile("out/iteration/launch-bundle-report.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
