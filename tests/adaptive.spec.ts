import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { componentsInCollection } from "../lib/components";
const evidence = ".impeccable/review/adaptive-cleanup/after";
const slugs = ["adaptive-input", "checklist-card", "focus-timer-card", "poll-card"];
test.beforeAll(() => mkdir(evidence, { recursive: true }).then(() => {}));
async function open(page: Page, slug = "adaptive-input", width = 1440, theme = "light", appearance = "polished") {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
  await page.goto(`/components/${slug}?style=${appearance}`);
  await expect(page.getByTestId("live-demo").locator(".adaptive-demo-art .adaptive-card")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}
for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`four public demos at ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    for (const slug of slugs) {
      await open(page, slug, width, theme); await noOverflow(page);
      const art = page.getByTestId("live-demo").locator(".adaptive-demo-art");
      await expect(art.locator(".adaptive-card")).toHaveCSS("border-radius", "14px");
      await expect(art.locator(".adaptive-card")).toHaveCSS("border-top-width", "1px");
      const field = art.locator("input:not([type=color]):not([type=checkbox]),textarea").first();
      await field.focus(); await expect(field).toBeFocused();
      const style = await field.evaluate(el => { const css = getComputedStyle(el); return { outline: css.outlineColor, width: css.outlineWidth, height: el.getBoundingClientRect().height }; });
      expect(style.width).toBe("2px"); expect(style.height).toBeGreaterThanOrEqual(44);
      expect(style.outline).not.toMatch(/^rgb\((0, 0, 0|255, 255, 255)\)$/);
      if (slug === "adaptive-input" && (width === 390 || width === 1440)) {
        await page.locator(".workspace-view").click({ position: { x: 5, y: 5 } });
        await page.evaluate(() => window.scrollTo(0, 0));
        await page.screenshot({ path: `${evidence}/input-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
      }
    }
    expect(errors).toEqual([]);
  });
}
test("all appearances remain usable without horizontal overflow", async ({ page }) => {
  for (const theme of ["light", "dark"]) for (const appearance of ["polished", "pixel", "neobrutalism", "retro-os", "terminal"]) for (const slug of slugs) {
    await open(page, slug, 390, theme, appearance); await noOverflow(page);
    const card = page.getByTestId("live-demo").locator(".adaptive-demo-art .adaptive-card");
    await expect(card).toHaveAttribute("data-appearance", appearance);
    await expect(card).toHaveCSS("border-radius", appearance === "polished" ? "14px" : appearance === "neobrutalism" ? "6px" : "0px");
    const font = await card.evaluate(el => getComputedStyle(el).fontFamily);
    if (appearance === "pixel") expect(font).toMatch(/oRange Pixel|Pixelify/i);
    if (appearance === "terminal") expect(font).toContain("monospace");
  }
});
test("recipes are absent from public detail, download and registry routes", async ({ request }) => {
  for (const slug of ["event-card", "reminder-card", "color-card", "bill-split-card", "unit-converter-card", "calculator-card", "bookmark-card", "note-card"]) {
    for (const route of [`/components/${slug}`, `/api/components/${slug}`, `/r/${slug}.json`]) {
      const response = await request.get(route);
      expect(response.status(), route).toBe(404);
    }
  }
  for (const slug of slugs) {
    const source = await request.get(`/api/components/${slug}?style=polished`);
    expect(source.status()).toBe(200);
    expect(source.headers()["content-type"]).toBe("application/zip");
    const registry = await request.get(`/r/${slug}.json?style=polished`);
    expect(registry.status()).toBe(200);
    expect((await registry.json()).name).toBe("orangeui-" + slug);
  }
});

