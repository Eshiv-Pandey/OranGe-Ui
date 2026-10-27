import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

test.use({ reducedMotion: "reduce" });

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
  expect(fonts[1].family.toLowerCase()).toContain("geist");
  for (const font of fonts) {
    expect(font.family.toLowerCase()).not.toContain("fallback");
    expect(font.loaded, `${font.family} has a successfully loaded font face`).toBe(true);
  }
  return fonts;
}

for (const width of [1440, 768, 390, 360]) {
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
      expect(dimensions.displayFont.toLowerCase()).toContain("geist");
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
  await expect(page.getByRole("heading", { name: "Your next good idea starts here." })).toBeFocused();
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
  await page.getByRole("combobox", { name: "Button variant" }).selectOption("secondary");
  await expect(save).toHaveClass(/pixel-button--secondary/);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await expect(page.getByLabel("button code example")).toContainText('variant="secondary"');
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.locator(".stat-card-grid").getByRole("link").filter({ has: page.getByRole("heading", { name: "Input", exact: true }) })).toHaveAttribute("href", "/components/input");
  await page.getByRole("button", { name: "Input", exact: true }).click();
  await expect(page.getByRole("button", { name: "Input", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Try validation" }).click();
  await expect(page.getByRole("textbox", { name: "Your email" })).toHaveAttribute("aria-invalid", "true");
  await expect(page.locator(".input-demo").getByRole("alert")).toHaveText("Enter a valid email address.");
  await page.getByRole("textbox", { name: "Your email" }).fill("hello@example.com");
  await page.getByRole("button", { name: "Try validation" }).click();
  await expect(page.getByText("Looks good. You are ready to go!")).toBeVisible();
  await page.getByRole("button", { name: "StatCard", exact: true }).click();
  await page.getByRole("combobox", { name: "Card accent" }).selectOption("coral");
  await expect(page.locator(".card-demo .stat-card")).toHaveClass(/stat-card--coral/);
  await page.getByRole("button", { name: "Code", exact: true }).click();
  await expect(page.getByLabel("statcard code example")).toContainText('accent="coral"');
});

test("every enabled control receives visible keyboard focus without a trap", async ({ page }) => {
  await ready(page);
  const count = await page.evaluate(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>("a[href], button, input, select, [tabindex]"))
      .filter((element) => element.tabIndex >= 0 && !element.matches(":disabled") && element.getBoundingClientRect().width > 0 && element.getBoundingClientRect().height > 0);
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
  for (const width of [360, 390, 600, 768, 800, 1024, 1100, 1101, 1279, 1280, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await ready(page);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `${width}px viewport`).toBeLessThanOrEqual(width);
    const titles = await page.locator(".stat-card-grid h3").evaluateAll((elements) => elements.map((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return { text: element.textContent, lines: range.getClientRects().length };
    }));
    for (const title of titles) expect(title.lines, `${title.text} stays on one line at ${width}px`).toBe(1);
  }
});

for (const deviceScaleFactor of [1, 2]) {
  test(`DPR ${deviceScaleFactor} cursors use crisp density sources and accurate hotspots`, async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor });
    const page = await context.newPage();
    await ready(page);
    expect(await page.evaluate(() => devicePixelRatio)).toBe(deviceScaleFactor);
    const cursor = async (selector: string) => page.locator(selector).first().evaluate((element) => getComputedStyle(element).cursor);
    const arrow = await page.locator("html").evaluate((element) => getComputedStyle(element).getPropertyValue("--pixel-arrow-cursor").trim());
    const heart = await cursor(".stat-card--linked");
    expect(heart).not.toEqual(arrow);
    expect(await cursor("body")).toBe("auto");
    expect(await cursor(".pixel-button:not(:disabled)")).toBe("pointer");
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

test("console supports buttons, keyboard, pause, win, and reset", async ({ page }) => {
  await ready(page);
  const device = page.getByRole("group", { name: "Interactive handheld console" });
  await expect(page.getByRole("button", { name: "Console right" })).toBeDisabled();
  await device.focus();
  await device.press("Enter");
  await expect(page.getByRole("button", { name: "Pause console demo" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Console right" }).click();
  await expect(page.locator(".console-board")).toHaveAttribute("data-player", "3,1");
  await page.getByRole("button", { name: "Pause console demo" }).click();
  await device.press("ArrowRight");
  await expect(page.locator(".console-board")).toHaveAttribute("data-player", "3,1");
  await page.getByRole("button", { name: "Play console demo" }).click();
  for (const key of ["ArrowRight", "ArrowUp", "a", "a", "a", "a", "s", "s"]) await device.press(key);
  await expect(page.locator(".console-message")).toHaveText("All four found. Nicely played!");
  await page.getByRole("button", { name: "Play console demo" }).click();
  await expect(page.locator(".console-board")).toHaveAttribute("data-player", "2,1");
  const result = await new AxeBuilder({ page }).include(".coming-soon").analyze();
  expect(result.violations).toEqual([]);
  await page.getByRole("button", { name: "Reset game" }).click();
  await expect(page.locator(".console-title")).toHaveText("PRESSPLAY");
  await device.press("Enter");
  await device.press("Escape");
  await expect(page.locator(".console-title")).toHaveText("PRESSPLAY");
});

test("hero pauses rendering manually, offscreen, and while the tab is hidden", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await ready(page);
  const art = page.locator(".hero-art");
  const canvas = art.locator("canvas");
  await expect(art).toHaveAttribute("data-renderer", "webgl");
  await expect(canvas).toHaveAttribute("data-running", "true");
  const frames = () => canvas.getAttribute("data-frames").then(Number);
  const assertStopped = async () => {
    await expect(canvas).toHaveAttribute("data-running", "false");
    const before = await frames();
    await page.waitForTimeout(150);
    expect(await frames()).toBe(before);
  };
  const assertResumed = async () => {
    await expect(canvas).toHaveAttribute("data-running", "true");
    const before = await frames();
    await expect.poll(frames).toBeGreaterThan(before);
  };
  const pause = page.locator(".motion-toggle");
  await pause.click();
  await assertStopped();
  await pause.click();
  await assertResumed();
  await page.locator("#playground").scrollIntoViewIfNeeded();
  await expect(art).not.toBeInViewport();
  await assertStopped();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await assertResumed();
  await page.evaluate(() => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await assertStopped();
  await page.evaluate(() => {
    Reflect.deleteProperty(document, "visibilityState");
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await assertResumed();
  await pause.click();
  await expect(page.locator(".hero-static")).toHaveCSS("opacity", "0");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "out/hero-webgl-desktop.png" });
});

test("dark toggle persists and reduced motion uses a static hero", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await ready(page);
  const toggle = page.getByRole("button", { name: "Dark mode" });
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".hero-art")).toHaveAttribute("data-renderer", "static");
  await expect(page.locator(".hero-art canvas")).toHaveCount(0);
  await expect(page.locator(".motion-toggle")).toBeDisabled();
  const animations = await page.locator(".hero-heading, .hero-art").evaluateAll((elements) => elements.map((element) => getComputedStyle(element).animationName));
  expect(animations).toEqual(["none", "none"]);
  await toggle.click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".hero-art")).toHaveAttribute("data-renderer", "webgl");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".hero-art canvas")).toHaveCount(0);
  await expect(page.locator(".hero-static")).toHaveCSS("opacity", "1");
});

