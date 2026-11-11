import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { components, componentsInCollection } from "../lib/components";
import { APPEARANCES, APPEARANCE_VALUES } from "../components/ui/appearance";

test.use({ reducedMotion: "reduce" });
async function open(page: Page, slug: string, appearance = "polished") {
  await page.goto(`/components/${slug}?style=${appearance}`);
  await expect(page.getByTestId("live-demo")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page.getByTestId("live-demo");
}

async function expectMainInert(page: Page, inert: boolean) {
  await expect.poll(() => page.locator("#library-main").evaluate((main) => Boolean(main.closest("[inert]")))).toBe(inert);
  if (!inert) {
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  }
}

function activeChoiceAudit(page: Page, selector: ".ui-select-content" | ".ui-menu") {
  // Modal choices hide the page landmarks. Their temporary popup is not a document
  // landmark; the full, unfiltered document audit runs again after it closes.
  return new AxeBuilder({ page }).include(selector).disableRules(["region"]);
}

for (const theme of ["light", "dark"] as const) for (const appearance of APPEARANCE_VALUES) {
  const collection = componentsInCollection(appearance);
  test(`all ${collection.length} components render with accessible ${appearance} styling in ${theme}`, async ({ page }) => {
    test.setTimeout(300_000); await page.setViewportSize({ width: 1440, height: 1100 });
    await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
    const observations = [];
    await mkdir(`out/library/${appearance}-${theme}`, { recursive: true });
    for (const c of collection) {
      const demo = await open(page, c.slug, appearance);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(c.name + "✦");
      await expect(demo.locator(`[data-appearance="${appearance}"]`).first()).toBeVisible();
      const accessibility = await new AxeBuilder({ page }).analyze();
      const violations = accessibility.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target), summaries: v.nodes.map((n) => n.failureSummary) }));
      expect.soft(violations, `${c.name} ${appearance} ${theme}`).toEqual([]);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
      expect.soft(overflow, `${c.name} fits the viewport`).toBe(false);
      await demo.screenshot({ path: `out/library/${appearance}-${theme}/${c.slug}.png`, animations: "disabled" });
      observations.push({ slug: c.slug, violations, overflow });
    }
    await writeFile(`out/library/${appearance}-${theme}/report.json`, JSON.stringify({ theme, appearance, checked: observations.length, errors, observations }, null, 2));
    expect(errors).toEqual([]);
  });
}

for (const width of [1440, 768, 390, 360]) test(`catalogue search and category flow at ${width}px`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.goto("/components?style=pixel"); await expect(page.locator(".component-tile")).toHaveCount(componentsInCollection("pixel").length);
  if (width < 721) {
    const theme = page.getByRole("button", { name: "Dark mode" });
    await expect(theme.locator("svg")).toBeVisible();
    expect((await theme.boundingBox())!.width).toBeGreaterThanOrEqual(44);
    await theme.click(); await expect(theme).toHaveAttribute("aria-pressed", "true");
    await page.reload(); await expect(theme).toHaveAttribute("aria-pressed", "true");
    await theme.click();
  }
  const search = page.getByRole("searchbox", { name: "Search all components" });
  await search.fill("gamer"); await expect(page.locator(".component-tile")).toHaveCount(1); await expect(page.locator(".component-tile")).toContainText("GamerBoy");
  await search.fill("not-here"); await expect(page.getByRole("heading", { name: "A little too specific?" })).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click(); await page.getByRole("button", { name: "Play", exact: true }).click();
  await expect(page.locator(".component-tile")).toHaveCount(componentsInCollection("pixel").filter((component) => component.category === "Play").length); await page.locator(".component-tile").getByRole("link", { name: "GamerBoy" }).click();
  await expect(page).toHaveURL(/gamer-boy\?style=pixel/); await expect(page.getByTestId("live-demo").locator(".gamer-boy-device")).toHaveAttribute("data-appearance", "pixel");
  await page.getByRole("button", { name: "Polished", exact: true }).click(); await expect(page).toHaveURL(/style=polished/);
  await page.reload(); await expect(page.getByRole("button", { name: "Polished", exact: true })).toHaveAttribute("aria-pressed", "true");
  const device = page.getByRole("group", { name: "Interactive handheld console" }); await device.focus(); await device.press("Enter"); await device.press("ArrowRight");
  await expect(page.locator(".console-board")).toHaveAttribute("data-player", "3,1");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  await page.screenshot({ path: `out/library/gamer-boy-${width}.png`, fullPage: true });
  if (width < 721) {
    await page.getByRole("button", { name: "Open component navigation" }).click(); const menu = page.getByRole("dialog"); await expect(menu).toBeVisible();
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    await page.screenshot({ path: `out/library/mobile-navigation-${width}.png` });
    await menu.getByRole("searchbox", { name: "Search navigation" }).fill("checkbox"); await menu.getByRole("link", { name: "Checkbox", exact: true }).click();
    await expect(menu).not.toBeVisible(); await expect(page).toHaveURL(/checkbox\?style=polished/);
  }
  await page.goto("/components?style=pixel"); await page.evaluate(() => document.fonts.ready);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `out/library/catalogue-${width}-pixel.png`, fullPage: true });
});

