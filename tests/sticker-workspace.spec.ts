import { expect, test, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";

const evidence = process.env.STICKER_REVIEW_DIR || ".impeccable/review/stickers-v4/captures";
async function noScroll(element: Locator) {
  await expect.poll(() => element.evaluate(node => node.scrollHeight <= node.clientHeight + 1 && node.scrollWidth <= node.clientWidth + 1)).toBe(true);
}
async function withinViewport(element: Locator, page: Page) {
  const rect = await element.boundingBox(), viewport = page.viewportSize()!;
  expect(rect).not.toBeNull(); expect(rect!.x).toBeGreaterThanOrEqual(-1); expect(rect!.y).toBeGreaterThanOrEqual(-1);
  expect(rect!.x + rect!.width).toBeLessThanOrEqual(viewport.width + 1); expect(rect!.y + rect!.height).toBeLessThanOrEqual(viewport.height + 1);
}
async function downloadText(page: Page, control: Locator) {
  const waiting = page.waitForEvent("download"); await control.click(); const download = await waiting;
  const stream = await download.createReadStream(), chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
async function canvasJson(page: Page) {
  const workspace = page.getByRole("dialog", { name: "Sticker playground", exact: true });
  await workspace.getByRole("combobox", { name: "Canvas code format" }).selectOption("JSON");
  return JSON.parse(await downloadText(page, workspace.getByRole("button", { name: "Download JSON canvas" })));
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
    await workspace.getByRole("combobox", { name: "Canvas code format" }).selectOption(format);
    const source = await downloadText(page, workspace.getByRole("button", { name: `Download ${format} canvas` }));
    expect(source).toContain("#102030"); expect(source).toContain("#f4f3f0");
    if (format === "HTML") { expect(source).toContain("My canvas &lt;3"); expect(source).toContain("<!doctype html>"); }
  }
  const arrangement = await board.locator("[data-placement]").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
  await workspace.getByRole("button", { name: "Close playground" }).click(); await expect(launcher).toBeFocused();
  await launcher.click(); expect(await board.locator("[data-placement]").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")))).toEqual(arrangement);
  await workspace.getByRole("button", { name: "Clear canvas", exact: true }).click(); await expect(board.locator("[data-placement]")).toHaveCount(0);
  await workspace.getByRole("button", { name: "Undo last canvas change" }).click(); await expect(board.locator("[data-placement]")).toHaveCount(5);
});

test("clean fullscreen preview preserves the design and exits safely when browser fullscreen is unavailable", async ({ page }) => {
  await page.addInitScript(() => { HTMLElement.prototype.requestFullscreen = () => Promise.reject(new Error("Fullscreen unavailable")); });
  await page.setViewportSize({ width: 1536, height: 772 }); await page.goto("/stickers");
  await page.getByRole("button", { name: "Playground", exact: true }).click();
  const workspace = page.getByRole("dialog", { name: "Sticker playground", exact: true }), board = workspace.locator(".sticker-playground-board");
  await workspace.getByRole("button", { name: "Add Essential heart", exact: true }).click();
  await workspace.getByLabel("Sticker X position", { exact: true }).fill("-5");
  const before = await board.locator("[data-placement]").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")));
  const editingWidth = (await board.boundingBox())!.width, launcher = workspace.getByRole("button", { name: "Preview fullscreen" });
  await launcher.click(); await expect(workspace.locator(".sticker-playground")).toHaveAttribute("data-preview", "true");
  await expect(workspace.getByRole("group", { name: "Playground tools" })).toHaveCount(0);
  await expect(workspace.getByRole("combobox", { name: "Canvas code format" })).toHaveCount(0);
  await expect(workspace.getByRole("button", { name: "Remove Essential heart from canvas" })).toHaveCount(0);
  await expect.poll(async () => (await board.boundingBox())!.width).toBeGreaterThan(editingWidth);
  await noScroll(workspace); await withinViewport(board, page);
  await workspace.getByRole("button", { name: "Animate Essential heart", exact: true }).focus();
  await page.keyboard.press("ArrowRight"); await page.keyboard.press("Delete");
  expect(await board.locator("[data-placement]").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")))).toEqual(before);
  await page.keyboard.press("Escape"); await expect(launcher).toBeFocused();
  await expect(workspace.locator(".sticker-playground")).toHaveAttribute("data-preview", "false");
  expect(await board.locator("[data-placement]").evaluateAll(nodes => nodes.map(node => node.getAttribute("style")))).toEqual(before);
  await expect(workspace.getByRole("button", { name: "Remove Essential heart from canvas" })).toBeVisible();
});

test("hover lifts and wiggles artwork while reduced motion keeps it still", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 772 }); await page.emulateMedia({ reducedMotion: "no-preference" }); await page.goto("/stickers");
  const card = page.getByRole("button", { name: "Preview Essential heart", exact: true }), art = card.locator(".orange-sticker-front");
  await card.hover();
  const frames = await art.evaluate(element => element.getAnimations().flatMap(animation => (animation.effect as KeyframeEffect).getKeyframes().map(frame => frame.transform)));
  expect(frames).toContain("translateY(-6px) rotate(-3deg)"); expect(frames).toContain("translateY(-6px) rotate(2deg)");
  await expect.poll(() => art.evaluate(element => new DOMMatrix(getComputedStyle(element).transform).m42)).toBeLessThan(-5);
  await card.click(); await expect(card.locator(".orange-sticker-sheet")).toHaveAttribute("data-motion", "bounce");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect.poll(() => art.evaluate(element => getComputedStyle(element).transform)).toBe("none");
  expect(await art.evaluate(element => element.getAnimations().length)).toBe(0);
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
    if (width === 320 && height === 568) expect((await workspace.locator(".sticker-playground-board").boundingBox())!.width).toBeGreaterThanOrEqual(270);
    await page.screenshot({ path: `${evidence}/${prefix}-playground.png` });
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
    await page.screenshot({ path: `${evidence}/${prefix}-preview.png` });
    await workspace.getByRole("button", { name: "Back to editor" }).click();
    await workspace.getByRole("button", { name: "Close playground" }).click();
    if (width === 1536) { const scan = await new AxeBuilder({ page }).include(".sticker-gallery").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze(); accessibility.push(...scan.violations); }
  }
  await writeFile(`${evidence}/accessibility.json`, JSON.stringify(accessibility, null, 2)); expect(accessibility).toEqual([]); expect(errors).toEqual([]);
});
