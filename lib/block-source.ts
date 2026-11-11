import { strToU8, zipSync } from "fflate";
import { asComponent, type BlockDefinition } from "./blocks";
import { componentUsage } from "./components";
import { collectComponentSource } from "./source-bundle";
import { componentRegistryItem } from "./component-registry";

export async function blockSource(entry: BlockDefinition) {
  const bundle = await collectComponentSource(asComponent(entry), "polished");
  const propDocs = entry.props.map(prop => `- ${prop.name} (${prop.type}): ${prop.description} Default: ${prop.defaultValue}.`).join("\n");
  bundle.files["README.md"] = strToU8(`# ${entry.title}\n\n${entry.description}\n\n## Setup\n\n1. Use React 19 and TypeScript.\n2. Install dependencies: npm install ${bundle.dependencies.join(" ") || "react react-dom"}.\n3. Copy components/, styles/ and any included lib/ beside Example.tsx. Merge the included public/ directory into your app's public assets.\n4. Import Example into your app. CSS is imported by the components; no Tailwind setup is required.\n5. Set data-theme="light" or data-theme="dark" on HTML. With neither, the palette follows your system.\n\n## Application integration\n\n${entry.notes?.join("\n\n")}\n\nThe console callbacks in Example.tsx are integration placeholders. Replace them with your real service; they do not send or persist data. Server-side validation remains your responsibility.\n\n## Props\n\n${propDocs}\n\n## Keyboard\n\n${entry.keyboard}\n\n## License\n\nKeep LICENSE and all included font and photograph notices with redistributed source. Photos are demonstration content under the Unsplash license.\n`);
  return bundle;
}
export async function blockZip(entry: BlockDefinition) { return zipSync((await blockSource(entry)).files, { level: 6 }); }
export async function blockRegistryItem(entry: BlockDefinition) {
  const item = await componentRegistryItem(asComponent(entry), "polished");
  return { ...item, name: `orangeui-block-${entry.slug}`, type: "registry:block" as const, title: entry.title, docs: `Install in the project-root orangeui/ namespace and keep its folders together. The entry is orangeui/${entry.file} and the example is ${item.meta.example}. CSS imports are included. Fonts and sample photographs are embedded as data URLs; permit data: in font-src and img-src if your CSP restricts them.\n\n${entry.notes?.join("\n\n")}\n\nReplace console callbacks in the example with real services. Preserve all included license notices.\n\n${componentUsage(asComponent(entry), "polished")}` };
}
