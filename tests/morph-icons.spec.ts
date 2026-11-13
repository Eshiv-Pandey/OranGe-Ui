import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type Locator } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";

const evidence = process.env.MORPH_EVIDENCE_DIR ?? ".impeccable/review/morph-icons";
const pathFor = (name: string) => `${evidence}/${name}`;
const tile = (page: Page, name: string) => page.locator(`[data-preview-name="${name}"]`);
const state = (item: Locator) => item.locator("svg").getAttribute("data-state");

async function open(page: Page) {
  await page.goto("/components/morphing-icons", { waitUntil: "networkidle" });
  await expect(page.locator("[data-morph-gallery]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page.locator("[data-morph-gallery]");
}
async function changes(item: Locator, from: string | null) { await expect.poll(() => state(item), { timeout: 5000 }).not.toBe(from); }
async function setRange(page: Page, label: string, value: number) {
  const input = page.getByRole("slider", { name: label, exact: true });
  await input.evaluate((element, number) => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, number);
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }, value);
  await expect(input).toHaveValue(String(value));
}

test.beforeAll(async () => { await mkdir(evidence, { recursive: true }); });

test("autoplay pauses on hover, switches on click and resumes after leave or keyboard blur", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  const errors: string[] = []; page.on("pageerror", error => errors.push(error.message));
  const gallery = await open(page), menu = tile(page, "menu");
  await expect(gallery).toHaveAttribute("data-running", "true");
  await changes(menu, await state(menu));
  await menu.hover();
  const hovered = await state(menu);
  await page.waitForTimeout(3200);
  expect(await state(menu)).toBe(hovered);
  await menu.click();
  expect(await state(menu)).not.toBe(hovered);
  const clicked = await state(menu);
  await page.waitForTimeout(3200);
  expect(await state(menu)).toBe(clicked);
  await page.mouse.move(1, 1);
  await changes(menu, clicked);
  await page.keyboard.press("Tab");
  await menu.focus();
  const focused = await state(menu);
  await page.waitForTimeout(3200);
  expect(await state(menu)).toBe(focused);
  await page.keyboard.press("Enter");
  expect(await state(menu)).not.toBe(focused);
  await menu.evaluate(element => (element as HTMLElement).blur());
  await changes(menu, await state(menu));
  await page.getByRole("button", { name: "Pause previews" }).click();
  await expect(gallery).toHaveAttribute("data-running", "false");
  const paused = await state(menu);
  await page.waitForTimeout(3200);
  expect(await state(menu)).toBe(paused);
  await page.getByRole("button", { name: "Resume previews" }).click();
  await changes(menu, paused);
  expect(errors).toEqual([]);
});

test("search, controls and exports retain the selected geometry and portable source", async ({ page, request }) => {
  await page.setViewportSize({ width: 1536, height: 772 });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { (window as unknown as { copied: string }).copied = text; } } });
  });
  await open(page);
  await page.getByRole("button", { name: "Pause previews" }).click();
  const search = page.getByRole("searchbox", { name: "Search morphing icons" });
  await search.fill("not-an-icon");
  await expect(page.getByText("No matching icons.")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await expect(page.locator("[data-preview-name]")).toHaveCount(40);
  await page.getByRole("group", { name: "Icon categories" }).getByRole("button", { name: "Media", exact: true }).click();
  await expect(page.locator("[data-preview-name]")).toHaveCount(7);
  await search.fill("captured");
  await expect(page.locator("[data-preview-name]")).toHaveCount(1);
  await tile(page, "camera").click();
  await page.getByRole("group", { name: "Selected icon state" }).getByRole("button", { name: "Captured", exact: true }).click();
  await setRange(page, "Icon size", 64); await setRange(page, "Stroke", 3); await setRange(page, "Duration", 600);
  const selected = page.locator(".morph-selected-preview svg");
  await expect(selected).toHaveAttribute("width", "64");
  const visual = await selected.evaluate(element => ({ width: element.getBoundingClientRect().width, stroke: getComputedStyle(element).strokeWidth }));
  expect(visual.width).toBe(64); expect(Number.parseFloat(visual.stroke)).toBe(3);
  await page.getByRole("button", { name: "Copy React", exact: true }).click();
  const copied = await page.evaluate(() => (window as unknown as { copied: string }).copied);
  expect(copied).toContain('name="camera"'); expect(copied).toContain("active={true}"); expect(copied).toContain("strokeWidth={3}");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "SVG", exact: true }).click();
  const download = await pending; expect(await download.failure()).toBeNull();
  await download.saveAs(pathFor("camera-custom.svg"));
  const svg = await readFile(pathFor("camera-custom.svg"), "utf8");
  expect(svg).toContain('width="64"'); expect(svg).toContain('stroke-width="3"'); expect(svg).toContain("Camera: Captured");
  expect(svg).not.toMatch(/<script|https?:\/\/(?!www.w3.org)|\/fonts\//);
  const feedbackPanel = await page.locator(".workspace-inspector-body").evaluate(element => ({ client: element.clientHeight, scroll: element.scrollHeight }));
  expect(feedbackPanel.scroll).toBeLessThanOrEqual(feedbackPanel.client);
  const zipResponse = await request.get("/api/components/morphing-icons?style=polished");
  expect(zipResponse.ok()).toBe(true);
  const files = unzipSync(await zipResponse.body());
  for (const name of ["morphing-icons.tsx", "morph-icon-motion.ts", "morph-icon-geometry.ts", "morph-icons-navigation.ts", "morph-icons-media.ts"]) expect(files[`components/ui/${name}`]).toBeTruthy();
  expect(strFromU8(files["Example.tsx"])).toContain("useState");
  const registryResponse = await request.get("/r/morphing-icons.json?style=polished");
  expect(registryResponse.ok()).toBe(true);
  const registry = await registryResponse.json();
  expect(registry.files.some((item: { path: string }) => item.path.endsWith("morph-icons-media.ts"))).toBe(true);
  await search.fill(""); await search.focus();
  const borders = await search.evaluate(element => ({ inputOutline: getComputedStyle(element).outlineStyle, wrapperOutline: getComputedStyle(element.parentElement!).outlineWidth }));
  expect(borders.inputOutline).toBe("none"); expect(borders.wrapperOutline).toBe("1px");
});

