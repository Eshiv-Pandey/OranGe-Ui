import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const evidence = ".impeccable/review/night-chai";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

for (const width of [320, 390, 900, 1440]) {
  test(`scene components and 404 at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 }); await page.emulateMedia({ reducedMotion: "reduce" });
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.goto("/a-page-on-a-chai-break");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("This page is out for a chai break.");
    await expect(page.getByRole("img")).toHaveAccessibleName("Chai being poured into a glass");
    await expect(page.getByRole("link", { name: "Take me home" })).toHaveAttribute("href", "/");
    await page.getByRole("link", { name: "Take me home" }).focus();
    expect(await page.getByRole("link", { name: "Take me home" }).evaluate(el => getComputedStyle(el).outlineStyle)).not.toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${evidence}/chai-${width}.png`, fullPage: true });
    for (const slug of ["neon-sign-404", "pavilion-footer"]) {
      await page.goto(`/components/${slug}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      if (slug === "neon-sign-404") {
        await expect(page.locator(".scene-neon-sizes .neon-sign")).toHaveCount(3);
        await expect(page.locator('.scene-neon-sizes [data-off="true"]')).toHaveCount(0);
      } else {
        const switchButton = page.getByRole("button", { name: "Light the pavilion" }); await switchButton.focus(); await page.keyboard.press("Space");
        await expect(page.getByRole("button", { name: "Dim the pavilion" })).toHaveAttribute("aria-pressed", "true");
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `${evidence}/${slug}-${width}.png`, fullPage: true });
      await page.getByRole("checkbox", { name: slug === "neon-sign-404" ? "Pixel tubes" : "Pixel pavilion" }).check();
      await page.screenshot({ path: `${evidence}/${slug}-pixel-${width}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test("neon flicker and chai motion pause, drag and keyboard input", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1100 }); await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/neon-sign-404");
  const sign = page.locator(".scene-neon-sizes .neon-sign").first(); await sign.scrollIntoViewIfNeeded();
  await expect.poll(() => sign.locator('[data-off="true"]').count(), { timeout: 10000, intervals: [30] }).toBe(1);
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(sign.locator('[data-off="true"]')).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Full 404 layout" }).check();
  await expect(page.locator(".neon-recovery h1")).toHaveText("This page is closed for the night.");
  await page.emulateMedia({ reducedMotion: "no-preference" }); await page.goto("/components/chai-break-404");
  const scene = page.locator(".scene-demo .chai-pour"); await scene.scrollIntoViewIfNeeded();
  const svg = scene.getByRole("img"); const box = (await svg.boundingBox())!;
  await page.mouse.move(box.x + box.width * .29, box.y + box.height * .42); await page.mouse.down(); await page.mouse.move(box.x + box.width * .35, box.y + box.height * .5, { steps: 5 });
  await expect(scene.locator("input")).not.toHaveValue("0"); await page.mouse.up(); await expect(scene.locator("input")).toHaveValue("0");
  const slider = scene.getByRole("slider"); await slider.focus(); await page.keyboard.down("ArrowRight");
  await expect(slider).toHaveValue("1"); await page.keyboard.up("ArrowRight"); await expect(slider).toHaveValue("0");
  await expect.poll(() => scene.locator(".chai-tea").getAttribute("transform"), { timeout: 7000 }).not.toBe("translate(0 130)");
  await page.screenshot({ path: `${evidence}/chai-active-1440.png`, fullPage: true });
});
