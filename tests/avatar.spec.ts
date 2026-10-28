import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { APPEARANCE_VALUES, type Appearance } from "../components/ui/appearance";
import { generateAvatarConfig } from "../lib/avatar/generator";
import { avatarGlyphs } from "../lib/avatar/glyphs";
import { avatarPalettes } from "../lib/avatar/palettes";
import { avatarToSvgString } from "../lib/avatar/render";
import type { AvatarConfig } from "../lib/avatar/types";

test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => { await mkdir("out/avatar/browser", { recursive: true }); });

async function openAvatar(page: Page, slug: string, appearance: Appearance = "polished") {
  await page.goto(`/components/${slug}?style=${appearance}`);
  const demo = page.getByTestId("live-demo");
  await expect(demo).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return demo;
}

async function configIn(demo: Locator): Promise<AvatarConfig> {
  return JSON.parse(await demo.locator("pre.avatar-config").innerText()) as AvatarConfig;
}

async function svgFingerprint(svg: Locator) {
  return svg.evaluate((element) => {
    const ids = [...element.querySelectorAll("[id]")].map((node) => node.id);
    let markup = element.innerHTML;
    ids.forEach((id, index) => { markup = markup.replaceAll(id, `definition-${index}`); });
    return markup;
  });
}

async function expectLocalDefinitions(root: Locator) {
  const report = await root.evaluate((element) => {
    const avatars = [...element.querySelectorAll<SVGSVGElement>("svg[data-generated-avatar]")];
    const allIds = avatars.flatMap((avatar) => [...avatar.querySelectorAll("[id]")].map((node) => node.id));
    const missing: string[] = [];
    for (const avatar of avatars) {
      const localIds = new Set([...avatar.querySelectorAll("[id]")].map((node) => node.id));
      for (const reference of avatar.innerHTML.matchAll(/url\(#([^)]*)\)/g)) {
        if (!localIds.has(reference[1])) missing.push(reference[1]);
      }
    }
    return { avatars: avatars.length, definitions: allIds.length, uniqueDefinitions: new Set(allIds).size, missing };
  });
  expect(report.avatars).toBeGreaterThan(0);
  expect(report.definitions).toBeGreaterThan(report.avatars);
  expect(report.uniqueDefinitions).toBe(report.definitions);
  expect(report.missing).toEqual([]);
}

async function expectVisibleRadioFocus(input: Locator) {
  await expect(input).toBeFocused();
  await expect(input).toBeInViewport();
  expect(await input.evaluate((element) => {
    const label = element.closest("label");
    if (!label) return false;
    const style = getComputedStyle(label);
    return element.matches(":focus-visible") && style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) >= 2;
  })).toBe(true);
}

test("seed edits are deterministic inline SVG with isolated definitions and no avatar requests", async ({ page }) => {
  const externalImages: string[] = [];
  const seedRequests: string[] = [];
  const changedSeed = "browser-seed-no-network-9f372";
  page.on("request", (request) => {
    if (request.resourceType() === "image" && /^https?:/.test(request.url()) && new URL(request.url()).origin !== "http://127.0.0.1:3107") externalImages.push(request.url());
    if (request.url().includes(changedSeed)) seedRequests.push(request.url());
  });
  const demo = await openAvatar(page, "avatar");
  const seed = demo.getByRole("textbox", { name: "Avatar seed" });
  const originalSeed = await seed.inputValue();
  const preview = demo.locator(".avatar-seed-preview svg[data-generated-avatar]");
  const original = await svgFingerprint(preview);
  await seed.fill(changedSeed);
  await expect(preview).toHaveAccessibleName(`Avatar for ${changedSeed}`);
  await expect.poll(() => svgFingerprint(preview)).not.toBe(original);
  await seed.fill(originalSeed);
  await expect.poll(() => svgFingerprint(preview)).toBe(original);
  await seed.fill("");
  await expect(preview).toHaveAccessibleName("Avatar for guest");
  await expect(preview.locator(":scope > g > path").first()).toBeVisible();
  await expectLocalDefinitions(demo);
  await expect(demo.locator("img, image, canvas")).toHaveCount(0);
  expect(externalImages).toEqual([]);
  expect(seedRequests).toEqual([]);
});

test("editor updates config, preview, and seed reset without retaining customization after reload", async ({ page }) => {
  const demo = await openAvatar(page, "avatar-editor");
  const initial = generateAvatarConfig("user-42");
  await expect.poll(() => configIn(demo)).toEqual(initial);
  const editor = demo.getByRole("region", { name: "Customize your avatar" });
  const preview = editor.getByRole("img", { name: "Avatar preview" });
  const before = await svgFingerprint(preview);
  await editor.getByRole("button", { name: "Show all 64 palettes" }).click();
  const paletteIndex = (initial.palette + 1) % avatarPalettes.length;
  await editor.getByRole("radio", { name: avatarPalettes[paletteIndex].name, exact: true }).click();
  await expect.poll(async () => (await configIn(demo)).palette).toBe(paletteIndex);
  const glyph = avatarGlyphs.find((item) => item.id !== initial.glyph)!;
  await editor.getByRole("radio", { name: glyph.name, exact: true }).click();
  await expect.poll(async () => (await configIn(demo)).glyph).toBe(glyph.id);
  const angle = editor.getByRole("slider", { name: "Gradient angle", exact: true });
  await angle.press("Home");
  await angle.press("ArrowRight");
  await expect.poll(async () => (await configIn(demo)).angle).toBe(1);
  await editor.getByRole("combobox", { name: "Detail", exact: true }).selectOption("grid");
  await editor.getByRole("combobox", { name: "Shape", exact: true }).selectOption("circle");
  await expect.poll(async () => ({ pattern: (await configIn(demo)).pattern, shape: (await configIn(demo)).shape })).toEqual({ pattern: "grid", shape: "circle" });
  await expect(preview).toHaveAttribute("data-shape", "circle");
  expect(await svgFingerprint(preview)).not.toBe(before);
  const customized = await configIn(demo);
  await editor.getByRole("button", { name: "Shuffle avatar", exact: true }).click();
  await expect.poll(() => configIn(demo)).not.toEqual(customized);
  expect((await configIn(demo)).shape).toBe("circle");
  await editor.getByRole("button", { name: "Reset to default", exact: true }).click();
  await expect.poll(() => configIn(demo)).toEqual(initial);
  expect(await svgFingerprint(preview)).toBe(before);
  await editor.getByRole("button", { name: "Shuffle avatar", exact: true }).click();
  await page.reload();
  await expect.poll(() => configIn(demo)).toEqual(initial);
});

test("SVG and PNG downloads contain the current avatar and the PNG decodes into visible pixels", async ({ page }) => {
  const demo = await openAvatar(page, "avatar-editor", "neobrutalism");
  await demo.getByRole("combobox", { name: "Shape", exact: true }).selectOption("circle");
  await demo.getByRole("combobox", { name: "Detail", exact: true }).selectOption("halo");
  const config = await configIn(demo);
  const svgDownload = page.waitForEvent("download");
  await demo.getByRole("link", { name: "Download SVG", exact: true }).click();
  const svgFile = await svgDownload;
  expect(svgFile.suggestedFilename()).toBe("orangeui-avatar.svg");
  const svg = await readFile((await svgFile.path())!, "utf8");
  expect(svg).toBe(avatarToSvgString(config, 256, { appearance: "neobrutalism" }));
  await svgFile.saveAs("out/avatar/browser/download.svg");

  const pngDownload = page.waitForEvent("download");
  await demo.getByRole("button", { name: "Download PNG", exact: true }).click();
  const pngFile = await pngDownload;
  expect(pngFile.suggestedFilename()).toBe("orangeui-avatar.png");
  const png = await readFile((await pngFile.path())!);
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const decoded = await page.evaluate(async ({ base64, svgText }) => {
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
    const colors = new Set<string>();
    let visiblePixels = 0;
    for (let offset = 0; offset < data.length; offset += 4) {
      if (data[offset + 3] > 0) { visiblePixels++; colors.add(`${data[offset]},${data[offset + 1]},${data[offset + 2]}`); }
    }
    const referenceUrl = URL.createObjectURL(new Blob([svgText], { type: "image/svg+xml" }));
    let differingChannels = 0;
    try {
      const reference = new Image();
      reference.src = referenceUrl;
      await reference.decode();
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(reference, 0, 0, canvas.width, canvas.height);
      const expected = context.getImageData(0, 0, canvas.width, canvas.height).data;
      for (let channel = 0; channel < data.length; channel++) if (data[channel] !== expected[channel]) differingChannels++;
    } finally {
      URL.revokeObjectURL(referenceUrl);
    }
    const report = { width: bitmap.width, height: bitmap.height, cornerAlpha: data[3], visiblePixels, uniqueColors: colors.size, differingChannels };
    bitmap.close();
    return report;
  }, { base64: png.toString("base64"), svgText: svg });
  expect(decoded.width).toBe(256);
  expect(decoded.height).toBe(256);
  expect(decoded.cornerAlpha).toBe(0);
  expect(decoded.visiblePixels).toBeGreaterThan(40_000);
  expect(decoded.uniqueColors).toBeGreaterThan(100);
  expect(decoded.differingChannels).toBe(0);
  await pngFile.saveAs("out/avatar/browser/download.png");
  await writeFile("out/avatar/browser/download-report.json", JSON.stringify(decoded, null, 2));
  await expect(demo.getByRole("status")).toHaveText("PNG downloaded.");
});

test("the documentation avatar renders as usable SVG when application JavaScript is disabled", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1280, height: 900 } });
  try {
    const page = await context.newPage();
    const response = await page.goto("http://127.0.0.1:3107/docs");
    expect(response?.status()).toBe(200);
    const avatar = page.getByRole("img", { name: "Server rendered avatar", exact: true });
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute("viewBox", "0 0 100 100");
    await expect(avatar.locator(":scope > g > path").first()).toBeVisible();
    expect(await avatar.getAttribute("width")).toMatch(/^\d+$/);
    await expectLocalDefinitions(page.locator("body"));
    await avatar.screenshot({ path: "out/avatar/browser/server-rendered.png" });
  } finally {
    await context.close();
  }
});

