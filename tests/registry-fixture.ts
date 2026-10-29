import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import path from "node:path";
import { vi } from "vitest";
import { components, type ComponentDefinition } from "../lib/components";

// Synthetic bytes: these fixtures verify transport, not font rendering.
export const font = new Uint8Array([119, 79, 70, 50, 0, 1, 254, 255]);
export const fontCss = '@import "./tokens.css";\n@font-face { font-family: "Geist"; src: url("/fonts/geist-latin.woff2") format("woff2"); }\n@font-face { font-family: "Pixel"; src: url(/fonts/pixelify-sans-latin.woff2) format("woff2"); }';
export async function withSourceFixture<T>(extra: Record<string, string | Uint8Array>, run: (directory: string, component: ComponentDefinition) => Promise<T>): Promise<T> {
  const base = path.join(process.cwd(), "out/iteration/registry-fixtures"); await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, "case-"));
  const files = {
    "components/ui/fixture.tsx": 'import "../../styles/library-base.css"; export function Fixture() { return null; }',
    "styles/library-base.css": fontCss, "styles/tokens.css": ':root { --tone: orange; }',
    "public/fonts/geist-latin.woff2": font, "public/fonts/pixelify-sans-latin.woff2": font,
    "public/fonts/OFL-Geist.txt": "Complete OFL Geist notice\nCopyright fixture\n", "public/fonts/OFL-PixelifySans.txt": "Complete OFL Pixel notice\nCopyright fixture\n",
    LICENSE: "Complete source MIT license\nCopyright fixture\n", "USER_INSTRUCTIONS.md": "Private test sentinel", ".env": "PRIVATE_FIXTURE=never-export",
    ...extra,
  };
  for (const [relative, data] of Object.entries(files)) { const absolute = path.join(directory, relative); await mkdir(path.dirname(absolute), { recursive: true }); await writeFile(absolute, data); }
  const component = { ...components[0], slug: "fixture", name: "Fixture", file: "components/ui/fixture.tsx", usage: '<Fixture appearance="polished" />' };
  const cwd = vi.spyOn(process, "cwd").mockReturnValue(directory);
  try { return await run(directory, component); } finally { cwd.mockRestore(); }
}
