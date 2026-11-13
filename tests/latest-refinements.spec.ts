import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const evidence = ".impeccable/review/nov6/after";
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

for (const width of [320, 390, 768, 1440]) for (const theme of ["light", "dark"]) {
  test(`polished previews fit ${width}px in ${theme}`, async ({ page }) => {
    const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.emulateMedia({ reducedMotion: "reduce" });
    for (const slug of ["sticker-social-icons", "portfolio-banner", "journal-stack", "helmet", "character-avatar", "avatar-editor"]) {
      await page.goto(`/components/${slug}`);
      const live = page.getByTestId("live-demo"); await expect(live).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const preview = live.locator(".artwork-customizer-preview, .avatar-editor-header").first();
      if (slug !== "journal-stack") await expect.poll(() => preview.evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
      if (slug.startsWith("portfolio") || slug === "sticker-social-icons") {
        await expect.poll(() => live.locator(".artwork-customizer-artwork").evaluate(el => getComputedStyle(el).backgroundColor)).toBe("rgba(0, 0, 0, 0)");
      }
      if (slug === "portfolio-banner") {
        await expect(live.locator(".portfolio-nebula")).toHaveAttribute("data-renderer", "webgl");
        if (theme === "dark") {
          const pixels = await sharp(await live.locator(".portfolio-banner").screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true });
          let stars = 0;
          for (let y = 0; y < pixels.info.height * .7; y++) for (let x = 0; x < pixels.info.width; x++) {
            const i = (y * pixels.info.width + x) * 3;
            if (pixels.data[i] > 200 && pixels.data[i + 1] > 180 && pixels.data[i + 2] > 150) stars++;
          }
          expect(stars, "Bright star cores are visible above the truck and clock").toBeGreaterThan(5);
        }
      }
      if (slug === "journal-stack") {
        await expect(live.locator(".journal-book")).toHaveCount(1);
        await expect(live.locator(".journal-page")).toHaveCount(1);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      const controls = page.locator(".workspace-controls");
      expect(await controls.locator("select,input,button").evaluateAll(elements => elements.filter(el => {
        if (!(el as HTMLElement).offsetParent) return false;
        const bounds = el.getBoundingClientRect(), panel = el.closest(".workspace-inspector")!.getBoundingClientRect();
        return bounds.left < panel.left - 1 || bounds.right > panel.right + 1;
      }).map(el => el.getAttribute("aria-label") || el.textContent))).toEqual([]);
      await page.screenshot({ path: `${evidence}/${slug}-${width}-${theme}.png`, fullPage: true });
    }
    expect(errors).toEqual([]);
  });
}

test("one book turns double-sided pages, reverses, and supports keyboard and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/components/journal-stack");
  const live = page.getByTestId("live-demo");
  const book = live.locator(".journal-book"), turn = live.locator(".journal-turn");
  await expect(book).toBeVisible();
  await expect(live.locator(".journal-stack")).toHaveAttribute("data-motion", "running");
  const bounds = (await book.boundingBox())!;
  await page.getByRole("button", { name: "Next journal page" }).click();
  await expect(page.getByRole("status").filter({ hasText: "4 / 8" })).toBeVisible();
  await expect(turn).toHaveAttribute("data-direction", "forward");
  await turn.evaluate(el => { const animation = el.getAnimations()[0]; animation.pause(); animation.currentTime = 400; });
  await expect(turn.locator(".journal-turn-front")).toHaveCount(1);
  await expect(turn.locator(".journal-turn-back")).toHaveCount(1);
  expect(await turn.evaluate(el => getComputedStyle(el).transformOrigin)).toMatch(/^0px /);
  expect((await book.boundingBox())!.width).toBeCloseTo(bounds.width);
  await book.screenshot({ path: `${evidence}/journal-mid-turn.png` });
  await turn.evaluate(el => el.getAnimations()[0].finish());
  await expect(turn).toHaveCount(0);
  await page.getByRole("button", { name: "Previous journal page" }).click();
  await expect(turn).toHaveAttribute("data-direction", "backward");
  await expect(turn).toHaveCount(0);
  await live.locator(".journal-page").focus();
  await page.keyboard.press("Home");
  await expect(page.getByRole("button", { name: "Previous journal page" })).toBeDisabled();
  await page.keyboard.press("End");
  await expect(page.getByRole("button", { name: "Next journal page" })).toBeDisabled();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.keyboard.press("ArrowLeft");
  await expect(turn).toHaveCount(0);
  await expect(live.locator(".journal-page")).toBeFocused();
  expect(await live.locator(".journal-page").evaluate(el => getComputedStyle(el).outlineStyle)).toBe("solid");
});

