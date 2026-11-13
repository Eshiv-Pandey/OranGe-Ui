import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
const captures = path.resolve(".impeccable/review/paper-cut");

test("cursor, keyboard and editor drive the original geometry and settle safely", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 }); await page.goto("/components/paper-cut");
  const art = page.locator('[data-testid="live-demo"] .paper-cut'); await expect(art).toBeVisible();
  await expect(art).toHaveAttribute("data-paper-motion", "ready");
  const box = (await art.boundingBox())!; await page.mouse.move(box.x + box.width * .9, box.y + box.height * .8);
  await expect.poll(() => art.getAttribute("data-paper-position")).toMatch(/^0\.800,0\.600$/);
  const moved = await art.locator("[data-paper-sheet]").first().getAttribute("transform"); expect(moved).not.toContain("translate(0.000 0.000)");
  await art.screenshot({ path: path.join(captures, "art-desktop-hover.png") });
  await page.mouse.move(0, 0); await expect.poll(() => art.getAttribute("data-paper-position")).toBe("0.000,0.000");
  await art.focus(); await page.keyboard.press("ArrowRight"); await expect.poll(() => art.getAttribute("data-paper-position")).toBe("0.200,0.000");
  await page.keyboard.press("Escape"); await expect.poll(() => art.getAttribute("data-paper-position")).toBe("0.000,0.000");
  const initial = await art.locator("path").first().getAttribute("d"); await page.getByRole("button", { name: "New contours" }).click(); expect(await art.locator("path").first().getAttribute("d")).not.toBe(initial);
  await page.getByLabel("Paper palette").selectOption("citrus"); await expect(art.locator("rect")).toHaveAttribute("fill", "#fff9ee");
  await page.getByRole("button", { name: "Reset artwork" }).click(); expect(await art.locator("path").first().getAttribute("d")).toBe(initial);
  const zip = await page.request.get("/api/components/paper-cut?style=polished"); expect(zip.status()).toBe(200); expect(zip.headers()["content-type"]).toContain("zip");
  const registry = await page.request.get("/r/paper-cut.json?style=polished"); expect(registry.status()).toBe(200);
});

test("desktop and phone artwork fit both themes, reduced motion and the public catalogue", async ({ page }) => {
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  for (const device of [{ name: "desktop", width: 1440, height: 1000 }, { name: "mobile", width: 390, height: 844 }]) {
    await page.setViewportSize({ width: device.width, height: device.height });
    for (const theme of ["light", "dark"]) {
      await page.goto("/components/paper-cut"); await page.evaluate(value => { document.documentElement.classList.remove("light", "dark"); document.documentElement.classList.add(value); document.documentElement.dataset.theme = value; }, theme);
      const art = page.locator('[data-testid="live-demo"] .paper-cut'); await expect(art).toBeVisible();
      await expect.poll(() => art.getAttribute("data-paper-position")).toBe("0.000,0.000");
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
      const analysis = await new AxeBuilder({ page }).include(".paper-cut-demo").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); expect(analysis.violations).toEqual([]);
      await page.screenshot({ path: path.join(captures, `${device.name}-${theme}.png`), fullPage: true });
      await art.screenshot({ path: path.join(captures, `art-${device.name}-${theme}.png`) });
    }
  }
  await page.emulateMedia({ reducedMotion: "reduce" }); const art = page.locator('[data-testid="live-demo"] .paper-cut');
  await expect(art).toHaveAttribute("data-paper-motion", "reduced"); const box = (await art.boundingBox())!;
  await page.mouse.move(box.x + box.width * .9, box.y + box.height * .8); await expect(art).toHaveAttribute("data-paper-position", "0.000,0.000");
  await page.goto("/components"); await page.getByRole("searchbox", { name: "Search all components" }).fill("PaperCut");
  const card = page.locator(".tile-paper-cut"); await expect(card.locator(".paper-cut")).toBeVisible(); await card.screenshot({ path: path.join(captures, "catalogue-card.png") });
  expect(errors).toEqual([]);
});
