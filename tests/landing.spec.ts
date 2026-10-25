import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

async function ready(page: Page) {
  await page.goto("http://127.0.0.1:3107/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Play with pixels.Ship with polish.");
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole("button", { name: "Save a little joy" })).toBeVisible();
  const fonts = await page.evaluate(async () => Promise.all([document.body, document.querySelector("h1")!].map(async (element) => {
    const style = getComputedStyle(element);
    const family = style.fontFamily.split(",")[0].trim().replace(/^["']|["']$/g, "");
    const faces = await document.fonts.load(`${style.fontWeight} ${style.fontSize} "${family}"`, "Play with pixels. Ship with polish.");
    return { family, faces: faces.length, loaded: faces.length > 0 && faces.every((face) => face.status === "loaded") };
  })));
  expect(fonts[0].family.toLowerCase()).toContain("geist");
  expect(fonts[1].family.toLowerCase()).toContain("pixelify");
  for (const font of fonts) {
    expect(font.family.toLowerCase()).not.toContain("fallback");
    expect(font.loaded, `${font.family} has a successfully loaded font face`).toBe(true);
  }
  return fonts;
}

for (const width of [1440, 390, 360]) {
  for (const theme of ["light", "dark"] as const) {
    test(`${width}px ${theme} page has no accessibility violations or layout shift`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 1000 }, colorScheme: theme, reducedMotion: "reduce" });
      const page = await context.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.addInitScript(() => {
        (window as Window & { layoutShifts?: number[] }).layoutShifts = [];
        new PerformanceObserver((list) => {
          for (const item of list.getEntries()) {
            const shift = item as PerformanceEntry & { value: number; hadRecentInput: boolean };
            if (!shift.hadRecentInput) (window as Window & { layoutShifts?: number[] }).layoutShifts?.push(shift.value);
          }
        }).observe({ type: "layout-shift", buffered: true });
      });
      const fonts = await ready(page);
      await expect(page.locator(".stat-card-grid .stat-card")).toHaveCount(5);
      const results = await new AxeBuilder({ page }).analyze();
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, shift: (window as Window & { layoutShifts?: number[] }).layoutShifts?.reduce((sum, value) => sum + value, 0) ?? 0, displayFont: getComputedStyle(document.querySelector("h1")!).fontFamily, colorScheme: getComputedStyle(document.documentElement).colorScheme }));
      await mkdir("out", { recursive: true });
      await page.screenshot({ path: `out/landing-${width}-${theme}.png`, fullPage: true, animations: "disabled" });
      await writeFile(`out/landing-${width}-${theme}-a11y.json`, JSON.stringify({ width, theme, violations: results.violations, dimensions, fonts, errors }, null, 2) + "\n");
      expect(results.violations).toEqual([]);
      expect(dimensions.document).toBeLessThanOrEqual(width);
      expect(dimensions.shift).toBeLessThan(0.01);
      expect(dimensions.displayFont.toLowerCase()).toContain("pixelify");
      expect(dimensions.colorScheme).toBe(theme);
      expect(errors).toEqual([]);
      await context.close();
    });
  }
}

test("search and previews work with keyboard activation", async ({ page }) => {
  await ready(page);
  const search = page.getByRole("searchbox", { name: "Search components" });
  await search.fill("Button");
  await search.press("Enter");
  await expect(page.locator(".stat-card-grid .stat-card")).toHaveCount(1);
  await expect(page.getByRole("heading", { name: "Meet your new building blocks." })).toBeFocused();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator(".stat-card-grid .stat-card")).toHaveCount(5);
  await search.fill("no-such-component");
  await expect(page.getByText("No matches yet. Try Button, Input, or StatCard.")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  const save = page.getByRole("button", { name: "Save a little joy" });
  await save.focus();
  await save.press("Enter");
  await expect(page.getByRole("button", { name: "Saved!" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Reset", exact: true }).click();
  await expect(save).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Try validation" }).click();
  await expect(page.getByRole("textbox", { name: "Your email" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator("#input-preview").getByRole("alert")).toHaveText("Enter a valid email address.");
  await page.getByRole("textbox", { name: "Your email" }).fill("hello@example.com");
  await page.getByRole("button", { name: "Try validation" }).click();
  await expect(page.getByText("Looks good. You are ready to go!")).toBeVisible();
  await page.getByRole("button", { name: "Console right", exact: true }).click();
  await expect(page.locator(".console-message")).toHaveText("One pixel closer.");
  await page.getByRole("button", { name: "Console down", exact: true }).click();
  await expect(page.locator(".console-message")).toHaveText("More components loading...");
  await page.getByRole("button", { name: "Play console demo" }).click();
  await expect(page.getByRole("button", { name: "Play console demo" })).toHaveAttribute("aria-pressed", "true");
});

test("every enabled control receives visible keyboard focus without a trap", async ({ page }) => {
  await ready(page);
  const count = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("a[href], button, input, [tabindex]"))
      .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && getComputedStyle(element).display !== "none");
    elements.forEach((element, index) => element.dataset.focusOrder = String(index));
    return elements.length;
  });
  expect(count).toBeGreaterThan(20);
  for (let index = 0; index < count; index++) {
    await page.keyboard.press("Tab");
    await expect.poll(() => page.evaluate(() => {
      const active = document.activeElement as HTMLElement;
      let outline = false;
      for (let element: HTMLElement | null = active; element; element = element.parentElement) {
        const style = getComputedStyle(element);
        if (style.outlineStyle !== "none" && parseFloat(style.outlineWidth) >= 2 && style.outlineColor !== "rgba(0, 0, 0, 0)") outline = true;
      }
      const rect = active.getBoundingClientRect();
      return { order: active.dataset.focusOrder, visible: active.matches(":focus-visible"), outline, inViewport: rect.right > 0 && rect.left < innerWidth && rect.bottom > 0 && rect.top < innerHeight };
    }), { message: `Keyboard control ${index}` }).toEqual({ order: String(index), visible: true, outline: true, inViewport: true });
  }
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => document.activeElement?.tagName)).toBe("BODY");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
});