for (const theme of ["light", "dark"] as const) for (const appearance of APPEARANCE_VALUES) test(`${appearance} controls, overlays, menus and feedback work by keyboard in ${theme}`, async ({ page }) => {
  test.setTimeout(180_000); await page.setViewportSize({ width: 1280, height: 1000 });
  await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
  let demo = await open(page, "button", appearance); await demo.getByRole("button", { name: "Save a little joy" }).press("Enter"); await expect(demo.getByRole("button", { name: "Saved!" })).toHaveAttribute("aria-pressed", "true");
  demo = await open(page, "input", appearance); await demo.getByRole("button", { name: "Try validation" }).click(); await expect(demo.getByRole("alert")).toHaveText("Enter a valid email address."); await demo.getByRole("textbox").fill("hello@example.com"); await demo.getByRole("button", { name: "Try validation" }).click(); await expect(demo.getByRole("status")).toHaveText("Looks good. Ready to go!");
  demo = await open(page, "textarea", appearance); await demo.getByRole("textbox").fill("A little idea"); await demo.getByRole("button", { name: "Save draft" }).click(); await expect(demo.getByRole("status")).toContainText("Draft saved");
  demo = await open(page, "select", appearance);
  const select = demo.getByRole("combobox");
  await expectMainInert(page, false);
  await select.focus(); await select.press("ArrowDown");
  await expect(page.getByRole("listbox")).toBeVisible();
  await expectMainInert(page, true);
  expect((await activeChoiceAudit(page, ".ui-select-content").analyze()).violations).toEqual([]);
  await page.keyboard.press("Home"); await page.keyboard.press("Enter");
  await expect(page.getByRole("listbox")).not.toBeVisible();
  await expectMainInert(page, false);
  await expect(select).toContainText("Orange studio"); await expect(select).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  demo = await open(page, "checkbox", appearance); const checkbox = demo.getByRole("checkbox", { name: "Keep me in the loop" }); await checkbox.press("Space"); await expect(checkbox).not.toBeChecked();
  demo = await open(page, "radio-group", appearance); const personal = demo.getByRole("radio", { name: "Just me" }); await personal.focus();
  // Radix defers roving focus to a timer and selects on focus while the arrow is
  // held. Wait for that response before keyup instead of sending a zero-time tap.
  await page.keyboard.down("ArrowDown");
  try { await expect(demo.getByRole("radio", { name: "With my team" })).toBeFocused(); await expect(demo.getByRole("radio", { name: "With my team" })).toBeChecked(); }
  finally { await page.keyboard.up("ArrowDown"); }
  demo = await open(page, "switch", appearance); const quiet = demo.getByRole("switch", { name: "Quiet hours" }); await quiet.press("Space"); await expect(quiet).not.toBeChecked();
  demo = await open(page, "slider", appearance); const slider = demo.getByRole("slider", { name: "A little background music", exact: true }); await slider.focus(); await slider.press("End"); await expect(slider).toHaveAttribute("aria-valuenow", "100"); await slider.press("Home"); await expect(slider).toHaveAttribute("aria-valuenow", "0");
  demo = await open(page, "toggle", appearance); const toggle = demo.getByRole("button", { name: "Pin this project" }); await toggle.press("Space"); await expect(toggle).toHaveAttribute("aria-pressed", "false");
  demo = await open(page, "toggle-group", appearance); await demo.getByRole("radio", { name: "Center" }).click(); await expect(demo.getByRole("radio", { name: "Center" })).toHaveAttribute("aria-checked", "true");
  demo = await open(page, "accordion", appearance); const accordion = demo.getByRole("button", { name: "Can I use this commercially?" }); await accordion.press("Enter"); await expect(accordion).toHaveAttribute("aria-expanded", "true"); await expect(demo.getByText(/Yes. The MIT license/)).toBeVisible();
  demo = await open(page, "tabs", appearance); await demo.getByRole("tab", { name: "Overview" }).focus(); await page.keyboard.press("ArrowRight"); await expect(demo.getByRole("tab", { name: "Activity" })).toHaveAttribute("aria-selected", "true"); await expect(demo.getByRole("tabpanel")).toContainText("first component");
  demo = await open(page, "pagination", appearance); await demo.getByRole("button", { name: "Page 8", exact: true }).click(); await expect(demo.getByRole("button", { name: "Next page" })).toBeDisabled();
  demo = await open(page, "dropdown-menu", appearance);
  const trigger = demo.getByRole("button", { name: "Project actions" });
  await expectMainInert(page, false);
  await trigger.press("Enter"); await expect(page.getByRole("menu")).toBeVisible();
  await expectMainInert(page, true);
  await page.getByRole("menu").screenshot({ path: `out/library/menu-${appearance}-${theme}.png` });
  expect((await activeChoiceAudit(page, ".ui-menu").analyze()).violations).toEqual([]);
  await page.keyboard.press("Home"); await page.keyboard.press("Enter");
  await expect(page.getByRole("menu")).not.toBeVisible();
  await expectMainInert(page, false);
  await expect(demo.getByRole("status")).toContainText("duplicated"); await expect(trigger).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  demo = await open(page, "command", appearance); const command = demo.getByRole("combobox"); await command.fill("theme"); await command.press("Enter"); await expect(demo.getByRole("status")).toHaveText("Change appearance selected"); await command.press("Escape"); await expect(demo.getByRole("option")).toHaveCount(4);
  demo = await open(page, "dialog", appearance); const dialogTrigger = demo.getByRole("button", { name: "Create a workspace" }); await dialogTrigger.press("Enter"); const dialog = page.getByRole("dialog"); await expect(dialog.getByRole("textbox")).toBeFocused(); await page.keyboard.press("Shift+Tab"); await expect(dialog.getByRole("button", { name: "Close dialog" })).toBeFocused(); await page.keyboard.press("Tab"); await expect(dialog.getByRole("textbox")).toBeFocused(); await dialog.screenshot({ path: `out/library/dialog-${appearance}-${theme}.png` }); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); await page.keyboard.press("Escape"); await expect(dialogTrigger).toBeFocused(); await dialogTrigger.click(); await dialog.getByRole("textbox").fill("Little studio"); await dialog.getByRole("button", { name: "Create workspace" }).click(); await expect(demo.getByRole("status")).toContainText("Little studio created");
  demo = await open(page, "sheet", appearance); const sheetTrigger = demo.getByRole("button", { name: "Workspace preferences" }); await sheetTrigger.click(); await expect(page.getByRole("dialog")).toBeVisible(); await page.getByRole("dialog").getByRole("switch", { name: "Quiet hours" }).click(); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); await page.keyboard.press("Escape"); await expect(sheetTrigger).toBeFocused();
  demo = await open(page, "popover", appearance); await demo.getByRole("button", { name: "Edit project name" }).click(); await page.getByRole("dialog").getByRole("textbox").fill("Pocket garden"); await page.getByRole("dialog").getByRole("button", { name: "Save name" }).click(); await expect(demo.getByRole("status")).toContainText("renamed to Pocket garden");
  demo = await open(page, "tooltip", appearance); await demo.getByRole("button").focus(); await expect(page.getByRole("tooltip")).toContainText("Mumbai"); await page.keyboard.press("Escape"); await expect(page.getByRole("tooltip")).not.toBeVisible();
  demo = await open(page, "toast", appearance); await demo.getByRole("button", { name: "Save changes" }).click(); await expect(page.locator(".ui-toast")).toBeVisible(); await page.getByRole("button", { name: "Undo", exact: true }).focus(); expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]); await page.getByRole("button", { name: "Undo", exact: true }).press("Enter"); await expect(demo.getByRole("status")).toHaveText("Changes undone.");
  demo = await open(page, "alert", appearance); await demo.getByRole("button", { name: "Dismiss alert" }).click(); await expect(demo.getByText("Everything is up to date.")).not.toBeVisible();
  demo = await open(page, "progress", appearance); await demo.getByRole("button", { name: "Advance" }).click(); await expect(demo.getByRole("progressbar").first()).toHaveAttribute("aria-valuenow", "60");
  demo = await open(page, "skeleton", appearance); await demo.getByRole("button", { name: "Reveal content" }).click(); await expect(demo.getByRole("heading", { name: "Orange studio" })).toBeVisible();
  demo = await open(page, "table", appearance); await demo.getByRole("button", { name: "People" }).click(); await expect(demo.locator("tbody tr").first()).toContainText("Little orbit"); await demo.getByRole("button", { name: "Next page" }).click(); await expect(demo.locator("tbody tr")).toHaveCount(2);
  demo = await open(page, "empty-state", appearance); await demo.getByRole("button", { name: "Create project" }).click(); await expect(demo.getByRole("heading", { name: "Your first project" })).toBeVisible();
});

