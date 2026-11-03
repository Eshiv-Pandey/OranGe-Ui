import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const slugs = ["bloom-trail", "human-avatar", "journal-stack", "photo-garland", "bubble-wrap", "film-strip", "focus-cards", "draggable-cards", "cipher-text", "wiggle-text", "flip-board", "halo-button", "floating-dock", "morph-input", "liquid-metal", "fluid-color-picker"];
const captures = ".impeccable/review/reference-expansion";
async function open(page: Page, slug: string) {
  const response = await page.goto(`/components/${slug}`); expect(response?.status()).toBe(200);
  await expect(page.locator("[data-main-preview]").first()).toBeVisible();
  await expect(page.locator("[data-preview-pending]")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [1440, 390]) for (const theme of ["light", "dark"] as const) test(`reference catalogue renders at ${width} in ${theme}`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
  const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
  const observations = [];
  await mkdir(captures, { recursive: true });
  for (const slug of slugs) {
    await open(page, slug); await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const preview = page.locator("[data-main-preview]").first();
    if (slug === "liquid-metal") await expect(preview.locator(".liquid-metal")).toHaveAttribute("data-renderer", "webgl2");
    if (slug === "morph-input") await preview.getByRole("button", { name: "Open search" }).click();
    if (slug === "cipher-text" || slug === "wiggle-text") expect(await preview.locator(`.${slug}`).evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(28);
    if (slug === "photo-garland") {
      const stage = await preview.locator(".photo-garland").boundingBox();
      for (const card of await preview.locator(".garland-photo").all()) {
        const box = await card.boundingBox(); expect(box!.x).toBeGreaterThanOrEqual(stage!.x); expect(box!.x + box!.width).toBeLessThanOrEqual(stage!.x + stage!.width);
      }
    }
    await expect.poll(() => preview.locator("img").evaluateAll((images) => images.every((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    const geometry = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(geometry.scroll, `${slug} page overflow`).toBeLessThanOrEqual(width + 1);
    await page.screenshot({ path: `${captures}/${slug}-${theme}-${width}.png`, fullPage: true, animations: "disabled" });
    await preview.screenshot({ path: `${captures}/${slug}-${theme}-${width}-preview.png`, animations: "disabled" });
    observations.push({ slug, ...geometry, errors: errors.length });
  }
  await writeFile(`out/iteration/reference-expansion/layout-${theme}-${width}.json`, JSON.stringify(observations, null, 2));
  expect(errors).toEqual([]);
});

test("human avatars remain separate and export real SVG and PNG artwork", async ({ page }) => {
  await open(page, "human-avatar");
  await expect(page.getByText("Human avatars", { exact: true }).first()).toBeVisible();
  await page.getByLabel("Hair", { exact: true }).selectOption("curls");
  await page.getByLabel("Expression", { exact: true }).selectOption("wink");
  await expect(page.locator(".human-avatar-hero svg")).toHaveAttribute("data-expression", "wink");
  for (const format of ["SVG", "PNG"]) { const download = page.waitForEvent("download"); await page.getByRole("button", { name: `Download ${format}`, exact: true }).click(); expect((await download).suggestedFilename()).toBe(`human-avatar.${format.toLowerCase()}`); }
  await open(page, "avatar"); await expect(page.getByLabel("Avatar seed", { exact: true })).toBeVisible();
});

test("paper interactions support selection, dragging and keyboard recovery", async ({ page }) => {
  await open(page, "journal-stack"); const journal = page.locator(".journal-stack");
  await journal.getByRole("button", { name: "Next journal page" }).click(); await expect(journal.getByRole("status")).toHaveText("4 / 6");
  await journal.getByRole("button", { name: "Next journal page" }).press("Home"); await expect(journal.getByRole("status")).toHaveText("1 / 6");
  await open(page, "photo-garland"); await page.getByRole("button", { name: "View Off the clock", exact: true }).click(); await expect(page.locator(".garland-caption")).toContainText("Somewhere the signal disappears.");
  await open(page, "film-strip"); await page.getByRole("button", { name: /^Select Stay a while,/ }).click(); await expect(page.locator(".film-strip-caption")).toContainText("We almost missed this turn.");
  await open(page, "draggable-cards"); const card = page.locator(".draggable-card").last(), before = await card.boundingBox(); expect(before).not.toBeNull();
  await card.focus(); await card.press("Shift+ArrowLeft"); const moved = await card.boundingBox(); expect(moved!.x).toBeLessThan(before!.x - 10);
  const box = await card.boundingBox(); await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2); await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 + 50, box!.y + box!.height / 2 - 30, { steps: 8 }); await page.mouse.up();
  const stage = await page.locator(".draggable-cards-stage").boundingBox(), after = await card.boundingBox(); expect(after!.x).toBeGreaterThanOrEqual(stage!.x - 10); expect(after!.x + after!.width).toBeLessThanOrEqual(stage!.x + stage!.width + 10);
  await page.getByRole("button", { name: "Reset card positions" }).click();
});

test("bubble wrap handles brush input, keyboard input and a fresh sheet", async ({ page }) => {
  await open(page, "bubble-wrap"); const first = page.getByRole("button", { name: "Bubble 1", exact: true });
  await first.focus(); await first.press("Space"); await expect(page.locator(".bubble-wrap-footer [role=status]")).toHaveText("1 / 108 popped");
  const second = await page.getByRole("button", { name: "Bubble 2", exact: true }).boundingBox(), fifth = await page.getByRole("button", { name: "Bubble 5", exact: true }).boundingBox();
  await page.mouse.move(second!.x + second!.width / 2, second!.y + second!.height / 2); await page.mouse.down(); await page.mouse.move(fifth!.x + fifth!.width / 2, fifth!.y + fifth!.height / 2, { steps: 12 }); await page.mouse.up();
  await expect(page.locator(".bubble-cell[aria-pressed=true]")).toHaveCount(5);
  await page.getByRole("button", { name: "Reset bubble wrap" }).click(); await expect(page.locator(".bubble-cell[aria-pressed=true]")).toHaveCount(0);
});

test("buttons, dock, search and color controls have working state and focus", async ({ page }) => {
  await open(page, "halo-button"); await page.getByRole("button", { name: "Make something good", exact: true }).click(); await expect(page.locator("[data-main-preview] [role=status]")).toHaveText("Activated 1 time.");
  await open(page, "floating-dock"); const home = page.getByRole("button", { name: "Home", exact: true }); await home.focus(); await home.press("ArrowRight"); await expect(page.getByRole("button", { name: "Library", exact: true })).toBeFocused(); await page.getByRole("button", { name: "Music", exact: true }).click(); await expect(page.locator("[data-main-preview] [role=status]")).toHaveText("Music selected");
  await open(page, "morph-input"); await page.getByRole("button", { name: "Open search", exact: true }).click(); const input = page.getByRole("searchbox", { name: "Find your next component", exact: true }); await input.fill("cards"); await input.press("Enter"); await expect(page.locator(".reference-search-results a").first()).toBeVisible(); await input.press("Escape"); await expect(page.getByRole("button", { name: "Open search", exact: true })).toBeFocused();
  await open(page, "fluid-color-picker"); const hex = page.getByRole("textbox", { name: "Hex", exact: true }); await hex.fill("#48b6a780"); await hex.press("Enter"); await expect(page.locator(".fluid-picker-heading")).toContainText("#48B6A780");
  await hex.fill("oops"); await hex.press("Enter"); await expect(page.locator(".fluid-picker-error")).toBeVisible(); await hex.fill("#48b6a7"); await hex.press("Enter"); await page.getByRole("slider", { name: "Saturation and brightness", exact: true }).focus(); await page.keyboard.press("ArrowLeft"); await expect(page.locator(".fluid-picker-heading")).not.toContainText("#48B6A7");
  await page.keyboard.press("Escape"); await expect(page.getByRole("button", { name: "Find your color", exact: true })).toBeFocused();
});

test("new previews pass scoped accessibility checks", async ({ page }) => {
  test.setTimeout(240_000); const results = [];
  for (const theme of ["light", "dark"]) for (const slug of slugs) {
    await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
    await open(page, slug);
    if (slug === "morph-input") await page.getByRole("button", { name: "Open search", exact: true }).click();
    const result = await new AxeBuilder({ page }).include("[data-main-preview]").analyze();
    results.push({ slug, theme, violations: result.violations });
  }
  await writeFile("out/iteration/reference-expansion/accessibility.json", JSON.stringify(results, null, 2));
  expect(results.flatMap(({ slug, violations }) => violations.map(({ id, nodes }) => ({ slug, id, nodes: nodes.map(({ target }) => target) })))).toEqual([]);
});

test("shader animates, responds to controls and restores its graphics context", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" }); await open(page, "liquid-metal"); const shader = page.locator(".liquid-metal"); await expect(shader).toHaveAttribute("data-renderer", "webgl2");
  const canvas = shader.locator("canvas"), before = await canvas.screenshot();
  await expect.poll(async () => (await canvas.screenshot()).equals(before), { timeout: 10_000 }).toBe(false);
  await page.getByLabel("Metal finish", { exact: true }).selectOption("gold"); await expect(page.getByLabel("Metal tint", { exact: true }).first()).toHaveValue("#edc47b");
  await canvas.evaluate((node) => {
    const surface = node as HTMLCanvasElement & { restoreTestContext?: () => void };
    const extension = surface.getContext("webgl2")?.getExtension("WEBGL_lose_context");
    if (!extension) throw new Error("Context loss extension is unavailable.");
    surface.restoreTestContext = () => extension.restoreContext(); extension.loseContext();
  });
  await expect(shader).toHaveAttribute("data-renderer", "fallback");
  await canvas.evaluate((node) => (node as HTMLCanvasElement & { restoreTestContext?: () => void }).restoreTestContext?.());
  await expect(shader).toHaveAttribute("data-renderer", "webgl2", { timeout: 10_000 });
  const size = await canvas.evaluate((node) => ({ width: (node as HTMLCanvasElement).width, height: (node as HTMLCanvasElement).height })); expect(size.width * size.height).toBeLessThanOrEqual(600_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.evaluate(() => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
  const reducedFrame = await canvas.screenshot();
  await page.waitForTimeout(400); // Compare a later frame to prove that animation stopped.
  expect((await canvas.screenshot()).equals(reducedFrame)).toBe(true);
});

test("static pages preserve human artwork, text and shader fallback without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: { width: 390, height: 844 } }); const page = await context.newPage();
  await page.goto("/components/human-avatar"); await expect(page.locator(".human-avatar-hero svg:visible")).toBeVisible();
  await page.goto("/components/cipher-text"); await expect(page.locator(".cipher-text:visible")).toContainText("MAKE ROOM");
  await page.goto("/components/liquid-metal"); await expect(page.locator(".liquid-metal:visible")).toHaveAttribute("data-renderer", "fallback");
  await context.close();
});
