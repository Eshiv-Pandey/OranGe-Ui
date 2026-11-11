import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";

const footers = [
  ["blue-hour-footer", ".lf-blue-hour"], ["studio-footer", ".pf-studio"],
  ["colony-footer", ".pf-colony"], ["hillside-footer", ".lf-hillside"],
  ["skyline-footer", ".skyline-footer"], ["pavilion-footer", ".pavilion-footer"],
  ["site-footer", ".ob-site-footer"],
];
test.beforeAll(async () => { await mkdir("out/footer-polish/captures", {recursive:true}); });

test("all seven footers fit phone, tablet and desktop in both palettes", async ({page}) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({width,height:1000});
    for (const [slug, selector] of footers) {
      await page.goto(`/preview/blocks/${slug}`, {waitUntil:"load"});
      await page.getByLabel("Preview palette").selectOption("dark");
      await expect(page.locator(".standalone-block-preview")).toHaveAttribute("data-theme", "dark");
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(image => {image.loading = "eager"; return image.decode().catch(() => {});})); });
      await page.addStyleTag({content:"nextjs-portal { display:none; }"});
      for (const palette of ["light", "dark"]) {
        await page.getByLabel("Preview palette").selectOption(palette);
        const footer = page.locator(selector);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${slug} ${width} ${palette}`).toBe(true);
        expect.soft(await footer.locator("a[href], input").evaluateAll(elements => elements.every(element => {
          const box = element.getBoundingClientRect();
          return box.width === 0 || (box.left >= -1 && box.right <= innerWidth + 1);
        })), `${slug} content ${width}`).toBe(true);
        expect(await footer.locator("img").evaluateAll(images => images.every(image => (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
        const result = await new AxeBuilder({page}).include(selector).withTags(["wcag2a", "wcag2aa"]).analyze();
        expect.soft(result.violations.map(v => ({id:v.id,targets:v.nodes.map(n => n.target)})), `${slug} ${width} ${palette}`).toEqual([]);
        await footer.screenshot({path:`out/footer-polish/captures/${slug}-${width}-${palette}.png`, animations:"disabled"});
      }
    }
  }
  expect(errors).toEqual([]);
});

test("one toolbar, agent prompt, compact controls and preserved newsletter state", async ({page, context}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/blocks/category/footer", {waitUntil:"load"});
  const entry = page.locator("#block-blue-hour-footer");
  await expect(entry.getByLabel("Callback result")).toHaveCount(0);
  await expect(entry.locator(".bc-preview-toolbar")).toHaveCount(0);
  await entry.getByRole("textbox", {name:"Email address"}).fill("reader@example.com");
  await entry.getByRole("button", {name:"BlueHourFooter source code",exact:true}).click();
  await expect(entry.getByLabel("BlueHourFooter source file",{exact:true})).toBeVisible();
  await entry.getByRole("button", {name:"BlueHourFooter preview",exact:true}).click();
  await expect(entry.getByRole("textbox", {name:"Email address"})).toHaveValue("reader@example.com");
  await entry.getByRole("button", {name:"Copy BlueHourFooter prompt for your agent"}).click();
  const prompt = await page.evaluate(() => navigator.clipboard.readText());
  expect(prompt).toContain("block-blue-hour-footer.json");
  expect(prompt).toContain("/api/blocks/blue-hour-footer?format=source");
  expect(prompt).not.toMatch(/localhost:3000|USER_INSTRUCTIONS|CONTRIBUTION_RULES|E:\\/);
  await entry.getByRole("button", {name:"Subscribe to studio newsletter"}).click();
  await expect(entry.getByText("Demo complete. No email was subscribed.",{exact:true})).toBeVisible();
  for (const width of [768,390,320]) {
    await page.setViewportSize({width,height:844});
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    const toolbar = entry.locator(".bc-workbench-toolbar");
    expect(await toolbar.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
    if (width < 700) {
      await entry.getByRole("button", {name:"BlueHourFooter preview settings",exact:true}).click();
      const settings = page.getByRole("dialog", {name:"Preview settings"});
      await settings.getByRole("button", {name:"Phone",exact:true}).click();
      await settings.getByLabel("Palette").selectOption("dark");
      await settings.getByRole("button", {name:"Close popover"}).click();
      await expect(entry.locator(".bc-preview-canvas")).toHaveAttribute("data-width","phone");
      await expect(entry.getByRole("textbox", {name:"Email address"})).toHaveValue("reader@example.com");
    }
    await entry.screenshot({path:`out/footer-polish/captures/collection-${width}.png`});
  }
});

test("native appearance picker and Radix select use aligned arrows and one selection treatment", async ({page}) => {
  await page.goto("/components/select?style=polished", {waitUntil:"load"});
  await page.addStyleTag({content:"nextjs-portal { display:none; }"});
  const appearance = page.getByLabel("Component appearance");
  await appearance.click();
  expect(await appearance.evaluate(element => getComputedStyle(element).backgroundPosition)).toContain("12px");
  const selected = appearance.locator("option:checked");
  expect(await selected.evaluate(element => getComputedStyle(element).borderTopWidth)).toBe("0px");
  await page.screenshot({path:"out/footer-polish/captures/appearance-menu.png"});
  await page.keyboard.press("Escape");
  const trigger = page.locator(".ui-select-trigger").first();
  await trigger.click();
  const option = page.getByRole("option").first();
  await option.hover();
  expect(await option.evaluate(element => getComputedStyle(element).outlineStyle)).toBe("none");
  expect(await option.evaluate(element => getComputedStyle(element).boxShadow)).toBe("none");
  await page.screenshot({path:"out/footer-polish/captures/radix-select.png"});
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
});

test("theme panel retains the shell style and selected swatches have one edge", async ({page}) => {
  await page.goto("/components/button?style=pixel");
  await page.getByRole("button", {name:"Customize theme",exact:true}).click();
  const panel = page.getByRole("dialog", {name:"Make it yours"});
  await expect(panel).toHaveAttribute("data-appearance","polished");
  const selected = panel.locator('.theme-swatches button[aria-pressed="true"]');
  expect(await selected.evaluate(element => getComputedStyle(element).boxShadow)).toBe("none");
  await page.addStyleTag({content:"nextjs-portal { display:none; }"});
  await panel.screenshot({path:"out/footer-polish/captures/theme-panel.png"});
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", {name:"Customize theme",exact:true})).toBeFocused();
});