test("360px through desktop have no horizontal overflow", async ({ page }) => {
  for (const width of [360, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px viewport`).toBeLessThanOrEqual(width);
  }
});

for (const deviceScaleFactor of [1, 2]) {
  test(`DPR ${deviceScaleFactor} cursors use crisp density sources and accurate hotspots`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor });
    const page = await context.newPage();
    await ready(page);
    expect(await page.evaluate(() => devicePixelRatio)).toBe(deviceScaleFactor);
    const cursor = async (selector: string) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).cursor);
    const arrow = await cursor("body");
    const heart = await cursor(".stat-card--linked");
    expect(heart).not.toEqual(arrow);
    for (const selector of ["a", ".pixel-button:not(:disabled)", "label[for]"]) expect(await cursor(selector)).toEqual(heart);
    expect(await cursor(".pixel-input")).toBe("text");
    expect(await cursor(".pixel-button:disabled")).toBe("not-allowed");
    const observations = [];
    for (const [kind, value, hotspot, fallback] of [["arrow", arrow, [0, 0], "auto"], ["heart", heart, [7, 11], "pointer"]] as const) {
      expect(value).toContain("image-set(");
      expect(value).toMatch(/\)\s+1(?:x|dppx)\s*,/);
      expect(value).toMatch(/\)\s+2(?:x|dppx)\s*\)/);
      const actualHotspot = value.match(/\)\s+(\d+)\s+(\d+)\s*,\s*(auto|pointer)$/);
      expect(actualHotspot?.slice(1)).toEqual([...hotspot.map(String), fallback]);
      const urls = [...value.matchAll(/data:image\/svg\+xml,[^"\s)]+/g)].map((match) => match[0]);
      expect(urls).toHaveLength(2);
      for (const [index, url] of urls.entries()) {
        const source = decodeURIComponent(url.slice("data:image/svg+xml,".length));
        expect(source).toContain('shape-rendering="crispEdges"');
        expect(source).toContain('viewBox="0 0 16 16"');
        expect(Number(source.match(/width="(\d+)"/)?.[1])).toBe(16 * (index + 1));
        expect(Number(source.match(/height="(\d+)"/)?.[1])).toBe(16 * (index + 1));
      }
      const decoded = await page.evaluate(async (sources) => Promise.all(sources.map(async (src) => {
        const image = new Image();
        image.src = src;
        await image.decode();
        return { width: image.naturalWidth, height: image.naturalHeight };
      })), urls);
      expect(decoded).toEqual([{ width: 16, height: 16 }, { width: 32, height: 32 }]);
      observations.push({ kind, hotspot, fallback, sources: decoded });
    }
    await mkdir("out", { recursive: true });
    await writeFile(`out/cursors-dpr-${deviceScaleFactor}.json`, JSON.stringify({ deviceScaleFactor, cursors: observations }, null, 2) + "\n");
    await context.close();
  });
}

test("touch devices use native cursors", async ({ browser }) => {
  const touch = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const touchPage = await touch.newPage();
  await touchPage.goto("http://127.0.0.1:3107/");
  expect(await touchPage.locator("body").evaluate((element) => getComputedStyle(element).cursor)).toBe("auto");
  expect(await touchPage.locator(".stat-card--linked").first().evaluate((element) => getComputedStyle(element).cursor)).toBe("auto");
  await touch.close();
});

test("grass animation pauses and resumes on visibility state changes", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const grass = page.locator(".pixel-grass");
  const states = () => grass.evaluate((element) => element.getAnimations({ subtree: true }).map((animation) => animation.playState));
  await expect.poll(states).toEqual(["running", "running"]);
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(grass).toHaveAttribute("data-paused", "true");
  await expect.poll(states).toEqual(["paused", "paused"]);
  const frozen = await grass.evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true });
    await Promise.all(animations.map((animation) => animation.ready));
    const before = animations.map((animation) => animation.currentTime);
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return animations.every((animation, index) => animation.currentTime === before[index]);
  });
  expect(frozen).toBe(true);
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(grass).not.toHaveAttribute("data-paused");
  await expect.poll(states).toEqual(["running", "running"]);
  const resumed = await grass.evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true });
    await Promise.all(animations.map((animation) => animation.ready));
    const before = animations.map((animation) => Number(animation.currentTime));
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    return animations.every((animation, index) => Number(animation.currentTime) > before[index]);
  });
  expect(resumed).toBe(true);
});

test("dark toggle persists and reduced motion stops ambient animations", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await ready(page);
  const toggle = page.getByRole("button", { name: "Dark mode" });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  const animations = await page.locator(".pixel-grass__layer, .pixel-mascot__body, .gamer-boy__thumb").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName));
  expect(animations.length).toBeGreaterThan(3);
  expect(animations.every((value) => value === "none")).toBe(true);
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
});