test("touch holds a preview until resume, offscreen playback suspends and reduced motion stays manual", async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "no-preference", baseURL: process.env.MORPH_PREVIEW_URL ?? "http://127.0.0.1:3160" });
  const page = await context.newPage(), gallery = await open(page), menu = tile(page, "menu");
  await menu.tap(); const held = await state(menu);
  await page.waitForTimeout(3200); expect(await state(menu)).toBe(held);
  await menu.tap(); expect(await state(menu)).not.toBe(held);
  await page.getByRole("button", { name: "Resume previews" }).tap();
  await changes(menu, await state(menu));
  await page.locator("#component-api").scrollIntoViewIfNeeded();
  await expect(gallery).toHaveAttribute("data-running", "false");
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(gallery).toHaveAttribute("data-running", "true");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(gallery).toHaveAttribute("data-running", "false");
  await expect(page.getByRole("button", { name: "Motion off: reduced motion is on" })).toBeDisabled();
  const quiet = await state(menu);
  await page.waitForTimeout(3200); expect(await state(menu)).toBe(quiet);
  await menu.tap(); expect(await state(menu)).not.toBe(quiet);
  await context.close();
});

test("both themes fit desktop and mobile, with accessible controls and valid captures", async ({ page }) => {
  const records: unknown[] = [];
  for (const [width, height] of [[1440, 900], [1536, 772], [390, 844], [320, 568]]) {
    await page.setViewportSize({ width, height });
    for (const theme of ["light", "dark"]) {
      await open(page);
      await page.evaluate(theme => { localStorage.setItem("orangeui-palette", theme); document.documentElement.dataset.theme = theme; }, theme);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.evaluate(() => window.scrollTo(0, 0));
      const geometry = await page.evaluate(() => {
        const gallery = document.querySelector<HTMLElement>("[data-morph-gallery]")!, grid = document.querySelector<HTMLElement>(".morph-icons-grid")!, sidebar = document.querySelector<HTMLElement>(".workspace-inspector-body")!, last = document.querySelector<HTMLElement>(".morph-icon-feedback")!;
        return { width: innerWidth, scrollWidth: document.documentElement.scrollWidth, icons: grid.children.length, gridHeight: grid.getBoundingClientRect().height, galleryHeight: gallery.getBoundingClientRect().height, sidebarClient: sidebar.clientHeight, sidebarScroll: sidebar.scrollHeight, lastBottom: last.getBoundingClientRect().bottom, sidebarBottom: sidebar.getBoundingClientRect().bottom };
      });
      expect.soft(geometry.scrollWidth).toBeLessThanOrEqual(width + 1); expect.soft(geometry.icons).toBe(40);
      expect.soft(geometry.sidebarScroll).toBeLessThanOrEqual(geometry.sidebarClient);
      if (width > 720) expect.soft(geometry.lastBottom).toBeLessThanOrEqual(geometry.sidebarBottom + 1);
      const violations = (await new AxeBuilder({ page }).include(".component-workspace").analyze()).violations;
      expect.soft(violations).toEqual([]);
      const filename = `${width}-${height}-${theme}.png`;
      await page.screenshot({ path: pathFor(filename), fullPage: true, animations: "disabled" });
      await page.screenshot({ path: pathFor(`${width}-${height}-${theme}-preview.png`), animations: "disabled" });
      records.push({ width, height, theme, filename, geometry, accessibilityViolations: violations.length });
    }
  }
  await writeFile(pathFor("layout-accessibility.json"), JSON.stringify(records, null, 2));
});

