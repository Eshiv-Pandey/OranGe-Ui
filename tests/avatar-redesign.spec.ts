import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const appearances = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"] as const;
type Appearance = typeof appearances[number];
type SavedAvatar = {
  version: number; palette: number; glyph: string; angle: number;
  shape: string; pattern: string; customColors?: string[];
  [key: string]: unknown;
};
const evidence = "out/iteration/avatar-redesign";
const viewports = [
  { width: 1366, height: 768 },
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 390, height: 844 },
];

test.use({ reducedMotion: "reduce" });
test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

async function openEditor(page: Page, appearance: Appearance = "polished") {
  await page.goto(`/components/avatar-editor?style=${appearance}`);
  const editor = page.getByTestId("live-demo").getByRole("region", { name: "Customize your avatar", exact: true });
  await expect(editor).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return editor;
}

async function configIn(editor: Locator): Promise<SavedAvatar> {
  const value = await editor.getByLabel("Avatar configuration", { exact: true }).textContent();
  return JSON.parse(value ?? "null") as SavedAvatar;
}

async function editColor(input: Locator, value: string) {
  // Native color dialogs are browser chrome. Drive the real input's native
  // value setter and events, then verify the resulting controlled state.
  await input.evaluate((element, color) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, color);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(value);
}

async function settledPreviewSvg(preview: Locator) {
  return preview.evaluate((element) => {
    const clone = element.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", "256");
    clone.setAttribute("height", "256");
    clone.removeAttribute("style");
    clone.removeAttribute("class");
    return new XMLSerializer().serializeToString(clone);
  });
}