test("usage, source, clipboard, every source download, and documentation links", async ({ page, context, request }) => {
  test.setTimeout(180_000); await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await open(page, "dialog", "pixel"); await page.getByRole("tab", { name: "Usage", exact: true }).click(); await expect(page.locator(".code-block")).toContainText('appearance="pixel"');
  await page.getByRole("button", { name: "Copy code" }).click(); await expect(page.getByRole("status")).toHaveText("Copied to clipboard."); expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('appearance="pixel"');
  await page.getByRole("tab", { name: "Source", exact: true }).click(); await expect(page.locator(".code-block")).toContainText("Primitive.Content");
  await page.getByRole("button", { name: "Copy code" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Primitive.Content");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download source" }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("orangeui-dialog.zip");
  const downloadedFiles = unzipSync(await readFile((await download.path())!));
  expect(strFromU8(downloadedFiles["Example.tsx"])).toContain('appearance="pixel"');
  await page.getByRole("navigation", { name: "Adjacent components" }).getByRole("link", { name: /NEXT.*Sheet/ }).click();
  await expect(page).toHaveURL(/sheet\?style=pixel/);
  await page.getByRole("navigation", { name: "Adjacent components" }).getByRole("link", { name: /PREVIOUS.*Dialog/ }).click();
  await expect(page).toHaveURL(/dialog\?style=pixel/);
  await page.getByRole("link", { name: "Full installation and theming guide" }).click(); await expect(page).toHaveURL(/docs\?style=pixel/); await expect(page.getByRole("heading", { level: 1 })).toContainText("A little setup.");
  for (const component of components) {
    const response = await request.get(`/api/components/${component.slug}?style=pixel`); expect(response.status()).toBe(200); expect(response.headers()["content-type"]).toBe("application/zip");
    const files = unzipSync(await response.body()); expect(files[component.file]).toBeTruthy(); expect(strFromU8(files["Example.tsx"])).toContain('appearance="pixel"');
  }
  expect((await request.get("/api/components/not-a-component")).status()).toBe(404); expect((await request.get("/components/not-a-component")).status()).toBe(404);
});

test("code examples scroll with the keyboard on narrow screens", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await open(page, "button", "pixel");
  const install = page.locator(".install-command");
  await install.focus();
  await install.press("ArrowRight");
  await expect.poll(() => install.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await page.getByRole("tab", { name: "Source", exact: true }).click();
  const source = page.locator(".code-block");
  await source.focus();
  await source.press("ArrowRight");
  await expect.poll(() => source.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/docs?style=pixel");
  for (const sample of await page.locator(".install-command").all()) {
    await sample.focus();
    await expect(sample).toBeFocused();
    if (await sample.evaluate((element) => element.scrollWidth > element.clientWidth)) {
      await sample.press("ArrowRight");
      await expect.poll(() => sample.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    }
  }
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
});

for (const width of [360, 768]) for (const theme of ["light", "dark"] as const) test(`all component details fit at ${width}px in ${theme}`, async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
  const observations = [];
  const folder = `out/library/responsive-${width}-${theme}`;
  await mkdir(folder, { recursive: true });
  for (const appearance of APPEARANCE_VALUES) for (const component of componentsInCollection(appearance)) {
    await open(page, component.slug, appearance);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    expect.soft(overflow, `${component.slug} ${appearance} fits at ${width}px`).toBe(false);
    observations.push({ slug: component.slug, appearance, overflow });
    if (["button", "gamer-boy", "table", "toggle-group"].includes(component.slug)) {
      expect.soft((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await page.screenshot({ path: `${folder}/${component.slug}-${appearance}.png`, fullPage: true });
    }
  }
  await page.goto("/docs?style=pixel");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.screenshot({ path: `${folder}/docs.png`, fullPage: true });
  await writeFile(`${folder}/report.json`, JSON.stringify({ width, theme, observations }, null, 2));
});

test("breadcrumb preview navigation preserves a directly linked pixel appearance", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("orangeui-appearance", "polished"));
  const demo = await open(page, "breadcrumb", "pixel");
  await demo.getByRole("link", { name: "Components", exact: true }).press("Enter");
  await expect(page).toHaveURL(/\/components\?style=pixel$/);
  await expect(page.getByRole("button", { name: "Pixelated", exact: false })).toHaveAttribute("aria-pressed", "true");
  await page.locator(".component-tile").getByRole("link", { name: "Button", exact: true }).click();
  await expect(page).toHaveURL(/\/components\/button\?style=pixel$/);
  await expect(page.getByTestId("live-demo").getByRole("button", { name: "Save a little joy" })).toHaveAttribute("data-appearance", "pixel");
});

async function visibleSurfaceControls(surface: Locator) {
  return surface.locator('button, input, [role="slider"], [role="option"], [role="menuitem"]').evaluateAll((elements) => elements.flatMap((element) => {
    if (element.matches(':disabled, [aria-disabled="true"], [data-disabled]')) return [];
    const rect = element.getBoundingClientRect();
    if (!rect.width || !rect.height || getComputedStyle(element).visibility === "hidden") return [];
    const topmost = document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2);
    return [{
      name: element.getAttribute("aria-label") || element.textContent?.trim() || element.getAttribute("id"),
      insideViewport: rect.left >= -1 && rect.top >= -1 && rect.right <= innerWidth + 1 && rect.bottom <= innerHeight + 1,
      unobstructed: element === topmost || element.contains(topmost),
    }];
  }));
}

for (const width of [1440, 360]) test.describe(`GamerBoy at ${width}px`, () => {
  test.use({ viewport: { width, height: 1000 }, hasTouch: width === 360 });
  for (const theme of ["light", "dark"] as const) for (const appearance of APPEARANCE_VALUES) {
    test(`GamerBoy lifecycle with ${width === 360 ? "touch" : "keyboard"} in ${appearance} ${theme}`, async ({ page }) => {
      await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
      const demo = await open(page, "gamer-boy", appearance);
      const device = demo.getByRole("group", { name: "Interactive handheld console" });
      const board = demo.locator(".console-board");
      const message = demo.getByRole("status");
      const activate = async (button: Locator) => width === 360 ? button.tap() : button.press("Enter");
      const move = async (direction: "up" | "right" | "down" | "left") => width === 360
        ? demo.getByRole("button", { name: `Console ${direction}`, exact: true }).tap()
        : device.press({ up: "ArrowUp", right: "d", down: "ArrowDown", left: "a" }[direction]);

      await expect(demo.getByRole("button", { name: "Console right" })).toBeDisabled();
      if (width === 360) await activate(demo.getByRole("button", { name: "Play console demo" }));
      else await device.press("Enter");
      await move("right");
      await expect(board).toHaveAttribute("data-player", "3,1");
      await device.scrollIntoViewIfNeeded();
      const controls = await visibleSurfaceControls(device);
      expect(controls.length).toBeGreaterThan(0);
      expect(controls.filter((control) => !control.insideViewport || !control.unobstructed)).toEqual([]);
      if (width === 360) {
        const targets = await demo.locator(".console-button").evaluateAll((buttons) => buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          const shell = button.closest(".handheld")!.getBoundingClientRect();
          return { width: rect.width, height: rect.height, insideDevice: rect.left >= shell.left && rect.right <= shell.right && rect.top >= shell.top && rect.bottom <= shell.bottom };
        }));
        expect(targets.every((target) => target.width >= 44 && target.height >= 44 && target.insideDevice)).toBe(true);
      }
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
      await mkdir("out/library", { recursive: true });
      await demo.screenshot({ path: `out/library/gamer-boy-${width}-${appearance}-${theme}-playing.png` });

      await activate(demo.getByRole("button", { name: "Pause console demo" }));
      await expect(demo.getByRole("button", { name: "Console right" })).toBeDisabled();
      await device.press("ArrowRight");
      await expect(board).toHaveAttribute("data-player", "3,1");
      await expect(message).toContainText("Press Play to resume");
      await activate(demo.getByRole("button", { name: "Play console demo" }));
      await move("right");
      await expect(board).toHaveAttribute("data-score", "1");
      await move("right");
      await expect(board).toHaveAttribute("data-player", "4,1");
      await move("up");
      await expect(board).toHaveAttribute("data-score", "2");
      for (let step = 0; step < 4; step++) await move("left");
      await expect(board).toHaveAttribute("data-score", "3");
      await move("down"); await move("down");
      await expect(message).toHaveText("All four found. Nicely played!");
      await expect(demo.getByRole("button", { name: "Console right" })).toBeDisabled();
      await expect(board).toHaveCount(0);
      await activate(demo.getByRole("button", { name: "Play console demo" }));
      await expect(board).toHaveAttribute("data-player", "2,1");
      await expect(board).toHaveAttribute("data-score", "0");
      if (width === 360) await demo.getByRole("button", { name: "Reset game" }).tap();
      else await device.press("Escape");
      await expect(message).toHaveText("Four little stars. One small adventure.");
      await expect(board).toHaveCount(0);
    });
  }
});

