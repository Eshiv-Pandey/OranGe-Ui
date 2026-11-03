import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { components, componentsInCollection, type ComponentDefinition } from "../lib/components";
import { APPEARANCE_VALUES, type Appearance } from "../components/ui/appearance";
import { editColor } from "./browser-artwork-helpers";

const evidence = "out/iteration/launch";
const viewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];
const newSlugs = [
  "label", "kbd", "form", "combobox", "calendar", "date-picker", "input-otp", "file-upload", "rating", "stepper",
  "navigation-menu", "navbar", "sidebar", "context-menu", "hover-card", "scroll-area", "carousel", "code-block",
  "chat-message", "prompt-input", "tool-call-card", "agent-status", "thinking-indicator", "model-picker", "markdown", "emberling",
] as const;
const newComponents = components.filter(({ slug }) => newSlugs.includes(slug as typeof newSlugs[number]));
const chunks = <T,>(items: readonly T[], size = 5) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
const normalizeLines = (value: string) => value.replace(/\r\n/g, "\n");

test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

async function open(page: Page, slug: string, appearance: Appearance = "polished") {
  await page.goto(`/components/${slug}?style=${appearance}`);
  await expect(page.getByTestId("live-demo")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page.getByTestId("live-demo");
}

async function geometryOf(primary: Locator) {
  return primary.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const header = document.querySelector(".library-header")?.getBoundingClientRect();
    const clippedBy: string[] = [];
    for (let ancestor = element.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const style = getComputedStyle(ancestor), bounds = ancestor.getBoundingClientRect();
      if (/(hidden|clip|auto|scroll)/.test(style.overflowY) && (rect.top < bounds.top - 1 || rect.bottom > bounds.bottom + 1)) clippedBy.push(`${ancestor.tagName}.${ancestor.className}:vertical`);
      if (/(hidden|clip|auto|scroll)/.test(style.overflowX) && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) clippedBy.push(`${ancestor.tagName}.${ancestor.className}:horizontal`);
    }
    return {
      x: rect.x, y: rect.y, width: rect.width, height: rect.height,
      fullyVisible: rect.width > 0 && rect.height > 0 && rect.top >= (header?.bottom ?? 0) - 1 && rect.bottom <= innerHeight + 1 && rect.left >= -1 && rect.right <= innerWidth + 1,
      clippedBy,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      initialScroll: scrollY,
    };
  });
}

async function audit(page: Page, selector?: string) {
  const builder = new AxeBuilder({ page });
  if (selector) builder.include(selector);
  return (await builder.analyze()).violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }));
}

async function metadata(page: Page, pathname: string, name?: string) {
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S.{20}/);
  const canonical = page.locator('link[rel="canonical"]');
  await expect(canonical).toHaveAttribute("href", /^https?:\/\//);
  expect(new URL((await canonical.getAttribute("href"))!).pathname).toBe(pathname);
  await expect(page.locator('meta[property="og:image"]').first()).toHaveAttribute("content", /^https?:\/\//);
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /\S.{20}/);
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute("content", "summary_large_image");
  if (name) {
    expect(await page.title()).toContain(name);
    expect(await page.locator('meta[property="og:title"]').getAttribute("content")).toContain(name);
  }
}

async function copyAvailability(page: Page, component: ComponentDefinition, appearance: Appearance) {
  const playground = page.getByRole("region", { name: `${component.name} playground`, exact: true });
  const actions = playground.locator(".detail-actions");
  const tabs = playground.getByRole("tablist", { name: "Example view", exact: true });
  await expect(actions.getByRole("button", { name: "Copy prompt", exact: true })).toBeEnabled();
  await expect(actions.getByRole("button", { name: "Copy code", exact: true })).toBeEnabled();
  await expect(page.getByRole("button", { name: "Copy install command", exact: true })).toBeEnabled();
  await expect(page.locator(".install-command code")).toHaveText(`npx shadcn@latest add "${new URL(page.url()).origin}/r/${component.slug}.json?style=${appearance}"`);
  await expect(page.getByRole("link", { name: "Download source", exact: true })).toHaveAttribute("href", `/api/components/${component.slug}?style=${appearance}`);
  for (const label of ["Usage", "Source"] as const) {
    await tabs.getByRole("tab", { name: label, exact: true }).click();
    await expect(playground.locator("pre code")).not.toBeEmpty();
    await expect(actions.getByRole("button", { name: "Copy code", exact: true })).toBeEnabled();
  }
}