test("touch page turns do not advance twice", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 }, hasTouch: true });
  const page = await context.newPage();
  try {
    await page.goto("/components/journal-stack");
    const book = page.getByTestId("live-demo").locator(".journal-page"); await expect(book).toBeVisible();
    await book.scrollIntoViewIfNeeded(); const bounds = (await book.boundingBox())!;
    await page.touchscreen.tap(bounds.x + bounds.width * .8, bounds.y + bounds.height * .5);
    await expect(page.getByRole("status").filter({ hasText: "4 / 8" })).toBeVisible();
    await book.dispatchEvent("pointerdown", { clientX: 250, clientY: 300 });
    await book.dispatchEvent("pointerup", { clientX: 160, clientY: 300 });
    await book.dispatchEvent("click", { clientX: 160, clientY: 300, detail: 1 });
    await expect(page.getByRole("status").filter({ hasText: "5 / 8" })).toBeVisible();
    await expect(book).toHaveCount(1);
  } finally { await context.close(); }
});

test("male and female presets stay separate while randomizing", async ({ page }) => {
  await page.goto("/components/character-avatar");
  const gender = page.getByRole("combobox", { name: "Gender", exact: true });
  const artwork = page.locator(".character-avatar");
  await expect(gender.locator("option")).toHaveText(["Male", "Female"]);
  const male = await artwork.innerHTML();
  await gender.selectOption("female");
  await expect(page.getByRole("combobox", { name: "Facial hair", exact: true })).toHaveCount(0);
  await expect(artwork.locator(".character-facial-hair")).toHaveCount(0);
  expect(await artwork.innerHTML()).not.toBe(male);
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Randomize", exact: true }).click();
    await expect(gender).toHaveValue("female");
    await expect(artwork.locator(".character-facial-hair")).toHaveCount(0);
  }
  await gender.selectOption("male");
  await expect(page.getByRole("combobox", { name: "Facial hair", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Randomize", exact: true }).click();
  await expect(gender).toHaveValue("male");
});

test("Avatar Editor Animate makes a visible pose change and settles when stopped", async ({ page }) => {
  await page.goto("/components/avatar-editor");
  const animate = page.getByRole("button", { name: "Animate", exact: true });
  const avatar = page.getByRole("img", { name: "Avatar preview", exact: true });
  const glyph = avatar.locator(".avatar-glyph-motion");
  await animate.click();
  await expect(animate).toHaveAttribute("aria-pressed", "true");
  const positions = await glyph.evaluate(el => {
    const animation = el.getAnimations()[0]; animation.pause();
    animation.currentTime = 0; const start = el.getBoundingClientRect();
    animation.currentTime = 1200; const end = el.getBoundingClientRect();
    return { displacement: Math.abs(start.y - end.y), widthChange: Math.abs(start.width - end.width) };
  });
  expect(positions.displacement + positions.widthChange).toBeGreaterThan(8);
  await animate.click();
  expect(await glyph.evaluate(el => getComputedStyle(el).animationName)).toBe("none");
  await animate.click(); await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(animate).toBeDisabled(); await expect(animate).toHaveAttribute("aria-pressed", "false");
  expect(await glyph.evaluate(el => getComputedStyle(el).transform)).toBe("none");
});
