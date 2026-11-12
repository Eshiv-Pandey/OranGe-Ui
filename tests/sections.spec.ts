import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

const bentos = [
  ["wildseed-bento", ".sb-wildseed"], ["current-bento", ".sb-current"],
  ["revenue-bento", ".sb-revenue"], ["studio-bento", ".sb-studio"],
  ["neon-bento", ".sb-neon-bento"], ["bento-overview", ".ob-bento-overview"],
];
const heroes = [
  ["playground-hero", ".sb-playground-hero"], ["oddkin-hero", ".sb-oddkin-hero"],
  ["woven-hero", ".sb-woven-hero"], ["neon-hero", ".sb-neon-hero"],
  ["editorial-hero", ".ob-editorial-hero"], ["product-hero", ".ob-product-hero"],
];
const sections = process.env.SECTIONS_SCOPE === "hero" ? heroes : process.env.SECTIONS_SCOPE === "bento" ? bentos : [...bentos, ...heroes];
test.beforeAll(async () => { await mkdir("out/section-expansion/captures", { recursive: true }); });

test("new and existing sections fit phone, tablet and desktop in both palettes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [slug, selector] of sections) {
      await page.goto(`/preview/blocks/${slug}`, { waitUntil: "load" });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}); })); });
      for (const palette of ["light", "dark"]) {
        await page.getByLabel("Preview palette").selectOption(palette);
        const section = page.locator(selector);
        expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${slug} ${width} ${palette} viewport`).toBe(true);
        expect.soft(await section.locator("a[href],button").evaluateAll(elements => elements.every(element => {
          const box = element.getBoundingClientRect();
          return box.width === 0 || (box.left >= -1 && box.right <= innerWidth + 1);
        })), `${slug} ${width} content`).toBe(true);
        expect(await section.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0)), `${slug} loaded assets`).toBe(true);
        expect.soft(await section.locator("h1,h2,h3,p").evaluateAll(elements => elements.every(element => {
          let ancestor = element.parentElement;
          while (ancestor && !/(hidden|clip)/.test(getComputedStyle(ancestor).overflow)) ancestor = ancestor.parentElement;
          if (!ancestor) return true;
          const boundary = ancestor.getBoundingClientRect(), range = document.createRange();
          range.selectNodeContents(element);
          const ink = range.getBoundingClientRect();
          return ink.left >= boundary.left - 1 && ink.right <= boundary.right + 1;
        })), `${slug} ${width} text fits the clipping boundary`).toBe(true);
        const result = await new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa"]).analyze();
        expect.soft(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), `${slug} ${width} ${palette}`).toEqual([]);
        if (palette === "light") await section.screenshot({ path: `out/section-expansion/captures/${slug}-${width}.png`, animations: "disabled" });
      }
    }
  }
  expect(errors).toEqual([]);
});

test("catalogue ordering, agent prompt and keyboard revenue controls work", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blocks/category/bento");
  await expect(page.locator(".bc-entry").first()).toHaveAttribute("id", "block-wildseed-bento");
  const revenue = page.locator("#block-revenue-bento");
  await revenue.getByRole("button", { name: "Quarterly", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(revenue.getByText("$73,242", { exact: true })).toBeVisible();
  await revenue.getByRole("button", { name: "Copy RevenueBento prompt for your agent" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("block-revenue-bento.json");
  await page.goto("/preview/blocks/neon-bento");
  await expect(page.locator(".neon-sign")).toHaveAttribute("data-off-count", "0");
});

test("Hero collection leads with the new layouts and has a portable prompt", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blocks/category/hero");
  await expect(page.locator(".bc-entry").first()).toHaveAttribute("id", "block-playground-hero");
  const woven = page.locator("#block-woven-hero");
  await woven.getByRole("button", { name: "Copy WovenHero prompt for your agent" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("block-woven-hero.json");
  const response = await page.request.get("/r/block-woven-hero.json");
  expect(response.ok()).toBe(true);
  const payload = await response.json();
  expect(payload.files.some((file: { content: string }) => file.content.includes("data:image/webp;base64,"))).toBe(true);
  await page.goto("/preview/blocks/neon-hero");
  await expect(page.locator(".neon-sign")).toHaveAttribute("data-off-count", "0");
});
