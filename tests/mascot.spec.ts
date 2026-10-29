import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { generateMascotConfig, mascotToSvgString, MASCOT_PALETTES, type MascotConfig } from "../components/ui/mascot-art";

const evidence = "out/iteration/mascot-browser";
const sizes = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }];
const appearances = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"] as const;
const kinds = ["dune-hopper", "puddle-puff", "lantern-moth", "moss-snail", "tumble-bird", "cairn-sprite", "burrow-bud", "ribbon-ray"];

test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

async function openCharacters(page: Page, appearance = "polished") {
  await page.goto(`/components/avatar-editor?style=${appearance}`);
  const editor = page.getByTestId("live-demo").getByRole("region", { name: "Customize your avatar", exact: true });
  await editor.getByRole("tab", { name: "Characters", exact: true }).click();
  await page.evaluate(() => document.fonts.ready);
  return editor;
}

function mainMascot(editor: Locator) { return editor.locator("[data-main-preview] .mascot-avatar"); }

async function characterConfig(editor: Locator): Promise<MascotConfig> {
  return JSON.parse(await editor.getByLabel("Character configuration", { exact: true }).textContent() ?? "null") as MascotConfig;
}

async function editColor(input: Locator, color: string) {
  // Native color dialogs are browser chrome; use the real input setter and events.
  await input.evaluate((element, value) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, color);
  await expect(input).toHaveValue(color);
}

