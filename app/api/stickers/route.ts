import { readFile } from "node:fs/promises";
import path from "node:path";
import { zipSync, strToU8 } from "fflate";
import { STICKERS, STICKER_FINISHES, stickerSvg } from "../../../components/ui/sticker-artwork";

export const runtime = "nodejs";
export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("finish");
  const finishes = STICKER_FINISHES.filter(finish => !requested || finish === requested);
  if (!finishes.length) return new Response("Choose playful or sharp.", { status: 400 });
  const files = Object.fromEntries(finishes.flatMap(finish => STICKERS.map(sticker => [`${finish}/${sticker.name}.svg`, strToU8(stickerSvg(sticker.name, 512, finish))])));
  files["LICENSE.txt"] = new Uint8Array(await readFile(path.join(process.cwd(), "LICENSE")));
  files["README.txt"] = strToU8(`oRangeUi original sticker pack\n\n${STICKERS.length} original designs in ${finishes.join(" and ")} finishes. Standalone 512px SVGs with no fonts, images or scripts. Scale to any size. Keep the included MIT license with redistributed artwork.\n\nReact package, editor and placement playground: /stickers\n`);
  return new Response(new Uint8Array(zipSync(files)), { headers: { "Content-Type": "application/zip", "Content-Disposition": 'attachment; filename="orangeui-stickers.zip"', "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
