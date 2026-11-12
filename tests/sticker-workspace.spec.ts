import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const evidence = process.env.STICKER_REVIEW_DIR || ".impeccable/review/stickers-v5/captures";
async function noScroll(element: Locator) {
  await expect.poll(() => element.evaluate(node => node.scrollHeight <= node.clientHeight + 1 && node.scrollWidth <= node.clientWidth + 1)).toBe(true);
}
async function withinViewport(element: Locator, page: Page) {
  const rect = await element.boundingBox(), viewport = page.viewportSize()!;
  expect(rect).not.toBeNull(); expect(rect!.x).toBeGreaterThanOrEqual(-1); expect(rect!.y).toBeGreaterThanOrEqual(-1);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width + 1); expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height + 1);
}
async function singleSearchFocus(input: Locator) {
  await input.focus();
  const styles = await input.evaluate(node => { const input = getComputedStyle(node), wrapper = getComputedStyle(node.parentElement!); return { inputOutline: input.outlineStyle, inputBorder: input.borderWidth, inputShadow: input.boxShadow, outlineWidth: wrapper.outlineWidth, outlineOffset: wrapper.outlineOffset, border: wrapper.borderColor, outline: wrapper.outlineColor }; });
  expect(styles.inputOutline).toBe("none"); expect(styles.inputBorder).toBe("0px"); expect(styles.inputShadow).toBe("none");
  expect(styles.outlineWidth).toBe("1px"); expect(styles.outlineOffset).toBe("0px"); expect(styles.border).toBe(styles.outline);
}
async function downloadText(page: Page, control: Locator) {
  const waiting = page.waitForEvent("download"); await control.click(); const download = await waiting;
  const stream = await download.createReadStream(), chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
async function canvasJson(page: Page) {
  const workspace = page.getByRole("dialog", { name: "Sticker playground", exact: true });
  await workspace.getByRole("radiogroup", { name: "Canvas code format" }).getByRole("radio", { name: "JSON", exact: true }).click();
  return JSON.parse(await downloadText(page, workspace.getByRole("button", { name: "Download JSON canvas" })));
}
async function canvasArrangement(board: Locator) {
  return board.locator("[data-placement]").evaluateAll(nodes => nodes.map(node => {
    const element = node as HTMLElement;
    return { id: element.dataset.placement, x: parseFloat(element.style.left), y: parseFloat(element.style.top), width: parseFloat(element.style.width), layer: Number(element.style.zIndex), rotation: parseFloat(element.style.getPropertyValue("--placement-rotation")) };
  }));
}

test("compact editor and inspector keep controls visible and export all settings", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.setViewportSize({ width: 1536, height: 772 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/stickers"); await expect(page.locator(".sticker-card")).toHaveCount(70);
  expect(await page.locator(".sticker-card").first().evaluate(node => node.getBoundingClientRect().bottom)).toBeLessThan(620);
  await expect(page.getByRole("button", { name: "Playground", exact: true })).toHaveCount(1);
  const inspector = page.locator(".sticker-inspector"); await noScroll(inspector); await withinViewport(inspector, page);
  await expect(inspector.locator("pre")).toHaveCount(0);
  await inspector.getByRole("tab", { name: "Motion", exact: true }).click();
  await inspector.getByRole("combobox", { name: "Click animation" }).selectOption("wiggle");
  await inspector.getByRole("tab", { name: "Appearance", exact: true }).click();
  await inspector.getByRole("slider", { name: "Sticker size", exact: true }).fill("360");
  await inspector.getByRole("slider", { name: "Rotation", exact: true }).fill("45");
  const edit = inspector.getByRole("button", { name: "Edit sticker", exact: true }); await edit.click();
  const dialog = page.getByRole("dialog", { name: "Edit Essential heart", exact: true });
  await expect(dialog).toBeVisible(); await noScroll(dialog); await withinViewport(dialog, page);
  await dialog.locator('input[aria-label="Preview background"]').fill("#123456");
  await expect(dialog.locator(".sticker-editor-artboard")).toHaveAttribute("data-background", "#123456");
  await dialog.getByRole("button", { name: "Mint", exact: true }).click();
  await expect(dialog.locator(".sticker-editor-artboard")).toHaveAttribute("data-background", "#def4d8");
  await dialog.getByRole("tab", { name: "Motion", exact: true }).click();
  await dialog.getByRole("slider", { name: "Duration", exact: true }).fill("1100");
  await dialog.getByRole("slider", { name: "Intensity", exact: true }).fill("1.5");
  await dialog.getByRole("button", { name: "Copy edited sticker React code" }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  for (const setting of ['finish="sharp"', "size={360}", "rotate={45}", 'motion="wiggle"', "duration={1100}", "intensity={1.5}"]) expect(copied).toContain(setting);
  expect(await downloadText(page, dialog.getByRole("button", { name: "Download React component" }))).toContain("export default function CustomSticker");
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(edit).toBeFocused();
  await inspector.getByRole("button", { name: "Copy sticker React code" }).click(); expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("duration={1100}");
});

test("fullscreen canvas supports edge bleed, selected removal, reorder and portable custom colors", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 772 }); await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/stickers"); const launcher = page.getByRole("button", { name: "Playground", exact: true }); await launcher.click();
  const workspace = page.getByRole("dialog", { name: "Sticker playground", exact: true }), board = workspace.locator(".sticker-playground-board");
  await expect(workspace).toBeVisible(); await noScroll(workspace); await withinViewport(workspace, page);
  expect(await workspace.getByRole("button", { name: /^Place / }).count()).toBeGreaterThan(9);
  expect((await board.boundingBox())!.width).toBeGreaterThan(850);
  await workspace.getByRole("button", { name: "Add Essential heart", exact: true }).click();
  const placed = board.locator('[data-placement="placed-1"]'); await expect(placed).toHaveCount(1);
  const start = await placed.boundingBox(), canvas = await board.boundingBox();
  await page.mouse.move(start!.x + start!.width / 2, start!.y + start!.height / 2); await page.mouse.down();
  await page.mouse.move(canvas!.x - 15, canvas!.y + canvas!.height / 2, { steps: 12 }); await page.mouse.up();
  let saved = await canvasJson(page); expect(saved.placements.at(-1).x).toBeLessThan(0);
  const remove = workspace.getByRole("button", { name: "Remove Essential heart from canvas", exact: true }); await expect(remove).toBeVisible();
  const removeBox = await remove.boundingBox(); expect(removeBox!.x).toBeGreaterThanOrEqual(canvas!.x - 1);
  await remove.click(); await expect(placed).toHaveCount(0); await workspace.getByRole("button", { name: "Undo last canvas change" }).click(); await expect(placed).toHaveCount(1);
  await workspace.getByRole("group", { name: "Playground tools" }).getByRole("button", { name: "Layers", exact: true }).click();
  const front = workspace.locator("[data-layer-id]").first(), grip = workspace.getByRole("button", { name: "Drag Checkered daisy layer", exact: true });
  const gripBox = await grip.boundingBox(), frontBox = await front.boundingBox();
  await page.mouse.move(gripBox!.x + gripBox!.width / 2, gripBox!.y + gripBox!.height / 2); await page.mouse.down();
  await page.mouse.move(frontBox!.x + frontBox!.width / 2, frontBox!.y + 4, { steps: 10 }); await page.mouse.up();
  await expect(workspace.locator("[data-layer-id]").first()).toHaveAttribute("data-layer-id", "start-1");
  saved = await canvasJson(page); expect(saved.placements.at(-1).name).toBe("checkered-daisy");
  const adjacent = workspace.locator('[data-layer-id="placed-1"]'), adjacentBox = await adjacent.boundingBox(), downwardGripBox = await grip.boundingBox();
  await page.mouse.move(downwardGripBox!.x + downwardGripBox!.width / 2, downwardGripBox!.y + downwardGripBox!.height / 2); await page.mouse.down();
  await page.mouse.move(adjacentBox!.x + adjacentBox!.width / 2, adjacentBox!.y + adjacentBox!.height - 4, { steps: 10 }); await page.mouse.up();
  await expect(workspace.locator("[data-layer-id]").nth(1)).toHaveAttribute("data-layer-id", "start-1");
  await workspace.getByRole("button", { name: "Undo last canvas change" }).click();
  await expect(workspace.locator("[data-layer-id]").first()).toHaveAttribute("data-layer-id", "start-1");
  const bottom = workspace.locator("[data-layer-id]").last(), bottomBox = await bottom.boundingBox();
  await workspace.locator('[data-layer-id="start-1"]').dragTo(bottom, { sourcePosition: { x: 50, y: 16 }, targetPosition: { x: 50, y: bottomBox!.height - 4 } });
  await expect(workspace.locator("[data-layer-id]").last()).toHaveAttribute("data-layer-id", "start-1");
  saved = await canvasJson(page); expect(saved.placements[0].name).toBe("checkered-daisy");
  await workspace.getByRole("button", { name: "Undo last canvas change" }).click();
  await expect(workspace.locator("[data-layer-id]").first()).toHaveAttribute("data-layer-id", "start-1");
  await workspace.getByRole("group", { name: "Playground tools" }).getByRole("button", { name: "Canvas", exact: true }).click();
  await workspace.locator('input[aria-label="Canvas background"]').fill("#102030");
  await workspace.getByLabel("Canvas text", { exact: true }).fill("My canvas <3");
  saved = await canvasJson(page); expect(saved.background).toBe("#102030"); expect(saved.caption).toBe("My canvas <3");
  await expect(board).toHaveAttribute("data-dark", "true");
  for (const format of ["React", "HTML"] as const) {
    await workspace.getByRole("radiogroup", { name: "Canvas code format" }).getByRole("radio", { name: format, exact: true }).click();
    const source = await downloadText(page, workspace.getByRole("button", { name: `Download ${format} canvas` }));
    expect(source).toContain("#102030"); expect(source).toContain("#f4f3f0");
    if (format === "HTML") { expect(source).toContain("My canvas &lt;3"); expect(source).toContain("<!doctype html>"); }
  }
  const arrangement = await canvasArrangement(board);
  await workspace.getByRole("button", { name: "Close playground" }).click(); await expect(launcher).toBeFocused();
  await launcher.click(); expect(await canvasArrangement(board)).toEqual(arrangement);
  await workspace.getByRole("button", { name: "Clear canvas", exact: true }).click(); await expect(board.locator("[data-placement]")).toHaveCount(0);
  await workspace.getByRole("button", { name: "Undo last canvas change" }).click(); await expect(board.locator("[data-placement]")).toHaveCount(5);
});

