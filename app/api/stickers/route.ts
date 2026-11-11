import { readFile } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { STICKERS, stickerSvg } from "../../../components/ui/sticker-artwork";

export const runtime = "nodejs";
export async function GET() {
  const files = Object.fromEntries(STICKERS.map(sticker => [`stickers/${sticker.name}.svg`, strToU8(stickerSvg(sticker.name))]));
  files["LICENSE.txt"] = new Uint8Array(await readFile(path.join(process.cwd(), "LICENSE")));
  files["README.txt"] = strToU8("oRangeUi original sticker pack\n\n50 original, self-contained 512px SVG stickers. Scale to any size. No fonts, external images or scripts are required. Keep the included MIT license with redistributed artwork.\n\nReact components and installation: /components/sticker-pack\n");
  return new Response(new Uint8Array(zipSync(files)), { headers: { "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="orangeui-50-stickers.zip"', "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