for (const appearance of APPEARANCE_VALUES) for (const theme of ["light", "dark"] as const) {
  test(`${appearance} editor and overlapping group work at mobile width in ${theme}`, async ({ page }) => {
    const width = theme === "light" ? 360 : 390;
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript((palette) => localStorage.setItem("orangeui-palette", palette), theme);
    const demo = await openAvatar(page, "avatar-editor", appearance);
    const editor = demo.getByRole("region", { name: "Customize your avatar" });
    await expect(editor).toHaveAttribute("data-appearance", appearance);
    await expect(editor.locator(".avatar-editor-options input[tabindex='0']")).toHaveCount(2);
    const initial = await configIn(demo);
    await editor.getByRole("button", { name: "Show all 64 palettes" }).click();
    const initialPalette = editor.locator(".avatar-editor-palettes input:checked");
    await initialPalette.focus();
    await initialPalette.press("ArrowRight");
    await expect.poll(async () => (await configIn(demo)).palette).toBe((initial.palette + 1) % avatarPalettes.length);
    await expectVisibleRadioFocus(editor.locator(".avatar-editor-palettes input:checked"));
    await page.keyboard.press("Tab");
    await expect(editor.getByRole("button", { name: "Show fewer palettes" })).toBeFocused();
    await page.keyboard.press("Tab");
    await expectVisibleRadioFocus(editor.locator(".avatar-editor-glyphs input:checked"));
    await page.keyboard.press("ArrowRight");
    await expect.poll(async () => (await configIn(demo)).glyph).not.toBe(initial.glyph);
    await expectVisibleRadioFocus(editor.locator(".avatar-editor-glyphs input:checked"));
    await page.keyboard.press("Tab");
    await expect(editor.getByRole("button", { name: "Show all 36 glyphs" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(editor.getByRole("button", { name: "Show fewer glyphs" })).toBeFocused();
    await page.keyboard.press("Tab");
    const angle = editor.getByRole("slider", { name: "Gradient angle", exact: true });
    await expect(angle).toBeFocused();
    await angle.press("End");
    await expect.poll(async () => (await configIn(demo)).angle).toBe(359);
    await expect(angle).toHaveAttribute("aria-valuetext", "359 degrees");
    await editor.getByRole("button", { name: "Reset to default", exact: true }).press("Enter");
    await expect.poll(() => configIn(demo)).toEqual(generateAvatarConfig("user-42"));
    const accessibility = await new AxeBuilder({ page }).include('[data-testid="live-demo"]').analyze();
    expect(accessibility.violations.map((violation) => ({ id: violation.id, targets: violation.nodes.map((node) => node.target), summaries: violation.nodes.map((node) => node.failureSummary) }))).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await editor.screenshot({ path: `out/avatar/browser/editor-${appearance}-${theme}-${width}.png`, animations: "disabled", style: ".library-header, .skip-link { visibility: hidden !important; }" });

    const groupDemo = await openAvatar(page, "avatar-group", appearance);
    const group = groupDemo.getByRole("group", { name: "Your studio team: 8 people", exact: true });
    await expect(group).toHaveAttribute("data-appearance", appearance);
    await expect(group.locator("svg[data-generated-avatar]")).toHaveCount(5);
    await expect(group.getByRole("img", { name: "3 more people", exact: true })).toHaveText("+3");
    const boxes = await group.locator(".avatar-group-member").evaluateAll((elements) => elements.map((element) => ({ x: element.getBoundingClientRect().left, width: element.getBoundingClientRect().width })));
    expect(boxes[0].width).toBe(48);
    expect(boxes[1].x - boxes[0].x).toBeGreaterThan(0);
    expect(boxes[1].x - boxes[0].x).toBeLessThan(48);
    await expectLocalDefinitions(group);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    await group.screenshot({ path: `out/avatar/browser/group-${appearance}-${theme}-${width}.png`, animations: "disabled", style: ".library-header, .skip-link { visibility: hidden !important; }" });
  });
}

test("the 100-seed Storybook grid stays varied, deterministic, and self-contained", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 1200 });
  for (const theme of ["light", "dark"] as const) {
    await page.goto(`http://127.0.0.1:6006/iframe.html?id=components-avatar--hundred-avatars&viewMode=story&globals=palette:${theme}`);
    const grid = page.locator(".avatar-story-grid");
    const avatars = grid.locator("svg[data-generated-avatar]");
    await expect(avatars).toHaveCount(100);
    await expect(avatars.first()).toBeVisible();
    await expectLocalDefinitions(grid);
    await expect(grid.locator("img, image, canvas")).toHaveCount(0);
    const signatures = await avatars.evaluateAll((elements) => elements.map((element) => {
      let markup = element.innerHTML;
      [...element.querySelectorAll("[id]")].forEach((node, index) => { markup = markup.replaceAll(node.id, `definition-${index}`); });
      return markup;
    }));
    expect(new Set(signatures).size).toBe(100);
    const diversity = await avatars.evaluateAll((elements) => ({
      palettes: new Set(elements.map((element) => JSON.stringify([...element.querySelectorAll("linearGradient stop")].map((stop) => stop.getAttribute("stop-color"))))).size,
      glyphs: new Set(elements.map((element) => JSON.stringify([...element.querySelectorAll("g[fill-rule='evenodd'] path")].map((path) => path.getAttribute("d"))))).size,
    }));
    expect(diversity.palettes).toBeGreaterThanOrEqual(35);
    expect(diversity.glyphs).toBeGreaterThanOrEqual(25);
    const first = await svgFingerprint(avatars.first());
    await page.reload();
    await expect(avatars).toHaveCount(100);
    expect(await svgFingerprint(avatars.first())).toBe(first);
    await grid.screenshot({ path: `out/avatar/browser/hundred-seeds-${theme}.png`, animations: "disabled" });
    await writeFile(`out/avatar/browser/hundred-seeds-${theme}.json`, JSON.stringify({ avatars: 100, distinctSignatures: new Set(signatures).size, ...diversity }, null, 2));
  }
});