for (const fullscreen of ["native", "window fallback"] as const) test(`clean ${fullscreen} preview fills the viewport, moves existing stickers and exports the same layout`, async ({ page, context }) => {
  if (fullscreen === "window fallback") await page.addInitScript(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error("Fullscreen unavailable")); });
  const viewport = { width: 1536, height: 772 };
  await page.setViewportSize(viewport); await page.emulateMedia({ reducedMotion: "no-preference" }); await page.goto("/stickers");
  await page.getByRole("button", { name: "Playground", exact: true }).click();
  const workspace = page.getByRole("dialog", { name: "Sticker playground", exact: true }), board = workspace.locator(".sticker-playground-board");
  await workspace.getByRole("button", { name: "Add Essential heart", exact: true }).click();
  await workspace.getByLabel("Sticker X position", { exact: true }).fill("-5");
  const before = await canvasArrangement(board);
  const editingWidth = (await board.boundingBox())!.width, launcher = workspace.getByRole("button", { name: "Preview fullscreen" });
  await launcher.click(); await expect(workspace.locator(".sticker-playground")).toHaveAttribute("data-preview", "true");
  await expect(workspace.getByRole("group", { name: "Playground tools" })).toHaveCount(0);
  await expect(workspace.getByRole("radiogroup", { name: "Canvas code format" })).toHaveCount(0);
  await expect(workspace.getByRole("button", { name: "Remove Essential heart from canvas" })).toHaveCount(0);
  await expect.poll(async () => (await board.boundingBox())!.width).toBeGreaterThan(editingWidth);
  await noScroll(workspace); await withinViewport(board, page);
  const canvas = (await board.boundingBox())!;
  expect(canvas.x).toBeCloseTo(0, 0); expect(canvas.y).toBeCloseTo(0, 0); expect(canvas.width).toBeCloseTo(viewport.width, 0); expect(canvas.height).toBeCloseTo(viewport.height, 0);
  if (fullscreen === "native") expect(await workspace.locator(".sticker-playground").evaluate(node => document.fullscreenElement === node)).toBe(true);
  const existing = board.locator('[data-placement="start-1"]'), sticker = existing.getByRole("button", { name: "Move Checkered daisy. Drag or use arrow keys.", exact: true }), initial = (await existing.boundingBox())!;
  await page.mouse.move(initial.x + initial.width / 2, initial.y + initial.height / 2); await page.mouse.down();
  await page.mouse.move(canvas.x - 15, canvas.y + canvas.height * .35, { steps: 16 }); await page.mouse.up();
  expect(await existing.locator(".orange-sticker-sheet").getAttribute("data-motion")).toBeNull();
  const dragged = await existing.evaluate(node => ({ x: parseFloat((node as HTMLElement).style.left), y: parseFloat((node as HTMLElement).style.top) }));
  expect(dragged.x).toBeLessThan(0); expect(dragged.y).toBeGreaterThan(24);
  await sticker.focus(); await page.keyboard.press("ArrowRight");
  const moved = await canvasArrangement(board);
  expect(moved).not.toEqual(before);
  await page.keyboard.press("Delete"); await page.keyboard.press("Backspace");
  expect(await canvasArrangement(board)).toEqual(moved);
  const previewPlacements = await board.locator("[data-placement]").evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; }));
  await page.keyboard.press("Escape"); await expect(launcher).toBeFocused();
  await expect(workspace.locator(".sticker-playground")).toHaveAttribute("data-preview", "false");
  expect(await canvasArrangement(board)).toEqual(moved);
  await expect(workspace.getByRole("button", { name: "Remove Checkered daisy from canvas" })).toBeVisible();
  const saved = await canvasJson(page), savedDaisy = saved.placements.find((placement: { name: string }) => placement.name === "checkered-daisy");
  expect(saved.layout).toBe("viewport"); expect(savedDaisy.x).toBeCloseTo(dragged.x + .75, 1); expect(savedDaisy.y).toBeCloseTo(dragged.y, 1);
  await workspace.getByRole("radiogroup", { name: "Canvas code format" }).getByRole("radio", { name: "HTML", exact: true }).click();
  const html = await downloadText(page, workspace.getByRole("button", { name: "Download HTML canvas" })), exported = await context.newPage(), requests: string[] = [];
  exported.on("request", request => requests.push(request.url()));
  await exported.setViewportSize(viewport); await exported.setContent(html);
  const exportedCanvas = exported.locator(".sticker-canvas"), exportedRect = (await exportedCanvas.boundingBox())!;
  expect(exportedRect.x).toBe(0); expect(exportedRect.y).toBe(0); expect(exportedRect.width).toBe(viewport.width); expect(exportedRect.height).toBe(viewport.height);
  const exportedPlacements = await exported.locator(".sticker-position").evaluateAll(nodes => nodes.map(node => { const rect = node.getBoundingClientRect(); return { x: rect.x, y: rect.y, width: rect.width, height: rect.height }; }));
  expect(exportedPlacements).toHaveLength(previewPlacements.length);
  exportedPlacements.forEach((placement, index) => { for (const key of ["x", "y", "width", "height"] as const) expect(placement[key]).toBeCloseTo(previewPlacements[index][key], 0); });
  expect(requests).toEqual([]); await exported.close();
  await workspace.getByRole("button", { name: "Undo last canvas change" }).click();
  expect((await canvasJson(page)).placements.find((placement: { name: string }) => placement.name === "checkered-daisy").x).toBeCloseTo(dragged.x, 1);
  await workspace.getByRole("button", { name: "Undo last canvas change" }).click();
  expect(await canvasArrangement(board)).toEqual(before);
});

