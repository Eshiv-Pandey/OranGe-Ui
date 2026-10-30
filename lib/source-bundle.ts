import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { componentUsage, type ComponentDefinition } from "./components";
import type { Appearance } from "../components/ui/appearance";
import { externalPackage, relativeSourceImport, rewriteSourceImports, sourceAlias, sourceImports, type SourceImport } from "./source-imports";

export type ComponentSourceBundle = { files: Record<string, Uint8Array>; dependencies: string[]; devDependencies: string[] };
export const BUNDLED_FONTS = ["geist-latin.woff2", "pixelify-sans-latin.woff2", "OFL-Geist.txt", "OFL-PixelifySans.txt"] as const;
export const CREATIVE_FONT_ASSETS = ["public/fonts/desi/yatra-one.woff2", "public/fonts/desi/baloo-2.woff2", "public/fonts/desi/OFL-yatra-one.txt", "public/fonts/desi/OFL-baloo-2.txt", "public/fonts/desi/README.md"] as const;
export const CREATIVE_AUDIO_ASSETS = ["public/audio/orangeui/sunroom.wav", "public/audio/orangeui/blue-hour.wav", "public/audio/orangeui/pocket-garden.wav", "public/audio/orangeui/LICENSE.txt", "public/audio/orangeui/CC0-1.0.txt"] as const;

function allowedSource(relative: string): boolean {
  return /^(?:components\/ui\/|lib\/avatar\/).+\.tsx?$/.test(relative)
    || /^styles\/.+\.css$/.test(relative)
    || relative === "lib/utils.ts"
    || BUNDLED_FONTS.some((name) => relative === `public/fonts/${name}`)
    || [...CREATIVE_FONT_ASSETS, ...CREATIVE_AUDIO_ASSETS].some((name) => relative === name)
    || relative === "LICENSE" || relative === "THIRD_PARTY_NOTICES.md";
}

function sourceScope(relative: string): string {
  if (relative.startsWith("components/ui/")) return "components/ui";
  if (relative.startsWith("lib/avatar/")) return "lib/avatar";
  if (relative.startsWith("styles/")) return "styles";
  if (relative.startsWith("public/fonts/")) return "public/fonts";
  if (relative.startsWith("public/audio/")) return "public/audio";
  return relative;
}

