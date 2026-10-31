import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { APPEARANCE_VALUES } from "../components/ui/appearance";

const evidence = "out/rework-followup";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

test("sidebar keeps brand and search fixed, collapses, persists and searches once", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/components/anime-fire?style=terminal", { waitUntil: "networkidle" });
  const sidebar = page.getByRole("complementary", { name: "Documentation sidebar" });
  const head = sidebar.locator(".library-sidebar-head");
  const box = (await head.boundingBox())!;
  expect(box.y).toBe(0);
  await sidebar.locator(".library-sidebar-scroll").evaluate((el) => el.scrollTop = el.scrollHeight);
  await page.evaluate(() => scrollTo(0, 500));
  expect((await head.boundingBox())!.y).toBe(box.y);
  await expect(sidebar.getByRole("button", { name: "Search docs Ctrl K" })).toBeVisible();
  await sidebar.getByRole("button", { name: "Collapse sidebar" }).click();
  await expect(sidebar.locator(".library-sidebar-scroll")).toBeHidden();
  expect((await sidebar.boundingBox())!.width).toBe(64);
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("button", { name: "Expand sidebar" })).toBeVisible();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search docs", exact: true })).toHaveCount(1);
  await page.getByRole("combobox", { name: "Search all components" }).fill("SeasonTree");
  await page.getByRole("option", { name: /SeasonTree/ }).click();
  await expect(page).toHaveURL(/season-tree\?style=terminal/);
  await page.getByRole("button", { name: "Expand sidebar" }).click();
  await expect(page.getByRole("button", { name: "Collapse sidebar" })).toBeFocused();
});

test("mobile keeps search and component navigation reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/season-tree", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Open component navigation menu" }).click();
  const menu = page.getByRole("dialog", { name: "oRangeUi components" });
  await menu.getByRole("searchbox", { name: "Search navigation" }).fill("anime");
  await menu.getByRole("link", { name: "AnimeFire", exact: true }).click();
  await expect(menu).toBeHidden();
  await page.keyboard.press("Control+k");
  await expect(page.getByRole("dialog", { name: "Search docs", exact: true })).toHaveCount(1);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Search docs Ctrl K" })).toBeFocused();
  const theme = page.getByRole("button", { name: "Dark mode", exact: true });
  await expect(theme.locator("svg")).toBeVisible();
  await theme.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await expect(theme.locator("svg")).toBeVisible();
  const properties = page.getByRole("region", { name: "AnimeFire properties", exact: true });
  await expect(page.getByText("Scroll horizontally to view all columns.")).toBeVisible();
  expect((await properties.locator('tbody th').first().boundingBox())!.width).toBeGreaterThanOrEqual(160);
  await properties.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => properties.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  await properties.evaluate((el) => el.scrollLeft = el.scrollWidth);
  const regionBounds = (await properties.boundingBox())!;
  const descriptionBounds = (await properties.locator('tbody tr').first().locator('td').last().boundingBox())!;
  expect(descriptionBounds.x + descriptionBounds.width).toBeLessThanOrEqual(regionBounds.x + regionBounds.width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

for (const width of [1366, 390]) test(`fire and tree appearances, themes and rendering at ${width}px`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
  const observations = [];
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const appearance of APPEARANCE_VALUES) for (const slug of ["anime-fire", "season-tree"]) {
    await page.goto(`/components/${slug}?style=${appearance}`, { waitUntil: "networkidle" });
    const root = page.locator(`.creative-demo .${slug}`);
    await expect(root).toHaveAttribute("data-appearance", appearance);
    await expect(page.getByRole("combobox", { name: "Component appearance" })).toHaveValue(appearance);
    if (slug === "anime-fire") await expect(root).toHaveAttribute("data-renderer", "webgl");
    else {
      await root.getByRole("button", { name: "Winter", exact: true }).click();
      await expect(root.getByRole("img")).toHaveAccessibleName(/Winter tree/);
      await root.getByRole("button", { name: "Autumn", exact: true }).click();
      await expect(root.getByRole("img")).toHaveAccessibleName(/Autumn tree/);
    }
    for (const theme of ["dark", "light"]) {
      await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, theme);
      await expect(root).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      const violations = (await new AxeBuilder({ page }).analyze()).violations;
      expect(violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      const file = `${slug}-${appearance}-${theme}-${width}.png`;
      await page.screenshot({ path: `${evidence}/${file}` });
      observations.push({ slug, appearance, theme, width, violations, file });
    }
  }
  expect(errors).toEqual([]);
  await writeFile(`${evidence}/appearances-${width}.json`, JSON.stringify({ observations, errors }, null, 2));
});