test("hover lifts and wiggles artwork while reduced motion keeps it still", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 772 }); await page.emulateMedia({ reducedMotion: "no-preference" }); await page.goto("/stickers");
  const card = page.getByRole("button", { name: "Preview Essential heart", exact: true }), art = card.locator(".orange-sticker-front");
  await card.hover();
  const frames = await art.evaluate(element => element.getAnimations().flatMap(animation => (animation.effect as KeyframeEffect).getKeyframes().map(frame => frame.transform)));
  expect(frames).toContain("translateY(-8px) rotate(-6deg)"); expect(frames).toContain("translateY(-8px) rotate(4deg)");
  await expect.poll(() => art.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42)).toBeLessThan(-7);
  await expect.poll(() => art.evaluate(element => getComputedStyle(element).filter)).toContain("drop-shadow");
  const shadowedSticker = card.locator(".orange-sticker"); await shadowedSticker.evaluate(element => element.setAttribute("data-shadow", "false"));
  await expect.poll(() => art.evaluate(element => getComputedStyle(element).filter)).toBe("none");
  await shadowedSticker.evaluate(element => element.setAttribute("data-shadow", "true"));
  await card.click(); await expect(card.locator(".orange-sticker-sheet")).toHaveAttribute("data-motion", "bounce");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => art.evaluate(element => getComputedStyle(element).transform)).toBe("none");
  await expect.poll(() => art.evaluate(element => getComputedStyle(element).filter)).toBe("none");
  expect(await art.evaluate(element => element.getAnimations().length)).toBe(0);
  await page.emulateMedia({ reducedMotion: "no-preference" }); await page.getByRole("button", { name: "Playground", exact: true }).click();
  const traySticker = page.getByRole("button", { name: "Place Orbit snail", exact: true }), trayArt = traySticker.locator(".orange-sticker-front");
  await traySticker.hover(); await expect.poll(() => trayArt.evaluate(element => getComputedStyle(element).filter)).toContain("drop-shadow");
  await expect.poll(() => trayArt.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42)).toBeLessThan(-7);
  await traySticker.locator(".orange-sticker").evaluate(element => element.setAttribute("data-shadow", "false"));
  await expect.poll(() => trayArt.evaluate(element => getComputedStyle(element).filter)).toBe("none");
  await traySticker.locator(".orange-sticker").evaluate(element => element.setAttribute("data-shadow", "true"));
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => trayArt.evaluate(element => getComputedStyle(element).filter)).toBe("none");
  await expect.poll(() => trayArt.evaluate(element => getComputedStyle(element).transform)).toBe("none");
});