/** Follow only local imports from a trusted registry entry; request paths are never read. */
export async function collectComponentSource(component: ComponentDefinition, appearance: Appearance): Promise<ComponentSourceBundle> {
  const root = process.cwd(), licensePath = path.join(root, "LICENSE");
  // A regular, required public file anchors the canonical root without
  // allowing a LICENSE symlink or junction to redirect the containment check.
  if (!(await lstat(licensePath)).isFile()) throw new Error("Source LICENSE must be a regular file");
  const realRoot = path.dirname(await realpath(licensePath));
  const files: Record<string, Uint8Array> = {}; const external = new Set<string>();
  async function includeDependency(relative: string): Promise<string> {
    const normalized = path.posix.normalize(relative.replaceAll("\\", "/"));
    if (/\.(tsx?|css)$/.test(normalized)) { await include(normalized); return normalized; }
    // A directory entry such as lib/avatar resolves to index.ts. Never probe
    // lib/avatar.ts outside that directory while looking for its entry point.
    const candidates = [".tsx", ".ts", "/index.ts", "/index.tsx"].map((extension) => normalized + extension).filter(allowedSource);
    if (!candidates.length) throw new Error("Source dependency outside component folders");
    for (const candidate of candidates) {
      try { await include(candidate); return candidate; }
      catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    }
    throw new Error(`Unresolved source dependency: ${relative}`);
  }
  async function includeImports(text: string, from: string): Promise<string> {
    const replacements: (SourceImport & { replacement: string })[] = [];
    for (const item of sourceImports(text, from)) {
      const target = item.value;
      if (target.includes("\\") || target.includes("\0")) throw new Error("Unsupported escaped source import");
      const alias = sourceAlias(target);
      if (alias) {
        const resolved = await includeDependency(alias);
        replacements.push({ ...item, replacement: relativeSourceImport(from, resolved) });
      } else if (target.startsWith(".")) await includeDependency(path.posix.join(path.posix.dirname(from), target));
      else if (from.endsWith(".css") && /^(?:https?:|data:)/.test(target)) continue;
      else { const dependency = externalPackage(target); if (dependency) external.add(dependency); }
    }
    return rewriteSourceImports(text, replacements);
  }
  async function include(relative: string): Promise<void> {
    const normalized = path.posix.normalize(relative.replaceAll("\\", "/"));
    if (!allowedSource(normalized)) throw new Error("Source dependency outside component folders");
    if (files[normalized]) return;
    // A symlink/junction cannot turn an approved source path into a private read.
    const actual = normalized.startsWith("components/ui/")
      ? await realpath(path.join(root, "components/ui", normalized.slice("components/ui/".length)))
      : normalized.startsWith("lib/avatar/")
        ? await realpath(path.join(root, "lib/avatar", normalized.slice("lib/avatar/".length)))
        : normalized === "lib/utils.ts"
          ? await realpath(path.join(root, "lib/utils.ts"))
          : normalized.startsWith("styles/")
            ? await realpath(path.join(root, "styles", normalized.slice("styles/".length)))
            : normalized.startsWith("public/fonts/")
              ? await realpath(path.join(root, "public/fonts", normalized.slice("public/fonts/".length)))
              : normalized.startsWith("public/audio/")
                ? await realpath(path.join(root, "public/audio", normalized.slice("public/audio/".length)))
              : normalized === "THIRD_PARTY_NOTICES.md"
                ? await realpath(path.join(root, "THIRD_PARTY_NOTICES.md"))
                : await realpath(path.join(root, "LICENSE"));
    const scope = sourceScope(normalized);
    // This containment calculation does not read files. Explicit tracing
    // includes retain the public folders without inferring a whole-root scan.
    const within = path.relative(path.join(/* turbopackIgnore: true */ realRoot, scope), actual);
    if (within === ".." || within.startsWith(`..${path.sep}`) || path.isAbsolute(within)
      || scope === normalized && within !== "") throw new Error("Source dependency outside component folders");
    // Keep each read statically scoped so production tracing includes only the
    // downloadable source folders, never private root files or build artifacts.
    const data = normalized.startsWith("components/ui/")
      ? await readFile(path.join(root, "components/ui", normalized.slice("components/ui/".length)))
      : normalized.startsWith("lib/avatar/")
        ? await readFile(path.join(root, "lib/avatar", normalized.slice("lib/avatar/".length)))
        : normalized === "lib/utils.ts"
          ? await readFile(path.join(root, "lib/utils.ts"))
          : normalized.startsWith("styles/")
            ? await readFile(path.join(root, "styles", normalized.slice("styles/".length)))
            : normalized.startsWith("public/fonts/")
              ? await readFile(path.join(root, "public/fonts", normalized.slice("public/fonts/".length)))
            : normalized.startsWith("public/audio/")
              ? await readFile(path.join(root, "public/audio", normalized.slice("public/audio/".length)))
              : normalized === "THIRD_PARTY_NOTICES.md"
                ? await readFile(path.join(root, "THIRD_PARTY_NOTICES.md"))
                : await readFile(path.join(root, "LICENSE"));
    files[normalized] = new Uint8Array(data);
    if (!/\.(tsx?|css)$/.test(normalized)) return;
    if (normalized.endsWith(".css")) for (const match of data.toString("utf8").matchAll(/url\(["']?(\/fonts\/[^"')?]+)["']?\)/g)) {
      const asset = "public" + match[1];
      if (allowedSource(asset)) await include(asset);
    }
    files[normalized] = strToU8(await includeImports(data.toString("utf8"), normalized));
  }
  let example = componentUsage(component, appearance);
  await include(component.file);
  example = await includeImports(example, "Example.tsx");
  const isAvatarBundle = ["avatar", "avatar-group", "avatar-editor"].includes(component.slug);
  if (isAvatarBundle) {
    await include("lib/avatar/index.ts");
    await include("lib/avatar/png.ts");
  }
  for (const font of BUNDLED_FONTS) await include("public/fonts/" + font);
  if (files["components/ui/styled-text.tsx"]) for (const asset of CREATIVE_FONT_ASSETS) await include(asset);
  if (files["components/ui/creative-playlist.ts"]) for (const asset of CREATIVE_AUDIO_ASSETS) await include(asset);
  files["Example.tsx"] = strToU8(example);
  await include("LICENSE");
  if (files["components/ui/live-orb.tsx"]) await include("THIRD_PARTY_NOTICES.md");
  const dependencies = [...external].sort();
  const devDependencies = external.has("three") ? ["@types/three"] : [];
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
  const extraNotes = [
    "## Portable imports\n\nApproved project aliases are converted to relative imports in this download. Keep the components/, styles/, and lib/ folder relationship intact; no @ alias is required.\n",
    devDependencies.length ? `## Type dependencies\n\nInstall the additional TypeScript declarations used by this component:\n\n\`\`\`sh\nnpm install --save-dev ${devDependencies.join(" ")}\n\`\`\`\n` : "",
    external.has("react-markdown") || external.has("remark-gfm") ? `## Markdown dependencies\n\n${dependencies.filter((name) => name === "react-markdown" || name === "remark-gfm").map((name) => `\`${name}\``).join(" and ")} are external packages included in the install command above. React itself does not provide these modules.\n` : "",
    files["THIRD_PARTY_NOTICES.md"] ? "## Third-party attribution\n\nThis bundle includes LiveOrb. Keep THIRD_PARTY_NOTICES.md, including its attribution and complete MIT permission notice, with redistributed source.\n" : "",
  ].filter(Boolean).join("\n");
  files["README.md"] = strToU8(Buffer.from(files["README.md"]).toString("utf8") + "\n" + extraNotes);
  if (component.collection) files["README.md"] = strToU8(Buffer.from(files["README.md"]).toString("utf8") + "\n## Creative collection\n\nThis component retains its " + component.collection + " material. Theme follows live HTML dark/light classes, data-theme, then the system preference.\n\n" + (component.notes ?? []).join("\n\n") + "\n\nMerge the included public/ folder into your public assets, including audio/ for the original sample playlist and fonts/desi/ for display lettering. Retain all included license and credit files.\n");
  return { files, dependencies, devDependencies };
}
export async function componentFiles(component: ComponentDefinition, appearance: Appearance) { return (await collectComponentSource(component, appearance)).files; }
export async function componentZip(component: ComponentDefinition, appearance: Appearance) { return zipSync(await componentFiles(component, appearance), { level: 6 }); }
