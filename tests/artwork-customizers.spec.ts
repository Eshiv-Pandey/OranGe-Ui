import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const evidence = "out/iteration/task1-customizers";
const appearances = ["polished", "pixel", "neobrutalism", "retro-os", "terminal"] as const;
const viewports = [{ width: 1366, height: 768 }, { width: 1440, height: 900 }, { width: 1920, height: 1080 }, { width: 390, height: 844 }];
const artworks = [
  { slug: "character-avatar", name: "CharacterAvatar", label: "Customize your character", seedLabel: "Character seed", host: ".character-avatar", tabs: ["Parts", "Colors", "Motion"], colorsTab: "Colors", colorLabel: "Accent", pngHeight: 512, svgWidth: 512, pupil: ".character-pupil" },
  { slug: "helmet", name: "Helmet", label: "Customize your helmet", seedLabel: "Helmet seed", host: ".helmet", tabs: ["Design", "Colors", "Motion"], colorsTab: "Colors", colorLabel: "Shell", pngHeight: 512, svgWidth: 512, pupil: ".helmet-pupil" },
  { slug: "mini-driver", name: "MiniDriver", label: "Customize your driver", seedLabel: "Driver seed", host: ".mini-driver", tabs: ["Suit", "Helmet", "Helmet colors", "Motion"], colorsTab: "Suit", colorLabel: "Suit", pngHeight: 640, svgWidth: 480, pupil: ".helmet-pupil" },
] as const;
type Artwork = typeof artworks[number];

test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

async function openCustomizer(page: Page, artwork: Artwork, appearance = "polished") {
  await page.goto(`/components/${artwork.slug}?style=${appearance}`);
  const editor = page.getByTestId("live-demo").getByRole("region", { name: artwork.label, exact: true });
  await expect(editor).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return editor;
}
const preview = (editor: Locator) => editor.locator(".artwork-customizer-artwork svg").first();
const host = (editor: Locator, artwork: Artwork) => editor.locator(`.artwork-customizer-artwork ${artwork.host}`);
const configText = (editor: Locator) => editor.getByRole("textbox", { name: "Configuration JSON", exact: true, includeHidden: true }).inputValue();
const feedback = (editor: Locator) => editor.locator(".artwork-customizer-feedback");

async function editColor(input: Locator, value: string) {
  await input.evaluate((element, color) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, color);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(value);
}

async function settledPreviewSvg(svg: Locator, dimensions: { width: string; height: string }) {
  return svg.evaluate((element, size) => {
    const clone = element.cloneNode(true) as SVGSVGElement;
    const sources = [element, ...element.querySelectorAll("*")];
    [clone, ...clone.querySelectorAll("*")].forEach((target, index) => {
      for (const attribute of [...target.attributes]) if (attribute.value.includes("var(")) {
        target.setAttribute(attribute.name, attribute.value.replace(/var\((--[\w-]+),\s*(#[\da-f]{6})\)/gi, (_match, name: string, fallback: string) => getComputedStyle(sources[index]).getPropertyValue(name).trim() || fallback));
      }
      // The selected visor position is identity, unlike gaze and idle motion.
      if (target.classList.contains("helmet-visor-lift")) {
        const source = sources[index], style = getComputedStyle(source);
        let transform = style.transform;
        // Computed matrix serialization rounds to six decimals. Preserve the
        // matching authored transform so raster comparison retains full precision.
        function inspect(rules: CSSRuleList) {
          for (const rule of [...rules]) {
            if (rule instanceof CSSMediaRule && !matchMedia(rule.conditionText).matches) continue;
            if (rule instanceof CSSStyleRule && rule.style.transform && source.matches(rule.selectorText)) transform = rule.style.transform;
            if (rule instanceof CSSImportRule && rule.styleSheet) inspect(rule.styleSheet.cssRules);
            if ("cssRules" in rule) inspect((rule as CSSGroupingRule).cssRules);
          }
        }
        for (const sheet of [...document.styleSheets]) inspect(sheet.cssRules);
        (target as SVGElement).style.transform = transform;
        (target as SVGElement).style.transformOrigin = style.transformOrigin;
      }
    });
    clone.setAttribute("width", size.width); clone.setAttribute("height", size.height);
    clone.removeAttribute("class"); clone.removeAttribute("style");
    return new XMLSerializer().serializeToString(clone);
  }, dimensions);
}

async function decodeExports(page: Page, png: Buffer, svg: string, settled: string) {
  return page.evaluate(async ({ encoded, svg, settled }) => {
    const bytes = Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0));
    const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/png" }));
    const canvas = document.createElement("canvas"); canvas.width = bitmap.width; canvas.height = bitmap.height;
    const context = canvas.getContext("2d")!; context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let visible = 0, transparent = 0;
    const colors = new Set<string>();
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index + 3]) { visible++; colors.add(`${pixels[index]},${pixels[index + 1]},${pixels[index + 2]}`); }
      else transparent++;
    }
    async function differences(source: string) {
      const url = URL.createObjectURL(new Blob([source], { type: "image/svg+xml" }));
      try {
        const image = new Image(); image.src = url; await image.decode();
        context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const reference = context.getImageData(0, 0, canvas.width, canvas.height).data;
        let count = 0;
        for (let index = 0; index < pixels.length; index++) if (pixels[index] !== reference[index]) count++;
        return count;
      } finally { URL.revokeObjectURL(url); }
    }
    const result = { width: bitmap.width, height: bitmap.height, visible, transparent, colors: colors.size, svgDifferences: await differences(svg), previewDifferences: await differences(settled) };
    bitmap.close(); return result;
  }, { encoded: png.toString("base64"), svg, settled });
}