test("one capture batch: compact clean surfaces in both themes and short phones", async ({ page }) => {
  test.setTimeout(180000); await mkdir(evidence, { recursive: true }); await page.emulateMedia({ reducedMotion: "reduce" });
  const accessibility: unknown[] = [], errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  for (const theme of ["light", "dark"]) for (const [width, height] of [[1536,772], [1440,900], [390,844], [320,780], [320,568]]) {
    const prefix = `${width}-${height}-${theme}`; await page.setViewportSize({ width, height });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.goto("/stickers"); await expect(page.locator(".sticker-card")).toHaveCount(70); await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    if (width === 320 && height === 568) await withinViewport(page.locator(".sticker-card").first(), page);
    await page.screenshot({ path: `${evidence}/${prefix}-gallery.png` });
    await singleSearchFocus(page.getByRole("searchbox", { name: "Search stickers", exact: true }));
    await page.screenshot({ path: `${evidence}/${prefix}-gallery-focus.png` });
    await page.getByRole("button", { name: "Preview Essential heart", exact: true }).click();
    const inspector = page.locator(".sticker-inspector"); await noScroll(inspector); await withinViewport(inspector, page);
    await withinViewport(inspector.getByRole("button", { name: "Download sticker React code" }), page);
    await withinViewport(inspector.getByRole("link", { name: "Component API" }), page);
    await inspector.screenshot({ path: `${evidence}/${prefix}-inspector.png` });
    await inspector.getByRole("button", { name: "Edit sticker", exact: true }).click();
    const editor = page.getByRole("dialog", { name: "Edit Essential heart", exact: true }); await expect(editor).toBeVisible(); await noScroll(editor); await withinViewport(editor, page);
    await withinViewport(editor.getByRole("button", { name: "Download React component" }), page);
    if (width === 320 && height === 568) expect((await editor.locator(".sticker-editor-artboard").boundingBox())!.height).toBeGreaterThanOrEqual(120);
    await page.screenshot({ path: `${evidence}/${prefix}-editor.png` });
    await editor.getByRole("tab", { name: "Motion", exact: true }).click(); await noScroll(editor);
    await page.screenshot({ path: `${evidence}/${prefix}-editor-motion.png` });
    if (width === 1536) { const scan = await new AxeBuilder({ page }).include(".sticker-editor").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); accessibility.push(...scan.violations); }
    await page.keyboard.press("Escape");
    if (width < 700) await page.getByRole("button", { name: "Back to stickers", exact: true }).click();
    await page.getByRole("button", { name: "Playground", exact: true }).click();
    const workspace = page.getByRole("dialog", { name: "Sticker playground", exact: true }); await noScroll(workspace); await withinViewport(workspace, page);
    const heading = workspace.locator(".sticker-playground-heading"), formats = workspace.getByRole("radiogroup", { name: "Canvas code format" });
    await noScroll(heading); await withinViewport(heading, page); await withinViewport(formats, page); await noScroll(formats);
    for (const control of await heading.getByRole("button").all()) await withinViewport(control, page);
    for (const control of await formats.getByRole("radio").all()) await withinViewport(control, page);
    if (width === 320 && height === 568) expect((await workspace.locator(".sticker-playground-board").boundingBox())!.width).toBeGreaterThanOrEqual(270);
    await page.screenshot({ path: `${evidence}/${prefix}-playground.png` });
    await singleSearchFocus(workspace.getByRole("searchbox", { name: "Find a sticker to place", exact: true }));
    await page.screenshot({ path: `${evidence}/${prefix}-playground-focus.png` });
    await formats.getByRole("radio", { name: "React", exact: true }).focus(); await page.keyboard.press("ArrowRight");
    await expect(formats.getByRole("radio", { name: "HTML", exact: true })).toBeFocused();
    await expect(formats.getByRole("radio", { name: "HTML", exact: true })).toHaveAttribute("aria-checked", "true");
    await expect(workspace.getByRole("button", { name: "Download HTML canvas" })).toBeVisible();
    await heading.screenshot({ path: `${evidence}/${prefix}-formats.png` });
    await workspace.getByRole("button", { name: "Add Essential heart", exact: true }).click();
    await workspace.getByLabel("Sticker X position", { exact: true }).fill("-5"); await workspace.getByLabel("Sticker Y position", { exact: true }).fill("100");
    await expect(workspace.getByRole("button", { name: "Remove Essential heart from canvas", exact: true })).toBeVisible();
    await noScroll(workspace.locator(".sticker-playground-tool-content"));
    await page.screenshot({ path: `${evidence}/${prefix}-playground-edit.png` });
    if (width === 1536) { const scan = await new AxeBuilder({ page }).include(".sticker-playground").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); accessibility.push(...scan.violations); }
    await workspace.getByRole("group", { name: "Playground tools" }).getByRole("button", { name: "Layers", exact: true }).click();
    await page.screenshot({ path: `${evidence}/${prefix}-layers.png` });
    await workspace.getByRole("group", { name: "Playground tools" }).getByRole("button", { name: "Canvas", exact: true }).click();
    await page.screenshot({ path: `${evidence}/${prefix}-canvas.png` });
    await workspace.getByRole("button", { name: "Preview fullscreen" }).click();
    await expect(workspace.locator(".sticker-playground")).toHaveAttribute("data-preview", "true");
    await expect(workspace.getByRole("group", { name: "Playground tools" })).toHaveCount(0);
    await noScroll(workspace); await withinViewport(workspace.locator(".sticker-playground-board"), page);
    const previewBoard = (await workspace.locator(".sticker-playground-board").boundingBox())!;
    expect(previewBoard.width).toBeCloseTo(width, 0); expect(previewBoard.height).toBeCloseTo(height, 0); expect(previewBoard.x).toBeCloseTo(0, 0); expect(previewBoard.y).toBeCloseTo(0, 0);
    await page.screenshot({ path: `${evidence}/${prefix}-preview.png` });
    await workspace.getByRole("button", { name: "Back to editor" }).click();
    await workspace.getByRole("button", { name: "Close playground" }).click();
    if (width === 1536) { const scan = await new AxeBuilder({ page }).include(".sticker-gallery").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); accessibility.push(...scan.violations); }
  }
  await writeFile(`${evidence}/accessibility.json`, JSON.stringify(accessibility, null, 2)); expect(accessibility).toEqual([]); expect(errors).toEqual([]);
});