for (const width of [390, 1440]) for (const theme of ["light", "dark"]) test(`curated discovery and experimental placement at ${width}px in ${theme}`, async ({ page }) => {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
  await page.goto("/components?style=polished");
  await expect(page.locator(".library-heading")).toContainText("112 React components and 1 experiment.");
  await expect(page.locator(".component-grid > article")).toHaveCount(componentsInCollection("polished").length);
  const filters = page.getByRole("group", { name: "Component category", exact: true });
  await expect(filters.getByRole("button", { name: "Adaptive inputs", exact: true })).toHaveCount(0);
  await filters.getByRole("button", { name: "Experimental", exact: true }).click();
  await expect(page.locator(".component-grid > article")).toHaveCount(1);
  await expect(page.locator(".component-grid .tile-category")).toHaveText("Experimental");
  await expect(page.locator(".component-grid h2")).toContainText("AdaptiveInput");
  await noOverflow(page);
  await page.evaluate(() => { window.scrollTo(0, 0); return document.fonts.ready; });
  await page.screenshot({ path: `${evidence}/experimental-catalogue-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
  await filters.getByRole("button", { name: "Inputs & forms", exact: true }).click();
  for (const name of ["ChecklistCard", "PollCard"]) await expect(page.locator(".component-grid h2").filter({ hasText: name })).toBeVisible();
  await filters.getByRole("button", { name: "Content & layout", exact: true }).click();
  await expect(page.locator(".component-grid h2").filter({ hasText: "FocusTimerCard" })).toBeVisible();
  if (width === 390) await page.getByRole("button", { name: "Open component navigation menu", exact: true }).click();
  const nav = page.getByRole("navigation", { name: "Component navigation", exact: true }).filter({ visible: true });
  for (const name of ["EventCard", "ReminderCard", "ColorCard", "BillSplitCard", "UnitConverterCard", "CalculatorCard", "BookmarkCard", "NoteCard"]) await expect(nav.getByRole("link", { name, exact: true })).toHaveCount(0);
  const experiments = nav.locator(".library-nav-group").filter({ has: page.locator("p", { hasText: /^Experimental$/ }) });
  await expect(experiments.getByRole("link")).toHaveCount(1);
  await expect(experiments.getByRole("link", { name: "AdaptiveInput", exact: true })).toHaveAttribute("href", "/components/adaptive-input?style=polished");
});
test("examples switch to every intent, preserve raw text and restore edited cards", async ({ page }) => {
  await open(page, "adaptive-input", 390);
  const examples = ["event", "reminder", "checklist", "timer", "color", "split", "convert", "calculate", "poll", "bookmark", "note"];
  for (const kind of examples) {
    await page.getByRole("combobox", { name: "Load example", exact: true }).selectOption(kind);
    await expect(page.getByTestId("live-demo").locator(".adaptive-input")).toHaveAttribute("data-intent", kind);
  }
  const raw = await page.getByTestId("live-demo").getByLabel("Describe what you need").inputValue();
  await page.getByTestId("live-demo").getByRole("textbox", { name: "Note text", exact: true }).fill("Edited saved content");
  await page.getByTestId("live-demo").getByLabel("Card type", { exact: true }).selectOption("reminder");
  await expect(page.getByTestId("live-demo").getByLabel("Describe what you need")).toHaveValue(raw);
  await page.getByTestId("live-demo").getByLabel("Card type", { exact: true }).selectOption("note");
  await expect(page.getByTestId("live-demo").getByRole("textbox", { name: "Note text", exact: true })).toHaveValue("Edited saved content");
  await page.getByRole("button", { name: "Use card", exact: true }).click();
  await expect(page.getByRole("button", { name: "Edit saved Note", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await page.getByRole("button", { name: "Edit saved Note", exact: true }).click();
  await expect(page.getByTestId("live-demo").getByRole("textbox", { name: "Note text", exact: true })).toHaveValue("Edited saved content");
  await page.getByRole("button", { name: "Remove saved Note", exact: true }).click();
  await expect(page.getByTestId("live-demo").locator(".adaptive-saved")).toHaveCount(0);
  await page.getByRole("checkbox", { name: "Simulated async classifier", exact: true }).check();
  await expect(page.getByTestId("live-demo").locator(".adaptive-input")).toHaveAttribute("data-classifier", "ready");
  await noOverflow(page);
});
test("standalone controls, timer, poll, clipboard and disabled editing work", async ({ page }) => {
  await open(page, "checklist-card", 320);
  await page.getByTestId("live-demo").getByLabel("New item", { exact: true }).fill("Review"); await page.getByTestId("live-demo").getByLabel("New item", { exact: true }).press("Enter");
  await page.getByTestId("live-demo").getByLabel("Complete Review", { exact: true }).check();
  await page.getByRole("checkbox", { name: "Editable fields", exact: true }).uncheck();
  await expect(page.getByTestId("live-demo").getByLabel("List title", { exact: true })).toHaveAttribute("readonly", "");
  await expect(page.getByTestId("live-demo").getByLabel("Complete Review", { exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: "Disabled", exact: true }).check(); await expect(page.getByTestId("live-demo").getByLabel("List title", { exact: true })).toBeDisabled();
  await open(page, "focus-timer-card", 390);
  await page.getByTestId("live-demo").getByLabel("Duration in minutes", { exact: true }).fill("0.05");
  await page.getByRole("button", { name: "Start", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start again", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset", exact: true }).click(); await expect(page.getByTestId("live-demo").getByLabel("Time remaining")).toHaveText("00:03");
  await open(page, "poll-card", 390);
  await page.getByTestId("live-demo").locator(".adaptive-poll-choice").first().click(); await expect(page.getByTestId("live-demo").locator(".adaptive-poll-choice").first()).toHaveAttribute("aria-pressed", "true");
  await open(page, "adaptive-input", 390);
  await page.getByRole("combobox", { name: "Load example", exact: true }).selectOption("calculate");
  await expect(page.getByTestId("live-demo").locator(".adaptive-input")).toHaveAttribute("data-intent", "calculate");
  await page.evaluate(() => { Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => {} } }); });
  await page.getByRole("button", { name: "Copy value", exact: true }).click(); await expect(page.getByText("Copied.", { exact: true })).toBeVisible();
  await page.getByTestId("live-demo").getByLabel("Expression", { exact: true }).fill("1/0"); await expect(page.getByRole("button", { name: "Use card", exact: true })).toBeDisabled(); await noOverflow(page);
});
test("reduced motion settles card transitions and graph defaults are calmer", async ({ page }) => {
  await open(page);
  await page.getByTestId("live-demo").getByLabel("Card type", { exact: true }).selectOption("note");
  await expect(page.getByTestId("live-demo").locator(".adaptive-card-slot > div")).toHaveCSS("opacity", "1");
  await expect(page.getByTestId("live-demo").locator(".adaptive-card-slot > div")).toHaveCSS("filter", "blur(0px)");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/github-graph"); const graph = page.locator(".github-graph-demo-art .github-graph");
  await expect(graph).toHaveCSS("--gh-intensity", "1.1"); await expect(graph).toHaveCSS("--gh-enter-duration", `${480 / 1.75}ms`);
  expect(await graph.locator(".github-graph-cell").first().evaluate(el => parseFloat(getComputedStyle(el).getPropertyValue("--gh-duration")))).toBeLessThanOrEqual(2);
  await page.screenshot({ path: `${evidence}/graph-defaults-1440-light.png`, fullPage: true });
});
