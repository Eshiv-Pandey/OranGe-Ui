import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = ".impeccable/review/github-graph/after";
test.beforeAll(() => mkdir(evidence, { recursive: true }).then(() => {}));
async function open(page: Page, width = 1440, theme = "light", reduced = true) {
  await page.setViewportSize({ width, height: 1000 });
  await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
  await page.emulateMedia({ reducedMotion: reduced ? "reduce" : "no-preference" });
  await page.goto("/components/github-graph");
  await expect(page.getByTestId("live-demo").getByRole("grid")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function noOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
}

for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`calendar and controls at ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await open(page, width, theme); const graph = page.locator(".github-graph-demo-art .github-graph");
    await expect(graph).toHaveAttribute("data-theme", theme);
    await expect(graph).toHaveAttribute("data-motion", "reduced");
    expect(await graph.getByRole("row").count()).toBe(7);
    expect(await graph.locator('.github-graph-cell[tabindex="0"]').count()).toBe(1);
    await noOverflow(page);
    const cell = graph.locator('.github-graph-cell:not([disabled])').first();
    await cell.focus(); await page.keyboard.press("ArrowRight");
    expect(await page.evaluate(() => document.activeElement?.classList.contains("github-graph-cell"))).toBe(true);
    const tooltip = page.getByRole("tooltip"); await expect(tooltip).toBeVisible();
    const box = (await tooltip.boundingBox())!; expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width);
    const outline = await page.locator(".github-graph-cell:focus").evaluate(el => getComputedStyle(el).outlineColor);
    expect(outline).toBe(theme === "light" ? "rgb(82, 82, 82)" : "rgb(212, 212, 212)");
    expect(outline).not.toMatch(/^rgb\((0, 0, 0|255, 255, 255)\)$/);
    await page.keyboard.press("Enter"); await expect(page.locator(".github-graph-demo-caption")).toContainText(/contributions on/);
    await page.keyboard.press("Escape"); await expect(tooltip).toHaveCount(0);
    await page.getByRole("button", { name: "Randomize sample", exact: true }).click();
    await expect(page.locator(".github-graph-demo-caption")).toContainText("Sample contribution data.");
    await page.getByRole("combobox", { name: "Palette", exact: true }).selectOption("violet");
    await expect(graph.locator('.github-graph-cell[data-level="4"]').first()).toHaveCSS("--gh-color", "#52269c");
    const fill = graph.locator(".github-graph-cell-fill").first(); await expect(fill).toHaveCSS("animation-name", "none");
    await page.locator(".workspace-view").click({ position: { x: 5, y: 5 } });
    await page.evaluate(() => window.scrollTo(0, 0)); await noOverflow(page);
    await page.screenshot({ path: `${evidence}/${width}-${theme}.png`, fullPage: true });
    expect(errors).toEqual([]);
  });
}

test("contains a twelve-month calendar on a narrow screen and supports touch exploration", async ({ page }) => {
  await open(page, 320);
  await page.getByRole("slider", { name: "Months", exact: true }).focus();
  await page.keyboard.press("End");
  const scroll = page.locator(".github-graph-scroll");
  expect(await scroll.evaluate(el => el.scrollWidth > el.clientWidth)).toBe(true);
  await scroll.evaluate(el => { el.scrollLeft = el.scrollWidth; });
  const last = page.locator('.github-graph-cell[data-date="2026-12-31"]'); await last.click();
  await expect(page.locator(".github-graph-demo-caption")).toContainText("2026-12-31");
  await noOverflow(page);
});

test("public profile loading, malformed response, retry, and account editing", async ({ page }) => {
  let requests = 0;
  await page.route("https://github-contributions-api.jogruber.de/**", route => {
    requests++;
    return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ contributions: requests === 1 ? [{}] : [{ date: "2026-07-01", count: 5 }, { date: "2026-07-15", count: 7 }] }) });
  });
  await open(page);
  await page.getByRole("combobox", { name: "Data source", exact: true }).selectOption("live");
  await expect(page.locator(".github-graph-message[role=alert]")).toContainText("invalid contribution data");
  await page.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(page.getByRole("grid")).toBeVisible(); expect(requests).toBe(2);
  await page.getByRole("textbox", { name: "GitHub username" }).fill("another-user");
  expect(requests).toBe(2);
  await page.getByRole("button", { name: "Load profile", exact: true }).click();
  await expect(page.getByRole("grid")).toHaveAttribute("aria-label", "Contributions for another-user");
  expect(requests).toBe(3);
});

test("decorative motion settles when paused and suspends offscreen", async ({ page }) => {
  await open(page, 1440, "dark", false); const graph = page.locator(".github-graph-demo-art .github-graph");
  await expect(graph).toHaveAttribute("data-motion", "running");
  await expect(graph.locator(".github-graph-cell-fill").first()).toHaveCSS("animation-name", "gh-twinkle");
  await page.locator(".github-graph-motion-settings summary").click();
  await page.getByRole("checkbox", { name: "Pause decoration", exact: true }).check();
  await expect(graph).toHaveAttribute("data-motion", "paused");
  await expect(graph.locator(".github-graph-cell-entrance").first()).toHaveCSS("animation-name", "none");
  await expect(graph.locator(".github-graph-cell-fill").first()).toHaveCSS("animation-play-state", "paused");
  await page.getByRole("checkbox", { name: "Pause decoration", exact: true }).uncheck();
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await expect(graph).toHaveAttribute("data-motion", "paused");
});
