import { Buffer } from "node:buffer";
import type { Appearance } from "../components/ui/appearance";
import type { ComponentDefinition } from "./components";
import { collectComponentSource } from "./source-bundle";
import { relocateSource } from "./source-imports";

export type RegistryFile = { path: string; type: "registry:file"; target: string; content: string };
export type ComponentRegistryItem = {
  $schema: "https://ui.shadcn.com/schema/registry-item.json";
  name: string; type: "registry:item"; title: string; description: string;
  dependencies: string[]; devDependencies: string[]; files: RegistryFile[];
  docs: string; meta: { appearance: Appearance; namespace: "orangeui"; source: string; example: string };
};

const registryRoot = "~/orangeui";
const fontNames = ["geist-latin.woff2", "pixelify-sans-latin.woff2"] as const;

/** Registry payloads are text-only, so fonts are embedded only in this transport. */
export function registryBaseCss(css: string, files: Readonly<Record<string, Uint8Array>>): string {
  let result = css;
  for (const name of fontNames) {
    const bytes = files[`public/fonts/${name}`];
    if (!bytes) throw new Error(`Missing bundled font: ${name}`);
    const data = `data:font/woff2;base64,${Buffer.from(bytes).toString("base64")}`;
    const reference = new RegExp(`url\\(\\s*(["']?)/fonts/${name.replaceAll(".", "\\.")}\\1\\s*\\)`, "g");
    result = result.replace(reference, `url("${data}")`);
  }
  if (/url\(\s*["']?\/fonts\//.test(result)) throw new Error("Unresolved font URL in registry stylesheet");
  return result;
}

function destination(source: string, slug: string): string | undefined {
  if (source.endsWith(".woff2") || source === "README.md") return undefined;
  if (source === "Example.tsx") return `examples/${slug}.tsx`;
  if (source === "LICENSE") return "licenses/orangeui-LICENSE.txt";
  if (source === "THIRD_PARTY_NOTICES.md") return "licenses/THIRD_PARTY_NOTICES.md";
  if (source === "public/fonts/OFL-Geist.txt") return "licenses/OFL-Geist.txt";
  if (source === "public/fonts/OFL-PixelifySans.txt") return "licenses/OFL-PixelifySans.txt";
  if (/^(?:components\/ui\/|lib\/avatar\/).+\.tsx?$/.test(source) || source === "lib/utils.ts" || /^styles\/.+\.css$/.test(source)) return source;
  throw new Error("Unsupported file in registry payload");
}

/** Every file has an explicit root-relative target, preserving the source namespace. */
export async function componentRegistryItem(component: ComponentDefinition, appearance: Appearance): Promise<ComponentRegistryItem> {
  const bundle = await collectComponentSource(component, appearance), files: RegistryFile[] = [];
  for (const [source, bytes] of Object.entries(bundle.files).sort(([a], [b]) => a.localeCompare(b))) {
    const relative = destination(source, component.slug);
    if (!relative) continue;
    if (!/^[a-zA-Z0-9_./-]+$/.test(relative) || relative.split("/").some((part) => part === "." || part === "..")) throw new Error("Unsafe registry target");
    let content = Buffer.from(bytes).toString("utf8");
    if (source === "styles/library-base.css") content = registryBaseCss(content, bundle.files);
    if (source === "Example.tsx") content = relocateSource(content, source, relative);
    files.push({ path: `orangeui/${relative}`, type: "registry:file", target: `${registryRoot}/${relative}`, content });
  }
  const hasNotice = Boolean(bundle.files["THIRD_PARTY_NOTICES.md"]), example = `orangeui/examples/${component.slug}.tsx`;
  return {
    $schema: "https://ui.shadcn.com/schema/registry-item.json", name: `orangeui-${component.slug}`, type: "registry:item", title: component.name, description: component.description,
    dependencies: bundle.dependencies, devDependencies: bundle.devDependencies, files,
    meta: { appearance, namespace: "orangeui", source: `orangeui/${component.file}`, example },
    docs: `Installed in the project-root orangeui/ namespace. Keep its components/, styles/, and lib/ folders together. Consumer component aliases do not relocate these files.\n\nFrom a file at the project root, import { ${component.name} } from "./orangeui/${component.file.replace(/\.tsx?$/, "")}". For other locations use the corresponding relative path. The working ${appearance} example is ${example}. Pass appearance="${appearance}" to use the selected appearance; the component continues to support all five appearances.\n\nCSS is imported by the components. Font data is embedded in styles/library-base.css, so no public asset copy or Tailwind configuration is needed. If your Content Security Policy restricts fonts, permit data: in font-src or extract the two fonts and update those URLs. Set data-theme="light" or data-theme="dark" on the HTML element to theme portal content as well.\n\nKeep licenses/orangeui-LICENSE.txt and the two OFL font notices with redistributed source.${hasNotice ? " LiveOrb also requires licenses/THIRD_PARTY_NOTICES.md with its attribution and complete MIT notice." : ""}`,
  };
}