for (const viewport of viewports) for (const appearance of appearances) for (const theme of ["light", "dark"] as const) {
  test(`customizers ${viewport.width}x${viewport.height} ${appearance} ${theme}`, async ({ page }, info) => {
    await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript((value) => localStorage.setItem("orangeui-palette", value), theme);
    const errors: string[] = []; page.on("pageerror", (error) => errors.push(error.message));
    for (const artwork of artworks) {
    const editor = await openCustomizer(page, artwork, appearance);
    await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
    await expect(editor).toHaveAttribute("data-appearance", appearance);
    await expect(host(editor, artwork)).toHaveAttribute("data-motion", "reduced");
    await page.evaluate(() => scrollTo(0, 0));
    const geometry = await preview(editor).evaluate((element) => {
      const rect = element.getBoundingClientRect(), header = document.querySelector(".library-header")!.getBoundingClientRect();
      const clippedBy: string[] = [];
      for (let parent = element.parentElement; parent; parent = parent.parentElement) {
        const style = getComputedStyle(parent), box = parent.getBoundingClientRect();
        if (/(clip|hidden|auto|scroll)/.test(style.overflowY) && (rect.top < box.top - 1 || rect.bottom > box.bottom + 1)) clippedBy.push(`${parent.tagName}:y`);
        if (/(clip|hidden|auto|scroll)/.test(style.overflowX) && (rect.left < box.left - 1 || rect.right > box.right + 1)) clippedBy.push(`${parent.tagName}:x`);
      }
      return { visible: rect.top >= header.bottom && rect.bottom <= innerHeight && rect.width > 0 && rect.left >= 0 && rect.right <= innerWidth, overflow: document.documentElement.scrollWidth > innerWidth, clippedBy, scroll: scrollY };
    });
    expect(geometry).toEqual({ visible: true, overflow: false, clippedBy: [], scroll: 0 });
    const path = `${evidence}/${artwork.slug}-${viewport.width}x${viewport.height}-${appearance}-${theme}.png`;
    await page.screenshot({ path, animations: "disabled" });
    await info.attach("Customizer first viewport", { path, contentType: "image/png" });
    if (viewport.width === 1366) {
      const audit = await new AxeBuilder({ page }).include(".artwork-customizer").analyze();
      expect(audit.violations.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))).toEqual([]);
    }
    }
    expect(errors).toEqual([]);
  });
}