test("authored morphs stay continuous through long transitions and rapid reversal", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await page.getByRole("button", { name: "Pause previews" }).click();
  await setRange(page, "Icon size", 96);
  await setRange(page, "Duration", 600);
  const records = [];
  for (const name of ["menu", "arrow", "layout", "play-pause", "microphone", "sun-moon", "copy", "send"]) {
    await page.getByRole("searchbox", { name: "Search morphing icons" }).fill(name);
    await tile(page, name).click();
    const picker = page.getByRole("group", { name: "Selected icon state" });
    await picker.getByRole("button").first().click();
    await page.waitForTimeout(650);
    const forward = await page.locator(".morph-selected-preview").evaluate(async element => {
      const button = element as HTMLButtonElement;
      const snapshot = () => ({ svg: button.querySelector("svg")!.outerHTML, paths: [...button.querySelectorAll("path")].map(path => [path.getAttribute("d"), path.getAttribute("opacity"), path.getAttribute("transform"), path.getAttribute("stroke-dashoffset")]) });
      const initial = snapshot();
      button.click();
      const immediate = snapshot();
      const begin = performance.now(), frames = [{ elapsed: 0, ...initial }];
      for (const target of [60, 120, 220, 360, 650]) {
        await new Promise<void>(resolve => { const tick = () => performance.now() - begin >= target ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick); });
        frames.push({ elapsed: Math.round(performance.now() - begin), ...snapshot() });
      }
      return { initial, immediate, frames };
    });
    expect(forward.immediate.paths, `${name}: starting must preserve displayed geometry`).toEqual(forward.initial.paths);
    expect(forward.frames.at(-1)!.paths, `${name}: alternate geometry must differ`).not.toEqual(forward.initial.paths);
    await picker.getByRole("button").first().click();
    await page.waitForTimeout(650);
    const reverse = await page.locator(".morph-selected-preview").evaluate(async element => {
      const button = element as HTMLButtonElement;
      const snapshot = () => ({ svg: button.querySelector("svg")!.outerHTML, paths: [...button.querySelectorAll("path")].map(path => [path.getAttribute("d"), path.getAttribute("opacity"), path.getAttribute("transform"), path.getAttribute("stroke-dashoffset")]) });
      const initial = snapshot(), begin = performance.now(), frames = [{ elapsed: 0, ...initial }];
      button.click();
      await new Promise<void>(resolve => { const tick = () => performance.now() - begin >= 140 ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick); });
      const before = snapshot();
      frames.push({ elapsed: Math.round(performance.now() - begin), ...before });
      button.click();
      const after = snapshot();
      for (const target of [220, 320, 480, 650]) {
        await new Promise<void>(resolve => { const tick = () => performance.now() - begin >= target ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick); });
        frames.push({ elapsed: Math.round(performance.now() - begin), ...snapshot() });
      }
      return { initial, before, after, frames };
    });
    expect(reverse.after.paths, `${name}: reversal must preserve displayed geometry`).toEqual(reverse.before.paths);
    expect(reverse.before.paths, `${name}: reversal must happen during movement`).not.toEqual(reverse.initial.paths);
    expect(reverse.frames.at(-1)!.paths, `${name}: reversal must return to initial geometry`).toEqual(reverse.initial.paths);
    records.push({ name, forward, reverse });
  }
  await writeFile(pathFor("timed-motion.json"), JSON.stringify(records, null, 2));
  const sheet = await page.context().newPage();
  await sheet.setViewportSize({ width: 860, height: 1200 });
  for (const direction of ["forward", "reverse"] as const) {
    await sheet.setContent(`<html><head><style>body{margin:0;padding:24px;background:#f8f8f8;color:#171717;font:12px Arial,sans-serif}h1{font-size:18px;margin:0 0 24px}section{margin-bottom:20px}h2{font-size:13px;margin:0 0 10px}.frames{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}.frame{display:flex;flex-direction:column;align-items:center;gap:10px;padding:12px;background:white}svg{color:#171717}p{margin:0;color:#666}</style></head><body><h1>600ms morphs: ${direction === "forward" ? "forward transition" : "reversed at 140ms"}</h1>${records.map(record => `<section><h2>${record.name}</h2><div class="frames">${record[direction].frames.map(frame => `<div class="frame">${frame.svg}<p>${frame.elapsed}ms</p></div>`).join("")}</div></section>`).join("")}</body></html>`);
    await sheet.screenshot({ path: pathFor(`timed-${direction}.png`), fullPage: true });
  }
  await sheet.close();
});