async function previewOverlay(page: Page, demo: Locator, slug: string, appearance: Appearance, checkAccessibility: boolean) {
  if (slug !== "context-menu" && slug !== "hover-card") return;
  const isMenu = slug === "context-menu";
  const trigger = isMenu ? demo.getByRole("button", { name: /^Studio notes/ }) : demo.getByRole("link", { name: "Jamie Reed", exact: true });
  await trigger.focus();
  if (isMenu) await trigger.press("Shift+F10");
  const selector = isMenu ? ".ui-context-menu" : ".ui-hover-card";
  const overlay = page.locator(selector);
  await expect(overlay).toBeVisible();
  await expect(overlay).toHaveAttribute("data-appearance", appearance);
  if (!isMenu) await expect(trigger).toHaveAccessibleDescription(/Design systems engineer/);
  const geometry = await geometryOf(overlay);
  expect.soft(geometry.fullyVisible, `${slug}: opened overlay ${JSON.stringify(geometry)}`).toBe(true);
  expect.soft(geometry.clippedBy, `${slug}: opened overlay clipping ancestors`).toEqual([]);
  expect.soft(geometry.horizontalOverflow, `${slug}: opened overlay horizontal overflow`).toBe(false);
  const violations = checkAccessibility ? await audit(page, selector) : [];
  expect.soft(violations, `${slug}: opened overlay accessibility`).toEqual([]);
  return {
    geometry, violations,
    close: async () => {
      if (isMenu) await page.keyboard.press("Escape");
      else await trigger.press("Tab");
      await expect(overlay).toBeHidden();
      if (isMenu) await expect(trigger).toBeFocused();
      await page.evaluate(() => scrollTo(0, 0));
    },
  };
}

async function otpGeometry(demo: Locator) {
  const geometry = await demo.locator(".ui-otp-entry").evaluate((entry) => {
    const box = (element: Element) => { const rect = element.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; };
    return { entry: box(entry), cells: [...entry.querySelectorAll(".ui-otp-cell")].map(box) };
  });
  expect.soft(geometry.cells, "The six-digit example renders six cells").toHaveLength(6);
  for (const [index, cell] of geometry.cells.entries()) {
    expect.soft(cell.width, `OTP cell ${index + 1} has readable width`).toBeGreaterThanOrEqual(30);
    expect.soft(cell.height, `OTP cell ${index + 1} has visible height`).toBeGreaterThan(0);
    expect.soft(cell.x, `OTP cell ${index + 1} stays inside its entry`).toBeGreaterThanOrEqual(geometry.entry.x - 1);
    expect.soft(cell.x + cell.width, `OTP cell ${index + 1} stays inside its entry`).toBeLessThanOrEqual(geometry.entry.x + geometry.entry.width + 1);
    expect.soft(cell.y, `OTP cell ${index + 1} stays inside its entry`).toBeGreaterThanOrEqual(geometry.entry.y - 1);
    expect.soft(cell.y + cell.height, `OTP cell ${index + 1} stays inside its entry`).toBeLessThanOrEqual(geometry.entry.y + geometry.entry.height + 1);
    if (index) expect.soft(cell.x, `OTP cell ${index + 1} does not overlap its predecessor`).toBeGreaterThanOrEqual(geometry.cells[index - 1].x + geometry.cells[index - 1].width - 1);
  }
  const first = geometry.cells[0], last = geometry.cells.at(-1);
  expect.soft(first && Math.abs(first.x - geometry.entry.x), "OTP cells start at the entry's left edge").toBeLessThanOrEqual(1);
  expect.soft(last && Math.abs(last.x + last.width - geometry.entry.x - geometry.entry.width), "OTP cells span the complete entry").toBeLessThanOrEqual(1);
  return geometry;
}

