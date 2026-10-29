import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { decodeExports, editColor, settledPreviewSvg } from "./browser-artwork-helpers";

const evidence = "out/iteration/task2-motorsport";
const appearances = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"] as const;
const viewports = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }];
const surfaces = [
  { slug: "open-wheel-car", name: "OpenWheelCar", selector: ".artwork-customizer-artwork .motorsport-vehicle" },
  { slug: "superbike", name: "Superbike", selector: ".artwork-customizer-artwork .motorsport-vehicle" },
  { slug: "race-start-lights", name: "RaceStartLights", selector: ".race-start-lights" },
  { slug: "race-progress", name: "RaceProgress", selector: ".race-progress" },
  { slug: "livery-editor", name: "LiveryEditor", selector: ".artwork-customizer-artwork .motorsport-vehicle" },
  { slug: "helmet-editor", name: "HelmetEditor", selector: ".artwork-customizer-artwork .helmet" },
] as const;
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

async function openPage(page: Page, slug: string, appearance = "polished") {
  await page.goto(`/components/${slug}?style=${appearance}`);
  const demo = page.getByTestId("live-demo"); await expect(demo).toBeVisible();
  await page.evaluate(() => document.fonts.ready); return demo;
}
const editorIn = (demo: Locator, helmet = false) => demo.getByRole("region", { name: helmet ? "Customize your helmet" : "Customize your livery", exact: true });
const configuration = (editor: Locator) => editor.getByRole("textbox", { name: "Configuration JSON", exact: true, includeHidden: true }).inputValue();
const preview = (editor: Locator) => editor.locator(".artwork-customizer-artwork svg").first();
const normalizeLines = (value: string) => value.replace(/\r\n/g, "\n");

for (const viewport of viewports) for (const appearance of appearances) for (const theme of ["light", "dark"] as const) {
  test(`motorsport surfaces ${viewport.width}x${viewport.height} ${appearance} ${theme}`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((value) => localStorage.setItem("orangeui-palette", value), theme);
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
    for (const surface of surfaces) {
      const demo = await openPage(page, surface.slug, appearance);
      const primary = demo.locator(surface.selector);
      await expect(primary).toHaveAttribute("data-appearance", appearance);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => scrollTo(0, 0));
      const bounds = await primary.evaluate((element) => {
        const rect = element.getBoundingClientRect(), header = document.querySelector(".library-header")!.getBoundingClientRect();
        const clippedBy: string[] = [];
        for (let parent = element.parentElement; parent; parent = parent.parentElement) {
          const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
          if (/(clip|hidden|auto|scroll)/.test(style.overflowY) && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)) clippedBy.push(`${parent.tagName}:y`);
          if (/(clip|hidden|auto|scroll)/.test(style.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) clippedBy.push(`${parent.tagName}:x`);
        }
        return { visible: rect.width > 0 && rect.height > 0 && rect.top >= header.bottom && rect.bottom <= innerHeight && rect.left >= 0 && rect.right <= innerWidth, clippedBy, overflow: document.documentElement.scrollWidth > innerWidth, scroll: scrollY };
      });
      expect(bounds).toEqual({ visible: true, clippedBy: [], overflow: false, scroll: 0 });
      const path = `${evidence}/${surface.slug}-${viewport.width}x${viewport.height}-${appearance}-${theme}.png`;
      await page.screenshot({ path, animations: "disabled" }); await info.attach(`${surface.name} first viewport`, { path, contentType: "image/png" });
      if (viewport.width === 1366) {
        const audit = await new AxeBuilder({ page }).include('[data-testid="live-demo"]').analyze();
        expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
      }
    }
    expect(errors).toEqual([]);
  });
}