test.describe("mobile overlays", () => {
  test.use({ viewport: { width: 360, height: 800 }, hasTouch: true });
  for (const theme of ["light", "dark"] as const) for (const appearance of APPEARANCE_VALUES) {
    test(`mobile overlays remain usable and accessible in ${appearance} ${theme}`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
      const folder = `out/library/mobile-overlays-${appearance}-${theme}`;
      await mkdir(folder, { recursive: true });
      const observations: { name: string; controls: Awaited<ReturnType<typeof visibleSurfaceControls>>; violations: unknown[]; overflow: boolean; auditScope: string; excludedRules: string[] }[] = [];
      async function audit(surface: Locator, name: string) {
        await expect(surface).toBeVisible();
        await expect(surface).toHaveAttribute("data-appearance", appearance);
        const controls = await visibleSurfaceControls(surface);
        expect(controls.length, `${name} has actionable controls`).toBeGreaterThan(0);
        expect(controls.filter((control) => !control.insideViewport || !control.unobstructed), `${name} actions fit without obstruction`).toEqual([]);
        const choiceSelector = name === "select" ? ".ui-select-content" : name === "menu" ? ".ui-menu" : undefined;
        if (choiceSelector) await expectMainInert(page, true);
        const violations = (await (choiceSelector ? activeChoiceAudit(page, choiceSelector) : new AxeBuilder({ page })).analyze()).violations;
        expect(violations, `${name} accessibility`).toEqual([]);
        const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
        expect(overflow, `${name} viewport width`).toBe(false);
        await page.screenshot({ path: `${folder}/${name}.png` });
        observations.push({ name, controls, violations, overflow, auditScope: choiceSelector ?? "document", excludedRules: choiceSelector ? ["region"] : [] });
      }

      let demo = await open(page, "dialog", appearance);
      const dialogTrigger = demo.getByRole("button", { name: "Create a workspace" });
      await dialogTrigger.tap();
      let panel = page.getByRole("dialog");
      await expect(panel.getByRole("textbox")).toBeFocused();
      await page.keyboard.press("Shift+Tab");
      await expect(panel.getByRole("button", { name: "Close dialog" })).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(panel.getByRole("textbox")).toBeFocused();
      await audit(panel, "dialog");
      await panel.getByRole("textbox").fill("Pocket studio");
      await panel.getByRole("button", { name: "Create workspace" }).tap();
      await expect(panel).not.toBeVisible();
      await expect(dialogTrigger).toBeFocused();
      await expect(demo.getByRole("status")).toContainText("Pocket studio created");

      demo = await open(page, "sheet", appearance);
      const sheetTrigger = demo.getByRole("button", { name: "Workspace preferences" });
      await sheetTrigger.tap();
      panel = page.getByRole("dialog");
      await audit(panel, "sheet");
      await panel.getByRole("switch", { name: "Quiet hours" }).tap();
      await expect(panel.getByRole("switch", { name: "Quiet hours" })).not.toBeChecked();
      await panel.getByRole("button", { name: "Close panel" }).tap();
      await expect(panel).not.toBeVisible();
      await expect(sheetTrigger).toBeFocused();

      demo = await open(page, "popover", appearance);
      const popoverTrigger = demo.getByRole("button", { name: "Edit project name" });
      await popoverTrigger.tap();
      panel = page.getByRole("dialog");
      await expect(panel.getByRole("textbox")).toBeFocused();
      await audit(panel, "popover");
      await panel.getByRole("textbox").fill("Little garden");
      await panel.getByRole("button", { name: "Save name" }).tap();
      await expect(panel).not.toBeVisible();
      await expect(popoverTrigger).toBeFocused();
      await expect(demo.getByRole("status")).toContainText("renamed to Little garden");

      demo = await open(page, "select", appearance);
      const select = demo.getByRole("combobox");
      await expectMainInert(page, false);
      await select.tap();
      panel = page.getByRole("listbox");
      await audit(panel, "select");
      await expect(panel.getByRole("option", { name: "Archive (unavailable)" })).toBeDisabled();
      await panel.getByRole("option", { name: "Orange studio", exact: true }).tap();
      await expect(panel).not.toBeVisible();
      await expectMainInert(page, false);
      await expect(select).toContainText("Orange studio");
      await expect(select).toBeFocused();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      demo = await open(page, "dropdown-menu", appearance);
      const menuTrigger = demo.getByRole("button", { name: "Project actions" });
      await expectMainInert(page, false);
      await menuTrigger.tap();
      panel = page.getByRole("menu");
      await audit(panel, "menu");
      await expect(panel.getByRole("menuitem", { name: "Transfer (unavailable)" })).toBeDisabled();
      await panel.getByRole("menuitem", { name: "Duplicate project" }).tap();
      await expect(panel).not.toBeVisible();
      await expectMainInert(page, false);
      await expect(demo.getByRole("status")).toContainText("duplicated");
      await expect(menuTrigger).toBeFocused();
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);

      demo = await open(page, "toast", appearance);
      await demo.getByRole("button", { name: "Save changes" }).tap();
      const toast = page.locator(".ui-toast");
      await expect(toast).toBeVisible();
      await toast.getByRole("button", { name: "Undo", exact: true }).focus();
      await audit(toast, "toast");
      await page.keyboard.press("Enter");
      await expect(toast).not.toBeVisible();
      await expect(demo.getByRole("status")).toHaveText("Changes undone.");
      await writeFile(`${folder}/report.json`, JSON.stringify({ width: 360, theme, appearance, observations }, null, 2));
    });
  }
});