async function captureGroup(page: Page, info: TestInfo, group: readonly ComponentDefinition[], viewport: typeof viewports[number], appearance: Appearance, theme: "light" | "dark", fullInventory: boolean) {
  await page.setViewportSize(viewport);
  await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
  const folder = `${evidence}/viewports/${viewport.width}x${viewport.height}/${appearance}-${theme}`;
  await mkdir(folder, { recursive: true });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const observations: object[] = [];
  try {
    for (const component of group) {
      const demo = await open(page, component.slug, appearance);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      const hasPortalPreview = component.slug === "context-menu" || component.slug === "hover-card";
      if (!hasPortalPreview) await expect(demo.locator("[data-appearance]").first()).toHaveAttribute("data-appearance", appearance);
      await page.evaluate(() => scrollTo(0, 0));
      const primary = demo.locator("[data-main-preview]");
      await expect(primary, `${component.slug} has one complete primary preview`).toHaveCount(1);
      const geometry = await geometryOf(primary);
      expect.soft(geometry.initialScroll, `${component.slug}: initial scroll`).toBe(0);
      expect.soft(geometry.fullyVisible, `${component.slug}: ${JSON.stringify(geometry)}`).toBe(true);
      expect.soft(geometry.clippedBy, `${component.slug}: clipping ancestors`).toEqual([]);
      expect.soft(geometry.horizontalOverflow, `${component.slug}: horizontal overflow`).toBe(false);
      const cells = component.slug === "input-otp" ? await otpGeometry(demo) : undefined;
      const checkAccessibility = viewport.width === 1366 && newComponents.some(({ slug }) => slug === component.slug);
      const violations = checkAccessibility ? await audit(page, '[data-testid="live-demo"]') : [];
      expect.soft(violations, `${component.slug}: accessibility`).toEqual([]);
      const overlay = await previewOverlay(page, demo, component.slug, appearance, checkAccessibility);
      const screenshot = `${folder}/${component.slug}.png`;
      await page.screenshot({ path: screenshot, animations: "disabled" });
      await info.attach(`${component.slug} ${appearance} ${theme}`, { path: screenshot, contentType: "image/png" });
      observations.push({ slug: component.slug, ...geometry, violations, cells, overlay: overlay && { geometry: overlay.geometry, violations: overlay.violations }, screenshot });
      if (overlay) await overlay.close();
      if (fullInventory && viewport.width === 1366) {
        await metadata(page, `/components/${component.slug}`, component.name);
        await copyAvailability(page, component, appearance);
      }
    }
    expect(errors).toEqual([]);
  } finally {
    await writeFile(`${folder}/report-${group[0].slug}.json`, JSON.stringify({ buildId: (await readFile(".next/BUILD_ID", "utf8")).trim(), viewport, appearance, theme, errors, observations }, null, 2));
  }
}

test("launch inventory contains 70 unique components and the 26 new routes", () => {
  expect(components).toHaveLength(70);
  expect(new Set(components.map(({ slug }) => slug)).size).toBe(70);
  expect(newComponents.map(({ slug }) => slug).sort()).toEqual([...newSlugs].sort());
});

// Four complete size inventories, plus the remaining appearance/theme pairs
// only for launch additions. Each group is bounded to five routes.
for (const viewport of viewports) for (const group of chunks(components)) {
  test(`launch inventory ${viewport.width}x${viewport.height} ${group.map(({ slug }) => slug).join(",")}`, async ({ page }, info) => {
    await captureGroup(page, info, group, viewport, "polished", "light", true);
  });
}
for (const appearance of APPEARANCE_VALUES) for (const theme of ["light", "dark"] as const) {
  if (appearance === "polished" && theme === "light") continue;
  for (const group of chunks(newComponents)) test(`launch styles 1366x768 ${appearance} ${theme} ${group[0].slug}`, async ({ page }, info) => {
    await captureGroup(page, info, group, viewports[0], appearance, theme, false);
  });
}
for (const group of chunks(newComponents)) test(`launch mobile dark 390x844 ${group[0].slug}`, async ({ page }, info) => {
  await captureGroup(page, info, group, viewports[3], "polished", "dark", false);
});