for (const artwork of artworks) test(`${artwork.slug} controls, keyboard tabs, copy config, randomize and reset`, async ({ page, context }) => {
  test.setTimeout(180_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const editor = await openCustomizer(page, artwork);
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: new URL(page.url()).origin });
  const first = editor.getByRole("tab", { name: artwork.tabs[0], exact: true });
  await first.focus(); await first.press("End");
  await expect(editor.getByRole("tab", { name: "Motion", exact: true })).toBeFocused();
  await expect(editor.getByRole("tab", { name: "Motion", exact: true })).toHaveAttribute("aria-selected", "true");
  await editor.getByRole("tab", { name: "Motion", exact: true }).press("Home");
  await expect(first).toBeFocused();
  const seed = editor.getByRole("textbox", { name: artwork.seedLabel, exact: true });
  await seed.fill(`browser:${artwork.slug}`); const seeded = await configText(editor);
  await seed.fill(`different:${artwork.slug}`); expect(await configText(editor)).not.toBe(seeded);
  await seed.fill(`browser:${artwork.slug}`); expect(await configText(editor)).toBe(seeded);
  for (const tab of artwork.tabs.filter((tab) => tab !== "Motion")) {
    await editor.getByRole("tab", { name: tab, exact: true }).click();
    const panel = editor.getByRole("tabpanel");
    for (const select of await panel.getByRole("combobox").all()) {
      const options = await select.locator("option:not(:disabled)").evaluateAll((nodes) => nodes.map((node) => (node as HTMLOptionElement).value));
      for (const option of options) if (option !== await select.inputValue()) {
        const before = await configText(editor); const artBefore = await preview(editor).innerHTML();
        await select.selectOption(option);
        expect(await configText(editor)).not.toBe(before); expect(await preview(editor).innerHTML()).not.toBe(artBefore);
      }
    }
    for (const input of await panel.locator("input[type='color']").all()) {
      const before = await configText(editor); await editColor(input, "#ab789c");
      expect(await configText(editor)).not.toBe(before);
    }
    for (const input of await panel.getByRole("checkbox").all()) {
      const before = await configText(editor); await input.focus(); await input.press("Space");
      await expect(input).toBeFocused(); expect(await configText(editor)).not.toBe(before);
    }
    const number = panel.getByRole("slider", { name: "Fictional number", exact: true });
    if (await number.count()) { await number.focus(); await number.press("Home"); await number.press("ArrowRight"); await expect(number).toHaveValue("101"); }
    const audit = await new AxeBuilder({ page }).include(".artwork-customizer").analyze(); expect(audit.violations.map(({ id }) => id)).toEqual([]);
  }
  const edited = await configText(editor);
  await editor.getByRole("button", { name: "Copy config", exact: true }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).replace(/\r\n/g, "\n")).toBe(edited.replace(/\r\n/g, "\n"));
  await expect(feedback(editor)).toHaveText("Configuration copied.");
  await editor.getByText("View configuration", { exact: true }).click();
  const json = editor.getByRole("textbox", { name: "Configuration JSON", exact: true });
  await expect(json).toBeVisible(); await expect(json).toHaveAttribute("readonly", "");
  await json.focus(); expect(await json.evaluate((element) => (element as HTMLTextAreaElement).selectionEnd - (element as HTMLTextAreaElement).selectionStart)).toBe(edited.length);
  await editor.getByRole("button", { name: "Randomize", exact: true }).click(); expect(await configText(editor)).not.toBe(edited);
  await editor.getByRole("button", { name: "Reset", exact: true }).click(); expect(await configText(editor)).toBe(seeded);
  await expect(feedback(editor)).toHaveText("Default configuration restored.");
});

