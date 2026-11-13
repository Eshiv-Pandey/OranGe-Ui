import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { generateHelmetConfig, helmetToSvgString } from "../components/ui/helmet-art";

const evidence = ".impeccable/review/control-fixes";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

async function assertInspectorFits(page: Page) {
  const violations = await page.locator(".workspace-controls .creative-controls").first().evaluate(grid => {
    const fields = Array.from(grid.children).filter(el => el.getBoundingClientRect().height > 0);
    const issues: string[] = [];
    for (const field of fields) {
      const bounds = field.getBoundingClientRect();
      for (const other of fields) {
        if (field === other) continue;
        const otherBounds = other.getBoundingClientRect();
        const walker = document.createTreeWalker(field, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent?.trim()) continue;
          const range = document.createRange(); range.selectNodeContents(walker.currentNode);
          for (const rect of range.getClientRects()) {
            if (rect.width && rect.height && rect.left < otherBounds.right - 1 && rect.right > otherBounds.left + 1 && rect.top < otherBounds.bottom - 1 && rect.bottom > otherBounds.top + 1) issues.push(walker.currentNode.textContent!);
          }
        }
      }
      for (const input of field.querySelectorAll("input, select")) {
        const rect = input.getBoundingClientRect();
        if (rect.width && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) issues.push(input.outerHTML);
      }
    }
    return issues;
  });
  expect(violations, "Each inspector field contains its text and inputs without crossing another field").toEqual([]);
}