async function decodeExport(page: Page, png: Buffer, svg: string, previewSvg: string) {
  return page.evaluate(async ({ encoded, exported, preview }) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let visiblePixels = 0;
    const colors = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3]) {
        visiblePixels++;
        colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`);
      }
    }
    async function compareSvg(markup: string) {
      const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
      try {
        const image = new Image(); image.src = url; await image.decode();
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const reference = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let differences = 0;
        for (let index = 0; index < pixels.length; index++) if (pixels[index] !== reference[index]) differences++;
        return differences;
      } finally { URL.revokeObjectURL(url); }
    }
    const report = {
      width: bitmap.width, height: bitmap.height, cornerAlpha: pixels[3], visiblePixels,
      uniqueColors: colors.size, svgDifferences: await compareSvg(exported), previewDifferences: await compareSvg(preview),
    };
    bitmap.close();
    return report;
  }, { encoded: png.toString("base64"), exported: svg, preview: previewSvg });
}

const visualCases = [
  ...viewports.map((viewport) => ({ viewport, appearance: "polished" as Appearance, theme: "light" as const })),
  ...appearances.flatMap((appearance) => (["light", "dark"] as const).map((theme) => ({ viewport: viewports[0], appearance, theme })))
    .filter(({ appearance, theme }) => appearance !== "polished" || theme !== "light"),
];

for (const { viewport, appearance, theme } of visualCases) {
  test(`redesigned editor ${viewport.width}x${viewport.height} ${appearance} ${theme}`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    await page.addInitScript((value) => localStorage.setItem("orangeui-palette", value), theme);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const editor = await openEditor(page, appearance);
    await expect(editor).toHaveAttribute("data-appearance", appearance);
    await page.evaluate(() => scrollTo(0, 0));
    const primary = editor.locator("[data-main-preview]");
    const bounds = await primary.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const header = document.querySelector(".library-header")!.getBoundingClientRect();
      const clippedBy: string[] = [];
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent); const box = parent.getBoundingClientRect();
        if (/(clip|hidden|auto|scroll)/.test(style.overflowY) && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)) clippedBy.push(`${parent.tagName}:y`);
        if (/(clip|hidden|auto|scroll)/.test(style.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) clippedBy.push(`${parent.tagName}:x`);
      }
      return { top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height, headerBottom: header.bottom, clippedBy, overflow: document.documentElement.scrollWidth > innerWidth, scroll: scrollY };
    });
    expect(bounds.scroll).toBe(0);
    expect(bounds.width).toBeGreaterThan(0); expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.top).toBeGreaterThanOrEqual(bounds.headerBottom - 1);
    expect(bounds.bottom).toBeLessThanOrEqual(viewport.height + 1);
    expect(bounds.clippedBy).toEqual([]); expect(bounds.overflow).toBe(false);
    const samples = editor.getByRole("group", { name: "Avatar in context", exact: true });
    for (const size of [16, 32, 64, 128]) {
      const avatar = samples.getByRole("img", { name: `Avatar at ${size} pixels`, exact: true });
      await expect(avatar).toHaveAttribute("width", String(size));
      expect(await avatar.evaluate((element) => element.getBoundingClientRect().width)).toBeCloseTo(size, 0);
    }
    const selected = editor.locator(".avatar-editor-options input:checked");
    await expect(selected).toHaveCount(2);
    for (const input of await selected.all()) {
      expect(await input.evaluate((element) => element.closest("label")?.getAttribute("title"))).toBe(await input.getAttribute("aria-label"));
    }
    if (appearance === "pixel") {
      const paths = await editor.getByRole("img", { name: "Avatar preview", exact: true }).locator(".avatar-glyph-motion path").evaluateAll((nodes) => nodes.map((node) => node.getAttribute("d") ?? ""));
      expect(paths.length).toBeGreaterThan(0);
      for (const path of paths) {
        expect(path).not.toMatch(/[acqst]/i);
        for (const value of path.match(/\d+/g) ?? []) expect(Number(value) % 4).toBe(0);
      }
    }
    const screenshot = `${evidence}/editor-${viewport.width}x${viewport.height}-${appearance}-${theme}.png`;
    // The first-viewport evidence must never scroll the preview into position.
    await page.screenshot({ path: screenshot, animations: "disabled" });
    await testInfo.attach("Editor first viewport", { path: screenshot, contentType: "image/png" });
    const accessibility = await new AxeBuilder({ page }).include(".avatar-editor").analyze();
    expect(accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("custom colors, palette restoration, randomize and reset update the controlled identity", async ({ page }) => {
  const editor = await openEditor(page);
  const initial = await configIn(editor);
  await editor.getByRole("radio", { name: "Citrus pop", exact: true }).check();
  const paletteConfig = await configIn(editor);
  const colors = ["#123456", "#f0c060"];
  for (const [index, color] of colors.entries()) await editColor(editor.getByLabel(`Gradient color ${index + 1}`, { exact: true }), color);
  await expect.poll(async () => (await configIn(editor)).customColors).toEqual(colors);
  await expect(editor.locator(".avatar-editor-selection")).toHaveText("Custom colors");
  await expect(editor.locator(".avatar-editor-palettes input:checked")).toHaveCount(0);
  const preview = editor.getByRole("img", { name: "Avatar preview", exact: true });
  expect(await preview.locator('linearGradient[id$="-gradient"] stop').evaluateAll((nodes) => nodes.map((node) => node.getAttribute("stop-color")))).toEqual(colors);
  await editor.getByRole("button", { name: "Use palette colors", exact: true }).click();
  await expect.poll(() => configIn(editor)).toEqual(paletteConfig);
  await expect(editor.getByRole("radio", { name: "Citrus pop", exact: true })).toBeChecked();
  await editor.getByRole("button", { name: "Randomize avatar", exact: true }).click();
  await expect.poll(() => configIn(editor)).not.toEqual(paletteConfig);
  await editor.getByRole("button", { name: "Reset to default", exact: true }).click();
  await expect.poll(() => configIn(editor)).toEqual(initial);
});

test("copy config and SVG/PNG downloads preserve custom colors and the settled preview while Animate is on", async ({ page, context }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const editor = await openEditor(page, "neobrutalism");
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
  await editor.getByRole("radio", { name: "Citrus pop", exact: true }).check();
  await editColor(editor.getByLabel("Gradient color 1", { exact: true }), "#153c63");
  await editColor(editor.getByLabel("Gradient color 2", { exact: true }), "#f4c76e");
  await editor.getByRole("combobox", { name: "Detail", exact: true }).selectOption("none");
  const config = await configIn(editor);
  await editor.getByRole("button", { name: "Copy config", exact: true }).click();
  expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toEqual(config);
  await expect(editor.getByRole("status")).toHaveText("Configuration copied.");
  const preview = editor.getByRole("img", { name: "Avatar preview", exact: true });
  const previewSvg = await settledPreviewSvg(preview);
  const svgLink = editor.getByRole("link", { name: "Export SVG", exact: true });
  const settledHref = await svgLink.getAttribute("href");
  await editor.getByRole("button", { name: "Animate", exact: true }).click();
  await expect(preview).toHaveAttribute("data-animate", "true");
  await expect(svgLink).toHaveAttribute("href", settledHref!);
  const svgEvent = page.waitForEvent("download"); await svgLink.click();
  const svgDownload = await svgEvent;
  const svg = await readFile((await svgDownload.path())!, "utf8");
  expect(svgDownload.suggestedFilename()).toBe("orangeui-avatar.svg");
  const svgState = await page.evaluate((markup) => {
    const document = new DOMParser().parseFromString(markup, "image/svg+xml");
    return {
      errors: document.querySelectorAll("parsererror").length,
      stops: [...document.querySelectorAll('linearGradient[id$="-gradient"] stop')].map((node) => node.getAttribute("stop-color")),
      animated: document.querySelectorAll("animate, animateTransform, animateMotion, script, foreignObject, style").length,
      opacity: document.querySelector(".avatar-gradient-shift")?.getAttribute("opacity"),
      externalResources: [...document.querySelectorAll("[href]")].map((node) => node.getAttribute("href")).filter((href) => href && !href.startsWith("#")),
    };
  }, svg);
  expect(svgState.errors).toBe(0); expect(svgState.stops).toEqual(config.customColors);
  expect(svgState.animated).toBe(0); expect(svgState.opacity).toBe("0"); expect(svgState.externalResources).toEqual([]);
  const pngEvent = page.waitForEvent("download"); await editor.getByRole("button", { name: "Export PNG", exact: true }).click();
  const pngDownload = await pngEvent;
  const png = await readFile((await pngDownload.path())!);
  expect(pngDownload.suggestedFilename()).toBe("orangeui-avatar.png");
  expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  const decoded = await decodeExport(page, png, svg, previewSvg);
  expect(decoded.width).toBe(256); expect(decoded.height).toBe(256);
  expect(decoded.cornerAlpha).toBe(0); expect(decoded.visiblePixels).toBeGreaterThan(40_000);
  expect(decoded.uniqueColors).toBeGreaterThan(100);
  expect(decoded.svgDifferences).toBe(0); expect(decoded.previewDifferences).toBe(0);
  await svgDownload.saveAs(`${evidence}/custom-export.svg`);
  await pngDownload.saveAs(`${evidence}/custom-export.png`);
  await writeFile(`${evidence}/export-report.json`, JSON.stringify({ config, svgState, decoded }, null, 2));
  await testInfo.attach("Custom PNG export", { path: `${evidence}/custom-export.png`, contentType: "image/png" });
  await expect(editor.getByRole("status")).toHaveText("PNG exported at 256 px.");
});

test("Animate smoothly runs gradient and glyph forward and back; reduced motion settles both", async ({ page }, testInfo) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const editor = await openEditor(page);
  const preview = editor.getByRole("img", { name: "Avatar preview", exact: true });
  const toggle = editor.getByRole("button", { name: "Animate", exact: true });
  await toggle.click(); await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => preview.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(2);
  const timing = await preview.evaluate(async (element) => {
    const animations = element.getAnimations({ subtree: true });
    for (const animation of animations) { animation.pause(); animation.currentTime = 0; }
    await Promise.all(animations.map((animation) => animation.ready));
    return animations.map((animation) => {
      const effect = animation.effect as KeyframeEffect;
      const properties = effect.getTiming();
      return { name: (animation as CSSAnimation).animationName, duration: properties.duration, direction: properties.direction, infinite: properties.iterations === Infinity, easing: getComputedStyle(effect.target!).animationTimingFunction };
    });
  });
  expect(timing.map(({ name }) => name).sort()).toEqual(["avatar-glyph-ping-pong", "avatar-gradient-ping-pong"]);
  for (const item of timing) {
    expect(item.duration).toBe(4000); expect(item.direction).toBe("alternate"); expect(item.infinite).toBe(true);
    expect(item.easing).toBe("cubic-bezier(0.45, 0, 0.55, 1)");
  }
  await page.mouse.move(0, 0);
  const frames: { time: number; opacity: number; transform: string; screenshot?: string; png?: string }[] = [];
  for (const time of [0, 1000, 2000, 4000, 6000, 8000]) {
    const visual = await preview.evaluate(async (element, value) => {
      for (const animation of element.getAnimations({ subtree: true })) animation.currentTime = value;
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      return { opacity: Number(getComputedStyle(element.querySelector(".avatar-gradient-shift")!).opacity), transform: getComputedStyle(element.querySelector(".avatar-glyph-motion")!).transform };
    }, time);
    if (time !== 1000) {
      const screenshot = `${evidence}/animation-${time}ms.png`;
      const png = await preview.screenshot({ path: screenshot, animations: "allow" });
      frames.push({ time, ...visual, screenshot, png: png.toString("base64") });
      await testInfo.attach(`Animated avatar at ${time} ms`, { path: screenshot, contentType: "image/png" });
    } else frames.push({ time, ...visual });
  }
  const at = (time: number) => frames.find((frame) => frame.time === time)!;
  expect(at(0).opacity).toBe(0); expect(at(4000).opacity).toBe(1); expect(at(8000).opacity).toBe(0);
  expect(at(1000).opacity).toBeGreaterThan(0); expect(at(1000).opacity).toBeLessThan(0.25);
  expect(at(2000).opacity).toBeCloseTo(0.5, 3); expect(at(6000).opacity).toBeCloseTo(0.5, 3);
  expect(at(0).transform).not.toBe(at(2000).transform); expect(at(2000).transform).not.toBe(at(4000).transform);
  expect(at(8000).transform).toBe(at(0).transform); expect(at(6000).transform).toBe(at(2000).transform);
  const differences = await page.evaluate(async (snapshots) => {
    const decoded = await Promise.all(snapshots.map(async ({ time, png }) => {
      const bytes = Uint8Array.from(atob(png), (character) => character.charCodeAt(0));
      const image = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
      const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
      const context = canvas.getContext("2d")!; context.drawImage(image, 0, 0);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
      image.close(); return { time, pixels };
    }));
    function compare(a: number, b: number) {
      const first = decoded.find((frame) => frame.time === a)!.pixels;
      const second = decoded.find((frame) => frame.time === b)!.pixels;
      let count = 0; for (let index = 0; index < first.length; index++) if (first[index] !== second[index]) count++;
      return count;
    }
    return { forward: compare(0, 4000), midpoint: compare(0, 2000), return: compare(0, 8000), midpointReturn: compare(2000, 6000) };
  }, frames.filter((frame) => frame.png).map(({ time, png }) => ({ time, png: png! })));
  expect(differences.forward).toBeGreaterThan(100); expect(differences.midpoint).toBeGreaterThan(100);
  expect(differences.return).toBe(0); expect(differences.midpointReturn).toBe(0);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(toggle).toBeDisabled(); await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(editor.getByText("Animation is off with reduced motion.", { exact: true })).toBeVisible();
  await expect.poll(() => preview.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await preview.locator(".avatar-gradient-shift").evaluate((element) => getComputedStyle(element).opacity)).toBe("0");
  expect(await preview.locator(".avatar-glyph-motion").evaluate((element) => getComputedStyle(element).transform)).toBe("none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(toggle).toBeEnabled();
  if (await toggle.getAttribute("aria-pressed") === "true") await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect.poll(() => preview.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  await writeFile(`${evidence}/animation-report.json`, JSON.stringify({ timing, frames: frames.map(({ time, opacity, transform, screenshot }) => ({ time, opacity, transform, screenshot })), differences }, null, 2));
});