async function settledPreviewSvg(preview: Locator) {
  return preview.evaluate((element) => {
    const clone = element.cloneNode(true) as SVGSVGElement;
    const sources = [element, ...element.querySelectorAll("*")];
    const targets = [clone, ...clone.querySelectorAll("*")];
    // Preserve the live preview's artwork, resolving its inherited colors only.
    // CSS motion is deliberately absent from the detached image document.
    targets.forEach((target, index) => {
      for (const attribute of [...target.attributes]) {
        if (attribute.value.includes("var(")) target.setAttribute(attribute.name, attribute.value.replace(/var\((--[\w-]+),\s*(#[\da-f]{6})\)/gi, (_match, name: string, fallback: string) => getComputedStyle(sources[index]).getPropertyValue(name).trim() || fallback));
      }
    });
    clone.setAttribute("width", "256"); clone.setAttribute("height", "256");
    clone.removeAttribute("style"); clone.removeAttribute("class");
    return new XMLSerializer().serializeToString(clone);
  });
}

async function decodeExports(page: Page, png: Buffer, svg: string, preview: string) {
  return page.evaluate(async ({ encoded, svg, preview }) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!;
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let visiblePixels = 0;
    const colors = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4) if (pixels[index + 3]) {
      visiblePixels++;
      colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`);
    }
    async function compare(source: string) {
      const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
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
    const digest = await crypto.subtle.digest("SHA-256", pixels);
    const report = { width: bitmap.width, height: bitmap.height, cornerAlpha: pixels[3], visiblePixels, colors: colors.size,
      svgDifferences: await compare(svg), previewDifferences: await compare(preview),
      pixelDigest: [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("") };
    bitmap.close();
    return report;
  }, { encoded: png.toString("base64"), svg, preview });
}

for (const size of sizes) for (const appearance of appearances) for (const theme of ["light", "dark"] as const) {
  test(`Characters tab ${size.width}x${size.height} ${appearance} ${theme}`, async ({ page }, info) => {
    await page.setViewportSize(size);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((value) => localStorage.setItem("orangeui-palette", value), theme);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const editor = await openCharacters(page, appearance);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    const mascot = mainMascot(editor);
    await expect(mascot).toHaveAttribute("data-appearance", appearance);
    await expect(mascot).toHaveAttribute("data-motion", "reduced");
    await page.evaluate(() => scrollTo(0, 0));
    const geometry = await mascot.evaluate((element) => {
      const rect = element.getBoundingClientRect();
      const header = document.querySelector(".library-header")!.getBoundingClientRect();
      return { visible: rect.top >= header.bottom && rect.bottom <= innerHeight && rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(geometry).toEqual({ visible: true, overflow: false });
    const screenshot = `${evidence}/characters-${size.width}x${size.height}-${appearance}-${theme}.png`;
    await page.screenshot({ path: screenshot, animations: "disabled" });
    await info.attach("Characters first viewport", { path: screenshot, contentType: "image/png" });
    const accessibility = await new AxeBuilder({ page }).include(".avatar-editor").analyze();
    expect(accessibility.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test("all eight characters and four AI states are available with keyboard reactions", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const editor = await openCharacters(page);
  const mascot = mainMascot(editor);
  for (const kind of kinds) {
    await editor.locator(`input[type="radio"][value="${kind}"]`).check();
    await expect(mascot).toHaveAttribute("data-mascot", kind);
  }
  const first = editor.getByRole("radio", { name: "Dune hopper", exact: true });
  await first.check(); await first.focus(); await first.press("ArrowRight");
  await expect(editor.getByRole("radio", { name: "Puddle puff", exact: true })).toBeChecked();
  await expect(editor.getByRole("radio", { name: "Puddle puff", exact: true })).toBeFocused();
  await expect(mascot).toHaveAttribute("data-mascot", "puddle-puff");
  const state = editor.getByRole("combobox", { name: "Character state", exact: true });
  for (const mood of ["idle", "thinking", "talking", "error"]) {
    await state.selectOption(mood);
    await expect(mascot).toHaveAttribute("data-state", mood);
    await expect(mascot.getByRole("button")).toHaveAccessibleName(new RegExp(mood));
  }
  await state.focus(); await state.press("Home"); await state.press("ArrowDown");
  await expect(state).toHaveValue("thinking");
  await expect(mascot).toHaveAttribute("data-state", "thinking");
  const button = mascot.getByRole("button");
  await button.focus();
  await button.press("Space");
  await expect(button).toBeFocused();
  await expect(mascot.getByRole("status")).toContainText("says hello");
  await button.press("Enter");
  await expect(button).toBeFocused();
  await expect(mascot.getByRole("status")).toContainText("noticed you");
  const pointer = editor.getByRole("checkbox", { name: "Follow pointer", exact: true });
  await pointer.focus(); await pointer.press("Space");
  await expect(pointer).not.toBeChecked(); await expect(pointer).toBeFocused();
  await expect(mascot.getByRole("button")).toHaveCount(0);
  await expect(mascot.getByRole("img", { name: "Mascot preview, thinking", exact: true })).toBeVisible();
  await pointer.press("Space");
  await expect(mascot.getByRole("button", { name: "Mascot preview, thinking", exact: true })).toBeVisible();
  const blink = editor.getByRole("checkbox", { name: "Blink", exact: true });
  await blink.focus(); await blink.press("Space");
  await expect(blink).not.toBeChecked(); await expect(blink).toBeFocused();
});

test("character palette, custom colors, randomize and reset preserve independent identities across keyboard tab switches", async ({ page }) => {
  await page.goto("/components/avatar-editor");
  const editor = page.getByTestId("live-demo").getByRole("region", { name: "Customize your avatar", exact: true });
  const glyphConfig = () => editor.getByLabel("Avatar configuration", { exact: true }).textContent();
  const glyphTab = editor.getByRole("tab", { name: "Glyphs", exact: true });
  const characterTab = editor.getByRole("tab", { name: "Characters", exact: true });
  const initialGlyph = await glyphConfig();
  await editor.locator(".avatar-editor-glyphs input").nth(1).check();
  await editor.getByRole("combobox", { name: "Shape", exact: true }).selectOption("square");
  const angle = editor.getByRole("slider", { name: "Gradient angle", exact: true });
  await angle.focus(); await angle.press("End"); await angle.press("ArrowLeft");
  await expect(angle).toHaveValue("358");
  await editColor(editor.getByLabel("Gradient color 1", { exact: true }), "#abc123");
  const editedGlyph = await glyphConfig();
  expect(editedGlyph).not.toBe(initialGlyph);
  await glyphTab.focus(); await glyphTab.press("ArrowRight");
  await expect(characterTab).toBeFocused(); await expect(characterTab).toHaveAttribute("aria-selected", "true");
  const initialCharacter = await characterConfig(editor);
  await editor.getByRole("radio", { name: "Ribbon ray", exact: true }).check();
  await editor.getByRole("combobox", { name: "Character palette", exact: true }).selectOption("2");
  expect((await characterConfig(editor)).colors).toEqual(MASCOT_PALETTES[2].colors);
  await editColor(editor.getByLabel("Body color", { exact: true }), "#abc789");
  await expect(editor.getByRole("combobox", { name: "Character palette", exact: true })).toHaveValue("-1");
  const editedCharacter = await characterConfig(editor);
  await characterTab.focus(); await characterTab.press("ArrowLeft");
  await expect(glyphTab).toBeFocused(); await expect(glyphTab).toHaveAttribute("aria-selected", "true");
  expect(await glyphConfig()).toBe(editedGlyph);
  await expect(angle).toHaveValue("358");
  await expect(editor.getByLabel("Gradient color 1", { exact: true })).toHaveValue("#abc123");
  await glyphTab.press("ArrowRight");
  expect(await characterConfig(editor)).toEqual(editedCharacter);
  await expect(editor.getByRole("radio", { name: "Ribbon ray", exact: true })).toBeChecked();
  await expect(editor.getByLabel("Body color", { exact: true })).toHaveValue("#abc789");
  await editor.getByRole("button", { name: "Randomize character", exact: true }).click();
  const randomized = await characterConfig(editor);
  expect(randomized).not.toEqual(editedCharacter);
  await expect(mainMascot(editor)).toHaveAttribute("data-mascot", randomized.mascot);
  await editor.getByRole("combobox", { name: "Character state", exact: true }).selectOption("error");
  await editor.getByRole("checkbox", { name: "Follow pointer", exact: true }).uncheck();
  await editor.getByRole("checkbox", { name: "Blink", exact: true }).uncheck();
  await editor.getByRole("button", { name: "Reset character", exact: true }).click();
  expect(await characterConfig(editor)).toEqual(initialCharacter);
  await expect(mainMascot(editor)).toHaveAttribute("data-state", "idle");
  await expect(editor.getByRole("checkbox", { name: "Follow pointer", exact: true })).toBeChecked();
  await expect(editor.getByRole("checkbox", { name: "Blink", exact: true })).toBeChecked();
  await expect(editor.locator(".avatar-editor-actions [role='status']")).toHaveText("Character reset.");
  await characterTab.focus(); await characterTab.press("ArrowLeft");
  expect(await glyphConfig()).toBe(editedGlyph);
});

for (const appearance of appearances) test(`copied character config and downloaded SVG/PNG preserve all expressions in ${appearance}`, async ({ page, context }, info) => {
  // Four expression changes and eight downloads share this aggregate budget.
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const editor = await openCharacters(page, appearance);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
  await editor.getByRole("radio", { name: "Lantern moth", exact: true }).check();
  const customColors = { body: "#f2bf73", accent: "#bd526a", background: "#274956", backgroundEnd: "#172b40", eye: "#34284c" };
  for (const [label, value] of [["Body", customColors.body], ["Accent", customColors.accent], ["Background start", customColors.background], ["Background end", customColors.backgroundEnd], ["Eyes", customColors.eye]]) {
    await editColor(editor.getByLabel(`${label} color`, { exact: true }), value);
  }
  const config = await characterConfig(editor);
  expect(config.colors).toEqual(customColors);
  await editor.getByRole("button", { name: "Copy config", exact: true }).click();
  expect(JSON.parse(await page.evaluate(() => navigator.clipboard.readText()))).toEqual(config);
  await expect(editor.locator(".avatar-editor-actions [role='status']")).toHaveText("Character configuration copied.");
  const reports = [];
  for (const state of ["idle", "thinking", "talking", "error"] as const) {
    await editor.getByRole("combobox", { name: "Character state", exact: true }).selectOption(state);
    const mascot = mainMascot(editor);
    await mascot.getByRole("button").click();
    await expect(mascot.getByRole("status")).not.toBeEmpty();
    const previewSvg = await settledPreviewSvg(mascot.locator("svg"));
    const svgEvent = page.waitForEvent("download");
    await editor.getByRole("button", { name: "Export SVG", exact: true }).click();
    const svgDownload = await svgEvent;
    expect(svgDownload.suggestedFilename()).toBe("orangeui-character.svg");
    const svg = await readFile((await svgDownload.path())!, "utf8");
    expect(svg).not.toMatch(/var\(|currentColor|\banimation\s*:/i);
    const svgState = await page.evaluate((markup) => {
      const document = new DOMParser().parseFromString(markup, "image/svg+xml");
      const ids = new Set([...document.querySelectorAll("[id]")].map((element) => element.id));
      const references = [...markup.matchAll(/url\(#([^)]*)\)/g)].map((match) => match[1]);
      return { errors: document.querySelectorAll("parsererror").length,
        animated: document.querySelectorAll("script, foreignObject, image, style, animate, animateMotion, animateTransform, set").length,
        externalResources: [...document.querySelectorAll("*")].flatMap((element) => [...element.attributes].filter((attribute) => attribute.localName === "href" && !attribute.value.startsWith("#")).map((attribute) => attribute.value)),
        brokenReferences: references.filter((reference) => !ids.has(reference)),
        width: document.documentElement.getAttribute("width"), height: document.documentElement.getAttribute("height") };
    }, svg);
    expect(svgState).toEqual({ errors: 0, animated: 0, externalResources: [], brokenReferences: [], width: "256", height: "256" });
    const pngEvent = page.waitForEvent("download");
    await editor.getByRole("button", { name: "Export PNG", exact: true }).click();
    const pngDownload = await pngEvent;
    expect(pngDownload.suggestedFilename()).toBe("orangeui-character.png");
    const png = await readFile((await pngDownload.path())!);
    expect([...png.subarray(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const decoded = await decodeExports(page, png, svg, previewSvg);
    expect(decoded.width).toBe(256); expect(decoded.height).toBe(256); expect(decoded.cornerAlpha).toBe(0);
    expect(decoded.visiblePixels).toBeGreaterThan(40_000); expect(decoded.colors).toBeGreaterThan(100);
    expect(decoded.svgDifferences).toBe(0); expect(decoded.previewDifferences).toBe(0);
    await svgDownload.saveAs(`${evidence}/character-${appearance}-${state}.svg`);
    await pngDownload.saveAs(`${evidence}/character-${appearance}-${state}.png`);
    reports.push({ state, svgState, decoded });
    await expect(editor.locator(".avatar-editor-actions [role='status']")).toHaveText("PNG exported at 256 px.");
    expect(await characterConfig(editor)).toEqual(config);
  }
  expect(new Set(reports.map(({ decoded }) => decoded.pixelDigest)).size).toBe(4);
  const reportPath = `${evidence}/exports-${appearance}.json`;
  await writeFile(reportPath, JSON.stringify({ config, reports }, null, 2));
  await info.attach("Portable character export pixel comparison", { path: reportPath, contentType: "application/json" });
});

test("eyes follow the pointer while visible and motion freezes offscreen or under reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const editor = await openCharacters(page);
  const mascot = mainMascot(editor);
  await expect(mascot).toHaveAttribute("data-motion", "running");
  const button = mascot.getByRole("button");
  await button.hover();
  await expect.poll(() => mascot.locator(".mascot-idle").evaluate((element) => getComputedStyle(element).animationName)).toBe("mascot-attentive");
  await button.click();
  await expect(mascot.getByRole("status")).toContainText("says hello");
  await expect.poll(() => mascot.locator(".mascot-reaction-layer").evaluate((element) => getComputedStyle(element).animationName)).toBe("mascot-hello");
  const standalone = mascotToSvgString(generateMascotConfig("inline-export"));
  const exportAnimations = await page.evaluate((svg) => {
    const target = document.createElement("div");
    target.innerHTML = svg;
    document.body.append(target);
    const animations = target.getAnimations({ subtree: true }).length;
    target.remove();
    return animations;
  }, standalone);
  expect(exportAnimations).toBe(0);
  const rect = await mascot.boundingBox();
  expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width + 60, rect!.y + rect!.height / 2);
  await expect.poll(() => mascot.evaluate((element) => Number((element as HTMLElement).style.getPropertyValue("--gaze-x")))).toBeGreaterThan(.8);
  const pupil = mascot.locator(".mascot-pupil").first();
  expect(await pupil.evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  const before = await mascot.locator("svg").screenshot();
  await page.mouse.move(Math.max(0, rect!.x - 60), rect!.y + rect!.height / 2);
  await expect.poll(() => mascot.evaluate((element) => Number((element as HTMLElement).style.getPropertyValue("--gaze-x")))).toBeLessThan(-.8);
  expect((await mascot.locator("svg").screenshot()).equals(before)).toBe(false);
  await expect.poll(() => mascot.evaluate((element) => Number((element as HTMLElement).style.getPropertyValue("--blink-scale"))), { timeout: 8000, intervals: [25] }).toBeLessThan(.5);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await expect(mascot).toHaveAttribute("data-motion", "paused");
  const clock = await mascot.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--motion-clock"));
  await page.evaluate(async () => { for (let count = 0; count < 12; count++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve())); });
  expect(await mascot.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--motion-clock"))).toBe(clock);
  expect(await mascot.locator(".mascot-idle").evaluate((element) => getComputedStyle(element).animationPlayState)).toBe("paused");
  await mascot.scrollIntoViewIfNeeded();
  await expect(mascot).toHaveAttribute("data-motion", "running");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(mascot).toHaveAttribute("data-motion", "reduced");
  expect(await mascot.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  expect(await pupil.evaluate((element) => getComputedStyle(element).transform)).toBe("none");
});
