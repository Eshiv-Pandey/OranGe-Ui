import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const evidence = ".impeccable/review/navbar-film";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

for (const width of [320, 390, 900, 1440]) for (const theme of ["light", "dark"]) {
  test(`requested surfaces at ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => { localStorage.setItem("orangeui-palette", value); localStorage.setItem("orangeui-appearance", "polished"); }, theme);
    for (const route of ["docs", "components/navbar", "components/form", "components/popover", "components/stepper", "components/wall-switch", "components/film-strip", "components/endless-film", "components/race-start-lights", "components/audio-orb", "components/character-avatar"]) {
      await page.goto(`/${route}`, { waitUntil: "domcontentloaded" });
      await page.evaluate(() => document.fonts.ready);
      if (route === "docs") {
        await expect(page.locator(".library-topline")).toHaveCount(0);
        const heading = (await page.locator(".library-heading").boundingBox())!;
        expect(heading.y).toBeLessThan(120);
      } else await expect(page.getByTestId("live-demo")).toBeVisible();
      if (route.endsWith("navbar")) {
        const mobile = page.locator(".ui-navbar-mobile button");
        if (width < 1100) {
          await expect(mobile).toBeVisible(); await mobile.click();
          const dialog = page.getByRole("dialog", { name: "Main navigation" });
          await expect(dialog).toBeVisible(); await dialog.getByRole("link", { name: "Activity" }).click();
          await expect(dialog).toBeHidden();
        } else {
          await page.locator(".ui-navbar-desktop").getByRole("button", { name: "Workspace" }).click();
          await page.locator(".ui-navbar-desktop").getByRole("link", { name: /Activity/ }).click();
        }
        await expect(page.locator(".launch-navigation-panel h3")).toHaveText("Activity");
      }
      if (route.endsWith("form") || route.endsWith("popover")) {
        if (route.endsWith("popover")) await page.getByRole("button", { name: "Edit project name" }).click();
        const input = page.getByRole("textbox", { name: route.endsWith("form") ? "Name" : "Project name", exact: true });
        await input.focus(); await input.hover();
        const styles = await input.evaluate(el => { const frame = el.closest(".pixel-field__frame")!, a = getComputedStyle(el), b = getComputedStyle(frame); return { inputOutline: a.outlineStyle, inputShadow: a.boxShadow, frameBorder: b.borderTopColor, frameOutline: b.outlineColor, frameShadow: b.boxShadow }; });
        expect(styles.inputOutline).toBe("none"); expect(styles.inputShadow).toBe("none"); expect(styles.frameShadow).toBe("none"); expect(styles.frameBorder).toBe(styles.frameOutline);
      }
      if (route.endsWith("stepper")) {
        await page.getByRole("button", { name: "Next step" }).click();
        await expect(page.locator(".ui-stepper [aria-current=step]")).toContainText("Review");
        await page.getByRole("button", { name: "Back", exact: true }).click();
      }
      if (route.endsWith("wall-switch")) {
        const button = page.getByRole("switch", { name: "Studio light" });
        await button.focus(); await page.keyboard.press("Space"); await expect(button).toBeChecked();
        await page.getByText("Studio light", { exact: true }).click(); await expect(button).not.toBeChecked();
      }
      if (route.endsWith("film-strip")) {
        await expect(page.locator(".film-frame img").first()).toBeVisible();
        const boxes = await page.locator(".film-frame img").evaluateAll(images => images.map(image => { const box = image.getBoundingClientRect(); return { width: box.width, height: box.height }; }));
        expect(new Set(boxes.map(box => `${box.width.toFixed(1)}x${box.height.toFixed(1)}`)).size).toBe(1);
        const overlap = await page.locator(".film-frame").evaluateAll(frames => frames.some((frame, index) => index > 0 && frame.getBoundingClientRect().top < frames[index - 1].getBoundingClientRect().bottom));
        expect(overlap).toBe(false);
      }
      if (route.endsWith("endless-film")) {
        await page.getByRole("button", { name: "Next photo", exact: true }).click();
        await expect(page.locator(".endless-film-footer [role=status]")).toContainText("Take the long way");
        await page.getByRole("button", { name: "Select Off the clock", exact: true }).click();
        await expect(page.locator(".endless-film-footer [role=status]")).toContainText("Off the clock");
        await expect(page.locator('.endless-film-stage')).toHaveAttribute('data-renderer', 'webgl');
      }
      if (route.endsWith("race-start-lights")) {
        await expect(page.locator(".race-start-gantry")).toContainText("START / FINISH");
        await expect(page.locator(".race-start-lens")).toHaveCount(10);
      }
      if (route.endsWith("audio-orb")) await expect(page.locator(".audio-orb-eyes circle")).toHaveCount(2);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (width === 390 || width === 1440) await page.screenshot({ path: `${evidence}/${route.replaceAll("/", "-")}-${width}-${theme}.png` });
      if (route.endsWith("popover")) await page.keyboard.press("Escape");
    }
    expect(errors).toEqual([]);
  });
}

test("film motion reacts to pointer and pauses with controls", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/components/endless-film");
  const frame = page.locator(".endless-film");
  await expect(page.locator(".endless-film")).toHaveAttribute("data-motion", "running");
  const first = await frame.getAttribute("data-phase");
  await expect.poll(() => frame.getAttribute("data-phase")).not.toBe(first);
  await page.getByRole("button", { name: "Pause film", exact: true }).click();
  const still = await frame.getAttribute("data-phase"); await page.waitForTimeout(200);
  expect(await frame.getAttribute("data-phase")).toBe(still);
  const stage = (await page.locator(".endless-film-stage").boundingBox())!;
  await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2); await page.mouse.down();
  await page.mouse.move(stage.x + stage.width / 2 + 80, stage.y + stage.height / 2, { steps: 5 }); await page.mouse.up();
  expect(await frame.getAttribute("data-phase")).not.toBe(still);
  await page.getByRole("button", { name: "Play film", exact: true }).click();
  const resumed = await frame.getAttribute("data-phase"); await expect.poll(() => frame.getAttribute("data-phase")).not.toBe(resumed);
});
