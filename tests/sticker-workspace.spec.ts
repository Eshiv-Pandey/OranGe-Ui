import { expect, test, type Download, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { STICKERS } from "../components/ui/sticker-artwork";

const evidence = ".impeccable/review/stickers-v2";
async function contents(download: Download) {
  expect(await download.failure()).toBeNull();
  const stream = await download.createReadStream();
  expect(stream).not.toBeNull();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString("utf8");
}
async function selectCollection(page: Page, category: string, count: number) {
  await page.getByRole("group", { name: "Sticker collections" }).getByRole("button", { name: `${category} ${count}`, exact: true }).click();
}
async function closeEditor(page: Page) {
  await page.getByRole("button", { name: "Close sticker editor", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
async function assertArtworkFit(artboard: Locator) {
  const dimensions = await artboard.evaluate(element => {
    const board = element.getBoundingClientRect(), art = element.querySelector(".orange-sticker")!.getBoundingClientRect();
    return { left: art.left - board.left, top: art.top - board.top, right: board.right - art.right, bottom: board.bottom - art.bottom, width: board.width, height: board.height };
  });
  expect(dimensions.left).toBeGreaterThanOrEqual(20);
  expect(dimensions.top).toBeGreaterThanOrEqual(20);
  expect(dimensions.right).toBeGreaterThanOrEqual(20);
  expect(dimensions.bottom).toBeGreaterThanOrEqual(20);
}

async function pauseWorstCanvasMotion(placement: Locator) {
  return placement.locator(".orange-sticker-sheet").evaluate(element => {
    const animation = element.getAnimations()[0];
    if (!animation) throw new Error("Expected a real canvas click animation");
    animation.pause();
    const board = element.closest(".sticker-playground-board")!.getBoundingClientRect();
    let worst = { time: 0, margin: Infinity };
    // Inspect the complete motion, then freeze the most exposed frame for evidence.
    for (let index = 0; index <= 100; index++) {
      animation.currentTime = Number(animation.effect!.getTiming().duration) * index / 100;
      const rect = element.getBoundingClientRect();
      const margin = Math.min(rect.left - board.left, rect.top - board.top, board.right - rect.right, board.bottom - rect.bottom);
      if (margin < worst.margin) worst = { time: Number(animation.currentTime), margin };
    }
    animation.currentTime = worst.time;
    return worst;
  });
}

test("sharp and playful catalogue, real click motion, native editor and portable playground", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.addInitScript(() => localStorage.setItem("orangeui-palette", "light"));
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  await page.goto("/stickers");
  await expect(page.locator(".sticker-install-command").first()).toHaveText("npm install orangeui-stickers@0.1.0");
  await expect(page.locator(".sticker-card")).toHaveCount(70);
  await expect(page.locator('.sticker-card .orange-sticker[data-finish="sharp"]')).toHaveCount(70);
  await selectCollection(page, "Everyday", 20);
  await expect(page.locator(".sticker-card")).toHaveCount(20);
  await page.getByRole("group", { name: "Artwork finish", exact: true }).getByRole("button", { name: "Playful", exact: true }).click();
  await selectCollection(page, "All stickers", 70);
  await expect(page.locator('.sticker-card .orange-sticker[data-finish="playful"]')).toHaveCount(70);
  const originals = STICKERS.filter(sticker => sticker.category !== "Everyday");
  expect(originals).toHaveLength(50);
  for (const sticker of originals) await expect(page.getByRole("button", { name: `Preview ${sticker.title}`, exact: true })).toHaveCount(1);
  await page.getByRole("group", { name: "Artwork finish", exact: true }).getByRole("button", { name: "Sharp", exact: true }).click();
  await page.getByRole("searchbox", { name: "Search stickers", exact: true }).fill("approved");
  await expect(page.locator(".sticker-card")).toHaveCount(1);
  await page.getByRole("button", { name: "Preview Approval seal", exact: true }).click();
  await expect(page.locator(".sticker-selected-title h2")).toHaveText("Approval seal");
  await page.getByRole("searchbox", { name: "Search stickers", exact: true }).fill("");
  const preview = page.locator(".sticker-peel-preview"), sheet = preview.locator(".orange-sticker-sheet");
  for (const motion of ["bounce", "wiggle", "spin", "none"]) {
    await page.getByRole("combobox", { name: "Click animation", exact: true }).selectOption(motion);
    await preview.click();
    await expect(sheet).toHaveAttribute("data-motion", motion);
    expect(await sheet.evaluate(element => getComputedStyle(element).animationName)).toBe(motion === "none" ? "none" : `orange-sticker-${motion}`);
    if (motion !== "none") expect(await sheet.evaluate(element => element.getAnimations().filter(animation => animation.playState === "running").length)).toBeGreaterThan(0);
  }
  await page.getByRole("combobox", { name: "Click animation", exact: true }).selectOption("wiggle");
  const previousSheet = await sheet.elementHandle();
  await preview.click();
  expect(await previousSheet!.evaluate(element => element.isConnected)).toBe(false);
  await expect(sheet).toHaveAttribute("data-motion", "wiggle");
  const edit = page.getByRole("button", { name: "Edit sticker More options", exact: true });
  await edit.click();
  const dialog = page.getByRole("dialog", { name: "Edit Approval seal", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Close sticker editor", exact: true })).toBeFocused();
  await edit.focus();
  await expect(dialog.getByRole("button", { name: "Close sticker editor", exact: true })).toBeFocused();
  const lastDialogControl = dialog.getByRole("button", { name: "Open in playground", exact: true });
  await lastDialogControl.focus(); await page.keyboard.press("Tab");
  // Native dialogs let Tab visit browser chrome, then resume inside the modal.
  if (!await page.evaluate(() => document.hasFocus())) await page.keyboard.press("Tab");
  await expect(dialog.getByRole("button", { name: "Close sticker editor", exact: true })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  if (!await page.evaluate(() => document.hasFocus())) await page.keyboard.press("Shift+Tab");
  await expect(lastDialogControl).toBeFocused();
  await page.keyboard.press("Escape"); await expect(dialog).toHaveCount(0); await expect(edit).toBeFocused();
  await edit.click(); await expect(dialog).toBeVisible();
  await page.mouse.click(4, 4); await expect(dialog).toHaveCount(0); await expect(edit).toBeFocused();
  await edit.click(); await expect(dialog).toBeVisible();
  await dialog.getByRole("slider", { name: "Sticker size", exact: true }).fill("360");
  await dialog.getByRole("slider", { name: "Rotation", exact: true }).fill("45");
  await dialog.getByRole("slider", { name: "Duration", exact: true }).fill("1100");
  await dialog.getByRole("slider", { name: "Intensity", exact: true }).fill("1.5");
  await dialog.getByRole("checkbox", { name: "Soft shadow", exact: true }).uncheck();
  await expect(dialog.locator(".orange-sticker")).toHaveAttribute("data-shadow", "false");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await assertArtworkFit(dialog.locator(".sticker-editor-artboard"));
  await dialog.getByRole("button", { name: "Copy edited sticker React code", exact: true }).click();
  const edited = await page.evaluate(() => navigator.clipboard.readText());
  for (const setting of ['name="approval-seal"', 'finish="sharp"', "size={360}", "rotate={45}", 'motion="wiggle"', "duration={1100}", "intensity={1.5}", "shadow={false}"]) expect(edited).toContain(setting);
  const componentPromise = page.waitForEvent("download"); await dialog.getByRole("button", { name: "Download React component", exact: true }).click();
  const componentDownload = await componentPromise;
  expect(componentDownload.suggestedFilename()).toBe("approval-seal-sticker.tsx");
  const componentSource = await contents(componentDownload); expect(componentSource).toContain("export default function CustomSticker()"); expect(componentSource).toContain("size={360}");
  await closeEditor(page);
  await page.getByRole("button", { name: "Playground", exact: true }).click();
  const board = page.locator(".sticker-playground-board");
  await expect(board.locator(".sticker-playground-placement")).toHaveCount(4);
  await page.getByRole("button", { name: "Add Approval seal", exact: true }).click();
  await expect(board.locator(".sticker-playground-placement")).toHaveCount(5);
  const placed = board.locator('[data-placement="placed-1"]'), placedSticker = placed.locator(".orange-sticker"), placedSheet = placed.locator(".orange-sticker-sheet");
  await expect(placedSticker).toHaveAttribute("data-finish", "sharp");
  await expect(placedSticker).toHaveAttribute("data-shadow", "false");
  await page.getByRole("group", { name: "Canvas code format", exact: true }).getByRole("button", { name: "JSON", exact: true }).click();
  let saved = JSON.parse(await page.locator(".sticker-playground-code").innerText());
  expect(saved.placements.at(-1)).toMatchObject({ name: "approval-seal", size: 360, rotate: 45, motion: "wiggle", duration: 1100, intensity: 1.5, shadow: false, finish: "sharp" });
  const beforeDrag = { x: saved.placements.at(-1).x, y: saved.placements.at(-1).y };
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await placedSticker.click(); await expect(placedSheet).toHaveAttribute("data-motion", "wiggle");
  expect(await placedSheet.evaluate(element => getComputedStyle(element).animationName)).toBe("orange-sticker-wiggle");
  await page.emulateMedia({ reducedMotion: "reduce" });
  const box = await placed.boundingBox(); expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 + 70, box!.y + box!.height / 2 + 35, { steps: 8 }); await page.mouse.up();
  saved = JSON.parse(await page.locator(".sticker-playground-code").innerText());
  expect(saved.placements.at(-1).x).toBeGreaterThan(beforeDrag.x);
  expect(saved.placements.at(-1).y).toBeGreaterThan(beforeDrag.y);
  expect(saved.placements.at(-1).rotate).toBe(45);
  const dragX = saved.placements.at(-1).x;
  await placedSticker.focus(); await page.keyboard.press("ArrowRight");
  saved = JSON.parse(await page.locator(".sticker-playground-code").innerText()); expect(saved.placements.at(-1).x).toBeGreaterThan(dragX);
  await page.keyboard.press("Delete"); await expect(board.locator(".sticker-playground-placement")).toHaveCount(4);
  await page.getByRole("button", { name: "Undo last canvas change", exact: true }).click(); await expect(board.locator(".sticker-playground-placement")).toHaveCount(5);
  for (const format of ["React", "HTML", "JSON"] as const) {
    await page.getByRole("group", { name: "Canvas code format", exact: true }).getByRole("button", { name: format, exact: true }).click();
    const downloading = page.waitForEvent("download"); await page.getByRole("button", { name: `Download ${format}`, exact: true }).click();
    const download = await downloading;
    expect(download.suggestedFilename()).toBe(`my-sticker-canvas.${format === "React" ? "tsx" : format.toLowerCase()}`);
    const source = await contents(download);
    if (format !== "HTML") expect(source).toContain("approval-seal");
    if (format === "React") expect(source).toContain('from "orangeui-stickers"');
    if (format === "HTML") { expect(source).toContain("<!doctype html>"); expect(source).toContain('aria-label="Animate Approval seal"'); expect(source).toContain('data-duration="1100"'); }
    if (format === "JSON") expect(JSON.parse(source).placements).toHaveLength(5);
  }
  const arrangement = await board.locator(".sticker-playground-placement").evaluateAll(elements => elements.map(element => element.getAttribute("style")));
  await page.getByRole("button", { name: "Collection 70", exact: true }).click();
  await page.getByRole("button", { name: "Playground", exact: true }).click();
  expect(await board.locator(".sticker-playground-placement").evaluateAll(elements => elements.map(element => element.getAttribute("style")))).toEqual(arrangement);
  expect(errors).toEqual([]);
});

test("click motion keeps maximum-size artwork inside every responsive canvas edge", async ({ page }) => {
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/stickers");
    for (const motion of ["spin", "bounce"] as const) {
      await page.getByRole("button", { name: "Collection 70", exact: true }).click();
      await page.getByRole("button", { name: "Preview Essential heart", exact: true }).click();
      await page.getByRole("button", { name: "Edit sticker More options", exact: true }).click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("combobox", { name: "Click animation", exact: true }).selectOption(motion);
      await dialog.getByRole("slider", { name: "Intensity", exact: true }).fill("2");
      await dialog.getByRole("slider", { name: "Sticker size", exact: true }).fill("360");
      await dialog.getByRole("slider", { name: "Rotation", exact: true }).fill("45");
      await closeEditor(page);
      await assertArtworkFit(page.locator(".sticker-live-preview"));
      await page.getByRole("button", { name: "Playground", exact: true }).click();
      await page.getByRole("button", { name: "Add Essential heart", exact: true }).click();
      const board = page.locator(".sticker-playground-board"), placed = board.locator(".sticker-playground-placement").last();
      await board.scrollIntoViewIfNeeded();
      const position = await placed.boundingBox(), boardBox = await board.boundingBox();
      expect(position).not.toBeNull(); expect(boardBox).not.toBeNull();
      await page.mouse.move(position!.x + position!.width / 2, position!.y + position!.height / 2);
      await page.mouse.down(); await page.mouse.move(boardBox!.x + 1, boardBox!.y + 1, { steps: 6 }); await page.mouse.up();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await placed.locator(".orange-sticker").click();
      const worst = await pauseWorstCanvasMotion(placed);
      expect(worst.margin, `${motion} full canvas at ${width}`).toBeGreaterThanOrEqual(-.5);
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
  }
});

test("one inspection batch: both palettes, desktop and phones, gallery editor and playground", async ({ page }) => {
  test.setTimeout(180000);
  await mkdir(evidence, { recursive: true });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errors: string[] = [], accessibility: { surface: string; theme: string; violations: unknown[] }[] = [];
  const mobileLayouts: { theme: string; width: number; firstCardTop: number; firstCardBottom: number; titleLines: number }[] = [];
  page.on("pageerror", error => errors.push(error.message));
  for (const theme of ["light", "dark"]) for (const width of [1440, 390, 320]) {
    const viewport = width === 1440 ? "desktop" : width === 390 ? "mobile" : "small-mobile";
    await page.setViewportSize({ width, height: 1000 });
    await page.addInitScript(value => localStorage.setItem("orangeui-palette", value), theme);
    await page.goto("/stickers"); await expect(page.locator(".sticker-install-command").first()).toHaveText("npm install orangeui-stickers@0.1.0"); await page.evaluate(() => document.fonts.ready);
    await expect(page.locator(".sticker-card")).toHaveCount(70);
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `gallery ${theme} ${width}`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${evidence}/${viewport}-gallery-${theme}.png`, fullPage: true });
    await page.screenshot({ path: `${evidence}/${viewport}-gallery-top-${theme}.png` });
    if (width === 1440) {
      await page.locator(".sticker-grid").screenshot({ path: `${evidence}/all-70-sharp-${theme}.png` });
      for (const finish of ["sharp", "playful"]) {
        await page.getByRole("group", { name: "Artwork finish", exact: true }).getByRole("button", { name: finish === "sharp" ? "Sharp" : "Playful", exact: true }).click();
        await expect(page.locator(`.sticker-card .orange-sticker[data-finish="${finish}"]`)).toHaveCount(70);
        for (const title of ["Essential heart", "Orbit snail", "Miso moth", "Tiny terrarium"]) {
          await page.getByRole("button", { name: `Preview ${title}`, exact: true }).screenshot({ path: `${evidence}/finish-${finish}-${title.toLowerCase().replaceAll(" ", "-")}-${theme}.png` });
        }
        if (finish === "playful") await page.locator(".sticker-grid").screenshot({ path: `${evidence}/all-70-playful-${theme}.png` });
      }
      await page.getByRole("group", { name: "Artwork finish", exact: true }).getByRole("button", { name: "Sharp", exact: true }).click();
      await page.evaluate(() => window.scrollTo(0, 0));
      const scan = await new AxeBuilder({ page }).include(".sticker-gallery").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      if (scan.violations.length) accessibility.push({ surface: "gallery", theme, violations: scan.violations });
    } else {
      await expect(page.locator(".sticker-inspector")).toBeHidden();
      const firstCard = await page.locator(".sticker-card").first().evaluate(element => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom };
      });
      expect(firstCard.bottom, `first sticker fits a 780px phone screen at ${width}`).toBeLessThan(780);
      const title = page.locator(".sticker-gallery-intro h1");
      const titleLines = await title.evaluate(element => {
        // Inline widgets can enlarge line boxes. Count the actual text rows.
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
        const rectangles: { top: number; bottom: number }[] = [];
        while (walker.nextNode()) {
          if (!walker.currentNode.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(walker.currentNode);
          for (const rect of range.getClientRects()) if (rect.width && rect.height) rectangles.push({ top: rect.top, bottom: rect.bottom });
        }
        const rows: { top: number; bottom: number }[] = [];
        for (const rect of rectangles.sort((a, b) => a.top - b.top)) {
          const row = rows.find(candidate => Math.min(candidate.bottom, rect.bottom) - Math.max(candidate.top, rect.top) > Math.min(candidate.bottom - candidate.top, rect.bottom - rect.top) / 2);
          if (row) { row.top = Math.min(row.top, rect.top); row.bottom = Math.max(row.bottom, rect.bottom); }
          else rows.push({ ...rect });
        }
        return rows.length;
      });
      expect(titleLines, `two-line phone title at ${width}`).toBeLessThanOrEqual(2);
      mobileLayouts.push({ theme, width, firstCardTop: firstCard.top, firstCardBottom: firstCard.bottom, titleLines });
    }
    await page.getByRole("button", { name: "Preview Essential heart", exact: true }).click();
    if (width !== 1440) await expect(page.locator(".sticker-peel-preview")).toBeFocused();
    await page.getByRole("button", { name: "Edit sticker More options", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Edit Essential heart", exact: true });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("slider", { name: "Sticker size", exact: true }).fill("360");
    await dialog.getByRole("slider", { name: "Rotation", exact: true }).fill("45");
    await assertArtworkFit(dialog.locator(".sticker-editor-artboard"));
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth), `editor ${theme} ${width}`).toBe(true);
    await dialog.evaluate(element => { element.scrollTop = 0; });
    await page.screenshot({ path: `${evidence}/${viewport}-editor-${theme}.png` });
    if (width === 1440) {
      const scan = await new AxeBuilder({ page }).include(".sticker-editor").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      if (scan.violations.length) accessibility.push({ surface: "editor", theme, violations: scan.violations });
    } else {
      await dialog.locator(".sticker-editor-settings").scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${evidence}/${viewport}-editor-settings-${theme}.png` });
    }
    await closeEditor(page);
    await assertArtworkFit(page.locator(".sticker-live-preview"));
    await page.locator(".sticker-inspector").screenshot({ path: `${evidence}/${viewport}-inspector-large-${theme}.png` });
    if (width !== 1440) {
      await page.getByRole("button", { name: "Back to stickers", exact: true }).click();
      await expect(page.getByRole("button", { name: "Preview Essential heart", exact: true })).toBeFocused();
    }
    await page.getByRole("button", { name: "Playground", exact: true }).click();
    await expect(page.locator(".sticker-playground-board")).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.evaluate(() => document.documentElement.scrollWidth), `playground ${theme} ${width}`).toBeLessThanOrEqual(width);
    await page.screenshot({ path: `${evidence}/${viewport}-playground-${theme}.png`, fullPage: true });
    await page.locator(".sticker-playground").screenshot({ path: `${evidence}/${viewport}-playground-surface-${theme}.png` });
    if (width === 1440) {
      const scan = await new AxeBuilder({ page }).include(".sticker-playground").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
      if (scan.violations.length) accessibility.push({ surface: "playground", theme, violations: scan.violations });
    }
    const firstSticker = page.locator(".sticker-playground-placement .orange-sticker").first();
    await firstSticker.click();
    expect(await firstSticker.locator(".orange-sticker-sheet").evaluate(element => getComputedStyle(element).animationName)).toBe("none");
    await firstSticker.hover();
    expect(await firstSticker.locator(".orange-sticker-front").evaluate(element => getComputedStyle(element).transform)).toBe("none");
    for (const motion of ["spin", "bounce"] as const) {
      await page.getByRole("button", { name: "Collection 70", exact: true }).click();
      await page.getByRole("button", { name: "Preview Essential heart", exact: true }).click();
      await page.getByRole("button", { name: "Edit sticker More options", exact: true }).click();
      const motionEditor = page.getByRole("dialog");
      await motionEditor.getByRole("combobox", { name: "Click animation", exact: true }).selectOption(motion);
      await motionEditor.getByRole("slider", { name: "Intensity", exact: true }).fill("2");
      await motionEditor.getByRole("slider", { name: "Sticker size", exact: true }).fill("360");
      await motionEditor.getByRole("slider", { name: "Rotation", exact: true }).fill("45");
      await closeEditor(page);
      await page.getByRole("button", { name: "Playground", exact: true }).click();
      await page.getByRole("button", { name: "Add Essential heart", exact: true }).click();
      const placed = page.locator(".sticker-playground-placement").last();
      await page.locator(".sticker-playground-board").scrollIntoViewIfNeeded();
      const position = await placed.boundingBox(), boardBox = await page.locator(".sticker-playground-board").boundingBox();
      expect(position).not.toBeNull(); expect(boardBox).not.toBeNull();
      await page.mouse.move(position!.x + position!.width / 2, position!.y + position!.height / 2);
      await page.mouse.down(); await page.mouse.move(boardBox!.x + 1, boardBox!.y + 1, { steps: 6 }); await page.mouse.up();
      await page.emulateMedia({ reducedMotion: "no-preference" });
      await placed.locator(".orange-sticker").click();
      const worst = await pauseWorstCanvasMotion(placed);
      expect(worst.margin, `${motion} full canvas at ${width}`).toBeGreaterThanOrEqual(-.5);
      await page.locator(".sticker-playground-board").screenshot({ path: `${evidence}/${viewport}-edge-${motion}-${theme}.png`, animations: "allow" });
      await page.emulateMedia({ reducedMotion: "reduce" });
    }
  }
  await writeFile(`${evidence}/accessibility.json`, JSON.stringify(accessibility, null, 2));
  await writeFile(`${evidence}/mobile-layout.json`, JSON.stringify(mobileLayouts, null, 2));
  expect(accessibility).toEqual([]);
  expect(errors).toEqual([]);
});
