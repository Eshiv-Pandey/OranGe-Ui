// @vitest-environment node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { strFromU8, unzipSync } from "fflate";
import ts from "typescript";
import { expect, it } from "vitest";
import { blocks, blockCategories, findBlock } from "../lib/blocks";
import { blockSource, blockRegistryItem, blockZip } from "../lib/block-source";
import { GET as sourceGet } from "../app/api/blocks/[slug]/route";
import { GET as registryGet } from "../app/r/[name]/route";

it("covers every researched section with unique, trusted original entries", () => {
  expect(blocks).toHaveLength(75); expect(new Set(blocks.map(block => block.slug)).size).toBe(75);
  expect(blocks.filter(block => block.category === "Auth")).toHaveLength(5);
  expect(blocks.filter(block => block.category === "Not Found").map(block => block.slug)).toEqual(expect.arrayContaining(["neon-sign-404", "chai-break-404"]));
  expect(findBlock("pavilion-footer")?.category).toBe("Footer");
  for (const category of blockCategories) expect(blocks.some(block => block.category === category)).toBe(true);
  for (const slug of ["../USER_INSTRUCTIONS", "%2e%2e", "auth-panel.tsx", "AUTH-PANEL"]) expect(findBlock(slug)).toBeUndefined();
});
it("extracts and typechecks every usage example with complete standalone dependencies", async () => {
  const root = path.resolve(".impeccable/review/blocks/install"), examples: string[] = [];
  for (const block of blocks) {
    const bundle = await blockSource(block);
    expect(bundle.files[block.file]).toBeDefined(); expect(Object.keys(bundle.files).some(file => file.endsWith(".css"))).toBe(true); expect(bundle.dependencies).not.toContain("next");
    if (block.file.startsWith("components/ui/blocks/") && !["landscape-footers", "playful-footers", "skyline-footer"].some(file => block.file.endsWith(`${file}.tsx`))) { expect(bundle.files["styles/blocks.css"]).toBeDefined(); expect(bundle.dependencies).toContain("lucide-react"); }
    expect(strFromU8(bundle.files["README.md"])).toContain("fictional"); expect(strFromU8(bundle.files["README.md"])).not.toContain("all five appearances");
    for (const [relative, bytes] of Object.entries(bundle.files)) {
      expect(relative).not.toMatch(/AGENTS|USER_INSTRUCTIONS|CONTRIBUTION_RULES|out\/|\.env/);
      const target = path.join(root, relative === "Example.tsx" ? `Example-${block.slug}.tsx` : relative);
      await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes);
      if (relative === "Example.tsx") examples.push(target);
    }
  }
  const program = ts.createProgram(examples, { noEmit: true, strict: true, skipLibCheck: true, target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext, moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, types: ["react", "react-dom"] });
  expect(ts.getPreEmitDiagnostics(program).map(item => ts.flattenDiagnosticMessageText(item.messageText, "\n"))).toEqual([]);
  const vite = await import("vite");
  const result = await vite.build({ root, configFile: false, logLevel: "error", esbuild: { jsx: "automatic", target: "es2020" }, css: { postcss: { plugins: [] } }, build: { write: false, minify: false, rollupOptions: { input: path.join(root, "Example-studio-landing.tsx") } } });
  expect("output" in result && result.output.some(output => output.type === "chunk" && output.isEntry)).toBe(true);
}, 90000);
it("ships portable registry fonts and photos with notices, and truthful installation docs", async () => {
  for (const slug of ["auth-panel", "studio-auth", "contrast-auth", "studio-landing", "studio-workspace"]) {
    const item = await blockRegistryItem(findBlock(slug)!);
    expect(item.type).toBe("registry:block"); expect(item.docs).toContain("Polished"); expect(item.docs).toContain("fictional"); expect(item.docs).not.toContain("all five appearances");
    const files = item.files.map(file => file.content).join("\n"); expect(files).toContain("data:image/jpeg;base64,"); expect(files).toContain("data:font/woff2;base64,"); expect(files).not.toMatch(/url\(["']?\/fonts\//);
    expect(item.files.some(file => file.target.endsWith("licenses/KEEPSAKE_PHOTOS.md"))).toBe(true);
    const zip = unzipSync(await blockZip(findBlock(slug)!)); expect(zip["public/photos/keepsakes/NOTICE.md"]).toBeDefined(); expect(zip["Example.tsx"]).toBeDefined();
  }
}, 30000);
it("rejects unknown and malformed routes before reading files", async () => {
  for (const slug of ["../USER_INSTRUCTIONS", "unknown", "auth-panel.tsx"]) expect((await sourceGet(new Request("http://localhost/api/blocks/x"), { params: Promise.resolve({ slug }) })).status).toBe(404);
  expect((await registryGet(new Request("http://localhost/r/block-auth-panel.json?style=pixel"), { params: Promise.resolve({ name: "block-auth-panel.json" }) })).status).toBe(400);
  expect((await registryGet(new Request("http://localhost/r/x"), { params: Promise.resolve({ name: "../USER_INSTRUCTIONS" }) })).status).toBe(404);
  expect((await sourceGet(new Request("http://localhost/api/blocks/auth-panel?format=private"), { params: Promise.resolve({ slug: "auth-panel" }) })).status).toBe(400);
});
it("bundles testimonial portraits and their notices in both portable transports", async () => {
  const entry = findBlock("infinite-testimonials")!;
  const bundle = await blockSource(entry);
  for (const name of ["avery", "jamie", "riley", "morgan"]) expect(bundle.files[`public/photos/keepsakes/review-${name}.jpg`]).toBeDefined();
  expect(bundle.files["public/photos/keepsakes/TESTIMONIAL_PHOTOS.md"]).toBeDefined();
  const registry = await blockRegistryItem(entry);
  expect(registry.files.some(file => file.target.endsWith("licenses/TESTIMONIAL_PHOTOS.md"))).toBe(true);
  const data = registry.files.find(file => file.target.endsWith("testimonial-data.ts"))!.content;
  expect(data).toContain("data:image/jpeg;base64,");
  expect(data).not.toContain("/photos/keepsakes/review-");
}, 30000);
it("ships outreach backgrounds, original team art and the contact serif font portably", async () => {
  for (const slug of ["scene-announcement", "editorial-contact", "flip-team", "character-team"]) {
    const entry = findBlock(slug)!, bundle = await blockSource(entry), item = await blockRegistryItem(entry);
    const source = item.files.map(file => file.content).join("\n");
    expect(source).toContain("data:image/"); expect(source).not.toMatch(/url\(["']?\/fonts\//);
    if (slug === "editorial-contact") { expect(bundle.files["public/fonts/film/cormorant-garamond-italic-latin.woff2"]).toBeDefined(); expect(source).toContain("Contact Editorial"); expect(item.files.some(file => file.target.endsWith("licenses/FILM_FONT_CREDITS.md"))).toBe(true); }
    if (slug.includes("team")) expect(item.files.some(file => file.target.endsWith("licenses/TESTIMONIAL_PHOTOS.md"))).toBe(true);
  }
}, 30000);