test("listening bars and standalone typing dots animate while hovered and respect pause and reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  await setRange(page, "Icon size", 96);
  const records = [];
  for (const name of ["microphone", "message"]) {
    await page.getByRole("searchbox", { name: "Search morphing icons" }).fill(name);
    await tile(page, name).click();
    await page.getByRole("group", { name: "Selected icon state" }).getByRole("button").last().click();
    const selected = page.locator(".morph-selected-preview");
    await selected.hover();
    await page.waitForTimeout(750);
    const frames = await selected.evaluate(async element => {
      const svg = element.querySelector("svg")!, begin = performance.now();
      const snapshot = () => ({ elapsed: Math.round(performance.now() - begin), svg: svg.outerHTML, state: svg.getAttribute("data-state"), paths: [...svg.querySelectorAll("path")].map(path => ({ d: path.getAttribute("d"), opacity: Number(path.getAttribute("opacity")), transform: path.getAttribute("transform") })) });
      const frames = [snapshot()];
      for (const target of [150, 300, 450, 600, 750, 900, 1100]) {
        await new Promise<void>(resolve => { const tick = () => performance.now() - begin >= target ? resolve() : requestAnimationFrame(tick); requestAnimationFrame(tick); });
        frames.push(snapshot());
      }
      return frames;
    });
    expect(frames.every(frame => frame.state === "active")).toBe(true);
    if (name === "microphone") {
      expect(frames[0].paths).toHaveLength(9);
      const lanes = frames.map(frame => frame.paths.slice(4).map(path => (path.d!.match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)/g) || []).map(Number)));
      for (const frame of lanes) frame.forEach((values, index) => {
        expect(values[0]).toBe(lanes[0][index][0]);
        expect(values[2]).toBe(values[0]);
        expect((values[1] + values[3]) / 2).toBeCloseTo(12, 3);
      });
      for (let index = 0; index < 5; index++) expect(new Set(lanes.map(frame => frame[index][3] - frame[index][1])).size).toBeGreaterThan(3);
    } else {
      expect(frames[0].paths).toHaveLength(4);
      expect(frames.every(frame => frame.paths[0].opacity === 0)).toBe(true);
      for (let index = 1; index <= 3; index++) {
        expect(new Set(frames.map(frame => frame.paths[index].d)).size).toBe(1);
        expect(new Set(frames.map(frame => frame.paths[index].transform)).size).toBeGreaterThan(1);
      }
    }
    records.push({ name, frames });
    await page.getByRole("button", { name: "Resume previews" }).click();
    await selected.hover();
    await page.getByRole("button", { name: "Pause previews" }).click();
    const snapshot = () => selected.locator("svg").evaluate(svg => svg.innerHTML);
    const paused = await snapshot();
    await page.waitForTimeout(350);
    expect(await snapshot()).toBe(paused);
    await page.getByRole("button", { name: "Resume previews" }).click();
    await selected.hover();
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.waitForTimeout(50);
    const quiet = await snapshot();
    await page.waitForTimeout(350);
    expect(await snapshot()).toBe(quiet);
    await page.emulateMedia({ reducedMotion: "no-preference" });
  }
  await writeFile(pathFor("activity-motion.json"), JSON.stringify(records, null, 2));
  const sheet = await page.context().newPage();
  await sheet.setViewportSize({ width: 1080, height: 460 });
  await sheet.setContent(`<html><head><style>body{margin:0;padding:24px;color:#171717;background:#f7f7f7;font:12px Arial,sans-serif}section{margin:0 0 24px}h2{font-size:14px}.frames{display:grid;grid-template-columns:repeat(8,1fr);gap:10px}.frame{display:flex;flex-direction:column;align-items:center;gap:10px;background:white;padding:10px}p{margin:0;color:#666}svg{color:#171717}</style></head><body>${records.map(record => `<section><h2>${record.name}: held active state</h2><div class="frames">${record.frames.map(frame => `<div class="frame">${frame.svg}<p>${frame.elapsed}ms</p></div>`).join("")}</div></section>`).join("")}</body></html>`);
  await sheet.screenshot({ path: pathFor("activity-motion.png"), fullPage: true });
  await sheet.close();
});
