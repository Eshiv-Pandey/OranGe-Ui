import { expect, test, type Locator } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = ".impeccable/review/control-feedback/after";
const slugs = ["prompt-input", "wall-switch", "calendar", "combobox", "input-otp", "rating", "command", "toast"];
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

async function noInnerFrame(input: Locator) {
  await expect(input).toBeFocused();
  await expect(input).toHaveCSS("outline-style", "none");
  await expect(input).toHaveCSS("box-shadow", "none");
}

for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`controls and toast clear the dock at ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    for (const slug of slugs) {
      await page.goto(`/components/${slug}`);
      const live = page.getByTestId("live-demo"); await expect(live).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (slug === "prompt-input") {
        const input = live.locator("textarea"); await input.focus(); await noInnerFrame(input);
        await expect(live.locator(".ui-prompt-surface")).toHaveCSS("outline-offset", "-2px");
      }
      if (slug === "combobox") {
        const input = live.getByRole("combobox"); await input.click(); await noInnerFrame(input);
        await expect(live.locator(".ui-combobox-anchor")).toHaveCSS("outline-offset", "-2px");
        await input.fill("code"); await input.press("Enter"); await expect(input).toHaveValue("Engineer");
        await input.click(); await input.press("Escape"); await expect(input).toHaveValue("Engineer");
      }
      if (slug === "rating") {
        const radio = live.getByRole("radio", { name: "3 stars", exact: true }); await radio.focus(); await noInnerFrame(radio);
        await radio.press("ArrowRight"); await expect(live.getByRole("radio", { name: "4 stars", exact: true })).toBeChecked();
        await expect(live.locator(".ui-rating-option:has(input:focus-visible)")).toHaveCSS("outline-offset", "-2px");
      }
      if (slug === "command") {
        const input = live.getByRole("combobox"); await input.focus(); await noInnerFrame(input);
        await expect(live.locator(".ui-command")).toHaveCSS("outline-offset", "-2px");
        await input.press("ArrowDown"); await input.press("Enter"); await expect(live.getByRole("status")).toContainText("selected");
      }
      if (slug === "calendar") {
        const year = live.getByRole("combobox", { name: "Calendar year" }); await year.click();
        await expect(page.getByRole("option", { name: "2026", exact: true })).toBeVisible();
        await page.screenshot({ path: `${evidence}/calendar-year-${width}-${theme}.png` });
        await page.getByRole("option", { name: "2028", exact: true }).click();
        await expect(live.getByRole("heading")).toHaveText("November 2028");
        await live.getByRole("combobox", { name: "Calendar month" }).click();
        await page.getByRole("option", { name: "February", exact: true }).click();
        await expect(live.getByRole("button", { name: "Tuesday, February 29, 2028" })).toBeEnabled();
      }
      if (slug === "input-otp") {
        await live.getByRole("combobox", { name: "Code format" }).click();
        await page.getByRole("option", { name: "Letters and numbers", exact: true }).click();
        const input = live.getByRole("textbox", { name: "Verification code" }); await input.fill("a2b3c4");
        await expect(input).toHaveValue("A2B3C4"); await noInnerFrame(input);
        await input.press("Backspace"); await expect(input).toHaveValue("A2B3C");
        await input.evaluate(el => { const data = new DataTransfer(); data.setData("text", "X9-y8 z7"); el.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: data })); });
        await expect(input).toHaveValue("X9Y8Z7"); await expect(live.getByRole("status")).toHaveText("All six characters entered.");
      }
      if (slug === "wall-switch") {
        const button = live.getByRole("switch", { name: "Studio light" }); await button.focus(); await button.press("Space");
        await expect(button).toBeChecked(); await expect(live.getByRole("status")).toHaveText("The light is on.");
        const size = (await button.boundingBox())!; expect(Math.abs(size.width - size.height)).toBeLessThan(2);
        await button.press("Space"); await expect(button).not.toBeChecked();
      }
      if (slug === "toast") {
        await live.getByRole("button", { name: "Save changes" }).click();
        const toast = page.locator(".ui-toast"); await expect(toast).toBeVisible();
        const alert = (await toast.boundingBox())!, dock = (await page.locator(".workspace-stage-toolbar").boundingBox())!, stage = (await page.locator(".workspace-stage").boundingBox())!;
        expect(alert.y + alert.height).toBeLessThanOrEqual(dock.y - 12);
        expect(alert.x).toBeGreaterThanOrEqual(stage.x); expect(alert.x + alert.width).toBeLessThanOrEqual(stage.x + stage.width);
        await page.screenshot({ path: `${evidence}/${slug}-${width}-${theme}.png` });
        await toast.getByRole("button", { name: "Dismiss notification" }).click(); await expect(toast).not.toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (slug !== "toast") await page.screenshot({ path: `${evidence}/${slug}-${width}-${theme}.png` });
    }
    expect(errors).toEqual([]);
  });
}

test("focus stays singular across every appearance and direct route transitions", async ({ page }) => {
  for (const appearance of ["polished", "pixel", "neobrutalism", "retro-os", "terminal"]) {
    for (const slug of ["prompt-input", "combobox", "rating", "command"]) {
      await page.goto(`/components/${slug}?style=${appearance}`);
      const live = page.getByTestId("live-demo");
      const input = slug === "prompt-input" ? live.locator("textarea") : slug === "rating" ? live.getByRole("radio").nth(2) : live.getByRole("combobox");
      await input.focus(); await noInnerFrame(input);
    }
  }
});
