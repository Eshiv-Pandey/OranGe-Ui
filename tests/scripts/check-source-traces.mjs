import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
const requested = process.argv[process.argv.indexOf("--build-id") + 1];
assert(process.argv.includes("--build-id") && requested === buildId, "Pass the current verified launch build ID");
const routes = [".next/server/app/api/components/[slug]/route.js.nft.json", ".next/server/app/r/[name]/route.js.nft.json"];
const reports = [];
for (const route of routes) {
  const trace = JSON.parse(await readFile(route, "utf8"));
  const files = trace.files.map((file) => path.relative(root, path.resolve(path.dirname(route), file)).replaceAll("\\", "/"));
  const source = files.filter((file) => !file.startsWith("node_modules/") && !file.startsWith(".next/"));
  assert(!source.some((file) => /^(?:out\/|references\/|\.git\/|\.env)/.test(file)), "Private or verification files must not enter route traces");
  const unexpected = source.filter((file) => !/^(?:components\/ui\/|lib\/avatar\/|styles\/|public\/fonts\/|public\/audio\/orangeui\/)/.test(file) && !["lib/utils.ts", "LICENSE", "THIRD_PARTY_NOTICES.md", "package.json"].includes(file));
  assert.equal(unexpected.length, 0, `Unexpected source files in ${route}: ${unexpected.join(", ")}`);
  for (const required of ["components/ui/live-orb.tsx", "components/ui/season-tree.tsx", "components/ui/styled-text.tsx", "lib/utils.ts", "styles/launch-forms.css", "public/fonts/geist-latin.woff2", "public/fonts/desi/yatra-one.woff2", "public/audio/orangeui/sunroom.wav", "public/audio/orangeui/CC0-1.0.txt", "LICENSE", "THIRD_PARTY_NOTICES.md"]) assert(source.includes(required), `${route} lacks ${required}`);
  reports.push({ route, tracedFiles: files.length, publicSourceFiles: source.length, source });
}
const report = { buildId, routes: reports };
await mkdir("out/iteration", { recursive: true });
await writeFile("out/iteration/launch-traces.json", JSON.stringify(report, null, 2));
console.log(JSON.stringify({ buildId, routes: reports.map(({ route, tracedFiles, publicSourceFiles }) => ({ route, tracedFiles, publicSourceFiles })) }, null, 2));