for (const item of APPEARANCES) test(`${item.label} selection persists through links, reload, and source download`, async ({ page, request }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("/components");
  const picker = page.getByRole("group", { name: "Component appearance", exact: true });
  await picker.getByRole("button", { name: item.label, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`style=${item.value}$`));
  expect(await page.evaluate(() => localStorage.getItem("orangeui-appearance"))).toBe(item.value);
  await page.locator(".tile-avatar").getByRole("link", { name: "Avatar", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/avatar\\?style=${item.value}$`));
  await page.reload();
  await expect(picker.getByRole("button", { name: item.label, exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Usage", exact: true }).click();
  await expect(page.locator(".code-block")).toContainText(`appearance="${item.value}"`);
  const response = await request.get(`/api/components/avatar?style=${item.value}`);
  expect(response.ok()).toBe(true);
  const files = unzipSync(await response.body());
  expect(strFromU8(files["Example.tsx"])).toContain(`appearance="${item.value}"`);
  expect(files["lib/avatar/png.ts"]).toBeTruthy();
  await page.goto("/components/avatar-group");
  await expect(picker.getByRole("button", { name: item.label, exact: true })).toHaveAttribute("aria-pressed", "true");
});

test("dark website surfaces are OLED neutral with vivid orange accents", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("orangeui-palette", "dark"));
  for (const route of ["/", "/components", "/components/button", "/docs"]) {
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
    const tokens = await page.evaluate(() => {
      const style = getComputedStyle(document.documentElement);
      return Object.fromEntries(["--cream", "--surface", "--surface-soft", "--primary"].map((name) => [name, style.getPropertyValue(name).trim().replace(/^#([a-f0-9])([a-f0-9])([a-f0-9])$/i, "#$1$1$2$2$3$3")]));
    });
    expect(tokens).toEqual({ "--cream": "#000000", "--surface": "#0a0a0a", "--surface-soft": "#171717", "--primary": "#ff6a00" });
    expect(await page.locator("body").evaluate((body) => getComputedStyle(body).backgroundColor)).toBe("rgb(0, 0, 0)");
  }
});
