import { expect, test, type Page } from "@playwright/test";
import { components } from "../lib/components";

function desktopNavigation(page: Page) {
  return page.getByRole("complementary", { name: "Documentation sidebar", exact: true })
    .getByRole("navigation", { name: "Component navigation", exact: true });
}

async function openSearch(page: Page) {
  await page.keyboard.press("Control+k");
  const dialog = page.getByRole("dialog", { name: "Search docs", exact: true });
  await expect(dialog).toBeVisible();
  const input = dialog.getByRole("combobox", { name: "Search the library", exact: true });
  await expect(input).toBeFocused();
  return { dialog, input };
}

async function expectDestination(page: Page, path: string, appearance?: string, hash?: string) {
  await expect.poll(() => {
    const url = new URL(page.url());
    return { path: url.pathname, appearance: url.searchParams.get("style"), hash: url.hash };
  }).toEqual({ path, appearance: appearance ?? null, hash: hash ?? "" });
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("orangeui-appearance", "polished");
    localStorage.setItem("orangeui-sidebar", "expanded");
  });
});

test("setup leads the four offerings and ordinary primitives start collapsed", async ({ page }) => {
  await page.goto("/docs?style=polished");
  const navigation = desktopNavigation(page);
  await expect(navigation).toBeVisible();
  const offerings = navigation.getByRole("group", { name: "Main offerings", exact: true });
  await expect(offerings.getByRole("link")).toHaveText(["Stickers", "Morphing icons", "Components", "Blocks"]);
  const destinations = await navigation.locator(":scope > a, .docs-nav-offerings a").evaluateAll(links => links
    .map(link => new URL((link as HTMLAnchorElement).href).pathname));
  expect(destinations.slice(0, 5)).toEqual([
    "/docs", "/stickers", "/components/morphing-icons", "/components", "/blocks",
  ]);
  const order = await navigation.evaluate(element => [...element.children].map(child => child.textContent));
  expect(order[1]).toContain("Setup guide");
  await expect(navigation.getByRole("button", { name: /^Essentials/ })).toHaveAttribute("aria-expanded", "false");
  await expect(navigation.getByRole("link", { name: "Button", exact: true, includeHidden: true })).toBeHidden();
});

test("Essentials can be expanded and collapsed with the keyboard", async ({ page }) => {
  await page.goto("/docs?style=polished");
  const navigation = desktopNavigation(page);
  const essentials = navigation.getByRole("button", { name: /^Essentials/ });
  await essentials.focus();
  await essentials.press("Enter");
  await expect(essentials).toHaveAttribute("aria-expanded", "true");
  await expect(navigation.getByRole("link", { name: "Button", exact: true })).toBeVisible();
  await expect(navigation.getByRole("link", { name: "Input", exact: true })).toBeVisible();
  await essentials.press("Space");
  await expect(essentials).toHaveAttribute("aria-expanded", "false");
  await expect(essentials).toBeFocused();
  await expect(navigation.getByRole("link", { name: "Button", exact: true, includeHidden: true })).toBeHidden();
});

test("sidebar hover shows one live preview and links remain direct", async ({ page }) => {
  await page.goto("/docs?style=polished");
  const navigation = desktopNavigation(page);
  await navigation.getByRole("link", { name: "Morphing icons", exact: true }).hover();
  const preview = page.locator(".docs-link-preview");
  await expect(preview).toHaveCount(1);
  await expect(preview.locator("[data-morph-icon]").first()).toBeVisible();
  await navigation.getByRole("button", { name: /^Essentials/ }).click();
  const input = navigation.getByRole("link", { name: "Input", exact: true });
  await input.hover();
  await expect(preview).toHaveCount(1);
  await expect(preview.locator(".docs-preview-caption strong")).toHaveText("Input");
  await input.click();
  await expectDestination(page, "/components/input", "polished");
  await expect(preview).toHaveCount(0);
});

test("morph inspector uses the full panel width for editing", async ({ page }) => {
  await page.goto("/components/morphing-icons?style=polished");
  const controls = page.locator(".morph-icon-controls");
  await expect(controls).toBeVisible();
  const bounds = await controls.evaluate(element => ({ width: element.clientWidth, content: element.scrollWidth }));
  expect(bounds.width).toBeGreaterThan(260);
  expect(bounds.content).toBeLessThanOrEqual(bounds.width + 1);
  for (const label of ["Icon size", "Stroke", "Duration"]) {
    const range = controls.getByRole("slider", { name: label, exact: true });
    expect((await range.boundingBox())?.width).toBeGreaterThan(200);
  }
  await controls.getByRole("button", { name: "Close", exact: true }).click();
  await expect(controls.locator(".morph-state-picker button").last()).toHaveAttribute("aria-pressed", "true");
});