test("unavailable graphics and context loss preserve the original static scene", async ({ browser }) => {
  const context = await browser.newContext({ reducedMotion: "no-preference" });
  const page = await context.newPage();
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (String(args[0]).includes("webgl")) {
        document.documentElement.dataset.webglAttempted = "true";
        return null;
      }
      return Reflect.apply(original, this, args);
    } as typeof original;
  });
  await ready(page);
  await expect(page.locator("html")).toHaveAttribute("data-webgl-attempted", "true");
  await expect(page.locator(".hero-art")).toHaveAttribute("data-renderer", "static");
  await expect(page.locator(".hero-static")).toHaveCSS("opacity", "1");
  await page.getByRole("link", { name: "Explore components" }).click();
  await expect(page.locator("#components-title")).toBeInViewport();
  expect(errors).toEqual([]);
  await context.close();

  const supported = await browser.newContext({ reducedMotion: "no-preference" });
  const live = await supported.newPage();
  await ready(live);
  await expect(live.locator(".hero-art")).toHaveAttribute("data-renderer", "webgl");
  await live.locator(".hero-art canvas").evaluate((element) => {
    const gl = (element as HTMLCanvasElement).getContext("webgl2")!;
    gl.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(live.locator(".hero-art")).toHaveAttribute("data-renderer", "static");
  await expect(live.locator(".hero-art canvas")).toHaveAttribute("data-running", "false");
  await expect(live.locator(".hero-static")).toHaveCSS("opacity", "1");
  await supported.close();
});

test("static content and component links are usable before JavaScript loads", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator(".hero-heading")).toHaveCSS("opacity", "1");
  await expect(page.locator(".hero-static")).toBeVisible();
  await page.getByRole("link", { name: "Explore components" }).click();
  await expect(page.locator("#components-title")).toBeInViewport();
  await expect(page.locator(".stat-card-grid .stat-card")).toHaveCount(5);
  await context.close();
});

test("touch composition keeps the console controls usable and disables pointer motion", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 360, height: 800 }, isMobile: true, hasTouch: true, reducedMotion: "no-preference" });
  const page = await context.newPage();
  await ready(page);
  await expect(page.locator(".hero-art")).toHaveAttribute("data-renderer", "webgl");
  await expect(page.locator(".hero-art")).toHaveAttribute("data-interaction", "touch");
  await page.locator(".motion-toggle").tap();
  await expect(page.locator(".hero-static")).toHaveCSS("opacity", "0");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({ path: "out/hero-webgl-mobile.png" });
  await page.getByRole("button", { name: "Play console demo" }).tap();
  const dimensions = await page.locator(".console-button").evaluateAll((buttons) => buttons.map((button) => {
    const bounds = button.getBoundingClientRect();
    const shell = button.closest(".handheld")!.getBoundingClientRect();
    return { width: bounds.width, height: bounds.height, contained: bounds.left >= shell.left && bounds.right <= shell.right };
  }));
  for (const dimension of dimensions) {
    expect(dimension.width).toBeGreaterThanOrEqual(44);
    expect(dimension.height).toBeGreaterThanOrEqual(44);
    expect(dimension.contained).toBe(true);
  }
  await page.getByRole("button", { name: "Console right" }).tap();
  await expect(page.locator(".console-board")).toHaveAttribute("data-player", "3,1");
  const result = await new AxeBuilder({ page }).include(".coming-soon").analyze();
  expect(result.violations).toEqual([]);
  await page.locator(".handheld").screenshot({ path: "out/console-playing-mobile.png" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360);
  await context.close();
});