for (const kind of ["livery", "helmet"] as const) test(`${kind} editor controls, keyboard tabs, saved config and local preferences`, async ({ page, context }) => {
  const helmet = kind === "helmet";
  await page.emulateMedia({ reducedMotion: "reduce" });
  const editor = editorIn(await openPage(page, `${kind}-editor`), helmet);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
  const initial = await configuration(editor), design = editor.getByRole("tab", { name: "Design", exact: true });
  await design.focus(); await design.press("End");
  const finalTab = editor.getByRole("tab", { name: helmet ? "Motion" : "Scene", exact: true });
  await expect(finalTab).toBeFocused(); await expect(finalTab).toHaveAttribute("aria-selected", "true");
  await finalTab.press("Home"); await expect(design).toBeFocused();
  if (!helmet) {
    const vehicle = editor.getByRole("combobox", { name: "Vehicle", exact: true });
    await vehicle.selectOption("bike"); await expect(preview(editor)).toHaveClass(/superbike/); expect(await configuration(editor)).toBe(initial);
    await vehicle.selectOption("car"); await expect(preview(editor)).toHaveClass(/open-wheel-car/);
  }
  const vehicleId = helmet ? null : await editor.getByRole("combobox", { name: "Vehicle", exact: true }).getAttribute("id");
  for (const select of await editor.getByRole("tabpanel").getByRole("combobox").all()) {
    if (vehicleId && await select.getAttribute("id") === vehicleId) continue;
    const options = await select.locator("option:not(:disabled)").evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value));
    for (const option of options) if (option !== await select.inputValue()) { const before = await configuration(editor); await select.selectOption(option); expect(await configuration(editor)).not.toBe(before); }
  }
  const number = editor.getByRole("slider", { name: "Fictional number", exact: true });
  await number.focus(); await number.press("Home"); await number.press("ArrowRight");
  await expect(number).toHaveValue(String(Number(await number.getAttribute("min")) + Number(await number.getAttribute("step"))));
  if (helmet) {
    const button = editor.locator(".artwork-customizer-artwork .helmet-button"); const before = await configuration(editor);
    await button.focus(); await button.press("Space"); await expect(button).toBeFocused(); expect(await configuration(editor)).not.toBe(before);
    await expect(editor.getByRole("checkbox", { name: "Visor open", exact: true })).toBeChecked();
    const vents = editor.getByRole("checkbox", { name: "Vents", exact: true }); await vents.focus(); await vents.press("Space");
  }
  await editor.getByRole("tab", { name: "Colors", exact: true }).click();
  const palette = editor.getByRole("combobox", { name: helmet ? "Helmet palette" : "Livery palette", exact: true });
  await palette.selectOption("2");
  for (const input of await editor.locator('input[type="color"]').all()) { const before = await configuration(editor); await editColor(input, "#ab789c"); expect(await configuration(editor)).not.toBe(before); }
  await expect(palette).toHaveValue("-1");
  const identity = await configuration(editor);
  await editor.getByRole("tab", { name: "Motion", exact: true }).click();
  const range = editor.getByRole("slider", { name: helmet ? "Preview size" : "Speed", exact: true }); await range.focus(); await range.press("End");
  if (helmet) {
    await editor.getByRole("checkbox", { name: "Follow pointer", exact: true }).uncheck(); await editor.getByRole("checkbox", { name: "Blink", exact: true }).uncheck();
    await expect(editor.locator(".artwork-customizer-artwork .helmet-button")).toHaveCount(0);
  } else {
    await design.click(); await editor.getByRole("combobox", { name: "Vehicle", exact: true }).selectOption("bike");
    await editor.getByRole("tab", { name: "Motion", exact: true }).click();
    const lean = editor.getByRole("slider", { name: "Corner lean", exact: true }); await lean.focus(); await lean.press("End"); await expect(lean).toHaveValue("1");
    await editor.getByRole("checkbox", { name: "Wheelie on launch", exact: true }).check();
    await editor.getByRole("tab", { name: "Scene", exact: true }).click(); await editor.getByRole("checkbox", { name: "Show track", exact: true }).uncheck();
    await editor.getByRole("combobox", { name: "Track palette", exact: true }).selectOption("dark");
  }
  expect(await configuration(editor)).toBe(identity);
  await editor.getByRole("button", { name: "Copy config", exact: true }).click();
  expect(normalizeLines(await page.evaluate(() => navigator.clipboard.readText()))).toBe(normalizeLines(identity));
  await expect(editor.locator(".artwork-customizer-feedback")).toHaveText("Configuration copied.");
  await editor.getByText("View configuration", { exact: true }).click();
  const json = editor.getByRole("textbox", { name: "Configuration JSON", exact: true }); await expect(json).toBeVisible(); await expect(json).toHaveAttribute("readonly", "");
  await editor.getByRole("button", { name: "Randomize", exact: true }).click(); expect(await configuration(editor)).not.toBe(identity);
  await editor.getByRole("button", { name: "Reset", exact: true }).click(); expect(await configuration(editor)).toBe(initial);
  await expect(editor.locator(".artwork-customizer-feedback")).toHaveText("Default configuration restored.");
});

