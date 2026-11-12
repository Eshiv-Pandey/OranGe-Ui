import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

const bentos = [
  ["wildseed-bento", ".sb-wildseed"], ["current-bento", ".sb-current"],
  ["revenue-bento", ".sb-revenue"], ["studio-bento", ".sb-studio"],
  ["neon-bento", ".sb-neon-bento"], ["bento-overview", ".ob-bento-overview"],
];
const heroes = [
  ["playground-hero", ".sb-playground-hero"], ["oddkin-hero", ".sb-oddkin-hero"],
  ["woven-hero", ".sb-woven-hero"], ["neon-hero", ".sb-neon-hero"],
  ["editorial-hero", ".ob-editorial-hero"], ["product-hero", ".ob-product-hero"],
];
const sections = process.env.SECTIONS_SCOPE === "hero" ? heroes : process.env.SECTIONS_SCOPE === "bento" ? bentos : [...bentos, ...heroes];
test.beforeAll(async () => { await mkdir("out/section-expansion/captures", { recursive: true }); });

test("new and existing sections fit phone, tablet and desktop in both palettes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const [slug, selector] of sections) {
      await page.goto(`/preview/blocks/${slug}`, { waitUntil: "load" });
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => { image.loading = "eager"; return image.decode().catch(() => {}); })); });
      for (const palette of ["light", "dark"]) {
        await page.evaluate(palette => { document.documentElement.dataset.theme = palette; }, palette);
        await expect(page.getByLabel("Preview palette")).toHaveCount(0);
        await expect(page.getByText("Demo content. Actions do not save data.")).toHaveCount(0);
        const section = page.locator(selector);
        expect.soft(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${slug} ${width} ${palette} viewport`).toBe(true);
        expect.soft(await section.locator("a[href],button").evaluateAll(elements => elements.every(element => {
          const box = element.getBoundingClientRect();
          return box.width === 0 || (box.left >= -1 && box.right <= innerWidth + 1);
        })), `${slug} ${width} content`).toBe(true);
        expect(await section.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0)), `${slug} loaded assets`).toBe(true);
        expect.soft(await section.locator("h1,h2,h3,p").evaluateAll(elements => elements.every(element => {
          let ancestor = element.parentElement;
          while (ancestor && !/(hidden|clip)/.test(getComputedStyle(ancestor).overflow)) ancestor = ancestor.parentElement;
          if (!ancestor) return true;
          const boundary = ancestor.getBoundingClientRect(), range = document.createRange();
          range.selectNodeContents(element);
          const ink = range.getBoundingClientRect();
          return ink.left >= boundary.left - 1 && ink.right <= boundary.right + 1;
        })), `${slug} ${width} text fits the clipping boundary`).toBe(true);
        const result = await new AxeBuilder({ page }).include(selector).withTags(["wcag2a", "wcag2aa"]).analyze();
        expect.soft(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), `${slug} ${width} ${palette}`).toEqual([]);
        if (palette === "light") await section.screenshot({ path: `out/section-expansion/captures/${slug}-${width}.png`, animations: "disabled" });
      }
    }
  }
  expect(errors).toEqual([]);
});

test("catalogue ordering, agent prompt and keyboard revenue controls work", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blocks/category/bento");
  await expect(page.locator(".bc-entry").first()).toHaveAttribute("id", "block-wildseed-bento");
  const revenue = page.locator("#block-revenue-bento");
  await revenue.getByRole("button", { name: "Quarterly", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(revenue.getByText("$73,242", { exact: true })).toBeVisible();
  await revenue.getByRole("button", { name: "Copy RevenueBento prompt for your agent" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("block-revenue-bento.json");
  await page.goto("/preview/blocks/neon-bento");
  await expect(page.locator(".neon-sign")).toHaveCount(0);
  await expect(page.locator(".sb-neon-panel[data-lit='true']")).toHaveCount(5);
});

test("Hero collection leads with the new layouts and has a portable prompt", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blocks/category/hero");
  await expect(page.locator(".bc-entry").first()).toHaveAttribute("id", "block-playground-hero");
  const woven = page.locator("#block-woven-hero");
  await woven.getByRole("button", { name: "Copy WovenHero prompt for your agent" }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("block-woven-hero.json");
  const response = await page.request.get("/r/block-woven-hero.json");
  expect(response.ok()).toBe(true);
  const payload = await response.json();
  expect(payload.files.some((file: { content: string }) => file.content.includes("data:image/webp;base64,"))).toBe(true);
  await page.goto("/preview/blocks/neon-hero");
  await expect(page.locator(".neon-sign")).toHaveCount(0);
  await expect(page.locator(".sb-neon-panel[data-lit='true']")).toHaveCount(2);
});


test("every hero preview action stays on the current page with mouse and keyboard", async ({ page }) => {
  for (const [slug] of heroes) {
    await page.goto(`/preview/blocks/${slug}`);
    const url = page.url();
    const links = page.locator(".block-demo a");
    expect(await links.count(), slug).toBeGreaterThan(0);
    for (const link of await links.all()) {
      await link.click();
      await expect(page).toHaveURL(url);
      await link.focus();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(url);
    }
  }
  await page.goto("/blocks/category/hero");
  const url = page.url();
  for (const link of await page.locator(".bc-entry .block-demo a").all()) {
    await link.click();
    await expect(page).toHaveURL(url);
  }
});

test("neon borders respond to hover and cycle quietly with reduced-motion and visibility support", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/preview/blocks/neon-bento");
  const panel = page.locator(".sb-neon-intro");
  await page.mouse.move(0, 0);
  await expect.poll(() => panel.evaluate(element => getComputedStyle(element, "::before").opacity)).toBe("0.5");
  await panel.hover();
  await expect.poll(() => panel.evaluate(element => getComputedStyle(element, "::before").opacity)).toBe("1");
  await page.mouse.move(0, 0);
  await expect(page.locator(".sb-neon-panel[data-lit='false']")).toHaveCount(1, { timeout: 12000 });
  await expect(page.locator(".sb-neon-panel[data-lit='false']")).toHaveCount(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".sb-neon-panel[data-lit='true']")).toHaveCount(5);
  expect(await panel.evaluate(element => getComputedStyle(element, "::before").transitionDuration)).toBe("0s");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(6000);
  await expect(page.locator(".sb-neon-panel[data-lit='true']")).toHaveCount(5);
});

test("copy actions confirm the actual clipboard content and keep denied copies selectable", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blocks/category/hero");
  const entry = page.locator("#block-neon-hero");
  const prompt = entry.getByRole("button", { name: "Copy NeonHero prompt for your agent" });
  await prompt.click();
  await expect(prompt).toHaveAttribute("data-copied", "true");
  await expect(prompt).toContainText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("block-neon-hero.json");
  await expect(prompt).toHaveAttribute("data-copied", "false", { timeout: 4000 });
  await prompt.click();
  await expect(prompt).toHaveAttribute("data-copied", "true");
  const command = entry.getByRole("button", { name: "Copy NeonHero install command" });
  await command.click();
  await expect(command).toHaveAttribute("data-copied", "true");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toMatch(/^npx shadcn@latest add/);
  await entry.getByRole("button", { name: "NeonHero source code" }).click();
  const file = entry.getByRole("button", { name: /^Copy NeonHero components/ });
  await file.click();
  await expect(file).toHaveAttribute("data-copied", "true");
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n")).toEqual((await entry.locator(".bc-source-code code").textContent())?.replace(/\r\n/g, "\n"));
  await page.evaluate(() => { Object.defineProperty(navigator.clipboard, "writeText", { configurable: true, value: async () => { throw new Error("Denied"); } }); });
  await prompt.click();
  await expect(prompt).toHaveAttribute("data-copied", "false");
  await expect(entry.locator("textarea")).toBeFocused();
  await expect(entry.locator("textarea")).toHaveValue(/Add the NeonHero block/);
  await page.goto("/blocks/neon-hero");
  await expect(page.getByLabel("Preview palette")).toHaveCount(0);
  await page.getByRole("button", { name: "Usage", exact: true }).click();
  const example = page.locator(".block-code-view .block-copy-button");
  await example.click();
  await expect(example).toHaveAttribute("data-copied", "true");
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n")).toEqual((await page.locator(".block-code-view code").textContent())?.replace(/\r\n/g, "\n"));
  const install = page.locator(".block-install .block-copy-button");
  await install.click();
  await expect(install).toHaveAttribute("data-copied", "true");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("block-neon-hero.json");
});