for (const destination of [
  { path: "/components/button", group: /^Essentials/ },
  { path: "/components/film-strip", group: /^Galleries & keepsakes/ },
]) {
  test(`direct navigation opens the active ancestry for ${destination.path}`, async ({ page }) => {
    await page.goto(`${destination.path}?style=polished`);
    const navigation = desktopNavigation(page);
    await expect(navigation.getByRole("button", { name: destination.group })).toHaveAttribute("aria-expanded", "true");
    const current = navigation.locator(`a[href^="${destination.path}?"]`);
    await expect(current).toBeVisible();
    await expect(current).toHaveAttribute("aria-current", "page");
  });
}

test("every catalog component has one destination across the documentation groups", async ({ page }) => {
  await page.goto("/docs?style=polished");
  const navigation = desktopNavigation(page);
  await expect(navigation).toBeVisible();
  // The public catalog is the independent inventory. Stickers have a dedicated collection route.
  const expected = [...new Set(components.map(component => component.slug === "sticker-pack"
    ? "/stickers" : `/components/${component.slug}`))].sort();
  const actual = await navigation.locator("a[href]").evaluateAll(links => links
    .map(link => new URL((link as HTMLAnchorElement).href).pathname)
    .filter(path => path === "/stickers" || path.startsWith("/components/")));
  expect(actual.sort()).toEqual(expected);
  expect(new Set(actual).size).toBe(actual.length);
});

for (const destination of [
  { query: "Button", option: /^Button\b/, path: "/components/button", appearance: "polished" },
  { query: "Stickers", option: /^Stickers\b/, path: "/stickers" },
  { query: "Morphing icons", option: /^Morphing icons\b/, path: "/components/morphing-icons", appearance: "polished" },
]) {
  test(`Ctrl+K finds and opens ${destination.query}`, async ({ page }) => {
    await page.goto("/docs?style=polished");
    const { dialog, input } = await openSearch(page);
    await input.fill(destination.query);
    await expect(dialog.getByRole("option", { name: destination.option })).toHaveAttribute("aria-selected", "true");
    await input.press("Enter");
    await expectDestination(page, destination.path, destination.appearance);
    await expect(dialog).toBeHidden();
    await expect(page.locator("#library-main")).toBeVisible();
  });
}

test("command search recovers from no results without reopening the dialog", async ({ page }) => {
  await page.goto("/docs?style=polished");
  const { dialog, input } = await openSearch(page);
  await input.fill("zzznothing-3476");
  await expect(dialog.getByRole("option")).toHaveCount(0);
  await expect(dialog.getByText("No results found.", { exact: true })).toBeVisible();
  await input.fill("Button");
  await expect(dialog.getByRole("option", { name: /^Button\b/ })).toBeVisible();
  await input.press("Enter");
  await expectDestination(page, "/components/button", "polished");
  await expect(dialog).toBeHidden();
});

