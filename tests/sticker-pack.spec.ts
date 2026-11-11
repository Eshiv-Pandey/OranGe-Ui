import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { STICKERS, stickerSvg } from "../components/ui/sticker-artwork";

const evidence = ".impeccable/review/stickers";
test("all fifty artwork exports, gallery behavior, source and registry", async ({ page, context, request }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => localStorage.setItem("orangeui-palette", "light"));
  await page.goto("/stickers");
  await expect(page.locator(".sticker-card")).toHaveCount(50);
  await page.getByRole("button", { name: "Oddlings 10", exact: true }).click();
  await expect(page.locator(".sticker-card")).toHaveCount(10);
  await page.getByRole("button", { name: "All stickers 50", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search stickers", exact: true }).fill("coffee");
  await expect(page.locator(".sticker-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Preview Moka morning" }).click();
  await expect(page.getByRole("heading", { name: "Moka morning" })).toBeVisible();
  await page.locator("#sticker-size").fill("216");
  await expect(page.locator(".sticker-size-label output")).toHaveText("216 px");
  await page.getByRole("button", { name: "Copy sticker code" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('name="moka-morning"');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("size={216}");
  await page.getByRole("button", { name: "Copy sticker installation command" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('http://127.0.0.1:3150/r/sticker-pack.json?style=polished');
  await page.getByRole("searchbox", { name: "Search stickers", exact: true }).fill("no-such-sticker");
  await expect(page.getByRole("heading", { name: "No little matches." })).toBeVisible();
  await page.getByRole("button", { name: "Show all 50 stickers" }).click();
  await expect(page.locator(".sticker-card")).toHaveCount(50);
  for (const format of ["SVG", "PNG"] as const) {
    const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: format, exact: true }).last().click();
    const download = await downloading; expect(download.suggestedFilename()).toBe(`moka-morning.${format.toLowerCase()}`);
    expect(await download.failure()).toBeNull();
  }
  const svgZip = await request.get("/api/stickers"); expect(svgZip.status()).toBe(200);
  const svgFiles = unzipSync(await svgZip.body());
  expect(Object.keys(svgFiles).filter(name => name.endsWith(".svg"))).toHaveLength(50);
  expect(strFromU8(svgFiles["LICENSE.txt"])).toContain("Copyright (c) 2026 Eshiv Pandey");
  const source = await request.get("/api/components/sticker-pack?style=polished"); expect(source.status()).toBe(200);
  const sourceFiles = unzipSync(await source.body()); expect(sourceFiles["components/ui/sticker-artwork.ts"]).toBeDefined();
  const registry = await request.get("/r/sticker-pack.json?style=polished"); expect(registry.status()).toBe(200);
  expect((await registry.json()).files.some((file: { target: string }) => file.target.endsWith("sticker-artwork.ts"))).toBe(true);
  // Render every exported SVG into an independent canvas: verify alpha, painted pixels and clear canvas edges.
  const pixels = await page.evaluate(async svgs => Promise.all(svgs.map(async ([name, svg]) => {
    const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await image.decode();
    const canvas = document.createElement("canvas"); canvas.width = canvas.height = 128;
    const ctx = canvas.getContext("2d")!; ctx.drawImage(image, 0, 0, 128, 128); const data = ctx.getImageData(0, 0, 128, 128).data;
    let painted = 0, edge = 0; const colors = new Set<string>();
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) { const i = (y * 128 + x) * 4; if (data[i + 3] > 0) { painted++; if (x === 0 || y === 0 || x === 127 || y === 127) edge++; if (data[i + 3] === 255) colors.add(`${data[i]},${data[i+1]},${data[i+2]}`); } }
    return { name, painted, edge, colors: colors.size };
  })), STICKERS.map(sticker => [sticker.name, stickerSvg(sticker.name, 128)]));
  for (const result of pixels) { expect(result.painted, result.name).toBeGreaterThan(2000); expect(result.edge, `${result.name} clipped edge`).toBe(0); expect(result.colors, result.name).toBeGreaterThan(3); }
  expect(errors).toEqual([]);
});

test("one inspection batch: all stickers, desktop and mobile, both palettes and peel", async ({ page }) => {
  await mkdir(evidence, { recursive: true });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const accessibility: { theme: string; violations: unknown[] }[] = [];
  for (const theme of ["light", "dark"]) for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.goto("/stickers"); await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".sticker-card")).toHaveCount(50);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${theme} at ${width}`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${evidence}/${width === 1440 ? "desktop" : width === 390 ? "mobile" : "small-mobile"}-${theme}.png`, fullPage: true });
    if (width === 1440) {
      await page.locator(".sticker-grid").screenshot({ path: `${evidence}/all-50-${theme}.png` });
      const result = await new AxeBuilder({ page }).include(".sticker-gallery").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); if (result.violations.length) accessibility.push({ theme, violations: result.violations });
    }
    if (width === 390) {
      await expect(page.locator(".sticker-inspector")).toBeHidden();
      expect(await page.locator(".sticker-card").first().evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(844);
      await page.getByRole("button", { name: "Preview Spark bouquet" }).click();
      await expect(page.getByRole("button", { name: "Try the peel on Spark bouquet" })).toBeFocused();
      expect(await page.locator(".sticker-inspector").evaluate(el => el.getBoundingClientRect().top)).toBeGreaterThanOrEqual(0);
      expect(await page.locator(".sticker-inspector").evaluate(el => el.getBoundingClientRect().top)).toBeLessThan(200);
      for (const size of [80, 160, 240]) { await page.locator("#sticker-size").fill(String(size)); expect(await page.locator(".sticker-peel-preview .orange-sticker").evaluate(el => el.getBoundingClientRect().width)).toBe(size); }
      expect(await page.locator(".sticker-code").evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(11);
      await page.locator(".sticker-inspector").screenshot({ path: `${evidence}/mobile-open-${theme}.png` });
      await page.getByRole("button", { name: "Back to stickers" }).click();
      await expect(page.locator(".sticker-inspector")).toBeHidden();
      await expect(page.getByRole("button", { name: "Preview Spark bouquet" })).toBeFocused();
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/stickers"); await page.getByRole("button", { name: "Try the peel on Orbit snail" }).focus();
  await expect(page.locator(".sticker-peel-preview .orange-sticker-back")).toHaveCSS("opacity", "1");
  await page.locator(".sticker-inspector").screenshot({ path: `${evidence}/peel-desktop.png` });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".sticker-peel-preview .orange-sticker-back")).toHaveCSS("display", "none");
  await expect(page.locator(".sticker-peel-preview .orange-sticker-front")).toHaveCSS("clip-path", "none");
  await page.goto("/components/sticker-pack"); await expect(page.getByRole("link", { name: "Explore all 50 stickers" })).toBeVisible();
  expect(errors).toEqual([]);
  expect(accessibility).toEqual([]);
});