async function captureExport(page: Page, editor: Locator, filename: string, stem: string, width: number, height: number) {
  const svgEvent = page.waitForEvent("download"); await editor.getByRole("button", { name: "Export SVG", exact: true }).click();
  const svgDownload = await svgEvent, svg = await readFile((await svgDownload.path())!, "utf8"); expect(svgDownload.suggestedFilename()).toBe(`${filename}.svg`);
  expect(svg).not.toMatch(/var\(|currentColor|\banimation\s*:/i);
  const parsed = await page.evaluate((markup) => {
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml"), ids = new Set([...doc.querySelectorAll("[id]")].map((element) => element.id));
    const refs = [...markup.matchAll(/url\(#([^)]*)\)/g)].map((match) => match[1]);
    const inline = document.createElement("div"); inline.innerHTML = markup; document.body.append(inline); const animations = inline.getAnimations({ subtree: true }).length; inline.remove();
    return { width: doc.documentElement.getAttribute("width")!, height: doc.documentElement.getAttribute("height")!, errors: doc.querySelectorAll("parsererror").length,
      active: doc.querySelectorAll("script, foreignObject, image, style, animate, animateMotion, animateTransform, set").length,
      external: [...doc.querySelectorAll("*")].flatMap((element) => [...element.attributes].filter((attribute) => attribute.localName === "href" && !attribute.value.startsWith("#")).map((attribute) => attribute.value)), broken: refs.filter((ref) => !ids.has(ref)), animations };
  }, svg);
  expect(parsed).toEqual({ width: String(width), height: String(height), errors: 0, active: 0, external: [], broken: [], animations: 0 });
  const settled = await settledPreviewSvg(preview(editor), parsed);
  const pngEvent = page.waitForEvent("download"); await editor.getByRole("button", { name: "Export PNG", exact: true }).click();
  const pngDownload = await pngEvent, png = await readFile((await pngDownload.path())!); expect(pngDownload.suggestedFilename()).toBe(`${filename}.png`);
  const decoded = await decodeExports(page, png, svg, settled);
  expect(decoded.width).toBe(width); expect(decoded.height).toBe(height); expect(decoded.visible).toBeGreaterThan(8000); expect(decoded.colors).toBeGreaterThan(50);
  expect(decoded.svgDifferences).toBe(0); expect(decoded.previewDifferences).toBe(0);
  await svgDownload.saveAs(`${evidence}/${stem}.svg`); await pngDownload.saveAs(`${evidence}/${stem}.png`);
  await writeFile(`${evidence}/${stem}.json`, JSON.stringify({ parsed, decoded, config: JSON.parse(await configuration(editor)) }, null, 2));
  return decoded;
}

for (const kind of ["car", "bike", "helmet"] as const) for (const appearance of appearances) test(`${kind} editor portable exports ${appearance}`, async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.addInitScript(() => localStorage.setItem("orangeui-palette", "dark"));
  const helmet = kind === "helmet", editor = editorIn(await openPage(page, helmet ? "helmet-editor" : "livery-editor", appearance), helmet);
  if (!helmet) await editor.getByRole("combobox", { name: "Vehicle", exact: true }).selectOption(kind);
  else await editor.getByRole("checkbox", { name: "Visor open", exact: true }).check();
  await editor.getByRole("tab", { name: "Colors", exact: true }).click();
  await editColor(editor.locator('input[type="color"]').and(editor.getByLabel(helmet ? "Shell" : "Base color", { exact: true })), "#ab789c");
  const identity = await configuration(editor), filename = helmet ? "helmet" : kind === "car" ? "open-wheel-car" : "superbike";
  const stem = `${filename}-${appearance}-dark-track`;
  await captureExport(page, editor, filename, stem, helmet ? 512 : 640, helmet ? 512 : 260);
  await info.attach("Decoded export comparison", { path: `${evidence}/${stem}.json`, contentType: "application/json" });
  if (!helmet) {
    await editor.getByRole("tab", { name: "Scene", exact: true }).click(); await editor.getByRole("checkbox", { name: "Show track", exact: true }).uncheck();
    const transparent = await captureExport(page, editor, filename, `${filename}-${appearance}-transparent`, 640, 260); expect(transparent.transparent).toBeGreaterThan(50_000);
  }
  expect(await configuration(editor)).toBe(identity); await expect(editor.locator(".artwork-customizer-feedback")).toHaveText("PNG exported.");
});

for (const viewport of viewports) test(`motorsport catalogue thumbnails ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
  await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/components"); await page.evaluate(() => document.fonts.ready);
  for (const surface of surfaces) {
    await page.getByRole("searchbox", { name: "Search all components", exact: true }).fill(surface.name);
    const tile = page.locator(`.tile-${surface.slug}`); await expect(tile).toBeVisible(); await expect(tile.locator(".artwork-customizer")).toHaveCount(0);
    const bounds = await tile.locator(".thumbnail-inner").evaluate((element) => {
      const frame = element.closest(".component-thumbnail")!.getBoundingClientRect();
      const visual = element.querySelector(".motorsport-vehicle, .helmet, .race-start-lights, .race-progress")!;
      const rect = visual.getBoundingClientRect();
      return { fits: rect.left >= frame.left - 1 && rect.right <= frame.right + 1 && rect.top >= frame.top - 1 && rect.bottom <= frame.bottom + 1, visible: rect.width > 40 && rect.height > 10, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(bounds).toEqual({ fits: true, visible: true, overflow: false });
  }
  await page.getByRole("searchbox", { name: "Search all components", exact: true }).fill("");
  const category = page.getByRole("button", { name: "Motorsport", exact: true }); if (await category.count()) await category.click();
  await page.evaluate(() => scrollTo(0, 0)); const path = `${evidence}/catalogue-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({ path, animations: "disabled", fullPage: true }); await info.attach("Motorsport catalogue", { path, contentType: "image/png" });
});
