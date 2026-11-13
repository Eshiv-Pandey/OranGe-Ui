import { expect, test, type Page } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const evidence = ".impeccable/review/nov6-next/after";
test.beforeAll(() => mkdir(evidence, { recursive: true }).then(() => {}));
async function open(page: Page, slug: string) {
  await page.goto(`/components/${slug}`);
  await expect(page.getByTestId("live-demo")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}
async function frameStyle(page: Page, selector: string) {
  return page.locator(selector).evaluate(el => {
    const style = getComputedStyle(el);
    return { outline: style.outlineStyle, shadow: style.boxShadow, border: style.borderColor };
  });
}

for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`component layout and focus at ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const slug of ["retro-camera", "morph-input", "select", "race-start-lights", "sticker-social-icons", "focus-cards", "film-strip"]) {
      await open(page, slug);
      const demo = page.getByTestId("live-demo");
      if (slug === "retro-camera") {
        const capture = demo.getByRole("button", { name: "Take photo", exact: true });
        await expect(capture).toBeVisible();
        expect((await capture.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        const controls = demo.locator(".camera-buttons"), screen = demo.locator(".retro-camera-screen"), back = demo.locator(".retro-camera-back");
        const a = (await controls.boundingBox())!, b = (await screen.boundingBox())!, c = (await back.boundingBox())!;
        expect(a.x).toBeGreaterThanOrEqual(b.x + b.width);
        expect(a.y + a.height).toBeLessThanOrEqual(c.y + c.height);
        const nativeSelect = page.getByRole("combobox", { name: "Photo filter", exact: true });
        await nativeSelect.focus(); await page.keyboard.press("ArrowDown");
        const focus = await nativeSelect.evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, shadow: getComputedStyle(el).boxShadow }));
        expect(focus).toEqual({ outline: "none", shadow: "none" });
        await page.getByRole("checkbox", { name: "Show both sides" }).uncheck();
        const flipBack = (await back.boundingBox())!, bar = (await demo.locator(".camera-capture-bar").boundingBox())!;
        expect(bar.y).toBeGreaterThanOrEqual(flipBack.y + flipBack.height);
      }
      if (slug === "morph-input") {
        await demo.getByRole("button", { name: "Open search", exact: true }).focus();
        await page.keyboard.press("Enter");
        const field = demo.locator('input[type="search"]');
        await expect(field).toBeFocused();
        expect(await frameStyle(page, '.morph-input-field input')).toMatchObject({ outline: "none", shadow: "none" });
        expect((await frameStyle(page, '.morph-input-form')).outline).toBe("solid");
        await field.fill("orange"); await page.keyboard.press("Enter");
        await expect(demo.locator('.morph-input [role="status"]')).toContainText("Submitted: orange");
      }
      if (slug === "select") {
        const trigger = demo.locator(".ui-select-trigger"); await trigger.focus();
        const before = await trigger.evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, shadow: getComputedStyle(el).boxShadow }));
        expect(before).toEqual({ outline: "none", shadow: "none" });
        await page.keyboard.press("Space"); await expect(page.getByRole("listbox")).toBeVisible();
        await page.keyboard.press("ArrowDown");
        const active = page.locator(".ui-select-option[data-highlighted]");
        expect(await active.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("none");
        await page.keyboard.press("Enter"); await expect(trigger).toBeFocused();
      }
      if (slug === "race-start-lights") {
        await expect(demo.locator(".race-start-lens")).toHaveCount(10);
        await expect(page.getByRole("slider", { name: "Light interval" })).toBeVisible();
      }
      if (slug === "sticker-social-icons") {
        await expect(demo.getByRole("navigation").getByRole("link")).toHaveCount(15);
        const instagram = demo.getByRole("link", { name: "Instagram profile", exact: true });
        await instagram.focus(); await expect(page.getByRole("heading", { name: "Sample profile" })).toBeVisible();
        expect(await instagram.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
        await page.getByRole("checkbox", { name: "Profile hover cards" }).uncheck();
        await instagram.focus(); await expect(page.getByRole("heading", { name: "Sample profile" })).toHaveCount(0);
        const bounds = (await instagram.boundingBox())!;
        expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
      }
      if (slug === "focus-cards" || slug === "film-strip") {
        const art = demo.locator(`.${slug}`), preview = demo.locator(".creative-demo-preview");
        const a = (await art.boundingBox())!, b = (await preview.boundingBox())!;
        expect(a.width).toBeGreaterThanOrEqual(b.width - 2);
        expect(a.height).toBeGreaterThanOrEqual(400);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.screenshot({ path: `${evidence}/${slug}-${width}-${theme}.png`, fullPage: width < 801 });
    }
    expect(errors).toEqual([]);
  });
}

test("simple catalogue previews are still, while richer components retain playback", async ({ page }) => {
  await page.goto("/components");
  for (const slug of ["button", "input", "badge", "checkbox", "select"]) {
    const tile = page.locator(`.tile-${slug}`); await tile.scrollIntoViewIfNeeded();
    const preview = tile.locator(".demo-preview");
    await expect(preview).toHaveAttribute("data-static", "true");
    await expect(preview).toHaveAttribute("data-playing", "false");
    await expect(preview.locator(".preview-cursor")).toHaveCount(0);
    expect(await preview.locator(".thumbnail-inner").evaluate(el => el.hasAttribute("inert"))).toBe(true);
  }
  const rich = page.locator(".tile-race-start-lights .demo-preview");
  await expect(rich).not.toHaveAttribute("data-static", "true");
});

test("camera captures an actual video frame by touch and stops every track", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.addInitScript(() => {
    navigator.mediaDevices.getUserMedia = async () => {
      const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
      const paint = canvas.getContext("2d")!;
      const gradient = paint.createLinearGradient(0, 0, 640, 480); gradient.addColorStop(0, "#f97940"); gradient.addColorStop(1, "#46baa3");
      paint.fillStyle = gradient; paint.fillRect(0, 0, 640, 480);
      const stream = canvas.captureStream(20);
      Object.assign(window, { __polishCameraStream: stream });
      return stream;
    };
  });
  await open(page, "retro-camera"); const demo = page.getByTestId("live-demo");
  await demo.getByRole("button", { name: "Enable camera" }).tap();
  await expect.poll(() => demo.locator("video").evaluate((el: HTMLVideoElement) => el.readyState)).toBeGreaterThanOrEqual(2);
  await demo.getByRole("button", { name: "Take photo", exact: true }).tap();
  await expect(demo.getByRole("button", { name: "Review photo 1", exact: true })).toBeVisible();
  const result = await demo.locator(".camera-review-image").evaluate(async (el: HTMLImageElement) => {
    await el.decode(); const blob = await fetch(el.src).then(response => response.blob());
    return { width: el.naturalWidth, height: el.naturalHeight, bytes: blob.size, type: blob.type };
  });
  expect(result).toMatchObject({ width: 640, height: 480, type: "image/png" }); expect(result.bytes).toBeGreaterThan(1000);
  await demo.getByRole("button", { name: "Stop camera" }).tap();
  expect(await page.evaluate(() => (window as unknown as { __polishCameraStream: MediaStream }).__polishCameraStream.getTracks().every(track => track.readyState === "ended"))).toBe(true);
  await page.evaluate(() => { navigator.mediaDevices.getUserMedia = async () => { throw new DOMException("Denied", "NotAllowedError"); }; });
  await demo.getByRole("button", { name: "Enable camera" }).tap();
  await expect(demo.getByRole("status")).toContainText("Camera permission denied");
  await demo.getByRole("button", { name: "Take photo", exact: true }).tap();
  await expect(demo.getByRole("button", { name: "Review photo 2", exact: true })).toBeVisible();
  await context.close();
});

test("paired start lights complete and restart with keyboard controls", async ({ page }) => {
  await open(page, "race-start-lights"); const demo = page.getByTestId("live-demo");
  await demo.getByRole("button", { name: "Start sequence", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(demo.locator('.race-start-lamp[data-lit="true"]')).toHaveCount(5);
  await expect(demo.getByRole("status")).toHaveText("Go");
  await demo.getByRole("button", { name: "Restart sequence", exact: true }).focus(); await page.keyboard.press("Enter");
  await expect(demo.locator('.race-start-lamp[data-lit="true"]')).toHaveCount(1);
  await demo.getByRole("button", { name: "Reset lights", exact: true }).click();
  await expect(demo.locator('.race-start-lamp[data-lit="true"]')).toHaveCount(0);
});

for (const theme of ["light", "dark"]) test(`filter and catalogue focus use a single fitted edge in ${theme}`, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
  await page.goto("/components");
  const field = page.getByRole("searchbox", { name: "Search navigation", exact: true });
  await field.focus(); await field.fill("calendar");
  await expect(page.getByRole("navigation", { name: "Component navigation" }).getByRole("link", { name: "Calendar", exact: true })).toBeVisible();
  const frame = page.locator(".library-nav .pixel-field__frame");
  await expect.poll(() => frame.evaluate(el => getComputedStyle(el).outlineColor === getComputedStyle(el).borderColor)).toBe(true);
  const fieldStyle = await frame.evaluate(el => {
    const style = getComputedStyle(el);
    return { color: style.outlineColor, border: style.borderColor, width: style.outlineWidth, offset: style.outlineOffset };
  });
  expect(fieldStyle.color).toBe(fieldStyle.border);
  expect(fieldStyle.color).not.toBe(theme === "light" ? "rgb(82, 82, 82)" : "rgb(212, 212, 212)");
  expect(fieldStyle).toMatchObject({ width: "2px", offset: "-2px" });
  expect(await field.evaluate(el => getComputedStyle(el).outlineStyle)).toBe("none");
  await frame.screenshot({ path: `${evidence}/navigation-focus-${theme}.png` });
  const tile = page.locator(".tile-calendar"), link = tile.getByRole("link", { name: "Calendar", exact: true });
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    await link.focus(); await expect(link).toBeFocused();
    const style = await tile.evaluate(el => {
      const style = getComputedStyle(el);
      return { color: style.outlineColor, border: style.borderColor, width: style.outlineWidth, offset: style.outlineOffset };
    });
    expect(style.color).toBe(style.border);
    expect(style).toMatchObject({ width: "2px", offset: "-2px" });
    expect(await link.evaluate(el => getComputedStyle(el).boxShadow)).toBe("none");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await tile.screenshot({ path: `${evidence}/calendar-focus-${width}-${theme}.png` });
  }
  const preview = tile.locator(".demo-preview"); await preview.focus();
  expect(await preview.evaluate(el => ({ outline: getComputedStyle(el).outlineStyle, shadow: getComputedStyle(el).boxShadow }))).toEqual({ outline: "none", shadow: "none" });
  await link.focus();
  await link.press("Enter"); await expect(page).toHaveURL(/\/components\/calendar/);
});