for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`controls fit ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const slug of ["custom-stamp", "fluid-color-picker", "halo-button", "helmet"]) {
      await page.goto(`/components/${slug}`);
      await expect(page.getByTestId("live-demo")).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      if (slug !== "helmet") await assertInspectorFits(page);
      if (slug === "custom-stamp") {
        await expect(page.getByRole("textbox", { name: "Display background hex" })).toHaveValue("#579253");
        await page.getByRole("checkbox", { name: "Add postmark" }).check();
        await expect(page.getByRole("checkbox", { name: "Add postmark" })).toBeChecked();
      }
      if (slug === "fluid-color-picker") {
        await expect(page.locator(".fluid-picker")).toHaveAttribute("data-theme", theme);
        expect(await page.locator(".fluid-picker-panel").evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
        expect((await page.locator(".fluid-picker-plane").boundingBox())!.height).toBeGreaterThanOrEqual(160);
        for (const swatch of await page.locator(".fluid-picker-swatches button").all()) {
          const rect = (await swatch.boundingBox())!; expect(rect.width).toBeGreaterThanOrEqual(44); expect(rect.height).toBeGreaterThanOrEqual(44);
        }
        await page.locator(".fluid-picker-swatches button").first().click();
        await expect(page.getByRole("textbox", { name: "Hex", exact: true })).toHaveValue("#F57451");
      }
      if (slug === "halo-button") {
        const button = page.locator(".halo-button"); await button.focus(); await page.keyboard.press("Enter");
        expect(await button.locator(".halo-content").evaluate(el => getComputedStyle(el).backgroundColor)).toBe(theme === "dark" ? "rgb(17, 17, 17)" : "rgb(252, 252, 252)");
        await expect(page.getByRole("status").filter({ hasText: "Activated" })).toContainText("Activated 1 time");
        expect(await button.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
      }
      if (slug === "helmet") {
        await page.locator(".helmet-button").click();
        await expect(page.locator(".helmet-button")).toHaveAttribute("aria-pressed", "true");
        const svg = (await page.locator(".helmet-svg").boundingBox())!, glass = (await page.locator(".helmet-visor-pane").boundingBox())!;
        expect(glass.y).toBeGreaterThanOrEqual(svg.y - 2); expect(glass.x).toBeGreaterThanOrEqual(svg.x - 2);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `${evidence}/${slug}-${width}-${theme}.png`, fullPage: width < 801 });
    }
    expect(errors).toEqual([]);
  });
}

test("picker keyboard, alpha, errors, outside dismissal and disabled state", async ({ page }) => {
  await page.goto("/components/fluid-color-picker");
  const picker = page.locator(".fluid-picker"), input = picker.getByRole("textbox", { name: "Hex" }), plane = picker.getByRole("slider", { name: "Saturation and brightness" });
  await input.fill("bad color"); await input.press("Enter"); await expect(picker.getByRole("alert")).toBeVisible();
  await input.fill("#00ff0080"); await input.press("Enter"); await expect(input).toHaveValue("#00FF0080");
  await plane.focus(); await page.keyboard.press("Shift+ArrowDown"); await expect(picker.getByRole("slider", { name: "Brightness", exact: true })).toHaveValue("90");
  await page.keyboard.press("Escape"); await expect(picker.getByRole("group", { name: "Color controls" })).toHaveCount(0); await expect(picker.getByRole("button", { name: "Find your color" })).toBeFocused();
  await picker.getByRole("button", { name: "Find your color" }).click(); await page.locator(".workspace-inspector-heading h2").click(); await expect(picker.getByRole("group")).toHaveCount(0);
  await picker.getByRole("button", { name: "Find your color" }).click();
  await page.getByRole("checkbox", { name: "Opacity controls" }).focus(); await page.keyboard.press("Space");
  await expect(picker.getByRole("slider", { name: "Opacity" })).toHaveCount(0); await expect(input).toHaveValue(/#[A-F0-9]{6}$/);
  await page.getByRole("checkbox", { name: "Disabled", exact: true }).focus(); await page.keyboard.press("Space");
  await expect(picker.getByRole("button", { name: "Find your color" })).toBeDisabled();
  await expect(plane).toHaveAttribute("tabindex", "-1");
});

test("halo rim animates at rest, tracks the pointer and respects loading and reduced motion", async ({ page }) => {
  await page.goto("/components/halo-button");
  const button = page.locator(".halo-button"), ring = button.locator(".halo-ring");
  await expect(button).toHaveAttribute("data-motion", "running");
  const before = await ring.evaluate(el => getComputedStyle(el, "::before").rotate);
  await page.waitForTimeout(160);
  expect(await ring.evaluate(el => getComputedStyle(el, "::before").rotate)).not.toBe(before);
  const rect = (await button.boundingBox())!;
  await page.mouse.move(rect.x + rect.width - 6, rect.y + rect.height / 2);
  const right = await button.evaluate(el => el.style.getPropertyValue("--halo-angle"));
  expect(Number.parseFloat(right)).toBeCloseTo(0, 1);
  await page.mouse.move(rect.x + rect.width / 2, rect.y + rect.height - 6);
  expect(Number.parseFloat(await button.evaluate(el => el.style.getPropertyValue("--halo-angle")))).toBeCloseTo(Math.PI / 2, 1);
  expect(await ring.evaluate(el => getComputedStyle(el, "::before").animationName)).toBe("none");
  await page.getByRole("checkbox", { name: "Loading", exact: true }).check();
  await expect(button).toBeDisabled(); await expect(button).toHaveAttribute("aria-busy", "true"); await expect(button.locator(".halo-spinner")).toBeVisible();
  await page.getByRole("checkbox", { name: "Loading", exact: true }).uncheck();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(button).toHaveAttribute("data-motion", "reduced");
  expect(await ring.evaluate(el => getComputedStyle(el, "::before").animationName)).toBe("none");
});

test("touch dragging changes both picker axes and stops after release", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await context.newPage(); await page.goto("/components/fluid-color-picker");
  await expect(page.locator(".workspace-controls").getByRole("checkbox", { name: "Disabled", exact: true })).toBeVisible();
  const picker = page.getByTestId("live-demo").locator(".fluid-picker"), plane = picker.locator(".fluid-picker-plane");
  await expect(plane).toBeVisible(); await plane.scrollIntoViewIfNeeded();
  const rect = (await plane.boundingBox())!, session = await context.newCDPSession(page);
  await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: rect.x + rect.width * .2, y: rect.y + rect.height * .2 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: rect.x + rect.width * .8, y: rect.y + rect.height * .7 }] });
  await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const saturation = picker.getByRole("slider", { name: "Saturation", exact: true }), brightness = picker.getByRole("slider", { name: "Brightness", exact: true });
  // Controlled hex values quantize HSV into 8-bit RGB, especially near black.
  await expect.poll(async () => Math.abs(Number(await saturation.inputValue()) - 80)).toBeLessThanOrEqual(2);
  expect(Math.abs(Number(await brightness.inputValue()) - 30)).toBeLessThanOrEqual(2);
  const settled = await saturation.inputValue();
  await page.mouse.move(rect.x + 2, rect.y + 2); await expect(saturation).toHaveValue(settled);
  await context.close();
});

test("visor settles over the brow with a stationary hinge and matches the portable frame", async ({ page }) => {
  await page.goto("/components/helmet");
  const button = page.locator(".helmet-button"), pane = page.locator(".helmet-visor-pane"), hinge = page.locator(".helmet-pivot > circle:first-child");
  await button.focus(); const hingeBefore = (await hinge.boundingBox())!, closed = (await pane.boundingBox())!;
  await page.keyboard.press("Enter"); await page.waitForTimeout(500);
  const raised = (await pane.boundingBox())!, hingeAfter = (await hinge.boundingBox())!;
  expect(raised.y).toBeLessThan(closed.y - 20); expect(raised.width).toBeGreaterThan(raised.height);
  expect(hingeAfter.x).toBeCloseTo(hingeBefore.x, 0); expect(hingeAfter.y).toBeCloseTo(hingeBefore.y, 0);
  const angle = await page.locator(".helmet-visor-lift").evaluate(el => { const matrix = new DOMMatrix(getComputedStyle(el).transform); return Math.atan2(matrix.b, matrix.a) * 180 / Math.PI; });
  expect(angle).toBeCloseTo(28, 0);
  const config = generateHelmetConfig("open-export"), portable = helmetToSvgString({ ...config, parts: { ...config.parts, visorOpen: true } });
  expect(portable).toContain('viewBox="0 0 240 240"'); expect(portable).toContain('rotate(28 178 111)');
  await page.emulateMedia({ reducedMotion: "reduce" }); await page.keyboard.press("Space"); await expect(button).toHaveAttribute("aria-pressed", "false");
  expect(await page.locator(".helmet-visor-lift").evaluate(el => getComputedStyle(el).transitionDuration)).toBe("0s");
});
