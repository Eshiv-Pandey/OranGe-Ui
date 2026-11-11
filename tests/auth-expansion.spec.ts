import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir } from "node:fs/promises";
import path from "node:path";

const captures = path.resolve(".impeccable/review/auth-expansion");
const sceneThumbnails = path.resolve("out/iteration/auth-expansion/scene-thumbnails");
const success = "Demo complete. No account was created or authenticated.";
const layouts = [
  { slug: "auth-panel", name: "AuthPanel", title: "A thoughtful welcome", heading: "Good to have you back.", mode: "sign-in", file: "components/ui/blocks/auth.tsx" },
  { slug: "quiet-auth", name: "QuietAuth", title: "A quiet place to begin.", heading: "Welcome to your space.", mode: "sign-in", file: "components/ui/blocks/auth-variants.tsx" },
  { slug: "studio-auth", name: "StudioAuth", title: "Small starts. Open doors.", heading: "Start something good.", mode: "sign-in", file: "components/ui/blocks/auth-variants.tsx" },
  { slug: "contrast-auth", name: "ContrastAuth", title: "A different kind of bright.", heading: "Find your flow.", mode: "sign-in", file: "components/ui/blocks/auth-variants.tsx" },
  { slug: "playful-auth", name: "PlayfulAuth", title: "Good ideas start together.", heading: "Good to meet you.", mode: "sign-up", file: "components/ui/blocks/auth-variants.tsx" },
];

function entryFor(page: Page, title: string) {
  return page.getByRole("region", { name: title, exact: true });
}

function previewFor(page: Page, name: string) {
  return page.getByRole("region", { name: `${name} live preview`, exact: true });
}

async function setPagePalette(page: Page, palette: "light" | "dark") {
  const toggle = page.getByRole("button", { name: "Dark mode", exact: true });
  const pressed = palette === "dark" ? "true" : "false";
  if (await toggle.getAttribute("aria-pressed") !== pressed) await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", pressed);
  await expect(page.locator("html")).toHaveAttribute("data-theme", palette);
}

async function readyAssets(page: Page, scope: Locator) {
  await page.evaluate(async () => { await document.fonts.ready; });
  const loaded = await scope.locator("img").evaluateAll(async images => {
    const photos = images as HTMLImageElement[];
    photos.forEach(photo => { photo.loading = "eager"; });
    await Promise.all(photos.map(photo => photo.decode().catch(() => {})));
    return photos.every(photo => photo.complete && photo.naturalWidth > 0);
  });
  expect(loaded, "preview photographs should load before capture").toBe(true);
}

async function noHorizontalOverflow(page: Page, live: Locator, label: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth), `${label}: page overflow`).toBeLessThanOrEqual(1);
  expect(await live.evaluate(element => element.scrollWidth - element.clientWidth), `${label}: embedded preview overflow`).toBeLessThanOrEqual(1);
}