for (const appearance of APPEARANCE_VALUES) for (const theme of ["light", "dark"] as const) test(`launch GamerBoy mobile 390x844 ${appearance} ${theme}`, async ({ page }, info) => {
  const gamer = components.find(({ slug }) => slug === "gamer-boy")!;
  await captureGroup(page, info, [gamer], viewports[3], appearance, theme, false);
});

for (const viewport of viewports) for (const route of ["/", "/components", "/docs"] as const) test(`launch public ${route} ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
  await page.setViewportSize(viewport);
  await page.addInitScript(() => localStorage.setItem("orangeui-palette", "light"));
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const response = await page.goto(route);
  expect(response?.status()).toBe(200);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.getByRole("heading", { level: 1 })).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  if (route === "/components") {
    await expect(page.locator(".component-tile")).toHaveCount(componentsInCollection("polished").length);
    await expect(page.locator(".creative-thumbnail")).toHaveCount(componentsInCollection("polished").filter((component) => component.collection).length);
    const tiles = await page.locator(".component-thumbnail .thumbnail-inner").evaluateAll((items) => items.map((item) => {
      const frame = item.parentElement!.getBoundingClientRect(), rect = item.getBoundingClientRect();
      return { name: item.closest(".component-tile")?.querySelector("h2")?.textContent, visible: rect.width > 0 && rect.height > 0, fits: rect.left >= frame.left - 1 && rect.right <= frame.right + 1 && rect.top >= frame.top - 1 && rect.bottom <= frame.bottom + 1, width: rect.width, height: rect.height, frameWidth: frame.width, frameHeight: frame.height };
    }));
    expect(tiles.filter(({ visible, fits }) => !visible || !fits)).toEqual([]);
  }
  if (viewport.width === 1366) {
    await metadata(page, route);
    expect(await audit(page)).toEqual([]);
  }
  const screenshot = `${evidence}/public-${route === "/" ? "home" : route.slice(1)}-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({ path: screenshot, animations: "disabled" });
  await info.attach(`${route} first viewport`, { path: screenshot, contentType: "image/png" });
  if (route === "/components" && (viewport.width === 1366 || viewport.width === 390)) {
    const folder = `${evidence}/catalogue-tiles/${viewport.width}x${viewport.height}`;
    await mkdir(folder, { recursive: true });
    for (const slug of ["command", "table", "mascot-avatar", "calendar", "carousel", "avatar-editor", "tilt-stamp-3d"]) {
      const tileScreenshot = `${folder}/${slug}.png`;
      await page.locator(`.component-tile.tile-${slug}`).screenshot({ path: tileScreenshot, animations: "disabled" });
      await info.attach(`${slug} catalogue tile ${viewport.width}`, { path: tileScreenshot, contentType: "image/png" });
    }
  }
  expect(errors).toEqual([]);
});

