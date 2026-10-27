import { readFile } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { componentUsage, type ComponentDefinition } from "./components";
import type { Appearance } from "../components/ui/appearance";

/** Follow only local imports from a trusted registry entry; request paths are never read. */
export async function componentFiles(component: ComponentDefinition, appearance: Appearance) {
  const root = process.cwd(); const files: Record<string, Uint8Array> = {}; const external = new Set<string>();
  const allowedSource = (relative: string) => /^(components\/ui\/|lib\/avatar\/|styles\/|public\/fonts\/)/.test(relative) && !relative.split("/").includes("..");
  async function includeDependency(relative: string): Promise<void> {
    const normalized = path.posix.normalize(relative.replaceAll("\\", "/"));
    if (/\.(tsx?|css)$/.test(normalized)) return include(normalized);
    // A directory entry such as lib/avatar resolves to index.ts. Never probe
    // lib/avatar.ts outside that directory while looking for its entry point.
    const candidates = [".tsx", ".ts", "/index.ts", "/index.tsx"].map((extension) => normalized + extension).filter(allowedSource);
    if (!candidates.length) throw new Error("Source dependency outside component folders");
    for (const candidate of candidates) {
      try { await include(candidate); return; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    throw new Error(`Unresolved source dependency: ${relative}`);
  }
  async function includeImports(text: string, from: string): Promise<void> {
    for (const match of text.matchAll(/(?:from\s+|import\s*|@import\s*)["']([^"']+)["']/g)) {
      const target = match[1];
      if (!target.startsWith(".")) { if (!target.startsWith("react")) external.add(target.startsWith("@") ? target.split("/").slice(0, 2).join("/") : target.split("/")[0]); continue; }
      await includeDependency(path.posix.join(path.posix.dirname(from), target));
    }
  }
  async function include(relative: string): Promise<void> {
    const normalized = path.posix.normalize(relative.replaceAll("\\", "/"));
    if (!allowedSource(normalized)) throw new Error("Source dependency outside component folders");
    if (files[normalized]) return;
    let sourcePath: string;
    if (normalized.startsWith("components/ui/")) sourcePath = path.join(root, "components/ui", normalized.slice("components/ui/".length));
    else if (normalized.startsWith("lib/avatar/")) sourcePath = path.join(root, "lib/avatar", normalized.slice("lib/avatar/".length));
    else if (normalized.startsWith("styles/")) sourcePath = path.join(root, "styles", normalized.slice("styles/".length));
    else if (normalized.startsWith("public/fonts/")) sourcePath = path.join(root, "public/fonts", normalized.slice("public/fonts/".length));
    else throw new Error("Source dependency outside component folders");
    const data = await readFile(sourcePath); files[normalized] = new Uint8Array(data);
    if (!/\.(tsx?|css)$/.test(normalized)) return;
    await includeImports(data.toString("utf8"), normalized);
  }
  const example = componentUsage(component, appearance);
  await include(component.file);
  await includeImports(example, "Example.tsx");
  const isAvatarBundle = ["avatar", "avatar-group", "avatar-editor"].includes(component.slug);
  if (isAvatarBundle) {
    await include("lib/avatar/index.ts");
    await include("lib/avatar/png.ts");
  }
  for (const font of ["geist-latin.woff2", "pixelify-sans-latin.woff2", "OFL-Geist.txt", "OFL-PixelifySans.txt"]) await include("public/fonts/" + font);
  files["Example.tsx"] = strToU8(example);
  files["LICENSE"] = new Uint8Array(await readFile(path.join(root, "LICENSE")));
  const avatarReadme = isAvatarBundle ? `## Avatar seeds, saved configs, and exports

Pass a stable user identifier as \`seed\`. The same seed generates the same avatar without uploads, network calls, or stored images. A supplied \`config\` takes priority over the seed.

\`\`\`tsx
import { Avatar } from "./components/ui/avatar";
import { generateAvatarConfig, normalizeAvatarConfig, avatarToSvgString, avatarToDataUrl } from "./lib/avatar";

const config = generateAvatarConfig("user-42");
const savedConfig = JSON.stringify(config);
const restoredConfig = normalizeAvatarConfig(JSON.parse(savedConfig));
const svg = avatarToSvgString(restoredConfig, 256, { appearance: "${appearance}" });
const dataUrl = avatarToDataUrl(restoredConfig, 256, { appearance: "${appearance}" });

export default function Profile() {
  return <Avatar config={restoredConfig} size="lg" appearance="${appearance}" />;
}
\`\`\`

AvatarEditor is controlled: keep its value in your application and save the emitted AvatarConfig JSON when customization should persist. Restore saved JSON with normalizeAvatarConfig before passing it as config. Reset uses the editor's seed.

Avatar and AvatarGroup support synchronous React Server Components without a client directive. SVG string and data URL helpers also work on the server. AvatarEditor requires a client component because it handles interactions.

For optional PNG downloads, import \`avatarToPng\` from \`./lib/avatar/png\` and call \`await avatarToPng(config, 256, { appearance: "${appearance}" })\` in a browser event handler. It returns an image/png Blob. This helper stays separate from the server-safe avatar entry point.

Components assign unique SVG definition IDs automatically. If you insert several exported SVG strings inline in one document, pass a different \`id\` option to each export. Pixel appearance uses stepped corners; the other appearances keep the configured shape.

` : "";
  files["README.md"] = strToU8(`# ${component.name} from oRangeUi\n\nA React 19 + TypeScript source component. Appearance: ${appearance}.\n\n## Setup\n\n1. Start with a React 19 + React DOM app using Next.js or Vite.\n2. Install the external dependencies used by this example:\n\n\`\`\`sh\nnpm install ${[...external].sort().join(" ") || "react react-dom"}\n\`\`\`\n\n3. Copy components/, styles/, and any included lib/ folder beside Example.tsx (at the root or under src/).\n4. Merge public/fonts/ into your public assets. Fonts resolve from /fonts/.\n5. Import and render Example in your app. CSS imports are included in the components. No Tailwind setup is required.\n\nFor light/dark palettes, set data-theme="light" or data-theme="dark" on the HTML element. This also themes portalled menus and dialogs. Without a choice, styles follow the system palette.\n\nAll components accept appearance="polished", "pixel", "neobrutalism", "retro-os", or "terminal". Apply the choice to child controls too. Override tokens in styles/tokens.css to customize your colours. For a deployment base path, adjust the font URLs in styles/library-base.css.\n\n${avatarReadme}## Keyboard\n\n${component.keyboard}\n\n## License\n\nMIT. Keep LICENSE with redistributed source. Bundled fonts have their own OFL license notices under public/fonts/.\n`);
  return files;
}
export async function componentZip(component: ComponentDefinition, appearance: Appearance) { return zipSync(await componentFiles(component, appearance), { level: 6 }); }
