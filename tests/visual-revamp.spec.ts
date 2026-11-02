import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = ".impeccable/review/visual-revamp";
const slugs = ["season-tree", "drifting-clouds", "flowing-grass", "island-player", "glass-player", "neon-pill-player", "frosted-glass", "grain-gradient", "anime-fire"];
async function open(page: Page, slug: string) {
  await page.goto(`/components/${slug}?style=polished`, { waitUntil: "domcontentloaded" });
  const demo = page.getByTestId("live-demo");
  await expect(demo.locator(".creative-demo")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  if (["drifting-clouds", "flowing-grass", "anime-fire", "grain-gradient"].includes(slug)) await expect(demo.locator(`.${slug}`)).toHaveAttribute("data-renderer", slug === "anime-fire" || slug === "grain-gradient" ? "webgl" : "webgl2");
  return demo;
}

for (const viewport of [{ width: 1440, height: 900, name: "desktop", theme: "dark" }, { width: 390, height: 844, name: "mobile", theme: "dark" }, { width: 1536, height: 778, name: "user-1536", theme: "dark" }, { width: 1440, height: 900, name: "desktop-light", theme: "light" }, { width: 390, height: 844, name: "mobile-light", theme: "light" }]) {
  test(`reference-led components remain visible at ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.addInitScript((theme) => localStorage.setItem("orangeui-palette", theme), viewport.theme);
    await mkdir(evidence, { recursive: true });
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
    for (const slug of slugs) {
      const demo = await open(page, slug);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
      const dock = page.locator(".workspace-stage-toolbar");
      const box = await dock.boundingBox(); expect(box?.height).toBeLessThanOrEqual(46);
      await page.screenshot({ path: `${evidence}/${slug}-${viewport.name}.png` });
      if (slug === "grain-gradient") {
        const save = await demo.getByRole("button", { name: "Save image", exact: true }).boundingBox();
        expect.soft(save!.y + save!.height).toBeLessThan(box!.y);
      }
      if (slug === "frosted-glass") {
        const reset = demo.getByRole("button", { name: "Reset frost" });
        const action = await reset.boundingBox(); expect(action).not.toBeNull();
        expect.soft(action!.y + action!.height).toBeLessThan(box!.y - 2);
        expect.soft(action!.y).toBeGreaterThan(0);
        expect.soft(await page.locator(".workspace-view").evaluate((node) => node.scrollHeight <= node.clientHeight + 2)).toBe(true);
      }
      if (slug === "season-tree") {
        const corners = await demo.locator("canvas").evaluate((canvas: HTMLCanvasElement) => {
          const context = canvas.getContext("2d")!;
          return [context.getImageData(0, 0, 1, 1).data[3], context.getImageData(canvas.width - 1, canvas.height - 1, 1, 1).data[3]];
        });
        expect(corners).toEqual([0, 0]);
      }
    }
    expect(errors).toEqual([]);
  });
}

test("palettes persist locally and the legacy shader page resolves to the single gradient editor", async ({ page }) => {
  await open(page, "drifting-clouds");
  await page.getByRole("button", { name: "Use Apricot haze palette" }).click();
  await expect(page.getByLabel("Sky color", { exact: true })).toHaveValue("#687faf");
  await page.getByLabel("Palette name").fill("Evening study");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.reload();
  await page.getByRole("button", { name: "Use Evening study palette" }).click();
  await expect(page.getByLabel("Sky color", { exact: true })).toHaveValue("#687faf");
  await page.getByRole("button", { name: "Remove Evening study palette" }).click();
  await expect(page.getByRole("button", { name: "Use Evening study palette" })).toHaveCount(0);
  await page.goto("/components/shader-canvas?style=polished");
  await expect(page).toHaveURL(/\/components\/grain-gradient\?style=polished/);
  await expect(page.locator(".library-sidebar").getByRole("link", { name: "ShaderCanvas", exact: true })).toHaveCount(0);
  const registry = await page.request.get("/r/shader-canvas.json");
  expect(registry.ok()).toBe(true);
});

test("frost actions and a replacement background work without scrolling the preview", async ({ page }) => {
  const demo = await open(page, "frosted-glass");
  const pane = demo.locator(".frosted-glass-stage");
  await page.getByLabel("Choose background image").setInputFiles({ name: "custom-background.png", mimeType: "image/png", buffer: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jlp0AAAAASUVORK5CYII=", "base64") });
  await expect(pane.locator("img")).toHaveAttribute("src", /^blob:/);
  await expect.poll(() => pane.locator("img").evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1);
  await demo.getByRole("button", { name: "Clear glass", exact: true }).click();
  const clear = await pane.locator("canvas").evaluate((canvas: HTMLCanvasElement) => canvas.getContext("2d")!.getImageData(5, 5, 1, 1).data[3]);
  expect(clear).toBe(0);
  await demo.getByRole("button", { name: "Reset frost" }).click();
  expect(await pane.locator("canvas").evaluate((canvas: HTMLCanvasElement) => canvas.getContext("2d")!.getImageData(5, 5, 1, 1).data[3])).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Remove photo" }).click();
  await expect(pane.locator("img")).not.toHaveAttribute("src", /^blob:/);
});

test("installed frost side controls reflow without playground styles", async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 900 });
  const demo = await open(page, "frosted-glass");
  // Use the rendered component and only the styles delivered by its registry install.
  const markup = await demo.locator(".frosted-glass").evaluate((node) => node.outerHTML);
  const theme = await demo.locator(".frosted-glass").getAttribute("data-theme");
  const frame = await demo.locator(".frosted-glass-stage canvas").evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL());
  const response = await page.request.get("/r/frosted-glass.json");
  expect(response.ok()).toBe(true);
  const registry = await response.json() as { files: { path: string; content: string }[] };
  const styles = registry.files.filter(({ path }) => path.endsWith(".css")).map(({ content }) => content.replace(/@import\s+[^;]+;/g, "")).join("\n");
  await page.setContent(`<style>${styles}</style><body style="background:${theme === "dark" ? "#141414" : "#fafafa"}"><main style="width:390px;margin:24px auto">${markup}</main></body>`);
  await page.locator(".frosted-glass-stage canvas").evaluate(async (canvas: HTMLCanvasElement, src) => {
    const image = new Image(); image.src = src; await image.decode();
    canvas.getContext("2d")!.drawImage(image, 0, 0);
  }, frame);
  const pane = page.locator(".frosted-glass-stage"), footer = page.locator(".frosted-glass-footer");
  for (const width of [390, 300, 620]) {
    await page.locator("main").evaluate((node, size) => { node.style.width = `${size}px`; }, width);
    const glass = (await pane.boundingBox())!, actions = (await footer.boundingBox())!;
    if (width <= 390) {
      expect(actions.y).toBeGreaterThanOrEqual(glass.y + glass.height);
      expect(actions.x + actions.width).toBeLessThanOrEqual(glass.x + glass.width + 1);
    } else {
      expect(actions.x).toBeGreaterThan(glass.x + glass.width);
      expect(actions.y).toBeLessThan(glass.y + glass.height);
    }
    expect(await page.locator("main").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    if (width !== 300) await page.screenshot({ path: `${evidence}/frosted-glass-standalone-${width}.png` });
  }
});

test("all three polished players retain playback, track changes and mute", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  for (const slug of ["island-player", "glass-player", "neon-pill-player"]) {
    const demo = await open(page, slug);
    const title = await demo.locator(".creative-track-copy strong").innerText();
    if (slug === "neon-pill-player") await demo.locator(".neon-cover-button").focus();
    await demo.getByRole("button", { name: "Play", exact: true }).click();
    await expect(demo.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await demo.getByRole("button", { name: "Next track", exact: true }).click();
    await expect(demo.locator(".creative-track-copy strong")).not.toHaveText(title);
    await demo.getByRole("button", { name: "Mute", exact: true }).click();
    await expect(demo.getByRole("button", { name: "Unmute", exact: true })).toHaveAttribute("aria-pressed", "true");
    await demo.getByRole("button", { name: "Pause", exact: true }).click();
  }
});
