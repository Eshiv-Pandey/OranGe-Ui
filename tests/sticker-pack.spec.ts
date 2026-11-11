import { expect, test } from "@playwright/test";
import { unzipSync, strFromU8 } from "fflate";
import { STICKERS, STICKER_FINISHES, stickerSvg } from "../components/ui/sticker-artwork";

test("all seventy designs in both finishes export transparently and install with complete source", async ({ page, request }) => {
  await page.goto("/stickers");
  await expect(page.locator(".sticker-card")).toHaveCount(70);
  const response = await request.get("/api/stickers"); expect(response.status()).toBe(200);
  const archive = unzipSync(await response.body());
  expect(Object.keys(archive).filter(name => name.endsWith(".svg"))).toHaveLength(140);
  expect(strFromU8(archive["LICENSE.txt"])).toContain("Copyright (c) 2026 Eshiv Pandey");
  const sharp = await request.get("/api/stickers?finish=sharp"); expect(Object.keys(unzipSync(await sharp.body())).filter(name => name.endsWith(".svg"))).toHaveLength(70);
  expect((await request.get("/api/stickers?finish=unknown")).status()).toBe(400);
  const source = await request.get("/api/components/sticker-pack?style=polished"); expect(source.status()).toBe(200);
  const sourceFiles = unzipSync(await source.body()); expect(sourceFiles["components/ui/sticker-artwork.ts"]).toBeDefined();
  const registry = await request.get("/r/sticker-pack.json?style=polished"); expect(registry.status()).toBe(200);
  expect((await registry.json()).files.some((file: { target: string }) => file.target.endsWith("sticker-artwork.ts"))).toBe(true);
  const tarball = await request.get("/downloads/orangeui-stickers-0.1.0.tgz"); expect(tarball.status()).toBe(200); expect((await tarball.body())[0]).toBe(31); expect((await tarball.body())[1]).toBe(139);
  const pixels = await page.evaluate(async svgs => Promise.all(svgs.map(async ([name, svg]) => {
    const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0, 128, 128); const data = ctx.getImageData(0, 0, 128, 128).data;
    let painted = 0, edge = 0; const colors = new Set<string>();
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const i = (y * 128 + x) * 4; if (data[i + 3] > 0) { painted++; if (x === 0 || y === 0 || x === 127 || y === 127) edge++; if (data[i + 3] === 255) colors.add(`${data[i]},${data[i+1]},${data[i+2]}`); } }
    return { name, painted, edge, colors: colors.size };
  })), STICKER_FINISHES.flatMap(finish => STICKERS.map(sticker => [`${sticker.name}/${finish}`, stickerSvg(sticker.name, 128, finish)])));
  for (const result of pixels) { expect(result.painted, result.name).toBeGreaterThan(2000); expect(result.edge, `${result.name} clipped edge`).toBe(0); expect(result.colors, result.name).toBeGreaterThan(3); }
});
