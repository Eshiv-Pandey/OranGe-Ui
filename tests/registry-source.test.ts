// @vitest-environment node
import { mkdir, readFile, symlink, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv";
import draft7Schema from "ajv/lib/refs/json-schema-draft-07.json";
import { strFromU8, unzipSync } from "fflate";
import { expect, it } from "vitest";
import { componentFiles, componentZip, collectComponentSource } from "../lib/source-bundle";
import { componentRegistryItem, registryBaseCss } from "../lib/component-registry";
import { font, withSourceFixture } from "./registry-fixture";

it("follows only approved aliases and publishes exact package dependencies", async () => {
  await withSourceFixture({
    "components/ui/fixture.tsx": 'import type { CSSProperties } from "react"; import { createPortal } from "react-dom"; import ReactMarkdown from "react-markdown"; import remarkGfm from "remark-gfm"; import { cn } from "@/lib/utils"; export { Child } from "@/components/ui/child"; import "../../styles/library-base.css"; export function Fixture() { return cn("sample"); }',
    "components/ui/child.tsx": 'export function Child() { return null; }', "lib/utils.ts": 'import { clsx } from "clsx"; export const cn = clsx;',
  }, async (_directory, component) => {
    const bundle = await collectComponentSource(component, "pixel");
    expect(bundle.dependencies).toEqual(["clsx", "react-markdown", "remark-gfm"]);
    const source = strFromU8(bundle.files[component.file]);
    expect(source).toContain('from "../../lib/utils"'); expect(source).toContain('from "./child"'); expect(source).not.toContain('from "@/');
    expect(Object.keys(bundle.files)).toContain("lib/utils.ts");
    const readme = strFromU8(bundle.files["README.md"]); expect(readme).toContain("npm install clsx react-markdown remark-gfm"); expect(readme).toContain("## Markdown dependencies");
    expect(Object.keys(bundle.files)).not.toContain("USER_INSTRUCTIONS.md"); expect(Object.keys(bundle.files)).not.toContain(".env");
  });
});

it("retains the ZIP layout and binary fonts while registry payloads embed fonts and preserve safe targets", async () => {
  await withSourceFixture({}, async (_directory, component) => {
    const zipped = unzipSync(await componentZip(component, "terminal"));
    expect(zipped["public/fonts/geist-latin.woff2"]).toEqual(font); expect(Object.keys(zipped)).toContain("Example.tsx");
    expect(strFromU8(zipped["styles/library-base.css"])).toContain("/fonts/geist-latin.woff2");
    const item = await componentRegistryItem(component, "terminal");
    expect(item.type).toBe("registry:item"); expect(item.meta.appearance).toBe("terminal");
    expect(item.files.every((file) => file.type === "registry:file" && file.target.startsWith("~/orangeui/") && !file.target.includes(".."))).toBe(true);
    expect(item.files.some((file) => file.path.endsWith(".woff2"))).toBe(false);
    const base = item.files.find((file) => file.path === "orangeui/styles/library-base.css")!;
    expect(base.content).not.toContain("/fonts/"); expect(base.content.match(/data:font\/woff2;base64,/g)).toHaveLength(2);
    expect(base.content).toContain(Buffer.from(font).toString("base64")); expect(base.content).toContain('@import "./tokens.css"');
    const example = item.files.find((file) => file.path === "orangeui/examples/fixture.tsx")!;
    expect(example.content).toContain('from "../components/ui/fixture"'); expect(example.content).toContain('appearance="terminal"');
    expect(item.files.find((file) => file.path === "orangeui/licenses/orangeui-LICENSE.txt")?.content).toContain("Complete source MIT license");
    expect(item.files.find((file) => file.path === "orangeui/licenses/OFL-Geist.txt")?.content).toBe("Complete OFL Geist notice\nCopyright fixture\n");
    expect(item.docs).toContain('./orangeui/components/ui/fixture');
    const schema = JSON.parse(await readFile(fileURLToPath(new URL("./fixtures/registry-item.schema.json", import.meta.url)), "utf8"));
    const ajv = new Ajv({ allErrors: true });
    // Ajv 6 registers HTTP; the official registry schema references HTTPS.
    ajv.addMetaSchema(draft7Schema, "https://json-schema.org/draft-07/schema#");
    const validate = ajv.compile(schema);
    expect(validate(item), JSON.stringify(validate.errors)).toBe(true);
  });
});

it("carries the full LiveOrb notice through transitive bundles and registry entries", async () => {
  const notice = "# Third-party notices\n\nLiveOrb attribution\nMIT License\nCopyright original author\nPermission is hereby granted ...\nTHE SOFTWARE IS PROVIDED AS IS.\n";
  await withSourceFixture({
    "components/ui/fixture.tsx": 'export { LiveOrb as Fixture } from "./live-orb";',
    "components/ui/live-orb.tsx": 'import { cn } from "@/lib/utils"; import "../../styles/library-base.css"; export function LiveOrb() { return cn("orb"); }',
    "lib/utils.ts": 'export function cn(value: string) { return value; }', "THIRD_PARTY_NOTICES.md": notice,
  }, async (_directory, component) => {
    const files = await componentFiles(component, "polished"); expect(strFromU8(files["THIRD_PARTY_NOTICES.md"])).toBe(notice);
    expect(strFromU8(files["README.md"])).toContain("including its attribution and complete MIT permission notice");
    const registry = await componentRegistryItem(component, "polished");
    expect(registry.files.find((file) => file.target === "~/orangeui/licenses/THIRD_PARTY_NOTICES.md")?.content).toBe(notice);
  });
});

it("does not add a third-party notice to unrelated components", async () => {
  await withSourceFixture({ "THIRD_PARTY_NOTICES.md": "LiveOrb attribution" }, async (_directory, component) => {
    expect(Object.keys(await componentFiles(component, "polished"))).not.toContain("THIRD_PARTY_NOTICES.md");
  });
});

it("rejects path traversal, unapproved aliases and root source probes", async () => {
  await withSourceFixture({}, async (directory, component) => {
    for (const dependency of ["../../private", "@/lib/private", "@/app/page", "../../USER_INSTRUCTIONS.md", "@/components/ui/../../../private"]) {
      await writeFile(path.join(directory, component.file), `import "${dependency}"; export function Fixture() { return null; }`);
      await expect(componentFiles(component, "polished")).rejects.toThrow("Source dependency outside component folders");
    }
    await expect(componentFiles({ ...component, file: "USER_INSTRUCTIONS.md" }, "polished")).rejects.toThrow("Source dependency outside component folders");
  });
});

it("rejects a source directory junction that resolves outside the public source scope", async () => {
  await withSourceFixture({ "private/secret.ts": 'export const secret = "private sentinel";' }, async (directory, component) => {
    const target = path.join(directory, "private"), junction = path.join(directory, "components/ui/escape");
    await symlink(target, junction, process.platform === "win32" ? "junction" : "dir");
    await writeFile(path.join(directory, component.file), 'import "./escape/secret"; export function Fixture() { return null; }');
    await expect(componentFiles(component, "polished")).rejects.toThrow("Source dependency outside component folders");
  });
});

it("rejects a LICENSE junction before deriving the canonical source root", async () => {
  await withSourceFixture({ "private/LICENSE": "Private license sentinel" }, async (directory, component) => {
    const licensePath = path.join(directory, "LICENSE");
    await unlink(licensePath);
    await symlink(path.join(directory, "private"), licensePath, process.platform === "win32" ? "junction" : "dir");
    await expect(componentFiles(component, "polished")).rejects.toThrow("Source LICENSE must be a regular file");
  });
});

it("keeps directory imports within their approved scope and deduplicates cycles", async () => {
  await withSourceFixture({
    "components/ui/fixture.tsx": 'import { color } from "../../lib/avatar"; import "../../styles/library-base.css"; export function Fixture() { return color; }',
    "lib/avatar/index.ts": 'export { color } from "./palette";', "lib/avatar/palette.ts": 'import "./index"; export const color = "orange";',
    "lib/avatar.ts": 'export const privateSentinel = "must not probe this sibling file";',
  }, async (_directory, component) => {
    const files = await componentFiles(component, "polished");
    expect(Object.keys(files)).toContain("lib/avatar/index.ts"); expect(Object.keys(files)).toContain("lib/avatar/palette.ts"); expect(Object.keys(files)).not.toContain("lib/avatar.ts");
  });
});

it("reports the explicit Three.js type dependency", async () => {
  await withSourceFixture({ "components/ui/fixture.tsx": 'import { Vector3 } from "three"; import "../../styles/library-base.css"; export function Fixture() { return new Vector3(); }' }, async (_directory, component) => {
    const bundle = await collectComponentSource(component, "polished"); expect(bundle.dependencies).toEqual(["three"]); expect(bundle.devDependencies).toEqual(["@types/three"]); expect(strFromU8(bundle.files["README.md"])).toContain("npm install --save-dev @types/three");
  });
});

it("fails clearly when registry CSS refers to an unbundled font", () => {
  expect(() => registryBaseCss('src: url("/fonts/unknown.woff2")', { "public/fonts/geist-latin.woff2": font, "public/fonts/pixelify-sans-latin.woff2": font })).toThrow("Unresolved font URL");
});

it("typechecks and Vite-bundles an extracted alias-based ZIP without a project alias", async () => {
  await withSourceFixture({
    "components/ui/fixture.tsx": 'import { cn } from "@/lib/utils"; import { Child } from "@/components/ui/child"; import "../../styles/library-base.css"; export function Fixture({ appearance }: { appearance?: string }) { return <div className={cn(appearance ?? "polished")}><Child /></div>; }',
    "components/ui/child.tsx": 'export function Child() { return <span>Portable</span>; }', "lib/utils.ts": 'export function cn(value: string) { return value; }',
  }, async (directory, component) => {
    const files = await componentFiles(component, "pixel"), extracted = path.join(directory, "extracted");
    for (const [relative, data] of Object.entries(files)) { const absolute = path.join(extracted, relative); await mkdir(path.dirname(absolute), { recursive: true }); await writeFile(absolute, data); }
    const ts = await import("typescript"), vite = await import("vite"), entry = path.join(extracted, "Example.tsx");
    const program = ts.createProgram([entry], { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom"] });
    expect(ts.getPreEmitDiagnostics(program).map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n"))).toEqual([]);
    const result = await vite.build({ root: extracted, configFile: false, logLevel: "error", esbuild: { jsx: "automatic" }, css: { postcss: { plugins: [] } }, build: { write: false, minify: false, rollupOptions: { input: entry } } });
    expect("output" in result && result.output.some((output) => output.type === "chunk" && output.isEntry)).toBe(true);
  });
}, 30_000);