test("setup links retain appearance and native anchors retain the complete docs URL", async ({ page }) => {
  await page.goto("/components/button?style=neobrutalism");
  await expect(page.getByRole("combobox", { name: "Component appearance", exact: true })).toHaveValue("neobrutalism");
  let navigation = desktopNavigation(page);
  await navigation.getByRole("button", { name: /^Setup guide/ }).click();
  const installation = navigation.getByRole("link", { name: "Installation", exact: true });
  await expect(installation).toHaveAttribute("href", "/docs?style=neobrutalism#installation");
  await installation.click();
  await expectDestination(page, "/docs", "neobrutalism", "#installation");
  await expect(page.locator("#installation")).toBeVisible();
  navigation = desktopNavigation(page);
  const theming = navigation.getByRole("link", { name: "Theming", exact: true });
  await expect(theming).toHaveAttribute("href", "#theming");
  const onThisPage = page.getByRole("navigation", { name: "On this page", exact: true });
  await expect(onThisPage.getByRole("link")).toHaveCount(6);
  for (const id of ["installation", "source-structure", "appearances", "theming", "accessibility", "license"]) {
    await expect(onThisPage.locator(`a[href="#${id}"]`)).toHaveCount(1);
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
  await onThisPage.getByRole("link", { name: "Theming", exact: true }).click();
  await expectDestination(page, "/docs", "neobrutalism", "#theming");
  await expect(page.locator("#theming")).toBeVisible();
  await expect(theming).toHaveAttribute("aria-current", "location");
});

test("command search retains appearance when navigating to a setup anchor", async ({ page }) => {
  await page.goto("/components/button?style=terminal");
  await expect(page.getByRole("combobox", { name: "Component appearance", exact: true })).toHaveValue("terminal");
  const { dialog, input } = await openSearch(page);
  await input.fill("Installation");
  await dialog.getByRole("option", { name: /^Installation\b/ }).click();
  await expectDestination(page, "/docs", "terminal", "#installation");
  await expect(page.locator("#installation")).toBeVisible();
});

test("mobile navigation closes on route selection and restores focus after keyboard dismissal", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs?style=polished");
  const trigger = page.getByRole("button", { name: "Open documentation navigation", exact: true });
  await trigger.click();
  const sheet = page.getByRole("dialog", { name: "oRangeUi navigation", exact: true });
  await expect(sheet).toBeVisible();
  const navigation = sheet.getByRole("navigation", { name: "Component navigation", exact: true });
  const essentials = navigation.getByRole("button", { name: /^Essentials/ });
  await essentials.focus();
  await essentials.press("Enter");
  await expect(sheet).toBeVisible();
  await navigation.getByRole("link", { name: "Button", exact: true }).click();
  await expectDestination(page, "/components/button", "polished");
  await expect(sheet).toBeHidden();
  await expect(page.getByTestId("live-demo")).toBeVisible();
  // The component route mounts a new shell. Test focus return within that mounted shell.
  await expect(trigger).toBeVisible();
  await trigger.focus();
  await trigger.press("Enter");
  await expect(sheet).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
  await expect(trigger).toBeFocused();
});

for (const width of [320, 390, 1440]) for (const theme of ["light", "dark"] as const) {
  test(`docs navigation fits ${width}px in the ${theme} palette`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(palette => localStorage.setItem("orangeui-palette", palette), theme);
    for (const route of ["/docs?style=polished", "/components/button?style=polished", "/stickers", "/blocks"]) {
      await page.goto(route);
      await expect(page.locator("#library-main")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      const size = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        page: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
      }));
      expect(size.page, `${route} must not overflow at ${width}px in ${theme}`).toBeLessThanOrEqual(size.viewport + 1);
      if (width < 768) {
        await page.getByRole("button", { name: "Open documentation navigation", exact: true }).click();
        const sheet = page.getByRole("dialog", { name: "oRangeUi navigation", exact: true });
        await expect(sheet).toBeVisible();
        const bounds = await sheet.evaluate(element => {
          const rect = element.getBoundingClientRect();
          return { left: rect.left, right: rect.right, width: element.clientWidth, content: element.scrollWidth };
        });
        expect(bounds.left).toBeGreaterThanOrEqual(-1);
        expect(bounds.right).toBeLessThanOrEqual(width + 1);
        expect(bounds.content).toBeLessThanOrEqual(bounds.width + 1);
        await page.keyboard.press("Escape");
        await expect(sheet).toBeHidden();
      }
    }
  });
}

for (const route of [
  "/stickers",
  "/components/morphing-icons?style=polished",
  "/components/liquid-metal?style=polished",
  "/components/film-strip?style=polished",
  "/components/mini-driver?style=polished",
  "/blocks",
  "/blocks/category/auth",
]) {
  test(`documentation shell smoke: ${route}`, async ({ page }) => {
    const runtimeErrors: string[] = [];
    page.on("pageerror", error => runtimeErrors.push(error.message));
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(desktopNavigation(page)).toBeVisible();
    const main = page.locator("#library-main");
    await expect(main).toBeVisible();
    const heading = route.startsWith("/blocks/category/")
      ? main.locator(".bc-collection-heading > h1")
      : main.getByRole("heading", { level: 1 });
    await expect(heading).toHaveCount(1);
    if (route.startsWith("/components/")) await expect(page.getByTestId("live-demo")).toBeVisible();
    else await expect(heading).toBeVisible();
    if (route.startsWith("/blocks")) {
      await expect(desktopNavigation(page).getByRole("region", { name: "Block categories", exact: true })).toBeVisible();
      await expect(desktopNavigation(page).getByRole("button", { name: /^Essentials/ })).toHaveAttribute("aria-expanded", "false");
    }
    expect(runtimeErrors).toEqual([]);
  });
}
