import { expect, test } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { components } from "../lib/components";
import { APPEARANCE_VALUES } from "../components/ui/appearance";

const viewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];
const selectedSlugs = process.env.VIEWPORT_SLUGS?.split(",");
const checkedComponents = selectedSlugs ? components.filter((component) => selectedSlugs.includes(component.slug)) : components;

for (const viewport of viewports) for (const appearance of APPEARANCE_VALUES) for (const theme of ["light", "dark"] as const) {
  test(`first viewport ${viewport.width}x${viewport.height} ${appearance} ${theme}`, async ({ page }, testInfo) => {
    test.setTimeout(Math.max(180_000, checkedComponents.length * 15_000));
    const buildId = (await readFile(".next/BUILD_ID", "utf8")).trim();
    await page.setViewportSize(viewport);
    await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
    const folder = `out/iteration/viewports/${viewport.width}x${viewport.height}/${appearance}-${theme}`;
    await mkdir(folder, { recursive: true });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const observations = [];

    expect(checkedComponents.length, "The optional route filter must select real components").toBeGreaterThan(0);
    for (const component of checkedComponents) {
      await page.goto(`/components/${component.slug}?style=${appearance}`);
      await expect(page.getByTestId("live-demo")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await expect(page.getByTestId("live-demo").locator("[data-appearance]").first()).toHaveAttribute("data-appearance", appearance);
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      const primary = page.getByTestId("live-demo").locator("[data-main-preview]");
      await expect(primary, `${component.slug} declares one complete primary preview`).toHaveCount(1);
      const geometry = await primary.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const header = document.querySelector(".library-header")!.getBoundingClientRect();
        const clippedBy: string[] = [];
        for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
          const style = getComputedStyle(ancestor);
          const bounds = ancestor.getBoundingClientRect();
          if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) clippedBy.push(`${ancestor.tagName}.${ancestor.className}:vertical`);
          if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) clippedBy.push(`${ancestor.tagName}.${ancestor.className}:horizontal`);
        }
        return {
          x: rect.x, y: rect.y, width: rect.width, height: rect.height,
          fullyVisible: rect.width > 0 && rect.height > 0 && rect.top >= header.bottom - 1 && rect.bottom <= innerHeight + 1 && rect.left >= -1 && rect.right <= innerWidth + 1,
          clippedBy,
          horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
          initialScroll: scrollY,
        };
      });
      expect.soft(geometry.initialScroll, `${component.slug} is checked without scrolling`).toBe(0);
      expect.soft(geometry.fullyVisible, `${component.slug} primary preview fits: ${JSON.stringify(geometry)}`).toBe(true);
      expect.soft(geometry.clippedBy, `${component.slug} has no clipping ancestor`).toEqual([]);
      expect.soft(geometry.horizontalOverflow, `${component.slug} has no page overflow`).toBe(false);
      const screenshot = `${folder}/${component.slug}.png`;
      // A page screenshot never scrolls the element into view before capture.
      await page.screenshot({ path: screenshot, animations: "disabled" });
      await testInfo.attach(`${component.slug} ${appearance} ${theme}`, { path: screenshot, contentType: "image/png" });
      observations.push({ slug: component.slug, ...geometry, screenshot });
    }
    await writeFile(`${folder}/report.json`, JSON.stringify({ buildId, viewport, appearance, theme, errors, observations }, null, 2));
    expect(errors).toEqual([]);
  });
}

test("avatar option lists expand in the page without nested scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/components/avatar-editor?style=polished");
  const editor = page.getByRole("region", { name: "Customize your avatar" });
  for (const kind of ["palettes", "glyphs"]) {
    const more = editor.getByRole("button", { name: new RegExp(`Show (all .*|fewer) ${kind}`) });
    await more.click();
    await expect(more).toHaveAttribute("aria-expanded", "true");
    const list = editor.locator(`.avatar-editor-${kind}`);
    expect(await list.evaluate((element) => element.scrollHeight <= element.clientHeight + 1)).toBe(true);
  }
  await page.evaluate(() => scrollTo(0, 400));
  const preview = editor.locator("[data-main-preview]");
  await expect(preview).toBeInViewport({ ratio: 1 });
});
