import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { components } from "../lib/components";
import { APPEARANCE_VALUES } from "../components/ui/appearance";
import { strFromU8, unzipSync } from "fflate";

const artifacts = "out/iteration/six-task/browser";
test.beforeAll(async () => { await mkdir(artifacts, { recursive: true }); });

for (const width of [1440, 390]) test(`landscape catalogue entry and licensing work at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("orange UI");
  await expect(page.locator(".reference-background canvas")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "Get Started", exact: true })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Components", exact: true })).toHaveAttribute("href", "/components");
  await page.getByRole("link", { name: "Components", exact: true }).click();
  await expect(page).toHaveURL(/\/components$/);
  await expect(page.locator(".component-grid")).toBeVisible();
  await page.goto("/pricing");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free to build with.");
  await expect(page.locator("main")).toContainText("MIT license");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `${artifacts}/pricing-${width}.png`, fullPage: true });
  await page.getByRole("link", { name: "Back to orange UI", exact: true }).click();
  await expect(page.getByRole("link", { name: "Components", exact: true })).toBeVisible();
});

test("the photographic landing and licensing remain usable without JavaScript", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  try {
    const page = await context.newPage();
    await page.goto(new URL("/", baseURL!).href);
    await expect(page.locator(".reference-background")).toHaveAttribute("data-renderer", "fallback");
    await expect(page.locator(".reference-static")).toHaveCSS("background-image", /sunset-scene\.png/);
    await expect(page.getByRole("link", { name: "Components", exact: true })).toBeVisible();
    await page.getByRole("link", { name: "Components", exact: true }).click();
    await expect(page).toHaveURL(/\/components$/);
    await page.goto(new URL("/pricing", baseURL!).href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Free to build with.");
  } finally { await context.close(); }
});

test("component entry resets sidebar, reload, history, and search navigation", async ({ page }) => {
  await page.goto("/components/button");
  await page.getByRole("link", { name: "Read component documentation" }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
  await page.locator(".library-sidebar").getByRole("link", { name: "Breadcrumb", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/breadcrumb/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole("tab", { name: "Preview", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Usage", exact: true }).click();
  await page.getByRole("link", { name: "Read component documentation" }).click();
  await page.locator(".library-sidebar").getByRole("link", { name: "Breadcrumb", exact: true }).click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole("tab", { name: "Preview", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("link", { name: "Read component documentation" }).click();
  await page.reload();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.locator(".library-sidebar").getByRole("link", { name: "Button", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/button/);
  await page.goBack();
  await expect(page).toHaveURL(/\/components\/breadcrumb/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole("button", { name: "Search docs Ctrl K" }).first().click();
  await page.getByRole("combobox", { name: "Search all components" }).fill("FlowingWater");
  await page.getByRole("option", { name: /FlowingWater/ }).click();
  await expect(page).toHaveURL(/\/components\/flowing-water/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
});

test("the glass view dock floats above a full-height canvas and works by keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/flowing-water");
  await expect(page.locator(".flowing-water")).toHaveAttribute("data-renderer", "webgl2");
  const stage = (await page.locator(".workspace-stage").boundingBox())!;
  const canvas = (await page.locator(".flowing-water").boundingBox())!;
  const dock = page.locator(".workspace-stage-toolbar"), dockBox = (await dock.boundingBox())!;
  expect(stage.height).toBeGreaterThan(865);
  expect(Math.abs(canvas.height - stage.height)).toBeLessThan(4);
  expect(dockBox.y + dockBox.height).toBeLessThan(stage.y + stage.height);
  expect(dockBox.y).toBeGreaterThan(canvas.y + canvas.height - 95);
  await expect(dock).toHaveCSS("position", "absolute");
  await expect(dock).toHaveCSS("backdrop-filter", /blur/);
  const preview = page.getByRole("tab", { name: "Preview", exact: true });
  await preview.focus(); await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Usage", exact: true })).toBeFocused();
  await expect(page.locator(".workspace-view .code-block")).toContainText("FlowingWater");
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Source", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(preview).toHaveAttribute("aria-selected", "true");
});

test("exact values and colors edit the real preview with clear cursor feedback", async ({ page }) => {
  await page.goto("/components/flowing-water");
  await expect(page.locator(".flowing-water")).toHaveAttribute("data-renderer", "webgl2");
  const number = page.getByRole("spinbutton", { name: "Flow speed value" });
  await number.fill("1.25"); await number.press("Tab");
  await expect(page.getByRole("slider", { name: "Flow speed", exact: true })).toHaveValue("1.25");
  await expect(number).toHaveCSS("cursor", "text");
  await expect(page.getByRole("slider", { name: "Flow speed", exact: true })).toHaveCSS("cursor", "ew-resize");
  const hex = page.getByRole("textbox", { name: "Water color hex" });
  const before = await page.locator(".flowing-water canvas").screenshot();
  await hex.fill("#f04080"); await hex.press("Tab");
  await expect(page.getByLabel("Water color", { exact: true })).toHaveValue("#f04080");
  const after = await page.locator(".flowing-water canvas").screenshot();
  expect(before.equals(after)).toBe(false);
  await expect(page.getByLabel("Water color", { exact: true })).toHaveCSS("cursor", "pointer");
  await expect(page.getByLabel("Canvas theme", { exact: true })).toHaveCSS("cursor", "pointer");
  const bounds = (await page.locator(".workspace-stage").boundingBox())!;
  await page.locator(".workspace-inspector-body").evaluate((element) => element.scrollTop = element.scrollHeight);
  expect((await page.locator(".workspace-stage").boundingBox())!.y).toBe(bounds.y);
  expect(await page.evaluate(() => scrollY)).toBe(0);
  await page.getByRole("button", { name: "API reference", exact: true }).click();
  await expect(page.locator(".workspace-default-properties")).toBeVisible();
  await expect(number).toBeHidden();
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await expect(number).toHaveValue("1.25");
});

test("shader appearance changes preserve the canvas and edits until an explicit reset", async ({ page }) => {
  await page.goto("/components/flowing-water?style=polished");
  const scene = page.locator(".flowing-water");
  await expect(scene).toHaveAttribute("data-renderer", "webgl2");
  const speed = page.getByRole("spinbutton", { name: "Flow speed value" });
  const originalSpeed = await speed.inputValue();
  await speed.fill("1.25"); await speed.press("Tab");
  const originalCanvas = await scene.locator("canvas").elementHandle();
  await page.locator(".header-appearance select").selectOption("pixel");
  await expect(scene).toHaveAttribute("data-appearance", "pixel");
  await expect(speed).toHaveValue("1.25");
  expect(await originalCanvas!.evaluate((canvas) => canvas === document.querySelector(".flowing-water canvas"))).toBe(true);
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(speed).toHaveValue(originalSpeed);
  expect(await originalCanvas!.evaluate((canvas) => canvas.isConnected)).toBe(false);
  await originalCanvas!.dispose();
});

for (const [width, height] of [[1440, 900], [1280, 768], [768, 1024], [390, 844], [360, 800]]) {
  test(`the playground and editor fit ${width}px in both palettes`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    for (const palette of ["dark", "light"]) {
      await page.goto("/components/flowing-water", { waitUntil: "domcontentloaded" });
      await page.evaluate((theme) => { document.documentElement.dataset.theme = theme; }, palette);
      await expect(page.locator(".flowing-water")).toHaveAttribute("data-renderer", "webgl2");
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const stage = (await page.locator(".workspace-stage").boundingBox())!;
      const inspector = (await page.locator(".workspace-inspector").boundingBox())!;
      const dock = (await page.locator(".workspace-stage-toolbar").boundingBox())!;
      expect(dock.x).toBeGreaterThanOrEqual(stage.x);
      expect(dock.x + dock.width).toBeLessThanOrEqual(stage.x + stage.width);
      if (width <= 800) expect(inspector.y).toBeGreaterThanOrEqual(stage.y + stage.height);
      else expect(inspector.x).toBeGreaterThanOrEqual(stage.x + stage.width);
      await page.screenshot({ path: `${artifacts}/workspace-${width}-${palette}.png`, fullPage: false });
      await page.screenshot({ path: `${artifacts}/workspace-${width}-${palette}-full.png`, fullPage: true });
      const results = await new AxeBuilder({ page }).include(".component-workspace").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations).toEqual([]);
    }
  });
}

test("every catalogue component opens at its initial preview after reading documentation", async ({ page }) => {
  test.setTimeout(600_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/components/button?style=polished");
  const views = page.getByRole("tablist", { name: "Example view" });
  const visited: string[] = [];
  for (const component of components) {
    await test.step(component.name, async () => {
      await views.getByRole("tab", { name: "Usage", exact: true }).click();
      await page.getByRole("link", { name: "Read component documentation" }).click();
      await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(300);
      await page.locator(`.library-sidebar a[href^="/components/${component.slug}?"]`).click();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(component.name);
      await expect(page).toHaveURL(new RegExp(`/components/${component.slug}(?:\\?|$)`));
      await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
      await expect(views.getByRole("tab", { name: "Preview", exact: true })).toHaveAttribute("aria-selected", "true");
      visited.push(component.slug);
    });
  }
  await writeFile(`${artifacts}/catalogue-navigation.json`, JSON.stringify({ total: components.length, visited }, null, 2));
});

test("catalogue and adjacent component links restore the playground", async ({ page }) => {
  test.setTimeout(300_000);
  await page.goto("/components?style=polished");
  await page.getByRole("searchbox", { name: "Search all components" }).fill("FlowingGrass");
  await page.locator(".component-tile h2").getByRole("link", { name: "FlowingGrass", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/flowing-grass/);
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  const adjacent = page.getByRole("navigation", { name: "Adjacent components" });
  await adjacent.getByRole("link", { name: /NEXT/ }).click();
  await expect(page).toHaveURL(/\/components\/drifting-clouds/);
  // Software WebGL can spend more than ten seconds compiling the first cloud
  // program. Wait for that work before evaluating document scroll.
  await expect(page.locator(".drifting-clouds")).toHaveAttribute("data-renderer", "webgl2", { timeout: 180_000 });
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  await expect(page.getByRole("tab", { name: "Preview", exact: true })).toHaveAttribute("aria-selected", "true");
});

for (const appearance of APPEARANCE_VALUES) for (const nature of [
  { slug: "flowing-grass", name: "FlowingGrass", color: "Grass color", field: "Grass density", value: "105", module: "grass-renderer.ts" },
  { slug: "drifting-clouds", name: "DriftingClouds", color: "Sky color", field: "Sun angle", value: "210", module: "clouds-field.ts" },
]) {
  test(`${nature.name} edits and downloads in ${appearance}`, async ({ page, request }) => {
    test.setTimeout(300_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/components/${nature.slug}?style=${appearance}`);
    const scene = page.locator(`.${nature.slug}`);
    await expect(scene).toHaveAttribute("data-renderer", "webgl2", { timeout: 180_000 });
    await expect(scene).toHaveAttribute("data-appearance", appearance);
    // Keep this control/palette check inexpensive while rendering actual GLSL.
    const scale = page.getByRole("spinbutton", { name: "Render scale value" });
    await scale.fill("0.25"); await scale.press("Tab");
    const field = page.getByRole("spinbutton", { name: `${nature.field} value` });
    await field.fill(nature.value); await field.press("Tab");
    await expect(page.getByRole("slider", { name: nature.field, exact: true })).toHaveValue(nature.value);
    const before = await scene.locator("canvas").screenshot();
    const color = page.getByRole("textbox", { name: `${nature.color} hex` });
    await color.fill("#be285c"); await color.press("Tab");
    await expect(page.getByLabel(nature.color, { exact: true })).toHaveValue("#be285c");
    expect(before.equals(await scene.locator("canvas").screenshot())).toBe(false);
    for (const palette of ["light", "dark"]) {
      await page.evaluate((theme) => document.documentElement.dataset.theme = theme, palette);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const results = await new AxeBuilder({ page }).include(".component-workspace").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      expect(results.violations).toEqual([]);
    }
    const response = await request.get(`/api/components/${nature.slug}?style=${appearance}`);
    expect(response.status()).toBe(200);
    const files = unzipSync(await response.body());
    expect(files[`components/ui/${nature.slug}.tsx`]).toBeDefined();
    expect(files[`components/ui/shader-canvas/${nature.module}`]).toBeDefined();
    expect(strFromU8(files["Example.tsx"])).toContain(`appearance="${appearance}"`);
    expect(files["LICENSE"]).toBeDefined();
    expect(errors).toEqual([]);
  });
}