async function capture(target: Page | Locator, filename: string) {
  const options = { path: path.join(captures, filename), animations: "disabled" as const };
  if ("goto" in target) {
    await target.evaluate(() => window.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    await target.screenshot({ ...options, fullPage: true });
  } else {
    await target.screenshot({ ...options, style: ".library-header, .skip-link { visibility: hidden !important; }" });
  }
}

test.beforeAll(async () => {
  await Promise.all([mkdir(captures, { recursive: true }), mkdir(sceneThumbnails, { recursive: true })]);
});

test("catalogue starts with sections and opens the five-layout Auth collection", async ({ page }) => {
  await page.goto("/blocks");
  const main = page.locator("#library-main");
  await expect(main.getByRole("heading", { level: 1, name: "Blocks" })).toBeVisible();
  await expect(main.getByRole("button", { name: "Browse sections", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(main.getByRole("button", { name: "All examples", exact: true })).toHaveAttribute("aria-pressed", "false");
  const authCategory = main.getByRole("link").filter({ has: page.getByRole("heading", { level: 2, name: "Auth", exact: true }) });
  await expect(authCategory).toHaveAttribute("href", "/blocks/category/auth");
  await expect(authCategory).toContainText("5 examples");
  await authCategory.click();
  await expect(page).toHaveURL(/\/blocks\/category\/auth$/);
  await expect(main.getByRole("heading", { level: 1, name: "Auth", exact: true })).toBeVisible();
  await expect(main.locator("section[id^='block-']")).toHaveCount(5);

  for (const layout of layouts) {
    const entry = entryFor(page, layout.title), live = previewFor(page, layout.name);
    await expect(entry.getByRole("link", { name: `${layout.name} documentation and props`, exact: true })).toHaveAttribute("href", `/blocks/${layout.slug}`);
    await expect(live.getByRole("heading", { level: 1, name: layout.heading, exact: true })).toBeVisible();
    await expect(live.getByRole("combobox", { name: "Auth flow", exact: true })).toHaveValue(layout.mode);
    await expect(live.getByLabel(/^Your name/)).toHaveCount(layout.mode === "sign-up" ? 1 : 0);
  }
  await page.goto("/blocks");
  await page.getByRole("combobox", { name: "Block category", exact: true }).selectOption("Auth");
  await expect(page).toHaveURL(/\/blocks\/category\/auth$/);
});

test("each layout retains its form across widths, palette and source view until explicitly reset", async ({ page }) => {
  await page.goto("/blocks/category/auth");
  for (const layout of layouts) {
    const entry = entryFor(page, layout.title), live = previewFor(page, layout.name);
    const email = `${layout.slug}@example.com`;
    await live.getByLabel(/^Email address/).fill(email);
    await live.getByLabel(/^Password/).fill("retained-password");
    if (layout.mode === "sign-up") await live.getByLabel(/^Your name/).fill("Riley Morgan");
    for (const width of ["tablet", "phone", "full"]) {
      await entry.getByRole("button", { name: `${layout.name} ${width} width`, exact: true }).click();
      await expect(live).toHaveAttribute("data-width", width);
      await expect(live.getByLabel(/^Email address/)).toHaveValue(email);
    }
    await entry.getByRole("combobox", { name: `${layout.name} preview palette`, exact: true }).selectOption("dark");
    await expect(live).toHaveAttribute("data-theme", "dark");
    await entry.getByRole("button", { name: `${layout.name} source code`, exact: true }).click();
    await expect(live).toBeHidden();
    await expect(entry.getByRole("combobox", { name: `${layout.name} source file`, exact: true })).toHaveValue(layout.file);
    await expect(entry.getByRole("region", { name: `${layout.name} ${layout.file} source`, exact: true })).toContainText(`export function ${layout.name}`);
    await entry.getByRole("button", { name: `${layout.name} preview`, exact: true }).click();
    await expect(live.getByLabel(/^Email address/)).toHaveValue(email);
    await expect(live.getByLabel(/^Password/)).toHaveValue("retained-password");
    await expect(live.getByRole("combobox", { name: "Auth flow", exact: true })).toHaveValue(layout.mode);
    if (layout.mode === "sign-up") await expect(live.getByLabel(/^Your name/)).toHaveValue("Riley Morgan");
    await entry.getByRole("button", { name: `Reset ${layout.name} preview`, exact: true }).click();
    await expect(live.getByLabel(/^Email address/)).toHaveValue("");
    await expect(live.getByLabel(/^Password/)).toHaveValue("");
    await expect(live.getByRole("combobox", { name: "Auth flow", exact: true })).toHaveValue(layout.mode);
  }
});

test("the embedded demo validates and completes sign-in, signup, recovery and verification", async ({ page }) => {
  await page.goto("/blocks/category/auth");
  const live = previewFor(page, "StudioAuth"), form = live.locator("form");
  const flow = live.getByRole("combobox", { name: "Auth flow", exact: true });
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(form.getByText("Enter a valid email address.", { exact: true })).toBeVisible();
  await expect(form.getByText("Enter your password.", { exact: true })).toBeVisible();
  await live.getByLabel(/^Email address/).fill("riley@example.com");
  await live.getByLabel(/^Password/).fill("long-enough");
  await live.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(live.getByLabel(/^Password/)).toHaveAttribute("type", "text");
  await live.getByRole("combobox", { name: "Callback result", exact: true }).selectOption("failure");
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(form.getByRole("alert")).toContainText("This is a demo error.");
  await live.getByRole("combobox", { name: "Callback result", exact: true }).selectOption("success");
  await form.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(form.getByRole("status")).toHaveText(success);

  await flow.selectOption("sign-up");
  await expect(live.getByLabel(/^Email address/)).toHaveValue("");
  await expect(live.getByLabel(/^Password/)).toHaveAttribute("type", "password");
  await expect(form.getByRole("status")).toHaveCount(0);
  await live.getByLabel(/^Your name/).fill("Riley Morgan");
  await live.getByLabel(/^Email address/).fill("riley@example.com");
  await live.getByLabel(/^Password/).fill("short");
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Use at least 8 characters.");
  await live.getByLabel(/^Password/).fill("long-enough");
  await form.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(form.getByRole("status")).toHaveText(success);

  await flow.selectOption("sign-in");
  await live.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await expect(flow).toHaveValue("recover");
  await expect(live.getByLabel(/^Password/)).toHaveCount(0);
  await live.getByLabel(/^Email address/).fill("riley@example.com");
  await form.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(form.getByRole("status")).toHaveText(success);

  await flow.selectOption("verify");
  await expect(live.getByLabel(/^Email address/)).toHaveValue("");
  await live.getByLabel(/^Email address/).fill("riley@example.com");
  await live.getByLabel(/^Verification code/).fill("12ab34");
  await form.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(form.getByRole("alert")).toHaveText("Enter the six-digit code.");
  await live.getByLabel(/^Verification code/).fill("123456");
  await form.getByRole("button", { name: "Verify code", exact: true }).click();
  await expect(form.getByRole("status")).toHaveText(success);
  await live.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await expect(flow).toHaveValue("sign-in");
  await expect(live.getByLabel(/^Verification code/)).toHaveCount(0);
});

test("keyboard account navigation clears credentials and continues at the new first field", async ({ page }) => {
  await page.goto("/blocks/category/auth");
  const live = previewFor(page, "QuietAuth");
  const flow = live.getByRole("combobox", { name: "Auth flow", exact: true });
  const accountActions = live.getByRole("group", { name: "Account action", exact: true });
  await live.getByLabel(/^Email address/).fill("previous@example.com");
  await live.getByLabel(/^Password/).fill("previous-password");
  await accountActions.getByRole("button", { name: "Create account", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(flow).toHaveValue("sign-up");
  await expect(live.getByLabel(/^Your name/)).toBeFocused();
  await expect(live.getByLabel(/^Email address/)).toHaveValue("");
  await expect(live.getByLabel(/^Password/)).toHaveValue("");
  await page.keyboard.type("Riley Morgan");
  await expect(live.getByLabel(/^Your name/)).toHaveValue("Riley Morgan");
  await page.keyboard.press("Tab");
  await expect(live.getByLabel(/^Email address/)).toBeFocused();
  await page.keyboard.type("signup@example.com");

  await accountActions.getByRole("button", { name: "Sign in", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(flow).toHaveValue("sign-in");
  await expect(live.getByLabel(/^Email address/)).toBeFocused();
  await expect(live.getByLabel(/^Email address/)).toHaveValue("");
  await page.keyboard.type("signin@example.com");
  await live.getByRole("button", { name: "Forgot password?", exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(flow).toHaveValue("recover");
  await expect(live.getByLabel(/^Password/)).toHaveCount(0);
  await expect(live.getByLabel(/^Email address/)).toBeFocused();
  await expect(live.getByLabel(/^Email address/)).toHaveValue("");
  await page.keyboard.type("recovery@example.com");
  await live.getByRole("button", { name: "Back to sign in", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(flow).toHaveValue("sign-in");
  await expect(live.getByLabel(/^Email address/)).toBeFocused();
  await expect(live.getByLabel(/^Email address/)).toHaveValue("");
  await expect(live.getByLabel(/^Password/)).toHaveValue("");
});

test("ContrastAuth and PlayfulAuth paint different form surfaces in inherited light and dark palettes", async ({ page }) => {
  await page.goto("/blocks/category/auth");
  for (const layout of layouts.filter(item => item.name === "ContrastAuth" || item.name === "PlayfulAuth")) {
    const entry = entryFor(page, layout.title), live = previewFor(page, layout.name);
    const palette = entry.getByRole("combobox", { name: `${layout.name} preview palette`, exact: true });
    const paintedSurface = () => live.locator(".ob-auth-layout-main").evaluate(element => {
      const colorScheme = getComputedStyle(element).colorScheme;
      // Contrast's form shares its section background; Playful has an opaque panel.
      let surface: Element | null = element;
      while (surface) {
        const background = getComputedStyle(surface).backgroundColor;
        if (background !== "transparent" && background !== "rgba(0, 0, 0, 0)") return { background, colorScheme };
        surface = surface.parentElement;
      }
      return { background: "transparent", colorScheme };
    });
    await palette.selectOption("light");
    const light = await paintedSurface();
    expect(light.colorScheme, `${layout.name} inherits the light color scheme`).toBe("light");
    expect(light.background).not.toBe("transparent");
    await palette.selectOption("dark");
    await expect.poll(async () => (await paintedSurface()).background, { message: `${layout.name} form background should respond to the palette` }).not.toBe(light.background);
    const dark = await paintedSurface();
    expect(dark.colorScheme, `${layout.name} inherits the dark color scheme`).toBe("dark");
    expect(dark.background).not.toBe("transparent");
  }
});

for (const palette of ["light", "dark"] as const) {
  test(`all five Auth blocks meet automated accessibility checks in ${palette} previews`, async ({ page }) => {
    await page.goto("/blocks/category/auth");
    await setPagePalette(page, palette);
    for (const layout of layouts) {
      const entry = entryFor(page, layout.title), live = previewFor(page, layout.name);
      await entry.getByRole("combobox", { name: `${layout.name} preview palette`, exact: true }).selectOption(palette);
      await expect(live).toHaveAttribute("data-theme", palette);
      await live.scrollIntoViewIfNeeded();
      await readyAssets(page, live);
      const result = await new AxeBuilder({ page })
        .include(`#block-${layout.slug} .orange-block`)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(result.violations, `${layout.name} ${palette} accessibility`).toEqual([]);
    }
  });
}

for (const failure of ["http", "incomplete"] as const) {
  test(`source loads lazily, reports ${failure} failure and retries the real endpoint`, async ({ page }) => {
    let requests = 0;
    await page.route(/\/api\/blocks\/quiet-auth\?format=source$/, async route => {
      requests++;
      if (requests > 1) return route.continue();
      if (failure === "http") await route.fulfill({ status: 503, contentType: "application/json", body: "{}" });
      else await route.fulfill({ status: 200, json: { files: {} } });
    });
    await page.goto("/blocks/category/auth");
    const entry = entryFor(page, "A quiet place to begin.");
    expect(requests, "source should not load before Code is opened").toBe(0);
    await entry.getByRole("button", { name: "QuietAuth source code", exact: true }).click();
    await expect(entry.getByRole("alert")).toContainText(failure === "http" ? "The source could not be loaded." : "The source response is incomplete.");
    await expect(entry.getByRole("link", { name: "Download QuietAuth source ZIP", exact: true })).toHaveAttribute("href", "/api/blocks/quiet-auth");
    await capture(entry, `source-${failure}-error-desktop.png`);
    expect(requests).toBe(1);
    await entry.getByRole("button", { name: "Retry QuietAuth source", exact: true }).click();
    const file = "components/ui/blocks/auth-variants.tsx";
    await expect(entry.getByRole("combobox", { name: "QuietAuth source file", exact: true })).toHaveValue(file);
    await expect(entry.getByRole("region", { name: `QuietAuth ${file} source`, exact: true })).toContainText("export function QuietAuth");
    await expect(entry.getByRole("alert")).toHaveCount(0);
    expect(requests).toBe(2);
    await entry.getByRole("button", { name: "QuietAuth preview", exact: true }).click();
    await entry.getByRole("button", { name: "QuietAuth source code", exact: true }).click();
    await expect(entry.getByRole("combobox", { name: "QuietAuth source file", exact: true })).toHaveValue(file);
    expect(requests, "a loaded source bundle is retained across view changes").toBe(2);
  });
}

test("blocked clipboard access exposes focused, selected install and source fallback text", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => { throw new Error("Clipboard access denied for this check."); } },
    });
  });
  await page.goto("/blocks/category/auth");
  const entry = entryFor(page, "A quiet place to begin.");
  await entry.getByRole("button", { name: "Copy QuietAuth install command", exact: true }).click();
  await expect(entry.getByText("Clipboard access is unavailable. Copy the selected text below.", { exact: true })).toBeVisible();
  const install = `npx shadcn@latest add "${new URL(page.url()).origin}/r/block-quiet-auth.json"`;
  const fallback = entry.getByRole("textbox", { name: "QuietAuth install command", exact: true });
  await expect(fallback).toHaveValue(install);
  await expect(fallback).toHaveJSProperty("readOnly", true);
  await expect(fallback).toBeFocused();
  expect(await fallback.evaluate(element => ({ start: (element as HTMLTextAreaElement).selectionStart, end: (element as HTMLTextAreaElement).selectionEnd }))).toEqual({ start: 0, end: install.length });
  await capture(entry, "install-clipboard-fallback-desktop.png");

  await entry.getByRole("button", { name: "QuietAuth source code", exact: true }).click();
  await expect(fallback).toHaveCount(0);
  const file = "components/ui/blocks/auth-variants.tsx";
  const source = entry.getByRole("region", { name: `QuietAuth ${file} source`, exact: true });
  await expect(source).toContainText("export function QuietAuth");
  const sourceText = (await source.textContent())!;
  await entry.getByRole("button", { name: `Copy QuietAuth ${file}`, exact: true }).click();
  const sourceFallback = entry.getByRole("textbox", { name: "QuietAuth source file", exact: true });
  await expect(sourceFallback).toHaveValue(sourceText);
  await expect(sourceFallback).toBeFocused();
  expect(await sourceFallback.evaluate(element => ({ start: (element as HTMLTextAreaElement).selectionStart, end: (element as HTMLTextAreaElement).selectionEnd }))).toEqual({ start: 0, end: sourceText.length });
  await capture(entry, "source-clipboard-fallback-desktop.png");
});

test("legacy Auth and migrated scene URLs redirect permanently to their Blocks destinations", async ({ page, request }) => {
  for (const [source, destination, heading] of [
    ["/blocks/auth", "/blocks/category/auth", "Auth blocks"],
    ["/components/neon-sign-404", "/blocks/neon-sign-404", "Closed for the night."],
    ["/components/chai-break-404", "/blocks/chai-break-404", "A little chai. A different path."],
    ["/components/pavilion-footer", "/blocks/pavilion-footer", "A place to return."],
  ]) {
    const response = await request.get(`${source}?style=polished`, { maxRedirects: 0 });
    expect(response.status(), source).toBe(308);
    const location = new URL(response.headers()["location"], "http://127.0.0.1:3140");
    expect(location.pathname).toBe(destination);
    expect(location.searchParams.get("style")).toBe("polished");
    await page.goto(`${source}?style=polished`);
    await expect(page).toHaveURL(url => url.pathname === destination && url.searchParams.get("style") === "polished");
    await expect(page.locator("#library-main").getByRole("heading", { level: 1, name: heading, exact: true })).toBeVisible();
  }
});

for (const scene of [
  { slug: "neon-sign-404", name: "NeonNotFound", title: "Closed for the night.", category: "not-found", root: ".neon-recovery", heading: "This page is closed for the night." },
  { slug: "chai-break-404", name: "ChaiBreak404", title: "A little chai. A different path.", category: "not-found", root: ".chai-recovery", heading: "This page is out for a chai break." },
  { slug: "pavilion-footer", name: "PavilionFooter", title: "A place to return.", category: "footer", root: ".pavilion-footer", heading: "" },
]) {
  test(`${scene.name} remains usable inside narrow category previews`, async ({ page }) => {
    // Crop the component itself so catalogue miniatures exclude demo chrome.
    await page.goto(`/preview/blocks/${scene.slug}`);
    await page.getByRole("combobox", { name: "Preview palette", exact: true }).selectOption("light");
    const standaloneScene = page.locator(scene.root);
    await expect(standaloneScene).toBeVisible();
    await readyAssets(page, standaloneScene);
    await standaloneScene.screenshot({ path: path.join(sceneThumbnails, `${scene.slug}.png`), animations: "disabled" });
    for (const viewport of [
      { name: "desktop", width: 1440, height: 1000, palette: "light" as const },
      { name: "mobile", width: 390, height: 844, palette: "dark" as const },
      { name: "small-mobile", width: 320, height: 760, palette: "light" as const },
    ]) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto(`/blocks/category/${scene.category}`);
      await setPagePalette(page, viewport.palette);
      const entry = entryFor(page, scene.title), live = previewFor(page, scene.name);
      await entry.getByRole("button", { name: `${scene.name} phone width`, exact: true }).click();
      await entry.getByRole("combobox", { name: `${scene.name} preview palette`, exact: true }).selectOption(viewport.palette);
      await expect(live).toHaveAttribute("data-width", "phone");
      await expect(live.locator(scene.root)).toBeVisible();
      await live.scrollIntoViewIfNeeded();
      await readyAssets(page, live);
      await noHorizontalOverflow(page, live, `${scene.name} ${viewport.name}`);
      const bounds = (await live.boundingBox())!;
      expect(bounds.width).toBeLessThanOrEqual(390);
      for (const link of await live.getByRole("link").all()) {
        await expect(link).toBeVisible();
        const linkBounds = (await link.boundingBox())!;
        expect(linkBounds.x, `${scene.name}: link left edge`).toBeGreaterThanOrEqual(bounds.x - 1);
        expect(linkBounds.x + linkBounds.width, `${scene.name}: link right edge`).toBeLessThanOrEqual(bounds.x + bounds.width + 1);
      }
      if (scene.heading) {
        await expect(live.getByRole("heading", { level: 1, name: scene.heading, exact: true })).toBeVisible();
        await expect(live.getByRole("link", { name: "Take me home", exact: true })).toHaveAttribute("href", "/preview/blocks/studio-landing");
      } else {
        await expect(live.getByRole("navigation", { name: "Footer navigation", exact: true })).toBeVisible();
      }
      await capture(entry, `${scene.slug}-${viewport.name}-${viewport.palette}-phone.png`);
      if (scene.name === "PavilionFooter") {
        await live.getByRole("button", { name: "Light the pavilion", exact: true }).press("Space");
        await expect(live.getByRole("button", { name: "Dim the pavilion", exact: true })).toHaveAttribute("aria-pressed", "true");
        await capture(entry, `${scene.slug}-${viewport.name}-${viewport.palette}-phone-lit.png`);
      }
    }
  });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 1000 },
  { name: "mobile", width: 390, height: 844 },
]) {
  for (const palette of ["light", "dark"] as const) {
    test(`capture ${viewport.name} ${palette} catalogue and Auth layouts`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto("/blocks");
      await setPagePalette(page, palette);
      await readyAssets(page, page.locator("#library-main"));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
      await capture(page.locator("#library-main"), `catalogue-${viewport.name}-${palette}.png`);
      await page.goto("/blocks/category/auth");
      await expect(page.locator("html")).toHaveAttribute("data-theme", palette);
      for (const layout of layouts) {
        await entryFor(page, layout.title).getByRole("combobox", { name: `${layout.name} preview palette`, exact: true }).selectOption(palette);
      }
      await readyAssets(page, page.locator(".block-collection"));
      await page.locator("#library-main").getByRole("heading", { level: 1, name: "Auth", exact: true }).scrollIntoViewIfNeeded();
      await capture(page, `auth-category-overview-${viewport.name}-${palette}.png`);
      for (const layout of layouts) {
        const entry = entryFor(page, layout.title), live = previewFor(page, layout.name);
        await expect(live).toHaveAttribute("data-theme", palette);
        await entry.scrollIntoViewIfNeeded();
        await readyAssets(page, live);
        await noHorizontalOverflow(page, live, `${layout.name} ${viewport.name} ${palette}`);
        await capture(entry, `${layout.slug}-${viewport.name}-${palette}.png`);
      }
    });
  }
}
