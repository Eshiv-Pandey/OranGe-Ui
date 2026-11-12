import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";

const slugs = ["blue-hour-footer", "studio-footer", "colony-footer", "hillside-footer", "skyline-footer"];
const selectors = [".lf-blue-hour", ".pf-studio", ".pf-colony", ".lf-hillside", ".skyline-footer"];
const captures = path.resolve("out/iteration/footer-expansion/captures");
test.beforeAll(async () => { await mkdir(captures, { recursive: true }); });

test("footer endpoints ship portable images, fonts and notices with private paths excluded", async ({ request }) => {
  for (const slug of slugs) {
    expect((await request.get(`/api/blocks/${slug}`)).status()).toBe(200);
    const response = await request.get(`/r/block-${slug}.json`);
    expect(response.status()).toBe(200);
    const item = await response.json();
    const source = item.files.map((file: { content: string }) => file.content).join("\n");
    expect(item.type).toBe("registry:block");
    expect(source).toContain("data:image/webp;base64,");
    expect(source).not.toMatch(/["']\/art\/footer\/|url\(["']?\/fonts\//);
  }
  const filename = path.resolve(".next/server/app/api/blocks/[slug]/route.js.nft.json");
  const trace = JSON.parse(await readFile(filename, "utf8"));
  const files: string[] = trace.files.map((file: string) => path.relative(process.cwd(), path.resolve(path.dirname(filename), file)).replaceAll("\\", "/"));
  expect(files).toContain("public/art/footer/hillside-landscape.webp");
  expect(files.some(file => /^(out\/|references\/|\.git\/|\.env)|USER_INSTRUCTIONS|AGENTS\.md|CONTRIBUTION_RULES/.test(file))).toBe(false);
});

test("all five footer compositions render at desktop and phone widths in both palettes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    for (let i = 0; i < slugs.length; i++) {
      await page.goto(`/preview/blocks/${slugs[i]}`);
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}); })); });
      const footer = page.locator(selectors[i]);
      if (slugs[i] === "studio-footer") expect(await footer.locator(".pf-studio-address").innerText()).not.toContain("\\n");
      for (const palette of ["light", "dark"]) {
        await page.evaluate(palette => { document.documentElement.dataset.theme = palette; }, palette);
        await expect(footer).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${slugs[i]} ${width} ${palette}`).toBe(true);
        expect(await footer.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
        const a11y = await new AxeBuilder({ page }).include(selectors[i]).withTags(["wcag2a", "wcag2aa"]).analyze();
        expect(a11y.violations.map(violation => ({ id: violation.id, nodes: violation.nodes.map(node => node.target) })), `${slugs[i]} ${width} ${palette}`).toEqual([]);
        await footer.screenshot({ path: path.join(captures, `${slugs[i]}-${width}-${palette}.png`) });
      }
    }
  }
  expect(errors).toEqual([]);
});

test("compact browsing leads with previews and preserves the requested footer order", async ({ page }) => {
  await page.goto("/blocks/category/footer");
  await expect(page.getByRole("heading", { name: "Footer", level: 1, exact: true })).toBeVisible();
  expect(await page.locator(".bc-entry").evaluateAll(entries => entries.map(entry => entry.id))).toEqual([...slugs, "pavilion-footer", "site-footer"].map(slug => `block-${slug}`));
  const first = page.locator(".bc-preview-canvas").first();
  expect((await first.boundingBox())?.y).toBeLessThan(410);
  for (let i = 0; i < slugs.length; i++) {
    const entry = page.locator(`#block-${slugs[i]}`);
    for (const width of ["phone", "tablet"]) {
      await entry.getByRole("button", { name: new RegExp(`${width} width$`) }).click();
      const canvas = entry.locator(".bc-preview-canvas");
      expect(await canvas.evaluate(element => element.scrollWidth <= element.clientWidth + 1), `${slugs[i]} embedded ${width}`).toBe(true);
    }
    await entry.getByRole("button", { name: /full width$/ }).click();
  }
  await page.goto("/blocks");
  await page.evaluate(async () => { await document.fonts.ready; });
  await expect(page.locator('.block-category-card[href="/blocks/category/footer"] img')).toHaveJSProperty("naturalWidth", 1200);
  expect((await page.locator(".block-thumbnail").first().boundingBox())?.y).toBeLessThan(380);
  await page.screenshot({ path: path.join(captures, "catalogue-desktop.png"), fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect((await page.locator(".block-thumbnail").first().boundingBox())?.y).toBeLessThan(440);
  await page.screenshot({ path: path.join(captures, "catalogue-mobile.png"), fullPage: true });
});

test("newsletter preview stays clean and controls preserve input", async ({ page }) => {
  await page.goto("/blocks/category/footer");
  const entry = page.locator("#block-blue-hour-footer");
  await expect(entry.getByLabel("Callback result")).toHaveCount(0);
  await entry.getByRole("textbox", { name: "Email address" }).fill("reader@example.com");
  await entry.getByRole("button", { name: "BlueHourFooter source code", exact: true }).click();
  await expect(entry.getByLabel("BlueHourFooter source file", { exact: true })).toBeVisible();
  await entry.getByRole("button", { name: "BlueHourFooter preview", exact: true }).click();
  await expect(entry.getByRole("textbox", { name: "Email address" })).toHaveValue("reader@example.com");
  await entry.getByRole("button", { name: "Subscribe to studio newsletter" }).click();
  await expect(entry.getByText("Demo complete. No email was subscribed.", { exact: true })).toBeVisible();
  await entry.getByRole("button", { name: "Reset BlueHourFooter preview", exact: true }).click();
  await expect(entry.getByRole("textbox", { name: "Email address" })).toHaveValue("");
});