test("driver blinks, greets automatically and can pause and resume", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/mini-driver", { waitUntil: "networkidle" });
  const driver = page.locator(".artwork-customizer .mini-driver");
  await expect(driver.locator(".driver-eye-blink")).toHaveCount(2);
  await expect(driver).toHaveAttribute("data-motion", "running");
  const motion = await driver.evaluate((el) => new Promise<{ gestures: string[]; blink: number }>((resolve) => {
    const gestures = new Set<string>();
    let blink = 1;
    const finish = () => { observer.disconnect(); clearTimeout(timer); resolve({ gestures: [...gestures], blink }); };
    const sample = () => {
      gestures.add(el.getAttribute("data-gesture") ?? "idle");
      blink = Math.min(blink, Number((el as HTMLElement).style.getPropertyValue("--blink-scale") || 1));
      if (gestures.has("wave") && gestures.has("thumbs-up") && blink < .5) finish();
    };
    const observer = new MutationObserver(sample);
    const timer = setTimeout(finish, 22000);
    observer.observe(el, { attributes: true, attributeFilter: ["style", "data-gesture"] });
    sample();
  }));
  expect(motion.gestures).toEqual(expect.arrayContaining(["wave", "thumbs-up"]));
  expect(motion.blink).toBeLessThan(.5);
  await driver.getByRole("button", { name: "Pause animation", exact: true }).click();
  await expect(driver).toHaveAttribute("data-paused", "true");
  const before = await driver.evaluate((el) => [el.getAttribute("data-gesture"), (el as HTMLElement).style.getPropertyValue("--blink-scale"), getComputedStyle(el.querySelector(".mini-driver-head")!).transform]);
  await page.waitForTimeout(350);
  expect(await driver.evaluate((el) => [el.getAttribute("data-gesture"), (el as HTMLElement).style.getPropertyValue("--blink-scale"), getComputedStyle(el.querySelector(".mini-driver-head")!).transform])).toEqual(before);
  await driver.getByRole("button", { name: "Resume animation", exact: true }).click();
  await driver.getByRole("button", { name: "Thumbs up", exact: true }).click();
  await expect(driver.getByRole("status")).toHaveText("The little driver gives a thumbs up.");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(driver).toHaveAttribute("data-motion", "reduced");
  await expect.poll(() => driver.evaluate((el) => (el as HTMLElement).style.getPropertyValue("--blink-scale"))).toBe("1");
});

for (const width of [1366, 390]) test(`follow-up artwork and player at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 768 });
  const observations = [];
  for (const slug of ["superbike", "mini-driver", "retro-player", "open-wheel-car", "helmet", "mascot-avatar", "character-avatar"]) {
    await page.goto(`/components/${slug}`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const violations = (await new AxeBuilder({ page }).analyze()).violations;
    expect(violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    if (slug === "mini-driver") {
      const bounds = (await page.locator(".artwork-customizer-preview").boundingBox())!;
      for (const selector of [".mini-driver-svg", ".mini-driver-controls", ".artwork-customizer-caption"]) {
        const child = (await page.locator(selector).first().boundingBox())!;
        expect(child.y).toBeGreaterThanOrEqual(bounds.y);
        expect(child.y + child.height).toBeLessThanOrEqual(bounds.y + bounds.height);
      }
    }
    await page.screenshot({ path: `${evidence}/${slug}-${width}.png` });
    if (slug === "retro-player") {
      const wheel = page.locator(".creative-demo .retro-click-wheel");
      const bounds = (await wheel.boundingBox())!;
      for (const name of ["MENU", "Play"]) {
        const button = (await wheel.getByRole("button", { name, exact: true }).first().boundingBox())!;
        expect(Math.abs(button.x + button.width / 2 - bounds.x - bounds.width / 2)).toBeLessThan(1);
      }
      const plug = await page.locator('.creative-demo .retro-earbuds rect[x="176"]').boundingBox();
      const body = (await page.locator(".creative-demo .retro-player-body").boundingBox())!;
      expect(plug!.y + plug!.height).toBeGreaterThan(body.y);
      expect(plug!.y).toBeLessThan(body.y);
    }
    observations.push({ slug, width, violations });
  }
  await writeFile(`${evidence}/artwork-${width}.json`, JSON.stringify(observations, null, 2));
});
