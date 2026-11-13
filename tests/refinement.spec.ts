import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = ".impeccable/review/nov5-final";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`refined landing and editors fit ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const slug of ["landing", "audio-orb", "liquid-metal", "helmet", "character-avatar"]) {
      await page.goto(slug === "landing" ? "/" : `/components/${slug}`);
      if (slug === "landing") {
        await expect(page.getByRole("heading", { level: 1 })).toHaveText("orange UI");
        await expect(page.getByRole("link", { name: "Components", exact: true })).toBeVisible();
        await expect(page.getByRole("link", { name: "Get started", exact: true })).toHaveCount(0);
        await expect(page.locator(".reference-background")).toHaveAttribute("data-renderer", "webgl2");
        await expect(page.locator(".reference-canvas")).toHaveAttribute("data-motion", "reduced");
      } else if (slug === "audio-orb" || slug === "liquid-metal") {
        await expect(page.locator(".shader-canvas").first()).toHaveAttribute("data-renderer", "webgl2");
        if (slug === "liquid-metal") {
          const colorField = page.locator(".workspace-controls .editor-color").first();
          const label = (await colorField.locator("label").boundingBox())!;
          const value = (await colorField.locator(".editor-color-value").boundingBox())!;
          expect(label.y + label.height).toBeLessThanOrEqual(value.y);
        }
        if (slug === "audio-orb") {
          await expect(page.locator(".audio-orb-eyes")).toBeVisible();
          expect(await page.locator(".audio-orb > .shader-canvas").evaluate(el => getComputedStyle(el).borderWidth)).toBe("0px");
        }
      } else {
        const randomize = page.getByRole("button", { name: "Randomize", exact: true });
        const tabs = page.locator(".workspace-controls .artwork-customizer-tabs");
        expect((await randomize.boundingBox())!.y).toBeLessThan((await tabs.boundingBox())!.y);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const overflowing = await page.locator(".workspace-controls select, .workspace-controls input, .workspace-controls button").evaluateAll(controls => controls.filter(el => {
        if (!(el as HTMLElement).offsetParent) return false;
        const a = el.getBoundingClientRect(), panel = el.closest(".workspace-inspector")!.getBoundingClientRect();
        return a.left < panel.left - 1 || a.right > panel.right + 1;
      }).map(el => el.getAttribute("aria-label") || el.textContent));
      expect(overflowing).toEqual([]);
      await page.screenshot({ path: `${evidence}/${slug}-${width}-${theme}.png`, fullPage: true });
      if (slug === "helmet") {
        await page.locator(".helmet-button").click();
        await page.screenshot({ path: `${evidence}/helmet-open-${width}-${theme}.png`, fullPage: true });
      }
    }
    expect(errors).toEqual([]);
  });
}

test("orb playback, microphone, configurable eyes and reduced motion", async ({ page }) => {
  await page.goto("/components/audio-orb");
  const orb = page.locator(".audio-orb"), controls = page.locator(".workspace-controls");
  const energy = () => orb.evaluate(el => parseFloat((el as HTMLElement).style.getPropertyValue("--orb-energy")));
  await page.getByRole("button", { name: "Play music", exact: true }).click();
  await expect(orb).toHaveAttribute("data-audio-active", "true");
  await expect.poll(energy).toBeGreaterThan(.15);
  await page.getByRole("button", { name: "Pause music", exact: true }).click();
  await expect.poll(energy).toBeLessThan(.02);
  await page.getByRole("button", { name: "Listen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop listening", exact: true })).toBeVisible();
  await expect.poll(energy).toBeGreaterThan(.15);
  await page.getByRole("button", { name: "Stop listening", exact: true }).click();
  await expect.poll(energy).toBeLessThan(.02);
  await controls.getByRole("checkbox", { name: "Show eyes", exact: true }).uncheck();
  await expect(page.locator(".audio-orb-eyes")).toHaveCount(0);
  await controls.getByRole("checkbox", { name: "Show eyes", exact: true }).check();
  const box = (await orb.boundingBox())!;
  await page.mouse.move(box.x + box.width, box.y);
  await expect.poll(() => orb.evaluate(el => parseFloat((el as HTMLElement).style.getPropertyValue("--gaze-x")))).toBeGreaterThan(.1);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => orb.evaluate(el => (el as HTMLElement).style.getPropertyValue("--gaze-x"))).toBe("0");
  const play = page.getByRole("button", { name: "Play music", exact: true }); await play.focus();
  await page.keyboard.press("Shift+Tab"); await page.keyboard.press("Tab");
  await expect(play).toBeFocused();
  expect(await play.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
});

test("side-profile visor pivots upward and keyboard activation works", async ({ page }) => {
  await page.goto("/components/helmet");
  const pane = page.locator(".helmet-visor-pane"), button = page.locator(".helmet-button");
  const lift = page.locator(".helmet-visor-lift");
  const closed = (await pane.boundingBox())!.y;
  const mounts = await page.locator(".helmet-pivot > circle:first-child").evaluateAll(els => els.map(el => [el.getAttribute("cx"), el.getAttribute("cy")]));
  expect(mounts).toEqual([["178", "111"]]);
  await button.focus(); await page.keyboard.press("Enter");
  await expect(button).toHaveAttribute("aria-pressed", "true");
  await expect.poll(async () => (await pane.boundingBox())!.y).toBeLessThan(closed - 10);
  expect(await lift.evaluate(el => getComputedStyle(el).transformOrigin)).toBe("178px 111px");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await pane.evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
  await page.keyboard.press("Space"); await expect(button).toHaveAttribute("aria-pressed", "false");
});