for (const [index, slug] of ["form", "date-picker", "navbar", "code-block", "prompt-input", "markdown", "emberling"].entries()) test(`launch clipboard ${slug} prompt usage source and install are exact`, async ({ page, context }) => {
  const appearance = APPEARANCE_VALUES[index % APPEARANCE_VALUES.length];
  const component = components.find((entry) => entry.slug === slug)!;
  await open(page, slug, appearance);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
  const playground = page.getByRole("region", { name: `${component.name} playground`, exact: true });
  const actions = playground.locator(".detail-actions");
  const tabs = playground.getByRole("tablist", { name: "Example view", exact: true });
  const clipboard = async () => normalizeLines(await page.evaluate(() => navigator.clipboard.readText()));
  await actions.getByRole("button", { name: "Copy prompt", exact: true }).click();
  await expect(playground.locator(".detail-caption").getByRole("status")).toHaveText("Prompt copied to clipboard.");
  const prompt = await clipboard();
  expect(prompt).toContain(component.name);
  expect(prompt).toContain(component.description);
  expect(prompt).toContain(component.keyboard);
  expect(prompt).toContain(`appearance="${appearance}"`);
  expect(prompt).toContain(`${new URL(page.url()).origin}/components/${slug}?style=${appearance}`);
  await tabs.getByRole("tab", { name: "Preview", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(tabs.getByRole("tab", { name: "Usage", exact: true })).toBeFocused();
  const usage = normalizeLines((await playground.locator("pre code").textContent())!);
  expect(prompt).toContain(usage);
  await actions.getByRole("button", { name: "Copy code", exact: true }).click();
  expect(await clipboard()).toBe(usage);
  await tabs.getByRole("tab", { name: "Usage", exact: true }).press("End");
  await expect(tabs.getByRole("tab", { name: "Source", exact: true })).toBeFocused();
  const source = normalizeLines((await playground.locator("pre code").textContent())!);
  expect(source).toBe(normalizeLines(await readFile(component.file, "utf8")));
  await actions.getByRole("button", { name: "Copy code", exact: true }).click();
  expect(await clipboard()).toBe(source);
  const install = (await page.locator(".install-command code").textContent())!;
  await page.getByRole("button", { name: "Copy install command", exact: true }).click();
  expect(await clipboard()).toBe(install);
  expect(prompt).toContain(install);
});

test("launch clipboard failure exposes selectable text for all three copy actions", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Clipboard unavailable for fallback test"); } } }));
  await open(page, "form");
  const fallback = page.getByRole("textbox", { name: "Text to copy", exact: true });
  for (const action of ["Copy prompt", "Copy code", "Copy install command"]) {
    await page.getByRole("button", { name: action, exact: true }).click();
    await expect(fallback).toBeVisible();
    await expect(fallback).not.toHaveValue("");
    await fallback.focus();
    expect(await fallback.evaluate((element) => { const area = element as HTMLTextAreaElement; return area.selectionEnd - area.selectionStart === area.value.length; })).toBe(true);
  }
});

for (const viewport of [viewports[0], viewports[3]]) test(`launch global theme accent copy and command navigation ${viewport.width}`, async ({ page, context }, info) => {
  await page.setViewportSize(viewport);
  await open(page, "button", "pixel");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
  const trigger = page.getByRole("button", { name: "Customize theme", exact: true });
  await trigger.press("Enter");
  const panel = page.getByRole("dialog", { name: "Make it yours", exact: true });
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("data-appearance", "pixel");
  await panel.getByRole("button", { name: "Violet accent", exact: true }).click();
  await expect(panel.getByRole("button", { name: "Violet accent", exact: true })).toHaveAttribute("aria-pressed", "true");
  const color = panel.locator('input[type="color"]');
  await editColor(color, "#777777");
  await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim())).toBe("#777777");
  await panel.getByRole("button", { name: "Copy theme", exact: true }).click();
  await expect(panel.getByRole("status")).toHaveText("Theme CSS copied.");
  const css = normalizeLines(await page.evaluate(() => navigator.clipboard.readText()));
  expect(css).toContain('appearance="pixel"');
  expect(css).toContain('[data-theme="light"]');
  expect(css).toContain('[data-theme="dark"]');
  expect(css).toContain(':root[data-theme="light"]');
  expect(css).toContain(':root[data-theme="dark"]');
  expect(css).toMatch(/@media\s*\(prefers-color-scheme:\s*dark\)/);
  expect(css).toMatch(/:root:not\(\[data-theme="light"\]\)\s*\{[^}]*--primary:\s*#777777;/);
  expect(css.match(/--primary: #777777;/g)).toHaveLength(3);
  const screenshot = `${evidence}/theme-${viewport.width}.png`;
  await page.screenshot({ path: screenshot, animations: "disabled" });
  await info.attach("Custom accent theme controls", { path: screenshot, contentType: "image/png" });
  await page.keyboard.press("Escape");
  await expect(trigger).toBeFocused();
  const theme = page.getByRole("button", { name: "Dark mode", exact: true });
  for (const palette of ["dark", "light"] as const) {
    if (await theme.getAttribute("aria-pressed") !== String(palette === "dark")) await theme.click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", palette);
    await expect(theme).toHaveAttribute("aria-pressed", String(palette === "dark"));
    expect(await page.evaluate(() => localStorage.getItem("orangeui-accent"))).toBe("#777777");
    expect(await audit(page)).toEqual([]);
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", palette);
    await expect.poll(() => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--primary").trim())).toBe("#777777");
  }
  const searchTrigger = page.getByRole("button", { name: "Search docs Ctrl K", exact: true });
  await searchTrigger.focus();
  for (const shortcut of ["Control+k", "Meta+k"] as const) {
    await page.keyboard.press(shortcut);
    const searchDialog = page.getByRole("dialog", { name: "Search docs", exact: true });
    await expect(searchDialog).toBeVisible();
    const search = searchDialog.getByRole("combobox", { name: "Search all components", exact: true });
    await expect(search).toBeFocused();
    await search.fill("no-such-launch-component");
    await expect(searchDialog.getByText("No results found.", { exact: true })).toBeVisible();
    await search.fill("calendar");
    await search.press("Home");
    const activeId = await search.getAttribute("aria-activedescendant");
    await expect(searchDialog.locator(`[id="${activeId}"]`)).toHaveAttribute("aria-selected", "true");
    await expect(searchDialog.locator(`[id="${activeId}"]`)).toContainText("Calendar");
    expect(await audit(page)).toEqual([]);
    await search.press("Enter");
    await expect(searchDialog).not.toBeVisible();
    await expect(page).toHaveURL(/\/components\/calendar\?style=pixel$/);
  }
  if (viewport.width === 390) {
    await page.getByRole("button", { name: "Open component navigation menu", exact: true }).click();
    const navigation = page.getByRole("dialog", { name: "Find your building block", exact: true });
    await navigation.getByRole("searchbox", { name: "Search navigation", exact: true }).fill("markdown");
    await navigation.getByRole("link", { name: "Markdown", exact: true }).click();
    await expect(navigation).not.toBeVisible();
    await expect(page).toHaveURL(/\/components\/markdown\?style=pixel$/);
  }
});

test("launch theme copy failure keeps both palette definitions selectable", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Clipboard unavailable for fallback test"); } } }));
  await open(page, "button", "terminal");
  await page.getByRole("button", { name: "Customize theme", exact: true }).click();
  const panel = page.getByRole("dialog", { name: "Make it yours", exact: true });
  await panel.getByRole("button", { name: "Copy theme", exact: true }).click();
  const text = panel.getByRole("textbox", { name: "Theme CSS", exact: true });
  await expect(text).toBeVisible();
  expect(await text.inputValue()).toContain('[data-theme="dark"]');
  await text.focus();
  expect(await text.evaluate((element) => { const area = element as HTMLTextAreaElement; return area.selectionEnd - area.selectionStart === area.value.length; })).toBe(true);
});

test("launch Emberling follows the pointer and pauses when hidden", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await open(page, "emberling");
  const character = page.locator('.emberling-figures .emberling').first();
  await expect(character).toHaveAttribute("data-motion", "running");
  const face = character.locator('.emberling-face');
  const bounds = (await character.boundingBox())!;
  await page.mouse.move(bounds.x - 40, bounds.y + bounds.height / 2);
  await expect.poll(async () => face.getAttribute("transform")).toMatch(/translate\(-[1-7]/);
  await page.mouse.move(bounds.x + bounds.width + 40, bounds.y + bounds.height / 2);
  await expect.poll(async () => face.getAttribute("transform")).toMatch(/translate\([1-7]/);
  await page.getByRole("checkbox", { name: "Follow pointer", exact: true }).uncheck();
  await expect.poll(async () => face.getAttribute("transform")).toBe("translate(0.00 0.00)");
  await character.evaluate((element) => { element.style.visibility = 'hidden'; element.style.position = 'fixed'; element.style.top = '-1000px'; });
  await expect(character).toHaveAttribute("data-motion", "paused");
});

test("launch Emberling reduced motion keeps the artwork and editable colors", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, "emberling");
  const characters = page.locator('.emberling-figures .emberling');
  await expect(characters).toHaveCount(3);
  await expect(characters.first()).toHaveAttribute("data-motion", "reduced");
  const face = characters.first().locator('.emberling-face');
  const before = await face.getAttribute("transform");
  await page.mouse.move(600, 200);
  expect(await face.getAttribute("transform")).toBe(before);
  await editColor(page.getByLabel("Body color", { exact: true }).filter({ visible: true }), "#ee8844");
  await expect(characters.nth(1)).toHaveCSS("--ember-color", "#ee8844");
  await editColor(page.getByLabel("Eye color", { exact: true }).filter({ visible: true }), "#123456");
  await expect(characters.nth(1).locator('.emberling-eyes')).toHaveAttribute("fill", "#123456");
  const size = page.getByRole("slider", { name: "Character size", exact: true });
  await size.press("Home"); await size.press("ArrowRight");
  await expect(size).toHaveValue("68");
  await expect(characters.first()).toHaveCSS("width", "68px");
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(page.getByRole("slider", { name: "Character size", exact: true })).toHaveValue("180");
});

test("launch Emberling stays visible without JavaScript and its former page redirects", async ({ browser, baseURL, request }) => {
  const redirect = await request.get('/components/live-orb?style=terminal', { maxRedirects: 0 });
  expect(redirect.status()).toBe(308);
  expect(redirect.headers().location).toBe('/components/emberling?style=terminal');
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL, viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto('/components/emberling');
  const characters = page.getByRole('img', { name: 'Emberling, a curious folded-flame character', exact: true });
  await expect(characters.first()).toBeVisible();
  await expect(characters.first().locator('svg')).toBeVisible();
  await context.close();
});

test("launch SEO serves the complete sitemap robots and a 1200 by 630 OG image", async ({ page, request }, info) => {
  await page.goto("/");
  await metadata(page, "/");
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
  expect(urls.sort()).toEqual(["/", "/components", "/docs", ...components.map(({ slug }) => `/components/${slug}`)].sort());
  const robots = await request.get("/robots.txt");
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain("Sitemap:");
  expect(await robots.text()).toContain("/sitemap.xml");
  const og = new URL((await page.locator('meta[property="og:image"]').first().getAttribute("content"))!);
  const response = await request.get(og.pathname + og.search);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("image/png");
  const bytes = await response.body();
  expect(bytes.subarray(1, 4).toString()).toBe("PNG");
  expect([bytes.readUInt32BE(16), bytes.readUInt32BE(20)]).toEqual([1200, 630]);
  const path = `${evidence}/opengraph-image.png`;
  await writeFile(path, bytes);
  await info.attach("Social preview image", { path, contentType: "image/png" });
  expect((await request.get("/components/not-a-real-launch-component")).status()).toBe(404);
});

test("launch documentation serves a usable Avatar SVG with application JavaScript disabled", async ({ browser, baseURL }, info) => {
  // Keep the existing avatar.spec.ts no-JavaScript contract in the launch gate
  // without rerunning the complete avatar editor and export suite.
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false, viewport: viewports[0], reducedMotion: "reduce" });
  try {
    const page = await context.newPage();
    const response = await page.goto("/docs");
    expect(response?.status()).toBe(200);
    const avatar = page.getByRole("img", { name: "Server rendered avatar", exact: true });
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute("viewBox", "0 0 100 100");
    await expect(avatar).toHaveAttribute("width", "80");
    await expect(avatar).toHaveAttribute("height", "80");
    await expect(avatar.locator(":scope > g > path").first()).toBeVisible();
    const definitions = await avatar.evaluate((element) => {
      const ids = [...element.querySelectorAll("[id]")].map((node) => node.id);
      const local = new Set(ids);
      const missing = [...element.innerHTML.matchAll(/url\(#([^)]*)\)/g)].map((match) => match[1]).filter((id) => !local.has(id));
      return { count: ids.length, unique: local.size, missing };
    });
    expect(definitions.count).toBeGreaterThan(1);
    expect(definitions.unique).toBe(definitions.count);
    expect(definitions.missing).toEqual([]);
    await expect(page.getByRole("link", { name: "Make your own avatar", exact: true })).toHaveAttribute("href", "/components/avatar-editor?style=polished");
    const path = `${evidence}/docs-server-avatar-no-js.png`;
    await page.locator(".server-avatar-example").screenshot({ path, animations: "disabled" });
    await info.attach("Server-rendered Avatar without application JavaScript", { path, contentType: "image/png" });
  } finally {
    await context.close();
  }
});