for (const artwork of artworks) for (const appearance of appearances) test(`${artwork.slug} portable SVG/PNG export ${appearance}`, async ({ page }, info) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  const editor = await openCustomizer(page, artwork, appearance);
  await editor.getByRole("tab", { name: artwork.colorsTab, exact: true }).click();
  await editColor(editor.locator('input[type="color"]').and(editor.getByLabel(artwork.colorLabel, { exact: true })), "#ab789c");
  if (artwork.slug !== "character-avatar") {
    await editor.getByRole("tab", { name: artwork.slug === "helmet" ? "Design" : "Helmet", exact: true }).click();
    await editor.getByRole("checkbox", { name: "Visor open", exact: true }).check();
  }
  const config = await configText(editor);
  const svgEvent = page.waitForEvent("download"); await editor.getByRole("button", { name: "Export SVG", exact: true }).click();
  const svgDownload = await svgEvent, svg = await readFile((await svgDownload.path())!, "utf8");
  expect(svgDownload.suggestedFilename()).toBe(`${artwork.slug}.svg`);
  expect(svg).not.toMatch(/var\(|currentColor|\banimation\s*:/i);
  const state = await page.evaluate((markup) => {
    const doc = new DOMParser().parseFromString(markup, "image/svg+xml"), ids = new Set([...doc.querySelectorAll("[id]")].map((element) => element.id));
    const refs = [...markup.matchAll(/url\(#([^)]*)\)/g)].map((match) => match[1]);
    const inline = document.createElement("div"); inline.innerHTML = markup; document.body.append(inline);
    const animationCount = inline.getAnimations({ subtree: true }).length; inline.remove();
    return { width: doc.documentElement.getAttribute("width")!, height: doc.documentElement.getAttribute("height")!, errors: doc.querySelectorAll("parsererror").length, active: doc.querySelectorAll("script, foreignObject, image, style, animate, animateMotion, animateTransform, set").length,
      external: [...doc.querySelectorAll("*")].flatMap((element) => [...element.attributes].filter((attribute) => attribute.localName === "href" && !attribute.value.startsWith("#")).map((attribute) => attribute.value)), broken: refs.filter((ref) => !ids.has(ref)), animationCount };
  }, svg);
  expect(Number(state.width)).toBe(artwork.svgWidth); expect(Number(state.height)).toBe(artwork.pngHeight);
  expect({ errors: state.errors, active: state.active, external: state.external, broken: state.broken, animationCount: state.animationCount }).toEqual({ errors: 0, active: 0, external: [], broken: [], animationCount: 0 });
  const settled = await settledPreviewSvg(preview(editor), state);
  const pngEvent = page.waitForEvent("download"); await editor.getByRole("button", { name: "Export PNG", exact: true }).click();
  const pngDownload = await pngEvent, png = await readFile((await pngDownload.path())!);
  expect(pngDownload.suggestedFilename()).toBe(`${artwork.slug}.png`);
  const decoded = await decodeExports(page, png, svg, settled);
  expect(decoded.width).toBe(artwork.svgWidth); expect(decoded.height).toBe(artwork.pngHeight);
  expect(decoded.visible).toBeGreaterThan(40_000); expect(decoded.transparent).toBeGreaterThan(0); expect(decoded.colors).toBeGreaterThan(100);
  expect(decoded.svgDifferences).toBe(0); expect(decoded.previewDifferences).toBe(0);
  expect(await configText(editor)).toBe(config);
  await expect(feedback(editor)).toHaveText("PNG exported.");
  await svgDownload.saveAs(`${evidence}/${artwork.slug}-${appearance}.svg`); await pngDownload.saveAs(`${evidence}/${artwork.slug}-${appearance}.png`);
  const report = `${evidence}/${artwork.slug}-${appearance}-export.json`; await writeFile(report, JSON.stringify({ config: JSON.parse(config), state, decoded }, null, 2));
  await info.attach("Portable export comparison", { path: report, contentType: "application/json" });
});

for (const artwork of artworks) test(`${artwork.slug} actual gaze, blink, keyboard reaction and motion preferences`, async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const editor = await openCustomizer(page, artwork), art = host(editor, artwork);
  await expect(art).toHaveAttribute("data-motion", "running");
  if (artwork.slug !== "character-avatar") {
    const button = art.getByRole("button"); await button.focus(); await button.press("Space"); await expect(button).toBeFocused();
    if (artwork.slug === "helmet") { await expect(art).toHaveAttribute("data-visor-open", "true"); await expect(button).toHaveAttribute("aria-pressed", "true"); }
    else { await expect(art.getByRole("status")).toHaveText("The little driver waves hello."); await button.press("Enter"); await expect(art.getByRole("status")).toHaveText("The little driver waves again."); }
  }
  const rect = await art.boundingBox(); expect(rect).not.toBeNull();
  await page.mouse.move(rect!.x + rect!.width + 60, rect!.y + rect!.height / 2);
  await expect.poll(() => art.evaluate((element) => Number((element as HTMLElement).style.getPropertyValue("--gaze-x")))).toBeGreaterThan(.8);
  expect(await art.locator(artwork.pupil).first().evaluate((element) => getComputedStyle(element).transform)).not.toBe("none");
  await page.mouse.move(Math.max(0, rect!.x - 60), rect!.y + rect!.height / 2);
  await expect.poll(() => art.evaluate((element) => Number((element as HTMLElement).style.getPropertyValue("--gaze-x")))).toBeLessThan(-.8);
  await expect.poll(() => art.evaluate((element) => Number((element as HTMLElement).style.getPropertyValue("--blink-scale"))), { timeout: 8000, intervals: [25] }).toBeLessThan(.5);
  await page.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await expect(art).toHaveAttribute("data-motion", "paused");
  const clock = await art.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--motion-clock"));
  await page.evaluate(async () => { for (let index = 0; index < 12; index++) await new Promise<void>((resolve) => requestAnimationFrame(() => resolve())); });
  expect(await art.evaluate((element) => (element as HTMLElement).style.getPropertyValue("--motion-clock"))).toBe(clock);
  await art.scrollIntoViewIfNeeded(); await expect(art).toHaveAttribute("data-motion", "running");
  await page.emulateMedia({ reducedMotion: "reduce" }); await expect(art).toHaveAttribute("data-motion", "reduced");
  expect(await art.evaluate((element) => element.getAnimations({ subtree: true }).length)).toBe(0);
  const identity = await configText(editor);
  await editor.getByRole("tab", { name: "Motion", exact: true }).click();
  const size = editor.getByRole("slider", { name: "Preview size", exact: true }); await size.focus(); await size.press("Home"); await expect(size).toHaveValue("120");
  expect(await preview(editor).evaluate((element) => element.getBoundingClientRect().height)).toBeCloseTo(120, 0);
  const pointer = editor.getByRole("checkbox", { name: "Follow pointer", exact: true }); await pointer.focus(); await pointer.press("Space"); await expect(pointer).not.toBeChecked();
  if (artwork.slug !== "character-avatar") await expect(art.getByRole("button")).toHaveCount(0);
  const blink = editor.getByRole("checkbox", { name: "Blink", exact: true }); await blink.focus(); await blink.press("Space"); await expect(blink).not.toBeChecked();
  expect(await configText(editor)).toBe(identity);
});

for (const viewport of viewports) test(`catalogue new artwork thumbnails ${viewport.width}x${viewport.height}`, async ({ page }, info) => {
  await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: "reduce" }); await page.goto("/components"); await page.evaluate(() => document.fonts.ready);
  const initial = `${evidence}/catalogue-${viewport.width}x${viewport.height}.png`; await page.screenshot({ path: initial, animations: "disabled" }); await info.attach("Catalogue first viewport", { path: initial, contentType: "image/png" });
  for (const artwork of artworks) {
    await page.getByRole("searchbox", { name: "Search all components", exact: true }).fill(artwork.name);
    const tile = page.locator(`.tile-${artwork.slug}`); await expect(tile).toBeVisible(); await expect(tile.locator(".artwork-customizer")).toHaveCount(0);
    const bounds = await tile.locator(".component-thumbnail svg").first().evaluate((element) => {
      const art = element.getBoundingClientRect(), frame = element.closest(".component-thumbnail")!.getBoundingClientRect();
      return { fits: art.left >= frame.left - 1 && art.right <= frame.right + 1 && art.top >= frame.top - 1 && art.bottom <= frame.bottom + 1, visible: art.width > 40 && art.height > 40, overflow: document.documentElement.scrollWidth > innerWidth };
    });
    expect(bounds).toEqual({ fits: true, visible: true, overflow: false });
    const path = `${evidence}/catalogue-${artwork.slug}-${viewport.width}x${viewport.height}.png`; await page.screenshot({ path, animations: "disabled" }); await info.attach("Filtered artwork thumbnail", { path, contentType: "image/png" });
  }
});
