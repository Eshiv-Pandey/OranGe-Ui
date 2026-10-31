import { expect, test } from "@playwright/test";

test("defaults to dark and preserves an explicit light preference", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/components/retro-camera");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Dark mode", exact: true }).click();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});

test("editor aliases redirect and the catalogue contains one entry per object", async ({ page, request }) => {
  for (const [old, current] of [["livery-editor", "open-wheel-car"], ["helmet-editor", "helmet"]]) {
    const response = await request.get(`/components/${old}?style=polished`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toBe(`/components/${current}?style=polished`);
  }
  await page.goto("/components");
  await expect(page.locator('a[href*="/components/livery-editor"], a[href*="/components/helmet-editor"]')).toHaveCount(0);
});

test("long properties scroll independently while the preview stays visible", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  for (const slug of ["retro-camera", "retro-player", "character-avatar", "grain-gradient", "avatar-editor"]) {
    await page.goto(`/components/${slug}`, { waitUntil: "networkidle" });
    const preview = page.locator(".creative-demo-preview, .artwork-customizer-preview, .avatar-editor-header").first();
    const inspector = page.locator(".creative-inspector-scroll, .artwork-customizer-settings, .avatar-editor-settings").first();
    await expect(inspector).toBeVisible();
    await expect(preview).toBeVisible();
    const before = (await preview.boundingBox())!;
    const editor = (await inspector.boundingBox())!;
    expect(editor.x).toBeGreaterThanOrEqual(before.x + before.width - 1);
    expect(before.y).toBeGreaterThanOrEqual(0);
    expect(before.y + before.height).toBeLessThanOrEqual(768);
    await inspector.evaluate((element) => element.scrollTop = element.scrollHeight);
    const after = (await preview.boundingBox())!;
    expect(after.y).toBe(before.y);
    expect(await page.evaluate(() => scrollY)).toBe(0);
  }
});

test("mobile properties keep the artwork pinned above the controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/components/character-avatar");
  const preview = page.locator(".artwork-customizer-preview");
  await page.getByRole("tab", { name: "Colors", exact: true }).click();
  await page.getByRole("button", { name: "Export PNG", exact: true }).scrollIntoViewIfNeeded();
  const box = (await preview.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(60);
  expect(box.y + box.height).toBeLessThan(500);
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

test("gradient fullscreen fills the viewport and returns focus", async ({ page }) => {
  await page.goto("/components/grain-gradient", { waitUntil: "networkidle" });
  const shader = page.locator(".creative-demo .grain-gradient");
  const expand = shader.getByRole("button", { name: "Full screen", exact: true });
  await expand.click();
  await expect(shader).toHaveAttribute("data-fullscreen", /native|fallback/);
  const box = (await shader.boundingBox())!;
  const viewport = page.viewportSize()!;
  expect(box.width).toBeGreaterThanOrEqual(viewport.width - 2);
  expect(box.height).toBeGreaterThanOrEqual(viewport.height - 2);
  await shader.getByRole("button", { name: "Exit full screen", exact: true }).click();
  await expect(shader).not.toHaveAttribute("data-fullscreen");
  await expect(expand).toBeFocused();
  // Browsers without Fullscreen API still get a reversible viewport view.
  await shader.evaluate((element) => Object.defineProperty(element, "requestFullscreen", { value: undefined }));
  await expand.click();
  await expect(shader).toHaveAttribute("data-fullscreen", "fallback");
  await page.keyboard.press("Escape");
  await expect(shader).not.toHaveAttribute("data-fullscreen");
  await expect(expand).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe("hidden");
});
