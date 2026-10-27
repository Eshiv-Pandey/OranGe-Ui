import { readFile } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { componentUsage, type ComponentDefinition } from "./components";

/** Follow only local imports from a trusted registry entry; request paths are never read. */
export async function componentFiles(component: ComponentDefinition, appearance: "polished" | "pixel") {
  const root = process.cwd(); const files: Record<string, Uint8Array> = {}; const external = new Set<string>();
  async function include(relative: string) {
    const normalized = path.posix.normalize(relative.replaceAll("\\", "/"));
    if (!/^(components\/ui\/|styles\/|public\/fonts\/)/.test(normalized) || normalized.includes("..")) throw new Error("Source dependency outside component folders");
    if (files[normalized]) return;
    const sourcePath = normalized.startsWith("components/ui/") ? path.join(root, "components/ui", normalized.slice(14)) : normalized.startsWith("styles/") ? path.join(root, "styles", normalized.slice(7)) : path.join(root, "public/fonts", normalized.slice(13));
    const data = await readFile(sourcePath); files[normalized] = new Uint8Array(data);
    if (!/\.(tsx?|css)$/.test(normalized)) return;
    const text = data.toString("utf8");
    for (const match of text.matchAll(/(?:from\s+|import\s*|@import\s*)["']([^"']+)["']/g)) {
      const target = match[1];
      if (!target.startsWith(".")) { if (!target.startsWith("react")) external.add(target.startsWith("@") ? target.split("/").slice(0, 2).join("/") : target.split("/")[0]); continue; }
      const resolved = path.posix.join(path.posix.dirname(normalized), target);
      if (/\.(tsx?|css)$/.test(resolved)) await include(resolved);
      else {
        let found = false;
        for (const extension of [".tsx", ".ts"]) { try { await include(resolved + extension); found = true; break; } catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; } }
        if (!found) throw new Error(`Unresolved source dependency: ${target}`);
      }
    }
  }
  const example = componentUsage(component, appearance);
  await include(component.file);
  for (const match of example.matchAll(/from "\.\/(components\/ui\/[^".]+)"/g)) await include(match[1] + ".tsx");
  for (const font of ["geist-latin.woff2", "pixelify-sans-latin.woff2", "OFL-Geist.txt", "OFL-PixelifySans.txt"]) await include("public/fonts/" + font);
  files["Example.tsx"] = strToU8(example);
  files["LICENSE"] = new Uint8Array(await readFile(path.join(root, "LICENSE")));
  files["README.md"] = strToU8(`# ${component.name} from oRangeUi\n\nA React 19 + TypeScript source component. Appearance: ${appearance}.\n\n## Setup\n\n1. Start with a React 19 + React DOM app using Next.js or Vite.\n2. Install the external dependencies used by this example:\n\n\`\`\`sh\nnpm install ${[...external].sort().join(" ") || "react react-dom"}\n\`\`\`\n\n3. Copy components/ and styles/ beside Example.tsx (at the root or under src/).\n4. Merge public/fonts/ into your public assets. Fonts resolve from /fonts/.\n5. Import and render Example in your app. CSS imports are included in the components. No Tailwind setup is required.\n\nFor light/dark palettes, set data-theme="light" or data-theme="dark" on the HTML element. This also themes portalled menus and dialogs. Without a choice, styles follow the system palette.\n\nAll components accept appearance="polished" or appearance="pixel". Apply the choice to child controls too. Override tokens in styles/tokens.css to customize your colours. For a deployment base path, adjust the font URLs in styles/library-base.css.\n\n## Keyboard\n\n${component.keyboard}\n\n## License\n\nMIT. Keep LICENSE with redistributed source. Bundled fonts have their own OFL license notices under public/fonts/.\n`);
  return files;
}
export async function componentZip(component: ComponentDefinition, appearance: "polished" | "pixel") { return zipSync(await componentFiles(component, appearance), { level: 6 }); }
