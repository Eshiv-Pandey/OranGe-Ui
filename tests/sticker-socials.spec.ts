import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const evidence = ".impeccable/review/navbar-film";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

for (const width of [320, 390, 900, 1440]) for (const theme of ["light", "dark"]) {
  test(`social stickers and sample card at ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.goto("/components/sticker-social-icons");
    const demo = page.locator(".sticker-social-demo");
    await expect(demo.getByRole("link")).toHaveCount(25);
    const sticker = demo.getByRole("link", { name: "Substack profile", exact: true });
    await sticker.focus();
    const card = page.locator(".portfolio-hover-card");
    await expect(card.getByRole("heading", { name: "Sample Studio" })).toBeVisible();
    await expect(card).toContainText("Substack"); await expect(card).toContainText("Sample profile");
    await expect(card.locator(".portfolio-hover-avatar")).toContainText("SS");
    const bounds = (await card.boundingBox())!;
    expect(bounds.x).toBeGreaterThanOrEqual(0); expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
    expect(bounds.y + bounds.height).toBeLessThanOrEqual(1000);
    expect(await card.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${evidence}/stickers-${width}-${theme}.png` });
    await page.keyboard.press("Escape");
    await expect(card).toBeHidden();
    await page.getByRole("checkbox", { name: "Profile hover cards" }).uncheck();
    await sticker.focus(); await expect(card).toHaveCount(0);
    for (const link of await demo.getByRole("link").all()) {
      const rect = (await link.boundingBox())!; expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44);
    }
    expect(errors).toEqual([]);
  });
}
